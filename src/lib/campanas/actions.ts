"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { ensureSession } from "@/lib/supabase/session";
import { CAMPANA_MAX_JUGADORES_LIMIT } from "@/lib/config";
import { generateInviteCode } from "@/lib/invite-code";

export type CreateCampanaState = {
  status: "idle" | "error";
  errorKey?: "invalidName" | "invalidMaxJugadores" | "generic";
};

export async function createCampana(
  _prevState: CreateCampanaState,
  formData: FormData,
): Promise<CreateCampanaState> {
  const name = formData.get("name");
  const maxJugadoresRaw = formData.get("maxJugadores");

  if (typeof name !== "string" || !name.trim()) {
    return { status: "error", errorKey: "invalidName" };
  }

  const maxJugadores = Number(maxJugadoresRaw);
  if (
    !Number.isInteger(maxJugadores) ||
    maxJugadores < 1 ||
    maxJugadores > CAMPANA_MAX_JUGADORES_LIMIT
  ) {
    return { status: "error", errorKey: "invalidMaxJugadores" };
  }

  const supabase = await createClient();
  const user = await ensureSession(supabase);

  const { data, error } = await supabase
    .from("campanas")
    .insert({
      name: name.trim(),
      max_jugadores: maxJugadores,
      creator_id: user.id,
      invite_code: generateInviteCode(),
    })
    .select("id")
    .single();

  if (error || !data) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/campanas");
  redirect(`/campanas/${data.id}`);
}

export type JoinCampanaState = {
  status: "idle" | "error";
  errorKey?: "invalidCode" | "full" | "generic";
};

export async function joinCampana(
  _prevState: JoinCampanaState,
  formData: FormData,
): Promise<JoinCampanaState> {
  const code = formData.get("code");

  if (typeof code !== "string" || !code.trim()) {
    return { status: "error", errorKey: "invalidCode" };
  }

  const supabase = await createClient();
  await ensureSession(supabase);

  const { data, error } = await supabase.rpc("join_campana", {
    p_code: code.trim().toUpperCase(),
  });

  if (error || !data) {
    if (error?.message.includes("CAMPANA_LLENA")) {
      return { status: "error", errorKey: "full" };
    }
    return { status: "error", errorKey: "invalidCode" };
  }

  revalidatePath("/campanas");
  redirect(`/campanas/${data.id}`);
}

export async function regenerateInviteCode(campanaId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("campanas")
    .update({ invite_code: generateInviteCode() })
    .eq("id", campanaId);

  if (error) {
    throw error;
  }

  revalidatePath(`/campanas/${campanaId}`);
}
