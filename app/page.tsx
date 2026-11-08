"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useLibrary } from "@/components/LibraryProvider";
import MusicCover from "@/components/MusicCover";
import PlayButton from "@/components/PlayButton";
import TrackList from "@/components/TrackList";
import { tracks } from "@/lib/demo-music";

const collections = [
  { genre: "electronic", title: "Электроника", description: "Синтезаторы и новые горизонты", color: "bg-[#e1e8ed] text-[#8fa4b4]" },
  { genre: "indie", title: "Инди", description: "Гитары и истории о близком", color: "bg-[#e0e7df] text-[#8b9f8c]" },
  { genre: "pop", title: "Поп", description: "Мелодии на каждый день", color: "bg-[#e8e3ed] text-[#a296b0]" },
  { genre: "acoustic", title: "Акустика", description: "Музыка без спешки", color: "bg-[#eee6dc] text-[#b5a28d]" },
];

export default function Home() {
  const { recommendations, history, tasteProfile, guestMode, hydrated, recommendationTasteKey: tasteKey, recordRecommendations } = useLibrary();
  const recommended = recommendations.slice(0, 6);
  const recommendedTracks = recommended.map((item) => item.track);
  const reasons = Object.fromEntries(recommended.map((item) => [item.track.id, item.reasons[0]]));
  const explanations = Object.fromEntries(recommended.map((item) => [item.track.id, item.reasons]));
  useEffect(() => {
    if (hydrated) recordRecommendations(tasteKey, recommendations.map((item) => item.track.id));
  }, [hydrated, tasteKey, recommendations, recordRecommendations]);
  const recentIds = [...new Set(history.map((entry) => entry.trackId))].slice(0, 3);
  const recentTracks = recentIds.flatMap((id) => tracks.filter((track) => track.id === id));
  const releases = [...new Map(tracks.map((track) => [track.album, track])).values()].slice(-4);
  const personalized = tasteProfile.topGenres.length > 0;

  return (
    <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
      <div className="mx-auto max-w-6xl space-y-9">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Рады тебя видеть</h1>
          <p className="mt-2 text-sm text-zinc-500">Твоя музыка, новые открытия и любимые мелодии — в Kapella.</p>
        </div>
        <section aria-labelledby="recommendations-title" id="recommendations" className="scroll-mt-5 rounded-2xl border border-violet-100 bg-violet-50/60 p-5 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-5">
            <div className="max-w-xl">
              <p className="text-xs font-semibold tracking-widest text-violet-700 uppercase">Kapella · персональный микс</p>
              <h2 id="recommendations-title" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">Рекомендовано для вас</h2>
              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{personalized
                ? "Подборка основана на обычной истории, избранном и твоих плейлистах. Новые предпочтения учтём после перезагрузки страницы."
                : "Начни с разных звучаний. Слушай музыку и сохраняй любимое — после перезагрузки подборка станет персональной."}</p>
              <p className="mt-2 text-xs text-violet-700">{guestMode ? "Гостевой режим включён: новые запуски не меняют эту подборку." : "Гостевые прослушивания исключены из профиля вкуса."}</p>
              {hydrated && personalized && <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-500"><span className="whitespace-nowrap">Обычных запусков: {tasteProfile.totalPlays}</span><span className="whitespace-nowrap">В избранном: {tasteProfile.favoriteIds.length}</span><span className="whitespace-nowrap">В плейлистах: {tasteProfile.playlistTrackIds.length}</span></p>}
            </div>
            {recommendedTracks[0] && <PlayButton trackId={recommendedTracks[0].id} queueIds={recommendedTracks.map((track) => track.id)} title="Рекомендовано для вас" showLabel className="flex h-11 items-center gap-2 rounded-full bg-violet-600 px-5 text-sm font-medium text-white hover:bg-violet-700" />}
          </div>
          {!hydrated ? <p className="text-sm text-zinc-500">Загружаем твой музыкальный вкус…</p> : <TrackList tracks={recommendedTracks} reasons={reasons} explanations={explanations} />}
          <Link href="/profile#taste-profile" className="mt-4 inline-block text-sm font-medium text-violet-700 hover:underline">Мой музыкальный вкус →</Link>
        </section>
        <section aria-labelledby="collections-title">
          <h2 id="collections-title" className="text-xl font-semibold tracking-tight">Найди своё звучание</h2>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {collections.map((collection) => <li key={collection.genre} className="min-w-0">
              <Link href={`/search?q=${collection.genre}`} className="block h-full rounded-2xl border border-zinc-100 bg-zinc-50/60 p-3 hover:border-violet-200">
                <MusicCover color={collection.color} className="aspect-square" />
                <h3 className="mt-3 text-sm font-semibold">{collection.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-zinc-500">{collection.description}</p>
              </Link>
            </li>)}
          </ul>
        </section>
        <section aria-labelledby="continue-title">
          <h2 id="continue-title" className="mb-4 text-xl font-semibold tracking-tight">Продолжить прослушивание</h2>
          {recentTracks.length ? <TrackList tracks={recentTracks} /> : <p className="rounded-2xl border border-zinc-200 p-5 text-sm text-zinc-500">Здесь появятся треки из твоей обычной истории. Гостевая музыка хранится отдельно.</p>}
        </section>
        <section aria-labelledby="popular-title">
          <h2 id="popular-title" className="mb-4 text-xl font-semibold tracking-tight">Популярные треки</h2>
          <TrackList tracks={tracks.slice(0, 4)} />
        </section>
        <section aria-labelledby="releases-title">
          <h2 id="releases-title" className="text-xl font-semibold tracking-tight">Открой новые альбомы</h2>
          <p className="mt-1 text-sm text-zinc-500">Из локального демонстрационного каталога</p>
          <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {releases.map((track) => <li key={track.album} className="min-w-0 rounded-2xl border border-zinc-100 p-3">
              <Link href={`/search?q=${encodeURIComponent(track.album)}`} className="block hover:underline">
                <MusicCover color={track.color} className="aspect-square" />
                <h3 className="mt-3 text-sm font-semibold">{track.album}</h3>
              </Link>
              <Link href={`/artist/${track.artistId}`} className="mt-1 inline-block text-xs text-zinc-500 hover:underline">{track.artist}</Link>
            </li>)}
          </ul>
        </section>
      </div>
    </main>
  );
}
