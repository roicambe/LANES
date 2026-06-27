"use client";

import { useState, useEffect } from "react";
import {
  CircleDot,
  Crosshair,
  Flag,
  Loader2,
  MapPin,
  Navigation,
  ArrowLeftRight,
  Check,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { Button } from "@/shared/ui/Button";
import { LocationAutocomplete } from "@/shared/ui/LocationAutocomplete";
import { cn } from "@/lib/utils";
import { useMapContext, type ActivePoint } from "@/features/map/MapContext";
import type { LocationSuggestion } from "@/features/geocoding/types";

const POINT_COLORS = {
  start: {
    accent: "border-l-green-500",
    bg: "bg-green-50",
    text: "text-green-700",
    icon: "text-green-600",
    marker: "#16a34a",
    label: "Start",
  },
  end: {
    accent: "border-l-red-500",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    marker: "#dc2626",
    label: "Destination",
  },
} as const;

function PointSelector({
  point,
  label,
  placeholder,
  isActive,
  isSet,
  onActivate,
  onLabelChange,
  onSelect,
  onUseCurrent,
}: {
  point: ActivePoint;
  label: string;
  placeholder: string;
  isActive: boolean;
  isSet: boolean;
  onActivate: () => void;
  onLabelChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  onUseCurrent: () => void;
}) {
  const colors = POINT_COLORS[point];
  const Icon = point === "start" ? CircleDot : Flag;

  return (
    <div
      className={cn(
        "border-l-4 rounded-r-lg border bg-white transition-all",
        isActive ? "shadow-md border-l-blue-500 ring-1 ring-blue-200" : colors.accent
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-1.5">
          <Icon className={cn("h-4 w-4", colors.icon)} />
          <span className={cn("text-xs font-semibold uppercase tracking-wide", colors.text)}>
            {colors.label}
          </span>
          {isSet && (
            <span className="flex items-center gap-0.5 text-[10px] font-medium text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
              <Check className="h-3 w-3" />
              Set
            </span>
          )}
        </div>
        <div className="flex items-center gap-1" />
      </div>

      {/* Pick on map button */}
      <div className="px-3 pb-1.5">
        <button
          type="button"
          onClick={onActivate}
          className={cn(
            "flex items-center justify-center gap-1.5 w-full rounded-md border py-1.5 text-xs font-medium transition-all",
            isActive
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          )}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {isActive ? "Tap on the map to set" : "Pick on map"}
        </button>
      </div>

      {/* Location input */}
      <div className="px-3 pb-1">
        <LocationAutocomplete
          value={label}
          onChange={onLabelChange}
          onSelect={onSelect}
          placeholder={placeholder}
        />
      </div>

      {/* Use current location */}
      <div className="px-3 pb-2.5">
        <button
          type="button"
          onClick={onUseCurrent}
          className="flex items-center justify-center gap-1.5 w-full rounded-md border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:border-blue-300 bg-white hover:bg-blue-50 transition-all"
        >
          <MapPin className="h-3.5 w-3.5" />
          Use current location
        </button>
      </div>
    </div>
  );
}

export default function RoutePanel() {
  const {
    start,
    end,
    activePoint,
    routeInfo,
    isRouting,
    routeError,
    setActivePoint,
    setStart,
    setEnd,
    setStartLabel,
    setEndLabel,
  } = useMapContext();

  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");

  useEffect(() => {
    if (start?.label) setStartInput(start.label);
  }, [start?.label]);

  useEffect(() => {
    if (end?.label) setEndInput(end.label);
  }, [end?.label]);

  const displayStart = startInput;
  const displayEnd = endInput;

  const handleUseCurrentLocation = (target: ActivePoint) => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords: [number, number] = [position.coords.longitude, position.coords.latitude];
        const label = "Current Location";
        if (target === "start") {
          setStart(coords, label);
          setStartInput(label);
        } else {
          setEnd(coords, label);
          setEndInput(label);
        }
      },
      () => alert("Unable to retrieve your location")
    );
  };

  const handleSwap = () => {
    if (!start || !end) return;
    const startCoords = start.coords;
    const startLabel = start.label;
    setStart(end.coords, end.label);
    setStartInput(end.label);
    setEnd(startCoords, startLabel);
    setEndInput(startLabel);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.round(seconds / 60);
    return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  return (
    <Card className="absolute top-4 left-4 right-4 sm:right-auto z-10 w-auto sm:w-80 max-h-[45vh] sm:max-h-[calc(100vh-1.25rem)] overflow-y-auto shadow-xl transition-all">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100">
            <Navigation className="h-4 w-4 text-blue-600" />
          </div>
          <span>Route Planner</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Start Point */}
        <PointSelector
          point="start"
          label={displayStart}
          placeholder="e.g. C. Santos, Taft Ave"
          isActive={activePoint === "start"}
          isSet={!!start}
          onActivate={() => setActivePoint("start")}
          onLabelChange={(value) => {
            setStartInput(value);
            setStartLabel(value);
          }}
          onSelect={(suggestion) => {
            setStart([suggestion.lng, suggestion.lat], suggestion.label);
            setStartInput(suggestion.label);
            setActivePoint("end");
          }}
          onUseCurrent={() => handleUseCurrentLocation("start")}
        />

        {/* Swap button */}
        {start && end && (
          <div className="flex justify-center -my-1">
            <button
              type="button"
              onClick={handleSwap}
              title="Swap start and destination"
              className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-blue-600 hover:border-blue-300 transition-all shadow-sm"
            >
              <ArrowLeftRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* End Point */}
        <PointSelector
          point="end"
          label={displayEnd}
          placeholder="e.g. Pasig City Hall"
          isActive={activePoint === "end"}
          isSet={!!end}
          onActivate={() => setActivePoint("end")}
          onLabelChange={(value) => {
            setEndInput(value);
            setEndLabel(value);
          }}
          onSelect={(suggestion) => {
            setEnd([suggestion.lng, suggestion.lat], suggestion.label);
            setEndInput(suggestion.label);
          }}
          onUseCurrent={() => handleUseCurrentLocation("end")}
        />

        {/* Route status */}
        {isRouting && (
          <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2.5">
            <Loader2 className="h-4 w-4 animate-spin shrink-0" />
            <span>Calculating safe route...</span>
          </div>
        )}

        {routeError && (
          <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <span>{routeError}</span>
          </div>
        )}

        {routeInfo && !isRouting && (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex border-b border-gray-100">
              <div className="flex-1 text-center py-2.5 border-r border-gray-100">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Distance</p>
                <p className="text-sm font-bold text-gray-900">
                  {(routeInfo.distance / 1000).toFixed(1)} km
                </p>
              </div>
              <div className="flex-1 text-center py-2.5">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Duration</p>
                <p className="text-sm font-bold text-gray-900">
                  {formatDuration(routeInfo.duration)}
                </p>
              </div>
            </div>
            <div
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-medium",
                routeInfo.blocked
                  ? "bg-red-50 text-red-700"
                  : "bg-green-50 text-green-700"
              )}
            >
              {routeInfo.blocked ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
              <span>
                {routeInfo.blocked
                  ? "May pass through flooded areas"
                  : routeInfo.avoided_floods
                    ? "Safe detour applied"
                    : "Clear path — all safe"}
              </span>
            </div>
          </div>
        )}

        {start && end && !isRouting && !routeInfo && !routeError && (
          <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5">
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
            Waiting for route...
          </div>
        )}

        {(!start || !end) && (
          <p className="text-[11px] text-center text-gray-400 pt-1">
            {!start && !end
              ? "Set your start point and destination to plan a route"
              : !start
                ? "Set your starting point above"
                : "Set your destination above"}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
