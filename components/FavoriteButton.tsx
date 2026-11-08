"use client";

import { useLibrary } from "@/components/LibraryProvider";

export default function FavoriteButton({ trackId, title, compact = false }: { trackId: number; title?: string; compact?: boolean }) {
  const { favoriteIds, toggleFavorite } = useLibrary();
  const favorite = favoriteIds.includes(trackId);
  const label = favorite ? "Убрать из избранного" : "Добавить в избранное";
  return (
    <button type="button" title={label} aria-pressed={favorite} aria-label={title ? `${label}: ${title}` : label} onClick={() => toggleFavorite(trackId)} className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${compact ? "size-8" : "size-11 border border-zinc-200"} ${favorite ? compact ? "bg-violet-50 text-violet-700" : "bg-zinc-100 text-zinc-900" : "text-zinc-500"}`}>
      <svg aria-hidden="true" width={compact ? 18 : 22} height={compact ? 18 : 22} viewBox="0 0 24 24" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" /></svg>
    </button>
  );
}
