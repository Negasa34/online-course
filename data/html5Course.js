const moduleGroups = [
  require("./html5Modules1"),
  require("./html5Modules6"),
  require("./html5Modules11"),
];

const finalAssessmentModule = {
  slug: "final-html-assessment",
  title: "Final HTML Assessment",
  summary: "Demonstrate practical command of HTML structure, content, forms, semantics, accessibility, and professional workflow.",
  objectives: [
    "Apply semantic and accessible HTML patterns to unfamiliar problems.",
    "Interpret HTML examples and predict their browser-visible structure.",
    "Demonstrate course mastery through objective questions and practical challenges.",
  ],
  lessons: [],
  isFinalAssessmentModule: true,
};

const modules = [...moduleGroups.flat(), finalAssessmentModule];

module.exports = {
  slug: "html5-complete-web-development-course",
  title: "HTML5 – Complete Web Development Course",
  subtitle: "Learn HTML from absolute beginner to professional level through structured lessons, practical coding exercises, quizzes, and real-world projects.",
  description: "A comprehensive English-language course that teaches modern HTML from first principles through accessible forms, semantic documents, multimedia, best practices, and portfolio-ready projects. Learners practice with guided exercises, module assessments, and a final portfolio challenge.",
  language: "English",
  contentVersion: 1,
  targetAudience: [
    "Absolute beginners",
    "University students",
    "Self-taught developers",
    "Learners preparing for frontend development",
  ],
  modules,
};
