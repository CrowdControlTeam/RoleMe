"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureSession } from "@/lib/supabase/session";
import { CAMPAIGN_MAX_PLAYERS_LIMIT } from "@/lib/config";
import { generateInviteCode } from "@/lib/invite-code";

export type CreateCampaignState = {
  status: "idle" | "error";
  errorKey?: "invalidName" | "invalidMaxPlayers" | "invalidGame" | "generic";
};

export async function createCampaign(
  _prevState: CreateCampaignState,
  formData: FormData,
): Promise<CreateCampaignState> {
  const name = formData.get("name");
  const maxPlayersRaw = formData.get("maxPlayers");
  const game = formData.get("game");

  if (typeof name !== "string" || !name.trim()) {
    return { status: "error", errorKey: "invalidName" };
  }

  if (typeof game !== "string" || !game.trim()) {
    return { status: "error", errorKey: "invalidGame" };
  }

  const maxPlayers = Number(maxPlayersRaw);
  if (
    !Number.isInteger(maxPlayers) ||
    maxPlayers < 1 ||
    maxPlayers > CAMPAIGN_MAX_PLAYERS_LIMIT
  ) {
    return { status: "error", errorKey: "invalidMaxPlayers" };
  }

  const supabase = await createClient();
  const user = await ensureSession(supabase);

  const { data, error } = await supabase
    .from("campaigns")
    .insert({
      name: name.trim(),
      game,
      max_players: maxPlayers,
      creator_id: user.id,
      invite_code: generateInviteCode(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      status: "error",
      errorKey: error?.code === "23503" ? "invalidGame" : "generic",
    };
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}`);
}

export type JoinCampaignState = {
  status: "idle" | "error";
  errorKey?: "invalidCode" | "full" | "generic";
};

export async function joinCampaign(
  _prevState: JoinCampaignState,
  formData: FormData,
): Promise<JoinCampaignState> {
  const code = formData.get("code");

  if (typeof code !== "string" || !code.trim()) {
    return { status: "error", errorKey: "invalidCode" };
  }

  const supabase = await createClient();
  await ensureSession(supabase);

  const { data, error } = await supabase.rpc("join_campaign", {
    p_code: code.trim().toUpperCase(),
  });

  if (error || !data) {
    if (error?.message.includes("CAMPAIGN_FULL")) {
      return { status: "error", errorKey: "full" };
    }
    return { status: "error", errorKey: "invalidCode" };
  }

  revalidatePath("/campaigns");
  redirect(`/campaigns/${data.id}`);
}

export async function regenerateInviteCode(campaignId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("campaigns")
    .update({ invite_code: generateInviteCode() })
    .eq("id", campaignId);

  if (error) {
    throw error;
  }

  revalidatePath(`/campaigns/${campaignId}`);
}
