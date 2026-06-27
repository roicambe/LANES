"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Default settings for LANES
            staleTime: 60 * 1000, // Data stays fresh for 1 minute before refetching
            refetchOnWindowFocus: true, // Auto-refetch when user switches back to the app
            retry: 3, // Retry failed requests 3 times (good for bad network areas)
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
