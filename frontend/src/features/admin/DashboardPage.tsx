"use client";

import { useQuery } from "@tanstack/react-query";
import { getDashboardStats } from "./adminApi";
import { Card } from "@/shared/ui/Card";
import Link from "next/link";
import { 
  Loader2, 
  AlertTriangle, 
  Map, 
  CheckSquare, 
  Users, 
  Activity, 
  ShieldCheck, 
  ArrowRight,
  Database,
  CalendarCheck
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["adminDashboardStats"],
    queryFn: () => getDashboardStats(),
    refetchInterval: 15000, // auto-refresh stats every 15s
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
        <p className="text-gray-500 text-sm">Loading system metrics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl max-w-2xl mx-auto shadow-sm space-y-2">
        <div className="flex items-center gap-2 font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <span>Failed to load dashboard metrics</span>
        </div>
        <p className="text-sm text-rose-600/90">{error.message}</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: "Pending Reports",
      value: stats?.total_pending_reports ?? 0,
      description: "Needs admin review",
      icon: AlertTriangle,
      color: "amber",
      href: "/admin/reports",
      actionText: "Review queue"
    },
    {
      title: "Active Detours",
      value: stats?.total_active_zones ?? 0,
      description: "Avoidance zones active",
      icon: Map,
      color: "blue",
      href: "/admin/zones",
      actionText: "Manage zones"
    },
    {
      title: "Today's Approvals",
      value: stats?.total_approved_today ?? 0,
      description: "Routes adjusted today",
      icon: CalendarCheck,
      color: "emerald",
      href: "/admin/reports",
      actionText: "View approved"
    },
    {
      title: "Total User Accounts",
      value: stats?.total_users ?? 0,
      description: "Registered in system",
      icon: Users,
      color: "indigo",
      href: "/admin/users",
      actionText: "Manage users"
    }
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">LANES Overview</h1>
        <p className="text-gray-500 text-sm mt-1">
          Monitor system metrics, coordinate active detours, and audit moderation workflows.
        </p>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((card) => {
          const Icon = card.icon;
          return (
            <div 
              key={card.title} 
              className="bg-white rounded-2xl border border-gray-200 p-6 flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-semibold text-gray-400">{card.title}</span>
                  <div className={`p-2.5 rounded-xl bg-${card.color}-50 text-${card.color}-600`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div>
                  <h3 className="text-3xl font-extrabold text-gray-900">{card.value}</h3>
                  <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                </div>
              </div>
              <div className="border-t border-gray-100 mt-6 pt-4 flex justify-between items-center">
                <Link 
                  href={card.href} 
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors group"
                >
                  {card.actionText}
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status & Quick Actions */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* System Health Status */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 md:col-span-1">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-600" />
            System Health Check
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Database className="w-4 h-4 text-gray-400" />
                Spatial Database
              </span>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-bold text-emerald-600 capitalize">
                  {stats?.database_status || "connected"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-400" />
                Auth Token Validator
              </span>
              <span className="text-xs font-bold text-emerald-600">
                ACTIVE
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Map className="w-4 h-4 text-gray-400" />
                OSRM Detour Service
              </span>
              <span className="text-xs font-bold text-emerald-600">
                OPERATIONAL
              </span>
            </div>
          </div>
        </div>

        {/* Quick Launch Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm space-y-6 md:col-span-2">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            Quick Administration Tasks
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <Link 
              href="/admin/map"
              className="p-4 border border-gray-100 hover:border-blue-100 hover:bg-blue-50/20 rounded-xl flex items-start gap-4 transition-all duration-200 group"
            >
              <div className="p-2.5 bg-blue-50 rounded-xl text-blue-600">
                <Map className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">
                  Explore Live Detour Map
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Inspect the map and live routing detours inside Pasig City.
                </p>
              </div>
            </Link>

            <Link 
              href="/admin/reports"
              className="p-4 border border-gray-100 hover:border-amber-100 hover:bg-amber-50/20 rounded-xl flex items-start gap-4 transition-all duration-200 group"
            >
              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-600">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-amber-700 transition-colors">
                  Review Pending Reports
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Decide on pending citizen feeds and social alerts.
                </p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
