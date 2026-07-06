"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type AdventureFormState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidName" | "invalidRequiredPlayers" | "generic";
};

async function validateAdventureInput(
  campaignId: string,
  formData: FormData,
): Promise<
  | { ok: true; name: string; description: string | null; requiredPlayers: number }
  | { ok: false; errorKey: NonNullable<AdventureFormState["errorKey"]> }
> {
  const name = formData.get("name");
  const description = formData.get("description");
  const requiredPlayersRaw = formData.get("requiredPlayers");

  if (typeof name !== "string" || !name.trim()) {
    return { ok: false, errorKey: "invalidName" };
  }

  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("max_players")
    .eq("id", campaignId)
    .maybeSingle();

  const requiredPlayers = Number(requiredPlayersRaw);
  if (
    !campaign ||
    !Number.isInteger(requiredPlayers) ||
    requiredPlayers < 1 ||
    requiredPlayers > campaign.max_players
  ) {
    return { ok: false, errorKey: "invalidRequiredPlayers" };
  }

  return {
    ok: true,
    name: name.trim(),
    description: typeof description === "string" && description.trim() ? description.trim() : null,
    requiredPlayers,
  };
}

export async function createAdventure(
  campaignId: string,
  _prevState: AdventureFormState,
  formData: FormData,
): Promise<AdventureFormState> {
  const result = await validateAdventureInput(campaignId, formData);
  if (!result.ok) {
    return { status: "error", errorKey: result.errorKey };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("adventures")
    .insert({
      campaign_id: campaignId,
      name: result.name,
      description: result.description,
      required_players: result.requiredPlayers,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/adventures`);
  redirect(`/campaigns/${campaignId}/adventures/${data.id}`);
}

export async function updateAdventure(
  adventureId: string,
  campaignId: string,
  _prevState: AdventureFormState,
  formData: FormData,
): Promise<AdventureFormState> {
  const result = await validateAdventureInput(campaignId, formData);
  if (!result.ok) {
    return { status: "error", errorKey: result.errorKey };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("adventures")
    .update({
      name: result.name,
      description: result.description,
      required_players: result.requiredPlayers,
    })
    .eq("id", adventureId);

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/adventures/${adventureId}`);
  return { status: "success" };
}

export async function deleteAdventure(campaignId: string, adventureId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("adventures").delete().eq("id", adventureId);

  if (error) {
    throw error;
  }

  revalidatePath(`/campaigns/${campaignId}/adventures`);
  redirect(`/campaigns/${campaignId}/adventures`);
}
