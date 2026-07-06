"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { AdventureFormState } from "@/lib/adventures/actions";

const initialState: AdventureFormState = { status: "idle" };

export function AdventureForm({
  action,
  maxPlayersLimit,
  defaultValues,
  submitLabel,
  pendingLabel,
}: {
  action: (
    prevState: AdventureFormState,
    formData: FormData,
  ) => Promise<AdventureFormState>;
  maxPlayersLimit: number;
  defaultValues?: {
    name: string;
    description: string | null;
    requiredPlayers: number;
  };
  submitLabel: string;
  pendingLabel: string;
}) {
  const t = useTranslations("Adventures");
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("nameLabel")}
        <input
          type="text"
          name="name"
          required
          defaultValue={defaultValues?.name}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("descriptionLabel")}
        <textarea
          name="description"
          rows={3}
          defaultValue={defaultValues?.description ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("requiredPlayersLabel")}
        <input
          type="number"
          name="requiredPlayers"
          min={1}
          max={maxPlayersLimit}
          defaultValue={defaultValues?.requiredPlayers ?? maxPlayersLimit}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? pendingLabel : submitLabel}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("saveSuccess")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
