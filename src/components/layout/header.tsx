import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getDisplayName } from "@/lib/profile/display-name";
import { HeaderClient } from "./header-client";

export async function Header() {
  const t = await getTranslations("Header");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const profile = user
    ? {
        displayName: getDisplayName(user, t("guestLabel")),
        isAnonymous: user.is_anonymous ?? false,
        avatarUrl:
          (user.user_metadata as { avatar_url?: string } | null)
            ?.avatar_url ?? null,
      }
    : null;

  return (
    <HeaderClient
      appName={t("appName")}
      menuAriaLabel={t("menuAriaLabel")}
      profileAriaLabel={t("profileAriaLabel")}
      campaignsLink={t("campaignsLink")}
      viewProfileLabel={t("viewProfile")}
      logoutLabel={t("logout")}
      profile={profile}
    />
  );
}
