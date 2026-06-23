# LANES: Flood-Adaptive Route Calculation Platform
## System Design & Architecture Documentation

LANES (Localised Alternative Navigation for Environs under Submersion) is an intelligent, real-time routing platform that dynamically computes safe transit vectors in Pasig City by converting unstructured bilingual flood reports into spatial database barriers.

---

## 1. High-Level Architecture (Three-Tier Decoupled Model)

The platform utilizes a strictly decoupled, three-tier architecture designed to isolate client-side rendering from resource-intensive spatial computations, NLP tokenization, and route planning.

```mermaid
graph LR
    subgraph Client Tier [Presentation Shell]
        NextJS[Next.js App Router]
        Tailwind[Tailwind CSS UI]
        MapLibre[MapLibre GL JS]
    end

    subgraph Service Tier [Backend Processing Core]
        FastAPI[FastAPI ASGI Server]
        SQLAlchemy[SQLAlchemy ORM]
        spaCy[spaCy NLP Parser]
        OSRM[OSRM Engine]
    end

    subgraph Persistence Tier [Data Layer]
        PostGIS[(PostgreSQL + PostGIS)]
    end

    %% Interactions
    NextJS -- HTTP REST API / JSON --> FastAPI
    MapLibre -- Vectors / GeoJSON --> NextJS
    FastAPI -- SQL + Spatial Queries --> PostGIS
    FastAPI -- Route Optimization Queries --> OSRM
```

### A. Frontend Presentation Shell (`frontend`)
* **Framework:** Next.js (App Router, Client-Side Rendering).
* **Styling Framework:** Tailwind CSS for responsive layouts.
* **Mapping Engine:** MapLibre GL JS utilizing client-side WebGL vector pipelines.
* **Iconography:** Lucide React for consistent, lightweight vector-style SVG icons.
* **Role:** A stateless, interactive spatial dashboard showing the commuting canvas, placing start/end coordinates, and overlaying flood pins and hazard polygons.

### B. Backend Processing Core (`backend`)
* **Framework:** Python, FastAPI (ASGI server pipeline).
* **Geospatial ORM:** SQLAlchemy paired with GeoAlchemy2 mapping.
* **NLP Processing Stack:** spaCy using a custom-trained Bilingual Named Entity Recognition (NER) pipeline.
* **Routing Compute Engine:** Open Source Routing Machine (OSRM) matrix calculations.
* **Role:** Handles text ingestion, processes Taglish depth phrases into standardized severity scales, queries coordinate geocodes, and serves route calculations.

---

## 2. Core Database Schema & Relations

The data tier is engineered using PostgreSQL with the PostGIS spatial extension. To prevent write anomalies and ensure academic rigor, the database is normalized up to Third Normal Form (3NF).

```mermaid
erDiagram
    users {
        int id PK
        string username
        string email
        string password_hash
        string role
        boolean is_active
        timestamp created_at
    }

    flood_reports {
        int id PK
        string raw_text
        string source
        string severity
        string status
        geometry geometry_point "Point (SRID 4326)"
        timestamp created_at
        timestamp updated_at
    }

    flood_avoidance_zones {
        int id PK
        int report_id FK "References flood_reports.id"
        boolean is_active
        geometry geometry_polygon "Polygon (SRID 4326)"
        timestamp expires_at
        timestamp created_at
    }

    flood_reports ||--o| flood_avoidance_zones : "generates (1:1 / 1:0)"
```

### A. Normalization Details (3NF Compliance)
* **First Normal Form (1NF):** Every cell contains atomic values (e.g. separating latitude and longitude into structured GeoJSON arrays or decimal values rather than single comma-separated strings).
* **Second Normal Form (2NF):** Eliminates partial dependencies. All non-key fields (such as `raw_text`, `severity`) depend fully on the primary key `id`.
* **Third Normal Form (3NF):** Eliminates transitive dependencies. All fields inside `flood_reports` are independent of each other and depend solely on the primary key.
* **Scraping Metadata (JSONB):** High-velocity scrapers store variable metadata payloads (e.g. social media profiles, raw API responses) in native `JSONB` columns to ensure structural flexibility without violating normalization constraints.

---

## 3. Data Processing & Spatial Pipeline

This flowchart outlines how raw, unstructured Taglish text is captured, analyzed, validated by local disaster administrators, geocoded, and ultimately injected as physical barriers into the navigation engine.

