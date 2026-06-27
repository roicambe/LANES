"use client";

import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

export default function LoginForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for login
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input
          type="email"
          placeholder="you@example.com"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
        <Input
          type="password"
          placeholder="••••••••"
          required
        />
      </div>
      <Button type="submit" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
