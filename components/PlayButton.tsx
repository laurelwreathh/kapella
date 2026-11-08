"use client";

import { usePlayer } from "@/components/PlayerProvider";

export default function PlayButton({ trackId, queueIds, title, className, showLabel = false }: {
  trackId: number;
  queueIds?: number[];
  title: string;
  className: string;
  showLabel?: boolean;
}) {
  const { currentTrack, playing, playTrack, toggle, time, revision } = usePlayer();
  const active = currentTrack.id === trackId && playing;
  // После пересчёта рекомендаций очередь карточки может измениться.
  // Пауза и продолжение текущего трека сохраняют его время и исходную очередь.
  const resumeCurrent = currentTrack.id === trackId && (playing || time > 0 || revision > 0);
  return (
    <button type="button" onClick={() => resumeCurrent ? toggle() : playTrack(trackId, queueIds)} aria-label={`${active ? "Пауза" : "Слушать"}: ${title}`} className={`${className} cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600`}>
      <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        {active ? <path d="M6 5h4v14H6zM14 5h4v14h-4z" /> : <path d="M8 5v14l11-7Z" />}
      </svg>
      {showLabel && (active ? "Пауза" : "Слушать")}
    </button>
  );
}
