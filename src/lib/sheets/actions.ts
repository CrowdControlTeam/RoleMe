"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type CreateSheetState = {
  status: "idle" | "error";
  errorKey?: "invalidName" | "invalidType" | "generic";
};

export async function createSheet(
  campaignId: string,
  _prevState: CreateSheetState,
  formData: FormData,
): Promise<CreateSheetState> {
  const name = formData.get("name");
  const type = formData.get("type");

  if (typeof name !== "string" || !name.trim()) {
    return { status: "error", errorKey: "invalidName" };
  }

  if (type !== "character" && type !== "master") {
    return { status: "error", errorKey: "invalidType" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", errorKey: "generic" };
  }

  const { data, error } = await supabase
    .from("sheets")
    .insert({
      campaign_id: campaignId,
      owner_id: user.id,
      type,
      name: name.trim(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/sheets`);
  redirect(`/campaigns/${campaignId}/sheets/${data.id}`);
}

// A sheet is "in play": some lobby/session has it readied up and hasn't
// finished yet. Stats and character info are frozen while that's true —
// only the character_state group stays editable during a game.
export async function isSheetLocked(
  supabase: SupabaseClient<Database>,
  sheetId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("session_participants")
    .select("ready, sessions(status)")
    .eq("sheet_id", sheetId)
    .eq("ready", true);

  return (data ?? []).some(
    (p) => p.sessions?.status === "preparing" || p.sessions?.status === "active",
  );
}

export type UpdateSheetFieldsState = {
  status: "idle" | "success" | "error";
  errorKey?: "locked" | "generic";
};

function fieldRowsFromFormData(sheetId: string, formData: FormData) {
  const gameFieldIds = formData.getAll("gameFieldId").map(String);
  return gameFieldIds.map((gameFieldId) => ({
    sheet_id: sheetId,
    game_field_id: gameFieldId,
    value: (formData.get(`value_${gameFieldId}`) as string | null) ?? null,
    visible_on_card: formData.get(`visible_${gameFieldId}`) === "on",
  }));
}

// Stats + character info: locked once the sheet is readied up in a
// non-finished session (see isSheetLocked).
export async function updateSheetStatsInfo(
  sheetId: string,
  campaignId: string,
  _prevState: UpdateSheetFieldsState,
  formData: FormData,
): Promise<UpdateSheetFieldsState> {
  const supabase = await createClient();

  if (await isSheetLocked(supabase, sheetId)) {
    return { status: "error", errorKey: "locked" };
  }

  const rows = fieldRowsFromFormData(sheetId, formData);
  if (rows.length === 0) {
    return { status: "success" };
  }

  const { error } = await supabase
    .from("sheet_field_values")
    .upsert(rows, { onConflict: "sheet_id,game_field_id" });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/sheets/${sheetId}`);
  return { status: "success" };
}

// Character state (HP, conditions...): always editable by the owner, even
// mid-session — this is the group meant to change during play.
export async function updateSheetState(
  sheetId: string,
  campaignId: string,
  _prevState: UpdateSheetFieldsState,
  formData: FormData,
): Promise<UpdateSheetFieldsState> {
  const supabase = await createClient();

  const rows = fieldRowsFromFormData(sheetId, formData);
  if (rows.length === 0) {
    return { status: "success" };
  }

  const { error } = await supabase
    .from("sheet_field_values")
    .upsert(rows, { onConflict: "sheet_id,game_field_id" });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/sheets/${sheetId}`);
  return { status: "success" };
}

export async function deleteSheet(campaignId: string, sheetId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("sheets").delete().eq("id", sheetId);

  if (error) {
    throw error;
  }

  revalidatePath(`/campaigns/${campaignId}/sheets`);
  redirect(`/campaigns/${campaignId}/sheets`);
}

export type ImportSheetState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidJson" | "notCharacterSheet" | "locked" | "generic";
};

export async function importSheetJson(
  sheetId: string,
  campaignId: string,
  _prevState: ImportSheetState,
  formData: FormData,
): Promise<ImportSheetState> {
  const raw = formData.get("json");

  if (typeof raw !== "string" || !raw.trim()) {
    return { status: "error", errorKey: "invalidJson" };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { status: "error", errorKey: "invalidJson" };
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !Array.isArray((parsed as { fields?: unknown }).fields)
  ) {
    return { status: "error", errorKey: "invalidJson" };
  }

  const fields = (parsed as { fields: unknown[] }).fields;

  const supabase = await createClient();

  const { data: sheet } = await supabase
    .from("sheets")
    .select("id, type, campaigns(game)")
    .eq("id", sheetId)
    .maybeSingle();

  if (!sheet || sheet.type !== "character") {
    return { status: "error", errorKey: "notCharacterSheet" };
  }

  // Import can touch stats/info, so it's subject to the same lock.
  if (await isSheetLocked(supabase, sheetId)) {
    return { status: "error", errorKey: "locked" };
  }

  const gameId = sheet.campaigns?.game;
  const { data: gameFields } = await supabase
    .from("game_fields")
    .select("id, key")
    .eq("game_id", gameId ?? "");

  const fieldIdByKey = new Map((gameFields ?? []).map((f) => [f.key, f.id]));

  const rows = fields
    .filter(
      (f): f is { key: string; value?: unknown; visibleOnCard?: unknown } =>
        typeof f === "object" &&
        f !== null &&
        typeof (f as { key?: unknown }).key === "string" &&
        fieldIdByKey.has((f as { key: string }).key),
    )
    .map((f) => ({
      sheet_id: sheetId,
      game_field_id: fieldIdByKey.get(f.key)!,
      value: f.value == null ? null : String(f.value),
      visible_on_card: Boolean(f.visibleOnCard ?? true),
    }));

  if (rows.length === 0) {
    return { status: "error", errorKey: "invalidJson" };
  }

  const { error } = await supabase
    .from("sheet_field_values")
    .upsert(rows, { onConflict: "sheet_id,game_field_id" });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath(`/campaigns/${campaignId}/sheets/${sheetId}`);
  return { status: "success" };
}
