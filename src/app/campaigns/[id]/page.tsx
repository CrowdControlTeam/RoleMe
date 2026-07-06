import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { regenerateInviteCode } from "@/lib/campaigns/actions";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Campaigns");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("id, name, max_players, creator_id, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!campaign) {
    notFound();
  }

  const { count: memberCount } = await supabase
    .from("campaign_members")
    .select("*", { count: "exact", head: true })
    .eq("campaign_id", id);

  const isCreator = user?.id === campaign.creator_id;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const joinLink = host
    ? `${protocol}://${host}/join/${campaign.invite_code}`
    : `/join/${campaign.invite_code}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {campaign.name}
      </h1>
      <p className="text-sm text-zinc-500">
        {t("membersCount", {
          count: memberCount ?? 0,
          max: campaign.max_players,
        })}
      </p>

      {isCreator && (
        <section className="flex flex-col gap-2 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("inviteTitle")}
          </h2>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {t("inviteDescription")}
          </p>
          <code className="w-fit rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
            {campaign.invite_code}
          </code>
          <code className="w-fit rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
            {joinLink}
          </code>
          <form action={regenerateInviteCode.bind(null, campaign.id)}>
            <button
              type="submit"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              {t("regenerateButton")}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
