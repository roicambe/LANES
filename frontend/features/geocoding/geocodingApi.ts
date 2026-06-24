import { CONSTANTS } from "@/features/map/mapUtils";
import type { LocationSuggestion, NominatimResult } from "./types";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const PASIG_VIEWBOX = "121.05,14.52,121.12,14.60";

function scoreResult(result: NominatimResult, query: string): number {
  const normalizedQuery = query.toLowerCase().trim();
  const displayName = result.display_name.toLowerCase();
  let score = result.importance * 10;

  if (displayName.includes(normalizedQuery)) {
    score += 50;
  }

  const queryParts = normalizedQuery.split(/[\s,]+/).filter(Boolean);
  for (const part of queryParts) {
    if (part.length >= 2 && displayName.includes(part)) {
      score += 15;
    }
  }

  const locality =
    result.address?.city ??
    result.address?.town ??
    result.address?.municipality ??
    result.address?.suburb ??
    "";

  if (locality.toLowerCase().includes("pasig")) {
    score += 40;
  } else if (displayName.includes("pasig")) {
    score += 30;
  }

  if (displayName.includes("metro manila") || displayName.includes("national capital region")) {
    score += 10;
  }

  const [centerLng, centerLat] = CONSTANTS.DEFAULT_CENTER;
  const lng = parseFloat(result.lon);
  const lat = parseFloat(result.lat);
  const distance =
    Math.sqrt((lng - centerLng) ** 2 + (lat - centerLat) ** 2) * 111;
  score += Math.max(0, 20 - distance);

  return score;
}

function toSuggestion(result: NominatimResult, query: string): LocationSuggestion {
  const parts = result.display_name.split(",");
  const label = parts.slice(0, 2).join(",").trim();

  return {
    id: String(result.place_id),
    label,
    displayName: result.display_name,
    lng: parseFloat(result.lon),
    lat: parseFloat(result.lat),
    relevanceScore: scoreResult(result, query),
  };
}

export async function searchLocations(query: string): Promise<LocationSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  const params = new URLSearchParams({
    q: trimmed,
    format: "json",
    addressdetails: "1",
    limit: "10",
    countrycodes: "ph",
    viewbox: PASIG_VIEWBOX,
    bounded: "0",
  });

  const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error("Location search failed");
  }

  const results = (await response.json()) as NominatimResult[];

  return results
    .map((result) => toSuggestion(result, trimmed))
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, 6);
}

export function formatCoords(lng: number, lat: number): string {
  return `${lng.toFixed(6)},${lat.toFixed(6)}`;
}

export function parseCoords(value: string): [number, number] | null {
  const parts = value.split(",").map((part) => part.trim());
  if (parts.length !== 2) return null;

  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (Number.isNaN(lng) || Number.isNaN(lat)) return null;

  return [lng, lat];
}
