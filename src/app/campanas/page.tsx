import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { CreateCampanaForm } from "@/components/campanas/create-campana-form";
import { JoinCampanaForm } from "@/components/campanas/join-campana-form";

export default async function CampanasPage() {
  const t = await getTranslations("Campanas");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let campanas: { id: string; name: string }[] = [];
  if (user) {
    const { data } = await supabase
      .from("campanas")
      .select("id, name")
      .order("created_at", { ascending: false });
    campanas = data ?? [];
  }

  const { data: juegosData } = await supabase
    .from("juegos")
    .select("id, name")
    .order("name");
  const juegos = juegosData ?? [];

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("yourCampanasTitle")}
        </h2>
        {campanas.length === 0 ? (
          <p className="text-sm text-zinc-500">{t("noCampanas")}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {campanas.map((campana) => (
              <li key={campana.id}>
                <Link
                  href={`/campanas/${campana.id}`}
                  className="block rounded-md border border-zinc-200 px-4 py-3 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-50">
                    {campana.name}
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
          <CreateCampanaForm juegos={juegos} />
        </div>
        <div className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            {t("joinTitle")}
          </h2>
          <JoinCampanaForm />
        </div>
      </section>
    </div>
  );
}
