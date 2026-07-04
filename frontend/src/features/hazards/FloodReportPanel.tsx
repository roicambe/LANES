"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CircleDot,
  Flag,
  Crosshair,
  MapPin,
  Check,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Navigation2,
} from "lucide-react";
import { Panel } from "@/shared/ui/Panel";
import { Button } from "@/shared/ui/Button";
import { LocationAutocomplete } from "@/shared/ui/LocationAutocomplete";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/apiClient";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { getCurrentLocation } from "@/features/geocoding/geocodingApi";
import type { LocationSuggestion } from "@/features/geocoding/types";

// ── Types ──────────────────────────────────────────────────────────────────────

interface FloodReportPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReportPoint {
  coords: [number, number];
  label: string;
}

type Severity = "low" | "medium" | "extreme";
type PickMode = "start" | "end" | null;

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

// ── Buffer polygon helper (100 m circular approximation) ──────────────────────

function createBufferPolygon(
  center: [number, number],
  radiusInMeters: number = 100
): number[][][] {
  const [lng, lat] = center;
  const n = 32;
  const coords: number[][] = [];
  const latDeg = radiusInMeters / 111320;
  const lngDeg = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= n; i++) {
    const angle = (i * 2 * Math.PI) / n;
    coords.push([lng + lngDeg * Math.cos(angle), lat + latDeg * Math.sin(angle)]);
  }
  return [coords];
}

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

  // Form state
  const [startPoint, setStartPoint] = useState<ReportPoint | null>(null);
  const [endPoint, setEndPoint] = useState<ReportPoint | null>(null);
  const [startInput, setStartInput] = useState("");
  const [endInput, setEndInput] = useState("");
  const [severity, setSeverity] = useState<Severity>("medium");
  const [description, setDescription] = useState("");
  const [pickMode, setPickMode] = useState<PickMode>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Map-pick: listen to the shared map-center-changed event ────────────────
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleCenter = (e: Event) => {
      setMapCenter((e as CustomEvent<[number, number]>).detail);
    };
    window.addEventListener("map-center-changed", handleCenter);
    return () => window.removeEventListener("map-center-changed", handleCenter);
  }, []);

  const handlePickOnMap = (target: PickMode) => {
    setPickMode(target);
    // Signal MapCanvas to enter crosshair mode for this panel
    window.dispatchEvent(
      new CustomEvent("flood-report-pick-mode", { detail: target })
    );
  };

  const confirmMapLocation = useCallback(() => {
    if (!pickMode || !mapCenter) return;
    const label = `${mapCenter[0].toFixed(5)}, ${mapCenter[1].toFixed(5)}`;
    if (pickMode === "start") {
      setStartPoint({ coords: mapCenter, label });
      setStartInput(label);
      setPickMode("end");
      window.dispatchEvent(new CustomEvent("flood-report-pick-mode", { detail: "end" }));
    } else {
      setEndPoint({ coords: mapCenter, label });
      setEndInput(label);
      setPickMode(null);
      window.dispatchEvent(new CustomEvent("flood-report-pick-mode", { detail: null }));
    }
  }, [pickMode, mapCenter]);

  // ── Current location helper ────────────────────────────────────────────────
  const handleUseCurrent = async (target: "start" | "end") => {
    try {
      const coords = await getCurrentLocation();
      const label = "Current Location";
      if (target === "start") {
        setStartPoint({ coords, label });
        setStartInput(label);
      } else {
        setEndPoint({ coords, label });
        setEndInput(label);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unable to retrieve your location";
      setFeedback({ type: "error", message });
    }
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);

    if (!startPoint || !endPoint) {
      setFeedback({ type: "error", message: "Please set both the Flood Start and Flood End locations." });
      return;
    }
    if (!description.trim()) {
      setFeedback({ type: "error", message: "Please add a description of the flood conditions." });
      return;
    }

    setIsSubmitting(true);
    try {
      // Submit as LineString geometry representing the affected road segment
      const dbReport = await apiClient.post<{ id: number }>("/reports/", {
        raw_text: description.trim(),
        source: "direct_user",
        severity,
        geometry: {
          type: "LineString",
          coordinates: [startPoint.coords, endPoint.coords],
        },
      });

      // Create avoidance zone buffered around the midpoint of the segment
      const midpoint: [number, number] = [
        (startPoint.coords[0] + endPoint.coords[0]) / 2,
        (startPoint.coords[1] + endPoint.coords[1]) / 2,
      ];
      const bufferPoly = createBufferPolygon(midpoint, 100);
      await apiClient.post<unknown>("/reports/avoidance-zones", {
        report_id: dbReport.id,
        is_active: true,
        geometry: { type: "Polygon", coordinates: bufferPoly },
      });

      // Reset form
      setStartPoint(null);
      setEndPoint(null);
      setStartInput("");
      setEndInput("");
      setSeverity("medium");
      setDescription("");
      setFeedback({ type: "success", message: "Flood report submitted successfully. It is now pending admin review." });
    } catch (err: unknown) {
      console.error("Error submitting flood report:", err);
      setFeedback({ type: "error", message: "Failed to submit the report. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = !!startPoint && !!endPoint && description.trim().length > 0 && !isSubmitting;

  // ── Mobile map-pick overlay ────────────────────────────────────────────────
  if (isMobile && pickMode) {
    return (
      <div className="absolute inset-0 pointer-events-none z-40 flex flex-col justify-between">
        <div className="p-4 pointer-events-auto">
          <button
            onClick={() => {
              setPickMode(null);
              window.dispatchEvent(new CustomEvent("flood-report-pick-mode", { detail: null }));
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
            Set {pickMode === "start" ? "Flood Start" : "Flood End"}
          </button>
        </div>
      </div>
    );
  }

  // ── Shared form body ───────────────────────────────────────────────────────
  const formBody = (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Point selectors */}
      <PointSelector
        point="start"
        label={startInput}
        isActive={pickMode === "start"}
        isSet={!!startPoint}
        onActivate={() => handlePickOnMap("start")}
        onLabelChange={(val) => setStartInput(val)}
        onSelect={(s) => {
          setStartPoint({ coords: [s.lng, s.lat], label: s.label });
          setStartInput(s.label);
        }}
        onUseCurrent={() => handleUseCurrent("start")}
        onClear={() => { setStartPoint(null); setStartInput(""); }}
      />

      <PointSelector
        point="end"
        label={endInput}
        isActive={pickMode === "end"}
        isSet={!!endPoint}
        onActivate={() => handlePickOnMap("end")}
        onLabelChange={(val) => setEndInput(val)}
        onSelect={(s) => {
          setEndPoint({ coords: [s.lng, s.lat], label: s.label });
          setEndInput(s.label);
        }}
        onUseCurrent={() => handleUseCurrent("end")}
        onClear={() => { setEndPoint(null); setEndInput(""); }}
      />

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

      {/* Inline feedback banner */}
      {feedback && (
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium",
            feedback.type === "success"
              ? "bg-green-50 border-green-200 text-green-700"
              : "bg-red-50 border-red-200 text-red-700"
          )}
        >
          {feedback.type === "success" ? (
            <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-orange-500 hover:bg-orange-600 focus:ring-orange-400 text-white font-semibold"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Flood Report"
        )}
      </Button>
    </form>
  );

  return (
    <Panel
      title="Report Flood"
      icon={<Navigation2 className="h-4 w-4 text-orange-600 rotate-180" />}
      iconBgClassName="bg-orange-100"
      isCollapsed={isCollapsed}
      onCollapseToggle={() => setIsCollapsed((c) => !c)}
      isMobile={isMobile}
      isOpen={isOpen}
      onClose={onClose}
      anchor="right"
      initialPosition={{ x: 16, y: 80 }}
    >
      {formBody}
    </Panel>
  );
}
