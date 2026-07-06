"use client";

import { useActionState, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import {
  importSheetJson,
  type ImportSheetState,
} from "@/lib/sheets/actions";

const initialState: ImportSheetState = { status: "idle" };

export function ImportSheetForm({
  sheetId,
  campaignId,
}: {
  sheetId: string;
  campaignId: string;
}) {
  const t = useTranslations("Sheets");
  const [state, formAction, pending] = useActionState(
    importSheetJson.bind(null, sheetId, campaignId),
    initialState,
  );
  const [json, setJson] = useState("");

  function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setJson(String(reader.result ?? ""));
    reader.readAsText(file);
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input
        type="file"
        accept="application/json"
        onChange={handleFile}
        className="text-sm text-zinc-700 dark:text-zinc-300"
      />
      <textarea
        name="json"
        value={json}
        onChange={(e) => setJson(e.target.value)}
        required
        rows={4}
        placeholder={t("importPlaceholder")}
        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
      />
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
      >
        {pending ? t("importing") : t("importButton")}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("importSuccess")}
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
