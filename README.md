# LANES

LANES (Localised Alternative Navigation for Environs under Submersion) is a real-time, flood-adaptive navigation system for commuters in Pasig City. Using NLP to process unstructured text from social media and local reports, it dynamically updates maps to route drivers away from flooded streets, offering a new safety layer during severe weather.

## Project Structure
- `/frontend`: Next.js application with maplibre-gl for the commuter and admin dashboards.
- `/backend`: FastAPI application for the API server, database connection (PostgreSQL/PostGIS), and NLP processing (spaCy).

## Local Development Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Python** (3.11 or 3.12 highly recommended). *Note: Avoid Python 3.13+ for now, as heavy machine learning libraries like `spacy` do not have pre-compiled packages for it yet, leading to C-compiler build errors.*
- **PostgreSQL** with the PostGIS extension (Running via Docker is the easiest method).

---

### 1. Frontend Setup (Next.js)
Open a terminal and navigate to the `frontend` folder:

```bash
cd frontend
```

Install the Node dependencies:
```bash
npm install
```

Start the development server:
```bash
npm run dev
```

---

### 2. Backend Setup (FastAPI & Python)
Open a new terminal tab and navigate to the `backend` folder:

```bash
cd backend
```

Create a new Python virtual environment to isolate the project's dependencies:
```bash
# On Windows
py -3.12 -m venv venv

# On Mac/Linux
python3.12 -m venv venv
```

Activate the virtual environment:
```bash
# On Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# On Mac/Linux
source venv/bin/activate
```

Install the required Python packages:
```bash
pip install -r requirements.txt
```

Finally, download the required spaCy English language model for the NLP pipeline:
```bash
python -m spacy download en_core_web_sm
```
