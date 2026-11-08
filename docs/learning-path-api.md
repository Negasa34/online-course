# Learning Path API

The Learning Path API is mounted at `/api/learning` and uses the existing MongoDB connection. Its `LearningPath`, module, lesson, quiz, exercise, and progress models are separate from the instructor-created course and enrollment models.

## Endpoints

Published curriculum catalog and outline reads are public. Content reads for paths with prerequisites require the existing JWT bearer token, `STUDENT` role, and completed prerequisites. Student progress and submissions require the existing JWT bearer token and `STUDENT` role.

| Method | Endpoint | Access |
|---|---|---|
| GET | `/paths` | Public |
| GET | `/paths/:pathSlug` | Public |
| GET | `/paths/:pathSlug/modules` | Public |
| GET | `/modules/:moduleId` | Public |
| GET | `/modules/:moduleId/lessons` | Public |
| GET | `/lessons/:lessonId` | Public |
| GET | `/lessons/:lessonId/exercises` | Public |
| GET | `/lessons/:lessonId/quiz` | Public |
| GET | `/modules/:moduleId/assessment` | Public |
| GET | `/paths/:pathSlug/assessment` | Public |
| GET | `/quizzes/:quizId` | Public |
| GET | `/paths/:pathSlug/projects` | Student |
| GET | `/bookmarks/me` | Student |
| PATCH | `/lessons/:lessonId/visit` | Student |
| POST | `/lessons/:lessonId/complete` | Student |
| PUT | `/lessons/:lessonId/bookmark` | Student |
| POST | `/exercises/:exerciseId/submit` | Student; rate limited |
| POST | `/exercises/:exerciseId/reference-solution` | Student; explicit self-check confirmation; rate limited |
| POST | `/quizzes/:quizId/submit` | Student; rate limited |
| GET | `/progress/me` | Student |

Submission endpoints accept JSON. Quiz submissions use `{ "answers": [{ "questionKey": "...", "choiceId": "..." }] }`; short-answer and practical questions use a `response` string. Only objective multiple-choice, true/false, and code-output questions contribute to the automatic score. Exercise HTML submissions use `{ "html": "..." }`.

Python Fundamentals exercises use `language: "python"`, starter code, hints, and local `selfChecks`. The existing HTML submission route rejects Python exercises. LearnHub does not execute or verify Python code. A signed-in student may explicitly request a Python reference solution by posting `{ "confirmSelfCheck": true }` to the reference-solution endpoint; this request does not create a submission or progress record.

Learning Path responses include optional track metadata, prerequisite slugs, and an access summary. Catalog and module outlines remain visible; content-bearing routes return `401 STUDENT_AUTHENTICATION_REQUIRED` when sign-in is needed and `403 LEARNING_PREREQUISITE_REQUIRED` with required/incomplete slugs when prerequisites are unmet. Paths without prerequisites, including the existing HTML5 path, keep their current access behavior.

## Security and progress behavior

- Public serializers whitelist quiz question fields and omit answer keys, explanations, practical evaluation criteria, and solutions. Lesson and exercise serializers also omit hidden machine-check requirements and stored solution material.
- Quiz answer keys, rubrics, and explanations are omitted before submission. After submission, objective explanations are returned. Short-answer and practical responses are stored for review but excluded from the automatically scored percentage.
- All progress queries and writes include the authenticated user ID. Lesson completion and visit updates use upserts and do not require MongoDB transactions.
- Bookmarks are keyed by student and lesson with a unique index; the API supports idempotent `bookmarked: true|false` updates and only returns the authenticated student's saved lessons.
- Exercise HTML is parsed, not executed, on the backend. The frontend preview is an empty-sandbox iframe with a restrictive Content Security Policy and no authentication token access.
- Quiz and exercise submissions are limited to 20 requests per authenticated student per minute per server process. The in-memory tracker is capped at 10,000 active student keys and rejects new keys temporarily when full.
- Progress percentage reports completed lessons; module and assessment completion are reported separately. The default completion policy still requires lessons, assessments, and passed project exercises. Python Fundamentals uses a path-specific policy requiring all lessons and module/final assessments; locally self-checked projects are not represented as machine-verified passes.

The in-memory limiter resets on server restart and each backend instance counts independently. A shared atomic store such as Redis is appropriate if LearnHub is deployed with multiple backend instances or needs limits to survive restarts; it is not required for the current single-instance setup.

Practical exercise checking is structural: the backend parses HTML and evaluates stored selectors/text/attribute constraints without executing learner code. Before submission, the API provides the task instructions and hints but not those machine-check constraints. Results report per-check pass/fail after submission; this is not browser rendering, accessibility, or security review of learner markup.
