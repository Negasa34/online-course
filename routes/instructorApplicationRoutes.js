const bcrypt = require("bcryptjs");
const express = require("express");
const { createToken } = require("../controllers/authControllers");
const authMiddleware = require("../middleware/authMiddleware");
const InstructorApplication = require("../models/instructorApplication");
const User = require("../models/user");

const router = express.Router();

function isHttpsUrl(value) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function stringList(value, { required = false, maximum = 20 } = {}) {
  return Array.isArray(value) &&
    value.length <= maximum &&
    (!required || value.length > 0) &&
    value.every((item) => typeof item === "string" && item.trim().length > 0 && item.trim().length <= 200);
}

function validateApplicationProfile(body) {
  const {
    profileImage = "",
    professionalTitle,
    biography,
    expertise,
    teachingExperience,
    qualifications,
    portfolioLinks = [],
  } = body;
  const invalid =
    typeof profileImage !== "string" ||
    profileImage.length > 2048 ||
    (profileImage.length > 0 && !isHttpsUrl(profileImage.trim())) ||
    typeof professionalTitle !== "string" ||
    !professionalTitle.trim() ||
    professionalTitle.trim().length > 120 ||
    typeof biography !== "string" ||
    biography.trim().length < 20 ||
    biography.trim().length > 2000 ||
    typeof teachingExperience !== "string" ||
    !teachingExperience.trim() ||
    teachingExperience.trim().length > 2000 ||
    !stringList(expertise, { required: true }) ||
    !stringList(qualifications, { required: true }) ||
    !stringList(portfolioLinks) ||
    portfolioLinks.some((link) => !isHttpsUrl(link.trim()));

  if (invalid) {
    return {
      error: "Provide a title, biography, experience, expertise, qualifications, and valid HTTPS links",
    };
  }
  return {
    profile: {
      profileImage: profileImage.trim(),
      professionalTitle: professionalTitle.trim(),
      biography: biography.trim(),
      expertise: expertise.map((item) => item.trim()),
      teachingExperience: teachingExperience.trim(),
      qualifications: qualifications.map((item) => item.trim()),
      portfolioLinks: portfolioLinks.map((item) => item.trim()),
    },
  };
}

router.post("/", async (req, res) => {
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Application details must be an object" });
  }
  const {
    name, email, password, confirmPassword, termsAccepted,
  } = req.body;
  if (typeof name !== "string" || name.trim().length < 2 || name.trim().length > 80) {
    return res.status(400).json({ success: false, message: "Name must be between 2 and 80 characters" });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, message: "Provide a valid email address" });
  }
  if (
    typeof password !== "string" ||
    password.length < 8 ||
    Buffer.byteLength(password, "utf8") > 72 ||
    confirmPassword !== password
  ) {
    return res.status(400).json({ success: false, message: "Passwords must match and be at least 8 characters" });
  }
  if (termsAccepted !== true) {
    return res.status(400).json({ success: false, message: "You must agree to the terms and privacy policy" });
  }
  const validatedProfile = validateApplicationProfile(req.body);
  if (validatedProfile.error) {
    return res.status(400).json({
      success: false,
      message: validatedProfile.error,
    });
  }
  const profile = validatedProfile.profile;

  let createdUser;
  try {
    const normalizedEmail = email.trim().toLowerCase();
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: "Email is already registered" });
    }
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash: await bcrypt.hash(password, 12),
      role: "STUDENT",
      termsAcceptedAt: new Date(),
      profileImage: profile.profileImage,
      bio: profile.biography,
    });
    createdUser = user;
    const application = await InstructorApplication.create({
      user: user._id,
      ...profile,
    });
    return res.status(201).json({
      success: true,
      message: "Application submitted. Your account will remain a student account until an administrator reviews it.",
      token: createToken(user),
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus || "ACTIVE",
        profileImage: user.profileImage,
      },
      application: { id: application._id, status: application.status },
    });
  } catch (error) {
    if (createdUser) {
      try {
        await User.deleteOne({ _id: createdUser._id });
      } catch (cleanupError) {
        console.error("Remove incomplete instructor applicant error:", cleanupError.message);
      }
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An account or instructor application already exists" });
    }
    console.error("Submit instructor application error:", error.message);
    return res.status(500).json({ success: false, message: "Could not submit instructor application" });
  }
});

router.post("/me", authMiddleware, async (req, res) => {
  const mayApply = req.user.role === "STUDENT" ||
    (req.user.role === "INSTRUCTOR" && !req.user.instructorApprovedAt);
  if (!mayApply) {
    return res.status(403).json({ success: false, message: "This account is not eligible for instructor application" });
  }
  if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
    return res.status(400).json({ success: false, message: "Application details must be an object" });
  }
  const validatedProfile = validateApplicationProfile(req.body);
  if (validatedProfile.error) {
    return res.status(400).json({ success: false, message: validatedProfile.error });
  }
  try {
    if (await InstructorApplication.findOne({ user: req.user.id })) {
      return res.status(409).json({ success: false, message: "An instructor application already exists for this account" });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(401).json({ success: false, message: "User account no longer exists" });
    const application = await InstructorApplication.create({
      user: user._id,
      ...validatedProfile.profile,
    });
    try {
      user.profileImage = validatedProfile.profile.profileImage || user.profileImage;
      user.bio = validatedProfile.profile.biography;
      await user.save();
    } catch (error) {
      await application.deleteOne();
      throw error;
    }
    return res.status(201).json({
      success: true,
      message: "Application submitted. Your account will remain a student account until an administrator reviews it.",
      data: { id: application._id, status: application.status },
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "An instructor application already exists for this account" });
    }
    console.error("Submit instructor application error:", error.message);
    return res.status(500).json({ success: false, message: "Could not submit instructor application" });
  }
});

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const application = await InstructorApplication.findOne({ user: req.user.id });
    if (!application) return res.status(404).json({ success: false, message: "No instructor application was found" });
    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error("Get instructor application error:", error.message);
    return res.status(500).json({ success: false, message: "Could not fetch instructor application" });
  }
});

module.exports = router;
