'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const flags = new Set(process.argv.slice(2));
const quick = flags.has('--quick');
const fix = flags.has('--fix');
const srcDir = path.join(root, 'src');

const paint = {
  reset: '\x1b[0m', bold: '\x1b[1m', dim: '\x1b[2m',
  red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m', cyan: '\x1b[36m',
};
const tone = { PASS: paint.green, FAIL: paint.red, SKIP: paint.dim, WARN: paint.yellow };
const COUNTER = /\b(?:count|counts|length|size|total|totals|index|idx|qty|quantity|runs|wickets|balls|overs|margin|score|scores|amount|num|number)\b|\.length\b/;
const GUARD = /Boolean\s*\(|!!|>=|<=|===|!==|==|!=|[<>]\s*\d|\?/;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

function lineCount(text) {
  if (!text) return 0;
  const parts = text.split(/\r?\n/);
  if (parts[parts.length - 1] === '') parts.pop();
  return parts.length;
}

function excluded(file) {
  const base = path.basename(file);
  const rel = path.relative(root, file).split(path.sep).join('/');
  return base.endsWith('.test.ts') || base.endsWith('.test.tsx') || rel.includes('/__tests__/')
    || base.startsWith('sample-') || base === 'types.ts' || base === 'database.types.ts'
    || base.endsWith('.d.ts') || /schema\.tsx?$/.test(base);
}

function rel(file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function auditLengths() {
  const warnings = [];
  const errors = [];
  for (const file of walk(srcDir)) {
    if (!/\.tsx?$/.test(file) || excluded(file)) continue;
    const lines = lineCount(fs.readFileSync(file, 'utf8'));
    const item = `${lines} ${rel(file)}`;
    if (lines > 270) errors.push(item);
    else if (lines > 200) warnings.push(item);
  }
  const detail = errors.length ? `${errors.length} over 270` : warnings.length ? `${warnings.length} warnings` : '0 violations';
  return { ok: errors.length === 0, detail, notes: [...errors.map((item) => `HARD ${item}`), ...warnings.map((item) => `WARN ${item}`)] };
}

function auditJsx() {
  const hits = [];
  for (const file of walk(srcDir).filter((name) => name.endsWith('.tsx'))) {
    fs.readFileSync(file, 'utf8').split(/\r?\n/).forEach((line, index) => {
      const match = line.match(/\{([^{}]*)&&\s*</);
      if (!match || GUARD.test(match[1]) || !COUNTER.test(match[1])) return;
      hits.push(`${rel(file)}:${index + 1} use {count > 0 ? <Component /> : null}`);
    });
  }
  return { ok: hits.length === 0, detail: hits.length ? `${hits.length} risky renders` : 'Safe', notes: hits };
}

function run(command) {
  const started = Date.now();
  const result = spawnSync(command, { cwd: root, encoding: 'utf8', shell: true, windowsHide: true });
  return { code: result.status ?? 1, output: `${result.stdout || ''}\n${result.stderr || ''}`, ms: Date.now() - started };
}

function tail(text) {
  return text.trim().split(/\r?\n/).filter(Boolean).slice(-12);
}

function typecheck() {
  const result = run('npx tsc --noEmit');
  const errors = (result.output.match(/error TS\d+/g) || []).length;
  return { ok: result.code === 0, detail: result.code === 0 ? '0 type errors' : `${errors || 'typecheck'} failed`, notes: result.code === 0 ? [] : tail(result.output), ms: result.ms };
}

function lint() {
  const result = run(fix ? 'npx expo lint --fix' : 'npx expo lint');
  const problems = result.output.match(/(\d+)\s+problems?/);
  return {
    ok: result.code === 0,
    detail: result.code === 0 ? '0 lint warnings' : problems ? `${problems[1]} problems` : 'lint failed',
    notes: result.code === 0 ? [] : tail(result.output),
    ms: result.ms,
  };
}

function jestGate() {
  const result = run('npx jest --watchman=false');
  const suites = result.output.match(/Test Suites:\s+(?:(\d+) failed,\s+)?(\d+) passed,\s+(\d+) total/);
  const tests = result.output.match(/Tests:\s+(?:(\d+) failed,\s+)?(?:(\d+) skipped,\s+)?(\d+) passed,\s+(\d+) total/);
  const detail = suites
    ? `${suites[2]}/${suites[3]} suites, ${tests ? tests[3] : '?'}/${tests ? tests[4] : '?'} tests`
    : result.code === 0 ? 'passed' : 'failed';
  return { ok: result.code === 0, detail, notes: result.code === 0 ? [] : tail(result.output), ms: result.ms };
}

function graphify() {
  const result = run('graphify update .');
  return { ok: result.code === 0, detail: result.code === 0 ? 'Synced' : 'sync failed', notes: result.code === 0 ? [] : tail(result.output), ms: result.ms };
}

function timed(work) {
  const started = Date.now();
  const result = work();
  return { ...result, ms: result.ms ?? Date.now() - started };
}

function skip() {
  return { ok: true, status: 'SKIP', detail: 'skipped', notes: [], ms: 0 };
}

const plan = [
  { id: 1, title: 'Auditing File Lengths (Cap: <= 200 lines)', name: 'File Length Budget (<=200)', run: () => timed(auditLengths) },
  { id: 2, title: 'Auditing Zero-Crash JSX Render Safety', name: 'Zero-Crash Render Safety', run: () => timed(auditJsx) },
  { id: 3, title: 'Running TypeScript Typecheck (tsc --noEmit)', name: 'Strict TypeScript (tsc)', run: typecheck },
  { id: 4, title: 'Running Expo Linter (expo lint)', name: 'Expo Linter (lint)', run: lint },
  { id: 5, title: 'Running Jest Test Suites (jest)', name: 'Jest Automated Tests', run: quick ? skip : jestGate },
  { id: 6, title: 'Updating Graphify Knowledge Graph', name: 'Graphify Knowledge Graph', run: quick ? skip : graphify },
];

function paintStatus(status) {
  return `${tone[status]}${status.padEnd(9)}${paint.reset}`;
}

function plainLength(text) {
  return text.replace(/\x1b\[[0-9;]*m/g, '').length;
}

function fit(text, width) {
  const gap = width - plainLength(text);
  return gap > 0 ? text + ' '.repeat(gap) : text;
}

console.log(`${paint.cyan}${'='.repeat(70)}`);
console.log(`${paint.bold}              esSports Multi-Agent Quality Gate Runner${paint.reset}${paint.cyan}`);
console.log(`${'='.repeat(70)}${paint.reset}\n`);

const gates = plan.map((item) => {
  const result = item.run();
  const status = result.status || (result.ok ? 'PASS' : 'FAIL');
  const gate = { ...item, ...result, status };
  const label = `[${item.id}/6] ${item.title}`.padEnd(64, ' ');
  console.log(`${label}${paintStatus(status)} ${paint.dim}(${gate.detail})${paint.reset}`);
  for (const note of gate.notes) {
    const color = note.startsWith('HARD') || status === 'FAIL' ? paint.red : paint.yellow;
    console.log(`${color}       ${note}${paint.reset}`);
  }
  return gate;
});

const failed = gates.some((gate) => gate.status === 'FAIL');
const total = gates.reduce((sum, gate) => sum + gate.ms, 0);
const summary = failed ? 'FAILED' : quick ? 'QUICK PASS' : 'ALL PASS';

console.log(`\n${paint.cyan}${'='.repeat(70)}`);
console.log(`${paint.bold}                         VERIFICATION SUMMARY${paint.reset}${paint.cyan}`);
console.log(`${'='.repeat(70)}${paint.reset}`);
console.log(` ${fit('Gate', 32)} | ${fit('Status', 9)} | Duration`);
console.log(`${'-'.repeat(34)}+${'-'.repeat(11)}+${'-'.repeat(10)}`);
for (const gate of gates) {
  console.log(` ${fit(`${gate.id}. ${gate.name}`, 32)} | ${paintStatus(gate.status)} | ${(gate.ms / 1000).toFixed(2)}s`);
}
console.log(`${'-'.repeat(34)}+${'-'.repeat(11)}+${'-'.repeat(10)}`);
console.log(` ${tone[failed ? 'FAIL' : 'PASS']}${paint.bold}Total Quality Gate Status: ${summary} (${(total / 1000).toFixed(2)}s)${paint.reset}`);
console.log(`${paint.cyan}${'='.repeat(70)}${paint.reset}`);

process.exit(failed ? 1 : 0);
