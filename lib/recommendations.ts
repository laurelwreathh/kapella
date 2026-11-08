import { artists, genreLabels, type DemoTrack } from "./demo-music";
import type { TasteProfile } from "./taste-profile";

export { buildTasteProfile, tasteProfileKey } from "./taste-profile";
export type { TasteProfile } from "./taste-profile";

export type RecommendationBatch = { tasteKey: string; trackIds: number[]; shownAt: number };
export type ScoreBreakdown = Record<"genre" | "relatedGenre" | "artist" | "similarArtist" | "favorite" | "playlist" | "followed" | "novelty" | "popularity" | "repetition" | "recent" | "exposure", number>;
export type Recommendation = { track: DemoTrack; score: number; reasons: string[]; scoreBreakdown: ScoreBreakdown };
export type RecommendationOptions = {
  limit?: number;
  excludeIds?: readonly number[];
  recentRecommendations?: readonly RecommendationBatch[];
};

// Гостевые прослушивания не являются входом алгоритма, включая штрафы.
// Детская музыка не получает вес через соседство обычных жанров.
const relatedGenres: Record<string, readonly string[]> = {
  electronic: ["indie", "pop"], indie: ["electronic", "acoustic", "pop"],
  pop: ["indie", "electronic"], acoustic: ["indie"], children: [],
};
const WEEK = 7 * 86400000;

export function recommendTracks(
  profile: TasteProfile,
  { limit = 6, excludeIds = [], recentRecommendations = [] }: RecommendationOptions = {},
): Recommendation[] {
  const size = Number.isFinite(limit) ? Math.max(0, Math.floor(limit)) : 6;
  if (size === 0) return [];
  const excluded = new Set(excludeIds);
  const favoriteIds = new Set(profile.favoriteIds);
  const playlistIds = new Set(profile.playlistTrackIds);
  const recentIds = new Set(profile.recentTrackIds);
  const maxGenre = Math.max(0, ...Object.values(profile.genreScores));
  const maxArtist = Math.max(0, ...Object.values(profile.artistScores));
  const hasTaste = maxGenre > 0 || maxArtist > 0;
  const maxListeners = Math.max(1, ...artists.map((artist) => artist.listeners));
  const exposureCounts = new Map<number, number>();
  for (const batch of recentRecommendations) {
    const age = Math.max(0, profile.calculatedAt - batch.shownAt);
    if (!Number.isFinite(age) || age > 4 * WEEK) continue;
    const freshness = Math.pow(0.5, age / WEEK);
    for (const id of new Set(batch.trackIds)) exposureCounts.set(id, (exposureCounts.get(id) ?? 0) + freshness);
  }
  const candidates = profile.catalog.filter((track) => !excluded.has(track.id));
  const freshCandidates = candidates.filter((track) => (profile.trackPlayCounts[track.id] ?? 0) < 3);
  const pool = freshCandidates.length >= Math.min(size, candidates.length) ? freshCandidates : candidates;
  const scored: Recommendation[] = pool.map((track) => {
    const genreAffinity = track.genres.reduce((score, genre) => score
      + (maxGenre ? (profile.genreScores[genre] ?? 0) / maxGenre : 0), 0) / Math.max(track.genres.length, 1);
    const relatedAffinity = track.genres.reduce((score, genre) => score
      + Math.max(0, ...(relatedGenres[genre] ?? []).map((related) => maxGenre
        ? (profile.genreScores[related] ?? 0) / maxGenre : 0)), 0) / Math.max(track.genres.length, 1);
    const artistAffinity = maxArtist ? (profile.artistScores[track.artistId] ?? 0) / maxArtist : 0;
    const similarArtistAffinity = Math.max(0, ...artists.filter((artist) => artist.similarIds.includes(track.artistId))
      .map((artist) => maxArtist ? (profile.artistScores[artist.id] ?? 0) / maxArtist : 0));
    const plays = profile.trackPlayCounts[track.id] ?? 0;
    const artist = artists.find((item) => item.id === track.artistId);
    const scoreBreakdown: ScoreBreakdown = {
      genre: genreAffinity * 6, relatedGenre: relatedAffinity * 1.2, artist: artistAffinity * 3,
      similarArtist: similarArtistAffinity * 1.5,
      favorite: favoriteIds.has(track.id) ? 1 : 0, playlist: playlistIds.has(track.id) ? 0.65 : 0,
      followed: profile.followedArtistIds.includes(track.artistId) ? 0.75 : 0,
      novelty: !plays ? 0.8 : 0, popularity: !hasTaste ? (artist?.listeners ?? 0) / maxListeners : 0,
      repetition: plays ? -Math.log2(plays + 1) * 1.5 : 0, recent: recentIds.has(track.id) ? -1.1 : 0,
      exposure: exposureCounts.has(track.id) ? -Math.min(1.8, Math.log2(1 + exposureCounts.get(track.id)!) * 0.7) : 0,
    };
    const reasons: string[] = [];
    const matchedGenre = [...track.genres].sort((a, b) => (profile.genreScores[b] ?? 0) - (profile.genreScores[a] ?? 0))[0];
    if (favoriteIds.has(track.id)) reasons.push("В твоём избранном");
    if (playlistIds.has(track.id)) reasons.push("Из твоих плейлистов");
    if (profile.followedArtistIds.includes(track.artistId)) reasons.push(`Ты подписан на ${track.artist}`);
    if (genreAffinity > 0 && matchedGenre) reasons.push(`Близко к твоему вкусу: ${genreLabels[matchedGenre] ?? matchedGenre}`);
    if (artistAffinity > 0) reasons.push(`Тебе нравится ${track.artist}`);
    if (similarArtistAffinity > 0) reasons.push("Похож на исполнителей из твоего профиля");
    if (!genreAffinity && relatedAffinity > 0) reasons.push("Похожее звучание любимых жанров");
    if (!plays) reasons.push(hasTaste ? "Новое открытие для тебя" : "Знакомство с каталогом Kapella");
    if (!reasons.length) reasons.push("Попробуй другое звучание");
    return { track, score: Object.values(scoreBreakdown).reduce((sum, value) => sum + value, 0), reasons, scoreBreakdown };
  });

  const selected: Recommendation[] = [];
  const artistCounts = new Map<string, number>();
  const genreCounts = new Map<string, number>();
  const artistCap = Math.max(2, Math.ceil(size / Math.max(1, new Set(pool.map((track) => track.artistId)).size)));
  // Разнообразие входит в окончательный score и порядок, а не в случайную сортировку.
  const rank = ({ track, score }: Recommendation) => score
    - (artistCounts.get(track.artistId) ?? 0) * (hasTaste ? 1.1 : 3)
    - track.genres.reduce((sum, genre) => sum + (genreCounts.get(genre) ?? 0), 0)
      / Math.max(track.genres.length, 1) * (hasTaste ? 0.15 : 1);
  while (scored.length && selected.length < size) {
    const eligible = scored.filter((item) => (artistCounts.get(item.track.artistId) ?? 0) < artistCap);
    const choices = eligible.length ? eligible : scored;
    choices.sort((a, b) => rank(b) - rank(a) || a.track.id - b.track.id);
    const next = choices[0];
    selected.push({ ...next, score: Math.round(rank(next) * 100) / 100 });
    scored.splice(scored.indexOf(next), 1);
    artistCounts.set(next.track.artistId, (artistCounts.get(next.track.artistId) ?? 0) + 1);
    for (const genre of next.track.genres) genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
  }
  return selected;
}
