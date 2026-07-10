"use client";

import { useState, useEffect } from "react";
import { Construction } from "lucide-react";
import LoginForm from "@/features/auth/LoginForm";

export default function ProfileView() {
  // Check authentication state on mount
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("lanes_token");
    if (token) {
      setIsLoggedIn(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return null; // or a loading spinner
  }

  if (!isLoggedIn) {
    return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white shadow-sm border border-gray-100 rounded-2xl">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
            <p className="text-gray-500 text-sm">Log in to view your profile and saved routes.</p>
          </div>
          <LoginForm />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center max-w-md w-full">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 text-amber-600 mb-6">
          <Construction className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Profile Under Development</h1>
        <p className="text-slate-600 mb-6">
          The user profile and settings page is currently being developed. Stay tuned!
        </p>
        <button
          onClick={() => {
            localStorage.removeItem("lanes_token");
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-50 text-red-600 rounded-md font-medium hover:bg-red-100 transition-colors cursor-pointer"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
