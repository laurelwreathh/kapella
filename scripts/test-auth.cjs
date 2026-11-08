// Run with node scripts/test-auth.cjs. Uses the project's existing TypeScript compiler.
/* eslint-disable @typescript-eslint/no-require-imports -- Standalone CommonJS tests. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
require.extensions['.ts'] = (module, filename) => {
  const output = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  module._compile(output.replace(/require\("@\/(.*?)"\)/g, (_, relative) => `require(${JSON.stringify(path.join(root, relative))})`), filename);
};
const auth = require('../lib/auth.ts');
const library = require('../lib/library-storage.ts');
const data = new Map();
global.window = { localStorage: { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) } };
const registration = { name: ' Анна ', email: ' Anna@Example.com ', password: 'test-only-123', confirmPassword: 'test-only-123' };
(async () => {
 assert.equal(auth.restoreAuthSession(), null);
 for (const override of [{ name: ' ' }, { email: 'wrong' }, { password: 'short', confirmPassword: 'short' }, { confirmPassword: '' }, { confirmPassword: 'different' }]) {
  await assert.rejects(auth.registerAccount({ ...registration, ...override }), auth.AuthError);
 }
 const anna = await auth.registerAccount(registration);
 assert.equal(anna.name, 'Анна'); assert.equal(anna.email, 'anna@example.com');
 assert.equal(anna.password, undefined); assert(Number.isFinite(Date.parse(anna.registeredAt)));
 const raw = data.get(auth.AUTH_USERS_KEY);
 assert(!raw.includes(registration.password));
 const credentials = JSON.parse(raw).users[0].password;
 assert.equal(credentials.algorithm, 'PBKDF2-SHA256'); assert.equal(credentials.salt.length, 32); assert.equal(credentials.hash.length, 64);
 await assert.rejects(auth.registerAccount(registration), /уже зарегистрирован/);
 await assert.rejects(auth.authenticateAccount(anna.email, 'not-the-password'), /Неверный/);
 await assert.rejects(auth.authenticateAccount('unknown@example.com', registration.password), /Неверный/);
 assert.deepEqual(await auth.authenticateAccount('ANNA@EXAMPLE.COM', registration.password), anna);
 auth.saveAuthSession(anna); assert.deepEqual(auth.restoreAuthSession(), anna);
 auth.clearAuthSession(); assert.equal(auth.restoreAuthSession(), null);
 const boris = await auth.registerAccount({ ...registration, name: 'Борис', email: 'boris@example.com' });
 assert.notEqual(anna.id, boris.id);
 const users = JSON.parse(data.get(auth.AUTH_USERS_KEY)).users;
 assert.notEqual(users[0].password.salt, users[1].password.salt);
 assert.notEqual(users[0].password.hash, users[1].password.hash);
 const personal = { ...library.emptyLibraryData(), favoriteIds: [1], playlists: [{ id: 'annas-list', name: 'Моя музыка', description: '', trackIds: [1] }], guestMode: true };
 library.saveLibraryStorage(anna.id, personal);
 auth.saveAuthSession(boris);
 assert.deepEqual(library.loadLibraryStorage(boris.id), library.emptyLibraryData());
 library.saveLibraryStorage(boris.id, { ...library.emptyLibraryData(), favoriteIds: [13] });
 auth.saveAuthSession(anna);
 assert.deepEqual(library.loadLibraryStorage(anna.id).favoriteIds, [1]);
 assert.equal(library.loadLibraryStorage(anna.id).playlists[0].id, 'annas-list');
 assert.equal(library.loadLibraryStorage(anna.id).guestMode, true);
 assert.deepEqual(library.loadLibraryStorage(boris.id).favoriteIds, [13]);
 // The old unowned library is preserved but is not assigned to new accounts.
 data.set(library.LIBRARY_STORAGE_KEY, JSON.stringify({ version: 1, ...personal }));
 assert.deepEqual(library.loadLibraryStorage('new-user'), library.emptyLibraryData());
 data.set(auth.AUTH_SESSION_KEY, '{bad'); assert.equal(auth.restoreAuthSession(), null);
 data.set(auth.AUTH_SESSION_KEY, JSON.stringify({ version: 1, userId: 'not-a-user' })); assert.equal(auth.restoreAuthSession(), null);
 data.set(auth.AUTH_USERS_KEY, '{bad');
 await assert.rejects(auth.registerAccount({ ...registration, email: 'next@example.com' }), /повреждены/);
 assert.equal(data.get(auth.AUTH_USERS_KEY), '{bad');
 global.window = { get localStorage() { throw new Error('Denied'); } };
 assert.equal(auth.restoreAuthSession(), null);
 await assert.rejects(auth.authenticateAccount(anna.email, registration.password), auth.AuthError);
 await assert.rejects(auth.registerAccount(registration), auth.AuthError);
 assert.throws(auth.clearAuthSession, auth.AuthError);
 console.log('PASS: registration validation, duplicate email, salted password hashes, login/logout/session restore, per-user library isolation, unowned legacy data, corrupted/denied storage');
})().catch(error => { console.error(error); process.exitCode = 1; });
