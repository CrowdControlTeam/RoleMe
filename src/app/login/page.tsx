import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage() {
  const t = await getTranslations("Login");

  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>
      <LoginForm />
      <Link
        href="/"
        className="text-sm text-zinc-600 underline underline-offset-4 dark:text-zinc-400"
      >
        {t("backLink")}
      </Link>
    </div>
  );
}
