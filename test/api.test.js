const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { after, before, test } = require("node:test");

process.env.JWT_SECRET = "day-seven-test-secret-with-at-least-32-characters";
process.env.CORS_ORIGINS = "http://localhost:5173";

const { app } = require("../server");
const User = require("../models/user");
const Course = require("../models/courses");
const Enrollment = require("../models/enrollment");
const InstructorApplication = require("../models/instructorApplication");
const CourseSection = require("../models/courseSection");
const LessonProgress = require("../models/lessonProgress");
const errorHandler = require("../middleware/errorHandler");

const users = new Map();
const courses = new Map();
const enrollments = new Map();
const applications = new Map();
const sections = new Map();
const lessonProgress = new Map();
let nextId = 1;
let httpServer;
let baseUrl;

function newId() {
  return (nextId++).toString(16).padStart(24, "0");
}

function makeUser(userData) {
  const user = {
    _id: userData._id || newId(),
    name: userData.name,
    email: userData.email,
    passwordHash: userData.passwordHash,
    role: userData.role || "STUDENT",
    instructorApprovedAt: Object.hasOwn(userData, "instructorApprovedAt")
      ? userData.instructorApprovedAt
      : userData.role === "INSTRUCTOR" ? new Date() : null,
    accountStatus: userData.accountStatus || "ACTIVE",
    createdAt: userData.createdAt || new Date(),
    profileImage: userData.profileImage || "",
    bio: userData.bio || "",
    save: async function save() {
      users.set(this.email, this);
      return this;
    },
  };
  users.set(user.email, user);
  return user;
}

function findUserById(id) {
  const user = [...users.values()].find((candidate) => candidate._id === id) || null;
  const query = Promise.resolve(user);
  query.select = () => query;
  return query;
}

function createCourseDocument(courseData) {
  const course = {
    _id: courseData._id || newId(),
    title: courseData.title,
    slug: courseData.slug,
    description: courseData.description,
    price: courseData.price === undefined ? 0 : courseData.price,
    published: courseData.published === undefined ? false : courseData.published,
    instructor: courseData.instructor || null,
    createdAt: courseData.createdAt || new Date(),
    set(updates) {
      Object.assign(this, updates);
    },
    async save() {
      if ([...courses.values()].some(
        (candidate) => candidate.slug === this.slug && candidate._id !== this._id
      )) {
        const error = new Error("Duplicate slug");
        error.code = 11000;
        throw error;
      }
      courses.set(this._id, this);
      return this;
    },
    async deleteOne() {
      courses.delete(this._id);
    },
  };
  courses.set(course._id, course);
  return course;
}

async function request(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, options);
  const body = await response.json();
  return { response, body };
}

function jsonOptions(method, body, token) {
  return {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  };
}

