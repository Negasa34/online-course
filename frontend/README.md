# LearnHub frontend

LearnHub is the React and Vite frontend for the existing course API. It does not create or replace any backend services.

## Run locally

From this directory:

```sh
npm install
npm run dev
```

The frontend expects the backend API at `http://localhost:5000/api` by default. To use a different API URL, set `VITE_API_URL` in a frontend-only `.env` file, for example:

```env
VITE_API_URL=http://localhost:5000/api
```

Do not place backend secrets in the frontend environment. The backend must allow the frontend origin in its own CORS configuration.

## API integration

- `GET /api/courses` supplies published courses for the home page and catalog.
- `GET /api/courses/:id` supplies published course details.
- `POST /api/auth/register` and `POST /api/auth/login` provide the JWT and user data.
- `GET /api/auth/me` restores the user session when a token exists.
- `POST`, `PATCH`, and `DELETE /api/courses` provide the existing instructor/admin course-management operations.
- `POST /api/enrollments/:courseId` enrolls the authenticated user in a published course.
- `GET /api/enrollments/my-courses` returns the authenticated user's enrolled courses. The frontend exposes these at `#/my-courses`.
- `GET/PATCH /api/users/me` reads and updates the authenticated user's allowed profile fields; `PATCH /api/users/me/password` changes the password after current-password verification.
- `POST /api/instructor-applications` creates a student account and pending instructor application; `GET /api/instructor-applications/me` reads the signed-in user's application.
- Admin APIs at `/api/admin` provide dashboard counts, paginated users/applications, application review, and account activation/deactivation. Role dashboards are at `/api/dashboards/instructor` and `/api/dashboards/student`.
- Instructor and administrator curriculum tools use `/api/curriculum/courses/:courseId/sections` to manage ordered sections and lessons. The student player uses `/api/curriculum/courses/:courseId/learning`; enrolled-student progress and resume data are available at `/api/curriculum/my-progress`.
- Video uploads are sent as authenticated multipart requests to the backend and stored as authenticated Cloudinary video assets. Configure `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in the backend `.env` file. `CLOUDINARY_FOLDER` is optional. Never add Cloudinary credentials to frontend environment variables. Uploads accept MP4, MOV, or WebM files up to 500 MB.

To bootstrap or restore an administrator, create the account through ordinary registration, then run `npm run bootstrap-admin -- your-email@example.com` from the project root and confirm the exact prompt. The command only runs when no active administrator exists.

`npm run seed` seeds the sample courses only after an active instructor has an approved instructor application. It no longer creates a hardcoded instructor account or password. Profile photos and portfolio links currently accept HTTPS URLs; no file-upload service is configured.

Backend startup explicitly ensures the unique enrollment and instructor-application indexes. If existing enrollment data contains duplicate user/course pairs, remove or reconcile those duplicates before restarting so MongoDB can create the unique index.

The instructor dashboard lists the signed-in instructor's courses, and the backend verifies ownership before any course or curriculum change.
