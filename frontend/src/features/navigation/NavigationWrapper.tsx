"use client";

import { usePathname } from "next/navigation";
import FloatingNav from "./FloatingNav";
import MobileNav from "./MobileNav";
import { cn } from "@/lib/utils";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the global navigation bars on the Admin pages
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const isMapPage = pathname === "/map";
  const isLandingPage = pathname === "/";

  return (
    <div className={`flex-1 flex flex-col w-full pb-16 sm:pb-0 ${!isMapPage ? "bg-gray-50" : ""}`}>
      <FloatingNav />
      <main className={cn(
        "flex-1 flex flex-col w-full min-w-0",
        !isMapPage && !isLandingPage && "sm:pt-[60px]" // Safe zone ONLY on screens where FloatingNav exists
      )}>
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
