import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updateAdventure, deleteAdventure } from "@/lib/adventures/actions";
import { startSession } from "@/lib/sessions/actions";
import { AdventureForm } from "@/components/adventures/adventure-form";

export default async function AdventureDetailPage({
  params,
}: {
  params: Promise<{ id: string; adventureId: string }>;
}) {
  const { id: campaignId, adventureId } = await params;
  const t = await getTranslations("Adventures");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: adventure } = await supabase
    .from("adventures")
    .select("id, name, description, required_players, campaigns(creator_id, max_players)")
    .eq("id", adventureId)
    .maybeSingle();

  if (!adventure) {
    notFound();
  }

  const isCreator = user?.id === adventure.campaigns?.creator_id;

  const { data: openSession } = await supabase
    .from("sessions")
    .select("id, status")
    .eq("adventure_id", adventureId)
    .in("status", ["preparing", "active"])
    .maybeSingle();

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {adventure.name}
      </h1>
      {adventure.description && (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {adventure.description}
        </p>
      )}
      <p className="text-sm text-zinc-500">
        {t("requiredPlayersDisplay", { count: adventure.required_players })}
      </p>

      {openSession ? (
        <Link
          href={`/campaigns/${campaignId}/adventures/${adventureId}/sessions/${openSession.id}`}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {openSession.status === "preparing" ? t("goToLobby") : t("goToSession")}
        </Link>
      ) : (
        <form action={startSession.bind(null, adventureId, campaignId)}>
          <button
            type="submit"
            className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
          >
            {t("startSession")}
          </button>
        </form>
      )}

      {isCreator && adventure.campaigns && (
        <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("editTitle")}
          </h2>
          <AdventureForm
            action={updateAdventure.bind(null, adventure.id, campaignId)}
            maxPlayersLimit={adventure.campaigns.max_players}
            defaultValues={{
              name: adventure.name,
              description: adventure.description,
              requiredPlayers: adventure.required_players,
            }}
            submitLabel={t("saveButton")}
            pendingLabel={t("saving")}
          />

          <form action={deleteAdventure.bind(null, campaignId, adventure.id)}>
            <button
              type="submit"
              className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
            >
              {t("deleteButton")}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
