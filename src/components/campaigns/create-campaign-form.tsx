"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  createCampaign,
  type CreateCampaignState,
} from "@/lib/campaigns/actions";
import { CAMPAIGN_MAX_PLAYERS_LIMIT } from "@/lib/config";

const initialState: CreateCampaignState = { status: "idle" };

export function CreateCampaignForm({
  games,
}: {
  games: { id: string; name: string }[];
}) {
  const t = useTranslations("Campaigns");
  const [state, formAction, pending] = useActionState(
    createCampaign,
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
        {t("gameLabel")}
        <select
          name="game"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {games.map((game) => (
            <option key={game.id} value={game.id}>
              {game.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("maxPlayersLabel")}
        <input
          type="number"
          name="maxPlayers"
          min={1}
          max={CAMPAIGN_MAX_PLAYERS_LIMIT}
          defaultValue={CAMPAIGN_MAX_PLAYERS_LIMIT}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
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
