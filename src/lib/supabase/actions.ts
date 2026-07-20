"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "./server";
import { ensureSession } from "./session";

export async function startAnonymousSession() {
  const supabase = await createClient();
  await ensureSession(supabase);
  revalidatePath("/");
}

export type LoginState = {
  status: "idle" | "error";
  errorKey?: "invalidCredentials";
};

// Anonymous sessions are device-bound by design, but once a user has linked
// an email + password (see profile/actions.ts), they need a way back into
// that same account from a different device — this is that other half.
export async function login(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = formData.get("email");
  const password = formData.get("password");

  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return { status: "error", errorKey: "invalidCredentials" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    return { status: "error", errorKey: "invalidCredentials" };
  }

  revalidatePath("/", "layout");
  redirect("/campaigns");
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
