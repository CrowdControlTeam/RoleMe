import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdventure } from "@/lib/adventures/actions";
import { AdventureForm } from "@/components/adventures/adventure-form";

export default async function AdventuresPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: campaignId } = await params;
  const t = await getTranslations("Adventures");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("creator_id, max_players")
    .eq("id", campaignId)
    .maybeSingle();

  const isCreator = user?.id === campaign?.creator_id;

  const { data: adventuresData } = await supabase
    .from("adventures")
    .select("id, name")
    .eq("campaign_id", campaignId)
    .order("created_at", { ascending: false });
  const adventures = adventuresData ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("listTitle")}
        </h2>
        {adventures.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noAdventures")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {adventures.map((adventure) => (
              <li key={adventure.id}>
                <Link
                  href={`/campaigns/${campaignId}/adventures/${adventure.id}`}
                  className="block rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {adventure.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {isCreator && campaign && (
        <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("createTitle")}
          </h2>
          <AdventureForm
            action={createAdventure.bind(null, campaignId)}
            maxPlayersLimit={campaign.max_players}
            submitLabel={t("createButton")}
            pendingLabel={t("creating")}
          />
        </section>
      )}
    </div>
  );
}
