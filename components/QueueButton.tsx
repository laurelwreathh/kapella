"use client";

import { usePlayer } from "@/components/PlayerProvider";

export default function QueueButton({ trackId }: { trackId: number }) {
  const { enqueue, queue, index, currentTrack } = usePlayer();
  const current = currentTrack.id === trackId;
  const next = queue[index + 1]?.id === trackId;
  return <button type="button" disabled={current || next} onClick={() => enqueue(trackId)} className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-zinc-100 disabled:text-zinc-400">{current ? "Сейчас играет" : next ? "Следующий в очереди" : "Следующим в очередь"}</button>;
}
