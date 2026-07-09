"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { DiceRollResult } from "@/components/dice/dice-roller";

export async function logDiceRoll(
  sessionId: string,
  campaignId: string,
  adventureId: string,
  roll: DiceRollResult,
  isPrivate: boolean,
) {
  if (
    !Number.isInteger(roll.faces) ||
    roll.faces < 2 ||
    !Number.isInteger(roll.quantity) ||
    roll.quantity < 1 ||
    roll.quantity > 100 ||
    !Number.isInteger(roll.modifier) ||
    roll.modifier < -1000 ||
    roll.modifier > 1000
  ) {
    throw new Error("Invalid roll");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("Not authenticated");
  }

  const { error } = await supabase.from("dice_rolls").insert({
    session_id: sessionId,
    user_id: user.id,
    faces: roll.faces,
    quantity: roll.quantity,
    modifier: roll.modifier,
    results: roll.results,
    total: roll.total,
    is_private: isPrivate,
  });

  if (error) {
    throw error;
  }

  revalidatePath(
    `/campaigns/${campaignId}/adventures/${adventureId}/sessions/${sessionId}`,
  );
}
