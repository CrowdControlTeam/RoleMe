"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { rollDice } from "@/lib/dice/roll";

const PRESETS = [4, 6, 8, 10, 12, 20, 100];

export type DiceRollResult = {
  faces: number;
  quantity: number;
  modifier: number;
  results: number[];
  total: number;
};

// Fully decoupled: no session, no sheet, no DB — just the roll UI. The
// caller gets the result via onRoll and decides what to do with it (log it
// against a session, drop it into a sheet field, ignore it entirely...).
export function DiceRoller({
  onRoll,
  defaultFaces = 20,
  defaultQuantity = 1,
  defaultModifier = 0,
  extraControls,
}: {
  onRoll?: (result: DiceRollResult) => void | Promise<void>;
  defaultFaces?: number;
  defaultQuantity?: number;
  defaultModifier?: number;
  extraControls?: React.ReactNode;
}) {
  const t = useTranslations("Dice");
  const [faces, setFaces] = useState(defaultFaces);
  const [quantity, setQuantity] = useState(defaultQuantity);
  const [modifier, setModifier] = useState(defaultModifier);
  const [lastResult, setLastResult] = useState<DiceRollResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState(false);

  async function handleRoll() {
    const results = rollDice(faces, quantity);
    const total = results.reduce((sum, r) => sum + r, 0) + modifier;
    const result: DiceRollResult = { faces, quantity, modifier, results, total };
    setLastResult(result);
    setError(false);

    if (onRoll) {
      setPending(true);
      try {
        await onRoll(result);
      } catch {
        setError(true);
      } finally {
        setPending(false);
      }
    }
  }

  const notation = `${quantity}d${faces}${
    modifier > 0 ? `+${modifier}` : modifier < 0 ? modifier : ""
  }`;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setFaces(preset)}
            className={`rounded-md border px-3 py-1.5 text-sm font-medium ${
              faces === preset
                ? "border-zinc-900 bg-zinc-900 text-zinc-50 dark:border-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                : "border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            }`}
          >
            d{preset}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap items-end gap-3">
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t("facesLabel")}
          <input
            type="number"
            min={2}
            value={faces}
            onChange={(e) => setFaces(Number(e.target.value))}
            className="w-24 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t("quantityLabel")}
          <input
            type="number"
            min={1}
            max={100}
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
          {t("modifierLabel")}
          <input
            type="number"
            min={-1000}
            max={1000}
            value={modifier}
            onChange={(e) => setModifier(Number(e.target.value))}
            className="w-20 rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </label>
        {extraControls}
        <button
          type="button"
          onClick={handleRoll}
          disabled={pending || faces < 2 || quantity < 1 || quantity > 100}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? t("rolling") : t("rollButton")}
        </button>
      </div>
      {lastResult && (
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {t("rollSummary", {
            notation,
            results: lastResult.results.join(", "),
            total: lastResult.total,
          })}
        </p>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t("generic")}
        </p>
      )}
    </div>
  );
}
