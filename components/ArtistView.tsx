"use client";

import AddToPlaylist from "@/components/AddToPlaylist";
import PlayButton from "@/components/PlayButton";
import QueueButton from "@/components/QueueButton";
import { useLibrary } from "@/components/LibraryProvider";

import Link from "next/link";
import { useState } from "react";
import type { DemoArtist, DemoTrack } from "@/lib/demo-music";

const tabs = ["Популярное", "Альбомы", "Плейлисты", "Похожие исполнители", "Об исполнителе"] as const;
type Tab = (typeof tabs)[number];
const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600";

function Artwork({ color, className = "" }: { color: string; className?: string }) {
  return (
    <div aria-hidden="true" className={`overflow-hidden ${color} ${className}`}>
      <svg viewBox="0 0 200 200" fill="currentColor" className="h-full w-full">
        <circle cx="140" cy="55" r="28" opacity="0.45" />
        <path d="M-20 200 65 65l93 135ZM80 200l75-100 70 100Z" opacity="0.6" />
      </svg>
    </div>
  );
}

function Icon({ more = false }: { more?: boolean }) {
  return (
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      {more ? <><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></> : <path d="M8 5v14l11-7Z" />}
    </svg>
  );
}

export default function ArtistView({ artist, tracks, similarArtists }: {
  artist: DemoArtist;
  tracks: DemoTrack[];
  similarArtists: DemoArtist[];
}) {
  const [activeTab, setActiveTab] = useState<Tab>("Популярное");
  const { followedArtistIds, toggleFollowArtist, playlists } = useLibrary();
  const following = followedArtistIds.includes(artist.id);
  const artistPlaylists = playlists.filter((playlist) => playlist.trackIds.some((id) => tracks.some((track) => track.id === id)));
  const popularTracks = tracks;
  const albums = [...new Set(tracks.map((track) => track.album))];

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-7">
        <section aria-labelledby="artist-name" className="relative isolate rounded-2xl bg-zinc-100 p-5 sm:p-8">
          <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden rounded-2xl">
            <Artwork color={artist.color} className="absolute inset-y-0 right-0 w-full opacity-40 sm:w-2/3" />
          </div>
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:gap-7">
            <Artwork color={artist.color} className="size-28 shrink-0 rounded-full ring-4 ring-white/60 sm:size-40" />
            <div className="min-w-0 flex-1">
              <p className="text-sm text-zinc-600">Исполнитель</p>
              <h1 id="artist-name" className="mt-2 text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">{artist.name}</h1>
              <p className="mt-3 text-sm text-zinc-600">{artist.listeners.toLocaleString("ru-RU")} слушателей в месяц</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <PlayButton trackId={tracks[0].id} queueIds={tracks.map((item) => item.id)} title={artist.name} showLabel className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white" />
                <button type="button" aria-pressed={following} onClick={() => toggleFollowArtist(artist.id)} className={`h-11 rounded-full border border-zinc-300 bg-white px-5 text-sm font-medium hover:bg-zinc-50 ${focus}`}>{following ? "Вы подписаны" : "Подписаться"}</button>
                <details className="relative">
                  <summary aria-label="Дополнительные действия исполнителя" className={`flex size-11 cursor-pointer list-none items-center justify-center rounded-full bg-white/80 [&::-webkit-details-marker]:hidden ${focus}`}><Icon more /></summary>
                  <div className="absolute top-12 right-0 z-20 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                    <button type="button" onClick={() => setActiveTab("Об исполнителе")} className={`w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 ${focus}`}>Об исполнителе</button>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        <div aria-label="Разделы исполнителя" className="flex flex-wrap gap-2 border-b border-zinc-200 pb-4">
          {tabs.map((tab) => (
            <button key={tab} type="button" aria-pressed={activeTab === tab} onClick={() => setActiveTab(tab)} className={`rounded-full px-4 py-2 text-sm transition-colors ${focus} ${activeTab === tab ? "bg-zinc-800 text-white" : "text-zinc-600 hover:bg-zinc-100"}`}>{tab}</button>
          ))}
        </div>

        <section aria-label={activeTab}>
          <h2 className="mb-4 text-xl font-semibold">{activeTab}</h2>
          {activeTab === "Популярное" && (
            <ol className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
              {popularTracks.map((track, index) => (
                <li key={track.title} className="flex items-center gap-2 py-4 sm:gap-4">
                  <span aria-hidden="true" className="hidden w-4 text-center text-xs text-zinc-400 tabular-nums sm:block">{index + 1}</span>
                  <Artwork color={artist.color} className="size-11 shrink-0 rounded-lg" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium"><Link href={`/track/${track.id}`} className={`rounded hover:underline ${focus}`}>{track.title}</Link></h3>
                    <p className="mt-1 truncate text-xs text-zinc-500">{artist.name}</p>
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums">{track.duration}</span>
                  <PlayButton trackId={track.id} queueIds={tracks.map((item) => item.id)} title={track.title} className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-zinc-100 text-zinc-600" />
                  <details className="relative shrink-0">
                    <summary aria-label={`Действия: ${track.title}`} className={`flex size-9 cursor-pointer list-none items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 [&::-webkit-details-marker]:hidden ${focus}`}><Icon more /></summary>
                    <div className="absolute top-10 right-0 z-20 w-48 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                      <AddToPlaylist trackId={track.id} />
                      <QueueButton trackId={track.id} />
                    </div>
                  </details>
                </li>
              ))}
            </ol>
          )}
          {activeTab === "Альбомы" && (
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {albums.map((title) => (
                <li key={title} className="min-w-0 rounded-2xl border border-zinc-100 p-3">
                  <Link href={`/search?q=${encodeURIComponent(title)}`} className="block hover:underline"><Artwork color={artist.color} className="aspect-square rounded-xl" /><h3 className="mt-3 text-sm font-semibold">{title}</h3></Link>
                  <p className="mt-1 text-xs text-zinc-500">{artist.year} · Альбом</p>
                  <PlayButton trackId={tracks.find((track) => track.album === title)!.id} queueIds={tracks.filter((track) => track.album === title).map((track) => track.id)} title={title} showLabel className="mt-3 flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-2 text-sm" />
                </li>
              ))}
            </ul>
          )}
          {activeTab === "Плейлисты" && (artistPlaylists.length ? <ul className="grid gap-3 sm:grid-cols-2">{artistPlaylists.map((playlist) => <li key={playlist.id}><Link href={`/playlist/${playlist.id}`} className="block rounded-2xl border border-zinc-200 p-5 hover:bg-zinc-50"><h3 className="font-semibold">{playlist.name}</h3><p className="mt-2 text-sm text-zinc-500">Треков: {playlist.trackIds.length} · Из твоей библиотеки</p></Link></li>)}</ul> : <p className="rounded-xl border border-zinc-200 p-5 text-sm text-zinc-500">В твоих плейлистах пока нет этого исполнителя. <Link href="/library#playlist-create" className="text-violet-700 hover:underline">Создать плейлист</Link></p>)}
          {activeTab === "Похожие исполнители" && (
            <ul className="grid grid-cols-2 gap-4 lg:grid-cols-3">
              {similarArtists.map((similar) => (
                <li key={similar.id}>
                  <Link href={`/artist/${similar.id}`} className={`block rounded-2xl border border-zinc-100 p-4 transition-colors hover:bg-zinc-50 ${focus}`}>
                    <Artwork color={similar.color} className="mx-auto aspect-square w-full max-w-44 rounded-full" />
                    <h3 className="mt-4 text-sm font-semibold">{similar.name}</h3>
                    <p className="mt-1 text-xs text-zinc-500">{similar.genre}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {activeTab === "Об исполнителе" && (
            <div className="max-w-2xl rounded-2xl border border-zinc-200 bg-zinc-50 p-5 sm:p-6">
              <p className="text-sm font-medium text-zinc-600">{artist.genre}</p>
              <p className="mt-3 text-sm leading-7 text-zinc-600">{artist.bio}</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
