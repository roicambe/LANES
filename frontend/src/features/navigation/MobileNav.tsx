"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, User, Newspaper } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:hidden z-50 pb-safe select-none">
      <div className="relative flex justify-around items-center h-16 px-2">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-300 tap-highlight-transparent z-10",
                isActive ? "text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <div className={cn(
                "absolute inset-y-1.5 inset-x-3 bg-blue-600 rounded-xl -z-10 transition-opacity duration-300",
                isActive ? "opacity-100" : "opacity-0"
              )} />
              <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 mt-0.5" : "scale-100")} />
              <span className={cn("text-[10px] font-medium transition-colors duration-300", isActive ? "text-blue-100" : "text-gray-500")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
