"use client";

import { useState, type FormEvent } from "react";
import { useLibrary } from "@/components/LibraryProvider";

export default function PlaylistForm() {
  const { createPlaylist } = useLibrary();
  const [message, setMessage] = useState("");
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "");
    const id = createPlaylist(name, String(data.get("description") ?? ""));
    if (!id) {
      setMessage("Введите название плейлиста — от 1 до 100 символов.");
      return;
    }
    form.reset();
    setMessage(`Плейлист «${name.trim()}» создан.`);
  }
  return (
    <form id="playlist-create" aria-label="Создание плейлиста" onSubmit={submit} className="mt-4 space-y-4 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-5">
      <label className="block text-sm font-medium">Название плейлиста
        <input name="name" required maxLength={100} placeholder="Например, Для прогулки" className="mt-2 block h-11 w-full rounded-lg border border-zinc-200 bg-white px-3 font-normal outline-none focus:ring-2 focus:ring-zinc-400" />
      </label>
      <label className="block text-sm font-medium">Описание плейлиста
        <textarea name="description" maxLength={500} rows={2} placeholder="Какое настроение у этой подборки?" className="mt-2 block w-full resize-y rounded-lg border border-zinc-200 bg-white p-3 font-normal outline-none focus:ring-2 focus:ring-zinc-400" />
      </label>
      <button type="submit" className="rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-600">Создать плейлист</button>
      <p role="status" className="text-sm text-zinc-600">{message}</p>
    </form>
  );
}
