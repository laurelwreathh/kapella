"use client";

import Link from "next/link";
import { useLibrary } from "@/components/LibraryProvider";
import { usePathname } from "next/navigation";

type IconName = "music" | "home" | "search" | "library" | "plus";

function SidebarIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    music: <><path d="M9 18V5l11-2v13M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></>,
    home: <><path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z" /></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 5 5" /></>,
    library: <><path d="M4 4h4v16H4zM12 4v16M16 5l4-1 3 15-4 1z" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
  };

  return (
    <svg
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
      {paths[name]}
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { playlists } = useLibrary();
  const navigation: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: "Главная", icon: "home" },
    { href: "/search", label: "Поиск", icon: "search" },
    { href: "/library", label: "Моя библиотека", icon: "library" },
  ];
  return (
    <aside
      aria-label="Боковая панель Kapella"
      className="w-full shrink-0 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-zinc-900 md:sticky md:top-0 md:h-full md:w-60 md:overflow-y-auto md:border-r md:border-b-0 md:py-6"
    >
      <Link
        href="/"
        aria-label="Kapella — главная"
        className="mb-3 flex w-fit items-center gap-3 rounded-lg px-2 text-xl font-bold tracking-tight focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-zinc-600 md:mb-8"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
          <SidebarIcon name="music" />
        </span>
        Kapella
      </Link>

      <nav aria-label="Основная навигация">
        <ul className="flex flex-wrap gap-1 md:block md:space-y-1">
          {navigation.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`flex items-center gap-2 rounded-lg px-2 py-3 text-xs transition-colors hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 sm:text-sm md:gap-3 md:px-3 ${pathname === item.href ? "bg-violet-100 font-semibold text-violet-800" : "text-zinc-600"}`}
            >
              <SidebarIcon name={item.icon} />
              {item.label}
            </Link>
          </li>
          ))}
        </ul>
      </nav>

      <section aria-label="Плейлисты" className="mt-8 hidden md:block">
        <div className="mb-3 flex items-center justify-between pl-3">
          <h2 className="text-sm font-semibold">Плейлисты</h2>
          <Link href="/library#playlist-create" aria-label="Создать новый плейлист" className="flex size-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-600">
            <SidebarIcon name="plus" />
          </Link>
        </div>
        <ul className="space-y-1">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <Link href={`/playlist/${playlist.id}`} aria-current={pathname === `/playlist/${playlist.id}` ? "page" : undefined} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-200 focus-visible:outline-2 focus-visible:outline-zinc-600 ${pathname === `/playlist/${playlist.id}` ? "bg-zinc-200 font-semibold" : "text-zinc-600"}`}>
                <span className="flex size-8 shrink-0 items-center justify-center rounded bg-zinc-200 text-zinc-500"><SidebarIcon name="music" /></span>
                <span className="truncate">{playlist.name}</span>
              </Link>
            </li>
          ))}
          {playlists.length === 0 && <li className="px-3 py-2 text-xs text-zinc-500">Твои плейлисты появятся здесь.</li>}
        </ul>
      </section>
    </aside>
  );
}
