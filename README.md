# LANES

LANES (Localised Alternative Navigation for Environs under Submersion) is a real-time, flood-adaptive navigation system for commuters in Pasig City. Using NLP to process unstructured text from social media and local reports, it dynamically updates maps to route drivers away from flooded streets, offering a new safety layer during severe weather.

## Project Structure
- `/frontend`: Next.js application (using MapLibre GL JS) for the commuter and admin dashboards.
- `/backend`: FastAPI application for the API server, database connection (PostgreSQL/PostGIS), and pathfinding service.

---

## Local Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.11 or 3.12 highly recommended). *Note: Avoid Python 3.13+ for now, as heavy machine learning libraries like `spacy` do not have pre-compiled packages for it yet, leading to C-compiler build errors.*
- **Docker Desktop** (Optional, but recommended for running the local PostGIS spatial database).


---

### 1. Database Setup (PostGIS)
The project includes a pre-configured `docker-compose.yml` in the root folder to start a PostgreSQL instance with the PostGIS spatial extension.

From the root directory of the project, run:
```bash
docker compose up -d
```
This starts the database on port `5432` with username `postgres`, password `postgres`, and database name `lanes`.

*(If Docker is not running or installed, the backend operates in a database-offline fallback mode. Routing requests will still succeed, but they will not calculate flood avoidance detours since the flood zones are queried from the database).*

---

### 2. Backend Setup & Run (FastAPI)
1. Open a terminal and navigate to the `backend` folder:
   ```bash
   cd backend
   ```

2. Create a virtual environment:
   ```bash
   # On Windows
   py -3.12 -m venv venv
   
   # On Mac/Linux
   python3.12 -m venv venv
   ```

3. Activate the virtual environment:
   ```bash
   # On Windows (PowerShell)
   .\venv\Scripts\Activate.ps1
   
   # On Mac/Linux
   source venv/bin/activate
   ```

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Download the spaCy English NLP model:
   ```bash
   python -m spacy download en_core_web_sm
   ```

6. Configure environment variables. Copy `.env.example` to `.env` and fill in your values:
   ```bash
   cp .env.example .env
   ```
   Set your `DATABASE_URL` and `GOOGLE_MAPS_API_KEY` (if migrating to Google Maps).

7. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload
   ```
   The backend server will run on `http://localhost:8000`.

---

### 3. Frontend Setup & Run (Next.js)
1. Open a new terminal tab/window and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend dashboard will be available at `http://localhost:3000`.

---

## Troubleshooting & Fallback Modes
- **TypeError: Failed to fetch (Frontend):** Ensure the backend FastAPI server is running on `http://localhost:8000` (e.g. check that uvicorn didn't crash or is listening on a different port).
- **Database Connection Offline:** If Postgres is not running, the backend logs a warning: `Could not create database tables on startup. Continuing startup...`. The API will remain active, and pathfinding queries will return direct paths without PostGIS detour calculations.


