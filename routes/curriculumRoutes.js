const fs = require("node:fs/promises");
const path = require("node:path");
const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const canManageCourse = require("../middleware/canManageCourse");
const { handleVideoUploadError, uploadVideoFile } = require("../middleware/videoUpload");
const Course = require("../models/courses");
const CourseSection = require("../models/courseSection");
const Enrollment = require("../models/enrollment");
const LessonProgress = require("../models/lessonProgress");
const {
  deleteVideo,
  getVideoDeliveryUrl,
  uploadVideo,
} = require("../services/cloudinaryStorage");

const router = express.Router();
const manageCourse = [
  authMiddleware,
  authorizeRoles("INSTRUCTOR", "ADMIN"),
  canManageCourse("courseId"),
];

function isObjectBody(body, allowedFields) {
  return body !== null &&
    typeof body === "object" &&
    !Array.isArray(body) &&
    Object.keys(body).length > 0 &&
    Object.keys(body).every((key) => allowedFields.includes(key));
}

function validText(value, maximum) {
  return typeof value === "string" && value.trim().length > 0 && value.trim().length <= maximum;
}

function validHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validResources(resources) {
  return Array.isArray(resources) &&
    resources.length <= 20 &&
    resources.every((resource) =>
      resource &&
      typeof resource === "object" &&
      !Array.isArray(resource) &&
      validText(resource.title, 120) &&
      typeof resource.url === "string" &&
      resource.url.length <= 2048 &&
      validHttpsUrl(resource.url.trim())
    );
}

function findLesson(courseId, lessonId) {
  return CourseSection.find({ course: courseId }).then((sections) => {
    for (const section of sections) {
      const lesson = section.lessons.id(lessonId);
      if (lesson) return { section, lesson };
    }
    return null;
  });
}

function isCourseManager(user, course) {
  return user?.role === "ADMIN" ||
    (user?.role === "INSTRUCTOR" &&
      Boolean(user.instructorApprovedAt) &&
      String(course.instructor) === user.id);
}

function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
}

function sendError(res, error, message) {
  if (error.status) {
    return res.status(error.status).json({ success: false, message: error.message });
  }
  console.error(`${message}:`, error.message);
  return res.status(500).json({ success: false, message });
}

async function serializeSections(sections, { enrolled, manager, progress = [] }) {
  const completedLessons = new Set(
    progress.filter((record) => record.completed).map((record) => String(record.lesson))
  );
  return Promise.all(sections.map(async (section) => {
    const data = section.toObject();
    const lessons = [...section.lessons].sort((left, right) => left.order - right.order);
    data.lessons = await Promise.all(lessons.map(async (lesson) => {
      const lessonData = lesson.toObject();
      const unlocked = manager || enrolled || lesson.isPreview;
      lessonData.locked = !unlocked;
      lessonData.completed = completedLessons.has(String(lesson._id));
      if (!unlocked) {
        lessonData.description = "";
        lessonData.resources = [];
        lessonData.video = null;
      } else if (lesson.video) {
        lessonData.video = {
          ...lesson.video.toObject(),
          url: getVideoDeliveryUrl(lesson.video),
        };
      }
      if (lessonData.video) delete lessonData.video.publicId;
      return lessonData;
    }));
    return data;
  }));
}

function validObjectId(id) {
  return mongoose.isValidObjectId(id);
}

router.get("/my-progress", authMiddleware, authorizeRoles("STUDENT"), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id }).populate("course");
    const progress = await LessonProgress.find({ user: req.user.id });
    const progressByCourse = new Map();
    for (const record of progress) {
      const key = String(record.course);
      if (!progressByCourse.has(key)) progressByCourse.set(key, []);
      progressByCourse.get(key).push(record);
    }

    const data = await Promise.all(enrollments
      .filter((enrollment) => enrollment.course)
      .map(async (enrollment) => {
        const course = enrollment.course;
        const sections = await CourseSection.find({ course: course._id }).sort({ order: 1 });
        const lessons = sections.flatMap((section) => section.lessons);
        const records = progressByCourse.get(String(course._id)) || [];
        const lessonIds = new Set(lessons.map((lesson) => String(lesson._id)));
        const completedLessons = new Set(records
          .filter((record) => record.completed && lessonIds.has(String(record.lesson)))
          .map((record) => String(record.lesson))).size;
        const lastViewed = records
          .filter((record) => lessonIds.has(String(record.lesson)))
          .sort((left, right) => new Date(right.lastViewedAt) - new Date(left.lastViewedAt))[0];

        return {
          course,
          courseId: String(course._id),
          totalLessons: lessons.length,
          completedLessons,
          percentage: lessons.length ? Math.round((completedLessons / lessons.length) * 100) : 0,
          lastLessonId: lastViewed ? String(lastViewed.lesson) : null,
        };
      }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error, "Could not fetch learning progress");
  }
});

