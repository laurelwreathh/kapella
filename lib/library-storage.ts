import { artists, tracks } from "@/lib/demo-music";
import { initialListeningState, MAX_LISTENING_ENTRIES, type GuestListeningEntry, type ListeningEntry, type ListeningState } from "@/lib/listening-state";
import type { RecommendationBatch } from "@/lib/recommendations";

export type UserPlaylist = { id: string; name: string; description: string; trackIds: number[] };
export type LibraryData = ListeningState & {
  favoriteIds: number[];
  playlists: UserPlaylist[];
  followedArtistIds: string[];
  recommendationHistory: RecommendationBatch[];
};

export const LIBRARY_STORAGE_KEY = "kapella-library-v1";
export function libraryStorageKey(userId: string) {
  if (typeof userId !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(userId)) throw new Error("A user ID is required for library storage");
  return `${LIBRARY_STORAGE_KEY}:${userId}`;
}
export const MAX_USER_PLAYLISTS = 100;
export const MAX_RECOMMENDATION_BATCHES = 20;
const knownTrackIds = new Set(tracks.map((track) => track.id));
const knownArtistIds = new Set(artists.map((artist) => artist.id));

export function emptyLibraryData(): LibraryData {
  return { ...initialListeningState, favoriteIds: [], playlists: [], followedArtistIds: [], recommendationHistory: [] };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function validTrackIds(value: unknown): number[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is number => typeof id === "number" && knownTrackIds.has(id)))] : [];
}

function parsePlaylists(value: unknown): UserPlaylist[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item): UserPlaylist[] => {
    if (!isRecord(item) || typeof item.id !== "string" || !/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(item.id) || seen.has(item.id)) return [];
    if (typeof item.name !== "string" || !item.name.trim() || item.name.trim().length > 100) return [];
    if (typeof item.description !== "string" || item.description.length > 500) return [];
    seen.add(item.id);
    return [{ id: item.id, name: item.name.trim(), description: item.description.trim(), trackIds: validTrackIds(item.trackIds) }];
  }).slice(0, MAX_USER_PLAYLISTS);
}

function parseHistory(value: unknown, mode: "normal"): ListeningEntry[];
function parseHistory(value: unknown, mode: "guest"): GuestListeningEntry[];
function parseHistory(value: unknown, mode: "normal" | "guest"): (ListeningEntry | GuestListeningEntry)[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): (ListeningEntry | GuestListeningEntry)[] => {
    // Массив сам по себе не определяет контекст: нужны оба явных маркера.
    // Гостевое событие, ошибочно попавшее в history, не становится предпочтением.
    if (!isRecord(item) || item.mode !== mode || item.eligibleForRecommendations !== (mode === "normal")) return [];
    if (typeof item.trackId !== "number" || !knownTrackIds.has(item.trackId)) return [];
    if (typeof item.playedAt !== "number" || !Number.isSafeInteger(item.playedAt) || item.playedAt <= 0 || item.playedAt > 8.64e15) return [];
    if (typeof item.id !== "number" || !Number.isSafeInteger(item.id) || item.id <= 0) return [];
    const entry = { id: item.id, trackId: item.trackId, playedAt: item.playedAt };
    return mode === "normal"
      ? [{ ...entry, mode: "normal", eligibleForRecommendations: true }]
      : [{ ...entry, mode: "guest", eligibleForRecommendations: false }];
  }).sort((a, b) => b.playedAt - a.playedAt).slice(0, MAX_LISTENING_ENTRIES);
}

function parseRecommendationHistory(value: unknown): RecommendationBatch[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((item): RecommendationBatch[] => {
    if (!isRecord(item) || typeof item.tasteKey !== "string" || !item.tasteKey.startsWith('["taste-v2",') || item.tasteKey.length > 40000 || seen.has(item.tasteKey)) return [];
    if (typeof item.shownAt !== "number" || !Number.isSafeInteger(item.shownAt) || item.shownAt <= 0 || item.shownAt > 8.64e15) return [];
    const trackIds = validTrackIds(item.trackIds).slice(0, 6);
    if (!trackIds.length) return [];
    seen.add(item.tasteKey);
    return [{ tasteKey: item.tasteKey, shownAt: item.shownAt, trackIds }];
  }).sort((a, b) => b.shownAt - a.shownAt).slice(0, MAX_RECOMMENDATION_BATCHES);
}

export function parseLibraryStorage(raw: string | null): LibraryData {
  if (!raw) return emptyLibraryData();
  try {
    const data: unknown = JSON.parse(raw);
    if (!isRecord(data) || data.version !== 1) return emptyLibraryData();
    const history = parseHistory(data.history, "normal");
    const guestHistory = parseHistory(data.guestHistory, "guest");
    // Нормализуем ID при загрузке, включая коллизии и переполнение из старых данных.
    let nextId = history.length + guestHistory.length;
    return {
      guestMode: data.guestMode === true,
      history: history.map((entry) => ({ ...entry, id: nextId-- })),
      guestHistory: guestHistory.map((entry) => ({ ...entry, id: nextId-- })),
      favoriteIds: validTrackIds(data.favoriteIds),
      playlists: parsePlaylists(data.playlists),
      recommendationHistory: parseRecommendationHistory(data.recommendationHistory),
      followedArtistIds: Array.isArray(data.followedArtistIds)
        ? [...new Set(data.followedArtistIds.filter((id): id is string => typeof id === "string" && knownArtistIds.has(id)))] : [],
    };
  } catch {
    return emptyLibraryData();
  }
}

export function loadLibraryStorage(userId: string): LibraryData {
  try {
    return parseLibraryStorage(window.localStorage.getItem(libraryStorageKey(userId)));
  } catch {
    // Приватный режим или запрет хранилища не мешает работе текущей сессии.
    return emptyLibraryData();
  }
}

export function saveLibraryStorage(userId: string, data: LibraryData): void {
  try {
    window.localStorage.setItem(libraryStorageKey(userId), JSON.stringify({ version: 1, ...data }));
  } catch {
    // При недоступном хранилище библиотека продолжает работать в памяти.
  }
}
