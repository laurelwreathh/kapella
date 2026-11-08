"use client";

import GuestModeControl from "@/components/GuestModeControl";
import FavoriteButton from "@/components/FavoriteButton";
import Link from "next/link";
import { usePlayer } from "@/components/PlayerProvider";
import { useState, type ReactNode } from "react";

type PlayerIconName = "previous" | "pause" | "play" | "next" | "shuffle" | "repeat" | "volume";

function PlayerIcon({ name }: { name: PlayerIconName }) {
  const icons: Record<PlayerIconName, ReactNode> = {
    previous: <><path d="M5 5v14" /><path d="m19 5-10 7 10 7Z" fill="currentColor" /></>,
    pause: <path d="M6 5h4v14H6zM14 5h4v14h-4z" fill="currentColor" />,
    play: <path d="m8 5 11 7-11 7Z" fill="currentColor" />,
    next: <><path d="M19 5v14" /><path d="m5 5 10 7-10 7Z" fill="currentColor" /></>,
    shuffle: <><path d="M3 6h3c5 0 7 12 12 12h3M3 18h3c2 0 3-2 4-4m4-4c1-2 2-4 4-4h3" /><path d="m18 3 3 3-3 3m0 6 3 3-3 3" /></>,
    repeat: <><path d="M4 10V8a3 3 0 0 1 3-3h13m-3-3 3 3-3 3M20 14v2a3 3 0 0 1-3 3H4m3-3-3 3 3 3" /></>,
    volume: <><path d="M11 4 6 8H3v8h3l5 4ZM15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14" /></>,
  };

  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0"
    >
      {icons[name]}
    </svg>
  );
}

function formatTime(seconds: number) {
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
}

export default function Player() {
  const [queueOpen, setQueueOpen] = useState(false);
  const player = usePlayer();
  const { currentTrack, playing, time, duration, volume, shuffle, repeat, error } = player;
  const controls: { icon: PlayerIconName; label: string; action: () => void; pressed?: boolean }[] = [
    { icon: "shuffle", label: "Перемешать", action: player.toggleShuffle, pressed: shuffle },
    { icon: "previous", label: "Предыдущий трек", action: player.previous },
    { icon: playing ? "pause" : "play", label: playing ? "Пауза" : "Воспроизвести", action: player.toggle },
    { icon: "next", label: "Следующий трек", action: player.next },
    { icon: "repeat", label: `Повтор: ${repeat === "off" ? "выключен" : repeat === "all" ? "очередь" : "один трек"}`, action: player.cycleRepeat, pressed: repeat !== "off" },
  ];
  return (
    <footer
      aria-label="Музыкальный плеер"
      className="relative z-30 shrink-0 border-t border-zinc-200 bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-zinc-900 sm:px-6"
    >
      <GuestModeControl />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 md:grid-cols-[minmax(0,1fr)_minmax(16rem,2fr)_minmax(0,1fr)] md:gap-x-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className={`flex size-12 shrink-0 items-center justify-center rounded-md ${currentTrack.color}`}>
            <svg aria-hidden="true" width="36" height="36" viewBox="0 0 36 36" fill="currentColor">
              <circle cx="25" cy="10" r="4" />
              <path d="m3 29 10-15 7 9 4-5 9 11Z" />
            </svg>
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold"><Link href={`/track/${currentTrack.id}`} className="hover:underline">{currentTrack.title}</Link></p>
            <p className="truncate text-xs text-zinc-500"><Link href={`/artist/${currentTrack.artistId}`} className="hover:underline">{currentTrack.artist}</Link></p>
            {!currentTrack.audioSrc && <p className="text-[10px] text-zinc-500">Демо · без звука</p>}
          </div>
        </div>

        <div className="col-span-2 row-start-2 w-full min-w-0 max-w-xl justify-self-center md:col-span-1 md:col-start-2 md:row-start-1">
          <div className="flex items-center justify-center gap-2">
            {controls.map(({ icon, label, action, pressed }) => (
              <button
                key={icon === "pause" ? "play" : icon}
                type="button"
                onClick={action}
                aria-pressed={pressed}
                aria-label={label}
                title={label}
                className={`relative flex size-10 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 items-center justify-center rounded-full ${
                  icon === "play" || icon === "pause" ? "bg-zinc-800 text-white" : pressed ? "bg-zinc-200 text-zinc-900" : "text-zinc-500"
                }`}
              >
                <PlayerIcon name={icon} />
                {icon === "repeat" && repeat === "one" && <span aria-hidden="true" className="absolute top-0 right-1 text-[10px] font-bold">1</span>}
              </button>
            ))}
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-zinc-500 tabular-nums">
            <span>{formatTime(time)}</span>
            <input
              type="range"
              aria-label="Прогресс воспроизведения"
              aria-valuetext={`${formatTime(time)} из ${formatTime(duration)}`}
              min={0}
              max={duration}
              step={0.1}
              value={time}
              onChange={(event) => player.seek(Number(event.target.value))}
              className="h-4 min-w-0 flex-1 cursor-pointer accent-zinc-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="col-start-2 row-start-1 flex items-center justify-end gap-2 text-zinc-500 md:col-start-3">
        <label className="flex items-center gap-2">
          <span className="sr-only">Громкость</span>
          <PlayerIcon name="volume" />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(volume * 100)}
            onChange={(event) => player.setVolume(Number(event.target.value) / 100)}
            className="h-6 w-12 cursor-pointer accent-violet-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 sm:w-20 lg:w-24"
          />
        </label>
        <button type="button" aria-label="Очередь воспроизведения" aria-expanded={queueOpen} aria-controls="player-queue" onClick={() => setQueueOpen(!queueOpen)} className={`flex size-9 shrink-0 items-center justify-center rounded-full ${queueOpen ? "bg-violet-100 text-violet-700" : "hover:bg-zinc-100"}`}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M3 6h18M3 12h12M3 18h9M18 13v8l4-4Z" /></svg>
        </button>
        <FavoriteButton trackId={currentTrack.id} title={currentTrack.title} compact />
        </div>
      </div>
      {queueOpen && <section id="player-queue" aria-label="Очередь воспроизведения" className="absolute right-2 bottom-[calc(100%+0.5rem)] left-2 max-h-[40dvh] overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl sm:left-auto sm:w-96">
        <div className="mb-3 flex items-center justify-between gap-3"><h2 className="font-semibold">Очередь · {player.queue.length}</h2><button type="button" onClick={() => setQueueOpen(false)} className="rounded-full px-3 py-1 text-sm text-zinc-500">Закрыть</button></div>
        <ol className="space-y-1">{player.queue.map((track, index) => <li key={track.id}>
          <button type="button" aria-current={index === player.index ? "true" : undefined} onClick={() => player.playQueued(index)} className={`flex w-full items-center gap-3 rounded-xl p-2 text-left text-sm hover:bg-zinc-50 ${index === player.index ? "bg-violet-50 text-violet-700" : "text-zinc-600"}`}>
            <span className="text-xs tabular-nums">{index + 1}</span><span className="min-w-0 flex-1 truncate">{track.title}<span className="block truncate text-xs text-zinc-500">{track.artist}</span></span><span className="text-xs">{track.duration}</span>
          </button>
        </li>)}</ol>
      </section>}
      {error && <p role="alert" className="mt-2 text-center text-xs text-red-700">{error}</p>}
    </footer>
  );
}
