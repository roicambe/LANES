# LANES Admin Panel — Implementation Plan & Checklist

> **Capstone Project:** Bachelor of Science in Information Technology — Pamantasan ng Lungsod ng Pasig (PLP)
> **Authors:** Bellen, Jace H. · Cambe, Roi Yvann M. · Folloso, Chris Nicolai Z.

This document is the master checklist for building the full LANES Admin Panel. It is grounded in a full reading of `README.md`, `AGENTS.md`, and `DESIGN.md`, and a direct inspection of all existing frontend and backend source files.

All implementations must comply with:
- **Coding Standards** defined in [`AGENTS.md`](../AGENTS.md) (TypeScript-only, strict typing, Tailwind CSS, Lucide React icons, domain-based backend architecture, Alembic-only migrations).
- **Architecture** defined in [`DESIGN.md`](../DESIGN.md) (Three-tier decoupled model, PostGIS/SRID 4326, spaCy NLP, MapLibre GL JS).
- **Design Philosophy** from `DESIGN.md` §4: Illustrated Minimalist Spatial System — clarity-first, map-dominant, minimal cognitive load.

> [!IMPORTANT]
> **AI Collaboration Constraint:** The AI Code Agent MUST explicitly notify and confirm with the Human Developer before starting to build or modify any database models, database schemas, ORM objects, or Alembic migrations.

---

## Current State Audit

### What Already Exists

**Frontend (`/frontend/src/`)**

| File / Component | Status |
| :--- | :--- |
| `features/admin/AdminLayout.tsx` | ✅ Exists — collapsible icon sidebar with 3 nav items (Dashboard → `/admin/reports`, Live Map → `/`, Active Zones → `/admin/zones`) |
| `features/admin/AdminDashboard.tsx` | ✅ Exists — shows pending reports list with approve/reject actions |
| `features/admin/adminApi.ts` | ✅ Exists — minimal stub |
| `features/admin/ModerationTable.tsx` | ✅ Exists — empty stub |
| `app/admin/layout.tsx` | ✅ Wraps `AdminLayout` |
| `app/admin/page.tsx` | ✅ Redirects `/admin` → `/admin/reports` |
| `app/admin/reports/page.tsx` | ✅ Renders `AdminDashboard` |
| `shared/ui/` | ✅ Has: `Button`, `Card`, `Input`, `Modal`, `LoadingOverlay`, `LocationAutocomplete` |
| `lib/apiClient.ts` | ✅ Full REST client with JWT injection from `localStorage ("lanes_token")` |

**Backend (`/backend/app/`)**

| Endpoint | Status |
| :--- | :--- |
| `POST /api/v1/auth/login/access-token` | ✅ JWT login |
| `GET /api/v1/admin/reports/pending` | ✅ Returns pending reports (admin-only) |
| `POST /api/v1/admin/reports/{id}/approve` | ✅ Approves + creates avoidance zone |
| `POST /api/v1/admin/reports/{id}/reject` | ✅ Rejects report |
| `POST /api/v1/reports` | ✅ Submit new flood report |
| `GET /api/v1/reports` | ✅ All flood reports |
| `GET /api/v1/reports/active-zones` | ✅ Active avoidance zones (GeoJSON) |
| `POST /api/v1/reports/avoidance-zones` | ✅ Create avoidance zone |
| `POST /api/v1/reports/route` | ✅ Flood-safe route calculation |
| `POST /api/v1/users/register` | ✅ Register user |

**DB Models:** `users`, `flood_reports`, `flood_avoidance_zones` — all exist and mapped.

---

## Readiness Assessment

| Section | Backend Ready? | Frontend Ready? | Priority |
| :--- | :---: | :---: | :---: |
| **Admin Shell / Layout** | ✅ N/A | ⚠️ Partial (only 3 nav items) | 🔴 Phase 0 |
| **Reports** | ✅ Yes | ⚠️ Partial (basic only) | 🔴 Phase 1 |
| **Dashboard** | ❌ Needs stats endpoint | ❌ No | 🔴 Phase 2 |
| **Active Zones** | ✅ Yes (GET only) | ❌ No | 🟠 Phase 3 |
| **Live Map** | ✅ Yes | ❌ No | 🟠 Phase 4 |
| **User Registry** | ✅ Yes | ✅ Yes | 🟡 Phase 5 |
| **Audit Trail** | ✅ Yes | ✅ Yes | 🟡 Phase 6 |
| **Roles** | ❌ No roles table | ❌ No | 🟢 Phase 7 |
| **Data Management** | ❌ Not started | ❌ No | 🟢 Phase 8 |
| **System Settings** | ❌ Not started | ❌ No | 🟢 Phase 9 |

---

## Phase 0 — Admin Shell & Navigation (🔴 Immediate)