```mermaid
flowchart TD
    %% Source Ingestion
    In[Social Feeds, News RSS, Manual Reports] --> Scraper[Stream Scraper Service]
    Scraper --> RawText["Raw taglish string: 'Baha sa Caruncho Ave, lagpas tuhod'"]
    
    %% NLP Pipeline
    RawText --> NLP["Bilingual NLP Parser (spaCy NER)"]
    NLP --> LocationEntity["Location: 'Caruncho Ave'"]
    NLP --> SeverityEntity["Depth: 'lagpas tuhod' -> High Severity"]
    
    %% NLP Confidence Layer
    LocationEntity & SeverityEntity --> Confidence["Confidence Scoring Layer"]
    Confidence --> StoredConfidence["Store: location_confidence & severity_confidence"]
    
    %% Moderation & Database
    StoredConfidence --> Queue["Admin Moderation Queue (Admin Review)"]
    Queue -- "Admin Approved (DRRM)" --> Geocode["OSM Geocoding: [121.080, 14.559]"]
    Geocode --> DBInsert["Insert into PostGIS DB"]
    
    %% Spatial Buffer
    DBInsert --> Buffer["ST_Buffer (Geom, 50m)"]
    Buffer --> Polygon["50m Avoidance Bounding Polygon (SRID 4326)"]
    
    %% Routing Engine
    Polygon --> Router["OSRM Routing Engine"]
    Router -- "Intercepts Commuter Route Request" --> Weight["Set affected road edge weights to infinity (∞)"]
    Weight --> RouteCalculated["Compute Safe Detour Path"]
```

### A. AI/NLP Confidence Scoring Layer
To prevent automated ingestion errors and mapping hallucinations, raw reports are filtered through a confidence pipeline before reaching the administration dashboard:
1. **Confidence Ingestion**: The system evaluates text string entities using machine learning weights.
2. **Confidence Storing**: The schema stores two distinct numeric validation metrics for every incoming report:
   * `location_confidence`: Named Entity Recognition (NER) output probability rating (value 0.0 to 1.0) indicating coordinate parsing precision.
   * `severity_confidence`: Regex/Keyword depth mapping density rating (value 0.0 to 1.0) indicating Taglish depth phrase matching precision.
3. **moderation Flow**: 
   $$\text{NLP Parsing} \longrightarrow \text{Confidence Scoring} \longrightarrow \text{DRRM Admin Review Queue}$$

---

## 4. UI Philosophy: Illustrated Minimalist Spatial System

LANES follows an **Illustrated Minimalist Spatial Design Philosophy**.

The interface is designed for **real-time disaster navigation**, where clarity, speed, and comprehension are more important than visual decoration.

The system combines three layers of design:

### 1. Spatial Truth Layer (Map as Reality)
- The map is the primary source of truth
- All routing, flood data, and hazards are visualized directly on MapLibre GL
- No UI element should obstruct map understanding
- Geographic accuracy is prioritized over visual styling

### 2. Minimal Interaction Layer (UI as Control)
- The interface is intentionally minimal
- Only essential controls are shown (origin, destination, route actions)
- UI components follow a clean, flat, distraction-free design
- No unnecessary navigation menus or decorative elements
- All interactions must be executable within 1–2 steps

### 3. Illustration Interpretation Layer (Meaning & Guidance)
- Illustrations are used to explain system states and complex spatial conditions
- They act as visual translators, not decoration
- Used for:
  - Flood severity explanation
  - System status (loading, offline, no route found)
  - User guidance (how to use the system)
  - Emergency context reinforcement

Illustrations must always support understanding, never distract from map data.

---

## Core Design Principles

### 1. Clarity Under Stress
The interface must remain understandable in emergency situations such as heavy rain, low visibility, or high cognitive load.

### 2. Map-First Experience
The map is the core interface. UI and illustrations exist only to enhance spatial understanding.

### 3. Minimal Cognitive Load
Every screen must be readable within 3 seconds without explanation.

### 4. Illustration-Driven Communication
Complex system states should be communicated visually using simple, consistent vector-style illustrations.

### 5. Fast Interaction Model
All critical actions (route input, recalculation, rerouting) must require minimal steps and immediate feedback.

---

## Visual Hierarchy

1. Map Layer → Primary spatial data (routes, floods, hazards)
2. UI Layer → Controls and navigation input
3. Illustration Layer → Context, meaning, and system state explanation

---

## Design Style Summary

- Style: Illustrated Minimalism
- Layout: Spatial-first (map dominant)
- Components: Minimal, reusable, utility-based (Tailwind)
- Graphics: Simple SVG-based illustrations only
- Emotion: Calm, neutral, informative (not decorative)
- Priority: Speed, clarity, survival-grade usability

