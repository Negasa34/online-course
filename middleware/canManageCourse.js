
const mongoose = require("mongoose");
const Course = require("../models/courses");

function canManageCourse(parameter = "id", response, next) {
  if (parameter && typeof parameter === "object" && response && next) {
    return verifyCoursePermission(parameter, response, next, "id");
  }
  return (req, res, next) => verifyCoursePermission(req, res, next, parameter);
}

async function verifyCoursePermission(req, res, next, parameter) {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    const id = req.params[parameter];

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Admin course hunda bulchuu danda'a.
    if (req.user.role === "ADMIN") {
      req.course = course;
      return next();
    }

    // Instructor course isa ta'e qofa bulchuu danda'a.
    if (
      req.user.role === "INSTRUCTOR" &&
      course.instructor &&
      course.instructor.toString() === req.user.id
    ) {
      req.course = course;
      return next();
    }

    return res.status(403).json({
      success: false,
      message: "You can manage only your own courses",
    });
  } catch (error) {
    console.error("Course permission error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify course permissions",
    });
  }
}

module.exports = canManageCourse;
