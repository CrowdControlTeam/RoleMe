import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import {
  deleteSheet,
  isSheetLocked,
  updateSheetStatsInfo,
  updateSheetState,
} from "@/lib/sheets/actions";
import {
  SheetFieldsForm,
  type SheetFieldGroup,
} from "@/components/sheets/sheet-fields-form";
import { ReadOnlySheetFields } from "@/components/sheets/read-only-sheet-fields";
import { ImportSheetForm } from "@/components/sheets/import-sheet-form";

const STATS_INFO_GROUPS = ["stats", "character_info"] as const;
const GROUP_TITLE_KEY: Record<string, string> = {
  stats: "statsTitle",
  character_info: "characterInfoTitle",
  character_state: "characterStateTitle",
};

export default async function SheetDetailPage({
  params,
}: {
  params: Promise<{ id: string; sheetId: string }>;
}) {
  const { id: campaignId, sheetId } = await params;
  const t = await getTranslations("Sheets");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: sheet } = await supabase
    .from("sheets")
    .select("id, name, type, owner_id, campaigns(game)")
    .eq("id", sheetId)
    .maybeSingle();

  if (!sheet) {
    notFound();
  }

  const isOwner = user?.id === sheet.owner_id;

  let statsInfoGroups: SheetFieldGroup[] = [];
  let stateGroups: SheetFieldGroup[] = [];
  let locked = false;

  if (sheet.type === "character") {
    const gameId = sheet.campaigns?.game ?? "";

    const { data: gameFields } = await supabase
      .from("game_fields")
      .select("id, group, label, type, sort_order")
      .eq("game_id", gameId)
      .order("sort_order");

    const { data: values } = await supabase
      .from("sheet_field_values")
      .select("game_field_id, value, visible_on_card")
      .eq("sheet_id", sheetId);

    const valueByFieldId = new Map(
      (values ?? []).map((v) => [v.game_field_id, v]),
    );

    const buildGroup = (group: string): SheetFieldGroup => ({
      group,
      titleKey: GROUP_TITLE_KEY[group],
      fields: (gameFields ?? [])
        .filter((f) => f.group === group)
        // Non-owners only ever get rows RLS lets them see (all fields for a
        // master, only visible_on_card ones for everyone else) — so a field
        // with no matching row here just isn't rendered for them.
        .filter((f) => isOwner || valueByFieldId.has(f.id))
        .map((f) => {
          const v = valueByFieldId.get(f.id);
          return {
            id: f.id,
            label: f.label,
            type: f.type,
            value: v?.value ?? null,
            visibleOnCard: v?.visible_on_card ?? true,
          };
        }),
    });

    statsInfoGroups = STATS_INFO_GROUPS.map(buildGroup);
    stateGroups = [buildGroup("character_state")];

    if (isOwner) {
      locked = await isSheetLocked(supabase, sheetId);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          {sheet.name}
        </h1>
        <span className="text-xs text-zinc-500">
          {t(sheet.type === "character" ? "typeCharacter" : "typeMaster")}
        </span>
      </div>

      {sheet.type === "master" ? (
        <p className="text-sm text-zinc-500">{t("masterSheetPlaceholder")}</p>
      ) : isOwner ? (
        <>
          {locked && (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {t("locked")}
            </p>
          )}
          {locked ? (
            <ReadOnlySheetFields groups={statsInfoGroups} />
          ) : (
            <SheetFieldsForm
              action={updateSheetStatsInfo.bind(null, sheet.id, campaignId)}
              groups={statsInfoGroups}
            />
          )}

          <SheetFieldsForm
            action={updateSheetState.bind(null, sheet.id, campaignId)}
            groups={stateGroups}
          />

          <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {t("exportImportTitle")}
            </h2>
            <a
              href={`/campaigns/${campaignId}/sheets/${sheet.id}/export`}
              className="w-fit text-sm font-medium text-zinc-900 underline underline-offset-4 dark:text-zinc-50"
            >
              {t("exportButton")}
            </a>
            <ImportSheetForm sheetId={sheet.id} campaignId={campaignId} />
          </section>
        </>
      ) : (
        <ReadOnlySheetFields groups={[...statsInfoGroups, ...stateGroups]} />
      )}

      {isOwner && (
        <form action={deleteSheet.bind(null, campaignId, sheet.id)}>
          <button
            type="submit"
            className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
          >
            {t("deleteButton")}
          </button>
        </form>
      )}
    </div>
  );
}
