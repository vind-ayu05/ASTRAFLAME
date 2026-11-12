// ASTRAFLAME One-Command Startup Manager
// Concurrently starts both the Node.js/Express Backend and the React/Vite Frontend,
// streaming unified logs and cleanly shutting down on SIGINT/SIGTERM.

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

console.log('================================================================');
console.log('       ASTRAFLAME FULL-STACK DUAL-DATABASE SYSTEM STARTUP       ');
console.log('================================================================');
console.log('• Primary Database:   Supabase-Hosted PostgreSQL (Authoritative)');
console.log('• Secondary Database: Separate PostgreSQL (Analytical Processing)');
console.log('• Backend API:        Node.js + Express (Port 5000)');
console.log('• Frontend UI:        React 19 + Vite (Port 5173)');
console.log('================================================================\n');

// 1. Start Backend Express Server
const serverProc = spawn(
  process.execPath,
  ['./node_modules/tsx/dist/cli.mjs', 'server/index.ts'],
  {
    cwd: rootDir,
    env: { ...process.env, PORT: process.env.PORT || '5000' },
    stdio: 'pipe',
  }
);

serverProc.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log(`\x1b[36m[BACKEND]\x1b[0m ${line}`);
  }
});

serverProc.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.error(`\x1b[31m[BACKEND ERROR]\x1b[0m ${line}`);
  }
});

// 2. Start Vite Dev Server
const viteProc = spawn(
  process.execPath,
  ['./node_modules/vite/bin/vite.js'],
  {
    cwd: rootDir,
    env: { ...process.env, VITE_API_BASE_URL: process.env.VITE_API_BASE_URL || 'http://localhost:5000/api' },
    stdio: 'pipe',
  }
);

viteProc.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.log(`\x1b[32m[FRONTEND]\x1b[0m ${line}`);
  }
});

viteProc.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  for (const line of lines) {
    if (line.trim()) console.error(`\x1b[33m[FRONTEND WARN]\x1b[0m ${line}`);
  }
});

function cleanup() {
  console.log('\n[ASTRAFLAME] Shutting down full-stack processes...');
  serverProc.kill('SIGINT');
  viteProc.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

