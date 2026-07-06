import { getTranslations } from "next-intl/server";
import { AuthPanel } from "@/components/auth/auth-panel";

export default async function Home() {
  const t = await getTranslations("HomePage");

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 bg-zinc-50 p-6 text-center dark:bg-black">
      <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
        {t("title")}
      </h1>
      <p className="max-w-md text-lg text-zinc-600 dark:text-zinc-400">
        {t("subtitle")}
      </p>
      <AuthPanel />
      <p className="text-sm text-zinc-500 dark:text-zinc-500">
        {t("comingSoon")}
      </p>
    </div>
  );
}
