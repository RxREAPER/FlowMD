// Auth-error handling in the REAL firebase.js: the authErrorInfo mapper must
// surface the exact Firebase code with an actionable message (not raw SDK
// noise), and resolveRedirectResult must clear stale pending-redirect state
// (signOut) when getRedirectResult rejects — the classic cause of every
// subsequent sign-in failing after an interrupted redirect round-trip.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const src = readFileSync(join(root, 'firebase.js'), 'utf8');

// Load firebase.js with a mock `firebase` compat SDK and collect the
// FirebaseSync object it installs on the window.
function loadFirebaseSync({ redirectRejects = null } = {}) {
  const signOutCalls = [];
  const auth = {
    signOut: async () => { signOutCalls.push('signOut'); },
    getRedirectResult: async () => {
      if (redirectRejects) throw redirectRejects;
      return null;
    }
  };
  const firebaseMock = {
    apps: [],
    initializeApp() {},
    auth: () => auth,
    firestore: () => ({ enablePersistence: async () => {} }),
    analytics: null,
    firestore_FieldValue: { serverTimestamp: () => null }
  };
  const window = { addEventListener() {}, firebase: firebaseMock };
  window.window = window;
  const sandbox = { window, firebase: firebaseMock, console, setTimeout, clearTimeout };
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox);
  return { fs: window.FirebaseSync, signOutCalls };
}

test('authErrorInfo surfaces the exact code with an actionable message', () => {
  const { fs } = loadFirebaseSync();
  const info = fs.authErrorInfo({ code: 'auth/operation-not-allowed', message: 'Firebase: Error (auth/operation-not-allowed).' });
  assert.equal(info.code, 'auth/operation-not-allowed');
  assert.match(info.message, /Google sign-in isn't enabled/);
});

test('authErrorInfo maps network / cancelled / internal codes', () => {
  const { fs } = loadFirebaseSync();
  assert.match(fs.authErrorInfo({ message: 'Firebase: Error (auth/network-request-failed).' }).message, /Network error/);
  assert.match(fs.authErrorInfo({ code: 'auth/redirect-cancelled-by-user' }).message, /closed before it finished/);
  assert.match(fs.authErrorInfo({ code: 'auth/internal-error' }).message, /internal error/);
  assert.match(fs.authErrorInfo({ code: 'auth/redirect-operation-pending' }).message, /still finishing/);
});

test('authErrorInfo falls back to the raw message for unknown codes but still extracts the code', () => {
  const { fs } = loadFirebaseSync();
  const info = fs.authErrorInfo({ message: 'Firebase: Error (auth/some-weird-thing).' });
  assert.equal(info.code, 'auth/some-weird-thing');
  assert.match(info.message, /auth\/some-weird-thing/);
});

test('resolveRedirectResult clears stale pending-redirect state via signOut on failure', async () => {
  const { fs, signOutCalls } = loadFirebaseSync({ redirectRejects: new Error('Firebase: Error (auth/redirect-cancelled-by-user).') });
  await assert.rejects(() => fs.resolveRedirectResult(), /redirect-cancelled-by-user/);
  assert.deepEqual(signOutCalls, ['signOut'], 'stale redirect state must be cleared');
});

test('resolveRedirectResult does not sign out when there is no pending redirect', async () => {
  const { fs, signOutCalls } = loadFirebaseSync(); // getRedirectResult -> null
  const result = await fs.resolveRedirectResult();
  assert.equal(result, null);
  assert.deepEqual(signOutCalls, []);
});
