import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CreateSheetForm } from "@/components/sheets/create-sheet-form";
import { BackLink } from "@/components/layout/back-link";
import { sanitizeReturnTo } from "@/lib/safe-return-to";

export default async function SheetsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ returnTo?: string }>;
}) {
  const { id: campaignId } = await params;
  const returnTo = sanitizeReturnTo((await searchParams).returnTo);
  const t = await getTranslations("Sheets");
  const tSessions = await getTranslations("Sessions");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campaign } = await supabase
    .from("campaigns")
    .select("name")
    .eq("id", campaignId)
    .maybeSingle();

  const { data } = user
    ? await supabase
        .from("sheets")
        .select("id, name, type")
        .eq("campaign_id", campaignId)
        .eq("owner_id", user.id)
        .order("created_at", { ascending: false })
    : { data: null };
  const sheets = data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <BackLink
        href={returnTo || `/campaigns/${campaignId}`}
        label={returnTo ? tSessions("backToLobby") : (campaign?.name ?? "")}
      />
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("yourSheetsTitle")}
        </h2>
        {sheets.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noSheets")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {sheets.map((sheet) => (
              <li key={sheet.id}>
                <Link
                  href={`/campaigns/${campaignId}/sheets/${sheet.id}`}
                  className="flex items-center justify-between rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {sheet.name}
                  </span>
                  <span className="text-xs text-zinc-500">
                    {t(sheet.type === "character" ? "typeCharacter" : "typeMaster")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("createTitle")}
        </h2>
        <CreateSheetForm campaignId={campaignId} returnTo={returnTo} />
      </section>
    </div>
  );
}
