"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createCampana, type CreateCampanaState } from "@/lib/campanas/actions";
import { CAMPANA_MAX_JUGADORES_LIMIT } from "@/lib/config";

const initialState: CreateCampanaState = { status: "idle" };

export function CreateCampanaForm({
  juegos,
}: {
  juegos: { id: string; name: string }[];
}) {
  const t = useTranslations("Campanas");
  const [state, formAction, pending] = useActionState(
    createCampana,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("nameLabel")}
        <input
          type="text"
          name="name"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("juegoLabel")}
        <select
          name="juego"
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {juegos.map((juego) => (
            <option key={juego.id} value={juego.id}>
              {juego.name}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm text-zinc-700 dark:text-zinc-300">
        {t("maxJugadoresLabel")}
        <input
          type="number"
          name="maxJugadores"
          min={1}
          max={CAMPANA_MAX_JUGADORES_LIMIT}
          defaultValue={CAMPANA_MAX_JUGADORES_LIMIT}
          required
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
      >
        {pending ? t("creating") : t("createButton")}
      </button>
      {state.status === "error" && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {t(state.errorKey ?? "generic")}
        </p>
      )}
    </form>
  );
}
