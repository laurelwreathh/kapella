import { genreLabels, tracks, type DemoTrack } from "./demo-music";

// Only the ordinary history is an input. The runtime checks also reject
// misclassified or restored guest events before they can influence the profile.
export type TasteProfileInput = {
  history: readonly {
    trackId: number;
    playedAt: number;
    mode?: string;
    eligibleForRecommendations?: boolean;
  }[];
  favoriteIds: readonly number[];
  playlists: readonly { trackIds: readonly number[] }[];
  followedArtistIds?: readonly string[];
};

export type TasteProfile = {
  totalPlays: number;
  artistScores: Record<string, number>;
  genreScores: Record<string, number>;
  trackPlayCounts: Record<number, number>;
  recentTrackIds: number[];
  favoriteIds: number[];
  playlistTrackIds: number[];
  followedArtistIds: string[];
  favoriteArtistIds: string[];
  favoriteGenreIds: string[];
  listeningStats: { totalPlays: number; uniqueTracks: number; repeatPlays: number; recentPlays: number };
  calculatedAt: number;
  topArtists: { artistId: string; name: string; score: number }[];
  topGenres: { genre: string; label: string; score: number }[];
  mostPlayed: { track: DemoTrack; count: number }[];
  catalog: readonly DemoTrack[];
};

const DAY = 24 * 60 * 60 * 1000;

function tasteSignals(input: TasteProfileInput, catalog: readonly DemoTrack[]) {
  const byId = new Map(catalog.map((track) => [track.id, track]));
  const normalHistory = input.history.filter((entry) => entry.mode === "normal"
    && entry.eligibleForRecommendations === true
    && Number.isFinite(entry.playedAt) && byId.has(entry.trackId));
  const knownIds = (ids: readonly number[]) => [...new Set(ids.filter((id) => byId.has(id)))];
  const artistIds = new Set(catalog.map((track) => track.artistId));
  return { byId, normalHistory, favorites: knownIds(input.favoriteIds),
    playlistTrackIds: knownIds(input.playlists.flatMap((playlist) => playlist.trackIds)),
    followedArtistIds: [...new Set((input.followedArtistIds ?? []).filter((id) => artistIds.has(id)))] };
}

// ID событий, названия плейлистов и гостевые данные не меняют профиль вкуса.
// Ключ стабилен после восстановления localStorage и нужен для учёта показов.
export function tasteProfileKey(input: TasteProfileInput, catalog: readonly DemoTrack[] = tracks): string {
  const signals = tasteSignals(input, catalog);
  return JSON.stringify(["taste-v2",
    signals.normalHistory.map(({ trackId, playedAt }) => [trackId, playedAt]).sort((a, b) => a[1] - b[1] || a[0] - b[0]),
    signals.favorites.sort((a, b) => a - b), signals.playlistTrackIds.sort((a, b) => a - b), signals.followedArtistIds.sort()]);
}

export function buildTasteProfile(
  input: TasteProfileInput,
  catalog: readonly DemoTrack[] = tracks,
  now = Date.now(),
): TasteProfile {
  const { byId, normalHistory, favorites, playlistTrackIds, followedArtistIds } = tasteSignals(input, catalog);
  const knownUniqueIds = (ids: readonly number[]) => [...new Set(ids.filter((id) => byId.has(id)))];
  const trackPlayCounts: Record<number, number> = {};
  const artistScores: Record<string, number> = {};
  const genreScores: Record<string, number> = {};

  for (const entry of normalHistory) {
    trackPlayCounts[entry.trackId] = (trackPlayCounts[entry.trackId] ?? 0) + 1;
  }
  function addInterest(track: DemoTrack, weight: number) {
    artistScores[track.artistId] = (artistScores[track.artistId] ?? 0) + weight;
    for (const genre of track.genres) {
      genreScores[genre] = (genreScores[genre] ?? 0) + weight / Math.max(track.genres.length, 1);
    }
  }
  for (const entry of normalHistory) {
    const age = Math.max(0, now - entry.playedAt);
    // Interest has a 14-day half-life; repeated plays have diminishing weight.
    const freshness = 0.2 + 0.8 * Math.pow(0.5, age / (14 * DAY));
    addInterest(byId.get(entry.trackId)!, 2 * freshness / Math.sqrt(trackPlayCounts[entry.trackId]));
  }
  for (const id of favorites) addInterest(byId.get(id)!, 4);
  for (const id of playlistTrackIds) addInterest(byId.get(id)!, 2.5);
  for (const artistId of followedArtistIds) {
    artistScores[artistId] = (artistScores[artistId] ?? 0) + 3;
    const genres = new Set(catalog.filter((track) => track.artistId === artistId).flatMap((track) => track.genres));
    for (const genre of genres) genreScores[genre] = (genreScores[genre] ?? 0) + 3 / genres.size;
  }

  const recentTrackIds = knownUniqueIds([...normalHistory]
    .filter((entry) => now - entry.playedAt <= 7 * DAY)
    .sort((a, b) => b.playedAt - a.playedAt || b.trackId - a.trackId)
    .map((entry) => entry.trackId)).slice(0, 12);
  const artistNames = new Map(catalog.map((track) => [track.artistId, track.artist]));
  return {
    totalPlays: normalHistory.length,
    artistScores,
    genreScores,
    trackPlayCounts,
    recentTrackIds,
    favoriteIds: favorites,
    playlistTrackIds,
    followedArtistIds,
    favoriteArtistIds: [...new Set([...favorites.map((id) => byId.get(id)!.artistId), ...followedArtistIds])],
    favoriteGenreIds: [...new Set(catalog.filter((track) => favorites.includes(track.id) || followedArtistIds.includes(track.artistId)).flatMap((track) => track.genres))],
    calculatedAt: now,
    listeningStats: { totalPlays: normalHistory.length, uniqueTracks: Object.keys(trackPlayCounts).length,
      repeatPlays: normalHistory.length - Object.keys(trackPlayCounts).length,
      recentPlays: normalHistory.filter((entry) => now - entry.playedAt <= 7 * DAY).length },
    topArtists: Object.entries(artistScores)
      .sort(([aId, a], [bId, b]) => b - a || aId.localeCompare(bId))
      .map(([artistId, score]) => ({ artistId, name: artistNames.get(artistId) ?? artistId, score })),
    topGenres: Object.entries(genreScores)
      .sort(([aId, a], [bId, b]) => b - a || aId.localeCompare(bId))
      .map(([genre, score]) => ({ genre, label: genreLabels[genre] ?? genre, score })),
    mostPlayed: Object.entries(trackPlayCounts)
      .map(([id, count]) => ({ track: byId.get(Number(id))!, count }))
      .sort((a, b) => b.count - a.count || a.track.id - b.track.id),
    catalog,
  };
}
