
function authorizeRoles(...allowedRoles) {
  return function (req, res, next) {
    // authMiddleware dursee hojjechuu qaba.
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Please log in first",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    if (
      req.user.role === "INSTRUCTOR" &&
      allowedRoles.includes("INSTRUCTOR") &&
      !req.user.instructorApprovedAt
    ) {
      return res.status(403).json({
        success: false,
        message: "Instructor access requires administrator approval",
      });
    }

    next();
  };
}

module.exports = authorizeRoles;