router.get("/courses/:courseId/sections", ...manageCourse, async (req, res) => {
  try {
    const sections = await CourseSection.find({ course: req.course._id }).sort({ order: 1 });
    const data = await serializeSections(sections, { manager: true });
    return res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    return sendError(res, error, "Could not fetch course curriculum");
  }
});

router.post("/courses/:courseId/sections", ...manageCourse, async (req, res) => {
  if (
    !isObjectBody(req.body, ["title", "description"]) ||
    !validText(req.body.title, 120) ||
    (req.body.description !== undefined &&
      (typeof req.body.description !== "string" || req.body.description.trim().length > 1000))
  ) {
    return res.status(400).json({ success: false, message: "Provide a section title and a valid description" });
  }

  try {
    const sections = await CourseSection.find({ course: req.course._id });
    const section = await CourseSection.create({
      course: req.course._id,
      title: req.body.title.trim(),
      description: (req.body.description || "").trim(),
      order: sections.length,
    });
    return res.status(201).json({ success: true, message: "Section created", data: section });
  } catch (error) {
    return sendError(res, error, "Could not create section");
  }
});

router.patch("/courses/:courseId/sections/reorder", ...manageCourse, async (req, res) => {
  const { sectionIds } = req.body || {};
  if (
    !Array.isArray(sectionIds) ||
    sectionIds.some((id) => !validObjectId(id)) ||
    new Set(sectionIds.map(String)).size !== sectionIds.length
  ) {
    return res.status(400).json({ success: false, message: "Provide each section ID once in the requested order" });
  }

  try {
    const sections = await CourseSection.find({ course: req.course._id });
    if (
      sections.length !== sectionIds.length ||
      sections.some((section) => !sectionIds.includes(String(section._id)))
    ) {
      return res.status(400).json({ success: false, message: "The section list must match this course's sections" });
    }
    const byId = new Map(sections.map((section) => [String(section._id), section]));
    await Promise.all(sectionIds.map((id, order) => {
      const section = byId.get(String(id));
      section.order = order;
      return section.save();
    }));
    return res.status(200).json({ success: true, message: "Sections reordered" });
  } catch (error) {
    return sendError(res, error, "Could not reorder sections");
  }
});

router.get(
  "/courses/:courseId/sections/:sectionId/lessons",
  ...manageCourse,
  async (req, res) => {
    if (!validObjectId(req.params.sectionId)) {
      return res.status(400).json({ success: false, message: "Invalid section ID" });
    }
    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      const [data] = await serializeSections([section], { manager: true });
      return res.status(200).json({ success: true, count: data.lessons.length, data: data.lessons });
    } catch (error) {
      return sendError(res, error, "Could not fetch section lessons");
    }
  }
);

router.patch("/courses/:courseId/sections/:sectionId", ...manageCourse, async (req, res) => {
  if (
    !validObjectId(req.params.sectionId) ||
    !isObjectBody(req.body, ["title", "description"]) ||
    (Object.hasOwn(req.body, "title") && !validText(req.body.title, 120)) ||
    (Object.hasOwn(req.body, "description") &&
      (typeof req.body.description !== "string" || req.body.description.trim().length > 1000))
  ) {
    return res.status(400).json({ success: false, message: "Provide valid section fields" });
  }

  try {
    const section = await CourseSection.findOne({
      _id: req.params.sectionId,
      course: req.course._id,
    });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    if (Object.hasOwn(req.body, "title")) section.title = req.body.title.trim();
    if (Object.hasOwn(req.body, "description")) section.description = req.body.description.trim();
    await section.save();
    return res.status(200).json({ success: true, message: "Section updated", data: section });
  } catch (error) {
    return sendError(res, error, "Could not update section");
  }
});

router.delete("/courses/:courseId/sections/:sectionId", ...manageCourse, async (req, res) => {
  if (!validObjectId(req.params.sectionId)) {
    return res.status(400).json({ success: false, message: "Invalid section ID" });
  }
  try {
    const section = await CourseSection.findOne({
      _id: req.params.sectionId,
      course: req.course._id,
    });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    const videos = section.lessons.map((lesson) => lesson.video?.publicId).filter(Boolean);
    await Promise.all(videos.map(deleteVideo));
    await LessonProgress.deleteMany({ section: section._id });
    await section.deleteOne();
    return res.status(200).json({ success: true, message: "Section deleted" });
  } catch (error) {
    return sendError(res, error, "Could not delete section");
  }
});

