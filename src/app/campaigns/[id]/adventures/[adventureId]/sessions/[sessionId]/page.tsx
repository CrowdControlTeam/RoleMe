import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  joinSession,
  leaveSession,
  setReady,
  finishSession,
} from "@/lib/sessions/actions";
import { SelectSheetForm } from "@/components/sessions/select-sheet-form";

export default async function SessionLobbyPage({
  params,
}: {
  params: Promise<{ id: string; adventureId: string; sessionId: string }>;
}) {
  const { id: campaignId, adventureId, sessionId } = await params;
  const t = await getTranslations("Sessions");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: session } = await supabase
    .from("sessions")
    .select("id, status, created_by, adventures(name, required_players)")
    .eq("id", sessionId)
    .maybeSingle();

  if (!session) {
    notFound();
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

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
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
                      <SelectSheetForm
                        sessionId={sessionId}
                        campaignId={campaignId}
                        adventureId={adventureId}
                        sheets={myOwnSheets}
                        currentSheetId={me.sheet_id}
                      />
                      <a
                        href={`/campaigns/${campaignId}/sheets`}
                        className="w-fit text-sm text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
                      >
                        {t("createNewSheetLink")}
                      </a>
                      <form
                        action={setReady.bind(
                          null,
                          sessionId,
                          campaignId,
                          adventureId,
                          true,
                        )}
                      >
                        <button
                          type="submit"
                          disabled={!me.sheet_id}
                          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
                        >
                          {t("readyButton")}
                        </button>
                      </form>
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
