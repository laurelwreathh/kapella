"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from "react";
import { artists, tracks } from "@/lib/demo-music";
import { listeningReducer, type ListeningEntry, type GuestListeningEntry } from "@/lib/listening-state";
import { emptyLibraryData, loadLibraryStorage, saveLibraryStorage, validTrackIds, MAX_USER_PLAYLISTS, MAX_RECOMMENDATION_BATCHES, type LibraryData, type UserPlaylist } from "@/lib/library-storage";
import { buildTasteProfile, tasteProfileKey, recommendTracks, type TasteProfile, type Recommendation, type RecommendationOptions } from "@/lib/recommendations";

export type { UserPlaylist } from "@/lib/library-storage";
export type { ListeningEntry } from "@/lib/listening-state";
type LibraryContextValue = {
  hydrated: boolean;
  guestMode: boolean;
  setGuestMode: (enabled: boolean) => void;
  guestHistory: GuestListeningEntry[];
  playlists: UserPlaylist[];
  createPlaylist: (name: string, description: string) => string | null;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (playlistId: string, trackId: number) => void;
  removeFromPlaylist: (playlistId: string, trackId: number) => void;
  updatePlaylistTracks: (playlistId: string, trackIds: number[]) => void;
  favoriteIds: number[];
  history: ListeningEntry[];
  followedArtistIds: string[];
  toggleFollowArtist: (artistId: string) => void;
  toggleFavorite: (trackId: number) => void;
  recordPlayback: (trackId: number) => void;
  tasteProfile: TasteProfile;
  recommendations: Recommendation[];
  getRecommendations: (options?: Omit<RecommendationOptions, "recentRecommendations">) => Recommendation[];
  tasteKey: string;
  recommendationTasteKey: string;
  recordRecommendations: (tasteKey: string, trackIds: number[]) => void;
};
const LibraryContext = createContext<LibraryContextValue | null>(null);
const knownIds = new Set(tracks.map((track) => track.id));
const knownArtistIds = new Set(artists.map((artist) => artist.id));
type RecommendationSnapshot = { items: Recommendation[]; tasteKey: string };
type LibraryState = { data: LibraryData; hydrated: boolean; recommendationSnapshot: RecommendationSnapshot | null };
type LibraryAction =
  | { type: "hydrate"; data: LibraryData }
  | { type: "update"; update: (data: LibraryData) => LibraryData };

function libraryReducer(state: LibraryState, action: LibraryAction): LibraryState {
  if (action.type === "hydrate") {
    if (state.hydrated) return state;
    const tasteKey = tasteProfileKey(action.data);
    const profile = buildTasteProfile(action.data, tracks);
    const recentRecommendations = action.data.recommendationHistory.filter((batch) => batch.tasteKey !== tasteKey);
    return { data: action.data, hydrated: true, recommendationSnapshot: {
      tasteKey, items: recommendTracks(profile, { recentRecommendations }),
    } };
  }
  return state.hydrated ? { ...state, data: action.update(state.data) } : state;
}

export function useLibrary() {
  const library = useContext(LibraryContext);
  if (!library) throw new Error("useLibrary requires LibraryProvider");
  return library;
}

