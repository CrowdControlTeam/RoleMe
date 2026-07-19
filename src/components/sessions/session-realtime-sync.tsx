"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

// A participant's last_seen_at bumps every ~30s (see SessionHeartbeat) purely
// to let close_if_abandoned_session tell who's still around — it never
// changes anything the lobby renders, so it's excluded when deciding whether
// an update is worth a refresh.
function isMoreThanHeartbeat(
  payload: RealtimePostgresChangesPayload<Record<string, unknown>>,
) {
  const oldRow = payload.old as Record<string, unknown>;
  const newRow = payload.new as Record<string, unknown>;
  return Object.keys(newRow).some(
    (key) => key !== "last_seen_at" && oldRow[key] !== newRow[key],
  );
}

// Server actions only revalidate the page for whoever performed the action —
// everyone else's lobby stays stale until they manually reload. This
// subscribes to the tables that actually change during a lobby/session
// (who's joined/ready, session status, new dice rolls) and just asks the
// router to refetch when anything relevant happens; RLS still governs what
// each subscriber is allowed to see (e.g. a private roll only reaches the
// master and the roller).
export function SessionRealtimeSync({ sessionId }: { sessionId: string }) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let cancelled = false;

    // Subscribing before the client's auth session has finished loading from
    // cookies races Realtime's own auth handshake: the channel comes up
    // authenticated as nobody, so every RLS-gated postgres_changes policy
    // (is_campaign_member, etc.) evaluates against a null auth.uid() and
    // silently matches nothing — no error, it just never fires. Waiting for
    // getSession() first guarantees the token is attached before we subscribe.
    supabase.auth.getSession().then(() => {
      if (cancelled) {
        return;
      }

      channel = supabase
        .channel(`session-sync-${sessionId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "session_participants",
            filter: `session_id=eq.${sessionId}`,
          },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "DELETE",
            schema: "public",
            table: "session_participants",
            filter: `session_id=eq.${sessionId}`,
          },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "session_participants",
            filter: `session_id=eq.${sessionId}`,
          },
          (payload) => {
            if (isMoreThanHeartbeat(payload)) {
              router.refresh();
            }
          },
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "sessions",
            filter: `id=eq.${sessionId}`,
          },
          () => router.refresh(),
        )
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "dice_rolls",
            filter: `session_id=eq.${sessionId}`,
          },
          () => router.refresh(),
        )
        .subscribe();
    });

    return () => {
      cancelled = true;
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [sessionId, router]);

  return null;
}
