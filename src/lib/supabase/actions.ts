"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "./server";

export async function startAnonymousSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw error;
    }
  }

  revalidatePath("/");
}

export type LinkEmailState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidEmail" | "generic";
};

export async function linkEmail(
  _prevState: LinkEmailState,
  formData: FormData,
): Promise<LinkEmailState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { status: "error", errorKey: "invalidEmail" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: email.trim() });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/");
  return { status: "success" };
}
