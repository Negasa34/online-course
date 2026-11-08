const assert = require("node:assert/strict");
const { test } = require("node:test");
const course = require("../data/html5Course");
const LearningPath = require("../models/learningPath");
const LearningModule = require("../models/learningModule");
const LearningLesson = require("../models/learningLesson");
const LearningExercise = require("../models/learningExercise");
const LearningQuiz = require("../models/learningQuiz");
const LearningLessonProgress = require("../models/learningLessonProgress");
const LearningExerciseAttempt = require("../models/learningExerciseAttempt");
const LearningQuizAttempt = require("../models/learningQuizAttempt");
const LearningPathProgress = require("../models/learningPathProgress");
const {
  finalAssessmentQuestions,
  seedHtml5Course,
  stableKey,
} = require("../scripts/seed-html5-course");

const expectedLessonCounts = [
  10, 10, 13, 11, 10, 7, 10, 23, 14, 10, 12, 12, 10, 10, 0,
];
const expectedModuleSlugs = [
  "introduction-to-html",
  "html-document-structure",
  "html-text-elements",
  "links-and-navigation",
  "images-and-graphics",
  "html-lists",
  "html-tables",
  "html-forms",
  "semantic-html5",
  "html-multimedia",
  "html-advanced-elements",
  "accessibility-and-seo",
  "html-best-practices",
  "practical-html-projects",
  "final-html-assessment",
];
const expectedLessonTitles = [
  [
    "What is HTML?", "What is HTML5?", "How websites work", "HTML vs CSS vs JavaScript",
    "Setting up VS Code", "Creating your first HTML file", "Understanding HTML elements and tags",
    "Attributes and values", "Nesting HTML elements", "Your first webpage project",
  ],
  [
    "HTML document declaration", "The html element", "The head element", "The body element",
    "Page title", "Meta charset", "Viewport meta tag", "HTML comments",
    "Document structure best practices", "Practice project",
  ],
  [
    "Headings h1–h6", "Paragraphs", "Line breaks", "Horizontal rules", "Bold and strong",
    "Italic and emphasis", "Mark and highlighted text", "Small text", "Superscript and subscript",
    "Preformatted text", "Code and keyboard input elements", "Blockquote and quotations",
    "Text formatting project",
  ],
  [
    "Introduction to hyperlinks", "Anchor element", "Absolute URLs", "Relative URLs",
    "Opening links in a new tab safely", "Email links", "Telephone links", "Page section navigation",
    "Download links", "Navigation menus", "Build a multi-page website",
  ],
  [
    "Introduction to images", "Image element", "src and alt attributes", "Image dimensions",
    "Responsive images", "Figure and figcaption", "Picture element", "Image accessibility",
    "Common image mistakes", "Image gallery project",
  ],
  [
    "Ordered lists", "Unordered lists", "Description lists", "Nested lists", "List attributes",
    "Navigation using lists", "Build a structured list project",
  ],
  [
    "Introduction to tables", "Table element", "Table rows and cells", "Table headings",
    "Table captions", "thead, tbody and tfoot", "colspan", "rowspan", "Accessible tables",
    "Student timetable project",
  ],
  [
    "Introduction to HTML forms", "Form element", "Action and method", "Input element",
    "Text input", "Email input", "Password input", "Number input", "Date and time inputs",
    "Radio buttons", "Checkboxes", "Select dropdown", "Textarea", "Buttons", "Labels",
    "Placeholder", "Required fields", "Min and max", "Pattern validation", "Fieldset and legend",
    "Form accessibility", "Build a complete registration form", "Build a contact form",
  ],
  [
    "What is semantic HTML?", "Why semantic HTML matters", "Header", "Navigation", "Main",
    "Section", "Article", "Aside", "Footer", "Details and summary", "Time element",
    "Address element", "Semantic vs non-semantic elements", "Build a semantic blog layout",
  ],
  [
    "Introduction to multimedia", "Audio element", "Video element", "Audio controls",
    "Video controls", "Source element", "Multiple media formats", "Track and subtitles",
    "Embed external content safely", "Build a multimedia webpage",
  ],
  [
    "iframe", "Canvas introduction", "SVG introduction", "Progress element", "Meter element",
    "Dialog element", "Data element", "Template element", "Global HTML attributes",
    "Custom data attributes", "Useful HTML entities", "Special characters",
  ],
  [
    "Introduction to web accessibility", "Accessible page structure", "Image alternative text",
    "Accessible forms", "Keyboard navigation", "Semantic landmarks", "Heading hierarchy",
    "ARIA basics and when to use it", "Page title and meta description", "SEO-friendly HTML",
    "Accessibility testing", "Build an accessible webpage",
  ],
  [
    "Clean HTML code", "Proper indentation", "Naming and organization", "Valid HTML",
    "HTML validation", "Browser developer tools", "Common HTML errors", "Security considerations",
    "Maintainable HTML", "Professional HTML workflow",
  ],
  [
    "Personal profile webpage", "University student portfolio", "Online registration form",
    "Restaurant menu webpage", "Product information webpage", "Image gallery",
    "Student timetable", "Semantic blog homepage", "Accessible contact page",
    "Complete multi-page HTML portfolio website",
  ],
  [],
];

