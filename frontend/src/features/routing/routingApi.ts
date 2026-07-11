import { apiClient } from "@/shared/api";

export interface RouteGeometry {
  type: "LineString";
  coordinates: [number, number][];
}

export interface RouteOption {
  index: number;
  label: string; // "Recommended" | "Alternative 1" | "Alternative 2"
  geometry: RouteGeometry;
  distance: number;  // meters
  duration: number;  // seconds
  avoided_floods: boolean;
  blocked: boolean;
  is_truncated: boolean;
}

export interface MultiRouteResponse {
  routes: RouteOption[];
  recommended_index: number;
}

// Legacy interface kept for internal typing compatibility
export interface RouteResult {
  geometry: RouteGeometry;
  distance: number;
  duration: number;
  avoided_floods: boolean;
  blocked: boolean;
}

export async function getRoute(
  start: [number, number],
  end: [number, number],
  ignoreFloods: boolean = false
): Promise<MultiRouteResponse> {
  return apiClient.post<MultiRouteResponse>("/reports/route", {
    start,
    end,
    ignore_floods: ignoreFloods,
  });
}
