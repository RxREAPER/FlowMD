import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const MODULE_FILES = {
  namespace: 'js/core/namespace.js',
  constants: 'js/core/constants.js',
  sync: 'js/core/sync.js',
  'layout-check': 'js/core/layout-check.js',
  'state-store': 'js/core/state-store.js',
  'source-data': 'js/core/source-data.js'
};

export function createFlowMDSandbox({ modules = ['namespace', 'constants', 'sync'] } = {}) {
  const window = { FlowMD: {} };
  const storage = new Map();
  const setItemCalls = [];
  const localStorage = {
    getItem: (k) => (storage.has(k) ? storage.get(k) : null),
    setItem: (k, v) => { storage.set(k, String(v)); setItemCalls.push(k); },
    removeItem: (k) => { storage.delete(k); },
    clear: () => { storage.clear(); }
  };
  const sandbox = { window, console, Date, JSON, Math, String, parseInt, setTimeout, clearTimeout, localStorage };
  vm.createContext(sandbox);
  modules.forEach((name) => {
    const rel = MODULE_FILES[name];
    if (rel) vm.runInContext(readFileSync(join(root, rel), 'utf8'), sandbox, { filename: rel });
  });
  return { FlowMD: window.FlowMD, localStorage, setItemCalls };
}

export function loadFlowMD(opts = {}) {
  return createFlowMDSandbox(opts).FlowMD;
}
