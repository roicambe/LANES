"use client";

import { useEffect, useState } from "react";
import { Cloud, MapPin } from "lucide-react";
import { apiClient } from "@/lib/apiClient";

import { useWeather } from "@/hooks/useWeather";

export function WeatherWidget() {
  const { data: weather, isLoading: loading } = useWeather();

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
      <div className="flex items-center justify-center gap-2 mb-2">
        <p className="text-xs font-semibold text-blue-200 uppercase tracking-wider">
          Weather
        </p>
        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/30 border border-blue-400/30">
          <MapPin className="w-3 h-3 text-blue-100" />
          <span className="text-[10px] font-bold text-white tracking-wide uppercase">{weather.location}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <img
          src={`https://openweathermap.org/img/wn/${weather.icon}@2x.png`}
          alt={weather.condition}
          className="w-14 h-14 object-contain drop-shadow-md -my-2 opacity-90"
        />
        <div className="text-left">
          <span className="text-3xl font-bold text-white tracking-tight">{weather.temp}°C</span>
          <p className="text-sm text-blue-100 mt-0.5">Feels like {weather.feels_like}°C</p>
        </div>
      </div>
    </div>
  );
}
