# Learning Path API

The Learning Path API is mounted at `/api/learning` and uses the existing MongoDB connection. Its `LearningPath`, module, lesson, quiz, exercise, and progress models are separate from the instructor-created course and enrollment models.

## Endpoints

Published curriculum reads are public. Student progress and submissions require the existing JWT bearer token and `STUDENT` role.

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
| POST | `/quizzes/:quizId/submit` | Student; rate limited |
| GET | `/progress/me` | Student |

Submission endpoints accept JSON. Quiz submissions use `{ "answers": [{ "questionKey": "...", "choiceId": "..." }] }`; practical questions use a `response` string. Exercise submissions use `{ "html": "..." }`.

## Security and progress behavior

- Public serializers whitelist quiz question fields and omit answer keys, explanations, practical evaluation criteria, and solutions. Lesson and exercise serializers also omit hidden machine-check requirements and stored solution material.
- Quiz answers and explanations are returned only after that student submits the quiz. Practical assessment responses are saved but excluded from the automatically scored percentage.
- All progress queries and writes include the authenticated user ID. Lesson completion and visit updates use upserts and do not require MongoDB transactions.
- Bookmarks are keyed by student and lesson with a unique index; the API supports idempotent `bookmarked: true|false` updates and only returns the authenticated student's saved lessons.
- Exercise HTML is parsed, not executed, on the backend. The frontend preview is an empty-sandbox iframe with a restrictive Content Security Policy and no authentication token access.
- Quiz and exercise submissions are limited to 20 requests per authenticated student per minute per server process. The in-memory tracker is capped at 10,000 active student keys and rejects new keys temporarily when full.
- Progress percentage reports completed lessons; module and assessment completion are reported separately.

The in-memory limiter resets on server restart and each backend instance counts independently. A shared atomic store such as Redis is appropriate if LearnHub is deployed with multiple backend instances or needs limits to survive restarts; it is not required for the current single-instance setup.

Practical exercise checking is structural: the backend parses HTML and evaluates stored selectors/text/attribute constraints without executing learner code. Before submission, the API provides the task instructions and hints but not those machine-check constraints. Results report per-check pass/fail after submission; this is not browser rendering, accessibility, or security review of learner markup.
