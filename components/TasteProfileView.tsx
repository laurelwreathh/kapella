"use client";

import Link from "next/link";
import { useLibrary } from "@/components/LibraryProvider";

export default function TasteProfileView() {
  const { tasteProfile, guestHistory, hydrated } = useLibrary();
  const hasTaste = tasteProfile.topGenres.length > 0;
  return (
    <section id="taste-profile" aria-labelledby="taste-title" className="scroll-mt-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="taste-title" className="text-xl font-semibold">Мой музыкальный вкус</h2>
        <Link href="/#recommendations" className="text-sm font-medium text-violet-700 hover:underline">Открыть рекомендации →</Link>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-zinc-600">Обычные запуски: <strong data-testid="normal-play-count">{tasteProfile.totalPlays}</strong>. Гостевые запуски: <strong data-testid="guest-play-count">{guestHistory.length}</strong> — исключены из профиля.</p>
      <p className="mt-2 text-xs leading-relaxed text-zinc-500">Избранное и добавление в плейлист — явный выбор музыки, они учитываются в любом режиме. Повторное продолжение после паузы не считается новым запуском.</p>
      {hydrated && tasteProfile.totalPlays > 0 && <p className="mt-2 text-xs text-zinc-500">Уникальных треков: {tasteProfile.listeningStats.uniqueTracks} · Повторных запусков: {tasteProfile.listeningStats.repeatPlays} · За последние 7 дней: {tasteProfile.listeningStats.recentPlays}</p>}
      {!hydrated ? <p className="mt-4 text-sm text-zinc-500">Загружаем профиль…</p> : hasTaste ? <div className="mt-5 grid gap-6 lg:grid-cols-3">
        <div><h3 className="text-sm font-semibold">Любимые жанры</h3><ul className="mt-3 flex flex-wrap gap-2">{tasteProfile.topGenres.slice(0, 4).map((item) => <li key={item.genre}><Link href={`/search?q=${item.genre}`} className="inline-block rounded-full bg-white px-3 py-2 text-xs text-violet-800 hover:bg-violet-100">{item.label}</Link></li>)}</ul></div>
        <div><h3 className="text-sm font-semibold">Топ исполнителей</h3><ol className="mt-3 space-y-2 text-sm text-zinc-600">{tasteProfile.topArtists.slice(0, 3).map((item) => <li key={item.artistId}><Link href={`/artist/${item.artistId}`} className="hover:underline">{item.name}</Link></li>)}</ol></div>
        <div><h3 className="text-sm font-semibold">Чаще всего слушаешь</h3>{tasteProfile.mostPlayed.length ? <ol className="mt-3 space-y-2 text-sm text-zinc-600">{tasteProfile.mostPlayed.slice(0, 3).map(({ track, count }) => <li key={track.id} className="flex justify-between gap-3"><Link href={`/track/${track.id}`} className="truncate hover:underline">{track.title}</Link><span className="shrink-0 text-xs">Запусков: {count}</span></li>)}</ol> : <p className="mt-3 text-sm text-zinc-500">Запусти трек в обычном режиме.</p>}</div>
      </div> : <p className="mt-4 text-sm text-zinc-500">Профиль пока пуст. Послушай трек, добавь его в избранное или в свой плейлист.</p>}
    </section>
  );
}
