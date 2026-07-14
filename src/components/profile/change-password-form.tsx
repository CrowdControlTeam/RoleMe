"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  changePassword,
  type ChangePasswordState,
} from "@/lib/profile/actions";
import { PASSWORD_MIN_LENGTH } from "@/lib/profile/password-policy";

const initialState: ChangePasswordState = { status: "idle" };

export function ChangePasswordForm() {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState(
    changePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
        {t("changePasswordTitle")}
      </h3>
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
        {pending ? t("changingPassword") : t("changePasswordButton")}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("changePasswordSuccess")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(
            state.errorKey === "mismatch"
              ? "passwordMismatch"
              : state.errorKey === "invalidPassword"
                ? "invalidPassword"
                : "generic",
          )}
        </p>
      )}
    </form>
  );
}
