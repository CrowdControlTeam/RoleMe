import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { startAnonymousSession } from "@/lib/supabase/actions";
import { LinkEmailForm } from "./link-email-form";

export async function AuthPanel() {
  const t = await getTranslations("Auth");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <form action={startAnonymousSession}>
        <button
          type="submit"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {t("startButton")}
        </button>
      </form>
    );
  }

  if (!user.is_anonymous) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {t("linkedEmailLabel", { email: user.email ?? "" })}
      </p>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <span className="rounded-full bg-zinc-200 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {t("anonymousBadge")}
      </span>
      <LinkEmailForm />
    </div>
  );
}
