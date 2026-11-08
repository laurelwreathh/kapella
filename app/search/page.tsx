"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AddToPlaylist from "@/components/AddToPlaylist";
import FavoriteButton from "@/components/FavoriteButton";
import { useLibrary } from "@/components/LibraryProvider";
import PlayButton from "@/components/PlayButton";
import QueueButton from "@/components/QueueButton";
import { artists, genreLabels, tracks, type DemoTrack } from "@/lib/demo-music";

const tabs = ["Все", "Треки", "Исполнители", "Альбомы", "Плейлисты"] as const;
type Tab = (typeof tabs)[number];
const popularQueries = ["Тихий вечер", "Северный свет", "Линии", "Домой", "За окном засыпает город"];

function normalize(value: string) {
  return value.toLocaleLowerCase("ru").replaceAll("ё", "е").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
}

function searchableTrackInfo(track: DemoTrack) {
  return [track.title, track.artist, track.album, ...track.genres, ...track.genres.map((genre) => genreLabels[genre] ?? genre)];
}

function Cover({ color }: { color: string }) {
  return (
    <div aria-hidden="true" className={`flex size-12 shrink-0 items-center justify-center rounded-lg ${color}`}>
      <svg width="36" height="36" viewBox="0 0 36 36" fill="currentColor">
        <circle cx="25" cy="10" r="4" opacity="0.6" />
        <path d="m3 29 10-15 7 9 4-5 9 11Z" />
      </svg>
    </div>
  );
}

function TrackResult({ track, queueIds, search = "" }: { track: DemoTrack; queueIds: number[]; search?: string }) {
  const matches = (value: string) => normalize(value).includes(search);
  const lyricsOnly = search && matches(track.lyrics) && !searchableTrackInfo(track).some(matches);
  const excerpt = track.lyrics.split("\n").find(matches) ?? track.lyrics.replaceAll("\n", " ");

  return (
    <li className="py-4">
      <div className="flex items-center gap-2 sm:gap-4">
        <Cover color={track.color} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold"><Link href={`/track/${track.id}`} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">{track.title}</Link></h4>
          <p className="mt-1 text-xs leading-relaxed text-zinc-500"><Link href={`/artist/${track.artistId}`} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">{track.artist}</Link> · {track.album}</p>
        </div>
        <span className="text-xs text-zinc-500 tabular-nums">{track.duration}</span>
        <PlayButton trackId={track.id} queueIds={queueIds} title={track.title} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-600" />
      </div>
      {lyricsOnly && <p className="mt-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm leading-relaxed text-zinc-600">Найдено в тексте: «{excerpt}»</p>}
      <details className="mt-2">
        <summary aria-label={`Дополнительно: ${track.title}`} className="ml-auto flex w-fit cursor-pointer list-none items-center gap-2 rounded-lg px-2 py-1 text-xs text-zinc-500 focus-visible:outline-2 focus-visible:outline-zinc-600 [&::-webkit-details-marker]:hidden">
          Дополнительно
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
        </summary>
        <div className="mt-2 space-y-3 rounded-lg bg-zinc-50 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <FavoriteButton trackId={track.id} title={track.title} />
            <Link href={`/track/${track.id}`} className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">Открыть трек</Link>
            <Link href={`/artist/${track.artistId}`} className="rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">К исполнителю</Link>
          </div>
          <QueueButton trackId={track.id} />
          <AddToPlaylist trackId={track.id} />
          <details><summary className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">Текст песни</summary><p className="px-3 py-2 text-sm leading-relaxed whitespace-pre-line text-zinc-600">{track.lyrics}</p></details>
        </div>
      </details>
    </li>
  );
}

