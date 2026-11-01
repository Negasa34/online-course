
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/user");

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id.toString(),
      role: user.role,
      instructorApprovedAt: user.instructorApprovedAt || null,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
}

// POST /api/auth/register
async function register(req, res) {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Registration details must be provided as an object",
      });
    }

    const { name, email, password, confirmPassword, termsAccepted } = req.body;
    const profileImage = req.body.profileImage || "";

    // Basic input validation
    if (
      typeof name !== "string" ||
      name.trim().length < 2 ||
      name.trim().length > 80
    ) {
      return res.status(400).json({
        success: false,
        message: "Name must be between 2 and 80 characters",
      });
    }

    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        success: false,
        message: "Provide a valid email address",
      });
    }

    if (
      typeof password !== "string" ||
      password.length < 8 ||
      Buffer.byteLength(password, "utf8") > 72
    ) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters and at most 72 bytes",
      });
    }

    if (confirmPassword !== password) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (termsAccepted !== true) {
      return res.status(400).json({
        success: false,
        message: "You must agree to the terms and privacy policy",
      });
    }
    if (
      typeof profileImage !== "string" ||
      profileImage.length > 2048 ||
      (profileImage && !/^https:\/\/\S+$/i.test(profileImage.trim()))
    ) {
      return res.status(400).json({
        success: false,
        message: "Profile image must be an HTTPS URL",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    // Role hin fudhannu: schema default STUDENT fayyadama
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      termsAcceptedAt: new Date(),
      profileImage: profileImage.trim(),
    });

    const token = createToken(user);

    return res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        instructorApprovedAt: user.instructorApprovedAt || null,
        profileImage: user.profileImage || "",
        accountStatus: user.accountStatus || "ACTIVE",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    // Unique email constraint yeroo request lama wal faana dhufes ilaala
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Email is already registered",
      });
    }

    console.error("Register error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not create account",
    });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
      return res.status(400).json({
        success: false,
        message: "Login details must be provided as an object",
      });
    }

    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+passwordHash");

    // Ergaa wal fakkaataa fayyadamna; account jiraachuu hin mul'ifnu
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }
    if (user.accountStatus === "DEACTIVATED") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    const token = createToken(user);

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        instructorApprovedAt: user.instructorApprovedAt || null,
        profileImage: user.profileImage || "",
        accountStatus: user.accountStatus || "ACTIVE",
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not log in",
    });
  }
}

module.exports = {
  register,
  login,
  createToken,
};
