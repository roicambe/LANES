"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CircleDot,
  Crosshair,
  Flag,
  Loader2,
  MapPin,
  Navigation,
  ArrowLeftRight,
  ArrowDownUp,
  Check,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/shared/ui/Card";
import { LocationAutocomplete } from "@/shared/ui/LocationAutocomplete";
import { LoadingOverlay } from "@/shared/ui";
import { cn } from "@/lib/utils";
import { useMapContext, type ActivePoint } from "@/features/map/MapContext";
import type { LocationSuggestion } from "@/features/geocoding/types";
import { getCurrentLocation } from "@/features/geocoding/geocodingApi";
import { useMediaQuery } from "@/hooks/useMediaQuery";

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

function DesktopPointSelector({
  point,
  label,
  placeholder,
  isActive,
  isSet,
  onActivate,
  onLabelChange,
  onSelect,
  onUseCurrent,
  onClear,
}: {
  point: "start" | "end";
  label: string;
  placeholder: string;
  isActive: boolean;
  isSet: boolean;
  onActivate: () => void;
  onLabelChange: (value: string) => void;
  onSelect: (suggestion: LocationSuggestion) => void;
  onUseCurrent: () => void;
  onClear: () => void;
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
      </div>

      <div className="px-3 pb-1.5 flex gap-2">
        <button
          type="button"
          onClick={onActivate}
          title={isActive ? "Click anywhere on the map to set location" : "Pick point from map"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-all",
            isActive
              ? "bg-blue-600 text-white border-blue-600 shadow-sm"
              : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:border-gray-400"
          )}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {isActive ? "Click on map" : "Pick on map"}
        </button>
        <button
          type="button"
          onClick={onUseCurrent}
          title="Use current GPS location"
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:text-blue-600 hover:border-blue-300 bg-white hover:bg-blue-50 transition-all"
        >
          <MapPin className="h-3.5 w-3.5" />
          Current
        </button>
      </div>

      <div className="px-3 pb-2.5">
        <LocationAutocomplete
          value={label}
          onChange={onLabelChange}
          onSelect={onSelect}
          onClear={onClear}
          placeholder={placeholder}
          className="[&_input]:h-9"
        />
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
    resetAll,
    isPickingOnMap,
    setIsPickingOnMap,
  } = useMapContext();

  const isMobile = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleCenterChange = (e: Event) => {
      const customEvent = e as CustomEvent<[number, number]>;
      setMapCenter(customEvent.detail);
    };
    window.addEventListener("map-center-changed", handleCenterChange);
    return () => window.removeEventListener("map-center-changed", handleCenterChange);
  }, []);

  const handlePickOnMapToggle = (target: ActivePoint) => {
    setActivePoint(target);
    setIsPickingOnMap(true);
  };

  const confirmMapLocation = () => {
    if (activePoint && mapCenter) {
      const label = `${mapCenter[0].toFixed(5)}, ${mapCenter[1].toFixed(5)}`;
      if (activePoint === "start") {
        setStart(mapCenter, label);
        setStartInput(label);
        setActivePoint("end");
      } else {
        setEnd(mapCenter, label);
        setEndInput(label);
        setActivePoint(null); // Deselect after setting end
      }
      setIsPickingOnMap(false);
    }
  };

  useEffect(() => {
    if (start?.label) setStartInput(start.label);
  }, [start?.label]);

  useEffect(() => {
    if (end?.label) setEndInput(end.label);
  }, [end?.label]);

  useEffect(() => {
    if (isMobile && routeInfo) {
      setIsCollapsed(true);
      setActivePoint(null); // Clear active selection to hide top buttons
    }
  }, [routeInfo, isMobile, setActivePoint]);

  const handleUseCurrentLocation = async (target: ActivePoint) => {
    try {
      const coords = await getCurrentLocation();
      const label = "Current Location";
      if (target === "start") {
        setStart(coords, label);
        setStartInput(label);
      } else {
        setEnd(coords, label);
        setEndInput(label);
      }
    } catch (err: any) {
      alert(err.message || "Unable to retrieve your location");
    }
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

  if (isMobile) {
    if (isPickingOnMap && activePoint) {
      return (
        <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between">
          <div className="p-4 pointer-events-auto">
            <button
              onClick={() => {
                setIsPickingOnMap(false);
                if (!start && !end) setActivePoint(null);
              }}
              className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md text-gray-900 hover:bg-gray-100 border border-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <div className="p-4 pointer-events-auto flex justify-center pb-24">
            <button
              onClick={confirmMapLocation}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white rounded-full px-6 py-3 shadow-lg font-bold text-base border border-blue-500 hover:bg-blue-700 transition-all min-w-[200px]"
            >
              <Check className="w-5 h-5" />
              Set {activePoint === "start" ? "Start" : "Destination"}
            </button>
          </div>
        </div>
      );
    }

    const renderTopOptions = (target: ActivePoint) => (
      <>
        <li>
          <button
            type="button"
            className="flex w-full items-start gap-2 px-3 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-100"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handlePickOnMapToggle(target)}
          >
            <div className="bg-blue-100 p-1.5 rounded-full shrink-0">
              <Crosshair className="h-4 w-4 text-blue-700" />
            </div>
            <span className="flex flex-col justify-center h-7 font-semibold text-blue-700">Choose on Map</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className="flex w-full items-start gap-2 px-3 py-3 text-left text-sm hover:bg-blue-50 transition-colors border-b border-gray-100 mb-1"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => handleUseCurrentLocation(target)}
          >
            <div className="bg-gray-100 p-1.5 rounded-full shrink-0">
              <MapPin className="h-4 w-4 text-gray-700" />
            </div>
            <span className="flex flex-col justify-center h-7 font-semibold text-gray-800">Use Current Location</span>
          </button>
        </li>
      </>
    );

    return (
      <>
        <LoadingOverlay isVisible={isRouting} message="Calculating safe route..." />
        
        {/* Google Maps Style Mobile Top Search Bar */}
        <div className="absolute top-4 left-4 right-4 z-40 bg-white rounded-2xl shadow-lg border border-gray-100 overflow-visible transition-all">
          <div className="flex p-3 pr-2">
            {/* Left Icons */}
            <div className="flex flex-col items-center justify-start gap-1 w-6 mt-3 relative z-10">
              <CircleDot className="w-4 h-4 text-green-600 shrink-0 bg-white" />
              <div className="w-[3px] h-6 bg-gray-200 border-l border-dashed border-gray-300" />
              <MapPin className="w-5 h-5 text-red-500 shrink-0 bg-white" />
            </div>
            
            {/* Inputs */}
            <div className="flex-1 flex flex-col gap-2 relative z-20">
              <div 
                className={cn("w-full rounded-lg transition-all bg-gray-50 border", activePoint === "start" ? "border-blue-400 ring-2 ring-blue-100 bg-white shadow-sm relative z-30" : "border-transparent relative z-10")}
                onClick={() => setActivePoint("start")}
              >
                <LocationAutocomplete 
                  key={`start-${activePoint}`}
                  value={startInput} 
                  onChange={(val) => { setStartInput(val); setStartLabel(val); }}
                  onSelect={(s) => { setStart([s.lng, s.lat], s.label); setStartInput(s.label); setActivePoint("end"); }}
                  onClear={() => { setStart(null, ""); setStartInput(""); setStartLabel(""); }}
                  placeholder="Your location" 
                  className="[&_input]:border-none [&_input]:h-10 [&_input]:bg-transparent [&_input]:text-sm [&_input]:font-medium"
                  renderTopOptions={renderTopOptions("start")}
                />
              </div>
              <div 
                className={cn("w-full rounded-lg transition-all bg-gray-50 border", activePoint === "end" ? "border-blue-400 ring-2 ring-blue-100 bg-white shadow-sm relative z-30" : "border-transparent relative z-10")}
                onClick={() => setActivePoint("end")}
              >
                <LocationAutocomplete 
                  key={`end-${activePoint}`}
                  value={endInput} 
                  onChange={(val) => { setEndInput(val); setEndLabel(val); }}
                  onSelect={(s) => { setEnd([s.lng, s.lat], s.label); setEndInput(s.label); }}
                  onClear={() => { setEnd(null, ""); setEndInput(""); setEndLabel(""); }}
                  placeholder="Choose destination" 
                  className="[&_input]:border-none [&_input]:h-10 [&_input]:bg-transparent [&_input]:text-sm [&_input]:font-medium"
                  renderTopOptions={renderTopOptions("end")}
                />
              </div>
            </div>

            {/* Right Swap Button */}
            <div className="w-10 flex flex-col items-center justify-center relative z-10 pl-1">
              {(start || end) ? (
                <button 
                  onClick={handleSwap}
                  className="p-2 rounded-full text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                >
                  <ArrowDownUp className="w-5 h-5" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Mobile Bottom Sheet for Route Summary */}
        <AnimatePresence>
          {routeInfo && (
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, { offset, velocity }) => {
                if (offset.y > 50 || velocity.y > 200) setIsCollapsed(true);
                else if (offset.y < -50 || velocity.y < -200) setIsCollapsed(false);
              }}
              initial={{ y: "100%" }}
              animate={{ y: isCollapsed ? "calc(100% - 64px)" : "0%" }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 right-0 z-40 rounded-t-3xl bg-white shadow-[0_-8px_30px_rgba(0,0,0,0.12)] pb-6"
            >
              <div 
                className="w-full flex justify-center pt-3 pb-2 cursor-grab active:cursor-grabbing"
                onClick={() => setIsCollapsed(!isCollapsed)}
              >
                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
              </div>
              
              <div className="px-5 pt-1 pb-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-blue-600">
                      {formatDuration(routeInfo.duration)}
                    </span>
                    <span className="text-sm font-medium text-gray-500">
                      {(routeInfo.distance / 1000).toFixed(1)} km
                    </span>
                  </div>
                  
                  <button
                    onClick={() => {
                      resetAll();
                      setStartInput("");
                      setEndInput("");
                    }}
                    className="text-xs font-semibold text-gray-400 bg-gray-100 hover:bg-red-50 hover:text-red-600 px-3 py-1.5 rounded-full transition-colors"
                  >
                    Clear Route
                  </button>
                </div>

                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-semibold rounded-xl border",
                    routeInfo.blocked 
                      ? "bg-red-50 text-red-700 border-red-100" 
                      : routeInfo.avoided_floods
                        ? "bg-amber-50 text-amber-700 border-amber-100"
                        : "bg-green-50 text-green-700 border-green-100"
                  )}
                >
                  {routeInfo.blocked ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : routeInfo.avoided_floods ? (
                    <AlertTriangle className="h-5 w-5" />
                  ) : (
                    <CheckCircle className="h-5 w-5" />
                  )}
                  <span>
                    {routeInfo.blocked
                      ? "Route contains flooded areas"
                      : routeInfo.avoided_floods
                        ? "Safe detour applied"
                        : "Clear path — no floods detected"}
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop view
  return (
    <>
      <LoadingOverlay isVisible={isRouting} message="Calculating safe route..." />
      <motion.div
        drag
        dragMomentum={false}
        initial={{ x: 16, y: 80 }}
        className="absolute top-0 left-0 z-40 cursor-move"
      >
      <Card className="w-[340px] rounded-xl border border-gray-200 shadow-xl bg-white flex flex-col max-h-[calc(100vh-2rem)]">
        <CardHeader className="pb-3 pt-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-100">
                <Navigation className="h-4 w-4 text-blue-600" />
              </div>
              <span>Route Planner</span>
            </CardTitle>
            <div className="flex items-center gap-1">
              {(start || end) && (
                <button
                  onClick={() => {
                    resetAll();
                    setStartInput("");
                    setEndInput("");
                  }}
                  className="text-[11px] font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 mr-1"
                  title="Clear route and inputs"
                >
                  Clear
                </button>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 hover:bg-gray-100 rounded-md transition-colors"
                title={isCollapsed ? "Expand panel" : "Collapse panel"}
              >
                {isCollapsed ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronUp className="w-5 h-5 text-gray-500" />}
              </button>
            </div>
          </div>

          <AnimatePresence>
            {isCollapsed && routeInfo && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="pt-2"
              >
                <div className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900">{(routeInfo.distance / 1000).toFixed(1)} km</span>
                    <span className="text-gray-400">•</span>
                    <span className="font-medium text-gray-700">{formatDuration(routeInfo.duration)}</span>
                  </div>
                  {routeInfo.blocked ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : routeInfo.avoided_floods ? (
                    <CheckCircle className="h-4 w-4 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardHeader>

        <AnimatePresence>
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-y-auto flex-1 pb-4"
            >
              <CardContent className="space-y-4">
                <DesktopPointSelector
                  point="start"
                  label={startInput}
                  placeholder="e.g. C. Santos, Taft Ave"
                  isActive={activePoint === "start"}
                  isSet={!!start}
                  onActivate={() => handlePickOnMapToggle("start")}
                  onLabelChange={(val) => { setStartInput(val); setStartLabel(val); }}
                  onSelect={(s) => { setStart([s.lng, s.lat], s.label); setStartInput(s.label); setActivePoint("end"); }}
                  onUseCurrent={() => handleUseCurrentLocation("start")}
                  onClear={() => { setStart(null, ""); setStartInput(""); setStartLabel(""); }}
                />

                {start && end && (
                  <div className="flex justify-center -my-3 z-10 relative">
                    <button
                      type="button"
                      onClick={handleSwap}
                      title="Swap start and destination"
                      className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-blue-600 hover:border-blue-300 transition-all shadow-md"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  </div>
                )}

                <DesktopPointSelector
                  point="end"
                  label={endInput}
                  placeholder="e.g. Pasig City Hall"
                  isActive={activePoint === "end"}
                  isSet={!!end}
                  onActivate={() => handlePickOnMapToggle("end")}
                  onLabelChange={(val) => { setEndInput(val); setEndLabel(val); }}
                  onSelect={(s) => { setEnd([s.lng, s.lat], s.label); setEndInput(s.label); }}
                  onUseCurrent={() => handleUseCurrentLocation("end")}
                  onClear={() => { setEnd(null, ""); setEndInput(""); setEndLabel(""); }}
                />

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
                        <p className="text-sm font-bold text-gray-900">{(routeInfo.distance / 1000).toFixed(1)} km</p>
                      </div>
                      <div className="flex-1 text-center py-2.5">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Duration</p>
                        <p className="text-sm font-bold text-gray-900">{formatDuration(routeInfo.duration)}</p>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-2 text-xs font-medium",
                        routeInfo.blocked ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"
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
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
    </>
  );
}
