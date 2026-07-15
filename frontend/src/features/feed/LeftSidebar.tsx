"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, Rss, MessageSquarePlus, Settings, TrendingUp, MapPin, Phone, Flame, Heart } from 'lucide-react';

export function LeftSidebar() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Community Feed', href: '/feed', icon: Rss },
    { name: 'Live Map', href: '/map', icon: Map },
    { name: 'Submit Report', href: '/map?action=report', icon: MessageSquarePlus },
  ];

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-[calc(100vh-86px)] sticky top-[86px] bg-transparent overflow-y-auto hidden md:flex px-4 border-r border-gray-200">
      <div className="flex-1 py-6 space-y-6">
        {/* Navigation */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Navigation</h3>
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm ${
                  isActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Trending Locations */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Trending Hotspots
          </h3>
          <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors flex justify-between items-center group">
            <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Espana Blvd</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">12</span>
          </div>
          <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors flex justify-between items-center group">
            <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-500" /> Taft Ave</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">8</span>
          </div>
          <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors flex justify-between items-center group">
            <span className="flex items-center gap-2"><Flame className="w-4 h-4 text-orange-400" /> EDSA-Kamuning</span>
            <span className="text-xs text-gray-400 group-hover:text-gray-600">5</span>
          </div>
        </div>

        {/* Saved Places */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            Saved Places
          </h3>
          <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors flex items-center gap-3">
            <MapPin className="w-4 h-4 text-blue-500" />
            <span>Home</span>
          </div>
          <div className="px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors flex items-center gap-3">
            <MapPin className="w-4 h-4 text-purple-500" />
            <span>Office</span>
          </div>
        </div>

        {/* Emergency Hotlines */}
        <div className="space-y-1">
          <h3 className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Phone className="w-3.5 h-3.5" />
            Emergency
          </h3>
          <div className="px-3 py-2.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl cursor-pointer transition-colors flex justify-between items-center">
            <span className="font-semibold">NDRRMC</span>
            <span className="text-xs font-mono">911</span>
          </div>
          <div className="px-3 py-2.5 mt-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 rounded-xl cursor-pointer transition-colors flex justify-between items-center">
            <span className="font-semibold">Red Cross</span>
            <span className="text-xs font-mono">143</span>
          </div>
        </div>
      </div>

      <div className="py-6 border-t border-gray-100">
        <Link
          href="/settings"
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors font-medium text-sm text-gray-700 hover:bg-gray-100"
        >
          <Settings className="w-5 h-5 text-gray-500" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
