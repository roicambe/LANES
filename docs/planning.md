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

- [ ] Design UI for Recommended Routes (Rerouting)
- [ ] Implement multi-route fetching logic with OSRM (alternative routes)
- [ ] Allow users to pick recommended route to bypass floods
- [ ] Render alternative routes on the map (highlighting selected)

## Recently Completed

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
