// Run with node scripts/test-personalization.cjs. Uses the existing TypeScript
// compiler to exercise pure modules without adding a test dependency.
/* eslint-disable @typescript-eslint/no-require-imports -- This standalone runner is a CommonJS script. */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const compiled = ts.transpileModule(fs.readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  });
  module._compile(compiled.outputText, filename);
};

const { tracks } = require("../lib/demo-music.ts");
const { buildTasteProfile, tasteProfileKey } = require("../lib/taste-profile.ts");
const { recommendTracks } = require("../lib/recommendations.ts");
const now = Date.UTC(2026, 10, 2);
const normal = (trackId, id = 1, playedAt = now) => ({ id, trackId, playedAt, mode: "normal", eligibleForRecommendations: true });
const guest = (trackId, id = 1) => ({ id, trackId, playedAt: now, mode: "guest", eligibleForRecommendations: false });
const input = (overrides = {}) => ({ history: [], favoriteIds: [], playlists: [], ...overrides });
const profile = (data) => buildTasteProfile(input(data), tracks, now);
const ids = (recommendations) => recommendations.map((item) => item.track.id);

assert.equal(tracks.length, 21);
assert.equal(new Set(tracks.map((track) => track.id)).size, tracks.length);
assert(tracks.every((track) => track.genres.length && track.lyrics));

const cold = profile();
const coldRecommendations = recommendTracks(cold);
assert.equal(cold.totalPlays, 0);
assert.equal(coldRecommendations.length, 6);
assert(new Set(coldRecommendations.map((item) => item.track.artistId)).size >= 5);
assert.deepEqual(recommendTracks(cold), coldRecommendations, "Cold start must be deterministic");

const electronic = profile({ history: [normal(13)] });
const indie = profile({ history: [normal(3)] });
assert.equal(electronic.topGenres[0].genre, "electronic");
assert(recommendTracks(electronic)[0].track.genres.includes("electronic"));
assert(recommendTracks(indie)[0].track.genres.includes("indie"));
assert.notDeepEqual(ids(recommendTracks(electronic)), ids(recommendTracks(indie)), "Normal listening must change recommendations");
assert.equal(profile({ favoriteIds: [16] }).topGenres[0].genre, "acoustic");
assert.equal(recommendTracks(profile({ favoriteIds: [16] }))[0].track.artistId, "quiet-shore");
assert.equal(profile({ playlists: [{ trackIds: [13, 14] }] }).topGenres[0].genre, "electronic");
assert.equal(recommendTracks(profile({ playlists: [{ trackIds: [13, 14] }] }))[0].track.artistId, "pulse-city");
assert.deepEqual(profile({ playlists: [{ trackIds: [13] }, { trackIds: [13] }] }), profile({ playlists: [{ trackIds: [13] }] }), "Duplicating a saved track must not amplify taste");

const withGuest = profile({ history: [normal(13), ...Array.from({ length: 20 }, (_, index) => guest(19, index + 2))] });
assert.deepEqual(withGuest, electronic, "Guest listening must never change any profile field");
assert.deepEqual(recommendTracks(withGuest), recommendTracks(electronic), "Guest listening must not change recommendations");
assert.equal(profile({ history: [{ ...normal(19), eligibleForRecommendations: false }] }).totalPlays, 0);
assert.equal(profile({ history: [{ ...guest(19), eligibleForRecommendations: true }] }).totalPlays, 0);
assert.equal(profile({ history: [normal(999), { ...normal(13), playedAt: NaN }] }).totalPlays, 0);