function createFakeModel(failOnceFor) {
  const documents = new Map();
  let nextId = 1;
  return {
    documents,
    async createIndexes() {},
    async findOneAndUpdate(filter, update) {
      if (failOnceFor && filter.seedKey === failOnceFor.key && !failOnceFor.failed) {
        failOnceFor.failed = true;
        throw new Error("simulated write failure");
      }
      const current = documents.get(filter.seedKey);
      const document = {
        ...(current || { _id: `fake-${nextId++}` }),
        ...update.$set,
      };
      documents.set(filter.seedKey, document);
      return document;
    },
  };
}

function fakeModels(failOnceFor) {
  return {
    LearningPath: createFakeModel(),
    LearningModule: createFakeModel(),
    LearningLesson: createFakeModel(),
    LearningExercise: createFakeModel(failOnceFor),
    LearningQuiz: createFakeModel(),
    LearningLessonProgress: createFakeModel(),
    LearningExerciseAttempt: createFakeModel(),
    LearningQuizAttempt: createFakeModel(),
    LearningPathProgress: createFakeModel(),
  };
}

const quietLogger = { info() {}, error() {} };

test("HTML5 course data contains substantive content for every specified lesson", () => {
  assert.equal(course.modules.length, 15);
  assert.deepEqual(course.modules.map((module) => module.lessons.length), expectedLessonCounts);
  assert.deepEqual(course.modules.map((module) => module.slug), expectedModuleSlugs);
  assert.deepEqual(
    course.modules.map((module) => module.lessons.map((lesson) => lesson.title)),
    expectedLessonTitles
  );
  assert.equal(course.title, "HTML5 – Complete Web Development Course");

  const allLessons = course.modules.flatMap((module) => module.lessons);
  assert.equal(allLessons.length, 162);
  for (const module of course.modules) {
    assert.ok(module.title && module.summary.length >= 40);
    assert.ok(module.objectives.length >= 2);
    for (const lesson of module.lessons) {
      assert.ok(lesson.title && lesson.slug);
      assert.ok(lesson.introduction.length >= 40, lesson.slug);
      assert.ok(lesson.objectives.length >= 2, lesson.slug);
      assert.ok(lesson.explanation.length >= 2, lesson.slug);
      assert.ok(lesson.explanation.join(" ").split(/\s+/).length >= 70, lesson.slug);
      assert.ok(lesson.terminology.length >= 1, lesson.slug);
      assert.ok(lesson.syntax.length >= 10, lesson.slug);
      assert.ok(lesson.codeExample.code.length >= 10, lesson.slug);
      assert.ok(lesson.codeExample.lines.length >= 1, lesson.slug);
      assert.ok(lesson.codeExample.output.length >= 5, lesson.slug);
      assert.ok(lesson.commonMistakes.length >= 2, lesson.slug);
      assert.ok(lesson.bestPractices.length >= 2, lesson.slug);
      assert.ok(lesson.summary.length >= 30, lesson.slug);
      assert.ok(lesson.exercise.instructions.length >= 30, lesson.slug);
      assert.ok(lesson.exercise.starterCode.length > 0, lesson.slug);
      assert.ok(lesson.exercise.requirements.length >= 1, lesson.slug);
      assert.ok(lesson.exercise.hints.length >= 2, lesson.slug);
      assert.ok(lesson.exercise.solutionCode.length > 0, lesson.slug);
      assert.ok(lesson.exercise.solutionExplanation.length >= 30, lesson.slug);
      assert.ok(lesson.quiz.length >= 3 && lesson.quiz.length <= 5, lesson.slug);
      assert.doesNotMatch(
        `${lesson.introduction} ${lesson.explanation.join(" ")}`,
        /content coming soon|add explanation here|placeholder content/i,
        lesson.slug
      );
      for (const question of lesson.quiz) {
        assert.ok(["multiple-choice", "true-false", "code-output"].includes(question.type), lesson.slug);
        assert.ok(question.prompt.length >= 20, lesson.slug);
        assert.ok(question.explanation.length >= 20, lesson.slug);
        assert.ok(question.choices.length >= 2, lesson.slug);
        assert.ok(question.choices.some((choice) => choice.id === question.correctChoiceId), lesson.slug);
      }
    }
  }

  const projects = course.modules.find((module) => module.slug === "practical-html-projects");
  assert.equal(projects.lessons.length, 10);
  for (const lesson of projects.lessons) {
    const project = lesson.project || lesson.exercise.project;
    assert.ok(project, lesson.slug);
    assert.ok(project.description?.length >= 30, lesson.slug);
    assert.ok(project.learningObjectives?.length >= 2, lesson.slug);
    assert.ok(project.requirements?.length >= 3, lesson.slug);
    assert.ok(project.steps?.length >= 4, lesson.slug);
    assert.ok(project.expectedOutput?.length >= 20, lesson.slug);
    assert.ok(project.solutionCode?.length >= 30, lesson.slug);
    assert.ok(project.solutionExplanation?.length >= 40, lesson.slug);
    assert.ok(project.evaluationChecklist?.length >= 3, lesson.slug);
  }
});

