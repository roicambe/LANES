"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map as MapIcon, AlertTriangle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Route", icon: MapIcon },
  { href: "/reports", label: "Reports", icon: AlertTriangle },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export default function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] sm:hidden z-50 pb-safe">
      <div className="flex justify-around items-center h-16 px-2">
        {MOBILE_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors tap-highlight-transparent",
                isActive ? "text-blue-600" : "text-gray-500 hover:text-gray-900"
              )}
            >
              <Icon className={cn("h-6 w-6 transition-transform", isActive ? "scale-110" : "scale-100")} />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-blue-600" : "text-gray-500")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
