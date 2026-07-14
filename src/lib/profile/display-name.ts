import type { User } from "@supabase/supabase-js";

export function getDisplayName(user: User, guestLabel: string): string {
  const username = (user.user_metadata as { username?: string } | null)
    ?.username;
  if (username) {
    return username;
  }
  if (user.is_anonymous || !user.email) {
    return `${guestLabel}-${user.id.slice(0, 6).toUpperCase()}`;
  }
  return user.email;
}
