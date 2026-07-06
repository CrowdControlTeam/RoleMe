"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { linkEmail, type LinkEmailState } from "@/lib/supabase/actions";

const initialState: LinkEmailState = { status: "idle" };

export function LinkEmailForm() {
  const t = useTranslations("Auth");
  const [state, formAction, pending] = useActionState(linkEmail, initialState);

  if (state.status === "success") {
    return (
      <p className="text-sm text-emerald-600 dark:text-emerald-400">
        {t("linkSuccess")}
      </p>
    );
  }

  return (
    <form action={formAction} className="flex flex-col items-center gap-2">
      <p className="max-w-xs text-sm text-zinc-600 dark:text-zinc-400">
        {t("linkEmailDescription")}
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t("emailPlaceholder")}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? t("linkPending") : t("linkButton")}
        </button>
      </div>
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey === "invalidEmail" ? "invalidEmail" : "linkError")}
        </p>
      )}
    </form>
  );
}
