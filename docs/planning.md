# LANES — Planning

> Tracking milestones, features, and development priorities.

---

## Completed Milestones (31+ Commits Integrated)

| # | Milestone | Status | Key Features Delivered |
|---|-----------|--------|------------------------|
| 1 | Architecture & Core Services | Completed | FastAPI setup, PostGIS routing, PWA support, Modular frontend, Domain-based backend structure |
| 2 | Advanced 3D Map Engine | Completed | 3D MapTiler integration, Pasig boundary overlay, Persistent Global Map, Location Autocomplete |
| 3 | Spatial Flooding & Routing | Completed | Road-based flood highlights, Dynamic route gradients, LineString avoidance logic, Ignore-floods toggle |
| 4 | Immersive UI & Navigation | Completed | Floating animated navigation (Framer Motion), FAB menu, Route picker panel, Split-screen Auth layout |
| 5 | Authentication & Identity | Completed | OTP Registration (Brevo integration), User Profiles, Profile Picture Uploads, Secure Sessions |
| 6 | RBAC & Admin Dashboard | Completed | 3NF DB Normalization, Roles CRUD, User Management, Audit Trails, Data Mgmt & System Settings |
| 7 | Real-Time Operations | Completed | WebSocket broadcasting, Live active zones, Real-time admin dashboard invalidations |
| 8 | Community Feed & Moderation | Completed | Feed layout, Upvotes/Downvotes, Post archiving, Soft deletes, Map coordinate rendering |

## Active Sprint (Next Feature)

**Goal:** Intelligent Dynamic Routing with Valhalla (Flood Polygon Avoidance)

- [x] Migrate engine from OSRM to Valhalla
- [x] Create `setup_valhalla.ps1` and update Docker configurations
- [x] Refactor backend `routing.py` to pass dynamic flood polygons
- [x] Implement fallback logic (avoid ALL -> avoid RED/ORANGE -> avoid RED)

**Design Decisions:**
- Replaced OSRM with Valhalla for dynamic polygon avoidance
- Valhalla natively supports geojson polygon avoidance natively in the API request

## Recently Completed

- [x] Migrated pathfinding engine to Valhalla for intelligent dynamic flood avoidance
- [x] Multi-Route Alternatives with clickable route selection and map ETA banners
- [x] Top Reporters leaderboard (live data, `GET /feed/leaderboard`)
- [x] Fix PostItem UI layout (large bottom padding issue)
- [x] Fix WebSocket connection errors on local network (proxy bypass issue)
- [x] Fix Share button crashing on local IP due to insecure context (added fallback)
- [x] Fix View on Map button for LineString geometries
- [x] Add placeholder alert for Reply/Comment button
- [x] Add explicit error handling for Upvote/Downvote mutation

## Backlog

- Implement Comments Section for reports
- Add authenticated routing for local networks

## Capstone Roadmap & Suggestions

> **Targeted for 1-2 Month Delivery Window**

### 1. Home Page & Onboarding (Quick Wins)
- [ ] **Flood Status Legend**: Add a clear breakdown of Low, Moderate, High, and Closed Roads on the home page.
- [ ] **Daily Stats**: Show the number of *verified* flood reports for the current day.
- [ ] **Site Visitors**: Display a metric for total active/historical site visitors.
- [ ] **Dynamic Weather Widget**: Integrate OpenWeatherMap API (reads from user profile location, defaults to Pasig).

### 2. Map & Routing Experience
- [ ] **Vehicle Profiles**: Refined clearance-based labels:
  - *4-Wheel High Clearance* (SUVs, Pickups)
  - *4-Wheel Low Clearance* (Sedans, Hatchbacks)
  - *2-Wheels* (Motorcycles, Bicycles)
  - *Pedestrian* (Walking)
- [ ] **Route Metrics**: Display "Safety %" and "Flood Risk" directly on alternative route banners.
- [ ] **Flood Timelines**: Show when a flood was reported and approved directly on the map popup.

### 3. Community Feed & Reporting
- [ ] **In-App Notification Center**: Global Bell Icon for comments, likes, and critical system alerts pinned to the top.
- [ ] **Create Post Button**: Allows users to post text/photos to the community feed with an optional location tag.
- [ ] **Report Hazard Button**: Jump straight to the Flood Report Panel.

### 4. Admin Panel & Report Moderation
- [ ] **Active Zones Full View**: Show timeline, reporter details, and actions (View, Edit, Deactivate, Archive).
- [ ] **Admin Dashboard Charts**: 
  - Pie Chart: Flood Severity Distribution.
  - Line Chart: Reports over time (Dynamic: Last 7 Days, Month, Year).
  - Bar Graph: Top 5 Most Flooded Barangays.

### 5. User Registry & Trust Score
- [ ] **User Metrics**: Track "Reports Submitted", "Accuracy Rate", and "Trust Score".
- [ ] **Rule-Based Expiration**: Admin configurable manual presets for flood expiration (e.g. 4 hours, 12 hours).

### 6. Defense Talking Points (Future ML Architecture)
- **Supervised Learning**: If DRMMO provides historical flood data (rainfall + expiration times), we can immediately train an ML model (using Python/scikit-learn) to predict future expirations.
- **Online Learning ("Self-Learning")**: Without initial DRMMO data, the system relies on Rule-Based Expiration for immediate accuracy. However, the architecture is designed to continuously collect live data. Once enough floods are naturally recorded over time, the system can seamlessly transition to Online Machine Learning to predict expiration times automatically.

## Known Issues

- Share and Clipboard API are disabled by browsers on non-HTTPS local IPs (except localhost).

---

## Routing — Known Constraints & Design Decisions

> **Reference this section when debugging multi-route alternative issues.**

### One-Way Road Limitations (Philippines Urban Grid)

Philippine cities — particularly Pasig, Mandaluyong, Marikina, and the Ortigas CBD — have a **dense network of one-way streets**. Valhalla strictly enforces one-way restrictions as encoded in OpenStreetMap data. This creates a known class of routing behaviour to be aware of:

#### What Happens

When Valhalla is asked for alternative routes (`alternates=2`), it may return **fewer than 3 routes**. Because Valhalla actively snuffs out routes that intersect avoided polygons, it might determine there are only 1 or 2 possible paths that don't violate one-way streets while avoiding the flood.

This is **not a bug** — it is Valhalla correctly refusing to suggest an illegal route.

#### Future Debugging Checklist

If alternative routes look wrong or are missing:
- [ ] Check the Valhalla response directly from the Python backend logs
- [ ] Confirm the OSM data has the correct one-way tags for that street segment (check `openstreetmap.org`)
- [ ] Verify the `philippines-latest.osm.pbf` data is not too old (current snapshot is from Geofabrik; re-run `setup_valhalla.ps1` to refresh)

#### OSM Data Currency

The routing graph is built from `philippines-latest.osm.pbf` downloaded from Geofabrik. One-way restrictions in the OSM data may lag behind real-world road changes. If a known road change is not reflected in routes, re-run the Valhalla build script:

```powershell
# From the repo root
.\setup_valhalla.ps1
```

Then restart the Valhalla Docker container:

```powershell
docker-compose restart valhalla
```
