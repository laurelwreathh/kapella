"use client";

import AddToPlaylist from "@/components/AddToPlaylist";
import PlayButton from "@/components/PlayButton";
import QueueButton from "@/components/QueueButton";

import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import type { DemoTrack } from "@/lib/demo-music";

const focus = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600";

function Cover({ color, className }: { color: string; className: string }) {
  return (
    <div aria-hidden="true" className={`shrink-0 overflow-hidden rounded-xl ${color} ${className}`}>
      <svg viewBox="0 0 200 200" fill="currentColor" className="h-full w-full">
        <circle cx="140" cy="55" r="28" opacity="0.45" />
        <path d="M-20 200 65 65l93 135ZM80 200l75-100 70 100Z" opacity="0.6" />
      </svg>
    </div>
  );
}

export default function TrackView({ track, year, similarTracks }: {
  track: DemoTrack;
  year: string;
  similarTracks: DemoTrack[];
}) {

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-9">
        <section aria-labelledby="track-title" className="flex flex-col gap-6 sm:flex-row sm:items-center sm:gap-8">
          <Cover color={track.color} className="size-44 sm:size-52 lg:size-60" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-zinc-500">Трек</p>
            <h1 id="track-title" className="mt-2 text-3xl leading-tight font-semibold tracking-tight break-words sm:text-4xl">{track.title}</h1>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              <Link href={`/artist/${track.artistId}`} className={`rounded font-medium text-zinc-700 hover:underline ${focus}`}>{track.artist}</Link>
              {" · "}{track.album}{" · "}{year}{" · "}{track.duration}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <PlayButton trackId={track.id} title={track.title} showLabel className="flex h-11 cursor-pointer items-center gap-2 rounded-full bg-zinc-900 px-5 text-sm font-medium text-white" />
              <FavoriteButton trackId={track.id} />
              <details className="relative">
                <summary aria-label="Дополнительные действия с треком" className={`flex size-11 cursor-pointer list-none items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 [&::-webkit-details-marker]:hidden ${focus}`}>
                  <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="19" cy="12" r="2" /></svg>
                </summary>
                <div className="absolute top-12 right-0 z-20 w-52 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg">
                  <Link href={`/artist/${track.artistId}`} className={`block rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 ${focus}`}>Перейти к исполнителю</Link>
                  <AddToPlaylist trackId={track.id} />
                  <QueueButton trackId={track.id} />
                </div>
              </details>
            </div>
          </div>
        </section>

        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <section aria-labelledby="lyrics-title">
            <h2 id="lyrics-title" className="text-xl font-semibold">Текст песни</h2>
            <p className="mt-5 text-base leading-loose whitespace-pre-line text-zinc-600 sm:text-lg">{track.lyrics || "Текст песни пока недоступен."}</p>
          </section>
          <aside aria-labelledby="similar-title" className="rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 sm:p-5">
            <h2 id="similar-title" className="text-lg font-semibold">Похожие треки</h2>
            <ul className="mt-4 space-y-4">
              {similarTracks.map((similar) => (
                <li key={similar.id} className="flex items-center gap-3">
                  <Link href={`/track/${similar.id}`} aria-label={`Открыть трек: ${similar.title}`} className={`shrink-0 rounded-xl ${focus}`}><Cover color={similar.color} className="size-12" /></Link>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-medium"><Link href={`/track/${similar.id}`} className={`rounded hover:underline ${focus}`}>{similar.title}</Link></h3>
                    <p className="mt-1 truncate text-xs text-zinc-500"><Link href={`/artist/${similar.artistId}`} className={`rounded hover:underline ${focus}`}>{similar.artist}</Link></p>
                  </div>
                  <span className="text-xs text-zinc-500 tabular-nums">{similar.duration}</span>
                </li>
              ))}
            </ul>
          </aside>
        </div>
      </div>
    </main>
  );
}
