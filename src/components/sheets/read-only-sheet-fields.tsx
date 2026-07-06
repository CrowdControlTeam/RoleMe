import { getTranslations } from "next-intl/server";
import type { SheetFieldGroup } from "./sheet-fields-form";

export async function ReadOnlySheetFields({
  groups,
}: {
  groups: SheetFieldGroup[];
}) {
  const t = await getTranslations("Sheets");

  return (
    <div className="flex flex-col gap-6">
      {groups
        .filter((group) => group.fields.length > 0)
        .map((group) => (
          <div key={group.group} className="flex flex-col gap-2">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              {t(group.titleKey)}
            </h2>
            <dl className="flex flex-col gap-1">
              {group.fields.map((field) => (
                <div key={field.id} className="flex justify-between gap-3 text-sm">
                  <dt className="text-zinc-500">{field.label}</dt>
                  <dd className="text-zinc-900 dark:text-zinc-50">
                    {field.value || "—"}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
    </div>
  );
}
