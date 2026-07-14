import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  joinSession,
  leaveSession,
  setReady,
  finishSession,
} from "@/lib/sessions/actions";
import { SelectSheetAndReadyForm } from "@/components/sessions/select-sheet-and-ready-form";
import { SessionHeartbeat } from "@/components/sessions/session-heartbeat";
import { TurnOrder } from "@/components/sessions/turn-order";
import { SessionDiceRoller } from "@/components/dice/session-dice-roller";
import { BackLink } from "@/components/layout/back-link";

export default async function SessionLobbyPage({
  params,
}: {
  params: Promise<{ id: string; adventureId: string; sessionId: string }>;
}) {
  const { id: campaignId, adventureId, sessionId } = await params;
  const t = await getTranslations("Sessions");
  const tDice = await getTranslations("Dice");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let { data: session } = await supabase
    .from("sessions")
    .select("id, status, created_by, turn_order, adventures(name, required_players)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    notFound();
  }

  if (session.status === "active") {
    // Lazily close the session if every participant has gone quiet for a
    // while — see close_if_abandoned_session for why this can't just be
    // true Realtime Presence.
    await supabase.rpc("close_if_abandoned_session", {
      p_session_id: sessionId,
      p_grace_seconds: 120,
    });

    const { data: refreshed } = await supabase
      .from("sessions")
      .select("id, status, created_by, turn_order, adventures(name, required_players)")
      .eq("id", sessionId)
      .maybeSingle();
    if (refreshed) {
      session = refreshed;
    }
  }

  const { data: participantsData } = await supabase
    .from("session_participants")
    .select("user_id, sheet_id, ready, sheets(name, type)")
    .eq("session_id", sessionId)
    .order("joined_at", { ascending: true });
  const participants = participantsData ?? [];

  const { data: membersData } = await supabase.rpc("get_campaign_members", {
    p_campaign_id: campaignId,
  });
  const nameByUserId = new Map(
    (membersData ?? []).map((m) => [m.user_id, m.display_name]),
  );

  const me = participants.find((p) => p.user_id === user?.id);
  const isCreator = user?.id === session.created_by;

  const requiredPlayers = session.adventures?.required_players ?? 0;
  const readyCount = participants.filter((p) => p.ready && p.sheet_id).length;
  const masterReadyCount = participants.filter(
    (p) => p.ready && p.sheets?.type === "master",
  ).length;
  const allReady =
    participants.length === requiredPlayers && readyCount === requiredPlayers;
  const masterMismatch = allReady && masterReadyCount !== 1;

  let myOwnSheets: { id: string; name: string; type: string }[] = [];
  if (user && me && !me.ready) {
    const { data } = await supabase
      .from("sheets")
      .select("id, name, type")
      .eq("campaign_id", campaignId)
      .eq("owner_id", user.id);
    myOwnSheets = data ?? [];
  }

  let isMaster = false;
  let rolls: {
    id: string;
    user_id: string;
    faces: number;
    quantity: number;
    modifier: number;
    results: unknown;
    total: number;
    is_private: boolean;
    created_at: string;
  }[] = [];

  if (session.status === "active" && me) {
    const { data: masterCheck } = await supabase.rpc("is_session_master", {
      p_session_id: sessionId,
      p_user_id: user!.id,
    });
    isMaster = masterCheck ?? false;

    const { data: rollsData } = await supabase
      .from("dice_rolls")
      .select(
        "id, user_id, faces, quantity, modifier, results, total, is_private, created_at",
      )
      .eq("session_id", sessionId)
      .order("created_at", { ascending: false });
    rolls = rollsData ?? [];
  }

  const lobbyPath = `/campaigns/${campaignId}/adventures/${adventureId}/sessions/${sessionId}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <BackLink
        href={`/campaigns/${campaignId}/adventures/${adventureId}`}
        label={session.adventures?.name ?? ""}
      />
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {session.adventures?.name}
      </h1>

      {session.status === "finished" ? (
        <p className="text-sm text-zinc-500">{t("sessionFinished")}</p>
      ) : (
        <>
          <p className="text-sm text-zinc-500">
            {t(session.status === "active" ? "statusActive" : "statusPreparing")}
          </p>
          <p className="text-sm text-zinc-500">
            {t("participantsCount", {
              count: participants.length,
              required: requiredPlayers,
            })}
          </p>

          {masterMismatch && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("masterMismatch", { count: masterReadyCount })}
            </p>
          )}

          <ul className="flex flex-col gap-2">
            {participants.map((p) => (
              <li
                key={p.user_id}
                className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 text-sm dark:border-zinc-800"
              >
                <span className="text-zinc-900 dark:text-zinc-50">
                  {nameByUserId.get(p.user_id) ?? p.user_id}
                  {p.user_id === user?.id && (
                    <span className="ml-2 text-xs text-zinc-500">
                      {t("youBadge")}
                    </span>
                  )}
                </span>
                <span className="text-xs text-zinc-500">
                  {p.sheets ? p.sheets.name : t("noSheetYet")}
                  {" — "}
                  {p.ready ? t("readyBadge") : t("notReadyBadge")}
                </span>
              </li>
            ))}
          </ul>

          {session.status === "preparing" && (
            <>
              {!me ? (
                <form
                  action={joinSession.bind(
                    null,
                    sessionId,
                    campaignId,
                    adventureId,
                  )}
                >
                  <button
                    type="submit"
                    className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
                  >
                    {t("joinButton")}
                  </button>
                </form>
              ) : (
                <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
                  {!me.ready ? (
                    <>
                      <SelectSheetAndReadyForm
                        sessionId={sessionId}
                        campaignId={campaignId}
                        adventureId={adventureId}
                        sheets={myOwnSheets}
                        currentSheetId={me.sheet_id}
                      />
                      <a
                        href={`/campaigns/${campaignId}/sheets?returnTo=${encodeURIComponent(lobbyPath)}`}
                        className="w-fit text-sm text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
                      >
                        {t("createNewSheetLink")}
                      </a>
                      <form
                        action={leaveSession.bind(
                          null,
                          sessionId,
                          campaignId,
                          adventureId,
                        )}
                      >
                        <button
                          type="submit"
                          className="w-fit text-sm text-red-600 dark:text-red-400"
                        >
                          {t("leaveButton")}
                        </button>
                      </form>
                    </>
                  ) : (
                    <form
                      action={setReady.bind(
                        null,
                        sessionId,
                        campaignId,
                        adventureId,
                        false,
                      )}
                    >
                      <button
                        type="submit"
                        className="w-fit rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
                      >
                        {t("cancelReadyButton")}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </>
          )}

          {session.status === "active" && me && (
            <SessionHeartbeat sessionId={sessionId} />
          )}

          {session.status === "active" && session.turn_order.length > 0 && (
            <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {t("turnOrderTitle")}
              </h2>
              <TurnOrder
                sessionId={sessionId}
                campaignId={campaignId}
                adventureId={adventureId}
                isMaster={isMaster}
                order={session.turn_order.map((userId) => ({
                  userId,
                  displayName: nameByUserId.get(userId) ?? userId,
                }))}
              />
            </section>
          )}

          {session.status === "active" && me && (
            <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
              <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
                {tDice("title")}
              </h2>
              <SessionDiceRoller
                sessionId={sessionId}
                campaignId={campaignId}
                adventureId={adventureId}
                isMaster={isMaster}
              />
              {rolls.length === 0 ? (
                <p className="text-sm text-zinc-500">{tDice("noRolls")}</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {rolls.map((roll) => {
                    const notation = `${roll.quantity}d${roll.faces}${
                      roll.modifier > 0
                        ? `+${roll.modifier}`
                        : roll.modifier < 0
                          ? roll.modifier
                          : ""
                    }`;
                    return (
                      <li
                        key={roll.id}
                        className="flex items-center justify-between text-sm text-zinc-700 dark:text-zinc-300"
                      >
                        <span>
                          {nameByUserId.get(roll.user_id) ?? roll.user_id}
                          {" — "}
                          {tDice("rollSummary", {
                            notation,
                            results: JSON.stringify(roll.results).slice(1, -1),
                            total: roll.total,
                          })}
                        </span>
                        {roll.is_private && (
                          <span className="text-xs text-amber-600 dark:text-amber-400">
                            {tDice("privateBadge")}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          )}

          {isCreator && (
            <form
              action={finishSession.bind(
                null,
                sessionId,
                campaignId,
                adventureId,
              )}
            >
              <button
                type="submit"
                className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
              >
                {t("finishSessionButton")}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
