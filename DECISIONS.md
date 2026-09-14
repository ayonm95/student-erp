# Architectural & Engineering Decision Records (DECISIONS.md)

This document provides a detailed record of every architectural, database, security, and frontend decision made during the development of the **Student ERP Web Application**. It also explains the complete end-to-end working lifecycle of the application.

---

## Part 1: Architecture & Technical Decisions

### Decision 1: Monorepo Architecture with Decoupled Client & Server
* **Context**: The Student ERP requires an Express backend API and a modern React frontend.
* **Decision**: Maintain a single root repository with independent `/backend` and `/frontend` directories.
* **Rationale**:
  - Simplifies repository management, submission, and version control.
  - Allows backend and frontend to run independently on separate ports (`PORT=5000` for API, `PORT=5173` for Vite).
  - Clean separation of concerns prevents mixing server-side secrets with client-side code.

---

### Decision 2: MongoDB Atlas + Mongoose (Document Model with Relational References)
* **Context**: The academic ERP requires managing Students, Courses, Enrollments, Attendance, and Grades.
* **Decision**: Use MongoDB Atlas cloud-hosted database accessed through the Mongoose ODM with normalized schemas and ObjectId references.
* **Rationale**:
  - Cloud-hosted Atlas ensures zero local database setup friction for evaluators.
  - Mongoose provides schema validation, type casting, middleware hooks, and automated indexing.
  - Normalization with ObjectId references (`ref: 'Student'`, `ref: 'Course'`) prevents unbound document growth.

---

### Decision 3: Separate `Enrollment` Collection vs. Embedded Array in `Student`
* **Context**: Students and Courses have a Many-to-Many ($M:N$) relationship.
* **Decision**: Model `Enrollment` as an independent join collection containing `{ student, course, academicYear }`.
* **Rationale**:
  - Embedding an array of courses inside the `Student` document leads to bloated documents and makes querying course rosters inefficient (requiring expensive unwinds).
  - A dedicated `Enrollment` collection scales linearly, allows querying both directions efficiently (find all courses for a student, or find all students enrolled in a course), and supports metadata like `academicYear` and enrollment dates.

---

### Decision 4: Compound Unique Index on `(student, course, academicYear)`
* **Context**: Preventing a student from being enrolled into the exact same course multiple times in the same academic year.
* **Decision**: Apply a compound unique index in Mongoose:
  ```javascript
  enrollmentSchema.index({ student: 1, course: 1, academicYear: 1 }, { unique: true });
  ```
* **Rationale**:
  - Application-level checks (`findOne`) are susceptible to race conditions under concurrent requests.
  - Enforcing uniqueness at the database engine level guarantees ACID consistency and prevents duplicate record insertion.

---

### Decision 5: Stateless JWT Authentication vs. Stateful Server Sessions
* **Context**: The system must support authentication across multiple roles (Admin and Student).
* **Decision**: Use JSON Web Tokens (JWT) signed using HMAC-SHA256 with an asymmetric secret, transmitted via `Authorization: Bearer <token>` headers.
* **Rationale**:
  - **Statelessness**: The Express server does not need an in-memory session store or Redis cache to validate incoming requests.
  - **Scalability**: The backend can scale horizontally without session stickiness.
  - **Standard REST alignment**: Modern SPAs (Single Page Applications) communicate most cleanly with APIs via standard Bearer tokens.
  - **Payload Structure**: The JWT payload contains `{ userId, role }`, allowing authorization guards to make rapid checks without redundant database lookups.

---

### Decision 6: Password Security with bcrypt Salt Hashing
* **Context**: User credentials must be securely stored in accordance with security best practices.
* **Decision**: Use `bcryptjs` with 10 salt rounds to hash all passwords prior to saving in the database.
* **Rationale**:
  - Plaintext passwords are never saved in the database or logged in console statements.
  - bcrypt includes built-in salts to defeat rainbow table attacks and uses an adaptive key derivation function to resist brute-force attacks.

---

### Decision 7: Dual-Layer Authorization: Role Guards + Student Ownership Verification
* **Context**: Admins have full CRUD permissions across the entire university, whereas Students must only read their **own** records and never view other students' data.
* **Decision**: Implement a two-tiered middleware system:
  1. `requireRole(...allowedRoles)`: Rejects users whose token role does not match the required privilege with HTTP 403 Forbidden.
  2. `checkOwnership`: In routes with `:id` representing a Student ID (`/api/students/:id`, `/api/enrollment/student/:id`, `/api/attendance/student/:id`, `/api/grades/student/:id`):
     - If `req.user.role === 'admin'`: Allowed immediately.
     - If `req.user.role === 'student'`: Queries `Student.findOne({ userId: req.user.id })` and compares its `_id` against `req.params.id`. If mismatched, immediately aborts with HTTP 403.
* **Rationale**:
  - Completely eliminates Insecure Direct Object Reference (IDOR) vulnerabilities.
  - Ensures defense-in-depth: even if a student crafts a request pointing to another student's MongoDB ID, the server blocks it.

