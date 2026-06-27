export const metadata = {
  title: "Map | LANES",
};

export default function MapPage() {
  // The actual Map, FloodOverlay, and RoutePanel are now rendered globally 
  // via GlobalMap in providers.tsx so they persist across page changes.
  return <main className="relative w-full h-screen overflow-hidden pointer-events-none" />;
}
