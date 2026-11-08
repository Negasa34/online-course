const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { after, before, test } = require("node:test");

process.env.JWT_SECRET = "learning-api-test-secret-with-at-least-32-characters";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { app } = require("../server");
const User = require("../models/user");
const LearningExercise = require("../models/learningExercise");
const LearningExerciseAttempt = require("../models/learningExerciseAttempt");
const LearningLesson = require("../models/learningLesson");
const LearningLessonBookmark = require("../models/learningLessonBookmark");
const LearningLessonProgress = require("../models/learningLessonProgress");
const LearningModule = require("../models/learningModule");
const LearningPath = require("../models/learningPath");
const LearningPathProgress = require("../models/learningPathProgress");
const LearningQuiz = require("../models/learningQuiz");
const LearningQuizAttempt = require("../models/learningQuizAttempt");
const lessonId = "000000000000000000000005";
const moduleId = "000000000000000000000006";
const exerciseId = "000000000000000000000007";

const pathId = "000000000000000000000001";
const quizId = "000000000000000000000002";
const student = { _id: "000000000000000000000003", role: "STUDENT", name: "Student", email: "student@example.test" };
const instructor = { _id: "000000000000000000000004", role: "INSTRUCTOR", name: "Instructor", email: "instructor@example.test", instructorApprovedAt: new Date() };
const otherStudent = { _id: "000000000000000000000008", role: "STUDENT", name: "Other Student", email: "other@example.test" };
const rateLimitStudent = { _id: "000000000000000000000009", role: "STUDENT", name: "Rate Limit Student", email: "rate-limit@example.test" };
const quiz = {
  _id: quizId,
  path: pathId,
  scope: "lesson",
  title: "Test quiz",
  passingScore: 60,
  contentVersion: 1,
  questions: [
    { questionKey: "one", type: "multiple-choice", prompt: "Choose one.", choices: [{ id: "a", text: "A" }, { id: "b", text: "B" }], correctChoiceId: "a", explanation: "A is correct.", solutionCode: "secret" },
    { questionKey: "two", type: "true-false", prompt: "Choose two.", choices: [{ id: "yes", text: "Yes" }, { id: "no", text: "No" }], correctChoiceId: "no", explanation: "No is correct." },
    { questionKey: "three", type: "code-output", prompt: "Choose three.", choices: [{ id: "x", text: "X" }, { id: "y", text: "Y" }], correctChoiceId: "x", explanation: "X is correct." },
  ],
};

let server;
let baseUrl;
let lastSavedAttempt;
let lastSavedExerciseAttempt;
let progressUserFilters = [];
let sampleLesson;
let sampleExercise;
let sampleModule;
let completedProgress;
let lessonProgressUpdate;
const savedBookmarks = new Map();

function query(value) {
  return {
    select() { return this; },
    sort() { return this; },
    populate() { return this; },
    lean() { return Promise.resolve(value); },
    then(resolve, reject) { return Promise.resolve(value).then(resolve, reject); },
  };
}

function tokenFor(user) {
  return jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
}

