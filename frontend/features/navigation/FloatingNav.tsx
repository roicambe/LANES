"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, User, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: Map },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/login", label: "Admin", icon: Shield },
] as const;

export default function FloatingNav() {
  const pathname = usePathname();

  return (
    <nav className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-2 py-1.5">
        <span className="font-bold text-sm text-blue-700 px-3 hidden sm:inline">LANES</span>
        <span className="w-px h-5 bg-gray-200 hidden sm:block" />
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
