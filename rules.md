# Coding Standards & Project Rules - MindManthan

This document defines the development rules, style guides, security requirements, and database patterns to be followed throughout the development of the MindManthan full-stack application.

---

## 1. General Rules

* **Single Source of Truth**: All configuration variables must be loaded from `.env` files. Do not hardcode secret keys, ports, database credentials, or URLs.
* **Separation of Concerns**: Keep business logic in controllers, database interactions in query models/helpers, and routing definitions in dedicated route files.
* **Semantic Versioning & Dependencies**: Keep dependencies updated. Do not install redundant libraries (e.g., use built-in browser APIs or lightweight equivalents).

---

## 2. Frontend Development Rules (React + Vite + Tailwind)

### 2.1. Components
* **Functional Components**: Use React functional components with hooks. Avoid class components.
* **File Structure**: Each major page should reside in `src/pages/`. Reusable child components should reside in `src/components/`.
* **Prop Validation**: Document expected props inside component files using basic JS comments or TypeScript interfaces if applicable.

### 2.2. CSS & Styling (Tailwind)
* **Responsive Design**: Always design mobile-first. Use Tailwind prefixes (`sm:`, `md:`, `lg:`) to control layouts on wider viewports.
* **Design Tokens**: Standardize colors, margins, and border radii using custom values inside `tailwind.config.js` where necessary (e.g., primary brand color for Sonam Wangchuk support campaign).
* **Avoid Style Bloat**: Utilize reusable custom components (e.g., `<Button>`, `<Input>`) instead of copy-pasting complex lists of Tailwind utility classes.

### 2.3. State Management
* **React Context**: Use React Context only for global states that change infrequently (e.g., User Authentication, notifications badge count, current active theme).
* **Local State**: Use `useState` or `useReducer` inside components for local interactions (e.g., text fields, toggle switches, carousel index).

---

## 3. Backend Development Rules (Node.js + Express)

### 3.1. API Design Guidelines
* **RESTful Endpoints**: Adhere to REST patterns:
  * `GET` for fetching data.
  * `POST` for creating resources or performing non-idempotent actions (like logging in).
  * `PATCH` / `PUT` for updating data.
  * `DELETE` for removing data.
* **Uniform Responses**: All APIs must return JSON responses in a standardized format:
  ```json
  // Success
  {
    "success": true,
    "data": { ... }
  }

  // Error
  {
    "success": false,
    "error": "Short descriptive error message"
  }
  ```
* **Error Handling**: Every route handler must use a `try-catch` block, passing any uncaught exceptions to a global Express error-handling middleware. Never expose database engine error stacks to the client.

### 3.2. Security Rules
* **Authentication**: Protect secure endpoints using a JWT verification middleware (`verifyToken`). Read the token from HTTP-only cookies or Authorization Headers.
* **Authorization (RBAC)**: Enforce role verification on all admin routes. Check `req.user.role` against permitted roles (`admin`, `moderator`, `analyst`).
* **Input Validation**: Validate body payloads (e.g., verifying email formats, checking string lengths) before database operations. Use helper validation functions or custom validator middlewares.

---

## 4. Database Rules (MySQL)

### 4.1. SQL Queries & Safety
* **SQL Injection Prevention**: **NEVER** build queries using string concatenation with user-submitted variables. Always use parameterized queries (using placeholders like `?` in `mysql2` package).
  ```javascript
  // CORRECT
  const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

  // INCORRECT
  const [rows] = await db.query(`SELECT * FROM users WHERE email = '${email}'`);
  ```
* **Connection Pooling**: Always utilize a MySQL Connection Pool (`mysql.createPool`) rather than opening single connections for each request.

### 4.2. Transactions
* **Data Consistency**: Use SQL Transactions (`START TRANSACTION`, `COMMIT`, `ROLLBACK`) when executing operations that modify multiple tables (e.g., creating a post and simultaneously adding a points log transaction to the user's history).

---

## 5. Media & Assets
* **Size Optimization**: Compress image files (using formats like WebP) before saving them to disk.
* **Upload Limits**: Limit file uploads size (e.g., max 10MB for posts, 2MB for avatars) to prevent server storage abuse.
