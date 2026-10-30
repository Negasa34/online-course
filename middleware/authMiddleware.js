
const jwt = require("jsonwebtoken");
const User = require("../models/user");

async function authMiddleware(req, res, next) {
  try {
    const authorization = req.headers.authorization;

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const token = authorization.slice(7).trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId).select(
      "_id name email role instructorApprovedAt accountStatus profileImage bio location interests professionalTitle expertise teachingExperience qualifications portfolioLinks createdAt emailVerifiedAt"
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User account no longer exists",
      });
    }

    if (user.accountStatus === "DEACTIVATED") {
      return res.status(403).json({
        success: false,
        message: "This account has been deactivated",
      });
    }

    req.user = {
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
      professionalTitle: user.professionalTitle || "",
      expertise: user.expertise || [],
      teachingExperience: user.teachingExperience || "",
      qualifications: user.qualifications || [],
      portfolioLinks: user.portfolioLinks || [],
      createdAt: user.createdAt,
      emailVerifiedAt: user.emailVerifiedAt || null,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Authentication failed",
    });
  }
}

module.exports = authMiddleware;
