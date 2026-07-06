import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

export async function ensureSession(supabase: SupabaseClient<Database>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return user;
  }

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error || !data.user) {
    throw error ?? new Error("Anonymous sign-in returned no user");
  }

  return data.user;
}
