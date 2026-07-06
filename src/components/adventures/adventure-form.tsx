"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { AdventureFormState } from "@/lib/adventures/actions";

export type MasterCandidate = { userId: string; displayName: string };

const initialState: AdventureFormState = { status: "idle" };

export function AdventureForm({
  action,
  masters,
  maxPlayersLimit,
  defaultValues,
  submitLabel,
  pendingLabel,
}: {
  action: (
    prevState: AdventureFormState,
    formData: FormData,
  ) => Promise<AdventureFormState>;
  masters: MasterCandidate[];
  maxPlayersLimit: number;
  defaultValues?: {
    name: string;
    description: string | null;
    maxPlayers: number;
    masterUserId: string;
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
        {t("maxPlayersLabel")}
        <input
          type="number"
          name="maxPlayers"
          min={1}
          max={maxPlayersLimit}
          defaultValue={defaultValues?.maxPlayers ?? maxPlayersLimit}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("masterLabel")}
        <select
          name="masterUserId"
          required
          defaultValue={defaultValues?.masterUserId ?? ""}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          <option value="" disabled>
            {t("selectMaster")}
          </option>
          {masters.map((master) => (
            <option key={master.userId} value={master.userId}>
              {master.displayName}
            </option>
          ))}
        </select>
      </label>
      {masters.length === 0 && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t("noMasterCandidates")}
        </p>
      )}
      <button
        type="submit"
        disabled={pending || masters.length === 0}
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
