"use client";

import { usePathname } from "next/navigation";
import FloatingNav from "./FloatingNav";
import MobileNav from "./MobileNav";

export default function NavigationWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Hide the global navigation bars on the Admin pages
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  const isMapPage = pathname === "/map";

  return (
    <div className={`flex-1 flex flex-col w-full ${!isMapPage ? "bg-gray-50" : ""}`}>
      <FloatingNav />
      <main className="flex-1 flex flex-col w-full min-w-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
