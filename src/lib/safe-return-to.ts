// Only accept same-app relative paths (never an absolute/protocol-relative
// URL) so a crafted ?returnTo= query can't be used as an open redirect.
export function sanitizeReturnTo(returnTo: string | undefined): string | undefined {
  if (!returnTo || !returnTo.startsWith("/") || returnTo.startsWith("//")) {
    return undefined;
  }
  return returnTo;
}
