export function AnimeLoading({
  title = "Loading anime data",
}: {
  title?: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/[0.025] p-8 text-center">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-white" />
      <div className="space-y-2">
        <p className="text-sm font-semibold text-white/80">{title}</p>
        <p className="text-sm text-white/45">
          Fetching directly from AniList in your browser for Cloudflare stability.
        </p>
      </div>
    </div>
  );
}

export function AnimeError({
  message,
}: {
  message: string;
}) {
  return (
    <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 rounded-2xl border border-red-400/15 bg-red-500/[0.04] p-8 text-center">
      <h2 className="text-xl font-semibold text-white">Anime data unavailable</h2>
      <p className="max-w-xl text-sm leading-relaxed text-white/55">{message}</p>
    </div>
  );
}
