import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

const getWsUrl = (): string => {
  if (typeof window === "undefined") return "";
  
  const isSecure = window.location.protocol === "https:";
  const protocol = isSecure ? "wss:" : "ws:";
  
  // If NEXT_PUBLIC_API_URL is explicitly set to a full HTTP URL, use its host
  const apiEnv = process.env.NEXT_PUBLIC_API_URL;
  if (apiEnv && apiEnv.startsWith("http")) {
    const url = new URL(apiEnv);
    return `${protocol}//${url.host}/api/v1/ws`;
  }
  
  // Otherwise, in local development, connect directly to the FastAPI backend on port 8000
  // This avoids the Next.js API proxy which drops WebSocket upgrade headers
  return `${protocol}//${window.location.hostname}:8000/api/v1/ws`;
};

export function useWebSocket() {
  const queryClient = useQueryClient();
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    let delay = 1000;
    let timeoutId: NodeJS.Timeout;
    let isClosedIntentional = false;

    function connect() {
      if (typeof window === "undefined") return;
      
      const wsUrl = getWsUrl();
      console.log(`Connecting to WebSocket at: ${wsUrl}`);
      
      const ws = new WebSocket(wsUrl);
      socketRef.current = ws;

      ws.onopen = () => {
        console.log("WebSocket connected successfully");
        delay = 1000; // Reset reconnection delay on successful connection
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          console.log("Received WebSocket event:", payload);
          
          const { event: eventName } = payload;
          if (eventName === "report_approved" || eventName === "report_rejected") {
            queryClient.invalidateQueries({ queryKey: ["adminReports"] });
            queryClient.invalidateQueries({ queryKey: ["activeZones"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
          } else if (eventName === "zone_deactivated") {
            queryClient.invalidateQueries({ queryKey: ["adminZones"] });
            queryClient.invalidateQueries({ queryKey: ["activeZones"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
          } else if (eventName === "report_created") {
            queryClient.invalidateQueries({ queryKey: ["adminReports"] });
            queryClient.invalidateQueries({ queryKey: ["adminDashboardStats"] });
          }
        } catch (err) {
          console.warn("Failed to parse WebSocket message:", err);
        }
      };

      ws.onclose = () => {
        if (!isClosedIntentional) {
          console.warn(`WebSocket connection closed. Attempting reconnect in ${delay}ms...`);
          timeoutId = setTimeout(() => {
            delay = Math.min(delay * 2, 30000); // Exponential backoff capped at 30s
            connect();
          }, delay);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket encountered an error:", err);
        ws.close();
      };
    }

    connect();

    return () => {
      isClosedIntentional = true;
      if (socketRef.current) {
        socketRef.current.close();
      }
      clearTimeout(timeoutId);
    };
  }, [queryClient]);
}
