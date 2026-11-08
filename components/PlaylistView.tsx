"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import PlayButton from "@/components/PlayButton";
import { tracks } from "@/lib/demo-music";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600";

export default function PlaylistView({ id }: { id: string }) {
  const { playlists, deletePlaylist, addToPlaylist, removeFromPlaylist, updatePlaylistTracks, getRecommendations, hydrated } = useLibrary();
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [suggestedIds, setSuggestedIds] = useState<number[] | null>(null);
  const [refreshMessage, setRefreshMessage] = useState("");
  const playlist = playlists.find((item) => item.id === id);
  if (!hydrated) return <main className="w-full flex-1 p-6"><p role="status" className="text-sm text-zinc-500">Загружаем плейлист…</p></main>;
  if (!playlist) return (
    <main className="w-full flex-1 bg-white p-6 text-zinc-900 sm:p-8">
      <h1 className="text-2xl font-semibold">Плейлист не найден</h1>
      <p className="mt-3 text-sm text-zinc-500">Возможно, он удалён или создан в другом браузере.</p>
      <Link href="/library" className={`mt-5 inline-block rounded text-sm font-medium underline ${focus}`}>Вернуться в библиотеку</Link>
    </main>
  );
  const playlistTracks = playlist.trackIds.flatMap((trackId) => tracks.filter((track) => track.id === trackId));
  const availableTracks = tracks.filter((track) => !playlist.trackIds.includes(track.id));
  function addTrack(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    addToPlaylist(id, Number(new FormData(event.currentTarget).get("trackId")));
  }

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <Link href="/library" className={`inline-block rounded text-sm text-zinc-500 hover:underline ${focus}`}>Моя библиотека</Link>
        <section aria-labelledby="playlist-title" className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <div aria-hidden="true" className="flex size-40 shrink-0 items-center justify-center rounded-2xl bg-[#e0e7df] text-[#8b9f8c] sm:size-48">
            <svg width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l11-2v13M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500">Плейлист</p>
            <h1 id="playlist-title" className="mt-2 break-words text-3xl font-semibold tracking-tight sm:text-4xl">{playlist.name}</h1>
            {playlist.description && <p className="mt-3 break-words text-sm leading-relaxed whitespace-pre-line text-zinc-600">{playlist.description}</p>}
            <p className="mt-3 text-sm text-zinc-500">Треков: {playlist.trackIds.length}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              {playlistTracks.length > 0 && <PlayButton trackId={playlistTracks[0].id} queueIds={playlist.trackIds} title={playlist.name} showLabel className="flex h-11 items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white" />}
              <button type="button" onClick={() => setConfirmDelete(true)} className={`rounded-full border border-zinc-200 px-4 py-2 text-sm hover:bg-zinc-50 ${focus}`}>Удалить плейлист</button>
            </div>
          </div>
        </section>
        {confirmDelete && <div role="group" aria-label="Подтверждение удаления" className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm">Удалить плейлист «{playlist.name}»?</p>
          <div className="mt-3 flex gap-3">
            <button type="button" onClick={() => { deletePlaylist(id); router.replace("/library"); }} className={`rounded-full bg-zinc-900 px-4 py-2 text-sm text-white ${focus}`}>Да, удалить</button>
            <button type="button" onClick={() => setConfirmDelete(false)} className={`rounded-full px-4 py-2 text-sm ${focus}`}>Отмена</button>
          </div>
        </div>}
        <div className="flex flex-col items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-zinc-500">Добавь новые треки по текущему профилю вкуса. Уже выбранная музыка сохранится.</p>
          <button type="button" onClick={() => { setSuggestedIds(getRecommendations({ limit: 4, excludeIds: playlist.trackIds }).map((item) => item.track.id)); setRefreshMessage(""); }} className={`shrink-0 rounded-full border border-violet-200 px-4 py-2 text-sm text-violet-700 hover:bg-violet-50 ${focus}`}>Обновить под мой вкус</button>
        </div>
        {suggestedIds !== null && <section aria-label="Предложение обновления" className="rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
          <h2 className="font-semibold">Новые треки для твоей подборки</h2>
          {suggestedIds.length ? <><ul className="my-4 space-y-2 text-sm text-zinc-600">{suggestedIds.map((trackId) => { const track = tracks.find((item) => item.id === trackId)!; return <li key={trackId}><Link href={`/track/${trackId}`} className="hover:underline">{track.title}</Link> · {track.artist}</li>; })}</ul><button type="button" onClick={() => { updatePlaylistTracks(id, [...playlist.trackIds, ...suggestedIds]); setRefreshMessage("Плейлист обновлён: рекомендации добавлены."); setSuggestedIds(null); }} className="rounded-full bg-violet-600 px-4 py-2 text-sm text-white">Добавить рекомендации</button></> : <p className="my-3 text-sm text-zinc-500">Все подходящие треки уже в плейлисте.</p>}
          <button type="button" onClick={() => setSuggestedIds(null)} className="ml-3 rounded-full px-4 py-2 text-sm text-zinc-500">Позже</button>
        </section>}
        {refreshMessage && <p role="status" className="text-sm text-violet-700">{refreshMessage}</p>}
        <section aria-labelledby="playlist-tracks-title">
          <h2 id="playlist-tracks-title" className="text-xl font-semibold">Треки</h2>
          {playlistTracks.length ? <ol className="mt-4 divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
            {playlistTracks.map((track) => <li key={track.id} className="flex items-center gap-2 py-4 sm:gap-4">
              <div aria-hidden="true" className={`size-11 shrink-0 overflow-hidden rounded-lg ${track.color}`}><svg viewBox="0 0 200 200" fill="currentColor"><circle cx="140" cy="55" r="28" opacity="0.45" /><path d="M-20 200 65 65l93 135ZM80 200l75-100 70 100Z" opacity="0.6" /></svg></div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-semibold"><Link href={`/track/${track.id}`} className={`rounded hover:underline ${focus}`}>{track.title}</Link></h3>
                <p className="mt-1 truncate text-xs text-zinc-500"><Link href={`/artist/${track.artistId}`} className={`rounded hover:underline ${focus}`}>{track.artist}</Link> · {track.album}</p>
              </div>
              <span className="hidden text-xs text-zinc-500 sm:block">{track.duration}</span>
              <PlayButton trackId={track.id} queueIds={playlist.trackIds} title={track.title} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-600" />
              <button type="button" onClick={() => removeFromPlaylist(id, track.id)} aria-label={`Удалить из плейлиста: ${track.title}`} className={`flex size-10 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 ${focus}`}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M5 6h14M9 6V3h6v3M7 6l1 15h8l1-15M10 10v7M14 10v7" /></svg></button>
            </li>)}
          </ol> : <p className="mt-4 rounded-xl border border-zinc-200 p-5 text-sm text-zinc-500">В плейлисте пока нет треков. Добавь первый ниже или со страницы трека.</p>}
        </section>
        <form aria-label="Добавление трека" onSubmit={addTrack} className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
          <label className="block text-sm font-semibold">Добавить трек
            <select key={playlist.trackIds.join(",")} name="trackId" required defaultValue="" disabled={!availableTracks.length} className="mt-3 block h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm font-normal outline-none focus:ring-2 focus:ring-zinc-400">
              <option value="" disabled>{availableTracks.length ? "Выбери трек" : "Все тестовые треки уже добавлены"}</option>
              {availableTracks.map((track) => <option key={track.id} value={track.id}>{track.title} — {track.artist}</option>)}
            </select>
          </label>
          <button type="submit" disabled={!availableTracks.length} className={`mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm text-white disabled:bg-zinc-300 ${focus}`}>Добавить в плейлист</button>
        </form>
      </div>
    </main>
  );
}