export default function LibraryProvider({ children, userId }: { children: ReactNode; userId: string }) {
  // Сервер и первый клиентский render одинаковы. localStorage читается после hydration.
  const [{ data, hydrated, recommendationSnapshot }, dispatch] = useReducer(libraryReducer, undefined, (): LibraryState => ({ data: emptyLibraryData(), hydrated: false, recommendationSnapshot: null }));
  const ready = useRef(false);
  useEffect(() => {
    const saved = loadLibraryStorage(userId);
    ready.current = true;
    dispatch({ type: "hydrate", data: saved });
  }, [userId]);
  useEffect(() => {
    // Не перезаписываем сохранённую библиотеку пустым SSR-состоянием.
    if (hydrated) saveLibraryStorage(userId, data);
  }, [data, hydrated, userId]);

  const createPlaylist = useCallback((name: string, description: string) => {
    const trimmedName = name.trim();
    if (!hydrated || data.playlists.length >= MAX_USER_PLAYLISTS || !trimmedName || trimmedName.length > 100 || description.trim().length > 500) return null;
    const id = crypto.randomUUID();
    dispatch({ type: "update", update: (current) => ({ ...current, playlists: [...current.playlists, { id, name: trimmedName, description: description.trim(), trackIds: [] }] }) });
    return id;
  }, [hydrated, data.playlists.length]);
  const deletePlaylist = useCallback((id: string) => {
    dispatch({ type: "update", update: (current) => ({ ...current, playlists: current.playlists.filter((item) => item.id !== id) }) });
  }, []);
  const addToPlaylist = useCallback((playlistId: string, trackId: number) => {
    if (!knownIds.has(trackId)) return;
    dispatch({ type: "update", update: (current) => ({ ...current, playlists: current.playlists.map((item) => item.id === playlistId && !item.trackIds.includes(trackId)
      ? { ...item, trackIds: [...item.trackIds, trackId] } : item) }) });
  }, []);
  const removeFromPlaylist = useCallback((playlistId: string, trackId: number) => {
    dispatch({ type: "update", update: (current) => ({ ...current, playlists: current.playlists.map((item) => item.id === playlistId
      ? { ...item, trackIds: item.trackIds.filter((id) => id !== trackId) } : item) }) });
  }, []);
  const updatePlaylistTracks = useCallback((playlistId: string, trackIds: number[]) => {
    const validatedIds = validTrackIds(trackIds);
    dispatch({ type: "update", update: (current) => ({ ...current, playlists: current.playlists.map((item) => item.id === playlistId
      ? { ...item, trackIds: validatedIds } : item) }) });
  }, []);
  const setGuestMode = useCallback((enabled: boolean) => {
    dispatch({ type: "update", update: (current) => ({ ...current, ...listeningReducer(current, { type: "setGuestMode", enabled }) }) });
  }, []);
  const toggleFavorite = useCallback((trackId: number) => {
    if (!knownIds.has(trackId)) return;
    dispatch({ type: "update", update: (current) => ({ ...current, favoriteIds: current.favoriteIds.includes(trackId)
      ? current.favoriteIds.filter((id) => id !== trackId) : [...current.favoriteIds, trackId] }) });
  }, []);
  const toggleFollowArtist = useCallback((artistId: string) => {
    if (!knownArtistIds.has(artistId)) return;
    dispatch({ type: "update", update: (current) => ({ ...current, followedArtistIds: current.followedArtistIds.includes(artistId)
      ? current.followedArtistIds.filter((id) => id !== artistId) : [...current.followedArtistIds, artistId] }) });
  }, []);
  const recordPlayback = useCallback((trackId: number) => {
    if (!ready.current || !knownIds.has(trackId)) return;
    const playedAt = Date.now();
    dispatch({ type: "update", update: (current) => ({ ...current, ...listeningReducer(current, { type: "recordPlayback", trackId, playedAt }) }) });
  }, []);

  const recordRecommendations = useCallback((key: string, trackIds: number[]) => {
    if (!recommendationSnapshot || key !== recommendationSnapshot.tasteKey) return;
    const shownAt = Date.now();
    const ids = validTrackIds(trackIds).slice(0, 6);
    if (!ids.length) return;
    dispatch({ type: "update", update: (current) => {
      if (current.recommendationHistory.some((batch) => batch.tasteKey === key)) return current;
      return { ...current, recommendationHistory: [{ tasteKey: key, trackIds: ids, shownAt }, ...current.recommendationHistory].slice(0, MAX_RECOMMENDATION_BATCHES) };
    } });
  }, [recommendationSnapshot]);

  const { history, favoriteIds, playlists, followedArtistIds, recommendationHistory } = data;
  const tasteInput = useMemo(() => ({ history, favoriteIds, playlists, followedArtistIds }), [history, favoriteIds, playlists, followedArtistIds]);
  const tasteProfile = useMemo(() => buildTasteProfile(tasteInput, tracks), [tasteInput]);
  const tasteKey = useMemo(() => tasteProfileKey(tasteInput, tracks), [tasteInput]);
  // Профиль и подбор для плейлистов актуальны сразу. Список Главной закреплён
  // после загрузки библиотеки и обновляется при перезагрузке, чтобы не прыгать
  // во время Play/Pause, добавления в избранное и переходов между страницами.
  const pastRecommendations = useMemo(() => recommendationHistory.filter((batch) => batch.tasteKey !== tasteKey), [recommendationHistory, tasteKey]);
  const getRecommendations = useCallback((options: Omit<RecommendationOptions, "recentRecommendations"> = {}) => recommendTracks(tasteProfile, { ...options, recentRecommendations: pastRecommendations }), [tasteProfile, pastRecommendations]);
  const recommendations = recommendationSnapshot?.items ?? [];
  const recommendationTasteKey = recommendationSnapshot?.tasteKey ?? tasteKey;

  return (
    <LibraryContext.Provider value={{ ...data, hydrated, setGuestMode, createPlaylist, deletePlaylist, addToPlaylist, removeFromPlaylist, updatePlaylistTracks, toggleFollowArtist, toggleFavorite, recordPlayback, recordRecommendations, tasteProfile, tasteKey, recommendationTasteKey, recommendations, getRecommendations }}>
      {children}
    </LibraryContext.Provider>
  );
}
