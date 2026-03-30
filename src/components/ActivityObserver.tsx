"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function ActivityObserver() {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session) return;

    // Send initial heartbeat
    const sendHeartbeat = async () => {
      try {
        await fetch("/api/auth/active", { method: "POST" });
      } catch (err) {
        // Silently fail to not disturb user
      }
    };

    sendHeartbeat();

    // Setup interval for periodic heartbeats (every 2 minutes)
    const interval = setInterval(sendHeartbeat, 2 * 60 * 1000);

    // Also update on visibility change (re-focusing tab)
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        sendHeartbeat();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [session]);

  return null; // Silent component
}
