"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isPasswordValid } from "./password-policy";

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export type UsernameState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidUsername" | "generic";
};

export async function updateUsername(
  _prevState: UsernameState,
  formData: FormData,
): Promise<UsernameState> {
  const username = formData.get("username");

  if (typeof username !== "string" || !username.trim()) {
    return { status: "error", errorKey: "invalidUsername" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    data: { username: username.trim() },
  });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/profile");
  return { status: "success" };
}

export type LinkEmailPasswordState = {
  status: "idle" | "success" | "error";
  errorKey?:
    | "invalidEmail"
    | "emailMismatch"
    | "invalidPassword"
    | "passwordMismatch"
    | "generic";
};

export async function linkEmailWithPassword(
  _prevState: LinkEmailPasswordState,
  formData: FormData,
): Promise<LinkEmailPasswordState> {
  const email = formData.get("email");
  const confirmEmail = formData.get("confirmEmail");
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof email !== "string" || !email.trim()) {
    return { status: "error", errorKey: "invalidEmail" };
  }
  if (
    typeof confirmEmail !== "string" ||
    email.trim().toLowerCase() !== confirmEmail.trim().toLowerCase()
  ) {
    return { status: "error", errorKey: "emailMismatch" };
  }
  if (typeof password !== "string" || !isPasswordValid(password)) {
    return { status: "error", errorKey: "invalidPassword" };
  }
  if (password !== confirmPassword) {
    return { status: "error", errorKey: "passwordMismatch" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: email.trim(),
    password,
  });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/profile");
  return { status: "success" };
}

export type ChangeEmailState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidEmail" | "generic";
};

export async function changeEmail(
  _prevState: ChangeEmailState,
  formData: FormData,
): Promise<ChangeEmailState> {
  const email = formData.get("email");

  if (typeof email !== "string" || !email.trim()) {
    return { status: "error", errorKey: "invalidEmail" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ email: email.trim() });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/profile");
  return { status: "success" };
}

export type ChangePasswordState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidPassword" | "mismatch" | "generic";
};

export async function changePassword(
  _prevState: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const password = formData.get("password");
  const confirmPassword = formData.get("confirmPassword");

  if (typeof password !== "string" || !isPasswordValid(password)) {
    return { status: "error", errorKey: "invalidPassword" };
  }
  if (password !== confirmPassword) {
    return { status: "error", errorKey: "mismatch" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/profile");
  return { status: "success" };
}

export type AvatarUploadState = {
  status: "idle" | "success" | "error";
  errorKey?: "invalidFile" | "generic";
};

export async function uploadAvatar(
  _prevState: AvatarUploadState,
  formData: FormData,
): Promise<AvatarUploadState> {
  const file = formData.get("avatar");

  if (!(file instanceof File) || file.size === 0 || !file.type.startsWith("image/")) {
    return { status: "error", errorKey: "invalidFile" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", errorKey: "generic" };
  }

  const path = `${user.id}/avatar`;
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, contentType: file.type });

  if (uploadError) {
    return { status: "error", errorKey: "generic" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { error: updateError } = await supabase.auth.updateUser({
    data: { avatar_url: `${publicUrl}?t=${Date.now()}` },
  });

  if (updateError) {
    return { status: "error", errorKey: "generic" };
  }

  revalidatePath("/profile");
  return { status: "success" };
}