function SearchResults({ initialQuery }: { initialQuery: string }) {
  const { playlists } = useLibrary();
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<Tab>("Все");
  const search = normalize(query);
  const matches = (value: string) => normalize(value).includes(search);
  const foundTracks = tracks.filter((track) => [...searchableTrackInfo(track), track.lyrics].some(matches));
  const foundArtists = artists.filter((artist) => [artist.name, artist.genre, ...tracks.filter((track) => track.artistId === artist.id).flatMap((track) => track.genres.flatMap((genre) => [genre, genreLabels[genre] ?? genre]))].some(matches));
  const foundAlbums = tracks.filter((track, index) =>
    tracks.findIndex((item) => item.artistId === track.artistId && item.album === track.album) === index
    && [track.album, track.artist, ...track.genres, ...track.genres.map((genre) => genreLabels[genre] ?? genre)].some(matches)
  );
  const foundPlaylists = playlists.filter((playlist) => matches(playlist.name) || matches(playlist.description));
  const show = (tab: Tab) => activeTab === "Все" || activeTab === tab;
  const resultCount = (show("Треки") ? foundTracks.length : 0)
    + (show("Исполнители") ? foundArtists.length : 0)
    + (show("Альбомы") ? foundAlbums.length : 0)
    + (show("Плейлисты") ? foundPlaylists.length : 0);

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-8">
        <section aria-labelledby="search-title">
          <h1 id="search-title" className="text-2xl font-semibold tracking-tight sm:text-3xl">Поиск</h1>
          <label className="mt-5 flex items-center gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 focus-within:ring-2 focus-within:ring-zinc-400">
            <span className="sr-only">Поиск музыки</span>
            <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="shrink-0 text-zinc-500">
              <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" />
            </svg>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} aria-describedby="search-hint" placeholder="Название, исполнитель или строка из песни…" className="h-14 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-500 sm:text-base" />
          </label>
          <p id="search-hint" className="mt-3 text-sm leading-relaxed text-zinc-500">Ищи по названию, исполнителю, жанру или тексту песни. Помнишь только строчку? Попробуй «За окном засыпает город».</p>
        </section>

        <section aria-labelledby="popular-queries-title">
          <h2 id="popular-queries-title" className="text-lg font-semibold">Популярные запросы</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {popularQueries.map((item) => (
              <button key={item} type="button" onClick={() => { setQuery(item); setActiveTab("Все"); }} className="rounded-full bg-zinc-100 px-4 py-2 text-sm text-zinc-600 transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600">{item}</button>
            ))}
          </div>
        </section>

        <section aria-labelledby="results-title">
          <h2 id="results-title" className="text-xl font-semibold">Результаты</h2>
          <div aria-label="Тип результатов" className="mt-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${activeTab === tab ? "bg-zinc-800 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"}`}>{tab}</button>
            ))}
          </div>
          <p role="status" className="mt-4 text-sm text-zinc-500">{resultCount ? `Найдено: ${resultCount}` : "Ничего не найдено"}</p>
          {resultCount === 0 && <p className="mt-2 text-sm text-zinc-500">Попробуй другое название, имя исполнителя или фрагмент текста. Можно также выбрать вкладку «Все».</p>}

          {show("Треки") && foundTracks.length > 0 && (
            <section aria-labelledby="tracks-title" className="mt-6">
              <h3 id="tracks-title" className="mb-3 text-sm font-semibold text-zinc-600">Треки</h3>
              <ul className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
                {foundTracks.map((track) => <TrackResult key={track.id} track={track} queueIds={foundTracks.map((item) => item.id)} search={search} />)}
              </ul>
            </section>
          )}
          {show("Исполнители") && foundArtists.length > 0 && (
            <section aria-label="Исполнители" className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-600">Исполнители</h3>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {foundArtists.map((artist) => <li key={artist.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"><Link href={`/artist/${artist.id}`} className="flex items-center gap-3 rounded focus-visible:outline-2 focus-visible:outline-zinc-600"><Cover color={artist.color} /><div className="min-w-0"><h4 className="text-sm font-semibold hover:underline">{artist.name}</h4><p className="mt-1 text-xs text-zinc-500">{artist.genre}</p></div></Link></li>)}
              </ul>
            </section>
          )}
          {show("Альбомы") && foundAlbums.length > 0 && (
            <section aria-label="Альбомы" className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-600">Альбомы</h3>
              <ul className="space-y-3">
                {foundAlbums.map((album) => {
                  const albumTracks = tracks.filter((track) => track.artistId === album.artistId && track.album === album.album);
                  return <li key={`${album.artistId}-${album.album}`} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"><div className="flex items-center gap-3"><Cover color={album.color} /><div className="min-w-0 flex-1"><h4 className="text-sm font-semibold">{album.album}</h4><p className="mt-1 text-xs text-zinc-500"><Link href={`/artist/${album.artistId}`} className="rounded hover:underline focus-visible:outline-2 focus-visible:outline-zinc-600">{album.artist}</Link> · Треков: {albumTracks.length}</p></div><PlayButton trackId={albumTracks[0].id} queueIds={albumTracks.map((track) => track.id)} title={`альбом ${album.album}`} className="flex size-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-600" /></div><details className="mt-3"><summary className="cursor-pointer rounded-lg px-2 py-2 text-sm text-zinc-600 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">Треки альбома</summary><ul className="divide-y divide-zinc-200">{albumTracks.map((track) => <TrackResult key={track.id} track={track} queueIds={albumTracks.map((item) => item.id)} />)}</ul></details></li>;
                })}
              </ul>
            </section>
          )}
          {show("Плейлисты") && foundPlaylists.length > 0 && (
            <section aria-label="Плейлисты" className="mt-6">
              <h3 className="mb-3 text-sm font-semibold text-zinc-600">Плейлисты</h3>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {foundPlaylists.map((playlist) => <li key={playlist.id} className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-4"><Link href={`/playlist/${playlist.id}`} className="block rounded focus-visible:outline-2 focus-visible:outline-zinc-600"><h4 className="break-words text-sm font-semibold hover:underline">{playlist.name}</h4><p className="mt-1 text-xs text-zinc-500">Треков: {playlist.trackIds.length}</p>{playlist.description && <p className="mt-2 line-clamp-2 break-words text-sm text-zinc-500">{playlist.description}</p>}</Link></li>)}
              </ul>
            </section>
          )}
        </section>
      </div>
    </main>
  );
}

function SearchFromUrl() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") ?? "";
  return <SearchResults key={query} initialQuery={query} />;
}

export default function SearchPage() {
  return <Suspense fallback={<main className="w-full flex-1 px-4 py-6 sm:px-8 sm:py-8"><h1 className="text-2xl font-semibold">Поиск</h1><p role="status" className="mt-4 text-sm text-zinc-500">Загрузка поиска…</p></main>}><SearchFromUrl /></Suspense>;
}
