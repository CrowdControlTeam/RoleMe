"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import {
  selectSheetAndReady,
  type SelectSheetState,
} from "@/lib/sessions/actions";

const initialState: SelectSheetState = { status: "idle" };

export function SelectSheetAndReadyForm({
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
  const [sheetId, setSheetId] = useState(currentSheetId ?? "");
  const [state, formAction, pending] = useActionState(
    selectSheetAndReady.bind(null, sessionId, campaignId, adventureId),
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <select
        name="sheetId"
        required
        value={sheetId}
        onChange={(e) => setSheetId(e.target.value)}
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
        disabled={pending || !sheetId}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("readying") : t("readyButton")}
      </button>
      {state.status === "error" && (
        <p className="w-full text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
