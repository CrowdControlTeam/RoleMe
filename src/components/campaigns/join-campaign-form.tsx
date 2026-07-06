"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import {
  joinCampaign,
  type JoinCampaignState,
} from "@/lib/campaigns/actions";

const initialState: JoinCampaignState = { status: "idle" };

export function JoinCampaignForm({ defaultCode }: { defaultCode?: string }) {
  const t = useTranslations("Campaigns");
  const [state, formAction, pending] = useActionState(
    joinCampaign,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("codeLabel")}
        <input
          type="text"
          name="code"
          required
          defaultValue={defaultCode}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm uppercase text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("joining") : t("joinButton")}
      </button>
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
