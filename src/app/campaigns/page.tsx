import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CreateCampaignForm } from "@/components/campaigns/create-campaign-form";
import { JoinCampaignForm } from "@/components/campaigns/join-campaign-form";

export default async function CampaignsPage() {
  const t = await getTranslations("Campaigns");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let campaigns: { id: string; name: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("campaigns")
      .select("id, name")
      .order("created_at", { ascending: false });
    campaigns = data ?? [];
  }

  const { data: gamesData } = await supabase
    .from("games")
    .select("id, name")
    .order("name");
  const games = gamesData ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("yourCampaignsTitle")}
        </h2>
        {campaigns.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noCampaigns")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {campaigns.map((campaign) => (
              <li key={campaign.id}>
                <Link
                  href={`/campaigns/${campaign.id}`}
                  className="block rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {campaign.name}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-6 sm:grid-cols-2">
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("createTitle")}
          </h2>
          <CreateCampaignForm games={games} />
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("joinTitle")}
          </h2>
          <JoinCampaignForm />
        </div>
      </section>
    </div>
  );
}
