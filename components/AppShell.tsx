"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Player from "@/components/Player";
import PlayerProvider from "@/components/PlayerProvider";
import LibraryProvider from "@/components/LibraryProvider";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, hydrated } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const authPage = pathname === "/login" || pathname === "/register";
  useEffect(() => {
    if (!hydrated) return;
    if (!user && !authPage) router.replace("/login");
    else if (user && authPage) router.replace("/");
  }, [user, hydrated, authPage, router]);

  // До восстановления сессии защищённое содержимое и данные не монтируются.
  if (!hydrated || (!user && !authPage) || (user && authPage)) return <main className="flex h-full items-center justify-center bg-zinc-50 p-6"><p role="status" className="text-sm text-zinc-500">Загружаем Kapella…</p></main>;
  if (authPage) return <div className="h-full overflow-y-auto bg-zinc-50">{children}</div>;
  if (!user) return null;

  // Смена аккаунта пересоздаёт личные данные и останавливает старый Player.
  return <LibraryProvider key={user.id} userId={user.id}>
    <PlayerProvider userId={user.id}>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto md:flex-row md:overflow-hidden">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col md:overflow-y-auto"><Header />{children}</div>
      </div>
      <Player />
    </PlayerProvider>
  </LibraryProvider>;
}
