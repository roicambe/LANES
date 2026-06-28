"use client";

import { usePathname } from "next/navigation";
import FloatingNav from "./FloatingNav";
import MobileNav from "./MobileNav";

export default function NavigationWrapper() {
  const pathname = usePathname();

  // Hide the global navigation bars on the Admin pages
  if (pathname.startsWith("/admin")) {
    return null;
  }

  return (
    <>
      <FloatingNav />
      <MobileNav />
    </>
  );
}
