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

export type ActivePoint = "start" | "end" | "flood_start" | "flood_end" | null;
export type ActivePanel = "route" | "flood" | null;

export interface MapPoint {
  coords: [number, number];
  label: string;
}

interface MapContextValue {
  start: MapPoint | null;
  end: MapPoint | null;
  activePoint: ActivePoint;
  activePanel: ActivePanel;
  routeGeometry: RouteGeometry | null;
  routeInfo: Omit<RouteResult, "geometry"> | null;
  isRouting: boolean;
  routeError: string | null;
  isPickingOnMap: boolean;
  isReportPanelOpen: boolean;
  hasBottomOffset: boolean;
  setIsPickingOnMap: (value: boolean) => void;
  setIsReportPanelOpen: (value: boolean) => void;
  setActivePoint: (point: ActivePoint) => void;
  setActivePanel: (panel: ActivePanel) => void;
  setStart: (coords: [number, number] | null, label?: string) => void;
  setEnd: (coords: [number, number] | null, label?: string) => void;
  setStartLabel: (label: string) => void;
  setEndLabel: (label: string) => void;
  setPointFromMap: (coords: [number, number]) => void;
  floodStart: MapPoint | null;
  floodEnd: MapPoint | null;
  floodPreviewGeometry: RouteGeometry | null;
  setFloodStart: (coords: [number, number] | null, label?: string) => void;
  setFloodEnd: (coords: [number, number] | null, label?: string) => void;
  setFloodStartLabel: (label: string) => void;
  setFloodEndLabel: (label: string) => void;
  clearRoute: () => void;
  resetAll: () => void;
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
  const [activePoint, setActivePoint] = useState<ActivePoint>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("route");
  const [routeGeometry, setRouteGeometry] = useState<RouteGeometry | null>(null);
  const [routeInfo, setRouteInfo] = useState<Omit<RouteResult, "geometry"> | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [isPickingOnMap, setIsPickingOnMap] = useState(false);
  const [isReportPanelOpen, setIsReportPanelOpen] = useState(false);
  
  const hasBottomOffset = isReportPanelOpen && !isPickingOnMap;

  const [floodStart, setFloodStartState] = useState<MapPoint | null>(null);
  const [floodEnd, setFloodEndState] = useState<MapPoint | null>(null);
  const [floodPreviewGeometry, setFloodPreviewGeometry] = useState<RouteGeometry | null>(null);

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

  const setStart = useCallback((coords: [number, number] | null, label?: string) => {
    if (coords === null) {
      setStartState(null);
    } else {
      setStartState({ coords, label: label ?? coordsLabel(coords) });
    }
    setRouteGeometry(null);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const setEnd = useCallback((coords: [number, number] | null, label?: string) => {
    if (coords === null) {
      setEndState(null);
    } else {
      setEndState({ coords, label: label ?? coordsLabel(coords) });
    }
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

  const setFloodStart = useCallback((coords: [number, number] | null, label?: string) => {
    if (coords === null) {
      setFloodStartState(null);
    } else {
      setFloodStartState({ coords, label: label ?? coordsLabel(coords) });
    }
  }, []);

  const setFloodEnd = useCallback((coords: [number, number] | null, label?: string) => {
    if (coords === null) {
      setFloodEndState(null);
    } else {
      setFloodEndState({ coords, label: label ?? coordsLabel(coords) });
    }
  }, []);

  const setFloodStartLabel = useCallback((label: string) => {
    setFloodStartState((prev) => (prev ? { ...prev, label } : null));
  }, []);

  const setFloodEndLabel = useCallback((label: string) => {
    setFloodEndState((prev) => (prev ? { ...prev, label } : null));
  }, []);

  const setPointFromMap = useCallback(
    (coords: [number, number]) => {
      if (!activePoint) return;
      const label = coordsLabel(coords);
      if (activePoint === "start") {
        setStart(coords, label);
      } else if (activePoint === "end") {
        setEnd(coords, label);
      } else if (activePoint === "flood_start") {
        setFloodStart(coords, label);
      } else if (activePoint === "flood_end") {
        setFloodEnd(coords, label);
      }
    },
    [activePoint, setStart, setEnd, setFloodStart, setFloodEnd]
  );

  const clearRoute = useCallback(() => {
    setRouteGeometry(null);
    setRouteInfo(null);
    setRouteError(null);
  }, []);

  const resetAll = useCallback(() => {
    setStartState(null);
    setEndState(null);
    setFloodStartState(null);
    setFloodEndState(null);
    setFloodPreviewGeometry(null);
    setActivePoint("start");
    clearRoute();
  }, [clearRoute]);

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

  useEffect(() => {
    if (!floodStart || !floodEnd) {
      setFloodPreviewGeometry(null);
      return;
    }

    let cancelled = false;

    const fetchFloodPreview = async () => {
      try {
        const result = await getRoute(floodStart.coords, floodEnd.coords, true); // ignore_floods = true
        if (cancelled) return;
        setFloodPreviewGeometry(result.geometry);
      } catch {
        if (!cancelled) {
          setFloodPreviewGeometry(null);
        }
      }
    };

    void fetchFloodPreview();

    return () => {
      cancelled = true;
    };
  }, [floodStart, floodEnd]);

  const value = useMemo<MapContextValue>(
    () => ({
      start,
      end,
      activePoint,
      activePanel,
      routeGeometry,
      routeInfo,
      isRouting,
      routeError,
      isPickingOnMap,
      isReportPanelOpen,
      hasBottomOffset,
      floodStart,
      floodEnd,
      floodPreviewGeometry,
      setIsPickingOnMap,
      setIsReportPanelOpen,
      setActivePoint,
      setActivePanel,
      setStart,
      setEnd,
      setStartLabel,
      setEndLabel,
      setFloodStart,
      setFloodEnd,
      setFloodStartLabel,
      setFloodEndLabel,
      setPointFromMap,
      clearRoute,
      resetAll,
    }),
    [
      start,
      end,
      activePoint,
      activePanel,
      routeGeometry,
      routeInfo,
      isRouting,
      routeError,
      isPickingOnMap,
      isReportPanelOpen,
      hasBottomOffset,
      floodStart,
      floodEnd,
      floodPreviewGeometry,
      setIsPickingOnMap,
      setIsReportPanelOpen,
      setActivePoint,
      setActivePanel,
      setStart,
      setEnd,
      setStartLabel,
      setEndLabel,
      setFloodStart,
      setFloodEnd,
      setFloodStartLabel,
      setFloodEndLabel,
      setPointFromMap,
      clearRoute,
      resetAll,
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