router.post(
  "/courses/:courseId/sections/:sectionId/lessons",
  ...manageCourse,
  async (req, res) => {
    if (
      !validObjectId(req.params.sectionId) ||
      !isObjectBody(req.body, ["title", "description", "duration", "isPreview", "resources"]) ||
      !validText(req.body.title, 160) ||
      (req.body.description !== undefined &&
        (typeof req.body.description !== "string" || req.body.description.trim().length > 3000)) ||
      (req.body.duration !== undefined &&
        (typeof req.body.duration !== "number" || !Number.isFinite(req.body.duration) || req.body.duration < 0 || req.body.duration > 10000)) ||
      (req.body.isPreview !== undefined && typeof req.body.isPreview !== "boolean") ||
      (req.body.resources !== undefined && !validResources(req.body.resources))
    ) {
      return res.status(400).json({ success: false, message: "Provide valid lesson details and HTTPS resources" });
    }

    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      section.lessons.push({
        title: req.body.title.trim(),
        description: (req.body.description || "").trim(),
        duration: req.body.duration ?? 0,
        isPreview: req.body.isPreview ?? false,
        resources: (req.body.resources || []).map((resource) => ({
          title: resource.title.trim(),
          url: resource.url.trim(),
        })),
        order: section.lessons.length,
      });
      await section.save();
      return res.status(201).json({
        success: true,
        message: "Lesson created",
        data: section.lessons[section.lessons.length - 1],
      });
    } catch (error) {
      return sendError(res, error, "Could not create lesson");
    }
  }
);

router.patch(
  "/courses/:courseId/sections/:sectionId/lessons/reorder",
  ...manageCourse,
  async (req, res) => {
    const { lessonIds } = req.body || {};
    if (
      !validObjectId(req.params.sectionId) ||
      !Array.isArray(lessonIds) ||
      lessonIds.some((id) => !validObjectId(id)) ||
      new Set(lessonIds.map(String)).size !== lessonIds.length
    ) {
      return res.status(400).json({ success: false, message: "Provide each lesson ID once in the requested order" });
    }

    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      if (
        section.lessons.length !== lessonIds.length ||
        section.lessons.some((lesson) => !lessonIds.includes(String(lesson._id)))
      ) {
        return res.status(400).json({ success: false, message: "The lesson list must match this section's lessons" });
      }
      const byId = new Map(section.lessons.map((lesson) => [String(lesson._id), lesson]));
      lessonIds.forEach((id, order) => { byId.get(String(id)).order = order; });
      await section.save();
      return res.status(200).json({ success: true, message: "Lessons reordered" });
    } catch (error) {
      return sendError(res, error, "Could not reorder lessons");
    }
  }
);

router.patch(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId",
  ...manageCourse,
  async (req, res) => {
    const fields = ["title", "description", "duration", "isPreview", "resources"];
    if (
      !validObjectId(req.params.sectionId) ||
      !validObjectId(req.params.lessonId) ||
      !isObjectBody(req.body, fields) ||
      (Object.hasOwn(req.body, "title") && !validText(req.body.title, 160)) ||
      (Object.hasOwn(req.body, "description") &&
        (typeof req.body.description !== "string" || req.body.description.trim().length > 3000)) ||
      (Object.hasOwn(req.body, "duration") &&
        (typeof req.body.duration !== "number" || !Number.isFinite(req.body.duration) || req.body.duration < 0 || req.body.duration > 10000)) ||
      (Object.hasOwn(req.body, "isPreview") && typeof req.body.isPreview !== "boolean") ||
      (Object.hasOwn(req.body, "resources") && !validResources(req.body.resources))
    ) {
      return res.status(400).json({ success: false, message: "Provide valid lesson fields and HTTPS resources" });
    }

    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      const lesson = section.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
      if (Object.hasOwn(req.body, "title")) lesson.title = req.body.title.trim();
      if (Object.hasOwn(req.body, "description")) lesson.description = req.body.description.trim();
      if (Object.hasOwn(req.body, "duration")) lesson.duration = req.body.duration;
      if (Object.hasOwn(req.body, "isPreview")) lesson.isPreview = req.body.isPreview;
      if (Object.hasOwn(req.body, "resources")) {
        lesson.resources = req.body.resources.map((resource) => ({
          title: resource.title.trim(),
          url: resource.url.trim(),
        }));
      }
      await section.save();
      return res.status(200).json({ success: true, message: "Lesson updated", data: lesson });
    } catch (error) {
      return sendError(res, error, "Could not update lesson");
    }
  }
);

