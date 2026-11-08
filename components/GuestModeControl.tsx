"use client";

import { useLibrary } from "@/components/LibraryProvider";

export default function GuestModeControl() {
  const { guestMode, setGuestMode, hydrated } = useLibrary();
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-zinc-100 pb-3">
      <button
        type="button"
        disabled={!hydrated}
        role="switch"
        aria-checked={guestMode}
        aria-label="Гостевой режим"
        aria-describedby="guest-mode-description"
        onClick={() => setGuestMode(!guestMode)}
        className={`flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-3 py-2 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600 ${guestMode ? "bg-violet-100 text-violet-800" : "bg-zinc-100 text-zinc-600"}`}
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
          <circle cx="9" cy="7" r="3" /><path d="M3 21v-2a6 6 0 0 1 12 0v2M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 5v2" />
        </svg>
        Гостевой режим: {guestMode ? "включён" : "выключен"}
        <span aria-hidden="true" className={`flex h-4 w-7 items-center rounded-full p-0.5 ${guestMode ? "justify-end bg-zinc-700" : "justify-start bg-zinc-300"}`}><span className="size-3 rounded-full bg-white" /></span>
      </button>
      <p id="guest-mode-description" role="status" className="min-w-0 flex-1 basis-48 text-xs leading-relaxed text-zinc-500">
        {guestMode
          ? "Новые запуски хранятся отдельно и не влияют на твой вкус и рекомендации."
          : "Включи для музыки, которую слушаешь для ребёнка или друзей."}
      </p>
    </div>
  );
}