const repeated = profile({ history: Array.from({ length: 8 }, (_, index) => normal(13, index + 1)) });
assert.equal(repeated.totalPlays, 8);
assert.equal(repeated.mostPlayed[0].count, 8);
assert(!ids(recommendTracks(repeated)).includes(13), "Overplayed track should give way to alternatives");
assert(recommendTracks(repeated)[0].track.genres.includes("electronic"), "Repetition must retain genre affinity");
assert(!ids(recommendTracks(electronic, { excludeIds: [14, 15], limit: 4 })).some((id) => id === 14 || id === 15));
assert.equal(recommendTracks(electronic, { limit: 0 }).length, 0);
const sparse = buildTasteProfile(input({ history: [normal(13)] }), tracks.filter((track) => track.id === 13), now);
assert.equal(recommendTracks(sparse)[0].track.id, 13, "Small catalogues may reuse tracks rather than return an empty mix");

const freshInterest = profile({ history: [normal(13, 1, now - 120 * 86400000), normal(16, 2)] });
assert.equal(freshInterest.topGenres[0].genre, "acoustic", "Fresh interest should outweigh old equal activity");
assert.deepEqual(freshInterest.recentTrackIds, [16]);
assert(recommendTracks(electronic).every((item) => Number.isFinite(item.score) && item.reasons.length > 0));

const followed = profile({ followedArtistIds: ['pulse-city'] });
assert.equal(followed.topArtists[0].artistId, 'pulse-city');
assert.equal(followed.topGenres[0].genre, 'electronic');
assert(followed.favoriteArtistIds.includes('pulse-city'));
assert.equal(followed.listeningStats.totalPlays, 0, 'Following is an explicit preference, not a play');
assert.equal(recommendTracks(followed)[0].track.artistId, 'pulse-city');
assert.equal(repeated.listeningStats.repeatPlays, 7);
assert.equal(repeated.listeningStats.uniqueTracks, 1);
assert(recommendTracks(electronic, { limit: tracks.length }).find(item => item.track.id === 2).scoreBreakdown.similarArtist > 0, 'Demo artist similarity must contribute');
assert.equal(recommendTracks(electronic, { limit: tracks.length }).find(item => item.track.id === 19).scoreBreakdown.similarArtist, 0);
assert(recommendTracks(electronic).filter(item => item.track.artistId === 'pulse-city').length <= 2, 'Cap one artist when alternatives exist');

const batches = Array.from({ length: 8 }, (_, index) => ({ tasteKey: `previous-${index}`, trackIds: [14], shownAt: now - index * 1000 }));
const exposed = recommendTracks(electronic, { recentRecommendations: batches, limit: tracks.length }).find(item => item.track.id === 14);
assert(exposed.scoreBreakdown.exposure < -1, 'Frequent recent recommendations must be penalized');
assert.equal(recommendTracks(electronic, { limit: tracks.length }).find(item => item.track.id === 14).scoreBreakdown.exposure, 0);
assert.equal(recommendTracks(electronic, { recentRecommendations: [{ ...batches[0], shownAt: now - 40 * 86400000 }], limit: tracks.length }).find(item => item.track.id === 14).scoreBreakdown.exposure, 0, 'Old shows must expire');
assert.notDeepEqual(ids(recommendTracks(electronic, { recentRecommendations: batches })), ids(recommendTracks(electronic)), 'Repeated shows change ranking');
const key = tasteProfileKey(input({ history: [normal(13)] }));
assert.equal(tasteProfileKey(input({ history: [normal(13), guest(19)] })), key, 'Guest events cannot change exposure key');
assert.equal(tasteProfileKey(input({ history: [{ ...normal(13), id: 99 }], playlists: [{ trackIds: [], name: 'Renamed' }] })), key, 'Restored IDs and playlist names cannot invalidate taste');
assert.notEqual(tasteProfileKey(input({ history: [normal(14)] })), key);
assert.notEqual(tasteProfileKey(input({ history: [normal(13)], favoriteIds: [16] })), key);
assert.deepEqual(recommendTracks(withGuest, { recentRecommendations: batches }), recommendTracks(electronic, { recentRecommendations: batches }), 'Exposure penalties do not make guest events leak into scoring');
console.log("PASS: cold start, normal/favorite/playlist/follow signals, genre and artist similarity, guest invariance, recency/repetition/diversity, exposure penalties, stable taste keys");
