"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createSheet, type CreateSheetState } from "@/lib/sheets/actions";

const initialState: CreateSheetState = { status: "idle" };

export function CreateSheetForm({ campaignId }: { campaignId: string }) {
  const t = useTranslations("Sheets");
  const [state, formAction, pending] = useActionState(
    createSheet.bind(null, campaignId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("nameLabel")}
        <input
          type="text"
          name="name"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("typeLabel")}
        <select
          name="type"
          required
          defaultValue="character"
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="character">{t("typeCharacter")}</option>
          <option value="master">{t("typeMaster")}</option>
        </select>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("creating") : t("createButton")}
      </button>
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