> **Goal:** Create the shared admin layout with a persistent sidebar, header, and routing structure. All pages that are not yet ready display a "Under Development" placeholder.

**Frontend — [`AdminLayout.tsx`](../frontend/src/features/admin/AdminLayout.tsx)**
- [x] Expand `navItems` array in `AdminLayout.tsx` to include all 9 sections:
  - Dashboard → `/admin/dashboard`
  - Live Map → `/admin/map`
  - Active Zones → `/admin/zones`
  - Reports → `/admin/reports`
  - User Registry → `/admin/users`
  - Roles → `/admin/roles`
  - Audit Trail → `/admin/audit`
  - Data Management → `/admin/data`
  - System Settings → `/admin/settings`
- [x] Update Lucide icons per section (e.g. `Users`, `ShieldCheck`, `ClipboardList`, `Database`, `Settings`)
- [x] Fix the "Live Map" nav item — currently links to `/` (landing page). Change to `/admin/map`
- [x] Fix the redirect in `app/admin/page.tsx` — update from `/admin/reports` to `/admin/dashboard`

**Frontend — New Files**
- [x] Create `features/admin/UnderDevelopment.tsx` — reusable placeholder component
- [x] Create stub page files for all missing routes (each just renders `<UnderDevelopment />`):
  - `app/admin/dashboard/page.tsx`
  - `app/admin/map/page.tsx`
  - `app/admin/zones/page.tsx`
  - `app/admin/users/page.tsx`
  - `app/admin/roles/page.tsx`
  - `app/admin/audit/page.tsx`
  - `app/admin/data/page.tsx`
  - `app/admin/settings/page.tsx`
- [x] Apply "Under Development" placeholder to: `roles`, `audit`, `data`, `settings` (initially)

---

## Phase 1 — Reports Page (🔴 High Priority)

> The existing `AdminDashboard.tsx` component is a functional but minimal stub. It needs a full redesign as a proper Reports management page.
> **Backend is fully ready.** This is pure frontend work.

**Backend Tasks**
- [x] Add `GET /api/v1/admin/reports/all` endpoint — returns ALL reports (pending + approved + rejected) with pagination and optional `?status=` filter

**Frontend Tasks — `features/admin/ReportsPage.tsx` (rename/replace `AdminDashboard.tsx`)**
- [x] Build proper tab switcher: **Pending** / **Approved** / **Rejected** / **All**
- [x] Add search bar filtering by `raw_text` keyword
- [x] Add severity filter dropdown: Low / Medium / High (per `DESIGN.md` §3.B tiers)
- [x] Add sort control: Newest / Oldest
- [x] Show severity tier color badge per `DESIGN.md` scale:
  - ⬜ `low` — White / Passable
  - 🟨 `medium` — Yellow / Moderate
  - 🟧 `high` — Orange / Hazardous
  - 🟥 `extreme` — Red / Impassable
- [x] Show `source` tag badge (twitter / facebook / user_report / manual)
- [x] Show coordinate label or "No coordinates" indicator
- [x] Keep Approve / Reject buttons — add loading spinners and success/error toast feedback
- [x] Add pagination controls
- [x] Update `app/admin/reports/page.tsx` to import `ReportsPage` instead of `AdminDashboard`

---

## Phase 2 — Dashboard Page (🔴 High Priority)

> **Backend needs a new stats endpoint. Frontend does not yet exist.**

**Backend Tasks — `app/api/v1/endpoints/admin.py`**
- [x] Add `GET /api/v1/admin/dashboard/stats` endpoint (admin-only) returning stats JSON schema.
- [x] Add service-layer function in `app/services/` for dashboard aggregation (follow service-layer separation per `AGENTS.md §9.B`)

**Frontend Tasks — `features/admin/DashboardPage.tsx`**
- [x] Build 4-card metrics grid: Pending Reports, Active Zones, Approved Today, Rejected Today
- [x] Add System Health card: database connection status (green/red indicator)
- [x] Add "Recent Activity" feed — last 10 approve/reject events with admin user + timestamp
- [x] Add Quick Action buttons: "Review Pending Reports" → `/admin/reports`, "View Active Zones" → `/admin/zones`
- [x] Update `app/admin/dashboard/page.tsx` to render `DashboardPage`

---

## Phase 3 — Active Zones Page (🟠 Second Priority)

> **Backend GET endpoint exists. Needs deactivation endpoints. Frontend does not exist.**

**Backend Tasks**
- [x] Add `PATCH /api/v1/admin/zones/{zone_id}/deactivate` endpoint (sets `is_active = false`)
- [x] Add `POST /api/v1/admin/zones/deactivate-bulk` endpoint (accepts `{ "zone_ids": [1, 2, 3] }`)
- [x] Add service functions in `app/services/` for zone deactivation logic

