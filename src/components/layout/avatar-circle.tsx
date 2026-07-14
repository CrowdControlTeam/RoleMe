export function AvatarCircle({
  avatarUrl,
  isAnonymous,
  size = 32,
}: {
  avatarUrl: string | null;
  isAnonymous: boolean;
  size?: number;
}) {
  const style = { width: size, height: size };

  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className="rounded-full object-cover"
        style={style}
      />
    );
  }

  if (isAnonymous) {
    return (
      <span
        style={style}
        className="flex items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-zinc-50 dark:bg-zinc-300 dark:text-zinc-900"
      >
        G
      </span>
    );
  }

  return (
    <span
      style={style}
      className="flex items-center justify-center rounded-full bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
    >
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        className="h-1/2 w-1/2"
        aria-hidden="true"
      >
        <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.418 0-8 2.239-8 5v1a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-1c0-2.761-3.582-5-8-5Z" />
      </svg>
    </span>
  );
}
