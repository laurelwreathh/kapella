"use client";

import { createContext, useContext, useEffect, useCallback, useReducer, useRef, type ReactNode } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import { tracks } from "@/lib/demo-music";
import { initialPlayerState, playerReducer, shuffledQueue, type PlayerState, type RepeatMode } from "@/lib/player-state";

type PlayerContextValue = PlayerState & {
  currentTrack: (typeof tracks)[number];
  playTrack: (id: number, queueIds?: number[]) => void;
  toggle: () => void;
  seek: (time: number) => void;
  setVolume: (volume: number) => void;
  next: () => void;
  previous: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  enqueue: (id: number) => void;
  playQueued: (index: number) => void;
};
const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer() {
  const player = useContext(PlayerContext);
  if (!player) throw new Error("usePlayer requires PlayerProvider");
  return player;
}

export default function PlayerProvider({ children, userId }: { children: ReactNode; userId: string }) {
  const [state, dispatch] = useReducer(playerReducer, tracks, initialPlayerState);
  const audioRef = useRef<HTMLAudioElement>(null);
  const originalQueue = useRef(tracks);
  const currentTrack = state.queue[state.index];
  const src = currentTrack?.audioSrc;
  const { recordPlayback, hydrated } = useLibrary();
  const recordedRevision = useRef<number | null>(null);
  const recordStart = useCallback(() => {
    if (!hydrated || recordedRevision.current === state.revision) return;
    recordedRevision.current = state.revision;
    recordPlayback(currentTrack.id);
  }, [state.revision, currentTrack.id, recordPlayback, hydrated]);

  const preferencesLoaded = useRef(false);
  const preferencesKey = `kapella-player-v1:${userId}`;
  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try {
        const saved: unknown = JSON.parse(localStorage.getItem(preferencesKey) ?? "null");
        if (saved && typeof saved === "object") {
          const settings = saved as Record<string, unknown>;
          const volume = typeof settings.volume === "number" && Number.isFinite(settings.volume) ? Math.max(0, Math.min(1, settings.volume)) : 0.65;
          const repeat: RepeatMode = settings.repeat === "one" || settings.repeat === "all" ? settings.repeat : "off";
          const shuffle = settings.shuffle === true;
          dispatch({ type: "preferences", volume, repeat, shuffle, queue: shuffle ? shuffledQueue(tracks, tracks[0].id) : tracks });
        }
      } catch { /* Недоступное хранилище не мешает работе Player. */ }
      preferencesLoaded.current = true;
    });
    return () => { cancelled = true; };
  }, [preferencesKey]);

  useEffect(() => {
    if (!preferencesLoaded.current) return;
    try {
      localStorage.setItem(preferencesKey, JSON.stringify({ volume: state.volume, shuffle: state.shuffle, repeat: state.repeat }));
    } catch { /* Настройки продолжают работать в текущем сеансе. */ }
  }, [state.volume, state.shuffle, state.repeat, preferencesKey]);

  // Новый запуск, автопереход и повтор фиксируются один раз; пауза/продолжение — нет.
  useEffect(() => {
    if (state.playing && !src) recordStart();
  }, [state.playing, src, recordStart]);

  // Один audio-элемент живёт в корневом layout и не меняется при навигации.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
    if (src) audio.src = src;
    else audio.removeAttribute("src");
    audio.load();
    const time = () => dispatch({ type: "time", time: audio.currentTime });
    const duration = () => dispatch({ type: "duration", duration: audio.duration });
    const ended = () => dispatch({ type: "ended" });
    const error = () => dispatch({ type: "error", message: "Не удалось загрузить аудио. Проверьте локальный файл." });
    if (src) {
      audio.addEventListener("playing", recordStart);
      audio.addEventListener("timeupdate", time);
      audio.addEventListener("loadedmetadata", duration);
      audio.addEventListener("durationchange", duration);
      audio.addEventListener("ended", ended);
      audio.addEventListener("error", error);
    }
    return () => {
      audio.removeEventListener("playing", recordStart);
      audio.removeEventListener("timeupdate", time);
      audio.removeEventListener("loadedmetadata", duration);
      audio.removeEventListener("durationchange", duration);
      audio.removeEventListener("ended", ended);
      audio.removeEventListener("error", error);
      audio.pause();
    };
  }, [src, state.revision, recordStart]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;
    let cancelled = false;
    if (state.playing) {
      void audio.play().catch((error: unknown) => {
        if (!cancelled && !(error instanceof DOMException && error.name === "AbortError")) {
          dispatch({ type: "error", message: "Не удалось начать воспроизведение. Нажмите Play, чтобы повторить." });
        }
      });
    } else audio.pause();
    return () => { cancelled = true; };
  }, [src, state.playing, state.revision]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
  }, [state.volume]);

  // Без audioSrc работает только демонстрационный таймер, без звука.
  useEffect(() => {
    if (src || !state.playing) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      dispatch({ type: "tick", elapsed: (now - last) / 1000 });
      last = now;
    }, 250);
    return () => window.clearInterval(timer);
  }, [src, state.playing, state.revision]);

  function playTrack(id: number, queueIds?: number[]) {
    if (id === currentTrack.id && (!queueIds || queueIds.join(",") === originalQueue.current.map((track) => track.id).join(","))) {
      dispatch({ type: "toggle" });
      return;
    }
    const queue = queueIds ? [...new Set(queueIds)].flatMap((trackId) => tracks.filter((track) => track.id === trackId)) : tracks;
    if (!queue.some((track) => track.id === id)) return;
    originalQueue.current = queue;
    const ordered = state.shuffle ? shuffledQueue(queue, id) : queue;
    dispatch({ type: "select", queue: ordered, index: ordered.findIndex((track) => track.id === id) });
  }

  function enqueue(id: number) {
    const track = tracks.find((item) => item.id === id);
    if (!track || id === currentTrack.id) return;
    const original = originalQueue.current.filter((item) => item.id !== id);
    original.splice(original.findIndex((item) => item.id === currentTrack.id) + 1, 0, track);
    originalQueue.current = original;
    dispatch({ type: "enqueue", track });
  }

  function seek(time: number) {
    const clamped = Math.max(0, Math.min(time, state.duration));
    const audio = audioRef.current;
    if (src && audio) {
      if (audio.readyState === 0) return;
      audio.currentTime = clamped;
    }
    dispatch({ type: "seek", time: clamped });
  }

  return (
    <PlayerContext.Provider value={{ ...state, currentTrack, playTrack, seek, enqueue,
      playQueued: (index) => index === state.index ? dispatch({ type: "toggle" }) : dispatch({ type: "select", queue: state.queue, index }),
      toggle: () => dispatch({ type: "toggle" }),
      next: () => dispatch({ type: "next" }),
      previous: () => dispatch({ type: "previous" }),
      setVolume: (volume) => dispatch({ type: "volume", volume }),
      cycleRepeat: () => dispatch({ type: "repeat" }),
      toggleShuffle: () => dispatch({ type: "shuffle", queue: state.shuffle ? originalQueue.current : shuffledQueue(state.queue, currentTrack.id) }),
    }}>
      {children}
      <audio ref={audioRef} preload="metadata" />
    </PlayerContext.Provider>
  );
}
