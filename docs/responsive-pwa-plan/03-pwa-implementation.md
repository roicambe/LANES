# PWA Implementation

Use `next-pwa` to configure the service worker and manifest.

---

## Offline Support

### Must Cache

| Asset | Reason |
|-------|--------|
| App shell (HTML, CSS, JS) | Core UI |
| MapLibre GL JS library | Map rendering |
| Map tiles (at least basic view) | Offline map display |
| SVG illustrations | UI graphics |
| Font files | Typography |
| Logo / branding assets | Brand identity |

### Offline Fallback

- Show "No Connection" illustration when offline
- Cache recent routes for offline reference
- Store pending reports in IndexedDB; submit when connection restores
- Inform user of offline status via a persistent banner or toast
