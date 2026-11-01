
const path = require("path");

require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const express = require("express");
const mongoose = require("mongoose");
const Course = require("./models/courses");
const CourseSection = require("./models/courseSection");
const LessonProgress = require("./models/lessonProgress");
const { deleteVideo } = require("./services/cloudinaryStorage");
const authRoutes = require("./routes/autoRoutes");
const curriculumRoutes = require("./routes/curriculumRoutes");
const enrollmentRoutes = require("./routes/enrollmentRoutes");
const userRoutes = require("./routes/userRoutes");
const instructorApplicationRoutes = require("./routes/instructorApplicationRoutes");
const adminRoutes = require("./routes/adminRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const Enrollment = require("./models/enrollment");
const InstructorApplication = require("./models/instructorApplication");
const authMiddleware = require("./middleware/authMiddleware");
const authorizeRoles = require("./middleware/authorizeRoles");
const canManageCourse = require("./middleware/canManageCourse");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 5000;
const allowedOrigins = new Set(
  (process.env.CORS_ORIGINS || "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");

  const origin = req.get("Origin");
  if (origin) {
    res.vary("Origin");
    if (!allowedOrigins.has(origin)) {
      const error = new Error("Origin is not allowed");
      error.code = "CORS_ORIGIN_DENIED";
      return next(error);
    }

    res.set("Access-Control-Allow-Origin", origin);
  }

  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET,POST,PATCH,PUT,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Authorization,Content-Type");
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "100kb" }));
app.use("/api/auth", authRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/users", userRoutes);
app.use("/api/instructor-applications", instructorApplicationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/dashboards", dashboardRoutes);
app.use("/api/curriculum", curriculumRoutes);

// MongoDB connection status
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Course API is running",
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  });
});

// GET: Courses hunda dubbisi
app.get("/api/courses", async (req, res) => {
  try {
    const courses = await Course.find({ published: true }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: courses.length,
      data: courses,
    });
  } catch (error) {
    console.error("Get courses error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch courses",
    });
  }
});

// GET: Course tokko ID isaatiin dubbisi
app.get("/api/courses/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid course ID",
      });
    }

    const course = await Course.findById(id);

    if (!course || !course.published) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    res.status(200).json({
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Get course error:", error.message);
    res.status(500).json({
      success: false,
      message: "Could not fetch course",
    });
  }
});

// POST: Course haaraa uumi
app.post(
  "/api/courses",
  authMiddleware,
  authorizeRoles("INSTRUCTOR", "ADMIN"),
  async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({
          success: false,
          message: "Course details must be provided as an object",
        });
      }

      const { title, slug, description, price, published } = req.body;

      if (
        typeof title !== "string" || !title.trim() ||
        typeof slug !== "string" || !slug.trim() ||
        typeof description !== "string" || !description.trim()
      ) {
        return res.status(400).json({
          success: false,
          message: "Title, slug, and description are required",
        });
      }

      if (
        price !== undefined &&
        (typeof price !== "number" || !Number.isFinite(price) || price < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number",
        });
      }

      if (published !== undefined && typeof published !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Published must be true or false",
        });
      }

      const course = await Course.create({
        title: title.trim(),
        slug: slug.trim().toLowerCase(),
        description: description.trim(),
        instructor: req.user.id,
        ...(price !== undefined && { price }),
        ...(published !== undefined && { published }),
      });

      res.status(201).json({
        success: true,
        message: "Course created successfully",
        data: course,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A course with this slug already exists",
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Create course error:", error.message);
      res.status(500).json({
        success: false,
        message: "Could not create course",
      });
    }
  }
);

// PATCH: Course tokko gulaali
app.patch(
  "/api/courses/:id",
  authMiddleware,
  authorizeRoles("INSTRUCTOR", "ADMIN"),
  canManageCourse,
  async (req, res) => {
    try {
      if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
        return res.status(400).json({
          success: false,
          message: "Course updates must be provided as an object",
        });
      }

      const allowedFields = ["title", "slug", "description", "price", "published"];
      const updates = {};

      for (const field of allowedFields) {
        if (Object.hasOwn(req.body, field)) {
          updates[field] = req.body[field];
        }
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({
          success: false,
          message: "Provide at least one valid field to update",
        });
      }

      if (
        "title" in updates &&
        (typeof updates.title !== "string" || !updates.title.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Title must be a non-empty string",
        });
      }

      if ("title" in updates) updates.title = updates.title.trim();

      if (
        "slug" in updates &&
        (typeof updates.slug !== "string" || !updates.slug.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Slug must be a non-empty string",
        });
      }

      if ("slug" in updates) updates.slug = updates.slug.trim().toLowerCase();

      if (
        "description" in updates &&
        (typeof updates.description !== "string" ||
          !updates.description.trim())
      ) {
        return res.status(400).json({
          success: false,
          message: "Description must be a non-empty string",
        });
      }

      if ("description" in updates) {
        updates.description = updates.description.trim();
      }

      if (
        "price" in updates &&
        (typeof updates.price !== "number" ||
          !Number.isFinite(updates.price) ||
          updates.price < 0)
      ) {
        return res.status(400).json({
          success: false,
          message: "Price must be a non-negative number",
        });
      }

      if ("published" in updates && typeof updates.published !== "boolean") {
        return res.status(400).json({
          success: false,
          message: "Published must be true or false",
        });
      }

      req.course.set(updates);
      const course = await req.course.save();

      res.status(200).json({
        success: true,
        message: "Course updated successfully",
        data: course,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({
          success: false,
          message: "A course with this slug already exists",
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }

      console.error("Update course error:", error.message);
      res.status(500).json({
        success: false,
        message: "Could not update course",
      });
    }
  }
);

// DELETE: Course haqi
app.delete(
  "/api/courses/:id",
  authMiddleware,
  authorizeRoles("INSTRUCTOR", "ADMIN"),
  canManageCourse,
  async (req, res) => {
    try {
      const course = req.course;
      const sections = await CourseSection.find({ course: course._id });
      const videoIds = sections.flatMap((section) =>
        section.lessons.map((lesson) => lesson.video?.publicId).filter(Boolean)
      );
      await Promise.all(videoIds.map(deleteVideo));
      await Promise.all([
        CourseSection.deleteMany({ course: course._id }),
        LessonProgress.deleteMany({ course: course._id }),
      ]);
      await course.deleteOne();

      res.status(200).json({
        success: true,
        message: "Course deleted successfully",
        data: course,
      });
    } catch (error) {
      console.error("Delete course error:", error.message);
      res.status(500).json({
        success: false,
        message: "Could not delete course",
      });
    }
  }
);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is missing from .env");
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
      throw new Error("JWT_SECRET must be configured with at least 32 characters");
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      dbName: process.env.MONGODB_DB_NAME || "olinecourse",
      serverSelectionTimeoutMS: 15000,
    });
    console.log(`MongoDB connected (${mongoose.connection.name})`);
    await Promise.all([
      Enrollment.createIndexes(),
      InstructorApplication.createIndexes(),
      CourseSection.createIndexes(),
      LessonProgress.createIndexes(),
    ]);

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };
