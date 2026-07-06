"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import type { UpdateSheetFieldsState } from "@/lib/sheets/actions";

export type SheetFieldGroup = {
  group: string;
  titleKey: string;
  fields: {
    id: string;
    label: string;
    type: string;
    value: string | null;
    visibleOnCard: boolean;
  }[];
};

const initialState: UpdateSheetFieldsState = { status: "idle" };

export function SheetFieldsForm({
  action,
  groups,
}: {
  action: (
    prevState: UpdateSheetFieldsState,
    formData: FormData,
  ) => Promise<UpdateSheetFieldsState>;
  groups: SheetFieldGroup[];
}) {
  const t = useTranslations("Sheets");
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {groups.map((group) => (
        <fieldset key={group.group} className="flex flex-col gap-3">
          <legend className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t(group.titleKey)}
          </legend>
          {group.fields.map((field) => (
            <div key={field.id} className="flex items-end gap-3">
              <input type="hidden" name="gameFieldId" value={field.id} />
              <label className="flex flex-1 flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
                {field.label}
                {field.type === "textarea" ? (
                  <textarea
                    name={`value_${field.id}`}
                    defaultValue={field.value ?? ""}
                    rows={3}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                ) : (
                  <input
                    type={field.type === "number" ? "number" : "text"}
                    name={`value_${field.id}`}
                    defaultValue={field.value ?? ""}
                    className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
                  />
                )}
              </label>
              <label className="flex items-center gap-1 pb-1.5 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  name={`visible_${field.id}`}
                  defaultChecked={field.visibleOnCard}
                />
                {t("visibleOnCard")}
              </label>
            </div>
          ))}
        </fieldset>
      ))}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("saving") : t("saveButton")}
      </button>
      {state.status === "success" && (
        <p className="text-sm text-emerald-600 dark:text-emerald-400">
          {t("saveSuccess")}
        </p>
      )}
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey === "locked" ? "locked" : "generic")}
        </p>
      )}
    </form>
  );
}
