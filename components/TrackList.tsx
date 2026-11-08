"use client";

import Link from "next/link";
import FavoriteButton from "@/components/FavoriteButton";
import MusicCover from "@/components/MusicCover";
import PlayButton from "@/components/PlayButton";
import type { DemoTrack } from "@/lib/demo-music";

export default function TrackList({ tracks, reasons, explanations, favorites = true }: {
  tracks: DemoTrack[];
  reasons?: Record<number, string>;
  explanations?: Record<number, string[]>;
  favorites?: boolean;
}) {
  return (
    <ol className="divide-y divide-zinc-100 rounded-2xl border border-zinc-200 px-3 sm:px-4">
      {tracks.map((track) => (
        <li key={track.id} className="flex items-center gap-2 py-3 sm:gap-4" data-track-id={track.id}>
          <Link href={`/track/${track.id}`} aria-label={`Открыть трек: ${track.title}`} className="shrink-0 rounded-xl"><MusicCover color={track.color} className="size-11" /></Link>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-sm font-semibold"><Link href={`/track/${track.id}`} className="hover:underline">{track.title}</Link></h3>
            <p className="mt-1 truncate text-xs text-zinc-500"><Link href={`/artist/${track.artistId}`} className="hover:underline">{track.artist}</Link> · {track.album}</p>
            {explanations?.[track.id] && explanations[track.id].length > 1 ? <details className="mt-1 text-xs text-violet-700"><summary aria-label={`Почему этот трек: ${track.title}`} className="w-fit rounded hover:underline">{reasons?.[track.id]} <span className="text-zinc-500">· Почему?</span></summary><ul className="mt-2 space-y-1 text-zinc-500">{explanations[track.id].slice(1).map((reason) => <li key={reason}>{reason}</li>)}</ul></details> : reasons?.[track.id] && <p className="mt-1 text-xs text-violet-700">{reasons[track.id]}</p>}
          </div>
          <span className="hidden text-xs text-zinc-500 tabular-nums sm:block">{track.duration}</span>
          <PlayButton trackId={track.id} queueIds={tracks.map((item) => item.id)} title={track.title} className="flex size-10 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-700" />
          {favorites && <FavoriteButton trackId={track.id} title={track.title} compact />}
        </li>
      ))}
    </ol>
  );
}