**Frontend Tasks — `features/admin/ActiveZonesPage.tsx`**
- [x] Build sortable data table of all active zones
- [x] Columns: Zone ID, Linked Report ID, Severity (from linked report), Created At, Expires At, Status
- [x] Add severity color row highlighting per `DESIGN.md` tier scale
- [x] Add individual "Deactivate" button per row (with `ConfirmDialog`)
- [x] Add row checkboxes + bulk "Deactivate Selected" action toolbar
- [x] Show empty state when no zones are active
- [x] Build shared `DataTable.tsx` reusable component (sortable columns, row selection, pagination) in `shared/ui/`
- [x] Build shared `ConfirmDialog.tsx` modal in `shared/ui/`

---

## Phase 4 — Live Map Page (🟠 Second Priority)

> **Backend is ready. Frontend does not exist yet for the admin context.**

**Frontend Tasks — `features/admin/LiveMapPage.tsx`**
- [x] Embed MapLibre GL JS map (reuse same `style.json` URL from `MapCanvas.tsx`)
- [x] Fetch and overlay all active avoidance zone polygons as filled GeoJSON layers
- [x] Color-code polygon fills by severity per `DESIGN.md` §3.B:
  - White (low), Yellow (medium), Orange (high), Red (extreme)
- [x] Add floating filter panel (checkboxes to toggle severity levels on/off)
- [x] Show a popup on polygon click: Report ID, Raw Text, Severity, Created At, Expires At
- [x] Add a map legend card in the corner explaining the severity color scale
- [x] Auto-refresh zone data every 30 seconds (use `setInterval` or React Query's `refetchInterval`)
- [x] Note: Admin map is **read-only** — no click-to-set-point or routing interaction

---

## Phase 5 — User Registry Page (🟡 Third Priority)

> **Backend has register only. List/update/deactivate endpoints need to be added.**

**Backend Tasks**
- [x] Add `GET /api/v1/admin/users` endpoint — paginated list of all users
- [x] Add `PATCH /api/v1/admin/users/{user_id}/activate`
- [x] Add `PATCH /api/v1/admin/users/{user_id}/deactivate`
- [x] Add `DELETE /api/v1/admin/users/{user_id}` (admin-only, non-self)

**Frontend Tasks — `features/admin/UsersPage.tsx`**
- [x] Data table: Username, Email, Role, Status (Active/Inactive), Created At
- [x] Search bar (by username or email)
- [x] Role filter dropdown (admin / commuter)
- [x] Activate / Deactivate toggle per row (with `ConfirmDialog`)
- [x] Delete user button (with `ConfirmDialog`)
- [x] Pagination controls

---

## Phase 6 — Audit Trail Page (🟡 Third Priority)

> **Requires a new Alembic database migration. No existing backend or frontend.**

> [!WARNING]
> Per `AGENTS.md §9.C`: All schema changes must use Alembic `upgrade()` / `downgrade()`. No raw SQL.

**Backend Tasks**
- [x] Create Alembic migration for `audit_logs` table:
  ```
  id            INTEGER PK
  admin_id      INTEGER FK → users.id
  action_type   VARCHAR(50)   e.g. LOGIN, APPROVE_REPORT, REJECT_REPORT, DEACTIVATE_ZONE, UPDATE_USER
  target_table  VARCHAR(50)   e.g. flood_reports, flood_avoidance_zones, users
  target_id     INTEGER (nullable)
  metadata_json JSONB (nullable, extra context)
  ip_address    VARCHAR(45) (nullable)
  created_at    TIMESTAMP
  ```
- [x] Create `AuditLog` SQLAlchemy model in `app/models/`
- [x] Create `AuditLogResponse` Pydantic schema in `app/schemas/`
- [x] Create `crud.create_audit_log()` helper in `app/crud/`
- [x] Integrate audit log writes into:
  - `auth.py` login endpoint → action `LOGIN`
  - `admin.py` approve endpoint → action `APPROVE_REPORT`
  - `admin.py` reject endpoint → action `REJECT_REPORT`
  - Zone deactivation endpoints → action `DEACTIVATE_ZONE`
  - User activate/deactivate → action `UPDATE_USER`
- [x] Add `GET /api/v1/admin/audit-logs` with query filters: `?user_id=`, `?action_type=`, `?date_from=`, `?date_to=`, `?limit=`, `?skip=`

**Frontend Tasks — `features/admin/AuditTrailPage.tsx`**
- [x] Chronological log table: Timestamp, Admin User, Action Type, Target, IP Address
- [x] Filter panel: date range picker, action type dropdown, admin user selector
- [x] Search by action keyword
- [x] "Export to CSV" button

---

## Phase 7 — Roles Page (🟢 Fourth Priority)

> **Requires schema changes to `users` and a new `roles` table.**

> [!IMPORTANT]
> Converting `users.role` from a plain `VARCHAR` string to a FK on a `roles` table is a breaking schema change. Must be done via Alembic and coordinated carefully.

**Backend Tasks**
- [ ] Create Alembic migration for `roles` table:
  ```
  id           INTEGER PK
  name         VARCHAR(50) UNIQUE
  permissions  JSONB   e.g. {"reports": "full", "zones": "view", "users": "none", ...}
  is_template  BOOLEAN default false
  created_at   TIMESTAMP
  ```
- [ ] Add `role_id INTEGER FK → roles.id` to `users` table (nullable initially for migration safety)
- [ ] Create `Role` SQLAlchemy model and Pydantic schemas
- [ ] CRUD endpoints: `GET/POST /api/v1/admin/roles`, `PUT/DELETE /api/v1/admin/roles/{id}`
- [ ] Add `POST /api/v1/admin/roles/{id}/clone` endpoint
- [ ] Seed 3 built-in read-only templates: Super Admin, DRRM Officer, Data Entry

**Frontend Tasks — `features/admin/RolesPage.tsx`**
- [ ] Role card list with permission summary
- [ ] Create Role modal with per-section permission dropdowns (None / View / Edit / Full)
- [ ] Edit Role modal (pre-filled)
- [ ] Clone Role button
- [ ] Delete Role button (with `ConfirmDialog`, blocked for built-in templates)

---

## Phase 8 — Data Management Page (🟢 Fourth Priority)

> **No existing backend or frontend.**

**Backend Tasks**
- [ ] `GET /api/v1/admin/data/export/reports` — returns CSV / JSON of historical flood reports
- [ ] `GET /api/v1/admin/data/export/zones` — returns zone data as CSV / JSON
- [ ] `POST /api/v1/admin/data/backup` — triggers `pg_dump`, saves to `/backend/backups/`
- [ ] `GET /api/v1/admin/data/backups` — lists all backup files with name, size, `created_at`, `created_by`
- [ ] `POST /api/v1/admin/data/restore/{backup_id}` — requires `{ "confirm": true }` body
- [ ] `DELETE /api/v1/admin/data/cleanup` — requires date-range + `{ "confirm": true }`

**Frontend Tasks — `features/admin/DataManagementPage.tsx`**
- [ ] Export section: download flood reports / zones as CSV or JSON
- [ ] Backup section: backup history table + "Create Backup Now" button + "Download" per entry
- [ ] Restore section: select backup from list → two-step `ConfirmDialog` before executing
- [ ] Cleanup section: date range selector → `ConfirmDialog` before deletion

---

## Phase 9 — System Settings Page (🟢 Fourth Priority)

> **No existing backend or frontend.**

**Backend Tasks**
- [ ] Create Alembic migration for `system_settings` key-value table:
  ```
  key               VARCHAR PK
  value             JSONB
  last_updated_by   INTEGER FK → users.id (nullable)
  updated_at        TIMESTAMP
  ```
- [ ] `GET /api/v1/admin/settings` — returns all settings as a key-value map
- [ ] `PUT /api/v1/admin/settings` — bulk update settings object
- [ ] Default setting keys to seed:
  - `flood_zone_expiry_hours` (default: 24)
  - `min_location_confidence` (default: 0.6)
  - `min_severity_confidence` (default: 0.5)
  - `auto_approve_threshold` (default: 0.9)

**Frontend Tasks — `features/admin/SystemSettingsPage.tsx`**
- [ ] NLP Settings: slider inputs for confidence thresholds
- [ ] Flood Zone Settings: expiry hours number input, auto-approve toggle
- [ ] Sub-Admin Restrictions: link to Roles page (placeholder)
- [ ] Save Settings button with toast on success

---

## Shared Components (Build Once, Use Everywhere)

These shared components should be built in `frontend/src/shared/ui/` during Phase 3 and reused throughout Phases 4–9:

- [ ] `DataTable.tsx` — sortable columns, row selection, pagination, typed generic rows
- [ ] `ConfirmDialog.tsx` — modal requiring explicit user confirmation before destructive actions
- [ ] `StatusBadge.tsx` — colored pill badge for status, severity, role, source labels
- [ ] `Toast` integration — wire up `react-hot-toast` or equivalent across the admin layout

---

## Out of Scope (This Milestone)

- Mobile-responsive admin panel (desktop-first only).
- Email or SMS notifications for report events.
- Real-time WebSocket streaming for live audit updates (30s polling is sufficient).
- Cloud storage for backups (local server `/backend/backups/` directory only).
- The public commuter-facing report submission UI (backend `POST /api/v1/reports` already exists, frontend page is TBD separately).

