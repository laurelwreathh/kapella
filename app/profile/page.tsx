"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { useLibrary } from "@/components/LibraryProvider";
import { AuthError } from "@/lib/auth";
import TasteProfileView from "@/components/TasteProfileView";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { favoriteIds, playlists, history, guestHistory, hydrated } = useLibrary();
  const router = useRouter();
  const [error, setError] = useState("");
  if (!user) return null;
  const initials = user.name.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("ru-RU");
  const stats = [
    { title: "Избранные треки", value: favoriteIds.length, href: "/library#favorites-title" },
    { title: "Мои плейлисты", value: playlists.length, href: "/library#playlists-title" },
    { title: "Прослушано треков", value: new Set(history.map((entry) => entry.trackId)).size, href: "/library#history-title" },
  ];
  function signOut() {
    try { logout(); router.replace("/login"); }
    catch (cause) { setError(cause instanceof AuthError ? cause.message : "Не удалось выйти. Попробуй ещё раз."); }
  }
  return <main className="w-full flex-1 bg-white px-4 py-6 text-zinc-900 sm:px-8 sm:py-8">
    <div className="mx-auto max-w-6xl space-y-8">
      <div><h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Мой профиль</h1><p className="mt-2 text-sm text-zinc-500">Твой аккаунт и личная музыкальная библиотека.</p></div>
      <section aria-label="Данные пользователя" className="flex flex-col items-start gap-5 rounded-2xl border border-violet-100 bg-violet-50/50 p-5 sm:flex-row sm:items-center sm:p-7">
        <div aria-hidden="true" className="flex size-20 shrink-0 items-center justify-center rounded-full bg-violet-100 text-2xl font-semibold text-violet-800">{initials}</div>
        <div className="min-w-0 flex-1"><h2 className="break-words text-2xl font-semibold">{user.name}</h2><p className="mt-2 break-all text-sm text-zinc-600">{user.email}</p><p className="mt-2 text-sm text-zinc-500">Дата регистрации: <time dateTime={user.registeredAt}>{new Date(user.registeredAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}</time></p></div>
        <button type="button" onClick={signOut} className="rounded-full border border-zinc-300 bg-white px-5 py-3 text-sm font-medium hover:bg-zinc-50">Выйти</button>
      </section>
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      <section aria-label="Статистика библиотеки" className="grid gap-4 sm:grid-cols-3">{stats.map((stat) => <Link key={stat.title} href={stat.href} className="rounded-2xl border border-zinc-200 p-5 hover:bg-zinc-50"><h2 className="text-sm text-zinc-500">{stat.title}</h2><p className="mt-3 text-3xl font-semibold">{hydrated ? stat.value : "—"}</p></Link>)}</section>
      <p className="text-sm leading-relaxed text-zinc-500">Прослушано треков — число уникальных треков в обычной истории. Всего обычных запусков: {history.length}. Гостевых запусков: {guestHistory.length}; они не влияют на музыкальный вкус.</p>
      <TasteProfileView />
    </div>
  </main>;
}
