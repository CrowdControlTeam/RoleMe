"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DiceRoller, type DiceRollResult } from "@/components/dice/dice-roller";

// One popover per stat field. Rolling here never touches the DB (unlike the
// session dice tool) — it just writes the total into that specific field's
// (still unsaved) input. A future version may swap this popup for a
// full-screen dice-roll animation without changing how the result gets
// applied.
export function StatDicePopover({ fieldId }: { fieldId: string }) {
  const t = useTranslations("Dice");
  const [open, setOpen] = useState(false);

  function applyRoll(result: DiceRollResult) {
    const input = document.getElementById(
      `value_${fieldId}`,
    ) as HTMLInputElement | null;
    if (input) {
      input.value = String(result.total);
    }
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title={t("quickRollTitle")}
        className="rounded-md border border-zinc-300 px-2 py-1.5 text-sm dark:border-zinc-700"
      >
        🎲
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-label="close"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div className="absolute right-0 z-20 mt-2 w-72 rounded-md border border-zinc-200 bg-white p-3 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <DiceRoller defaultFaces={6} defaultQuantity={3} onRoll={applyRoll} />
          </div>
        </>
      )}
    </div>
  );
}
