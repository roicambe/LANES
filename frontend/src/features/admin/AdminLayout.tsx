"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { 
  LayoutDashboard, 
  Map, 
  AlertTriangle, 
  LogOut,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard", href: "/admin/reports", icon: LayoutDashboard },
  { name: "Live Map", href: "/", icon: Map },
  { name: "Active Zones", href: "/admin/zones", icon: AlertTriangle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("lanes_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("lanes_token");
    router.push("/profile");
  };

  if (!isMounted) return null; // Prevent hydration errors

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* 
        Sidebar wrapper: 
        Uses 'group' to detect hover state.
        Default width: w-16 (just enough for icons).
        Hover width: w-64 (expands to show text).
        Transition: fast (duration-150).
      */}
      <aside 
        className="group flex flex-col h-full bg-white border-r border-gray-200 
                   w-14 hover:w-56 transition-all duration-150 ease-in-out shrink-0 z-20 shadow-sm"
      >
        {/* Brand Header */}
        <div className="h-[92px] py-4 flex flex-col items-center justify-between border-b border-gray-200 overflow-hidden shrink-0 w-full">
          {/* Logo Row */}
          <div className="flex items-center justify-center w-full">
            <Image 
              src="/lanes-logo/lanes-logo.svg" 
              alt="LANES Logo" 
              width={26} 
              height={26} 
              className="shrink-0" 
            />
            <span className="font-extrabold text-lg text-slate-800 tracking-tight mt-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden group-hover:block">
              ANES
            </span>
          </div>
          
          {/* Admin Panel Row */}
          <div className="flex items-center justify-center w-full">
            <ShieldCheck className="w-[20px] h-[20px] text-blue-600 shrink-0" />
            <span className="ml-1.5 font-semibold text-sm text-gray-900 tracking-tight whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden group-hover:block">
              Admin Panel
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 flex flex-col gap-1.5 overflow-hidden px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center h-9 w-full rounded-md transition-colors group/link overflow-hidden shrink-0",
                  isActive 
                    ? "bg-blue-50 text-blue-700" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                title={item.name}
              >
                <div className="w-10 flex items-center justify-center shrink-0">
                  <Icon className={cn("w-4 h-4", isActive ? "text-blue-600" : "")} />
                </div>
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.name}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Footer actions */}
        <div className="p-2 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center w-full h-9 rounded-md text-red-600 hover:bg-red-50 transition-colors overflow-hidden shrink-0 cursor-pointer"
            title="Log Out"
          >
            <div className="w-10 flex items-center justify-center shrink-0">
              <LogOut className="w-4 h-4" />
            </div>
            <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              Log Out
            </span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
