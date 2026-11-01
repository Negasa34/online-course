const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { after, before, test } = require("node:test");

process.env.JWT_SECRET = "curriculum-test-secret-with-at-least-32-characters";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { app } = require("../server");
const User = require("../models/user");
const Course = require("../models/courses");
const Enrollment = require("../models/enrollment");
const CourseSection = require("../models/courseSection");
const LessonProgress = require("../models/lessonProgress");

const users = new Map();
const courses = new Map();
const enrollments = new Map();
const sections = new Map();
const progress = new Map();
let nextId = 1;
let httpServer;
let baseUrl;

function newId() {
  return (nextId++).toString(16).padStart(24, "0");
}

function makeUser(role, email) {
  const user = {
    _id: newId(),
    name: role,
    email,
    role,
    instructorApprovedAt: role === "INSTRUCTOR" ? new Date() : null,
    accountStatus: "ACTIVE",
  };
  users.set(user._id, user);
  return user;
}

function makeCourse(instructor, title) {
  const course = {
    _id: newId(),
    title,
    description: `${title} description`,
    instructor: instructor._id,
    published: true,
  };
  courses.set(course._id, course);
  return course;
}

function makeLesson(data) {
  return {
    _id: newId(),
    ...data,
    toObject() { return { ...this }; },
    deleteOne() {
      const owner = [...sections.values()].find((section) => section.lessons.includes(this));
      if (owner) owner.lessons = owner.lessons.filter((lesson) => lesson !== this);
    },
  };
}

function makeSection(data) {
  const section = {
    _id: data._id || newId(),
    ...data,
    lessons: data.lessons || [],
    toObject() {
      return {
        ...this,
        lessons: this.lessons.map((lesson) => lesson.toObject()),
      };
    },
    async save() {
      sections.set(this._id, this);
      return this;
    },
    async deleteOne() {
      sections.delete(this._id);
    },
  };
  section.lessons = section.lessons.map((lesson) => makeLesson(lesson));
  section.lessons.push = (...lessons) => Array.prototype.push.apply(
    section.lessons,
    lessons.map((lesson) => makeLesson(lesson))
  );
  section.lessons.id = (id) => section.lessons.find((lesson) => lesson._id === String(id)) || null;
  sections.set(section._id, section);
  return section;
}

function query(items) {
  let results = items;
  return {
    sort(fields = {}) {
      const [field, direction] = Object.entries(fields)[0] || [];
      if (field) {
        results = [...results].sort((left, right) =>
          (left[field] < right[field] ? -1 : left[field] > right[field] ? 1 : 0) * direction
        );
      }
      return this;
    },
    populate() { return this; },
    then(resolve, reject) { return Promise.resolve(results).then(resolve, reject); },
  };
}

function tokenFor(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  return { response, body: await response.json() };
}

function jsonOptions(method, body, token) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  };
}

