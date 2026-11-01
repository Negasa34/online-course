const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const Course = require("../models/courses");
const Enrollment = require("../models/enrollment");

const router = express.Router();

router.get("/instructor", authMiddleware, authorizeRoles("INSTRUCTOR", "ADMIN"), async (req, res) => {
  try {
    const filter = req.user.role === "ADMIN" ? {} : { instructor: req.user.id };
    const courses = await Course.find(filter).sort({ createdAt: -1 });
    const courseIds = courses.map((course) => course._id);
    const enrolledStudents = courseIds.length
      ? (await Enrollment.distinct("user", { course: { $in: courseIds } })).length
      : 0;
    const enrollments = courseIds.length
      ? await Enrollment.find({ course: { $in: courseIds } })
        .populate("user", "name email")
        .populate("course", "title")
        .sort({ createdAt: -1 })
      : [];
    return res.status(200).json({
      success: true,
      data: {
        totalCourses: courses.length,
        publishedCourses: courses.filter((course) => course.published).length,
        draftCourses: courses.filter((course) => !course.published).length,
        enrolledStudents,
        courses,
        students: enrollments
          .filter((enrollment) => enrollment.user && enrollment.course)
          .map((enrollment) => ({
            id: enrollment._id,
            user: enrollment.user,
            course: enrollment.course,
            enrolledAt: enrollment.createdAt,
          })),
      },
    });
  } catch (error) {
    console.error("Get instructor dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch instructor dashboard" });
  }
});

router.get("/student", authMiddleware, authorizeRoles("STUDENT"), async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate("course")
      .sort({ createdAt: -1 });
    const validEnrollments = enrollments.filter((enrollment) => enrollment.course);
    return res.status(200).json({
      success: true,
      data: { enrolledCourses: validEnrollments, enrolledCount: validEnrollments.length },
    });
  } catch (error) {
    console.error("Get student dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch student dashboard" });
  }
});

module.exports = router;