function tokenFor(user) {
  return jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

before(async () => {
  User.findOne = (filter) => {
    const query = Promise.resolve(
      [...users.values()].find((user) => user.email === filter.email) || null
    );
    query.select = () => query;
    return query;
  };
  User.findById = findUserById;
  User.create = async (userData) => {
    if ([...users.values()].some((user) => user.email === userData.email)) {
      const error = new Error("Duplicate email");
      error.code = 11000;
      throw error;
    }
    return makeUser(userData);
  };
  User.deleteOne = async ({ _id }) => {
    for (const [email, user] of users) {
      if (user._id === String(_id)) users.delete(email);
    }
  };
  User.countDocuments = async (filter = {}) => {
    let matching = [...users.values()];
    if (filter.role) matching = matching.filter((user) => user.role === filter.role);
    if (filter.instructorApprovedAt?.$ne === null) {
      matching = matching.filter((user) => user.instructorApprovedAt !== null);
    }
    if (filter.accountStatus?.$ne) {
      matching = matching.filter((user) => user.accountStatus !== filter.accountStatus.$ne);
    }
    return matching.length;
  };
  User.find = (filter = {}) => {
    let matching = [...users.values()];
    if (filter.role) matching = matching.filter((user) => user.role === filter.role);
    if (filter.$or) {
      matching = matching.filter((user) => filter.$or.some((condition) => {
        const field = Object.keys(condition)[0];
        return condition[field].test(user[field] || "");
      }));
    }
    const query = {
      select() { return this; },
      sort() { return this; },
      skip() { return this; },
      limit(limit) { this.items = matching.slice(0, limit); return this; },
      then(resolve, reject) { return Promise.resolve(this.items || matching).then(resolve, reject); },
    };
    return query;
  };

  Course.find = (filter = {}) => {
    let matching = [...courses.values()]
      .filter((course) => filter.published === undefined || course.published === filter.published)
      .filter((course) => !filter.instructor || String(course.instructor) === String(filter.instructor));
    if (filter.$or) {
      matching = matching.filter((course) => filter.$or.some((condition) => {
        const field = Object.keys(condition)[0];
        return condition[field].test(course[field] || "");
      }));
    }
    const query = {
      populate() { return this; },
      sort() { return this; },
      skip(offset) { this.items = matching.slice(offset); return this; },
      limit(limit) { this.items = (this.items || matching).slice(0, limit); return this; },
      then(resolve, reject) {
        const items = this.items || matching;
        items.sort((left, right) => right.createdAt - left.createdAt);
        return Promise.resolve(items).then(resolve, reject);
      },
    };
    return query;
  };
  Course.findById = async (id) => courses.get(id) || null;
  Course.create = async (data) => {
    if ([...courses.values()].some((course) => course.slug === data.slug)) {
      const error = new Error("Duplicate slug");
      error.code = 11000;
      throw error;
    }
    return createCourseDocument(data);
  };
  Course.countDocuments = async (filter = {}) => [...courses.values()].filter((course) => (
    (filter.published === undefined || course.published === filter.published) &&
    (!filter.instructor || String(course.instructor) === String(filter.instructor))
  )).length;
  CourseSection.find = (filter = {}) => {
    const matching = [...sections.values()].filter((section) =>
      String(section.course) === String(filter.course)
    );
    return {
      sort() { return this; },
      then(resolve, reject) { return Promise.resolve(matching).then(resolve, reject); },
    };
  };
  CourseSection.deleteMany = async (filter = {}) => {
    for (const [id, section] of sections) {
      if (String(section.course) === String(filter.course)) sections.delete(id);
    }
  };
  LessonProgress.deleteMany = async (filter = {}) => {
    for (const [id, progress] of lessonProgress) {
      if (String(progress.course) === String(filter.course)) lessonProgress.delete(id);
    }
  };
  Enrollment.findOne = async (filter) => (
    [...enrollments.values()].find(
      (enrollment) =>
        enrollment.user === filter.user && enrollment.course === filter.course
    ) || null
  );
  Enrollment.create = async (data) => {
    if ([...enrollments.values()].some(
      (enrollment) =>
        enrollment.user === data.user && enrollment.course === data.course
    )) {
      const error = new Error("Duplicate enrollment");
      error.code = 11000;
      throw error;
    }

    const enrollment = {
      _id: newId(),
      ...data,
      createdAt: new Date(),
    };
    enrollments.set(enrollment._id, enrollment);
    return enrollment;
  };
  Enrollment.find = (filter) => {
    const query = {
      populate(field) {
        this.populateFields ||= [];
        this.populateFields.push(field);
        return this;
      },
      sort() {
        return this;
      },
      then(resolve, reject) {
        const matching = [...enrollments.values()].filter((enrollment) => (
          filter.user
            ? enrollment.user === filter.user
            : filter.course?.$in?.some((id) => String(id) === enrollment.course)
        ))
          .map((enrollment) => ({
            ...enrollment,
            ...(this.populateFields?.includes("course") ? { course: courses.get(enrollment.course) } : {}),
            ...(this.populateFields?.includes("user") ? { user: [...users.values()].find((user) => user._id === enrollment.user) } : {}),
          }))
          .sort((left, right) => right.createdAt - left.createdAt);
        return Promise.resolve(matching).then(resolve, reject);
      },
    };
    return query;
  };
  Enrollment.countDocuments = async (filter = {}) => [...enrollments.values()].filter((enrollment) => {
    if (filter.user) return enrollment.user === filter.user;
    if (filter.course?.$in) return filter.course.$in.some((id) => String(id) === enrollment.course);
    return true;
  }).length;
  Enrollment.distinct = async (field, filter) => [...new Set([...enrollments.values()]
    .filter((enrollment) => filter.course.$in.some((id) => String(id) === enrollment.course))
    .map((enrollment) => enrollment[field]))];
  InstructorApplication.findOne = async (filter) => (
    [...applications.values()].find((application) => application.user === filter.user) || null
  );
  InstructorApplication.create = async (data) => {
    if ([...applications.values()].some((application) => application.user === data.user)) {
      const error = new Error("Duplicate application");
      error.code = 11000;
      throw error;
    }
    const application = {
      _id: newId(),
      status: "PENDING",
      createdAt: new Date(),
      ...data,
      save: async function save() { applications.set(this._id, this); return this; },
    };
    applications.set(application._id, application);
    return application;
  };
  InstructorApplication.findById = async (id) => applications.get(String(id)) || null;
  InstructorApplication.findOneAndUpdate = async (filter, update) => {
    const application = applications.get(String(filter._id));
    if (!application || application.status !== filter.status) return null;
    Object.assign(application, update.$set);
    return application;
  };
  InstructorApplication.countDocuments = async (filter = {}) => [...applications.values()]
    .filter((application) => !filter.status || application.status === filter.status).length;
  InstructorApplication.find = (filter = {}) => {
    const matching = [...applications.values()]
      .filter((application) => !filter.status || application.status === filter.status);
    const query = {
      populate() { return this; },
      sort() { return this; },
      skip(offset) { this.items = matching.slice(offset); return this; },
      limit(limit) { this.items = (this.items || matching).slice(0, limit); return this; },
      then(resolve, reject) { return Promise.resolve(this.items || matching).then(resolve, reject); },
    };
    return query;
  };

  await new Promise((resolve) => {
    httpServer = app.listen(0, "127.0.0.1", resolve);
  });
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});

after(async () => {
  if (httpServer) {
    await new Promise((resolve, reject) => {
      httpServer.close((error) => error ? reject(error) : resolve());
    });
  }
});

test("auth, course CRUD, RBAC, validation, CORS, and safe errors", async () => {
  assert.equal((await request("/api/health")).response.status, 200);
  assert.equal(Enrollment.schema.options.timestamps, true);
  assert.ok(Enrollment.schema.indexes().some(([fields, options]) => (
    fields.user === 1 && fields.course === 1 && options.unique === true
  )));

  const registration = await request(
    "/api/auth/register",
    jsonOptions("POST", {
      name: "Day Seven Student",
      email: "student@example.test",
      password: "StudentPass123!",
      confirmPassword: "StudentPass123!",
      termsAccepted: true,
      role: "ADMIN",
    })
  );
  assert.equal(registration.response.status, 201);
  assert.equal(registration.body.data.role, "STUDENT");
  assert.equal("passwordHash" in registration.body.data, false);
  assert.equal("password" in registration.body, false);

  const studentToken = registration.body.token;
  const login = await request(
    "/api/auth/login",
    jsonOptions("POST", {
      email: "STUDENT@example.test",
      password: "StudentPass123!",
    })
  );
  assert.equal(login.response.status, 200);
  assert.equal(login.body.data.role, "STUDENT");

  const duplicateEmail = await request(
    "/api/auth/register",
    jsonOptions("POST", {
      name: "Duplicate Student",
      email: "student@example.test",
      password: "StudentPass123!",
      confirmPassword: "StudentPass123!",
      termsAccepted: true,
    })
  );
  assert.equal(duplicateEmail.response.status, 409);

  const invalidRegistration = await request(
    "/api/auth/register",
    jsonOptions("POST", { name: "x", email: "bad", password: "short" })
  );
  assert.equal(invalidRegistration.response.status, 400);
  const missingTerms = await request(
    "/api/auth/register",
    jsonOptions("POST", {
      name: "No Terms",
      email: "no-terms@example.test",
      password: "StudentPass123!",
      confirmPassword: "StudentPass123!",
    })
  );
  assert.equal(missingTerms.response.status, 400);
  const missingRegistration = await request(
    "/api/auth/register",
    jsonOptions("POST", null)
  );
  assert.equal(missingRegistration.response.status, 400);
  const missingLogin = await request(
    "/api/auth/login",
    jsonOptions("POST", {})
  );
  assert.equal(missingLogin.response.status, 400);
  const wrongPassword = await request(
    "/api/auth/login",
    jsonOptions("POST", {
      email: "student@example.test",
      password: "WrongPassword123!",
    })
  );
  assert.equal(wrongPassword.response.status, 401);

  const me = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${studentToken}` },
  });
  assert.equal(me.response.status, 200);
  assert.equal(me.body.data.email, "student@example.test");

  const profileUpdate = await request(
    "/api/users/me",
    jsonOptions("PATCH", {
      name: "Updated Student",
      bio: "Learning accessible web development.",
      location: "Remote",
      interests: ["JavaScript", "Accessibility"],
    }, studentToken)
  );
  assert.equal(profileUpdate.response.status, 200);
  assert.equal(profileUpdate.body.data.name, "Updated Student");
  assert.equal(
    (await request("/api/users/me", jsonOptions("PATCH", { role: "ADMIN" }, studentToken))).response.status,
    400
  );
  const existingStudentApplication = await request(
    "/api/instructor-applications/me",
    jsonOptions("POST", {
      professionalTitle: "Web development instructor",
      biography: "I help learners build accessible, reliable web applications.",
      expertise: ["JavaScript", "Accessibility"],
      teachingExperience: "I have mentored new developers for several years.",
      qualifications: ["Accessibility certification"],
      portfolioLinks: [],
    }, studentToken)
  );
  assert.equal(existingStudentApplication.response.status, 201);
  assert.equal(users.get("student@example.test").role, "STUDENT");
  assert.equal((await request("/api/instructor-applications/me", {
    headers: { Authorization: `Bearer ${studentToken}` },
  })).response.status, 200);
  assert.equal(
    (await request("/api/instructor-applications/me", jsonOptions("POST", {
      professionalTitle: "Another application",
      biography: "I help learners build accessible, reliable web applications.",
      expertise: ["JavaScript"],
      teachingExperience: "Several years.",
      qualifications: ["Certificate"],
      portfolioLinks: [],
    }, studentToken))).response.status,
    409
  );
  const invalidProfileImage = await request(
    "/api/users/me",
    jsonOptions("PATCH", { profileImage: "javascript:alert(1)" }, studentToken)
  );
  assert.equal(invalidProfileImage.response.status, 400);
  const passwordChange = await request(
    "/api/users/me/password",
    jsonOptions("PATCH", {
      currentPassword: "StudentPass123!",
      newPassword: "NewStudentPass123!",
      confirmPassword: "NewStudentPass123!",
    }, studentToken)
  );
  assert.equal(passwordChange.response.status, 200);
  assert.equal((await request(
    "/api/auth/login",
    jsonOptions("POST", { email: "student@example.test", password: "NewStudentPass123!" })
  )).response.status, 200);
  assert.equal((await request(
    "/api/auth/login",
    jsonOptions("POST", { email: "student@example.test", password: "StudentPass123!" })
  )).response.status, 401);

  for (const authorization of [undefined, "Bearer invalid-token"]) {
    const response = await request("/api/auth/me", {
      headers: authorization ? { Authorization: authorization } : {},
    });
    assert.equal(response.response.status, 401);
  }
  const expiredToken = jwt.sign(
    { userId: registration.body.data.id },
    process.env.JWT_SECRET,
    { expiresIn: "0s" }
  );
  const expired = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${expiredToken}` },
  });
  assert.equal(expired.response.status, 401);

  const instructor = makeUser({
    name: "Instructor One",
    email: "instructor@example.test",
    passwordHash: await bcrypt.hash("InstructorPass123!", 4),
    role: "INSTRUCTOR",
  });
  const otherInstructor = makeUser({
    name: "Instructor Two",
    email: "other-instructor@example.test",
    passwordHash: await bcrypt.hash("InstructorPass123!", 4),
    role: "INSTRUCTOR",
  });
  const admin = makeUser({
    name: "Admin",
    email: "admin@example.test",
    passwordHash: await bcrypt.hash("AdminPass123!", 4),
    role: "ADMIN",
  });
  const instructorToken = tokenFor(instructor);
  const otherInstructorToken = tokenFor(otherInstructor);
  const adminToken = tokenFor(admin);

  const legacyInstructor = makeUser({
    name: "Legacy Instructor",
    email: "legacy-instructor@example.test",
    passwordHash: await bcrypt.hash("LegacyInstructorPass123!", 4),
    role: "INSTRUCTOR",
    instructorApprovedAt: null,
  });
  const legacyInstructorToken = tokenFor(legacyInstructor);
  assert.equal(
    (await request("/api/dashboards/instructor", {
      headers: { Authorization: `Bearer ${legacyInstructorToken}` },
    })).response.status,
    403
  );
  const legacyApplication = await request(
    "/api/instructor-applications/me",
    jsonOptions("POST", {
      professionalTitle: "Legacy web educator",
      biography: "I have taught web development and accessible interface design.",
      expertise: ["Web development"],
      teachingExperience: "Several years of teaching and mentoring developers.",
      qualifications: ["Web development certificate"],
      portfolioLinks: [],
    }, legacyInstructorToken)
  );
  assert.equal(legacyApplication.response.status, 201);
  const legacyApproval = await request(
    `/api/admin/instructor-applications/${legacyApplication.body.data.id}`,
    jsonOptions("PATCH", { status: "APPROVED" }, adminToken)
  );
  assert.equal(legacyApproval.response.status, 200);
  assert.ok(legacyInstructor.instructorApprovedAt);

  const pendingApplication = await request(
    "/api/instructor-applications",
    jsonOptions("POST", {
      name: "Applicant One",
      email: "applicant@example.test",
      password: "ApplicantPass123!",
      confirmPassword: "ApplicantPass123!",
      termsAccepted: true,
      profileImage: "",
      professionalTitle: "Frontend educator",
      biography: "I teach accessible frontend development to new developers.",
      expertise: ["JavaScript", "Accessibility"],
      teachingExperience: "Five years teaching online courses.",
      qualifications: ["Computer science degree"],
      portfolioLinks: ["https://portfolio.example.test"],
      role: "ADMIN",
    })
  );
  assert.equal(pendingApplication.response.status, 201);
  assert.equal(pendingApplication.body.data.role, "STUDENT");
  assert.equal(pendingApplication.body.application.status, "PENDING");
  const applicantToken = pendingApplication.body.token;
  const applicant = users.get("applicant@example.test");
  assert.equal(
    (await request("/api/courses", jsonOptions("POST", {
      title: "Pending Course",
      slug: "pending-course",
      description: "Not permitted",
      published: true,
    }, applicantToken))).response.status,
    403
  );
  assert.equal(
    (await request("/api/admin/dashboard", { headers: { Authorization: `Bearer ${studentToken}` } })).response.status,
    403
  );
  const reviewedApplication = await request(
    `/api/admin/instructor-applications/${pendingApplication.body.application.id}`,
    jsonOptions("PATCH", { status: "APPROVED" }, adminToken)
  );
  assert.equal(reviewedApplication.response.status, 200);
  assert.equal(applicant.role, "INSTRUCTOR");
  assert.equal(applicant.professionalTitle, "Frontend educator");
  const refreshedApplicant = await request("/api/auth/me", {
    headers: { Authorization: `Bearer ${applicantToken}` },
  });
  assert.equal(refreshedApplicant.response.status, 200);
  assert.equal(refreshedApplicant.body.data.role, "INSTRUCTOR");
  const approvedCourse = await request(
    "/api/courses",
    jsonOptions("POST", {
      title: "Approved Instructor Course",
      slug: "approved-instructor-course",
      description: "Only approved instructors can publish courses.",
      published: true,
    }, applicantToken)
  );
  assert.equal(approvedCourse.response.status, 201);
  assert.equal(
    (await request(`/api/admin/instructor-applications/${pendingApplication.body.application.id}`, jsonOptions("PATCH", { status: "REJECTED" }, adminToken))).response.status,
    409
  );
  assert.equal((await request("/api/admin/dashboard", { headers: { Authorization: `Bearer ${adminToken}` } })).response.status, 200);
  assert.equal((await request("/api/admin/courses", { headers: { Authorization: `Bearer ${adminToken}` } })).response.status, 200);
  assert.equal((await request("/api/admin/users?page=1&limit=10", { headers: { Authorization: `Bearer ${adminToken}` } })).response.status, 200);
  assert.equal((await request("/api/dashboards/instructor", { headers: { Authorization: `Bearer ${applicantToken}` } })).response.status, 200);
  assert.equal((await request("/api/dashboards/student", { headers: { Authorization: `Bearer ${studentToken}` } })).response.status, 200);

  assert.equal(
    (await request("/api/admin/dashboard", {
      headers: { Authorization: `Bearer ${instructorToken}` },
    })).response.status,
    403
  );
  assert.equal(
    (await request("/api/dashboards/student", {
      headers: { Authorization: `Bearer ${instructorToken}` },
    })).response.status,
    403
  );

  const studentUsers = await request("/api/admin/users?role=STUDENT", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(studentUsers.response.status, 200);
  assert.ok(studentUsers.body.data.every((user) => user.role === "STUDENT"));

  const invalidRoleFilter = await request("/api/admin/users?role=ADMIN", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert.equal(invalidRoleFilter.response.status, 400);

  const rejectedApplication = await request(
    "/api/instructor-applications",
    jsonOptions("POST", {
      name: "Applicant Two",
      email: "applicant-two@example.test",
      password: "ApplicantTwoPass123!",
      confirmPassword: "ApplicantTwoPass123!",
      termsAccepted: true,
      professionalTitle: "Design educator",
      biography: "I teach practical design methods for accessible digital experiences.",
      expertise: ["Design systems"],
      teachingExperience: "I have taught design workshops for several years.",
      qualifications: ["Design degree"],
      portfolioLinks: [],
    })
  );
  assert.equal(rejectedApplication.response.status, 201);
  const rejected = await request(
    `/api/admin/instructor-applications/${rejectedApplication.body.application.id}`,
    jsonOptions("PATCH", { status: "REJECTED", reviewNote: "Please provide more teaching examples." }, adminToken)
  );
  assert.equal(rejected.response.status, 200);
  assert.equal(users.get("applicant-two@example.test").role, "STUDENT");
  const resubmission = await request(
    "/api/instructor-applications/me",
    jsonOptions("POST", {
      professionalTitle: "Updated design educator",
      biography: "I teach practical design methods for accessible digital experiences.",
      expertise: ["Design systems"],
      teachingExperience: "I have taught design workshops for several years.",
      qualifications: ["Design degree"],
      portfolioLinks: [],
    }, rejectedApplication.body.token)
  );
  assert.equal(resubmission.response.status, 409);
  const adminApplicationId = newId();
  applications.set(adminApplicationId, { _id: adminApplicationId, user: admin._id, status: "PENDING" });
  assert.equal(
    (await request(
      `/api/admin/instructor-applications/${adminApplicationId}`,
      jsonOptions("PATCH", { status: "APPROVED" }, adminToken)
    )).response.status,
    403
  );

  const unauthenticatedCreate = await request(
    "/api/courses",
    jsonOptions("POST", { title: "Course", slug: "course", description: "Details" })
  );
  assert.equal(unauthenticatedCreate.response.status, 401);

  const studentCreate = await request(
    "/api/courses",
    jsonOptions("POST", { title: "Course", slug: "course", description: "Details" }, studentToken)
  );
  assert.equal(studentCreate.response.status, 403);

  const missingFields = await request(
    "/api/courses",
    jsonOptions("POST", { title: "Course" }, instructorToken)
  );
  assert.equal(missingFields.response.status, 400);
  const invalidPrice = await request(
    "/api/courses",
    jsonOptions("POST", {
      title: "Invalid Price",
      slug: "invalid-price",
      description: "Invalid price course",
      price: -1,
    }, instructorToken)
  );
  assert.equal(invalidPrice.response.status, 400);

  const createCourse = await request(
    "/api/courses",
    jsonOptions("POST", {
      title: "Published Course",
      slug: "published-course",
      description: "Available to everyone",
      published: true,
      instructor: otherInstructor._id,
    }, instructorToken)
  );
  assert.equal(createCourse.response.status, 201);
  assert.equal(createCourse.body.data.instructor, instructor._id);
  const courseId = createCourse.body.data._id;

  const duplicateSlug = await request(
    "/api/courses",
    jsonOptions("POST", {
      title: "Duplicate",
      slug: "published-course",
      description: "Duplicate slug",
    }, instructorToken)
  );
  assert.equal(duplicateSlug.response.status, 409);

  const draft = createCourseDocument({
    title: "Draft",
    slug: "draft-course",
    description: "Not public",
    instructor: instructor._id,
    published: false,
  });
  const listing = await request("/api/courses");
  assert.equal(listing.response.status, 200);
  assert.equal(listing.body.data.some((course) => course._id === draft._id), false);
  assert.equal(listing.body.data.some((course) => course._id === courseId), true);

  const originalFind = Course.find;
  Course.find = () => {
    throw new Error("private database credential");
  };
  const originalConsoleError = console.error;
  console.error = () => {};
  let failedListing;
  try {
    failedListing = await request("/api/courses");
  } finally {
    Course.find = originalFind;
    console.error = originalConsoleError;
  }
  assert.equal(failedListing.response.status, 500);
  assert.equal(JSON.stringify(failedListing.body).includes("credential"), false);

  const getCourse = await request(`/api/courses/${courseId}`);
  assert.equal(getCourse.response.status, 200);
  assert.equal((await request(`/api/courses/${draft._id}`)).response.status, 404);
  assert.equal((await request("/api/courses/not-an-object-id")).response.status, 400);
  assert.equal(
    (await request("/api/courses/64b000000000000000000099")).response.status,
    404
  );

  assert.equal(
    (await request(`/api/enrollments/${courseId}`, jsonOptions("POST", {}))).response.status,
    401
  );
  assert.equal((await request("/api/enrollments/my-courses")).response.status, 401);
  assert.equal(
    (await request("/api/enrollments/not-an-object-id", jsonOptions("POST", {}, studentToken))).response.status,
    400
  );
  assert.equal(
    (await request("/api/enrollments/64b000000000000000000099", jsonOptions("POST", {}, studentToken))).response.status,
    404
  );
  assert.equal(
    (await request(`/api/enrollments/${draft._id}`, jsonOptions("POST", {}, studentToken))).response.status,
    404
  );

  const enrollment = await request(
    `/api/enrollments/${courseId}`,
    jsonOptions("POST", { userId: otherInstructor._id }, studentToken)
  );
  assert.equal(enrollment.response.status, 201);
  assert.equal(enrollment.body.data.user, registration.body.data.id);
  assert.equal(enrollment.body.data.course, courseId);
  assert.equal(
    (await request(`/api/enrollments/${courseId}`, jsonOptions("POST", {}, studentToken))).response.status,
    409
  );
  const myCourses = await request("/api/enrollments/my-courses", {
    headers: { Authorization: "Bearer " + studentToken },
  });
  assert.equal(myCourses.response.status, 200);
  assert.equal(myCourses.body.count, 1);
  assert.equal(myCourses.body.data[0].course._id, courseId);
  const instructorDashboard = await request("/api/dashboards/instructor", {
    headers: { Authorization: `Bearer ${instructorToken}` },
  });
  assert.equal(instructorDashboard.response.status, 200);
  assert.equal(instructorDashboard.body.data.students.length, 1);
  assert.equal(instructorDashboard.body.data.students[0].user.email, "student@example.test");
  assert.equal(instructorDashboard.body.data.students[0].course.title, "Published Course");
  const otherUsersCourses = await request("/api/enrollments/my-courses", {
    headers: { Authorization: "Bearer " + otherInstructorToken },
  });
  assert.equal(otherUsersCourses.response.status, 200);
  assert.equal(otherUsersCourses.body.count, 0);

  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("PATCH", { title: "No token" }))).response.status,
    401
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("PATCH", { title: "Student edit" }, studentToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("PATCH", { title: "Other instructor edit" }, otherInstructorToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("PATCH", {}, instructorToken))).response.status,
    400
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("PATCH", { price: -5 }, instructorToken))).response.status,
    400
  );
  const ownerUpdate = await request(
    `/api/courses/${courseId}`,
    jsonOptions("PATCH", { title: "Owner update" }, instructorToken)
  );
  assert.equal(ownerUpdate.response.status, 200);

  const adminUpdate = await request(
    `/api/courses/${courseId}`,
    jsonOptions("PATCH", { title: "Admin update" }, adminToken)
  );
  assert.equal(adminUpdate.response.status, 200);
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("DELETE", {}, studentToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("DELETE", {}, otherInstructorToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/courses/${courseId}`, jsonOptions("DELETE", {}, instructorToken))).response.status,
    200
  );

  const adminManagedCourse = createCourseDocument({
    title: "Admin managed",
    slug: "admin-managed",
    description: "Admin can manage",
    instructor: instructor._id,
    published: true,
  });
  assert.equal(
    (await request(`/api/courses/${adminManagedCourse._id}`, jsonOptions("DELETE", {}, adminToken))).response.status,
    200
  );
  assert.equal(
    (await request("/api/courses/not-an-object-id", jsonOptions("PATCH", { title: "x" }, adminToken))).response.status,
    400
  );
  assert.equal(
    (await request("/api/courses/64b000000000000000000099", jsonOptions("DELETE", {}, adminToken))).response.status,
    404
  );

  const malformedJson = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{invalid",
  });
  assert.equal(malformedJson.status, 400);
  assert.deepEqual(await malformedJson.json(), {
    success: false,
    message: "Invalid JSON request body",
  });
  const largeBody = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ value: "x".repeat(110_000) }),
  });
  assert.equal(largeBody.status, 413);

  const allowedPreflight = await fetch(`${baseUrl}/api/courses`, {
    method: "OPTIONS",
    headers: {
      Origin: "http://localhost:5173",
      "Access-Control-Request-Method": "POST",
    },
  });
  assert.equal(allowedPreflight.status, 204);
  assert.equal(allowedPreflight.headers.get("access-control-allow-origin"), "http://localhost:5173");
  const deniedOrigin = await request("/api/courses", {
    headers: { Origin: "https://untrusted.example" },
  });
  assert.equal(deniedOrigin.response.status, 403);

  const errorResponse = {
    headersSent: false,
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
  const originalConsoleErrorForHandler = console.error;
  console.error = () => {};
  try {
    errorHandler(new Error("private database credential"), {}, errorResponse, () => {});
  } finally {
    console.error = originalConsoleErrorForHandler;
  }
  assert.equal(errorResponse.statusCode, 500);
  assert.deepEqual(errorResponse.body, {
    success: false,
    message: "Internal server error",
  });
  assert.equal(JSON.stringify(errorResponse.body).includes("credential"), false);

  const missingRoute = await request("/api/not-a-route");
  assert.equal(missingRoute.response.status, 404);

  assert.equal((await request("/api/admin/dashboard")).response.status, 401);
  assert.equal(
    (await request(`/api/admin/users/${admin._id}/status`, jsonOptions("PATCH", { accountStatus: "DEACTIVATED" }, adminToken))).response.status,
    403
  );
  const secondAdmin = makeUser({
    name: "Second Admin",
    email: "second-admin@example.test",
    passwordHash: await bcrypt.hash("SecondAdminPass123!", 4),
    role: "ADMIN",
  });
  assert.equal(
    (await request(`/api/admin/users/${secondAdmin._id}/status`, jsonOptions("PATCH", { accountStatus: "DEACTIVATED" }, adminToken))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/admin/users/${admin._id}/status`, jsonOptions("PATCH", { accountStatus: "DEACTIVATED" }, tokenFor(secondAdmin)))).response.status,
    403
  );
  assert.equal(
    (await request(`/api/admin/users/${otherInstructor._id}/status`, jsonOptions("PATCH", { accountStatus: "DEACTIVATED" }, adminToken))).response.status,
    200
  );
  assert.equal(
    (await request("/api/auth/me", { headers: { Authorization: `Bearer ${otherInstructorToken}` } })).response.status,
    403
  );
  assert.equal(
    (await request("/api/auth/login", jsonOptions("POST", { email: otherInstructor.email, password: "InstructorPass123!" }))).response.status,
    403
  );
});
