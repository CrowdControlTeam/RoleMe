"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { uploadAvatar, type AvatarUploadState } from "@/lib/profile/actions";
import { AvatarCircle } from "@/components/layout/avatar-circle";

const initialState: AvatarUploadState = { status: "idle" };

export function AvatarUploadForm({
  avatarUrl,
  isAnonymous,
}: {
  avatarUrl: string | null;
  isAnonymous: boolean;
}) {
  const t = useTranslations("Profile");
  const [state, formAction, pending] = useActionState(
    uploadAvatar,
    initialState,
  );

  return (
    <form action={formAction} className="flex items-center gap-4">
      <AvatarCircle avatarUrl={avatarUrl} isAnonymous={isAnonymous} size={64} />
      <div className="flex flex-col gap-2">
        <input
          type="file"
          name="avatar"
          accept="image/*"
          required
          className="text-sm text-zinc-700 dark:text-zinc-300"
        />
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-zinc-50 disabled:opacity-50 dark:bg-zinc-50 dark:text-zinc-900"
        >
          {pending ? t("uploading") : t("uploadButton")}
        </button>
        {state.status === "success" && (
          <p className="text-sm text-emerald-600 dark:text-emerald-400">
            {t("avatarSaved")}
          </p>
        )}
        {state.status === "error" && (
          <p className="text-sm text-red-600 dark:text-red-400">
            {t("avatarError")}
          </p>
        )}
      </div>
    </form>
  );
}