---

## Anti-Design Rules (Strict)

- No heavy animations during critical routing
- No decorative-only UI elements
- No cluttered dashboards
- No multi-step forms for emergency actions
- No visual noise that reduces map clarity

---

## 5. Security & Access Architecture

### A. Principle of Least Privilege (PoLP)
The database enforces strict role separation:
* **Administrative Role (`postgres`):** Restricts database layout alterations, table setup, migrations, and table truncations to migration scripts.
* **Runtime Application Role (`lanes_app`):** Used by the FastAPI backend. Restricted to basic operations (`SELECT`, `INSERT`, `UPDATE`) inside the `public` schema. It cannot execute administrative changes (such as dropping tables).

### B. Idempotent Data Seeding
To allow repeatable testing and predictable map initialization during presentations:
* The seeder script executes `ON CONFLICT DO NOTHING` database directives or resets primary keys via `TRUNCATE ... RESTART IDENTITY CASCADE`.
* This ensures repeated test executions do not create duplicate marker overlays or stack overlapping polygons.

### C. Connection Hardening
* The database authentication layer implements **`scram-sha-256`** password exchange to prevent cleartext credentials leakage.

### D. Authentication Architecture
* **Algorithm:** Passwords are securely hashed using **PBKDF2 with SHA-256** and a key length of 32 bytes.
* **Key Stretching:** The hashing pipeline executes a default of **100,000 iterations** to prevent high-performance brute-force or dictionary-based attacks.
* **Salting Strategy:** Uses a static cryptographic salt key to enforce password complexity checks across commuter and DRRM administrator credentials.
* **Role Permissions Isolation:** Users are categorized under two primary roles:
  * `commuter`: Standard client access for route calculations, incident displays, and crowd alert broadcasts.
  * `admin` / `drrm`: Destructive administrative privileges, moderating incoming reports, and adjusting or deleting active avoidance buffers.

### E. Authentication & Authorization Flow
Access to secure administrative endpoints undergoes a multi-layer verification check:

```mermaid
graph TD
    A[Admin Login] --> B[JWT Authentication Token Issued]
    B --> C[FastAPI Dependency Middleware]
    C --> D[Role Validation Check: role == 'admin']
    D --> E[Access Granted to Protected Admin Resources]
    D -- "Validation Failed" --> F[403 Forbidden Response]
```

---

## 6. Non-Functional Requirements (NFRs)

To guarantee the platform runs successfully during weather-induced emergency scenarios, the system adheres to the following performance bounds:
* **Latency constraint:** Route calculation and flood bypassing response queries must resolve in **under 3 seconds** under ordinary network conditions.
* **Service Reliability:** Ensure a **99% service availability rate** for the API gateway and routing engines during severe weather events and operational periods.
* **Volume Capability:** The spatial database and routing parser are optimized to support and query **thousands of simultaneous flood reports** without connection pool exhaustion.
* **Fault Tolerance:** Under the decoupled architecture, **the system continues operating despite individual service failures** (e.g. if the database is offline, route requests fall back gracefully to direct routing).

---

## 7. System Constraints & Assumptions

### A. Assumptions
* **Internet Connectivity:** The client dashboard requires a stable internet connection to fetch vector maps and make async API queries to the backend.
* **Map Data Availability:** The OpenStreetMap (OSM) public dataset or Google Maps database services remain online and reachable for geocoding and base mapping.
* **Legible Reports:** Incoming crowd alerts contain recognizable location strings or street tokens that can be mapped to real coordinates.

### B. Constraints
* **Base Map Quality:** Routing safety and coordinates geocoding precision are bound to the underlying layout accuracy of OpenStreetMap/Google Maps network topology.
* **NLP Training Limitations:** Natural Language Processing entity extraction relies on training dataset coverage (specifically Taglish conversational patterns and spelling variants).
* **Geocoder Resolution:** Conversion from text strings (e.g. "Caruncho Ave") to coordinates is limited by the resolution and coverage of local GIS database mappings.

---

## 8. Audit Logging & Moderation Logs

To maintain administrative accountability and track disaster database updates:
* **`moderation_logs`**: Automatically tracks every report moderation event. Stores the `admin_id` of the reviewing officer, the action executed (`approved`, `rejected`, `adjusted`), and the database record timestamp.
* **`audit_logs`**: Tracks critical state modifications (e.g. system variable updates, bulk avoidance zone changes) to create a tamper-evident administrative timeline.


