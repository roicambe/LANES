import React from 'react';
import { CloudRain, Newspaper, Trophy } from 'lucide-react';

export function RightSidebar() {
  return (
    <aside className="w-80 flex-shrink-0 flex flex-col h-[calc(100vh-5rem)] sticky top-20 overflow-y-auto hidden lg:flex px-6 py-6 space-y-6">
      
      {/* Weather Widget */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <CloudRain className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Weather Alerts</h3>
        </div>
        <div className="space-y-3">
          <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
            <p className="text-sm font-medium text-blue-900">Light Rain Expected</p>
            <p className="text-xs text-blue-700 mt-1">Starting around 4:00 PM in your area. Low flood risk currently.</p>
          </div>
        </div>
      </div>

      {/* News Widget */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Newspaper className="w-5 h-5 text-purple-500" />
          <h3 className="font-semibold text-gray-900">Local Updates</h3>
        </div>
        <div className="space-y-3">
          <div className="group cursor-pointer">
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              City Council announces new drainage clearing schedule for the rainy season.
            </p>
            <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
          </div>
          <hr className="border-gray-100" />
          <div className="group cursor-pointer">
            <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
              Main bridge repairs completed early, reducing bypass traffic.
            </p>
            <p className="text-xs text-gray-500 mt-1">5 hours ago</p>
          </div>
        </div>
      </div>

      {/* Leaderboard Widget (Under Development) */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-bl-lg">
          UNDER DEV
        </div>
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <h3 className="font-semibold text-gray-900">Top Reporters</h3>
        </div>
        <div className="space-y-3 opacity-60 pointer-events-none">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-gray-400">#{i}</span>
                <div className="w-8 h-8 rounded-full bg-gray-200"></div>
                <span className="text-sm font-medium text-gray-700">Citizen_{i}00</span>
              </div>
              <span className="text-xs font-semibold text-blue-600">{100 - i * 10} pts</span>
            </div>
          ))}
        </div>
      </div>
      
    </aside>
  );
}