test("learning schemas validate content and use collections distinct from instructor progress", async () => {
  const validQuiz = new LearningQuiz({
    seedKey: "test-quiz",
    path: "507f1f77bcf86cd799439011",
    scope: "lesson",
    title: "Test quiz",
    lesson: "507f1f77bcf86cd799439012",
    questions: Array.from({ length: 3 }, (_, index) => ({
      questionKey: `q${index}`,
      type: "multiple-choice",
      prompt: "Which element describes the page's main heading?",
      choices: [{ id: "a", text: "h1" }, { id: "b", text: "div" }],
      correctChoiceId: "a",
      explanation: "The h1 element is the top-level heading for the content.",
    })),
  });
  await assert.doesNotReject(validQuiz.validate());

  const invalidQuiz = new LearningQuiz({
    seedKey: "invalid-quiz",
    path: "507f1f77bcf86cd799439011",
    scope: "lesson",
    title: "Invalid quiz",
    questions: [{
      questionKey: "bad",
      type: "multiple-choice",
      prompt: "A question",
      choices: [{ id: "a", text: "First" }, { id: "b", text: "Second" }],
      correctChoiceId: "missing",
      explanation: "An explanation",
    }, ...validQuiz.questions.slice(1)],
  });
  await assert.rejects(invalidQuiz.validate());

  assert.equal(LearningPath.collection.name, "learningpaths");
  assert.equal(LearningModule.collection.name, "learningmodules");
  assert.equal(LearningLesson.collection.name, "learninglessons");
  assert.equal(LearningExercise.collection.name, "learningexercises");
  assert.equal(LearningQuiz.collection.name, "learningquizzes");
  assert.notEqual(LearningLessonProgress.collection.name, "lessonprogresses");
  assert.equal(LearningExerciseAttempt.collection.name, "learningexerciseattempts");
  assert.equal(LearningQuizAttempt.collection.name, "learningquizattempts");
  assert.equal(LearningPathProgress.collection.name, "learningpathprogresses");
  assert.ok(LearningLessonProgress.schema.indexes().some(([fields, options]) =>
    fields.user === 1 && fields.lesson === 1 && options.unique
  ));
});

