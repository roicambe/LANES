"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useSearchParams } from "next/navigation";
import { parseCoords } from "@/features/geocoding/geocodingApi";
import { getRoute, type RouteGeometry, type RouteResult } from "@/features/routing/routingApi";

export type ActivePoint = "start" | "end";

export interface MapPoint {
  coords: [number, number];
  label: string;
}

interface MapContextValue {
  start: MapPoint | null;
  end: MapPoint | null;
  activePoint: ActivePoint;
  routeGeometry: RouteGeometry | null;
  routeInfo: Omit<RouteResult, "geometry"> | null;
  isRouting: boolean;
  routeError: string | null;
  setActivePoint: (point: ActivePoint) => void;
  setStart: (coords: [number, number], label?: string) => void;
  setEnd: (coords: [number, number], label?: string) => void;
  setStartLabel: (label: string) => void;
  setEndLabel: (label: string) => void;
  setPointFromMap: (coords: [number, number]) => void;
  clearRoute: () => void;
}

const MapContext = createContext<MapContextValue | null>(null);

function coordsLabel(coords: [number, number]): string {
  return `${coords[0].toFixed(5)}, ${coords[1].toFixed(5)}`;
}

export function MapProvider({ children }: { children: ReactNode }) {
  const searchParams = useSearchParams();
  const locationParam = searchParams.get("location");
  const typeParam = searchParams.get("type") as ActivePoint | null;
  const labelParam = searchParams.get("label");

  const [start, setStartState] = useState<MapPoint | null>(null);
  const [end, setEndState] = useState<MapPoint | null>(null);
  const [activePoint, setActivePoint] = useState<ActivePoint>("start");
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
  const [routeInfo, setRouteInfo] = useState<Omit<RouteResult, "geometry"> | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  useEffect(() => {
    if (!locationParam) return;

    const coords = parseCoords(locationParam);
    if (!coords) return;

    const label = labelParam ?? coordsLabel(coords);
    const pointType = typeParam === "end" ? "end" : "start";

    if (pointType === "end") {
      setEndState({ coords, label });
      setActivePoint("start");
    } else {
      setStartState({ coords, label });
      setActivePoint("end");
    }
  }, [locationParam, typeParam, labelParam]);

  const setStart = useCallback((coords: [number, number], label?: string) => {
    setStartState({ coords, label: label ?? coordsLabel(coords) });
    setRouteGeometry(null);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const setEnd = useCallback((coords: [number, number], label?: string) => {
    setEndState({ coords, label: label ?? coordsLabel(coords) });
    setRouteGeometry(null);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const setStartLabel = useCallback((label: string) => {
    setStartState((prev) => (prev ? { ...prev, label } : null));
  }, []);

  const setEndLabel = useCallback((label: string) => {
    setEndState((prev) => (prev ? { ...prev, label } : null));
  }, []);

  const setPointFromMap = useCallback(
    (coords: [number, number]) => {
      const label = coordsLabel(coords);
      if (activePoint === "start") {
        setStart(coords, label);
      } else {
        setEnd(coords, label);
      }
    },
    [activePoint, setStart, setEnd]
  );

  const clearRoute = useCallback(() => {
    setRouteGeometry(null);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  useEffect(() => {
    if (!start || !end) {
      clearRoute();
      return;
    }

    let cancelled = false;

    const fetchRoute = async () => {
      setIsRouting(true);
      setRouteError(null);

      try {
        const result = await getRoute(start.coords, end.coords);
        if (cancelled) return;

        setRouteGeometry(result.geometry);
        setRouteInfo({
          distance: result.distance,
          duration: result.duration,
          avoided_floods: result.avoided_floods,
          blocked: result.blocked,
        });
      } catch {
        if (!cancelled) {
          setRouteError("Could not calculate route. Check that the backend is running.");
          setRouteGeometry(null);
          setRouteInfo(null);
        }
      } finally {
        if (!cancelled) setIsRouting(false);
      }
    };

    void fetchRoute();

    return () => {
      cancelled = true;
    };
  }, [start, end, clearRoute]);

  const value = useMemo<MapContextValue>(
    () => ({
      start,
      end,
      activePoint,
      routeGeometry,
      routeInfo,
      isRouting,
      routeError,
      setActivePoint,
      setStart,
      setEnd,
      setStartLabel,
      setEndLabel,
      setPointFromMap,
      clearRoute,
    }),
    [
      start,
      end,
      activePoint,
      routeGeometry,
      routeInfo,
      isRouting,
      routeError,
      setStart,
      setEnd,
      setStartLabel,
      setEndLabel,
      setPointFromMap,
      clearRoute,
    ]
  );

  return <MapContext.Provider value={value}>{children}</MapContext.Provider>;
}

export function useMapContext(): MapContextValue {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error("useMapContext must be used within a MapProvider");
  }
  return context;
}
