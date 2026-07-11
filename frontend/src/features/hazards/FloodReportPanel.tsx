"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CircleDot,
  Flag,
  Crosshair,
  MapPin,
  Check,
  Loader2,
  Navigation2,
  HelpCircle,
  ImagePlus,
  X,
  User,
} from "lucide-react";
import Link from "next/link";
import { Panel } from "@/shared/ui/Panel";
import { Button } from "@/shared/ui/Button";
import { useToast } from "@/shared/ui";
import { LocationAutocomplete } from "@/shared/ui/LocationAutocomplete";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { useAuth } from "@/hooks/useAuth";
import { getCurrentLocation } from "@/features/geocoding/geocodingApi";
import type { LocationSuggestion } from "@/features/geocoding/types";
import { useMapContext, type ActivePoint } from "@/features/map/MapContext";
import { getRoute } from "@/features/routing/routingApi";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FloodReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type Severity = "low" | "medium" | "extreme";

// ── Severity config ────────────────────────────────────────────────────────────

const SEVERITY_OPTIONS: {
  value: Severity;
  emoji: string;
  label: string;
  description: string;
  colors: { pill: string; active: string };
}[] = [
  {
    value: "low",
    emoji: "🟡",
    label: "Yellow",
    description: "Ankle to Knee Deep",
    colors: {
      pill: "border-amber-300 text-amber-700 bg-amber-50 hover:bg-amber-100",
      active: "border-amber-400 bg-amber-100 text-amber-800 ring-2 ring-amber-300/50",
    },
  },
  {
    value: "medium",
    emoji: "🟠",
    label: "Orange",
    description: "Knee to Waist Deep",
    colors: {
      pill: "border-orange-300 text-orange-700 bg-orange-50 hover:bg-orange-100",
      active: "border-orange-400 bg-orange-100 text-orange-800 ring-2 ring-orange-300/50",
    },
  },
  {
    value: "extreme",
    emoji: "🔴",
    label: "Red",
    description: "Waist Deep & Above",
    colors: {
      pill: "border-red-300 text-red-700 bg-red-50 hover:bg-red-100",
      active: "border-red-400 bg-red-100 text-red-800 ring-2 ring-red-300/50",
    },
  },
];


// ── Point selector sub-component ─────────────────────────────────────────────

const POINT_COLORS = {
  start: {
    accent: "border-orange-200",
    stripe: "from-orange-500 to-amber-400",
    bg: "bg-orange-50",
    text: "text-orange-700",
    icon: "text-orange-500",
    label: "Flood Start",
  },
  end: {
    accent: "border-red-200",
    stripe: "from-red-500 to-rose-400",
    bg: "bg-red-50",
    text: "text-red-700",
    icon: "text-red-600",
    label: "Flood End",
  },
} as const;

