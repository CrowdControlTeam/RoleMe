"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { selectSheet, type SelectSheetState } from "@/lib/sessions/actions";

const initialState: SelectSheetState = { status: "idle" };

export function SelectSheetForm({
  sessionId,
  campaignId,
  adventureId,
  sheets,
  currentSheetId,
}: {
  sessionId: string;
  campaignId: string;
  adventureId: string;
  sheets: { id: string; name: string; type: string }[];
  currentSheetId: string | null;
}) {
  const t = useTranslations("Sessions");
  const [state, formAction, pending] = useActionState(
    selectSheet.bind(null, sessionId, campaignId, adventureId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="sheetId"
        required
        defaultValue={currentSheetId ?? ""}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      >
        <option value="" disabled>
          {t("selectSheetPlaceholder")}
        </option>
        {sheets.map((sheet) => (
          <option key={sheet.id} value={sheet.id}>
            {sheet.name} ({t(sheet.type === "master" ? "typeMaster" : "typeCharacter")})
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300"
      >
        {pending ? t("selectingSheet") : t("selectSheetButton")}
      </button>
      {state.status === "error" && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
