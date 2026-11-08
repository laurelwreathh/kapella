"use client";

import Link from "next/link";
import PlaylistForm from "@/components/PlaylistForm";
import FavoriteButton from "@/components/FavoriteButton";
import { useLibrary } from "@/components/LibraryProvider";
import PlayButton from "@/components/PlayButton";
import TasteProfileView from "@/components/TasteProfileView";
import { tracks, type DemoTrack } from "@/lib/demo-music";

function LibraryTrack({ track, queueIds, favorite = false, playedAt }: {
  track: DemoTrack;
  queueIds: number[];
  favorite?: boolean;
  playedAt?: number;
}) {
  return (
    <li className="flex items-center gap-2 py-4 sm:gap-4">
      <div aria-hidden="true" className={`size-11 shrink-0 overflow-hidden rounded-lg ${track.color}`}>
        <svg viewBox="0 0 200 200" fill="currentColor"><circle cx="140" cy="55" r="28" opacity="0.45" /><path d="M-20 200 65 65l93 135ZM80 200l75-100 70 100Z" opacity="0.6" /></svg>
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-sm font-semibold"><Link href={`/track/${track.id}`} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">{track.title}</Link></h3>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500"><Link href={`/artist/${track.artistId}`} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">{track.artist}</Link> · {track.album}</p>
        {playedAt !== undefined && <time dateTime={new Date(playedAt).toISOString()} className="mt-1 block text-xs text-zinc-400">{new Date(playedAt).toLocaleString("ru-RU", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}</time>}
      </div>
      <span className="hidden text-xs text-zinc-500 tabular-nums sm:block">{track.duration}</span>
      <PlayButton trackId={track.id} queueIds={queueIds} title={track.title} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600" />
      {favorite && <FavoriteButton trackId={track.id} title={track.title} />}
    </li>
  );
}

export default function LibraryPage() {
  const { favoriteIds, history, playlists, guestHistory, hydrated, followedArtistIds } = useLibrary();
  const favoriteTracks = favoriteIds.flatMap((id) => tracks.filter((track) => track.id === id));
  const historyQueue = [...new Set(history.map((entry) => entry.trackId))];

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-9">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Моя библиотека</h1>
          <p className="mt-2 text-sm text-zinc-500">Любимые треки, твои подборки и музыка, к которой хочется вернуться.</p>
        </div>
        <TasteProfileView />
        {!hydrated && <p role="status" className="text-sm text-zinc-500">Восстанавливаем библиотеку…</p>}
        {followedArtistIds.length > 0 && <section aria-label="Подписки"><h2 className="text-xl font-semibold">Мои исполнители</h2><ul className="mt-3 flex flex-wrap gap-2">{followedArtistIds.map((id) => <li key={id}><Link href={`/artist/${id}`} className="inline-block rounded-full border border-zinc-200 px-3 py-2 text-sm hover:bg-violet-50">{tracks.find((track) => track.artistId === id)?.artist}</Link></li>)}</ul></section>}
        <section aria-labelledby="favorites-title">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="favorites-title" className="text-xl font-semibold">Избранные треки</h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">{favoriteTracks.length}</span>
          </div>
          {favoriteTracks.length ? (
            <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
              {favoriteTracks.map((track) => <LibraryTrack key={track.id} track={track} queueIds={favoriteIds} favorite />)}
            </ul>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 text-sm leading-relaxed text-zinc-500">
              <p>В избранном пока нет треков.</p>
              <p className="mt-1">Нажми на сердце на странице трека, чтобы сохранить его здесь.</p>
              <Link href="/search" className="mt-3 inline-block rounded font-medium text-zinc-700 hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">Найти музыку</Link>
            </div>
          )}
        </section>
        <details className="rounded-2xl border border-zinc-200 p-5">
          <summary className="text-sm font-semibold">Гостевое прослушивание · {guestHistory.length}</summary>
          <p className="mt-3 text-sm text-zinc-500">Эти запуски хранятся отдельно и не меняют музыкальный вкус и рекомендации.</p>
          {guestHistory.length ? <ul className="mt-3 divide-y divide-zinc-100">{guestHistory.slice(0, 10).map((entry) => {
            const track = tracks.find((item) => item.id === entry.trackId);
            return track ? <li key={entry.id} className="py-2 text-sm text-zinc-600"><Link href={`/track/${track.id}`} className="hover:underline">{track.title}</Link> · {track.artist}</li> : null;
          })}</ul> : <p className="mt-3 text-sm text-zinc-500">Гостевых запусков пока нет.</p>}
        </details>
        <section aria-labelledby="playlists-title">
          <h2 id="playlists-title" className="text-xl font-semibold">Мои плейлисты</h2>
          <PlaylistForm />
          {playlists.length ? <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {playlists.map((playlist) => <li key={playlist.id} className="min-w-0">
              <Link href={`/playlist/${playlist.id}`} className="block h-full rounded-2xl border border-zinc-200 p-5 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600">
                <div aria-hidden="true" className="mb-4 flex size-14 items-center justify-center rounded-xl bg-[#e0e7df] text-[#8b9f8c]">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M9 18V5l11-2v13M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></svg>
                </div>
                <h3 className="break-words text-base font-semibold">{playlist.name}</h3>
                {playlist.description && <p className="mt-2 line-clamp-2 break-words text-sm text-zinc-500">{playlist.description}</p>}
                <p className="mt-3 text-xs text-zinc-500">Треков: {playlist.trackIds.length}</p>
              </Link>
            </li>)}
          </ul> : <p className="mt-4 text-sm text-zinc-500">Плейлистов пока нет. Создай первую подборку.</p>}
        </section>
        <section aria-labelledby="history-title">
          <div className="mb-4 flex items-center gap-3">
            <h2 id="history-title" className="text-xl font-semibold">История прослушивания</h2>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-500">{history.length}</span>
          </div>
          {history.length ? (
            <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
              {history.map((entry) => {
                const track = tracks.find((item) => item.id === entry.trackId);
                return track ? <LibraryTrack key={entry.id} track={track} queueIds={historyQueue} playedAt={entry.playedAt} /> : null;
              })}
            </ul>
          ) : <p className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5 text-sm text-zinc-500">Пока здесь пусто. Запусти трек — он появится в истории.</p>}
        </section>
      </div>
    </main>
  );
}
