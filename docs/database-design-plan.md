# LANES Database Normalization & Security Architecture Plan

This document details the normalized, secure database architecture designed for **LANES (Localised Alternative Navigation for Environs under Submersion)**. It serves as a comprehensive reference guide to PostgreSQL schema patterns, spatial indexing, table normalization (3NF), and security safeguards.

---

## 1. Architectural Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    users {
        int id PK "Auto-incrementing surrogate identifier"
        string username UNIQUE "Admin/User identity handle"
        string email UNIQUE "Electronic mail address"
        string hashed_password "Salter bcrypt password hash"
        string role "CHECK constraint: admin/commuter"
        boolean is_active "Soft deactivation toggle"
        datetime created_at "UTC timestamp of registration"
    }
    
    flood_reports {
        int id PK "Unique identifier"
        int user_id FK "Nullable link to registered users.id"
        string raw_text "Raw bilingual Taglish input text"
        string source "Origin: twitter, facebook, user_report"
        string source_url "Nullable URL link to the original article/post for verification"
        string severity "Risk level: low, medium, high, extreme"
        string status "Moderation: pending, approved, rejected"
        geometry geometry "PostGIS Point coordinates (SRID 4326)"
        datetime created_at "UTC timestamp of ingestion"
        datetime updated_at "UTC timestamp of latest update"
    }

    flood_report_locations {
        int id PK "Unique location entity identifier"
        int report_id FK "Cascade reference to flood_reports"
        string location_name "Normalized street or landmark name"
    }

    flood_avoidance_zones {
        int id PK "Unique detour zone identifier"
        int report_id FK "Cascade reference to flood_reports"
        geometry geometry "PostGIS Polygon boundaries (SRID 4326)"
        boolean is_active "Status toggle for routing engine"
        datetime created_at "UTC timestamp of generation"
        datetime expires_at "Nullable UTC expiry limit"
    }

    audit_logs {
        int id PK "Append-only surrogate identifier"
        int admin_id FK "SET NULL reference to users"
        string action_type "Moderation action identifier"
        string target_table "Affected table metadata"
        int target_id "Affected record primary key"
        jsonb metadata_json "Diff properties stored in binary JSON"
        string ip_address "Origin IP (IPv4/IPv6)"
        datetime created_at "UTC action timestamp"
    }

    post_interactions {
        int id PK "Unique interaction identifier"
        int user_id FK "Reference to users"
        int report_id FK "Reference to flood_reports"
        string interaction_type "upvote, downvote"
        datetime created_at "UTC action timestamp"
    }

    users ||--o{ audit_logs : "creates"
    users ||--o{ flood_reports : "submits (nullable)"
    users ||--o{ post_interactions : "interacts"
    flood_reports ||--o{ flood_report_locations : "maps to"
    flood_reports ||--o{ flood_avoidance_zones : "generates"
    flood_reports ||--o{ post_interactions : "receives"
```

---

## 2. Table-by-Table Data Dictionary

### Table A: `users`
**Description:** Stores account credentials, access roles, and status flags for administrators and commuter clients.
**Security Level:** Critical (Contains hashed authentication credentials).

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique surrogate key generated automatically for each user record. | Indexed by default. Keeps foreign key relations compact. |
| `username` | `VARCHAR(50)` | UNIQUE, NOT NULL, Index | Unique alphanumeric handle used by administrators and users to authenticate. | Indexed for fast login query performance. |
| `email` | `VARCHAR(100)` | UNIQUE, NOT NULL, Index | The primary electronic contact address of the account holder. | Indexed for account recovery checks and credential uniqueness. |
| `hashed_password` | `VARCHAR(255)` | NOT NULL | A secure one-way hash of the user's password generated using the **bcrypt** algorithm. | **Critical Security:** Never store plain text. Bcrypt adds a random salt and runs stretching loops to neutralize brute-force attacks. |
| `role` | `VARCHAR(20)` | NOT NULL, Default: `'commuter'`, CHECK constraint | Defines access boundaries. Valid entries are strictly limited to `'admin'` or `'commuter'`. | Enforces Role-Based Access Control (RBAC) directly inside the database layer. |
| `is_active` | `BOOLEAN` | Default: `TRUE` | Soft-deactivation toggle. Set to `FALSE` to suspend an account instead of deleting it. | Deactivated users are blocked from logging in, preserving historical records without losing referential integrity. |
| `deleted_at` | `TIMESTAMP` | Nullable | Soft-delete marker for the Archive Center. | Keeps the account structurally intact for historical audit logs, but fully removes access and visibility. |
| `created_at` | `TIMESTAMP` | Default: UTC Now | Record of when the account was initially created. | Used for registration auditing and chronological user reports. |

---

### Table B: `flood_reports`
**Description:** Stores processed Taglish flood alerts mined from social feeds or manual submissions.
**Security Level:** Moderate (Contains user-submitted geographic coordinates).

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each ingested report. | Acts as the primary key for spatial relations and active detour lookups. |
| `user_id` | `INTEGER` | Foreign Key (`ON DELETE SET NULL`), Index | References `users.id`. Nullable link representing the registered account that submitted the report. | Nullable. Allows tracing submitted reports back to web/mobile users for moderation, trust metrics, and block handling. |
| `raw_text` | `TEXT` | NOT NULL | The original, unmodified social media post, emergency feed, or user message. | Kept for review and debugging NLP parsing algorithms. |
| `source` | `VARCHAR(50)` | NOT NULL | Origin channel of the report (e.g., `'twitter'`, `'facebook'`, `'user_report'`). | Allows analytics regarding data feed trust and channel frequency. |
| `source_url` | `VARCHAR(500)` | Nullable | Original URL link referencing the web article, social post, or feed bulletin. | **Fact-checking & Future AI:** Enables operators to click and verify raw sources. Will be used by the future AI model as citation references. |
| `human_readable_location` | `VARCHAR(255)` | Nullable | Normalized street name or landmark resolved via NLP or Geocoding. | Replaces complex joins with `flood_report_locations` for fast Community Feed reads. |
| `is_public` | `BOOLEAN` | Default: `FALSE` | Toggle indicating if the user consented to share this report on the Community Feed. | Ensures privacy compliance before making reports visible to all users. |
| `severity` | `VARCHAR(20)` | NOT NULL | Classified risk level of the flood. Allowed: `'low'`, `'medium'`, `'high'`, `'extreme'`. | Directly determines detour routing weights and map visual color-coding. |
| `status` | `VARCHAR(20)` | Default: `'pending'` | Moderation queue status. Allowed: `'pending'`, `'approved'`, `'rejected'`. | Approved reports automatically generate detours; rejected reports are archived. |
| `geometry` | `GEOMETRY(Point, 4326)` | Spatial Index (GIST) | Latitude and longitude GPS point of the reported flood location (WGS 84). | **Performance:** Uses a GIST index. Essential for finding nearby flood reports quickly without doing expensive math on every record. |
| `deleted_at` | `TIMESTAMP` | Nullable | Soft-delete marker for the Archive Center. | If set, the report is moved to the Archive Center and hidden from the public feed. |
| `created_at` | `TIMESTAMP` | Default: UTC Now | Timestamp of when the report was ingested. | Used to determine report freshness (old reports are automatically archived). |
| `updated_at` | `TIMESTAMP` | Default: UTC Now | Timestamp of the latest state modification (e.g., approval time). | Tracks modification latency and moderation response speeds. |

---

### Table C: `flood_report_locations` (3NF Normalization Upgrade)
**Description:** Normalizes the NLP-extracted location landmarks and street names associated with a flood report.
**Security Level:** Low.

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique ID for the specific location record. | Keeps location rows distinct. |
| `report_id` | `INTEGER` | Foreign Key (cascade delete), Index | References `flood_reports.id`. If a report is deleted, its location list is automatically purged. | **Performance:** Crucial to index this foreign key to avoid full-table scans during search joins. |
| `location_name` | `VARCHAR(100)` | NOT NULL, Index | Normalized street name or landmark (e.g. "Caruncho Ave", "Pasig City Hall"). | **Normalization:** Eliminates JSON arrays in `flood_reports`. Allows users to quickly search reports matching specific street names. |

---

### Table D: `flood_avoidance_zones`
**Description:** Stores polygonal buffer regions representing impassable areas. Used directly by the routing engine to detour traffic.
**Security Level:** Moderate (Routing boundaries).

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for the detour polygon. | Referenced during routing calculation bypasses. |
| `report_id` | `INTEGER` | Foreign Key (cascade delete), Index | Reference to the originating approved `flood_reports.id`. | **Performance:** Critical GIST index target. Allows joining detours back to reports instantly. |
| `geometry` | `GEOMETRY(Polygon, 4326)` | Spatial Index (GIST) | A bounding polygon surrounding the flooded coordinates (typically a 50m to 150m buffer). | **Core Routing Logic:** The pathfinding algorithm uses `ST_Intersects` on this column to deflect driving routes. |
| `is_active` | `BOOLEAN` | Default: `TRUE` | Active status toggle. Set to `FALSE` to archive or manually lift a detour. | The routing engine ignores inactive avoidance zones immediately. |
| `created_at` | `TIMESTAMP` | Default: UTC Now | Timestamp of when the detour was generated. | Used for historical metrics and aging-out old detours. |
| `expires_at` | `TIMESTAMP` | Nullable | Expiry threshold after which the detour is automatically considered inactive. | Prevents permanent road blocks; automatically expires detours after a set duration. |

---

### Table E: `audit_logs` (New Schema)
**Description:** An append-only security log recording administrative actions (approvals, user blocks, logins).
**Security Level:** High (Accountability / System Audit).

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each log entry. | Keeps logs distinct. |
| `admin_id` | `INTEGER` | Foreign Key (`ON DELETE SET NULL`), Index | References `users.id` of the performing administrator. | **Security:** If an admin is deleted, this becomes `NULL` but the audit log entry is preserved (prevents deleting history). |
| `action_type` | `VARCHAR(50)` | NOT NULL, Index | Identifier of the action (e.g., `'LOGIN'`, `'APPROVE_REPORT'`, `'DEACTIVATE_ZONE'`). | Indexed for fast searching on the Audit Trail panel. |
| `target_table` | `VARCHAR(50)` | NOT NULL | The table name that was modified (e.g., `'flood_reports'`, `'users'`). | Provides structural context for what table was acted upon. |
| `target_id` | `INTEGER` | Nullable | The primary key ID of the affected record in the target table. | Allows administrators to trace exactly which report or user account was altered. |
| `metadata_json` | `JSONB` | Nullable | Detailed data representation (e.g., old values vs new values) stored in binary JSON. | **JSONB vs JSON:** Binary compressed JSONB allows fast parsing, filtering, and GIN indexing on specific metadata keys. |
| `ip_address` | `VARCHAR(45)` | Nullable | Client IP address of the admin (accommodates IPv4 and longer IPv6 strings). | Identifies origin network vectors in case of suspicious behavior. |
| `created_at` | `TIMESTAMP` | Default: UTC Now, Index | UTC timestamp of when the action occurred. | Chronologically indexed for loading activity feeds. |

---

### Table F: `post_interactions` (New Schema)
**Description:** Records user interactions (upvotes/downvotes) on community feed reports.
**Security Level:** Low (Public interactions).

| Attribute | Data Type | Constraints | Description & How it Works | Security / Performance Impact |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `INTEGER` | Primary Key, Auto-increment | Unique identifier for each interaction. | Basic primary key. |
| `user_id` | `INTEGER` | Foreign Key, Index | References `users.id` of the interacting user. | Tracks who voted to prevent duplicate votes per user. |
| `report_id` | `INTEGER` | Foreign Key (cascade delete), Index | References `flood_reports.id`. | Ties the vote to a specific post. Cascade deletes if post is purged. |
| `interaction_type` | `VARCHAR(20)` | NOT NULL | Type of interaction (e.g., `'upvote'`, `'downvote'`). | Used to calculate total score (Upvotes - Downvotes). |
| `created_at` | `TIMESTAMP` | Default: UTC Now | Timestamp of the interaction. | Used to track interaction trends. |

---

## 3. Referential Integrity & Deletion Rules

When designing relational schemas, handling deletion cascades is critical to preventing orphaned rows and data loss:

1. **`ON DELETE CASCADE` (Used for Locations and Detours):**
   * If a `flood_report` is deleted, its child zones (`flood_avoidance_zones`) and processed locations (`flood_report_locations`) are automatically deleted. This prevents orphaned polygons that point to non-existent reports.
2. **`ON DELETE SET NULL` (Used for Audit Logs):**
   * If an administrator account is deleted, the `admin_id` field in their `audit_logs` entries is set to `NULL`. **The log itself is preserved.** Wiping logs during user deletion is a critical security vulnerability.

---

## 4. Key Database Security Controls

* **Transactional DDL:** PostgreSQL runs database modifications (like creating tables or adding columns) inside transactions. If an Alembic migration script fails halfway, Postgres rolls back the entire change, preventing corrupted states.
* **SQL Injection Shielding:** Database interactions are compiled via SQLAlchemy's query engine, using parameterized SQL queries. User inputs (like search keywords or report text) are never concatenated directly into raw SQL strings.
* **Bcrypt Password Storage:** High-entropy salted hashes prevent password recovery in the event of database leakage.
* **Append-Only Auditing:** The backend only exposes `POST` (create) access for audit logs to endpoint routers. No update or delete endpoints exist for the `audit_logs` resource.

---

## 5. Audit Log Action Types & Metadata Schemas

To ensure structured logging and avoid raw text entries, the `action_type` string must conform to a predefined category catalog. The `metadata_json` field contains a JSONB structure specific to each type.

### Categorized Action Types
1. **Authentication Events (Access Logs):**
   * `LOGIN_SUCCESS`: Logged when an admin logs in successfully.
   * `LOGIN_FAILURE`: Logged when a login attempt fails (e.g. invalid password, non-existent username).
   * `LOGOUT`: Logged when an admin explicitly terminates their session.
2. **Flood Moderation Events (CRUD):**
   * `APPROVE_REPORT`: Generated when a pending report is approved, triggering detour zone generation.
   * `REJECT_REPORT`: Generated when a pending report is dismissed.
3. **Detour Routing Events (CRUD):**
   * `DEACTIVATE_ZONE`: Logged when an active detour zone is manually disabled or expired early.
   * `DEACTIVATE_ZONES_BULK`: Logged when multiple zones are selected and disabled concurrently.
4. **User Registry Events (CRUD):**
   * `UPDATE_USER_STATUS`: Generated when an account is enabled or disabled.
   * `DELETE_USER`: Generated when a commuter or administrator account is permanently removed.

---

### Metadata JSON Payload Examples

#### Example 1: `LOGIN_FAILURE` (Access Log)
```json
{
  "attempted_username": "admin_pasig",
  "reason": "Invalid password signature match",
  "failure_count_streak": 3
}
```

#### Example 2: `APPROVE_REPORT` (CRUD Log)
```json
{
  "report_id": 412,
  "severity": "extreme",
  "detour_generated": {
    "zone_id": 89,
    "buffer_radius_meters": 100
  }
}
```

#### Example 3: `UPDATE_USER_STATUS` (CRUD Log)
```json
{
  "target_user_id": 14,
  "target_username": "commuter_juan",
  "previous_status": "active",
  "new_status": "disabled",
  "reason": "Spamming false flood reports"
}
```

### 🚨 What NOT to Log (Security Restrictions)
To prevent security breaches and maintain privacy compliance (GDPR/Data Privacy Act), the following properties **must never** be written to `metadata_json`:
* **Plain text passwords** or attempted password strings (logging these is a major security vulnerability).
* **JWT auth tokens** or session credentials.
* **Full credit card numbers** or payment detail metadata (not currently in LANES, but a critical general safeguard).

---

## 6. Audit Design: LANES vs. Smart Gate

LANES establishes a significant architectural upgrade compared to traditional spatial reference systems like **Smart Gate**:

* **Access + Action Unification:** Smart Gate only tracked standard database modifications (CRUD operations). LANES tracks both **CRUD events** (data changes) and **Access events** (logins, session logouts, and invalid login threats) in a unified, queryable schema.
* **JSONB Diff Tracking:** Smart Gate logged changes as flat string text summaries. LANES uses PostgreSQL's binary `JSONB` data type, enabling admins to write search queries targeting specific nested attributes (e.g. searching logs where a specific `zone_id` was affected) directly at the database layer.

---

## 7. Audit Integrity & Retention Policy

### Integrity Guardrails
* **`ON DELETE SET NULL` Enforcement:** If an administrator account is deleted, the log's `admin_id` column is set to `NULL`, but the log entry itself **remains fully intact**.
* **Immature Table Restrictions:** The database schema has no `UPDATE` or `DELETE` trigger paths declared for `audit_logs`. Once written, records are structurally immutable.

### Log Retention Policy
* **Recommended Retention Period:** **365 Days (1 Year)**.
* **Archiving Strategy:** 
  * After 365 days, audit logs are exported to cold storage (e.g. compressed CSV or JSON files stored in secure off-site folders) to keep the active database index compact.
  * The archived database partition is then safely purged using a cron scheduler script.

---

## 8. Advanced Architectural Recommendations

To elevate the LANES database infrastructure for production scaling and capstone validation compliance, we recommend implementing the following four database-level controls:

### 1. Centralized Constraint Naming Conventions
* **Description:** Force Alembic to generate predictable, standardized SQL constraint names (Unique keys, Foreign keys, Check constraints, and Primary keys).
* **How it works:** Pass a naming convention dict to the SQLAlchemy `MetaData` object.
* **Why it is important:** Prevents migration crashes across different operating systems (Windows development vs Linux production Docker containers) where default constraint names can diverge.

### 2. Soft Deletion Pattern for Flood Reports
* **Description:** Add a nullable `deleted_at` timestamp field to `flood_reports` instead of performing hard DDL deletions.
* **How it works:** Set `deleted_at` to UTC Now upon user removal. Exclude these records from normal commuter routing checks.
* **Why it is important:** Preserves historical coordinate data, enabling future AI models to run training reviews and forecast flood-prone sectors in Pasig City.

### 3. Connection Pooling and Timeout Calibration
* **Description:** Tune database connection pools to handle high concurrency during typhoon seasons.
* **How it works:** Set `pool_size=20`, `max_overflow=10`, and `pool_recycle=1800` inside backend engine settings.
* **Why it is important:** Prevents database connection exhaustion during peak routing request storms.

### 4. IP Validation Check Constraints
* **Description:** Force validation check constraints on the `ip_address` column in `audit_logs` at the PostgreSQL engine level.
* **How it works:** Apply a regular expression pattern checking for valid IPv4/IPv6 address blocks:
  ```sql
  ALTER TABLE audit_logs ADD CONSTRAINT chk_ip_address 
  CHECK (ip_address IS NULL OR ip_address ~ '^[0-9a-fA-F:.]+$');
  ```
* **Why it is important:** Hardens audit log entries against malicious payload injection attempts.


