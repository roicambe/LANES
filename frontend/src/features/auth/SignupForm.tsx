"use client";

import { Input } from "@/shared/ui/Input";
import { Button } from "@/shared/ui/Button";

export default function SignupForm() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Implementation for signup
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Username"
        type="text"
        placeholder="juandelacruz"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        required
      />
      <Button type="submit" className="w-full">
        Create Account
      </Button>
    </form>
  );
}