async function request(path, { user, body, method = "GET" } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(user ? { Authorization: `Bearer ${tokenFor(user)}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
  return { response, body: await response.json() };
}

before(async () => {
  User.findById = (id) => {
    const user = [student, instructor, otherStudent, rateLimitStudent].find((item) => item._id === String(id)) || null;
    const result = Promise.resolve(user);
    result.select = () => result;
    return result;
  };
  LearningPath.exists = async () => ({ _id: pathId });
  LearningPath.findOne = () => query({ _id: pathId, slug: "html5", title: "HTML" });
  LearningQuiz.findOne = (filter) => query(filter?._id ? quiz : null);
  LearningQuiz.findById = async () => quiz;
  LearningQuiz.find = () => query([]);
  LearningQuizAttempt.create = async (attempt) => {
    lastSavedAttempt = attempt;
    return { _id: quizId, ...attempt };
  };
  LearningModule.find = () => query([]);
  LearningModule.findById = () => query(sampleModule);
  LearningLesson.find = () => query([]);
  LearningLesson.findById = () => query(sampleLesson);
  LearningLesson.countDocuments = async () => 2;
  LearningLessonProgress.findOneAndUpdate = async (filter, update) => {
    lessonProgressUpdate = { filter, update };
    return {};
  };
  LearningLessonProgress.findOne = () => query(completedProgress || null);
  LearningLessonBookmark.find = (filter = {}) => query(
    [...savedBookmarks.values()].filter((bookmark) =>
      (!filter.user || String(bookmark.user) === String(filter.user)) &&
      (!filter.path || String(bookmark.path) === String(filter.path))
    )
  );
  LearningLessonBookmark.findOneAndUpdate = async (filter, update) => {
    const key = `${filter.user}:${filter.lesson}`;
    if (!savedBookmarks.has(key)) savedBookmarks.set(key, { ...update.$setOnInsert, createdAt: new Date() });
    return savedBookmarks.get(key);
  };
  LearningLessonBookmark.updateOne = async (filter, update) => {
    const key = `${filter.user}:${filter.lesson}`;
    if (savedBookmarks.has(key)) Object.assign(savedBookmarks.get(key), update.$set);
    return { modifiedCount: 1 };
  };
  LearningLessonBookmark.deleteOne = async (filter) => {
    const key = `${filter.user}:${filter.lesson}`;
    const deleted = savedBookmarks.delete(key);
    return { deletedCount: Number(deleted) };
  };
  LearningExercise.find = () => query([]);
  LearningExercise.findById = () => query(sampleExercise);
  LearningExercise.findOne = () => query(sampleExercise);
  LearningExerciseAttempt.create = async (attempt) => {
    lastSavedExerciseAttempt = attempt;
    return { _id: exerciseId, ...attempt };
  };
  LearningLessonProgress.countDocuments = async () => 0;
  LearningPathProgress.findOneAndUpdate = async () => ({});

  LearningPath.find = () => query([{ _id: pathId, title: "HTML", slug: "html5" }]);
  LearningPathProgress.findOne = () => query(null);
  LearningLessonProgress.find = (filter) => {
    progressUserFilters.push(filter.user);
    return query(completedProgress ? [completedProgress] : []);
  };
  LearningQuizAttempt.find = () => query([]);
  LearningExerciseAttempt.find = () => query([]);
  LearningQuiz.findOne = (filter) => query(filter?._id ? quiz : null);
  LearningQuizAttempt.distinct = async () => [];
  LearningExerciseAttempt.distinct = async () => [];

  await new Promise((resolve) => {
    server = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("learning writes require a student identity and role", async () => {
  const anonymous = await request(`/api/learning/quizzes/${quizId}/submit`, { method: "POST", body: { answers: [] } });
  assert.equal(anonymous.response.status, 401);

  const nonStudent = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: instructor,
    method: "POST",
    body: { answers: [] },
  });
  assert.equal(nonStudent.response.status, 403);
  const anonymousProgress = await request("/api/learning/progress/me");
  assert.equal(anonymousProgress.response.status, 401);
  const anonymousExercise = await request(`/api/learning/exercises/${exerciseId}/submit`, { method: "POST", body: { html: "<h1>x</h1>" } });
  assert.equal(anonymousExercise.response.status, 401);
});

test("public quiz payloads omit answer keys, explanations, and solutions", async () => {
  const result = await request(`/api/learning/quizzes/${quizId}`);
  assert.equal(result.response.status, 200);
  const serialized = JSON.stringify(result.body.data);
  assert.doesNotMatch(serialized, /correctChoiceId|explanation|solutionCode|requirements|rubric/);
  assert.deepEqual(result.body.data.questions[0].choices, [{ id: "a", text: "A" }, { id: "b", text: "B" }]);
});

test("lesson and exercise responses exclude private solutions", async () => {
  sampleModule = { _id: moduleId, path: pathId, title: "Foundations", slug: "foundations", order: 1 };
  sampleLesson = {
    _id: lessonId,
    path: pathId,
    module: moduleId,
    title: "A first page",
    slug: "first-page",
    order: 1,
    content: { introduction: "Create a page.", objectives: ["Use a heading."] },
    project: { description: "A small project", solutionCode: "private lesson solution", solutionExplanation: "private lesson notes" },
  };
  sampleExercise = {
    _id: exerciseId,
    path: pathId,
    module: moduleId,
    lesson: lessonId,
    title: "Add a heading",
    instructions: "Add a heading to the page.",
    starterCode: "<main></main>",
    requirements: [{ type: "element-exists", selector: "h1" }],
    hints: ["Use a heading element.", "Place it in main."],
    solutionCode: "private exercise solution",
    solutionExplanation: "private exercise notes",
    project: { description: "Project", solutionCode: "private project solution" },
  };
  const result = await request(`/api/learning/lessons/${lessonId}`);
  assert.equal(result.response.status, 200);
  const serialized = JSON.stringify(result.body.data);
  assert.doesNotMatch(serialized, /private .*solution|private .*notes|requirements/);
});

test("bookmarks persist per student and cannot be read across accounts", async () => {
  sampleLesson = { _id: lessonId, path: pathId };
  const saved = await request(`/api/learning/lessons/${lessonId}/bookmark`, {
    user: student,
    method: "PUT",
    body: { bookmarked: true },
  });
  assert.equal(saved.response.status, 200);
  assert.equal(saved.body.data.bookmarked, true);

  sampleLesson = { _id: lessonId, path: pathId, module: moduleId, title: "Saved lesson", slug: "saved-lesson", order: 1, estimatedMinutes: 10 };
  sampleModule = { _id: moduleId, path: pathId, title: "Module", slug: "module", order: 1 };
  LearningLesson.find = () => query([sampleLesson]);
  LearningModule.find = () => query([sampleModule]);
  LearningPath.find = () => query([{ _id: pathId, title: "HTML", slug: "html5" }]);
  const owned = await request("/api/learning/bookmarks/me", { user: student });
  assert.equal(owned.response.status, 200);
  assert.equal(owned.body.data.length, 1);
  assert.equal(owned.body.data[0].lesson.title, "Saved lesson");

  const isolated = await request("/api/learning/bookmarks/me", { user: otherStudent });
  assert.equal(isolated.response.status, 200);
  assert.deepEqual(isolated.body.data, []);

  const removed = await request(`/api/learning/lessons/${lessonId}/bookmark`, {
    user: student,
    method: "PUT",
    body: { bookmarked: false },
  });
  assert.equal(removed.response.status, 200);
  assert.equal(removed.body.data.bookmarked, false);
  const afterRemoval = await request("/api/learning/bookmarks/me", { user: student });
  assert.deepEqual(afterRemoval.body.data, []);
});

test("exercise answers are checked and recorded for the authenticated student", async () => {
  sampleExercise = {
    _id: exerciseId,
    path: pathId,
    module: moduleId,
    lesson: lessonId,
    requirements: [{ type: "element-exists", selector: "main > h1" }],
  };
  const result = await request(`/api/learning/exercises/${exerciseId}/submit`, {
    user: student,
    method: "POST",
    body: { html: "<main><h1>My page</h1></main>" },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.passed, true);
  assert.equal(result.body.data.results[0].passed, true);
  assert.equal(lastSavedExerciseAttempt.user, student._id);

  const tooLarge = await request(`/api/learning/exercises/${exerciseId}/submit`, {
    user: student,
    method: "POST",
    body: { html: `<p>${"x".repeat(21000)}</p>` },
  });
  assert.equal(tooLarge.response.status, 413);
});

test("quiz submissions validate shape and save the authenticated student's result", async () => {
  const invalid = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [{ questionKey: "unknown", choiceId: "a" }] },
  });
  assert.equal(invalid.response.status, 400);
  const unexpectedField = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [], admin: true },
  });
  assert.equal(unexpectedField.response.status, 400);
  const otherStudentTarget = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers: [], user: otherStudent._id },
  });
  assert.equal(otherStudentTarget.response.status, 400);

  const answers = [
    { questionKey: "one", choiceId: "a" },
    { questionKey: "two", choiceId: "no" },
    { questionKey: "three", choiceId: "y" },
  ];
  const result = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: student,
    method: "POST",
    body: { answers },
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.score, 67);
  assert.equal(result.body.data.passed, true);
  assert.equal(lastSavedAttempt.user, student._id);
  assert.equal(lastSavedAttempt.correctCount, 2);
  assert.equal(lastSavedAttempt.questionCount, 3);
  assert.equal(result.body.data.answers[0].correctChoiceId, "a");
});

test("progress queries are scoped to the authenticated student", async () => {
  progressUserFilters = [];
  sampleModule = { _id: moduleId, title: "Foundations", slug: "foundations", order: 1 };
  sampleLesson = { _id: lessonId, module: moduleId, title: "First lesson", slug: "first-lesson", order: 1 };
  completedProgress = { lesson: lessonId, completed: true, completedAt: new Date() };
  LearningModule.find = () => query([sampleModule]);
  LearningLesson.find = () => query([sampleLesson, { ...sampleLesson, _id: exerciseId, slug: "second-lesson" }]);
  LearningQuiz.findOne = () => query(null);
  const result = await request(`/api/learning/progress/me?user=${otherStudent._id}`, { user: student });
  assert.equal(result.response.status, 200);
  assert.deepEqual(progressUserFilters, [student._id]);
  assert.equal(result.body.data[0].completedLessons, 1);
  assert.equal(result.body.data[0].totalLessons, 2);
  assert.equal(result.body.data[0].percentage, 50);
});

test("submission rate limit is 20 requests per student per minute", async () => {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const result = await request(`/api/learning/quizzes/${quizId}/submit`, {
      user: rateLimitStudent,
      method: "POST",
      body: {},
    });
    assert.equal(result.response.status, 400);
  }
  const limited = await request(`/api/learning/quizzes/${quizId}/submit`, {
    user: rateLimitStudent,
    method: "POST",
    body: {},
  });
  assert.equal(limited.response.status, 429);
  assert.ok(Number(limited.response.headers.get("retry-after")) > 0);
});

test("lesson completion is idempotently scoped to the authenticated student", async () => {
  sampleLesson = { _id: lessonId, path: pathId, module: moduleId, title: "First lesson", slug: "first-lesson" };
  const completedAt = new Date("2025-01-02T03:04:05.000Z");
  completedProgress = { lesson: lessonId, completed: true, completedAt, lastViewedAt: new Date() };
  LearningModule.find = () => query([]);
  LearningLesson.find = () => query([]);
  LearningLessonProgress.countDocuments = async (filter) => {
    assert.equal(filter.user, student._id);
    return 1;
  };
  LearningPathProgress.findOneAndUpdate = async () => ({});
  const result = await request(`/api/learning/lessons/${lessonId}/complete`, {
    user: student,
    method: "POST",
    body: {},
  });
  assert.equal(result.response.status, 200);
  assert.equal(result.body.data.completed, true);
  assert.equal(result.body.data.completedLessons, 1);
  assert.equal(result.body.data.percentage, 50);
  assert.equal(lessonProgressUpdate.filter.user, student._id);
  assert.equal(lessonProgressUpdate.update.$set.completedAt.getTime(), completedAt.getTime());
});
