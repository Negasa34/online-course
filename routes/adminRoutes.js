const express = require("express");
const mongoose = require("mongoose");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const Course = require("../models/courses");
const InstructorApplication = require("../models/instructorApplication");
const User = require("../models/user");

const router = express.Router();
router.use(authMiddleware, authorizeRoles("ADMIN"));

router.get("/dashboard", async (req, res) => {
  try {
    const [
      students, instructors, pendingApplications, totalCourses,
      publishedCourses, recentUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "STUDENT" }),
      User.countDocuments({ role: "INSTRUCTOR", instructorApprovedAt: { $ne: null } }),
      InstructorApplication.countDocuments({ status: "PENDING" }),
      Course.countDocuments(),
      Course.countDocuments({ published: true }),
      User.find().select("_id name email role createdAt").sort({ createdAt: -1 }).limit(8),
    ]);
    return res.status(200).json({
      success: true,
      data: {
        students,
        instructors,
        pendingApplications,
        totalCourses,
        publishedCourses,
        unpublishedCourses: totalCourses - publishedCourses,
        recentUsers,
      },
    });
  } catch (error) {
    console.error("Get admin dashboard error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch admin dashboard" });
  }
});

router.get("/instructor-applications", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const status = req.query.status;
  if (status && !["PENDING", "APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid application status filter" });
  }
  try {
    const filter = status ? { status } : {};
    const [applications, total] = await Promise.all([
      InstructorApplication.find(filter)
        .populate("user", "name email createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      InstructorApplication.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List instructor applications error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch instructor applications" });
  }
});

router.patch("/instructor-applications/:id", async (req, res) => {
  const { id } = req.params;
  const { status, reviewNote = "" } = req.body || {};
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid application ID" });
  }
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return res.status(400).json({ success: false, message: "Status must be APPROVED or REJECTED" });
  }
  if (typeof reviewNote !== "string" || reviewNote.trim().length > 1000) {
    return res.status(400).json({ success: false, message: "Review note must be 1000 characters or fewer" });
  }
  try {
    const application = await InstructorApplication.findById(id);
    if (!application) return res.status(404).json({ success: false, message: "Instructor application not found" });
    if (application.user.toString() === req.user.id) {
      return res.status(403).json({ success: false, message: "Administrators cannot review their own application" });
    }
    if (application.status !== "PENDING") {
      return res.status(409).json({ success: false, message: "This application has already been reviewed" });
    }

    const applicant = await User.findById(application.user);
    if (!applicant) return res.status(404).json({ success: false, message: "Applicant account no longer exists" });
    if (applicant.accountStatus === "DEACTIVATED" && status === "APPROVED") {
      return res.status(409).json({ success: false, message: "A deactivated applicant cannot be approved" });
    }

    const reviewedAt = new Date();
    const reviewedApplication = await InstructorApplication.findOneAndUpdate(
      { _id: id, status: "PENDING" },
      {
        $set: {
          status,
          reviewedBy: req.user.id,
          reviewedAt,
          reviewNote: reviewNote.trim(),
        },
      },
      { new: true, runValidators: true }
    );
    if (!reviewedApplication) {
      return res.status(409).json({ success: false, message: "This application has already been reviewed" });
    }
    if (status === "APPROVED") {
      try {
        applicant.role = "INSTRUCTOR";
        applicant.instructorApprovedAt = reviewedAt;
        applicant.profileImage = application.profileImage || applicant.profileImage;
        applicant.bio = application.biography;
        applicant.professionalTitle = application.professionalTitle;
        applicant.expertise = application.expertise;
        applicant.teachingExperience = application.teachingExperience;
        applicant.qualifications = application.qualifications;
        applicant.portfolioLinks = application.portfolioLinks;
        await applicant.save();
      } catch (error) {
        await InstructorApplication.findOneAndUpdate(
          { _id: id, status: "APPROVED", reviewedBy: req.user.id },
          { $set: { status: "PENDING", reviewedBy: null, reviewedAt: null, reviewNote: "" } }
        );
        throw error;
      }
    }
    return res.status(200).json({
      success: true,
      message: `Instructor application ${status.toLowerCase()}`,
      data: { id: reviewedApplication._id, status: reviewedApplication.status, reviewedAt: reviewedApplication.reviewedAt },
    });
  } catch (error) {
    console.error("Review instructor application error:", error.message);
    return res.status(500).json({ success: false, message: "Could not review instructor application" });
  }
});

router.get("/courses", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const filter = {};
  if (req.query.published === "true") filter.published = true;
  if (req.query.published === "false") filter.published = false;
  if (search) {
    const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    filter.$or = [{ title: new RegExp(escaped, "i") }, { description: new RegExp(escaped, "i") }];
  }
  try {
    const [courses, total] = await Promise.all([
      Course.find(filter)
        .populate("instructor", "name")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Course.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: courses,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List moderation courses error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch courses for moderation" });
  }
});

router.get("/users", async (req, res) => {
  const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
  const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
  const role = req.query.role;
  if (role && !["STUDENT", "INSTRUCTOR"].includes(role)) {
    return res.status(400).json({ success: false, message: "Invalid user role filter" });
  }
  const filter = {
    ...(role ? { role } : {}),
    ...(search
      ? { $or: ["name", "email"].map((field) => ({ [field]: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") })) }
      : {}),
  };
  try {
    const [users, total] = await Promise.all([
      User.find(filter)
        .select("_id name email role instructorApprovedAt accountStatus createdAt profileImage")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    return res.status(200).json({
      success: true,
      data: users,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("List users error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch users" });
  }
});

router.patch("/users/:id/status", async (req, res) => {
  const { id } = req.params;
  const { accountStatus } = req.body || {};
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ success: false, message: "Invalid user ID" });
  }
  if (!["ACTIVE", "DEACTIVATED"].includes(accountStatus)) {
    return res.status(400).json({ success: false, message: "Status must be ACTIVE or DEACTIVATED" });
  }
  if (id === req.user.id) {
    return res.status(403).json({ success: false, message: "You cannot change your own account status" });
  }
  try {
    const target = await User.findById(id);
    if (!target) return res.status(404).json({ success: false, message: "User not found" });
    if (target.role === "ADMIN") {
      return res.status(403).json({ success: false, message: "Administrator accounts cannot be deactivated through user management" });
    }
    target.accountStatus = accountStatus;
    target.accountStatusChangedAt = new Date();
    target.accountStatusChangedBy = req.user.id;
    await target.save();
    return res.status(200).json({
      success: true,
      message: `Account ${accountStatus.toLowerCase()}`,
      data: { id: target._id, accountStatus: target.accountStatus },
    });
  } catch (error) {
    console.error("Update account status error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update account status" });
  }
});

module.exports = router;
