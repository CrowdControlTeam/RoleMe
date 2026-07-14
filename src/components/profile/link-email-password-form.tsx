"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  linkEmailWithPassword,
  type LinkEmailPasswordState,
} from "@/lib/profile/actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/profile/password-policy";

const initialState: LinkEmailPasswordState = { status: "idle" };

const errorKeyToTranslationKey: Record<
  NonNullable<LinkEmailPasswordState["errorKey"]>,
  string
> = {
  invalidEmail: "invalidEmail",
  emailMismatch: "emailMismatch",
  invalidPassword: "invalidPassword",
  passwordMismatch: "passwordMismatch",
  generic: "generic",
};

export function LinkEmailPasswordForm() {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState(
    linkEmailWithPassword,
    initialState,
  );

  if (state.status === "success") {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        {t("linkSuccess")}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("linkEmailDescription")}
      </p>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("emailLabel")}
        <input
          type="email"
          name="email"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("confirmEmailLabel")}
        <input
          type="email"
          name="confirmEmail"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("passwordLabel")}
        <input
          type="password"
          name="password"
          required
          minLength={PASSWORD_MIN_LENGTH}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("confirmPasswordLabel")}
        <input
          type="password"
          name="confirmPassword"
          required
          minLength={PASSWORD_MIN_LENGTH}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <p className="text-xs text-zinc-500">{t("passwordRequirementsHint")}</p>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("linking") : t("linkButton")}
      </button>
      {state.status === "error" && state.errorKey && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(errorKeyToTranslationKey[state.errorKey])}
        </p>
      )}
    </form>
  );
}
