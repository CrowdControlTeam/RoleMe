import { notFound } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
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

  const { data: membersData } = await supabase.rpc("get_campaign_members", {
    p_campaign_id: id,
  });
  const members = membersData ?? [];

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
          count: members.length,
          max: campaign.max_players,
        })}
      </p>

      <div className="flex flex-wrap gap-3">
        <Link
          href={`/campaigns/${campaign.id}/sheets`}
          className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {t("goToMySheets")}
        </Link>
        <Link
          href={`/campaigns/${campaign.id}/adventures`}
          className="w-fit rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
        >
          {t("goToAdventures")}
        </Link>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("membersTitle")}
        </h2>
        <ul className="flex flex-col gap-1">
          {members.map((member) => (
            <li
              key={member.user_id}
              className="rounded-md border border-zinc-200 px-4 py-2 text-sm text-zinc-900 dark:border-zinc-800 dark:text-zinc-50"
            >
              {member.display_name}
              {member.user_id === user?.id && (
                <span className="ml-2 text-xs font-normal text-zinc-500">
                  {t("youBadge")}
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

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
