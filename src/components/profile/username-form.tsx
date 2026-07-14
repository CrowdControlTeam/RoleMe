"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { updateUsername, type UsernameState } from "@/lib/profile/actions";

const initialState: UsernameState = { status: "idle" };

export function UsernameForm({
  currentUsername,
}: {
  currentUsername: string;
}) {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState(
    updateUsername,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("usernameLabel")}
        <input
          type="text"
          name="username"
          defaultValue={currentUsername}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("saving") : t("saveButton")}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("usernameSaved")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey === "invalidUsername" ? "invalidUsername" : "generic")}
        </p>
      )}
    </form>
  );
}
