import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { deleteSheet } from "@/lib/sheets/actions";
import {
  SheetFieldsForm,
  type SheetFieldGroup,
} from "@/components/sheets/sheet-fields-form";
import { ImportSheetForm } from "@/components/sheets/import-sheet-form";

const GROUP_ORDER = ["stats", "character_info", "character_state"] as const;
const GROUP_TITLE_KEY: Record<(typeof GROUP_ORDER)[number], string> = {
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

  const { data: sheet } = await supabase
    .from("sheets")
    .select("id, name, type, campaigns(game)")
    .eq("id", sheetId)
    .maybeSingle();

  if (!sheet) {
    notFound();
  }

  let groups: SheetFieldGroup[] = [];

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

    groups = GROUP_ORDER.map((group) => ({
      group,
      titleKey: GROUP_TITLE_KEY[group],
      fields: (gameFields ?? [])
        .filter((f) => f.group === group)
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
    }));
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
      ) : (
        <>
          <SheetFieldsForm
            sheetId={sheet.id}
            campaignId={campaignId}
            groups={groups}
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
      )}

      <form action={deleteSheet.bind(null, campaignId, sheet.id)}>
        <button
          type="submit"
          className="w-fit rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-600 dark:border-red-800 dark:text-red-400"
        >
          {t("deleteButton")}
        </button>
      </form>
    </div>
  );
}