router.delete(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId",
  ...manageCourse,
  async (req, res) => {
    if (!validObjectId(req.params.sectionId) || !validObjectId(req.params.lessonId)) {
      return res.status(400).json({ success: false, message: "Invalid section or lesson ID" });
    }
    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      const lesson = section.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
      if (lesson.video?.publicId) await deleteVideo(lesson.video.publicId);
      await LessonProgress.deleteMany({ course: req.course._id, lesson: lesson._id });
      lesson.deleteOne();
      section.lessons.forEach((item, order) => { item.order = order; });
      await section.save();
      return res.status(200).json({ success: true, message: "Lesson deleted" });
    } catch (error) {
      return sendError(res, error, "Could not delete lesson");
    }
  }
);

async function validateVideoSignature(file) {
  const extension = path.extname(file.originalname).toLowerCase();
  const handle = await fs.open(file.path, "r");
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await handle.read(header, 0, header.length, 0);
    if (extension === ".webm") {
      return bytesRead >= 4 &&
        header[0] === 0x1a &&
        header[1] === 0x45 &&
        header[2] === 0xdf &&
        header[3] === 0xa3;
    }
    return bytesRead >= 8 && header.toString("ascii", 4, 8) === "ftyp";
  } finally {
    await handle.close();
  }
}

async function removeTemporaryFile(filePath) {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
}

async function uploadLessonVideo(req, res) {
  const file = req.file;
  if (!file) return res.status(400).json({ success: false, message: "Select a video to upload" });
  let uploaded;
  let persisted = false;
  try {
    if (!(await validateVideoSignature(file))) {
      return res.status(400).json({ success: false, message: "The uploaded file is not a valid MP4, MOV, or WebM video" });
    }
    const section = await CourseSection.findOne({
      _id: req.params.sectionId,
      course: req.course._id,
    });
    if (!section) return res.status(404).json({ success: false, message: "Section not found" });
    const lesson = section.lessons.id(req.params.lessonId);
    if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });

    const previousVideo = lesson.video;
    uploaded = await uploadVideo(file.path);
    lesson.video = uploaded;
    await section.save();
    persisted = true;
    let message = previousVideo ? "Video replaced successfully" : "Video uploaded successfully";
    if (previousVideo?.publicId) {
      try {
        await deleteVideo(previousVideo.publicId);
      } catch (cleanupError) {
        console.error("Remove replaced lesson video error:", cleanupError.message);
        message = "Video replaced successfully, but the previous video could not be removed";
      }
    }
    return res.status(200).json({
      success: true,
      message,
      data: { ...uploaded, url: getVideoDeliveryUrl(uploaded), publicId: undefined },
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({ success: false, message: error.message });
    }
    if (uploaded?.publicId && !persisted) {
      try {
        await deleteVideo(uploaded.publicId);
      } catch (cleanupError) {
        console.error("Remove uncommitted lesson video error:", cleanupError.message);
      }
    }
    console.error("Upload lesson video error:", error.message);
    return res.status(502).json({ success: false, message: "Could not upload lesson video" });
  } finally {
    try {
      await removeTemporaryFile(file.path);
    } catch (error) {
      console.error("Remove temporary video error:", error.message);
    }
  }
}

const videoUpload = [
  uploadVideoFile.single("video"),
  handleVideoUploadError,
  uploadLessonVideo,
];

router.post(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId/video",
  ...manageCourse,
  ...videoUpload
);
router.put(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId/video",
  ...manageCourse,
  ...videoUpload
);
router.delete(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId/video",
  ...manageCourse,
  async (req, res) => {
    if (!validObjectId(req.params.sectionId) || !validObjectId(req.params.lessonId)) {
      return res.status(400).json({ success: false, message: "Invalid section or lesson ID" });
    }
    try {
      const section = await CourseSection.findOne({
        _id: req.params.sectionId,
        course: req.course._id,
      });
      if (!section) return res.status(404).json({ success: false, message: "Section not found" });
      const lesson = section.lessons.id(req.params.lessonId);
      if (!lesson) return res.status(404).json({ success: false, message: "Lesson not found" });
      if (!lesson.video) return res.status(404).json({ success: false, message: "Lesson has no video" });
      await deleteVideo(lesson.video.publicId);
      lesson.video = null;
      await section.save();
      return res.status(200).json({ success: true, message: "Video deleted" });
    } catch (error) {
      return sendError(res, error, "Could not delete lesson video");
    }
  }
);

