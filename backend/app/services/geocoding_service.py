import httpx
import logging
from typing import Optional

logger = logging.getLogger(__name__)

async def reverse_geocode(lat: float, lng: float) -> Optional[str]:
    """
    Reverse geocodes coordinates into a human readable address using Nominatim (OSM).
    Returns a location string or None if failed.
    """
    url = "https://nominatim.openstreetmap.org/reverse"
    params = {
        "lat": lat,
        "lon": lng,
        "format": "json",
        "zoom": 16  # Major streets/suburbs level
    }
    headers = {
        "User-Agent": "LANES-Flood-Mapping-App/1.0 (lanes@example.com)"
    }
    
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            data = response.json()
            
            # Use 'display_name' or piece together address components
            if "display_name" in data:
                return data["display_name"]
            
            return None
    except Exception as e:
        logger.error(f"Reverse geocoding failed: {e}")
        return None
