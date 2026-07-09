"use client";

import { useEffect } from "react";
import { heartbeat } from "@/lib/sessions/actions";

const HEARTBEAT_INTERVAL_MS = 30_000;

// Renders nothing — just keeps session_participants.last_seen_at fresh
// while this session's page is open, so close_if_abandoned_session can
// later tell whether every participant has gone quiet.
export function SessionHeartbeat({ sessionId }: { sessionId: string }) {
  useEffect(() => {
    heartbeat(sessionId);
    const interval = setInterval(() => heartbeat(sessionId), HEARTBEAT_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [sessionId]);

  return null;
}
