"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function useRoute() {
  const [origin, setOrigin] = useState<[number, number] | null>(null);
  const [destination, setDestination] = useState<[number, number] | null>(null);

  const { data: route, isLoading, error, refetch } = useQuery({
    queryKey: ['route', origin, destination],
    queryFn: () => {
      if (!origin || !destination) return null;
      return apiClient.post('/routes/calculate', { origin, destination });
    },
    enabled: !!origin && !!destination,
  });

  return {
    origin,
    setOrigin,
    destination,
    setDestination,
    route,
    isLoading,
    error,
    calculate: refetch
  };
}
