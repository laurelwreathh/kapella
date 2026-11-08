"use client";

import Link from "next/link";
import { useLibrary } from "@/components/LibraryProvider";

export default function AddToPlaylist({ trackId }: { trackId: number }) {
  const { playlists, addToPlaylist } = useLibrary();
  return (
    <details>
      <summary className="cursor-pointer rounded-lg px-3 py-2 text-sm hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">Добавить в плейлист</summary>
      <div className="max-h-60 overflow-y-auto border-t border-zinc-100 py-2">
        {playlists.length === 0 && <p className="px-3 py-2 text-xs text-zinc-500">Сначала создай свой плейлист.</p>}
        {playlists.map((playlist) => {
          const added = playlist.trackIds.includes(trackId);
          return <button key={playlist.id} type="button" disabled={added} onClick={() => addToPlaylist(playlist.id, trackId)} className="block w-full break-words rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:text-zinc-400 focus-visible:outline-2 focus-visible:outline-zinc-600">{playlist.name}{added ? " · Добавлено" : ""}</button>;
        })}
        <Link href="/library#playlist-create" className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-zinc-600">Создать плейлист</Link>
      </div>
    </details>
  );
}
