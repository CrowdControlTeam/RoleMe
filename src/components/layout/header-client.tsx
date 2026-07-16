"use client";

import { useState } from "react";
import Link from "next/link";
import { logout } from "@/lib/profile/actions";
import { AvatarCircle } from "./avatar-circle";
import { SlideOver } from "./slide-over";

type Profile = {
  displayName: string;
  isAnonymous: boolean;
  avatarUrl: string | null;
};

export function HeaderClient({
  appName,
  menuAriaLabel,
  profileAriaLabel,
  campaignsLink,
  viewProfileLabel,
  logoutLabel,
  profile,
}: {
  appName: string;
  menuAriaLabel: string;
  profileAriaLabel: string;
  campaignsLink: string;
  viewProfileLabel: string;
  logoutLabel: string;
  profile: Profile | null;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-black">
      <div className="flex items-center gap-3">
        <button
          type="button"
          aria-label={menuAriaLabel}
          onClick={() => setMenuOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-md text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            className="h-5 w-5"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute left-0 mt-2 w-48 rounded-md border border-zinc-200 bg-white p-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-950">
              <Link
                href="/campaigns"
                onClick={() => setMenuOpen(false)}
                className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
              >
                {campaignsLink}
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/campaigns"
          className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
        >
          {appName}
        </Link>
      </div>

      {profile && (
        <button
          type="button"
          aria-label={profileAriaLabel}
          onClick={() => setProfileOpen(true)}
        >
          <AvatarCircle
            avatarUrl={profile.avatarUrl}
            isAnonymous={profile.isAnonymous}
          />
        </button>
      )}

      <SlideOver
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        side="left"
        ariaLabel={menuAriaLabel}
      >
        <Link
          href="/campaigns"
          onClick={() => setMenuOpen(false)}
          className="block rounded-md px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          {campaignsLink}
        </Link>
      </SlideOver>

      {profile && (
        <SlideOver
          open={profileOpen}
          onClose={() => setProfileOpen(false)}
          side="right"
          ariaLabel={profileAriaLabel}
        >
          <p className="truncate px-1 pb-2 text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {profile.displayName}
          </p>
          <Link
            href="/profile"
            onClick={() => setProfileOpen(false)}
            className="block rounded-md px-2 py-1.5 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
          >
            {viewProfileLabel}
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="block w-full rounded-md px-2 py-1.5 text-left text-sm text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-900"
            >
              {logoutLabel}
            </button>
          </form>
        </SlideOver>
      )}
    </header>
  );
}
