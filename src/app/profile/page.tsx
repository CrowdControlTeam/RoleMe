import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { UsernameForm } from "@/components/profile/username-form";
import { AvatarUploadForm } from "@/components/profile/avatar-upload-form";
import { LinkEmailPasswordForm } from "@/components/profile/link-email-password-form";
import { ChangeEmailForm } from "@/components/profile/change-email-form";
import { ChangePasswordForm } from "@/components/profile/change-password-form";

export default async function ProfilePage() {
  const t = await getTranslations("Profile");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const metadata = (user.user_metadata ?? {}) as {
    username?: string;
    avatar_url?: string;
  };

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 p-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
        {t("title")}
      </h1>

      <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("avatarTitle")}
        </h2>
        <AvatarUploadForm
          avatarUrl={metadata.avatar_url ?? null}
          isAnonymous={user.is_anonymous ?? false}
        />
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("usernameTitle")}
        </h2>
        <UsernameForm currentUsername={metadata.username ?? ""} />
      </section>

      <section className="flex flex-col gap-3 rounded-md border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          {t("emailTitle")}
        </h2>
        {user.is_anonymous || !user.email ? (
          <LinkEmailPasswordForm />
        ) : (
          <>
            <ChangeEmailForm currentEmail={user.email} />
            <ChangePasswordForm />
          </>
        )}
      </section>
    </div>
  );
}
