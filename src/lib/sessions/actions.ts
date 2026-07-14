"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

function lobbyPath(campaignId: string, adventureId: string, sessionId: string) {
  return `/campaigns/${campaignId}/adventures/${adventureId}/sessions/${sessionId}`;
}

export async function startSession(adventureId: string, campaignId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      adventure_id: adventureId,
      campaign_id: campaignId,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    // Someone else may have just opened the lobby (only one open session per
    // adventure is allowed) — go to it instead of failing.
    const { data: existing } = await supabase
      .from("sessions")
      .select("id")
      .eq("adventure_id", adventureId)
      .in("status", ["preparing", "active"])
      .maybeSingle();

    if (existing) {
      redirect(lobbyPath(campaignId, adventureId, existing.id));
    }
    throw error ?? new Error("Could not start session");
  }

  revalidatePath(`/campaigns/${campaignId}/adventures/${adventureId}`);
  redirect(lobbyPath(campaignId, adventureId, data.id));
}

export async function joinSession(
  sessionId: string,
  campaignId: string,
  adventureId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("session_participants")
    .insert({ session_id: sessionId, user_id: user.id });

  // 23505 = already joined; nothing to do.
  if (error && error.code !== "23505") {
    throw error;
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
}

export async function leaveSession(
  sessionId: string,
  campaignId: string,
  adventureId: string,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("session_participants")
    .delete()
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
}

export type SelectSheetState = {
  status: "idle" | "error";
  errorKey?: "invalidSheet" | "generic";
};

// Picking a sheet and readying up happen together, in one write: there's no
// value in persisting a tentative sheet_id before the player has committed to
// it, and it keeps the lobby free of a write on every dropdown change.
export async function selectSheetAndReady(
  sessionId: string,
  campaignId: string,
  adventureId: string,
  _prevState: SelectSheetState,
  formData: FormData,
): Promise<SelectSheetState> {
  const sheetId = formData.get("sheetId");

  if (typeof sheetId !== "string" || !sheetId) {
    return { status: "error", errorKey: "invalidSheet" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", errorKey: "generic" };
  }

  const { error } = await supabase
    .from("session_participants")
    .update({ sheet_id: sheetId, ready: true })
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
  return { status: "idle" };
}

export async function setReady(
  sessionId: string,
  campaignId: string,
  adventureId: string,
  ready: boolean,
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase
    .from("session_participants")
    .update({ ready })
    .eq("session_id", sessionId)
    .eq("user_id", user.id);

  if (error) {
    throw error;
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
}

export async function finishSession(
  sessionId: string,
  campaignId: string,
  adventureId: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ status: "finished", ended_at: new Date().toISOString() })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
  revalidatePath(`/campaigns/${campaignId}/adventures/${adventureId}`);
}

// Called every ~30s by a mounted session page (see SessionHeartbeat) so
// close_if_abandoned_session can tell whether every participant has gone
// quiet. No UI feedback needed — a missed beat just means the auto-close
// check fires a little sooner.
export async function heartbeat(sessionId: string) {
  const supabase = await createClient();
  await supabase.rpc("heartbeat", { p_session_id: sessionId });
}

export async function updateTurnOrder(
  sessionId: string,
  campaignId: string,
  adventureId: string,
  newOrder: string[],
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("sessions")
    .update({ turn_order: newOrder })
    .eq("id", sessionId);

  if (error) {
    throw error;
  }

  revalidatePath(lobbyPath(campaignId, adventureId, sessionId));
}
