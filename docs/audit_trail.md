# Audit Trail Process in Smart Gate

This document explains how the Audit Trail system works in the `Smart_Gate` project, including its internal logic, database schema, and frontend human-readable translation.

## 1. How Does it Work?

The audit trail is deeply integrated into the backend operations (implemented in `src-tauri/src/db.rs`). Whenever an administrative action occurs (like creating a user, updating system settings, or deleting an event), the `log_audit_action` function is called.

The system uses a **transaction-based approach**:
* The function accepts the action details along with the `old_values` and `new_values` formatted as JSON objects (`serde_json::Value`).
* It initiates a SQLite transaction. 
* First, it logs the overarching event.
* Then, it iterates through the keys of the JSON objects:
  * For **CREATE / BULK_ACTION**, it loops through `new_values` and records every non-empty field.
  * For **UPDATE**, it compares the `old_values` with `new_values`. It only records the specific fields that actually changed. If no fields changed, the entire audit transaction is rolled back so the system doesn't generate empty logs.
  * For **DELETE / ARCHIVE**, it loops through `old_values` to record what was removed.

## 2. What is Being Recorded?

The system records data at two different levels to maintain high granularity:

### Event-Level Data
* **`action_type`**: The operation performed (`CREATE`, `UPDATE`, `DELETE`, `ARCHIVE`, `RESTORE`, `BACKUP`, `SYSTEM_RESTORE`).
* **`entity_type`**: The category or table being modified (e.g., "Person", "Event", "System Settings").
* **`entity_label`**: A descriptive identifier for what was modified (e.g., the person's name or the event's name).
* **`entity_id`**: The primary key of the modified record.
* **`performed_by`**: The ID of the admin account that triggered the action.
* **`created_at`**: The exact timestamp of the action.

### Field-Level Data
* **`field_name`**: The specific database column that was modified.
* **`old_value`**: The value before the action (stored as a string).
* **`new_value`**: The value after the action (stored as a string).

## 3. What is the Database Design?

The audit trail uses a fully normalized relational design with two tables to separate the "Event" from the "Changes".

### `audit_events` (Parent Table)
Stores the high-level event details.
```sql
CREATE TABLE IF NOT EXISTS audit_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    action_type TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    entity_label TEXT NOT NULL,
    performed_by INTEGER NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (performed_by) REFERENCES accounts(account_id)
);
```

### `audit_changes` (Child Table)
Stores the individual field modifications, linked to the parent via `event_id` with a cascading delete constraint.
```sql
CREATE TABLE IF NOT EXISTS audit_changes (
    change_id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id INTEGER NOT NULL,
    field_name TEXT NOT NULL,
    old_value TEXT NULL,
    new_value TEXT NULL,
    FOREIGN KEY (event_id) REFERENCES audit_events(event_id) ON DELETE CASCADE
);
```

## 4. Converting JSON to Human-Readable Format

The backend passes raw database field names and stringified values to the frontend. In `frontend/src/components/views/AuditTrail.jsx`, the UI translates this into a user-friendly format using a few key mechanisms:

### Field Name Translation (`getFriendlyFieldName`)
It uses a predefined dictionary (`FRIENDLY_FIELD_NAMES`) to map raw keys to readable labels (e.g., `id_number` &rarr; "ID Number", `is_first_login` &rarr; "First Login Status"). If a key isn't in the dictionary, it dynamically replaces underscores with spaces and capitalizes the words (e.g., `system_name` &rarr; "System Name").

### Value Formatting (`formatFieldValue`)
It dynamically intercepts raw values and formats them based on context:
* **Booleans**: `1`, `0`, `true`, `false` are converted to "Yes" or "No".
* **Contextual Enums**: Specific boolean fields like `is_irregular` are mapped to "Irregular Student" / "Regular Student", and `is_part_time` is mapped to "Part-Time" / "Full-Time".
* **Security**: If the field is `password_hash`, it masks the output as "••••••••".
* **Binary/Blobs**: Image fields like `system_logo` return a simple "(image data)" text rather than dumping base64 strings into the UI.
* **Nulls**: Empty strings or `null` values are beautifully replaced with "---".

### Dynamic Summarization (`getShortSummary`)
The UI dynamically constructs a descriptive sentence based on the `action_type` and the fields found in the log. For example, instead of just saying "UPDATE", it will calculate the number of changes and output: 
* *"Updated 2 fields for John Doe"*
* *"Updated Contact Number for Jane Doe"*
* *"Created Person: Jane Doe (ID: 1234)"*
