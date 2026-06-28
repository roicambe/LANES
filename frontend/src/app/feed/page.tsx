import { Construction } from "lucide-react";
import React from "react";

export const metadata = {
  title: "Feed | LANES",
  description: "Community Feed - LANES",
};

export default function FeedPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-6">
          <Construction className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Feed Under Development</h1>
        <p className="text-slate-600">
          We're currently building the community feed feature. Check back soon for real-time updates and community reports!
        </p>
      </div>
    </div>
  );
}
