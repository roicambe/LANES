"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import Link from "next/link";
import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";
import { apiClient } from "@/lib/apiClient";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function LoginForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = useMutation({
    mutationFn: async () => {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      return apiClient.post<{ access_token: string }>("/auth/login/access-token", formData.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        // We override body in post but because we pass a string, we need to bypass the JSON.stringify in apiClient.
        // Actually, our apiClient does JSON.stringify by default for POST. Let's use request directly:
      });
    },
    onError: (error: any) => {
      setErrorMsg(error.message || "Failed to log in. Please check your credentials.");
    },
    onSuccess: (data) => {
      localStorage.setItem("lanes_token", data.access_token);
      router.push("/admin/dashboard");
    },
  });

  // Custom request for form data to bypass JSON stringify
  const handleDirectLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";
      const response = await fetch(`${baseUrl}/auth/login/access-token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error("Incorrect username or password");
      }

      const data = await response.json();
      localStorage.setItem("lanes_token", data.access_token);
      
      // Determine role by fetching profile
      const profileResponse = await fetch(`${baseUrl}/auth/test-token`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${data.access_token}` }
      });
      
      if (profileResponse.ok) {
        const profile = await profileResponse.json();
        if (profile.role?.name !== "Commuter") {
          router.push("/admin/dashboard");
          return;
        }
      }
      
      // If not an admin, just refresh the profile view
      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message || "Login failed");
    }
  };

  return (
    <form onSubmit={handleDirectLogin} className="space-y-4">
      {errorMsg && (
        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg font-medium">
          {errorMsg}
        </div>
      )}
      <Input
        label="Email or Username"
        type="text"
        placeholder="admin"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        required
      />
      <Input
        label="Password"
        type={showPassword ? "text" : "password"}
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
        className="text-gray-900 bg-white"
        rightIcon={
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 text-gray-400 hover:text-gray-600 focus:outline-none"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        }
      />
      <div className="flex justify-end mt-1">
        <a href="#" className="text-sm text-blue-600 hover:text-blue-500 font-medium hover:underline transition-colors">Forgot password?</a>
      </div>
      <div className="pt-2">
        <Button type="submit" className="w-full">
          Sign In
        </Button>
      </div>
      <div className="text-center pt-2">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link href="/register" className="text-blue-600 font-medium hover:text-blue-500 hover:underline transition-colors">
            Sign up
          </Link>
        </p>
      </div>
    </form>
  );
}
