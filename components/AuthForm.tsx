"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthError, MIN_PASSWORD_LENGTH } from "@/lib/auth";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const registration = mode === "register";
  const { login, register } = useAuth();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(""); setPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const email = String(data.get("email") ?? "");
      const password = String(data.get("password") ?? "");
      if (registration) await register({ name: String(data.get("name") ?? ""), email, password, confirmPassword: String(data.get("confirmPassword") ?? "") });
      else await login(email, password);
      // AppShell перенаправляет после обновления общей сессии.
    } catch (cause) {
      setError(cause instanceof AuthError ? cause.message : "Не удалось войти. Попробуй ещё раз.");
    } finally { setPending(false); }
  }
  const input = "mt-2 block h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100";
  return (
    <main className="flex min-h-full items-center justify-center px-4 py-8 text-zinc-900 sm:py-12">
      <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/login" aria-label="Kapella" className="mb-8 inline-flex items-center gap-3 rounded-lg text-2xl font-bold tracking-tight">
          <span className="flex size-10 items-center justify-center rounded-xl bg-zinc-900 text-white"><svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l11-2v13M9 9l11-2" /><ellipse cx="6" cy="18" rx="3" ry="3" /><ellipse cx="17" cy="16" rx="3" ry="3" /></svg></span>
          Kapella
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">{registration ? "Создать аккаунт" : "Вход в Kapella"}</h1>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">{registration ? "Сохраняй любимую музыку и собирай свои плейлисты." : "Твоя библиотека и персональная музыка ждут тебя."}</p>
        <form method="post" noValidate onSubmit={submit} aria-label={registration ? "Регистрация" : "Вход"} className="mt-6">
          <fieldset disabled={pending} className="space-y-4 disabled:opacity-70">
            {registration && <label className="block text-sm font-medium">Имя пользователя<input name="name" type="text" autoComplete="nickname" required maxLength={80} className={input} /></label>}
            <label className="block text-sm font-medium">Email<input name="email" type="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required maxLength={254} className={input} /></label>
            <label className="block text-sm font-medium">Пароль<input name="password" type="password" autoComplete={registration ? "new-password" : "current-password"} required minLength={registration ? MIN_PASSWORD_LENGTH : undefined} maxLength={128} aria-describedby={registration ? "password-hint" : undefined} className={input} /></label>
            {registration && <><p id="password-hint" className="text-xs text-zinc-500">От {MIN_PASSWORD_LENGTH} до 128 символов.</p><label className="block text-sm font-medium">Повтор пароля<input name="confirmPassword" type="password" autoComplete="new-password" required maxLength={128} className={input} /></label></>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{error}</p>}
            <button type="submit" aria-busy={pending} className="h-12 w-full rounded-full bg-violet-600 px-5 text-sm font-semibold text-white hover:bg-violet-700 disabled:cursor-wait">{pending ? "Подожди…" : registration ? "Зарегистрироваться" : "Войти"}</button>
          </fieldset>
        </form>
        <p className="mt-5 text-center text-sm text-zinc-500">{registration ? "Уже есть аккаунт? " : "Ещё нет аккаунта? "}<Link href={registration ? "/login" : "/register"} className="rounded font-medium text-violet-700 hover:underline">{registration ? "Войти" : "Зарегистрироваться"}</Link></p>
      </div>
    </main>
  );
}
