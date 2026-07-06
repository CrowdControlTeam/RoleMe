import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { regenerateInviteCode } from "@/lib/campanas/actions";

export default async function CampanaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("Campanas");
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: campana } = await supabase
    .from("campanas")
    .select("id, name, max_jugadores, creator_id, invite_code")
    .eq("id", id)
    .maybeSingle();

  if (!campana) {
    notFound();
  }

  const { count: memberCount } = await supabase
    .from("campana_miembros")
    .select("*", { count: "exact", head: true })
    .eq("campana_id", id);

  const isCreator = user?.id === campana.creator_id;
  const requestHeaders = await headers();
  const host = requestHeaders.get("host");
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const joinLink = host
    ? `${protocol}://${host}/join/${campana.invite_code}`
    : `/join/${campana.invite_code}`;

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {campana.name}
      </h1>
      <p className="text-sm text-zinc-500">
        {t("membersCount", {
          count: memberCount ?? 0,
          max: campana.max_jugadores,
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
            {campana.invite_code}
          </code>
          <code className="w-fit rounded bg-zinc-100 px-3 py-1.5 text-sm text-zinc-900 dark:bg-zinc-900 dark:text-zinc-50">
            {joinLink}
          </code>
          <form action={regenerateInviteCode.bind(null, campana.id)}>
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
