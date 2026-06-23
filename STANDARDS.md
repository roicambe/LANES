# LANES Coding Standards

This document establishes the official coding standards, architectural rules, and syntactic constraints enforced across the LANES repository. All developers and AI Code Agents must write code adhering strictly to these directives.

---

## 1. Frontend Development (Next.js & React)

### A. Language Rules
* **TypeScript Only:** Plain JavaScript (`.js`, `.jsx`) is strictly prohibited. All UI components and utilities must be written in TypeScript (`.ts`, `.tsx`).
* **Strict Type Safety:** The use of the `any` type is banned. Every variable, component prop, hook, and function parameter must be explicitly typed.
  * *Bad:* `const handleRoute = (data: any) => {}`
  * *Good:* `const handleRoute = (data: RouteResponse) => {}`

### B. Component Design
* **Reusability:** Components must be kept small, modular, and focused on a single responsibility. Shared components (such as buttons, cards, modals) belong in a dedicated component directory.
* **Component Types:** Prefer functional components with standard React hooks (`useState`, `useEffect`, `useRef`).

### C. Styling & UI Layout
* **Tailwind Utility Classes:** Use Tailwind CSS utility classes for styling. Avoid inline styles (`style={{...}}`) unless dealing with dynamic heights or custom CSS parameters (like map tiles).
* **Responsive Design:** Viewports must follow mobile-first responsive grid layouts using Tailwind breakpoints (e.g. `md:flex-row`, `sm:grid-cols-2`).
* **Iconography Standard:** Use the `lucide-react` library for all interface icons to ensure layout symmetry and visual uniformity.

---

## 2. Backend Development (FastAPI & Python)

### A. Syntactic Rules
* **Type Hints Required:** Every function signature must contain explicit type hints for both input arguments and return types.
  * *Bad:* `def get_safe_route(start, end):`
  * *Good:* `def get_safe_route(start: List[float], end: List[float]) -> Dict[str, Any]:`
* **Docstrings:** Every module, class, and function must have descriptive Google-style docstrings explaining parameters, logic, and return types.

### B. Validation Core
* **Pydantic Validation:** All request payloads, response schemas, and external API configurations must use **Pydantic v2** models to validate schema structure, types, and constraints.
* **Database Models:** Keep database models (`app.models`) cleanly mapped to Pydantic schemas (`app.schemas`) using `ConfigDict(from_attributes=True)`.

### C. Pattern
* **Service Layer Architecture:** Keep the endpoint route layer (`app.api`) completely separated from the core business logic. All database checks, NLP executions, and pathfinding queries must live inside a dedicated service module (such as `app.services`).

---

## 3. Database Management (PostgreSQL & PostGIS)

### A. Migrations
* **Alembic Migrations Only:** All schema adjustments, database migrations, and table modifications must be executed via Alembic migrations. Direct schema modifications (`CREATE TABLE`, `ALTER TABLE`) performed raw in the DBMS console are forbidden.
* **Migration Integrity:** Ensure migrations are reversible (having an explicit `upgrade()` and `downgrade()` pipeline).

### B. Spatial Geometry Rules
* **Strict SRID Enforcement:** Always set and validate spatial coordinate reference systems using `SRID 4326` (GPS longitude/latitude decimal degrees).
* **Indexed Math:** Ensure all queries checking polygon overlaps or line crossings use GIST indexes and native spatial triggers (e.g. `func.ST_Intersects`).

---

## 4. API Design & Routing

### A. Naming Conventions
* **RESTful Naming Conventions:** Endpoints must use resource-based, lowercase nouns. Use proper HTTP request verbs (`GET` for retrieval, `POST` for creation, `PUT` / `PATCH` for updates, `DELETE` for removal).
  * *Bad:* `/api/v1/getSafeRoute`
  * *Good:* `POST /api/v1/reports/route`

### B. Consistent Error Responses
* **HTTP Exceptions:** Never let raw errors propagate to the client. Wrap exceptions inside FastAPI's `HTTPException` with clear statuses (e.g. `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`).
* **Structured Payload:** Standardize validation failure bodies so the frontend client can parse error arrays consistently.
