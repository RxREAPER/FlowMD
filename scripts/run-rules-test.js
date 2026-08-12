#!/usr/bin/env node
/* Runs tests/rules-test.mjs against the Firestore emulator.
   The emulator is a JVM process; this script locates a Java runtime:
     1. JAVA_HOME / java on PATH, if already set
     2. a workspace JRE in ../.tools/jdk-<version> (dev machines only, never committed)
   and fails with a clear message if none exists.
   Usage: npm run test:rules */
const { spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { join, resolve } = require('node:path');

let javaHome = process.env.JAVA_HOME;
const javaOnPath = spawnSync('java', ['-version'], { stdio: 'ignore' }).status === 0;

if (!javaOnPath) {
  if (!javaHome) {
    const toolsDir = resolve(__dirname, '..', '..', '.tools');
    const { readdirSync } = require('node:fs');
    if (existsSync(toolsDir)) {
      const jdk = readdirSync(toolsDir).find((d) => d.toLowerCase().startsWith('jdk') && existsSync(join(toolsDir, d, 'bin', process.platform === 'win32' ? 'java.exe' : 'java')));
      if (jdk) javaHome = join(toolsDir, jdk);
    }
  }
  if (!javaHome || !existsSync(join(javaHome, 'bin', process.platform === 'win32' ? 'java.exe' : 'java'))) {
    console.error('Firestore emulator requires Java. Install a JDK/JRE and set JAVA_HOME, or place one under ../.tools/jdk-<version>/');
    process.exit(1);
  }
  process.env.JAVA_HOME = javaHome;
  process.env.PATH = join(javaHome, 'bin') + (process.platform === 'win32' ? ';' : ':') + process.env.PATH;
}

// npx on Windows resolves via npx.cmd; calling the CLI's JS entry point
// directly with the current node binary is more robust and avoids an extra
// process hop.
const firebaseCli = join(__dirname, '..', 'node_modules', 'firebase-tools', 'lib', 'bin', 'firebase.js');
// emulators:exec takes the command as ONE argument; splitting it confuses
// the CLI's arg parser.
const r = spawnSync(process.execPath, [firebaseCli, 'emulators:exec', '--only', 'firestore', '--project', 'flowmd-04', 'node tests/rules-test.mjs'], {
  stdio: 'inherit',
  shell: false
});
process.exit(r.status === null ? 1 : r.status);
