const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const Course = require("../models/courses");
const Enrollment = require("../models/enrollment");

const router = express.Router();

router.post("/:courseId", authMiddleware, async (req, res) => {
  const { courseId } = req.params;

  if (!mongoose.isValidObjectId(courseId)) {
    return res.status(400).json({
      success: false,
      message: "Invalid course ID",
    });
  }

  try {
    const course = await Course.findById(courseId);
    if (!course || !course.published) {
      return res.status(404).json({
        success: false,
        message: "Published course not found",
      });
    }

    const existingEnrollment = await Enrollment.findOne({
      user: req.user.id,
      course: courseId,
    });
    if (existingEnrollment) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    const enrollment = await Enrollment.create({
      user: req.user.id,
      course: courseId,
    });

    return res.status(201).json({
      success: true,
      message: "You are enrolled successfully",
      data: enrollment,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "You are already enrolled in this course",
      });
    }

    console.error("Create enrollment error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not enroll in this course",
    });
  }
});

router.get("/my-courses", authMiddleware, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ user: req.user.id })
      .populate("course")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enrollments.filter((enrollment) => enrollment.course).length,
      data: enrollments.filter((enrollment) => enrollment.course),
    });
  } catch (error) {
    console.error("Get enrollments error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Could not fetch your courses",
    });
  }
});

module.exports = router;
