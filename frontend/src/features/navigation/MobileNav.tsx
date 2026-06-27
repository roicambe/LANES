"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Map as MapIcon, Info, LogIn } from "lucide-react";
import { cn } from "@/lib/utils";

const MOBILE_NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/about", label: "About", icon: Info },
  { href: "/login", label: "Login", icon: LogIn },
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
                "relative flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors tap-highlight-transparent z-10",
                isActive ? "text-white" : "text-gray-500 hover:text-gray-900"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-pill"
                  className="absolute inset-y-1.5 inset-x-3 bg-blue-600 rounded-xl -z-10"
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("h-5 w-5 transition-transform", isActive ? "scale-110 mt-0.5" : "scale-100")} />
              <span className={cn("text-[10px] font-medium transition-colors", isActive ? "text-blue-100" : "text-gray-500")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
