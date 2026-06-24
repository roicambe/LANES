import { apiClient } from "@/shared/api";

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RouteResult {
  geometry: RouteGeometry;
  distance: number;
  duration: number;
  avoided_floods: boolean;
  blocked: boolean;
}

export async function getRoute(
  start: [number, number],
  end: [number, number]
): Promise<RouteResult> {
  return apiClient.post<RouteResult>("/api/v1/reports/route", { start, end });
}
