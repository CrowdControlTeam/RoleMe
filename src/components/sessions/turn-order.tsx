"use client";

import { updateTurnOrder } from "@/lib/sessions/actions";

export function TurnOrder({
  sessionId,
  campaignId,
  adventureId,
  order,
  isMaster,
}: {
  sessionId: string;
  campaignId: string;
  adventureId: string;
  order: { userId: string; displayName: string }[];
  isMaster: boolean;
}) {
  function move(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= order.length) return;

    const newOrder = order.map((entry) => entry.userId);
    [newOrder[index], newOrder[targetIndex]] = [
      newOrder[targetIndex],
      newOrder[index],
    ];
    updateTurnOrder(sessionId, campaignId, adventureId, newOrder);
  }

  return (
    <ol className="flex flex-col gap-1">
      {order.map((entry, index) => (
        <li
          key={entry.userId}
          className="flex items-center justify-between rounded-md border border-zinc-200 px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
        >
          <span>
            {index + 1}. {entry.displayName}
          </span>
          {isMaster && (
            <span className="flex gap-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                className="rounded border border-zinc-300 px-1.5 disabled:opacity-30 dark:border-zinc-700"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === order.length - 1}
                className="rounded border border-zinc-300 px-1.5 disabled:opacity-30 dark:border-zinc-700"
              >
                ↓
              </button>
            </span>
          )}
        </li>
      ))}
    </ol>
  );
}