router.get("/courses/:courseId/learning", optionalAuth, async (req, res) => {
  const { courseId } = req.params;
  if (!validObjectId(courseId)) {
    return res.status(400).json({ success: false, message: "Invalid course ID" });
  }
  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ success: false, message: "Course not found" });
    const manager = isCourseManager(req.user, course);
    const enrolled = Boolean(req.user && await Enrollment.findOne({
      user: req.user.id,
      course: course._id,
    }));
    if (!course.published && !manager && !enrolled) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    const sections = await CourseSection.find({ course: course._id }).sort({ order: 1 });
    const progress = req.user && enrolled
      ? await LessonProgress.find({ user: req.user.id, course: course._id })
      : [];
    const data = await serializeSections(sections, { enrolled, manager, progress });
    const allLessons = sections.flatMap((section) => section.lessons);
    const validLessonIds = new Set(allLessons.map((lesson) => String(lesson._id)));
    const completed = new Set(progress
      .filter((record) => record.completed && validLessonIds.has(String(record.lesson)))
      .map((record) => String(record.lesson))).size;
    const lastViewed = progress
      .filter((record) => validLessonIds.has(String(record.lesson)))
      .sort((left, right) => new Date(right.lastViewedAt) - new Date(left.lastViewedAt))[0];
    return res.status(200).json({
      success: true,
      data: {
        course: { _id: course._id, title: course.title, description: course.description },
        enrolled,
        sections: data,
        progress: {
          completedLessons: completed,
          totalLessons: allLessons.length,
          percentage: allLessons.length ? Math.round((completed / allLessons.length) * 100) : 0,
          lastLessonId: lastViewed ? String(lastViewed.lesson) : null,
        },
      },
    });
  } catch (error) {
    return sendError(res, error, "Could not fetch course learning content");
  }
});

async function authorizedStudentLesson(req, res) {
  if (!validObjectId(req.params.courseId) || !validObjectId(req.params.lessonId)) {
    res.status(400).json({ success: false, message: "Invalid course or lesson ID" });
    return null;
  }
  const course = await Course.findById(req.params.courseId);
  if (!course) {
    res.status(404).json({ success: false, message: "Published course not found" });
    return null;
  }
  const enrollment = await Enrollment.findOne({
    user: req.user.id,
    course: course._id,
  });
  if (!enrollment) {
    res.status(403).json({ success: false, message: "Enroll in this course to track lesson progress" });
    return null;
  }
  const found = await findLesson(course._id, req.params.lessonId);
  if (!found) {
    res.status(404).json({ success: false, message: "Lesson not found" });
    return null;
  }
  return { course, ...found };
}

router.post(
  "/courses/:courseId/lessons/:lessonId/view",
  authMiddleware,
  authorizeRoles("STUDENT"),
  async (req, res) => {
    try {
      const found = await authorizedStudentLesson(req, res);
      if (!found) return;
      const progress = await LessonProgress.findOneAndUpdate(
        { user: req.user.id, course: found.course._id, lesson: found.lesson._id },
        {
          $set: { section: found.section._id, lastViewedAt: new Date() },
          $setOnInsert: { completed: false },
        },
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ success: true, data: progress });
    } catch (error) {
      return sendError(res, error, "Could not save lesson progress");
    }
  }
);

router.post(
  "/courses/:courseId/lessons/:lessonId/complete",
  authMiddleware,
  authorizeRoles("STUDENT"),
  async (req, res) => {
    try {
      const found = await authorizedStudentLesson(req, res);
      if (!found) return;
      const now = new Date();
      const progress = await LessonProgress.findOneAndUpdate(
        { user: req.user.id, course: found.course._id, lesson: found.lesson._id },
        {
          $set: {
            section: found.section._id,
            completed: true,
            completedAt: now,
            lastViewedAt: now,
          },
        },
        { new: true, upsert: true, runValidators: true }
      );
      return res.status(200).json({ success: true, message: "Lesson marked complete", data: progress });
    } catch (error) {
      return sendError(res, error, "Could not complete lesson");
    }
  }
);

module.exports = router;
