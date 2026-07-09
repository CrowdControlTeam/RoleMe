"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DiceRoller, type DiceRollResult } from "./dice-roller";
import { logDiceRoll } from "@/lib/dice/actions";

export function SessionDiceRoller({
  sessionId,
  campaignId,
  adventureId,
  isMaster,
}: {
  sessionId: string;
  campaignId: string;
  adventureId: string;
  isMaster: boolean;
}) {
  const t = useTranslations("Dice");
  const [isPrivate, setIsPrivate] = useState(false);

  async function handleRoll(result: DiceRollResult) {
    await logDiceRoll(sessionId, campaignId, adventureId, result, isPrivate);
  }

  return (
    <DiceRoller
      onRoll={handleRoll}
      extraControls={
        isMaster ? (
          <label className="flex items-center gap-1 pb-1.5 text-xs text-zinc-500">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            {t("privateLabel")}
          </label>
        ) : undefined
      }
    />
  );
}
