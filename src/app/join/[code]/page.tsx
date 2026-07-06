import { getTranslations } from "next-intl/server";
import { JoinCampanaForm } from "@/components/campanas/join-campana-form";

export default async function JoinByCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const t = await getTranslations("Campanas");

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("joinTitle")}
      </h1>
      <JoinCampanaForm defaultCode={code} />
    </div>
  );
}
