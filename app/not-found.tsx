import Link from "next/link";

export default function NotFound() {
  return <main className="w-full flex-1 bg-white p-6 text-zinc-900 sm:p-8"><div className="mx-auto max-w-6xl rounded-2xl border border-zinc-200 p-6"><p className="text-sm text-violet-700">404</p><h1 className="mt-2 text-2xl font-semibold">Страница не найдена</h1><p className="mt-3 text-sm text-zinc-500">Такого трека, исполнителя или страницы нет в каталоге Kapella.</p><Link href="/search" className="mt-5 inline-block rounded-full bg-violet-600 px-5 py-3 text-sm text-white">Найти музыку</Link></div></main>;
}