---

### Decision 8: Manual `if` Validation vs. External Validation Libraries
* **Context**: Request validation is required across 20 endpoints.
* **Decision**: Implement manual, imperative `if` checks in every controller for type checking, required fields, value bounds, and enum correctness without third-party libraries (such as Joi or Zod).
* **Rationale**:
  - Conforms strictly to assignment requirements.
  - Offers total transparency during academic evaluation and viva defense.
  - Eliminates unnecessary external dependency overhead.

---

### Decision 9: Standardized Uniform JSON Response Envelope
* **Context**: Inconsistent response payloads create fragile frontend integrations.
* **Decision**: Every endpoint (both success and error) strictly adheres to the schema:
  ```json
  {
    "success": true | false,
    "message": "Human-readable status description",
    "data": { ... } | null
  }
  ```
* **Rationale**:
  - The frontend client and Axios interceptors can reliably handle response status, render user toasts, and unpack payloads with predictable structure.

---

### Decision 10: Centralized 4-Argument Express Error Middleware
* **Context**: Uncaught exceptions or Mongoose errors could cause server crashes or leak internal stack traces.
* **Decision**: Create a dedicated 4-argument middleware `(err, req, res, next)` mounted as the last layer in `server.js`. Controllers forward unexpected errors via `next(err)`.
* **Rationale**:
  - Intercepts MongoDB duplicate key errors (code 11000), Mongoose validation errors, and invalid ObjectId `CastError` exceptions.
  - Transforms raw database driver exceptions into friendly, structured JSON error responses with proper HTTP status codes (400, 404, 500).

---

### Decision 11: Mongoose `.populate()` Strategy for Document Resolution
* **Context**: Relational queries in MongoDB store foreign keys as ObjectIds.
* **Decision**: Use Mongoose `.populate('student')` and `.populate('course')` to dynamically substitute referenced IDs with full documents in GET responses.
* **Rationale**:
  - Enables the frontend to receive course names, course codes, credits, student names, and roll numbers in a single HTTP request without manual client-side stitching.

---

### Decision 12: Cascade Deletion for Referential Integrity
* **Context**: Deleting a student or course could leave orphan records in `Enrollment`, `Attendance`, and `Grade` collections.
* **Decision**: In `deleteStudent` and `deleteCourse`, execute cascading deletions:
  - Deleting a Student also deletes their linked `User`, `Enrollment` rows, `Attendance` logs, and `Grade` marks.
  - Deleting a Course also removes related `Enrollment` rows, `Attendance` logs, and `Grade` marks.
* **Rationale**:
  - Preserves database cleanliness and prevents null-pointer reference errors when populating related collections.

---

