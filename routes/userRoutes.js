const bcrypt = require("bcryptjs");
const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/user");

const router = express.Router();
const profileFields = [
  "name", "bio", "profileImage", "location", "interests",
  "professionalTitle", "expertise", "teachingExperience", "qualifications", "portfolioLinks",
];
const instructorFields = ["professionalTitle", "expertise", "teachingExperience", "qualifications", "portfolioLinks"];

function isWebUrl(value, required = false) {
  if (!value && !required) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validStringList(value, maximum = 20) {
  return Array.isArray(value) &&
    value.length <= maximum &&
    value.every((item) => typeof item === "string" && item.trim().length <= 100);
}

router.use(authMiddleware);

router.get("/me", (req, res) => {
  res.status(200).json({ success: true, data: req.user });
});

router.patch("/me", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Profile details must be an object" });
  }
  const keys = Object.keys(req.body);
  if (!keys.length || keys.some((key) => !profileFields.includes(key))) {
    return res.status(400).json({
      success: false,
      message: "Update only name, bio, profileImage, location, or interests",
    });
  }
  if (
    (req.user.role !== "INSTRUCTOR" || !req.user.instructorApprovedAt) &&
    req.user.role !== "ADMIN" &&
    keys.some((key) => instructorFields.includes(key))
  ) {
    return res.status(403).json({ success: false, message: "Instructor profile fields require an approved instructor account" });
  }

  const updates = {};
  if (Object.hasOwn(req.body, "name")) {
    const name = req.body.name;
    if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
      return res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters" });
    }
    updates.name = name.trim();
  }
  for (const field of ["bio", "location", "profileImage"]) {
    if (!Object.hasOwn(req.body, field)) continue;
    const value = req.body[field];
    const maximum = field === "bio" ? 2000 : field === "location" ? 120 : 2048;
    if (typeof value !== "string" || value.trim().length > maximum) {
      return res.status(400).json({ success: false, message: `Invalid ${field}` });
    }
    if (field === "profileImage" && !isWebUrl(value.trim())) {
      return res.status(400).json({ success: false, message: "Profile image must be an HTTPS URL" });
    }
    updates[field] = value.trim();
  }
  if (Object.hasOwn(req.body, "interests")) {
    if (!validStringList(req.body.interests)) {
      return res.status(400).json({ success: false, message: "Interests must be a list of up to 20 short labels" });
    }
    updates.interests = req.body.interests.map((item) => item.trim()).filter(Boolean);
  }
  for (const field of ["professionalTitle", "teachingExperience"]) {
    if (!Object.hasOwn(req.body, field)) continue;
    const value = req.body[field];
    const maximum = field === "professionalTitle" ? 120 : 2000;
    if (typeof value !== "string" || value.trim().length > maximum) {
      return res.status(400).json({ success: false, message: `Invalid ${field}` });
    }
    updates[field] = value.trim();
  }
  for (const field of ["expertise", "qualifications", "portfolioLinks"]) {
    if (!Object.hasOwn(req.body, field)) continue;
    if (!validStringList(req.body[field])) {
      return res.status(400).json({ success: false, message: `${field} must be a list of up to 20 short values` });
    }
    const values = req.body[field].map((item) => item.trim()).filter(Boolean);
    if (field === "portfolioLinks" && values.some((value) => !isWebUrl(value, true))) {
      return res.status(400).json({ success: false, message: "Portfolio links must use HTTPS" });
    }
    updates[field] = values;
  }

  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User account no longer exists" });
    Object.assign(user, updates);
    await user.save();
    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        instructorApprovedAt: user.instructorApprovedAt || null,
        accountStatus: user.accountStatus || "ACTIVE",
        profileImage: user.profileImage || "",
        bio: user.bio || "",
        location: user.location || "",
        interests: user.interests || [],
        createdAt: user.createdAt,
        emailVerifiedAt: user.emailVerifiedAt || null,
        professionalTitle: user.professionalTitle || "",
        expertise: user.expertise || [],
        teachingExperience: user.teachingExperience || "",
        qualifications: user.qualifications || [],
        portfolioLinks: user.portfolioLinks || [],
      },
    });
  } catch (error) {
    console.error("Update profile error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update profile" });
  }
});

router.patch("/me/password", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Password details must be an object" });
  }
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (
    typeof currentPassword !== "string" ||
    typeof newPassword !== "string" ||
    newPassword.length < 8 ||
    Buffer.byteLength(newPassword, "utf8") > 72 ||
    confirmPassword !== newPassword
  ) {
    return res.status(400).json({
      success: false,
      message: "Provide your current password and a matching new password of at least 8 characters",
    });
  }

  try {
    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) return res.status(404).json({ success: false, message: "User account no longer exists" });
    if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error.message);
    return res.status(500).json({ success: false, message: "Could not update password" });
  }
});

module.exports = router;