test("final assessment has the requested question mix and five practical challenges", () => {
  const questions = finalAssessmentQuestions(course.modules);
  assert.equal(questions.filter((question) => question.type === "multiple-choice").length, 30);
  assert.equal(questions.filter((question) => question.type === "true-false").length, 10);
  assert.equal(questions.filter((question) => question.type === "code-output").length, 10);
  assert.equal(questions.filter((question) => question.type === "practical").length, 5);
  assert.equal(questions.length, 55);
  assert.equal(new Set(questions.map((question) => question.questionKey)).size, questions.length);
});

test("HTML5 seed is repeatable and never writes student progress collections", async () => {
  const models = fakeModels();
  const first = await seedHtml5Course({ modelSet: models, logger: quietLogger });
  assert.deepEqual(first.failed, []);
  assert.deepEqual(first.succeeded, {
    paths: 1,
    modules: 15,
    lessons: 162,
    exercises: 162,
    quizzes: 177,
  });

  const collectionSizes = Object.fromEntries(
    Object.entries(models).map(([name, model]) => [name, model.documents.size])
  );
  const originalIds = new Map(
    [...models.LearningLesson.documents].map(([key, value]) => [key, value._id])
  );
  const second = await seedHtml5Course({ modelSet: models, logger: quietLogger });
  assert.deepEqual(second.failed, []);
  for (const [name, model] of Object.entries(models)) {
    assert.equal(model.documents.size, collectionSizes[name], `${name} must not gain duplicates`);
  }
  for (const [key, value] of models.LearningLesson.documents) {
    assert.equal(value._id, originalIds.get(key), "Reruns update owned documents instead of replacing them");
  }
  assert.equal(models.LearningLessonProgress.documents.size, 0);
  assert.equal(models.LearningExerciseAttempt.documents.size, 0);
  assert.equal(models.LearningQuizAttempt.documents.size, 0);
  assert.equal(models.LearningPathProgress.documents.size, 0);
});

test("incomplete course data is rejected before the seed creates any records", async () => {
  const models = fakeModels();
  const incompleteCourse = { ...course, modules: course.modules.slice(0, 1) };
  const summary = await seedHtml5Course({
    modelSet: models,
    courseData: incompleteCourse,
    logger: quietLogger,
  });
  assert.ok(summary.failed.some((failure) => failure.kind === "course content validation"));
  for (const model of Object.values(models)) {
    assert.equal(model.documents.size, 0);
  }
});

test("seed reports partial write failures and can safely retry them", async () => {
  const firstLessonSlug = course.modules.find((module) => module.lessons.length).lessons[0].slug;
  const failedSeedKey = stableKey("exercise", firstLessonSlug);
  const models = fakeModels({ key: failedSeedKey, failed: false });
  const first = await seedHtml5Course({ modelSet: models, logger: quietLogger });
  assert.ok(first.failed.some((failure) => failure.seedKey === failedSeedKey));
  assert.ok(first.skipped.some((item) => item.seedKey === failedSeedKey));

  const retry = await seedHtml5Course({ modelSet: models, logger: quietLogger });
  assert.deepEqual(retry.failed, []);
  assert.equal(models.LearningExercise.documents.size, 162);
  assert.equal(models.LearningPathProgress.documents.size, 0);
});
