// Локальная демонстрационная авторизация. Клиентское хранилище и проверка
// маршрутов не заменяют серверную авторизацию и безопасную production-сессию.
export type AuthUser = { id: string; name: string; email: string; registeredAt: string };
type StoredUser = AuthUser & {
  password: { algorithm: "PBKDF2-SHA256"; iterations: number; salt: string; hash: string };
};
export type RegisterInput = { name: string; email: string; password: string; confirmPassword: string };
export const AUTH_USERS_KEY = "kapella-auth-users-v1";
export const AUTH_SESSION_KEY = "kapella-auth-session-v1";
export const MIN_PASSWORD_LENGTH = 8;
const ITERATIONS = 210_000;

export class AuthError extends Error {}

function storage(): Storage {
  try { return window.localStorage; }
  catch { throw new AuthError("Хранилище браузера недоступно. Разреши локальное хранение данных для входа."); }
}

function read(key: string) {
  try { return storage().getItem(key); }
  catch { throw new AuthError("Не удалось прочитать данные аккаунта. Проверь доступ к хранилищу браузера."); }
}

function write(key: string, value: unknown) {
  try { storage().setItem(key, JSON.stringify(value)); }
  catch { throw new AuthError("Не удалось сохранить аккаунт или сессию. Проверь доступ и свободное место в хранилище браузера."); }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function normalizedEmail(email: string) { return email.trim().toLowerCase(); }
function validEmail(email: string) { return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }

function accounts(): StoredUser[] {
  const raw = read(AUTH_USERS_KEY);
  if (raw === null) return [];
  try {
    const saved: unknown = JSON.parse(raw);
    if (!isRecord(saved) || saved.version !== 1 || !Array.isArray(saved.users)) throw new Error();
    const emails = new Set<string>();
    const ids = new Set<string>();
    return saved.users.map((value): StoredUser => {
      if (!isRecord(value) || typeof value.id !== "string" || !/^[a-zA-Z0-9_-]{1,100}$/.test(value.id) || ids.has(value.id)) throw new Error();
      if (typeof value.name !== "string" || !value.name.trim() || value.name.length > 80) throw new Error();
      if (typeof value.email !== "string" || !validEmail(value.email) || normalizedEmail(value.email) !== value.email || emails.has(value.email)) throw new Error();
      if (typeof value.registeredAt !== "string" || !Number.isFinite(Date.parse(value.registeredAt))) throw new Error();
      const password = value.password;
      if (!isRecord(password) || password.algorithm !== "PBKDF2-SHA256" || password.iterations !== ITERATIONS
        || typeof password.salt !== "string" || !/^[a-f0-9]{32}$/.test(password.salt)
        || typeof password.hash !== "string" || !/^[a-f0-9]{64}$/.test(password.hash)) throw new Error();
      ids.add(value.id); emails.add(value.email);
      return { id: value.id, name: value.name, email: value.email, registeredAt: value.registeredAt,
        password: { algorithm: "PBKDF2-SHA256", iterations: ITERATIONS, salt: password.salt, hash: password.hash } };
    });
  } catch {
    // Повреждённые аккаунты не перезаписываются пустым массивом.
    throw new AuthError("Локальные данные аккаунтов повреждены. Используй другой профиль браузера или восстанови локальные данные.");
  }
}

function publicUser(user: StoredUser): AuthUser {
  return { id: user.id, name: user.name, email: user.email, registeredAt: user.registeredAt };
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}
function fromHex(value: string): Uint8Array<ArrayBuffer> {
  return new Uint8Array(value.match(/.{2}/g)!.map((pair) => parseInt(pair, 16)));
}

async function hashPassword(password: string, salt: Uint8Array<ArrayBuffer>) {
  if (!globalThis.crypto?.subtle) throw new AuthError("Для входа открой Kapella через localhost или HTTPS: требуется Web Crypto.");
  const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: ITERATIONS }, key, 256);
  return toHex(new Uint8Array(bits));
}

function passwordMatches(actual: string, expected: string) {
  let difference = actual.length ^ expected.length;
  for (let i = 0; i < actual.length; i++) difference |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return difference === 0;
}

export async function registerAccount(input: RegisterInput): Promise<AuthUser> {
  const name = input.name.trim();
  const email = normalizedEmail(input.email);
  if (!name || name.length > 80) throw new AuthError("Введи имя пользователя — от 1 до 80 символов.");
  if (!validEmail(email)) throw new AuthError("Введи корректный email.");
  if (input.password.length < MIN_PASSWORD_LENGTH || input.password.length > 128) throw new AuthError("Пароль должен содержать от 8 до 128 символов.");
  if (!input.confirmPassword || input.password !== input.confirmPassword) throw new AuthError("Пароли должны совпадать.");
  if (accounts().some((user) => user.email === email)) throw new AuthError("Этот email уже зарегистрирован. Войди в аккаунт.");
  if (!globalThis.crypto?.subtle) throw new AuthError("Для регистрации открой Kapella через localhost или HTTPS.");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(input.password, salt);
  // Повторная проверка после асинхронного хеширования не теряет новые аккаунты.
  const users = accounts();
  if (users.some((user) => user.email === email)) throw new AuthError("Этот email уже зарегистрирован. Войди в аккаунт.");
  const user: StoredUser = { id: crypto.randomUUID(), name, email, registeredAt: new Date().toISOString(),
    password: { algorithm: "PBKDF2-SHA256", iterations: ITERATIONS, salt: toHex(salt), hash } };
  write(AUTH_USERS_KEY, { version: 1, users: [...users, user] });
  return publicUser(user);
}

export async function authenticateAccount(email: string, password: string): Promise<AuthUser> {
  if (!validEmail(normalizedEmail(email)) || !password || password.length > 128) throw new AuthError("Введи email и пароль.");
  const user = accounts().find((account) => account.email === normalizedEmail(email));
  if (!user || !passwordMatches(await hashPassword(password, fromHex(user.password.salt)), user.password.hash)) {
    throw new AuthError("Неверный email или пароль.");
  }
  return publicUser(user);
}

export function saveAuthSession(user: AuthUser) {
  if (!accounts().some((account) => account.id === user.id)) throw new AuthError("Аккаунт не найден. Войди снова.");
  write(AUTH_SESSION_KEY, { version: 1, userId: user.id });
}

export function restoreAuthSession(): AuthUser | null {
  try {
    const saved: unknown = JSON.parse(read(AUTH_SESSION_KEY) ?? "null");
    if (!isRecord(saved) || saved.version !== 1 || typeof saved.userId !== "string") return null;
    const user = accounts().find((account) => account.id === saved.userId);
    return user ? publicUser(user) : null;
  } catch { return null; }
}

export function clearAuthSession() {
  try { storage().removeItem(AUTH_SESSION_KEY); }
  catch { throw new AuthError("Не удалось завершить сохранённую сессию. Проверь доступ к хранилищу браузера."); }
}