function PointSelector({
  point,
  label,
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
        "rounded-xl border bg-white transition-all",
        isActive
          ? "shadow-md border-orange-200 ring-1 ring-orange-100"
          : colors.accent
      )}
    >
      {/* Top accent stripe */}
      <div
        className={cn(
          "h-[3px] w-full bg-gradient-to-r rounded-t-xl",
          isActive ? "from-orange-500 to-amber-400" : colors.stripe
        )}
      />

      {/* Row label */}
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

      {/* Action buttons */}
      <div className="px-3 pb-1.5 flex gap-2">
        <button
          type="button"
          onClick={onActivate}
          title={isActive ? "Click anywhere on the map to set location" : "Pick point from map"}
          className={cn(
            "flex-1 flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs font-medium transition-all",
            isActive
              ? "bg-orange-500 text-white border-orange-500 shadow-sm"
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
          className="flex-1 flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 py-1.5 text-xs font-medium text-gray-500 hover:text-orange-600 hover:border-orange-300 bg-white hover:bg-orange-50 transition-all"
        >
          <MapPin className="h-3.5 w-3.5" />
          Current
        </button>
      </div>

      {/* Autocomplete search */}
      <div className="px-3 pb-2.5">
        <LocationAutocomplete
          value={label}
          onChange={onLabelChange}
          onSelect={onSelect}
          onClear={onClear}
          placeholder={point === "start" ? "e.g. Ortigas Ave, Pasig" : "e.g. C. Raymundo Ave"}
          className="[&_input]:h-9"
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export function FloodReportPanel({ isOpen, onClose }: FloodReportPanelProps) {
  const isMobile = useMediaQuery("(max-width: 640px), (pointer: coarse)");
  const { isAuthenticated } = useAuth();

  // Map context
  const {
    floodStart,
    floodEnd,
    activePoint,
    isPickingOnMap,
    setActivePoint,
    setIsPickingOnMap,
    setFloodStart,
    setFloodEnd,
    setFloodStartLabel,
    setFloodEndLabel,
    activePanel,
    setActivePanel,
  } = useMapContext();

  // Form state
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  const isCollapsed = activePanel !== "flood";

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { success, error } = useToast();

  // ── Map-pick: listen to the shared map-center-changed event ────────────────
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleCenter = (e: Event) => {
      setMapCenter((e as CustomEvent<[number, number]>).detail);
    };
    window.addEventListener("map-center-changed", handleCenter);
    return () => window.removeEventListener("map-center-changed", handleCenter);
  }, []);

  useEffect(() => {
    if (floodStart?.label) setStartInput(floodStart.label);
  }, [floodStart?.label]);

  useEffect(() => {
    if (floodEnd?.label) setEndInput(floodEnd.label);
  }, [floodEnd?.label]);

  const handlePickOnMap = (target: "flood_start" | "flood_end") => {
    setActivePoint(target);
    setIsPickingOnMap(true);
  };

  const confirmMapLocation = useCallback(() => {
    if (!activePoint || !mapCenter) return;
    const label = `${mapCenter[0].toFixed(5)}, ${mapCenter[1].toFixed(5)}`;
    if (activePoint === "flood_start") {
      setFloodStart(mapCenter, label);
      setStartInput(label);
      setActivePoint("flood_end");
    } else if (activePoint === "flood_end") {
      setFloodEnd(mapCenter, label);
      setEndInput(label);
      setActivePoint(null);
      setIsPickingOnMap(false);
      setActivePanel(null);
    }
  }, [activePoint, mapCenter, setFloodStart, setFloodEnd, setActivePoint, setIsPickingOnMap, setActivePanel]);

  // ── Current location helper ────────────────────────────────────────────────
  const handleUseCurrent = async (target: "start" | "end") => {
    try {
      const coords = await getCurrentLocation();
      const label = "Current Location";
      if (target === "start") {
        setFloodStart(coords, label);
        setStartInput(label);
      } else {
        setFloodEnd(coords, label);
        setEndInput(label);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to retrieve your location";
      error("Location Error", message);
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!floodStart || !floodEnd) {
      error("Missing Information", "Please set both the Flood Start and Flood End locations.");
      return;
    }
    if (!description.trim()) {
      error("Missing Information", "Please add a description of the flood conditions.");
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Get the actual road geometry between the two points, ignoring any existing active floods
      const routeResult = await getRoute(floodStart.coords, floodEnd.coords, true);
      const roadGeometry = routeResult.geometry;

      // 2. Submit as multipart/form-data
      const formData = new FormData();
      formData.append("raw_text", description.trim());
      formData.append("source", "direct_user");
      formData.append("severity", severity);
      formData.append("is_public", isPublic.toString());
      formData.append("geometry", JSON.stringify(roadGeometry));
      if (imageFile) {
        formData.append("image", imageFile);
      }

      await apiClient.post<{ id: number }>("/reports/", formData);

      // Reset form
      setFloodStart(null);
      setFloodEnd(null);
      setStartInput("");
      setEndInput("");
      setSeverity("medium");
      setDescription("");
      setImageFile(null);
      setIsPublic(false);
      setStep(1);
      success("Report Submitted", "Flood report submitted successfully. It is now pending admin review.");
    } catch (err: unknown) {
      console.error("Error submitting flood report:", err);
      error("Submission Failed", "Failed to submit the report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!floodStart && !!floodEnd && description.trim().length > 0 && !isSubmitting;

  // ── Mobile map-pick overlay ────────────────────────────────────────────────
  if (isMobile && isPickingOnMap && (activePoint === "flood_start" || activePoint === "flood_end")) {
    return (
      <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between">
        <div className="p-4 pointer-events-auto">
          <button
            onClick={() => {
              setIsPickingOnMap(false);
              if (!floodStart && !floodEnd) setActivePoint(null);
            }}
            className="flex items-center justify-center w-12 h-12 bg-white rounded-full shadow-md text-gray-900 hover:bg-gray-100 border border-gray-300"
          >
            ✕
          </button>
        </div>
        <div className="p-4 pointer-events-auto flex justify-center pb-24">
          <button
            onClick={confirmMapLocation}
            className="flex items-center justify-center gap-2 bg-orange-500 text-white rounded-full px-6 py-3 shadow-lg font-bold text-base border border-orange-400 hover:bg-orange-600 transition-all min-w-[200px]"
          >
            <Check className="w-5 h-5" />
            Set {activePoint === "flood_start" ? "Flood Start" : "Flood End"}
          </button>
        </div>
      </div>
    );
  }

  // ── Shared form body ───────────────────────────────────────────────────────
  const showClear = step === 1 
    ? (floodStart || floodEnd) 
    : (description.trim() !== "" || imageFile !== null || severity !== "medium" || isPublic);

  const clearButton =
    showClear ? (
      <button
        onClick={(e) => {
          e.preventDefault();
          if (step === 1) {
            setFloodStart(null);
            setFloodEnd(null);
            setStartInput("");
            setEndInput("");
            setFloodStartLabel("");
            setFloodEndLabel("");
          } else {
            setSeverity("medium");
            setDescription("");
            setImageFile(null);
            setIsPublic(false);
          }
        }}
        className="text-[11px] font-medium text-gray-500 hover:text-red-600 transition-colors px-2 py-1 mr-1"
        title={step === 1 ? "Clear locations" : "Clear details"}
      >
        Clear
      </button>
    ) : undefined;

  const formBody = !isAuthenticated ? (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center space-y-4">
      <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center text-orange-500 mb-2 mt-8">
        <User className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-gray-900">Login Required</h3>
      <p className="text-sm text-gray-500">
        You need to be logged in to report a flood and help the community.
      </p>
      <Link href="/profile" className="w-full mt-4">
        <Button className="w-full">Go to Login</Button>
      </Link>
    </div>
  ) : (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {step === 1 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Point selectors */}
          <PointSelector
            point="start"
            label={startInput}
            isActive={activePoint === "flood_start"}
            isSet={!!floodStart}
            onActivate={() => handlePickOnMap("flood_start")}
            onLabelChange={(val) => { setStartInput(val); setFloodStartLabel(val); }}
            onSelect={(s) => {
              setFloodStart([s.lng, s.lat], s.label);
              setStartInput(s.label);
              setActivePoint("flood_end");
            }}
            onUseCurrent={() => handleUseCurrent("start")}
            onClear={() => { setFloodStart(null); setStartInput(""); setFloodStartLabel(""); }}
          />

          <PointSelector
            point="end"
            label={endInput}
            isActive={activePoint === "flood_end"}
            isSet={!!floodEnd}
            onActivate={() => handlePickOnMap("flood_end")}
            onLabelChange={(val) => { setEndInput(val); setFloodEndLabel(val); }}
            onSelect={(s) => {
              setFloodEnd([s.lng, s.lat], s.label);
              setEndInput(s.label);
            }}
            onUseCurrent={() => handleUseCurrent("end")}
            onClear={() => { setFloodEnd(null); setEndInput(""); setFloodEndLabel(""); }}
          />

          {/* Info Card */}
          <div className="bg-orange-50/70 border border-orange-100/50 rounded-xl p-3 text-[11px] leading-relaxed text-orange-950 space-y-1 shadow-sm">
            <div className="flex items-center gap-1.5 font-bold text-orange-800 mb-0.5">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Detour & Routing Tips</span>
            </div>
            <p>
              🚦 <strong>Road Rules:</strong> Snaps to streets (respects one-ways & divided lanes).
            </p>
            <p>
              🟠 <strong>Orange Line:</strong> Shows the segment that will be blocked in the system.
            </p>
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white pt-3 pb-1 border-t border-gray-100 mt-auto">
            <Button
              type="button"
              disabled={!floodStart || !floodEnd}
              onClick={() => setStep(2)}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold shadow-sm"
            >
              Next Step
            </Button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
          {/* Severity selector */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Flood Severity
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SEVERITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setSeverity(opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-0.5 rounded-lg border px-2 py-2 text-xs font-semibold transition-all",
                    severity === opt.value ? opt.colors.active : opt.colors.pill
                  )}
                >
                  <span className="text-base">{opt.emoji}</span>
                  <span>{opt.label}</span>
                  <span className="font-normal text-[10px] opacity-75">{opt.description}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Photo Evidence (Optional)
            </label>
            {imageFile ? (
              <div className="relative rounded-md border border-gray-200 bg-gray-50 p-2 flex items-center justify-between">
                <span className="text-xs text-gray-600 truncate max-w-[200px]">{imageFile.name}</span>
                <button 
                  type="button" 
                  onClick={() => setImageFile(null)}
                  className="p-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <label className="flex items-center justify-center w-full rounded-md border border-dashed border-gray-300 px-3 py-4 bg-gray-50 hover:bg-orange-50 hover:border-orange-300 transition-colors cursor-pointer select-none text-sm text-gray-500">
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="font-medium text-gray-600">Click to upload an image</span>
                  <span className="text-[10px] text-gray-400">JPEG, PNG up to 5MB</span>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setImageFile(e.target.files[0]);
                    }
                  }}
                />
              </label>
            )}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Description
            </label>
            <textarea
              placeholder="Describe the flood conditions (e.g., impassable to motorcycles, water is moving fast)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 resize-none"
            />
          </div>

          {/* Community Feed Sharing */}
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <label className="flex items-start gap-2 cursor-pointer group">
              <div className="flex h-5 items-center">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-orange-600 focus:ring-orange-600 focus:ring-2"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-800 group-hover:text-gray-900">
                  Share in Community Feed
                </span>
              </div>
            </label>
            {isPublic && (
              <div className="bg-blue-50/70 border border-blue-100/50 rounded-lg p-3 text-[11px] leading-relaxed text-blue-900 space-y-1">
                <p>
                  This report may be shared publicly in the Community Feed after it has been reviewed and approved by an administrator. Please ensure that the information provided is accurate and does not contain sensitive or personal information.
                </p>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 left-0 right-0 bg-white pt-3 pb-1 border-t border-gray-100 mt-auto flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="flex-1"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="flex-[2] bg-orange-500 hover:bg-orange-600 focus:ring-orange-400 text-white font-semibold shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Report"
              )}
            </Button>
          </div>
        </div>
      )}
    </form>
  );

  return (
    <Panel
      title="Report Flood"
      icon={<Navigation2 className="h-4 w-4 text-orange-600 rotate-180" />}
      iconBgClassName="bg-orange-100"
      isCollapsed={isCollapsed}
      onCollapseToggle={() => setActivePanel(isCollapsed ? "flood" : null)}
      isMobile={isMobile}
      isOpen={isOpen}
      onClose={onClose}
      anchor="right"
      initialPosition={{ x: 16, y: 80 }}
      headerActions={clearButton}
    >
      {formBody}
    </Panel>
  );
}
