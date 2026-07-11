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
