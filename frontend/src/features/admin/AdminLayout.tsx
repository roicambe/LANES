"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/features/navigation/AdminSidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const token = localStorage.getItem("lanes_token");
    if (!token) {
      router.push("/login");
    }
  }, [router]);

  if (!isMounted) return null; // Prevent hydration errors

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar />
      {/* Main Content Area */}
      <main className="flex-1 h-full overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
}
