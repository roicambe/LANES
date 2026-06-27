"use client";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useAuth() {
  const { data: user, isLoading } = useQuery({
    queryKey: ['auth-user'],
    queryFn: () => apiClient.get('/auth/me').catch(() => null),
    retry: false, // Don't retry auth checks if unauthorized
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return {
    user,
    isAuthenticated: !!user,
    isLoading
  };
}
