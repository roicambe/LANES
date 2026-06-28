# Responsive Design Requirements

## 1. Mobile-First Approach

- Start with mobile styles — design for the smallest screen first (320px)
- Enhance with `min-width` breakpoints — add complexity as screen grows
- Never use `max-width` for mobile styles — this creates a desktop-first cascade

### Standard Breakpoints

| Label | Width | Layout Notes |
|-------|-------|--------------|
| Extra Small | `< 576px` | Baseline; single-column layout, large legible fonts, large tap targets |
| Small (Tablets) | `576px – 768px` | Landscape phones and smaller tablets; two-column sections or cards |
| Medium (Small Desktops) | `768px – 1024px` | Classic tablet portrait/landscape and smaller laptops; hamburger → full nav bar |
| Large (Standard Desktops) | `1024px – 1200px` | Full desktop; three-column grid systems possible |
| Extra Large | `1200px – 1440px+` | Max-width content containers for readable line lengths |

## 2. Responsive Typography

Create a typography token file at `frontend/styles/tokens/typography.tokens.ts`:

- Base font sizes in `rem` for each breakpoint
- Use `clamp()` for fluid scaling between breakpoints
- Create a heading scale (H1–H6) that scales proportionally
- Line height should scale with font size

## 3. Flexible Layouts

| ✅ Do | ❌ Don't |
|-------|----------|
| Use `%`, `vw`, `fr`, `flex`, `grid` | Fixed `px` widths |
| Use `max-width` + `width: 100%` — containers expand but never overflow | Fixed `width: 1200px` containers |
| Use `flex` and `grid` for auto-adjusting layouts | Hardcoded `height` on elements with dynamic content |
| Use `clamp()` for responsive sizing | |

## 4. Responsive Testing

### Required Viewports

- Small phone (iPhone SE / Android equivalent)
- Large phone (iPhone Pro Max / Galaxy Ultra)
- Tablet (iPad / Galaxy Tab)
- Laptop (13–15 inch)
- Large desktop (27+ inch)

### Required Test Scenarios

- Portrait and landscape orientation
- Low network speed (3G/4G)
- High-DPI screens (retina)
- Browser zoom (110%, 150%, 200%)
- At breakpoint boundaries
- At in-between sizes (e.g., 900px)