### Decision 13: Pre-Seeded Admin Account via Idempotent Seed Script
* **Context**: The Admin account must have elevated permissions and cannot be self-registered by students.
* **Decision**: Create `backend/seed.js` executed via `npm run seed`, reading `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
* **Rationale**:
  - Prevents exposing an open Admin registration endpoint on the public web.
  - Idempotency check (`User.findOne({ email: adminEmail })`) allows re-running the script safely without duplicate key violations.

---

### Decision 14: Frontend Architecture: React 18 + Vite + Context API
* **Context**: The frontend requires rapid state propagation, responsive rendering, and tabbed dashboards.
* **Decision**: Scaffold with Vite, manage authentication with React's native Context API (`AuthContext`), and manage HTTP calls with a customized Axios instance.
* **Rationale**:
  - Vite provides sub-second HMR and instant production builds.
  - `AuthContext` provides global access to `user`, `role`, `token`, `login()`, and `logout()` without the boilerplate of Redux.
  - Axios interceptors automatically inject the Bearer token and handle automatic session clearing upon HTTP 401.

---

### Decision 15: UI Design Aesthetics & Glassmorphism System
* **Context**: The application interface must look modern, professional, and visually engaging.
* **Decision**: Crafted a custom CSS design system (`index.css`) utilizing:
  - Deep slate and midnight indigo background palette with subtle radial color mesh glow.
  - Modern typography powered by Google Fonts *Outfit* (headers) and *Inter* (interface elements).
  - Glassmorphic translucent cards (`backdrop-filter: blur(14px)`).
  - Dynamic status pills for attendance (`present` / `absent`), role badges, and exam tags.
  - 1-Click Demo Credential fill buttons on the login screen to facilitate rapid live demonstrations during evaluations.

---

## Part 2: Complete End-to-End Working of the Application

### 1. System Boot & Initialization Flow
1. **Database Connection**: `backend/server.js` calls `connectDB()` in `config/db.js` using the connection string in `MONGO_URI`.
2. **Admin Seeding**: Running `npm run seed` connects to MongoDB, hashes `ADMIN_PASSWORD` using bcrypt, and saves a `User` document with `role: 'admin'`.
3. **Middleware Initialization**: Express binds CORS, JSON body parser, all 6 modular routers, and mounts the 4-arg centralized error handler.

---

### 2. Authentication & Registration Flow
#### Student Self-Registration:
1. Student accesses `/register` and provides Name, Email, Password, Roll Number, Department, and Semester.
2. The frontend sends `POST /api/auth/register`.
3. The controller performs validation checks:
   - Verifies email contains `@` and password is $\ge 6$ characters.
   - Checks if email already exists in `User` collection.
   - Checks if roll number already exists in `Student` collection.
4. If valid:
   - Password is encrypted with bcrypt.
   - Creates `User` document (`role = 'student'`).
   - Creates `Student` document referencing `User._id`.
   - Generates JWT token signed with `{ userId, role }`.
   - Returns HTTP 201 with token and user profile.
5. The student is logged in and redirected to `/student`.

#### User Login (Admin & Student):
1. User enters Email and Password at `/login`.
2. Controller finds user by email, compares password with bcrypt hash via `bcrypt.compare()`.
3. If valid:
   - If user is a student, retrieves linked `Student` profile.
   - Generates signed JWT token with 1-day expiration.
   - Returns user details, role, and studentId.
4. `AuthContext` stores the JWT in `localStorage` and memory.
5. Router directs Admins to `/admin` and Students to `/student`.

---

### 3. Administrative Operations (Admin Dashboard)
The Admin Dashboard provides 6 distinct workspaces:

1. **Overview**:
   - Computes live counts of registered students, active courses, total enrollments, and university-wide attendance rate.
   - Provides quick action shortcut buttons to create courses, enroll students, mark attendance, or record grades.
2. **Students Management (CRUD)**:
   - Lists all students with search and filter capabilities.
   - Admin can edit student department, semester, roll number, name, and email.
   - Admin can delete a student (triggers cascading cleanup of all related records).
3. **Courses Management (CRUD)**:
   - Displays all curriculum courses with credit weights.
   - Modal to create a new course (code, name, credits, semester, department).
   - Modal to edit existing course parameters.
   - Option to delete a course.
4. **Enrollment Operations (CRUD)**:
   - Admin selects a student and a course, specifies the academic year, and creates an enrollment record.
   - Compound index prevents duplicate enrollment of the same student in the same course for that year.
   - Admin can unenroll a student with 1 click.
5. **Attendance Management (CRUD)**:
   - Admin records attendance sessions for specific dates with status (`present` or `absent`).
   - Full chronological attendance log view.
   - Admin can correct or update attendance entries.
6. **Grades & Marks Assessment (CRUD)**:
   - Admin logs examination marks across `internal1`, `internal2`, and `external` exams.
   - Controller verifies `marksObtained <= maxMarks`.
   - Admin can update existing marks or delete faulty grade entries.

---

### 4. Student Operations (Student Dashboard)
The Student Portal provides read-only access strictly restricted to the logged-in student's records:

1. **My Profile**:
   - Displays official academic profile, roll number, department, semester, email, and enrollment standing.
2. **My Enrolled Courses**:
   - Displays all courses the student is actively enrolled in, showing course codes, names, credits, and academic year.
   - Calculates total enrolled credit load.
3. **My Attendance Tracker**:
   - Calculates attendance percentage:
     $$\text{Attendance Rate} = \left(\frac{\text{Classes Attended}}{\text{Total Classes}}\right) \times 100$$
   - Visual progress bar displays compliance status (green if $\ge 75\%$, warning red if $< 75\%$).
   - Detailed session-by-session log showing dates, subjects, and attendance status.
4. **Academic Transcript & Report Card**:
   - Shows exam breakdown for every enrolled subject.
   - Computes percentage score per exam.
   - Automatically maps marks to letter grades ($A+$, $A$, $B+$, $B$, $C$, $F$).
   - Displays aggregate score across all completed examinations.

---

### 5. Security & Ownership Enforcement Flow
1. Every private request includes the HTTP header `Authorization: Bearer <token>`.
2. `authMiddleware` intercepts the request:
   - Verifies JWT signature using `JWT_SECRET`.
   - If token is missing, expired, or tampered with, returns HTTP 401 Unauthorized.
   - Decodes payload and attaches `req.user = { id, role }`.
3. `roleMiddleware` / `checkOwnership` evaluates authorization:
   - For Admin-only routes (`requireRole('admin')`): If `req.user.role !== 'admin'`, returns HTTP 403 Forbidden.
   - For Student-scoped routes (`checkOwnership`):
     - If user is Admin: Access granted.
     - If user is Student: Resolves student document linked to `req.user.id`. If its `_id` does not match the requested `:id` in URL parameters, returns HTTP 403 Forbidden.

---

### 6. Error Handling & Recovery Flow
- Invalid requests (e.g. negative marks, marks exceeding max marks, invalid ObjectId format) are caught by manual validation checks and return HTTP 400 Bad Request.
- If a route does not exist, Express returns HTTP 404 with a structured error response.
- If an unexpected error occurs during database interaction, controllers call `next(err)` to pass control to `errorMiddleware`, which logs the error and returns a sanitized JSON response without exposing server internals.
