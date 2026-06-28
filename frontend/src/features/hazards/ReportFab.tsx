"use client";

import { Plus } from "lucide-react";
import { Button } from "@/shared/ui/Button";

interface ReportFabProps {
  onClick: () => void;
}

export function ReportFab({ onClick }: ReportFabProps) {
  return (
    <Button
      onClick={onClick}
      className="absolute bottom-[calc(64px+env(safe-area-inset-bottom)+12px)] left-4 sm:bottom-8 sm:right-16 sm:left-auto z-40 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
      title="Report Flood Hazard"
    >
      <Plus className="w-7 h-7 text-white" />
    </Button>
  );
}
