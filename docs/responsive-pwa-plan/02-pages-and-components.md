# Pages & Components

---

## 1. Landing Page

**Purpose:** First impression and entry point for new users.

**Required Elements:**
- Hero section with tagline
- Brief explanation of LANES
- Call-to-action: Login / Register buttons
- Flood severity legend preview

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Single-column, stacked content |
| Tablet | Two-column hero layout |
| Desktop | Full hero with illustration |

---

## 2. Navigation Bar

**Purpose:** Primary navigation across the application.

**Required Elements:**
- App logo (LANES branding)
- Navigation links: Home, Dashboard, Admin (conditional)
- User avatar with dropdown (Profile, Logout)
- Flood alert indicator (live count)

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Collapsed hamburger menu, slide-out sidebar |
| Tablet | Collapsed hamburger menu, slide-out sidebar |
| Desktop | Full horizontal navigation bar |

### Mobile Bottom Navigation (`components/layout/MobileNav.tsx`)

- Home, Route, Reports, Profile (4 tabs maximum)
- Only visible on mobile screens
- Touch-friendly with active state indicators

---

## 3. Map Container

**Purpose:** The spatial truth layer — primary map display.

**Required Elements:**
- MapLibre GL JS instance
- Vector tile rendering
- Flood polygon overlays (color-coded)
- Route path overlay
- User location marker

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Full-screen map with overlay controls |
| Tablet | Full-screen map with overlay controls |
| Desktop | Full-screen map with overlay controls |

**Map Must:**
- Fill available viewport space
- Never be obstructed by UI
- Maintain interaction (pan, zoom, rotate)

---

## 4. Route Controls

**Purpose:** Input for origin and destination.

**Required Elements:**
- Origin input (text or geocoder)
- Destination input (text or geocoder)
- "Calculate Route" button
- Swap origin/destination button
- Current location button

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Stacked inputs, bottom sheet or top overlay |
| Tablet | Side panel or overlay |
| Desktop | Side panel |

**Interaction:**
- Autocomplete for address search
- Click on map to set points
- Drag to reorder

---

## 5. Route Panel

**Purpose:** Display route information after calculation.

**Required Elements:**
- Route summary: Distance, estimated time
- Step-by-step directions (turn-by-turn)
- Flood warnings along the route
- Alternative route suggestions
- Save route button (optional)

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Collapsible bottom sheet (drag to expand) |
| Tablet | Side panel or bottom sheet |
| Desktop | Side panel |

---

## 6. Flood Legend

**Purpose:** Explain color-coded severity levels.

| Color | Meaning |
|-------|---------|
| White | Low / Passable |
| Yellow | Moderate / Warning |
| Orange | High / Hazardous |
| Red | Extreme / Impassable |

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Compact horizontal bar |
| Tablet | Vertical list |
| Desktop | Vertical list |

---

## 7. Admin Dashboard

**Purpose:** DRRM officer moderation interface.

**Required Elements:**
- Report moderation queue
- Approve / Reject / Edit actions
- Report details view (raw text, location, severity)
- Active flood zones management
- Statistics: Total reports, pending, active

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Card-based list view |
| Tablet | Table view |
| Desktop | Table view with filters |

---

## 8. Login Page

**Purpose:** User authentication.

**Required Elements:**
- Email / username input
- Password input
- Login button
- Register link
- Forgot password link

**Responsive Behavior:**
| Viewport | Layout |
|----------|--------|
| Mobile | Full-screen centered card |
| Tablet | Centered card |
| Desktop | Centered card |

---

## Component Guidelines (to create)

| Component | Notes |
|-----------|-------|
| `Button` | Reusable, variant-based |
| `Input` | With label, error state |
| `Card` | Container for grouped content |
| `Spinner` | Loading indicator |
| `Illustration` | SVG-based, used in empty/error states |

---

## Custom Hooks (`frontend/hooks/`)

| Hook | Purpose |
|------|---------|
| `useResponsive` | Detect screen size for conditional rendering |
| `useMap` | MapLibre GL JS lifecycle |
| `useRoute` | Route calculation and state |
| `useAuth` | Authentication state and actions |

---

## API Integration

Create a centralized API client module that handles:
- Base URL configuration
- Request/response interceptors
- Auth token injection
- Error normalization
