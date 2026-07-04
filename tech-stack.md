# **LANES (Lanes PH) Finalized Tech Stack Blueprint**

### **Project: Flood-Adaptive Route Calculation and Visualization Web Platform**

### **Focus: Web Application (Responsive Desktop & Mobile Browser Layouts)**

This document serves as the official technical stack reference for the LANES platform. It outlines the specific tools, libraries, and frameworks utilized to build a fully self-hosted, free, and highly performant geospatial routing web application.

## **🛠️ Technical Stack Components**

### **1\. Client / Frontend Tier (Responsive Web Interface)**

* **Core Framework:** **Next.js (App Router) & React (TypeScript)**  
  * *Role:* Full-stack React framework providing SSR/SSG capabilities, file-based routing, and building modular, component-driven user interfaces.
* **Styling & Design System:** **Tailwind CSS v4**  
  * *Role:* Utility-first CSS framework for rapidly building premium, highly responsive, and dynamic user interfaces without writing custom CSS.
* **State Management & Fetching:** **TanStack React Query**  
  * *Role:* Asynchronous state management, caching, and background synchronization for interacting with the FastAPI backend.
* **Animations & Micro-interactions:** **Framer Motion**  
  * *Role:* Providing fluid, dynamic micro-animations (like expanding panels, fading modals, and dropdown transitions) to create a premium, responsive feel.
* **Offline & PWA Support:** **Next-PWA & idb-keyval**  
  * *Role:* Enabling Progressive Web App functionality and IndexedDB caching for offline resilience during poor network conditions.
* **Geospatial Render Canvas:** **MapLibre GL JS**  
  * *Role:* Open-source, WebGL-accelerated interactive 2D map renderer used to display vector basemaps, dynamic alternative routing polylines, and spatial flood avoidance zones.  
* **Map Base Tiles:** **OpenStreetMap Tiles & Photon API**  
  * *Role:* Rendering completely free street-level basemap imagery and providing rate-limited geocoding autocomplete features with zero commercial licensing caps.

### **2\. Backend / Core Engine Tier (Application Server)**

* **Programming Language:** **Python 3.11+**  
  * *Role:* Handling data collection scripts, natural language parsing, database queries, and routing logic under a unified, high-performance execution environment.  
* **Web Framework:** **FastAPI (with Uvicorn)**  
  * *Role:* Serving as the asynchronous application server to handle high-throughput client API requests, manage database transactions, and automatically generate interactive API documentation (/docs).  
* **NLP & Information Extraction:** **spaCy**  
  * *Role:* Managing the custom, locally executed Bilingual Named Entity Recognition (NER) pipeline to isolate street-level locations and severity parameters from Taglish text feeds.

### **3\. Spatial Database Tier (Persistence)**

* **Relational Database Engine:** **PostgreSQL**  
  * *Role:* Managing structured database storage for user reports, admin verification states, and historical logs.  
* **Spatial Extension:** **PostGIS**  
  * *Role:* Extending PostgreSQL to support native spatial geometry types (Points and Polygons), executing real-time spatial calculations (such as generating 50-meter buffer areas around coordinates), and building spatial indexes for fast intersection queries.  
* **Object-Relational Mapper (ORM):** **SQLAlchemy with GeoAlchemy2**  
  * *Role:* Binding database tables and spatial geography columns directly to Python schemas.

### **4\. Pathfinding Engine (Routing Graph Optimization)**

* **Engine Core:** **Open Source Routing Machine (OSRM)**  
  * *Role:* Running high-performance C++ routing calculations locally over the city road network. It processes dynamic detour requests by adjusting edge-weight cost matrices to bypass active flood barriers.  
* **Source Graph Data:** **OpenStreetMap Metro Manila Dataset (.osm.pbf)**  
  * *Role:* Providing the raw baseline network structure (nodes and edges representing physical streets) of the target municipalities.

### **5\. Evaluation & Testing Tier (Quality Assurance)**

* **Verification Libraries:** **scikit-learn & seqeval**  
  * *Role:* Running isolated validation scripts to compute linguistic extraction performance metrics (precision, recall, and F1-scores) for the custom NLP model.