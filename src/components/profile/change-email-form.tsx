"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { changeEmail, type ChangeEmailState } from "@/lib/profile/actions";

const initialState: ChangeEmailState = { status: "idle" };

export function ChangeEmailForm({ currentEmail }: { currentEmail: string }) {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState(
    changeEmail,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-sm text-zinc-500">
        {t("currentEmailLabel")}: {currentEmail}
      </p>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("emailLabel")}
        <input
          type="email"
          name="email"
          required
          defaultValue={currentEmail}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("changingEmail") : t("changeEmailButton")}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("changeEmailSuccess")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey === "invalidEmail" ? "invalidEmail" : "generic")}
        </p>
      )}
    </form>
  );
}
