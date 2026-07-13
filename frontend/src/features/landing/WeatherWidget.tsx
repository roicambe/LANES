"use client";

import { useEffect, useState } from "react";
import { Cloud, MapPin } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

interface WeatherData {
  temp: number | string;
  condition: string;
  icon: string;
  location: string;
}

export function WeatherWidget() {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWeather() {
      try {
        const data = await apiClient.get<WeatherData>("/weather/current");
        setWeather(data);
      } catch (err) {
        console.error("Failed to fetch weather:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchWeather();
  }, []);

  if (loading) {
    return (
      <div className="p-2 flex items-center justify-center gap-4 h-full">
        <div className="w-12 h-12 rounded-full bg-white/20 animate-pulse"></div>
        <div className="space-y-2">
          <div className="h-6 w-20 bg-white/20 animate-pulse rounded"></div>
          <div className="h-3 w-16 bg-white/20 animate-pulse rounded"></div>
        </div>
      </div>
    );
  }

  if (!weather || weather.temp === "--") {
    return (
      <div className="p-2 flex items-center justify-center h-full">
        <p className="text-sm text-blue-200">Weather unavailable</p>
      </div>
    );
  }

  return (
    <div className="p-2 flex flex-col justify-center h-full items-center text-center">
      <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider mb-2">
        Weather ({weather.location})
      </p>
      <div className="flex items-center gap-3">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.condition}
          className="w-14 h-14 object-contain drop-shadow-md -my-2 opacity-90"
        />
        <div className="text-left">
          <span className="text-3xl font-bold text-white tracking-tight">{weather.temp}°C</span>
          <p className="text-sm text-blue-100 capitalize mt-0.5">{weather.condition}</p>
        </div>
      </div>
    </div>
  );
}
