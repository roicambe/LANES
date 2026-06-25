"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { Home, Info, Phone, LogIn, Map as MapIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/map", label: "Map", icon: MapIcon },
  { href: "/#about", label: "About", icon: Info },
  { href: "/#contact", label: "Contact Us", icon: Phone },
  { href: "/login", label: "Login", icon: LogIn },
] as const;

export default function FloatingNav() {
  const pathname = usePathname();
  const isMapPage = pathname === "/map";

  return (
    <nav className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
      <div className="flex items-center gap-1 bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 px-2 py-1.5 transition-all duration-500 ease-in-out">
        <div className="flex items-center gap-0.5 px-3 hidden sm:flex">
          <Image src="/lanes-logo/lanes-logo.svg" alt="L Logo" width={20} height={20} className="h-5 w-auto" />
          <span className="font-extrabold text-sm text-slate-800 tracking-tight mt-0.5">ANES</span>
        </div>
        <span className="w-px h-5 bg-gray-200 hidden sm:block" />
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || (href !== "/" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center justify-center transition-all duration-500 ease-in-out",
                isMapPage ? "rounded-xl px-3 py-1.5" : "rounded-full px-3 py-1.5 gap-2",
                isActive
                  ? "text-white"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-active-pill"
                  className={cn("absolute inset-0 bg-blue-600 -z-10", isMapPage ? "rounded-xl" : "rounded-full")}
                  initial={false}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className={cn("shrink-0 transition-all duration-500", "h-5 w-5")} />
              
              {/* Inline text for expanded mode */}
              <span className={cn(
                "overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-500 ease-in-out",
                isMapPage ? "max-w-0 opacity-0 hidden sm:block" : "max-w-[100px] opacity-100"
              )}>
                {label}
              </span>

              {/* Tooltip for condensed mode */}
              <span className={cn(
                "absolute top-full mt-2 whitespace-nowrap rounded-md bg-gray-900 px-2.5 py-1 text-xs font-medium text-white shadow-md transition-all duration-300 ease-out pointer-events-none",
                isMapPage 
                  ? "opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0"
                  : "hidden"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
