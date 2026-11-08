"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
  const router = useRouter();
  const { user } = useAuth();
  const initials = user?.name.split(/\s+/).slice(0, 2).map((part) => Array.from(part)[0]).join("").toLocaleUpperCase("ru-RU");

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = String(new FormData(event.currentTarget).get("q") ?? "").trim();
    router.push(query ? `/search?q=${encodeURIComponent(query)}` : "/search");
  }

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-zinc-200 bg-white px-4 py-4 text-zinc-900 sm:gap-6 sm:px-8">
      <form role="search" onSubmit={search} className="flex min-w-0 flex-1 items-center gap-2 rounded-full bg-zinc-100 px-4 text-zinc-500 focus-within:ring-2 focus-within:ring-zinc-400 sm:max-w-md">
        <label htmlFor="header-search" className="sr-only">
          Поиск по названию трека, исполнителю или тексту песни
        </label>
        <button type="submit" aria-label="Найти музыку" className="shrink-0 cursor-pointer rounded-full hover:text-zinc-900 focus-visible:outline-2 focus-visible:outline-zinc-600"><svg
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
          <circle cx="10.5" cy="10.5" r="6.5" />
          <path d="m16 16 5 5" />
        </svg></button>
        <input
          id="header-search"
          type="search"
          name="q"
          placeholder="Поиск треков, исполнителей, текстов…"
          className="h-11 min-w-0 w-full bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-500"
        />
      </form>

      <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
        <Link
          href={user ? "/profile" : "/login"}
          aria-label={user ? `Профиль пользователя: ${user.name}` : "Войти"}
          className="flex min-h-11 items-center justify-center gap-2 rounded-full px-2 text-zinc-600 hover:bg-violet-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600"
        >
          {user ? <><span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-violet-100 text-sm font-semibold text-violet-800">{initials}</span><span className="hidden max-w-32 truncate text-sm font-medium sm:block">{user.name}</span></> : <>
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="8" r="4" />
            <path d="M5 21v-2a7 7 0 0 1 14 0v2" />
          </svg>
          <span className="text-sm font-medium">Войти</span></>}
        </Link>
      </div>
    </header>
  );
}
