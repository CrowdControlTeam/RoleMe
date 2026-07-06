import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { updateAdventure, deleteAdventure } from "@/lib/adventures/actions";
import { getMasterCandidates } from "@/lib/adventures/master-candidates";
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
    .select("id, name, description, max_players, master_user_id, campaigns(creator_id, max_players)")
    .eq("id", adventureId)
    .maybeSingle();

  if (!adventure) {
    notFound();
  }

  const isCreator = user?.id === adventure.campaigns?.creator_id;

  const { data: membersData } = await supabase.rpc("get_campaign_members", {
    p_campaign_id: campaignId,
  });
  const nameByUserId = new Map(
    (membersData ?? []).map((m) => [m.user_id, m.display_name]),
  );
  const masterName = nameByUserId.get(adventure.master_user_id) ?? adventure.master_user_id;

  const masters = isCreator ? await getMasterCandidates(supabase, campaignId) : [];

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
        {t("masterDisplay", { name: masterName })}
      </p>
      <p className="text-sm text-zinc-500">
        {t("maxPlayersDisplay", { max: adventure.max_players })}
      </p>

      {isCreator && adventure.campaigns && (
        <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("editTitle")}
          </h2>
          <AdventureForm
            action={updateAdventure.bind(null, adventure.id, campaignId)}
            masters={masters}
            maxPlayersLimit={adventure.campaigns.max_players}
            defaultValues={{
              name: adventure.name,
              description: adventure.description,
              maxPlayers: adventure.max_players,
              masterUserId: adventure.master_user_id,
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
