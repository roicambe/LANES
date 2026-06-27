import { Suspense } from "react";
import MapCanvas from "@/features/map/MapCanvas";
import { MapProvider } from "@/features/map/MapContext";
import RoutePanel from "@/features/routing/RoutePanel";
import FloodOverlay from "@/features/hazards/FloodOverlay";

function MapPageContent() {
  return (
    <MapProvider>
      <MapCanvas />
      <FloodOverlay />
      <RoutePanel />
    </MapProvider>
  );
}

export default function MapPage() {
  return (
    <main className="relative w-full h-screen overflow-hidden">
      <Suspense
        fallback={
          <div className="flex items-center justify-center h-screen text-gray-500">
            Loading map...
          </div>
        }
      >
        <MapPageContent />
      </Suspense>
    </main>
  );
}
