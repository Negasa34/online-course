const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const learningController = require("../controllers/learningController");

const router = express.Router();
const submissionWindows = new Map();
const WINDOW_MS = 60 * 1000;
const MAX_SUBMISSIONS_PER_WINDOW = 20;
const MAX_TRACKED_STUDENTS = 10000;

function limitSubmissions(req, res, next) {
  const now = Date.now();
  const key = req.user.id;
  const recent = (submissionWindows.get(key) || []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= MAX_SUBMISSIONS_PER_WINDOW) {
    res.set("Retry-After", String(Math.ceil((WINDOW_MS - (now - recent[0])) / 1000)));
    return res.status(429).json({
      success: false,
      message: "Too many submissions. Please wait a moment before trying again.",
    });
  }
  if (!submissionWindows.has(key) && submissionWindows.size >= MAX_TRACKED_STUDENTS) {
    for (const [studentId, timestamps] of submissionWindows) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) submissionWindows.delete(studentId);
    }
    if (submissionWindows.size >= MAX_TRACKED_STUDENTS) {
      res.set("Retry-After", String(Math.ceil(WINDOW_MS / 1000)));
      return res.status(503).json({
        success: false,
        message: "Submission service is temporarily busy. Please retry shortly.",
      });
    }
  }
  recent.push(now);
  submissionWindows.set(key, recent);
  return next();
}

const student = [authMiddleware, authorizeRoles("STUDENT")];
const studentSubmission = [...student, limitSubmissions];

function optionalAuth(req, res, next) {
  if (!req.headers.authorization) return next();
  return authMiddleware(req, res, next);
}

router.get("/paths", optionalAuth, learningController.listPaths);
router.get("/paths/:pathSlug", optionalAuth, learningController.getPath);
router.get("/paths/:pathSlug/modules", optionalAuth, learningController.listModules);
router.get("/paths/:pathSlug/projects", ...student, learningController.getFinalProjects);
router.get("/paths/:pathSlug/assessment", optionalAuth, learningController.getFinalAssessment);
router.get("/bookmarks/me", ...student, learningController.getMyBookmarks);

router.get("/modules/:moduleId", optionalAuth, learningController.getModule);
router.get("/modules/:moduleId/lessons", optionalAuth, learningController.listModuleLessons);
router.get("/modules/:moduleId/assessment", optionalAuth, learningController.getModuleAssessment);

router.get("/lessons/:lessonId", optionalAuth, learningController.getLesson);
router.get("/lessons/:lessonId/exercises", optionalAuth, learningController.listExercises);
router.get("/lessons/:lessonId/quiz", optionalAuth, learningController.getLessonQuiz);
router.get("/quizzes/:quizId", optionalAuth, learningController.getQuiz);
router.patch("/lessons/:lessonId/visit", ...student, learningController.markLessonVisited);
router.post("/lessons/:lessonId/complete", ...student, learningController.markLessonCompleted);
router.put("/lessons/:lessonId/bookmark", ...student, learningController.setLessonBookmark);

router.post("/exercises/:exerciseId/submit", ...studentSubmission, learningController.submitExercise);
router.post("/exercises/:exerciseId/reference-solution", ...studentSubmission, learningController.getExerciseReferenceSolution);
router.post("/quizzes/:quizId/submit", ...studentSubmission, learningController.submitQuiz);
router.get("/progress/me", ...student, learningController.getMyProgress);

module.exports = router;
