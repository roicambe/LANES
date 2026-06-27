export interface LocationSuggestion {
  id: string;
  label: string;
  displayName: string;
  lng: number;
  lat: number;
  relevanceScore: number;
}

export interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  address?: {
    city?: string;
    town?: string;
    municipality?: string;
    suburb?: string;
    state?: string;
    country?: string;
  };
}
