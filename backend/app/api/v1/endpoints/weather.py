from typing import Any, Optional, List
from fastapi import APIRouter, HTTPException, Query
import httpx
from datetime import datetime, timedelta

from app.core.config import settings

router = APIRouter()

# Simple in-memory cache to aggressively protect free tier limits
# Cache key: "lat,lon" -> Value: {"data": dict, "expires_at": datetime}
weather_cache: dict[str, Any] = {}
forecast_cache: dict[str, Any] = {}
CACHE_DURATION_MINUTES = 15

@router.get("/current")
async def get_current_weather(
    lat: Optional[float] = Query(14.5731, description="Latitude, defaults to Pasig City"),
    lon: Optional[float] = Query(121.0594, description="Longitude, defaults to Pasig City"),
) -> Any:
    """
    Fetch current weather from OpenWeatherMap API.
    Caches results to prevent hitting free tier rate limits.
    """
    if not settings.OPENWEATHERMAP_API_KEY:
        return {
            "temp": 30.5,
            "condition": "Cloudy",
            "icon": "04d",
            "location": "Pasig"
        }
        
    cache_key = f"{round(lat, 2)},{round(lon, 2)}"
    
    cached = weather_cache.get(cache_key)
    if cached and datetime.utcnow() < cached["expires_at"]:
        return cached["data"]
        
    url = "https://api.openweathermap.org/data/2.5/weather"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHERMAP_API_KEY,
        "units": "metric"
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()
            
            parsed_data = {
                "temp": round(data["main"]["temp"], 1),
                "condition": data["weather"][0]["main"],
                "icon": data["weather"][0]["icon"],
                "location": data["name"]
            }
            
            weather_cache[cache_key] = {
                "data": parsed_data,
                "expires_at": datetime.utcnow() + timedelta(minutes=CACHE_DURATION_MINUTES)
            }
            
            return parsed_data
            
        except httpx.HTTPError:
            return {
                "temp": "--",
                "condition": "Unavailable",
                "icon": "03d",
                "location": "Unknown"
            }


@router.get("/forecast")
async def get_forecast(
    lat: Optional[float] = Query(14.5731, description="Latitude, defaults to Pasig City"),
    lon: Optional[float] = Query(121.0594, description="Longitude, defaults to Pasig City"),
    count: int = Query(8, description="Number of 3-hour slots to return (max 40)"),
) -> Any:
    """
    Fetch 3-hour forecast from OpenWeatherMap API (free tier).
    Returns the next N 3-hour forecast slots with temperature,
    rain probability, weather condition, and icons.
    """
    if not settings.OPENWEATHERMAP_API_KEY:
        # Fallback mock data for development
        return {"forecast": []}

    cache_key = f"fc_{round(lat, 2)},{round(lon, 2)}_{count}"

    cached = forecast_cache.get(cache_key)
    if cached and datetime.utcnow() < cached["expires_at"]:
        return cached["data"]

    url = "https://api.openweathermap.org/data/2.5/forecast"
    params = {
        "lat": lat,
        "lon": lon,
        "appid": settings.OPENWEATHERMAP_API_KEY,
        "units": "metric",
        "cnt": min(count, 40),
    }

    async with httpx.AsyncClient() as client:
        try:
            response = await client.get(url, params=params, timeout=10.0)
            response.raise_for_status()
            data = response.json()

            slots: List[dict[str, Any]] = []
            for item in data.get("list", []):
                slots.append({
                    "dt": item["dt"],
                    "time": item["dt_txt"],
                    "temp": round(item["main"]["temp"], 1),
                    "pop": round(item.get("pop", 0) * 100),  # percentage
                    "condition": item["weather"][0]["main"],
                    "icon": item["weather"][0]["icon"],
                })

            parsed_data = {"forecast": slots}

            forecast_cache[cache_key] = {
                "data": parsed_data,
                "expires_at": datetime.utcnow() + timedelta(minutes=CACHE_DURATION_MINUTES),
            }

            return parsed_data

        except httpx.HTTPError:
            return {"forecast": []}
