"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Logo } from "@/shared/ui/Logo";
import {
  LayoutDashboard,
  Map,
  Layers,
  FileText,
  Users,
  ShieldCheck,
  ClipboardList,
  Archive,
  Database,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { name: "Dashboard",      href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Live Map",       href: "/admin/map",       icon: Map },
  { name: "Active Zones",   href: "/admin/zones",     icon: Layers },
  { name: "Reports",        href: "/admin/reports",   icon: FileText },
  { name: "User Registry",  href: "/admin/users",     icon: Users },
  { name: "Roles",          href: "/admin/roles",     icon: ShieldCheck },
  { name: "Audit Trail",    href: "/admin/audit",     icon: ClipboardList },
  { name: "Archive Center", href: "/admin/archive",   icon: Archive },
  { name: "Data Management",href: "/admin/data",      icon: Database },
  { name: "System Settings",href: "/admin/settings",  icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("lanes_token");
    router.push("/profile");
  };

  return (
    <aside 
      className="group flex flex-col h-full bg-white border-r border-gray-200 
                 w-14 hover:w-56 transition-all duration-150 ease-in-out shrink-0 z-20 shadow-sm select-none"
    >
      {/* Brand Header */}
      <div className="h-[92px] py-4 flex flex-col items-center justify-between border-b border-gray-200 overflow-hidden shrink-0 w-full">
        {/* Logo Row */}
        <div className="flex items-center justify-center w-full">
          <Logo size="xs" textClassName="mt-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-150 hidden group-hover:block" />
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
  );
}