before(async () => {
  User.findById = (id) => {
    const result = Promise.resolve(users.get(String(id)) || null);
    result.select = () => result;
    return result;
  };
  Course.findById = async (id) => courses.get(String(id)) || null;
  Enrollment.findOne = async (filter) => (
    [...enrollments.values()].find((item) =>
      item.user === String(filter.user) && item.course === String(filter.course)
    ) || null
  );
  Enrollment.find = (filter) => query([...enrollments.values()]
    .filter((item) => item.user === String(filter.user))
    .map((item) => ({ ...item, course: courses.get(item.course) || null })));

  CourseSection.find = (filter) => query([...sections.values()]
    .filter((section) => section.course === String(filter.course)));
  CourseSection.findOne = async (filter) => [...sections.values()].find((section) =>
    section._id === String(filter._id) &&
    section.course === String(filter.course)
  ) || null;
  CourseSection.create = async (data) => makeSection(data);
  CourseSection.deleteMany = async (filter) => {
    for (const [id, section] of sections) {
      if (section.course === String(filter.course)) sections.delete(id);
    }
  };

  LessonProgress.find = (filter) => query([...progress.values()].filter((item) =>
    (!filter.user || item.user === String(filter.user)) &&
    (!filter.course || item.course === String(filter.course))
  ));
  LessonProgress.findOneAndUpdate = async (filter, update) => {
    const key = `${filter.user}:${filter.course}:${filter.lesson}`;
    const record = progress.get(key) || {
      _id: newId(),
      user: String(filter.user),
      course: String(filter.course),
      lesson: String(filter.lesson),
      completed: false,
    };
    Object.assign(record, update.$set, update.$setOnInsert);
    progress.set(key, record);
    return record;
  };
  LessonProgress.deleteMany = async (filter) => {
    for (const [key, record] of progress) {
      if (
        (!filter.course || record.course === String(filter.course)) &&
        (!filter.section || String(record.section) === String(filter.section)) &&
        (!filter.lesson || record.lesson === String(filter.lesson))
      ) progress.delete(key);
    }
  };

  await new Promise((resolve) => {
    httpServer = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("curriculum permissions, previews, ordering, videos, and learning progress", async () => {
  const instructor = makeUser("INSTRUCTOR", "owner@example.test");
  const otherInstructor = makeUser("INSTRUCTOR", "other@example.test");
  const student = makeUser("STUDENT", "student@example.test");
  const nonEnrolledStudent = makeUser("STUDENT", "visitor@example.test");
  const admin = makeUser("ADMIN", "admin@example.test");
  const course = makeCourse(instructor, "Backend testing");
  const otherCourse = makeCourse(otherInstructor, "Other course");
  const studentToken = tokenFor(student);
  const instructorToken = tokenFor(instructor);
  const otherInstructorToken = tokenFor(otherInstructor);
  const adminToken = tokenFor(admin);

  assert.equal(
    (await request(`/api/curriculum/courses/${course._id}/sections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Not authenticated" }),
    })).response.status,
    401
  );
  assert.equal(
    (await request(`/api/curriculum/courses/${course._id}/sections`, jsonOptions("POST", { title: "Not allowed" }, studentToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/curriculum/courses/${course._id}/sections`, jsonOptions("POST", { title: "Not owned" }, otherInstructorToken))).response.status,
    403
  );
  assert.equal(
    (await request("/api/curriculum/courses/not-an-id/sections", jsonOptions("POST", { title: "Invalid" }, instructorToken))).response.status,
    400
  );

  const sectionResponse = await request(
    `/api/curriculum/courses/${course._id}/sections`,
    jsonOptions("POST", { title: "Getting started", description: "Start here" }, instructorToken)
  );
  assert.equal(sectionResponse.response.status, 201);
  const section = sectionResponse.body.data;
  const secondSectionResponse = await request(
    `/api/curriculum/courses/${course._id}/sections`,
    jsonOptions("POST", { title: "Advanced topics" }, instructorToken)
  );
  assert.equal(secondSectionResponse.body.data.order, 1);
  const secondSection = secondSectionResponse.body.data;
  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}`,
      jsonOptions("PATCH", { title: "Course introduction" }, instructorToken)
    )).response.status,
    200
  );
  assert.equal(
    (await request(
      `/api/curriculum/courses/${otherCourse._id}/sections`,
      jsonOptions("POST", { title: "Administrator managed" }, adminToken)
    )).response.status,
    201
  );

  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/reorder`,
      jsonOptions("PATCH", { sectionIds: [secondSection._id, section._id] }, instructorToken)
    )).response.status,
    200
  );
  const orderedSections = await request(`/api/curriculum/courses/${course._id}/sections`, {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  assert.equal(orderedSections.body.data[0]._id, secondSection._id);

  const previewResponse = await request(
    `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons`,
    jsonOptions("POST", {
      title: "Free preview",
      description: "An introductory lesson",
      duration: 4,
      isPreview: true,
      resources: [{ title: "Notes", url: "https://learnhub.example/notes.pdf" }],
    }, instructorToken)
  );
  assert.equal(previewResponse.response.status, 201);
  const previewLesson = previewResponse.body.data;
  const paidResponse = await request(
    `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons`,
    jsonOptions("POST", {
      title: "Paid lesson",
      description: "For enrolled students",
      duration: 9,
      resources: [],
    }, instructorToken)
  );
  assert.equal(paidResponse.response.status, 201);
  const paidLesson = paidResponse.body.data;
  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/${paidLesson._id}`,
      jsonOptions("PATCH", { description: "Updated lesson details" }, instructorToken)
    )).response.status,
    200
  );
  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/reorder`,
      jsonOptions("PATCH", { lessonIds: [paidLesson._id, previewLesson._id] }, instructorToken)
    )).response.status,
    200
  );
  const sectionLessons = await request(
    `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons`,
    { headers: { Authorization: `Bearer ${instructorToken}` } }
  );
  assert.equal(sectionLessons.body.count, 2);
  assert.equal(sectionLessons.body.data[0]._id, paidLesson._id);

  const invalidResource = await request(
    `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons`,
    jsonOptions("POST", {
      title: "Unsafe resource",
      resources: [{ title: "Bad link", url: "http://example.test/file.pdf" }],
    }, instructorToken)
  );
  assert.equal(invalidResource.response.status, 400);

  const publicLearning = await request(`/api/curriculum/courses/${course._id}/learning`);
  assert.equal(publicLearning.response.status, 200);
  const publicLessons = publicLearning.body.data.sections[1].lessons;
  const publicPreview = publicLessons.find((lesson) => lesson._id === previewLesson._id);
  const publicPaidLesson = publicLessons.find((lesson) => lesson._id === paidLesson._id);
  assert.equal(publicLessons[0]._id, paidLesson._id);
  assert.equal(publicPreview.locked, false);
  assert.equal(publicPreview.description, "An introductory lesson");
  assert.equal(publicPaidLesson.locked, true);
  assert.equal(publicPaidLesson.description, "");
  const unentitledCompletion = await request(
    `/api/curriculum/courses/${course._id}/lessons/${paidLesson._id}/complete`,
    jsonOptions("POST", {}, tokenFor(nonEnrolledStudent))
  );
  assert.equal(unentitledCompletion.response.status, 403);

  enrollments.set(`${student._id}:${course._id}`, {
    _id: newId(),
    user: student._id,
    course: course._id,
  });
  const enrolledLearning = await request(`/api/curriculum/courses/${course._id}/learning`, {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(enrolledLearning.body.data.sections[1].lessons[1].locked, false);

  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/lessons/${paidLesson._id}/complete`,
      jsonOptions("POST", {}, studentToken)
    )).response.status,
    200
  );
  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/lessons/${paidLesson._id}/complete`,
      jsonOptions("POST", {}, studentToken)
    )).response.status,
    200
  );
  assert.equal(progress.size, 1);

  const viewedLesson = await request(
    `/api/curriculum/courses/${course._id}/lessons/${previewLesson._id}/view`,
    jsonOptions("POST", {}, studentToken)
  );
  assert.equal(viewedLesson.response.status, 200);
  const summary = await request("/api/curriculum/my-progress", {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(summary.response.status, 200);
  assert.equal(summary.body.data[0].completedLessons, 1);
  assert.equal(summary.body.data[0].totalLessons, 2);
  assert.equal(summary.body.data[0].percentage, 50);
  assert.equal(summary.body.data[0].lastLessonId, previewLesson._id);

  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/${paidLesson._id}`,
      jsonOptions("PATCH", { title: "Unauthorized edit" }, studentToken)
    )).response.status,
    403
  );
  assert.equal(
    (await request(
      `/api/curriculum/courses/${otherCourse._id}/sections`,
      jsonOptions("POST", { title: "Not owned" }, instructorToken)
    )).response.status,
    403
  );

  const invalidVideo = new FormData();
  invalidVideo.append("video", new Blob(["not a video"], { type: "video/mp4" }), "lesson.mp4");
  const invalidUpload = await fetch(
    `${baseUrl}/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/${paidLesson._id}/video`,
    { method: "POST", headers: { Authorization: `Bearer ${instructorToken}` }, body: invalidVideo }
  );
  assert.equal(invalidUpload.status, 400);
  assert.match((await invalidUpload.json()).message, /valid MP4/);

  const previousStorageConfig = {
    cloud: process.env.CLOUDINARY_CLOUD_NAME,
    key: process.env.CLOUDINARY_API_KEY,
    secret: process.env.CLOUDINARY_API_SECRET,
  };
  delete process.env.CLOUDINARY_CLOUD_NAME;
  delete process.env.CLOUDINARY_API_KEY;
  delete process.env.CLOUDINARY_API_SECRET;
  const validHeader = new FormData();
  validHeader.append("video", new Blob([Buffer.from("0000ftypisom0000")], { type: "video/mp4" }), "lesson.mp4");
  const missingStorage = await fetch(
    `${baseUrl}/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/${paidLesson._id}/video`,
    { method: "POST", headers: { Authorization: `Bearer ${instructorToken}` }, body: validHeader }
  );
  assert.equal(missingStorage.status, 503);
  assert.match((await missingStorage.json()).message, /not configured/);
  if (previousStorageConfig.cloud) process.env.CLOUDINARY_CLOUD_NAME = previousStorageConfig.cloud;
  if (previousStorageConfig.key) process.env.CLOUDINARY_API_KEY = previousStorageConfig.key;
  if (previousStorageConfig.secret) process.env.CLOUDINARY_API_SECRET = previousStorageConfig.secret;

  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}/lessons/${previewLesson._id}`,
      jsonOptions("DELETE", {}, instructorToken)
    )).response.status,
    200
  );
  assert.equal(progress.size, 1);
  assert.equal(
    (await request(
      `/api/curriculum/courses/${course._id}/sections/${section._id}`,
      jsonOptions("DELETE", {}, instructorToken)
    )).response.status,
    200
  );
  assert.equal(sections.has(section._id), false);
});
