"use client";

import { Info } from "lucide-react";

export function FloodLegend() {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 w-full h-full flex flex-col">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-gray-800 mb-2">Flood Severity Zones</h3>
        <p className="text-xs text-gray-500 leading-relaxed">
          These colors represent flood zones on the map. The severity determines which vehicles can safely pass.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
        {/* White */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full border border-gray-300 bg-white shrink-0 shadow-sm"></div>
            <span className="font-semibold text-gray-900 text-sm">White</span>
            <span className="text-xs text-gray-700 font-medium ml-auto px-2 py-0.5 bg-gray-100 rounded-md">Ankle Deep</span>
          </div>
          <p className="text-xs text-gray-600 leading-snug">
            Passable by all vehicles, motorcycles, and pedestrians.
          </p>
        </div>

        {/* Yellow */}
        <div className="bg-yellow-50/50 border border-yellow-200/60 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 shrink-0 shadow-sm"></div>
            <span className="font-semibold text-yellow-900 text-sm">Yellow</span>
            <span className="text-xs text-yellow-900 font-medium ml-auto px-2 py-0.5 bg-yellow-100 rounded-md">Knee Deep</span>
          </div>
          <p className="text-xs text-yellow-900/90 leading-snug">
            Passable by 4-Wheel High Clearance (SUVs) & Low Clearance (Sedans).
          </p>
        </div>

        {/* Orange */}
        <div className="bg-orange-50/50 border border-orange-200/60 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-orange-500 shrink-0 shadow-sm"></div>
            <span className="font-semibold text-orange-900 text-sm">Orange</span>
            <span className="text-xs text-orange-900 font-medium ml-auto px-2 py-0.5 bg-orange-100 rounded-md">Waist to Chest</span>
          </div>
          <p className="text-xs text-orange-900/90 leading-snug">
            Only passable by 4-Wheel High Clearance (SUVs, Pickups).
          </p>
        </div>

        {/* Red */}
        <div className="bg-red-50/50 border border-red-200/60 rounded-xl p-4 flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-3.5 h-3.5 rounded-full bg-red-600 shrink-0 shadow-sm"></div>
            <span className="font-semibold text-red-900 text-sm">Red</span>
            <span className="text-xs text-red-700 font-medium ml-auto px-2 py-0.5 bg-red-100 rounded-md">Neck Deep</span>
          </div>
          <p className="text-xs text-red-800/80 leading-snug">
            Impassable for all standard vehicles. Seek alternative routes.
          </p>
        </div>
      </div>
    </div>
  );
}
