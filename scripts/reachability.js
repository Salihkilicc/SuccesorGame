#!/usr/bin/env node
/* ============================================================================
 *  REACHABILITY AUDIT
 * ============================================================================
 *  This project's recurring failure is not broken logic. It is logic that is
 *  correct, typed, simulated - and called from nowhere. Per-category brand ran
 *  in the engine for weeks while every screen showed one number. The gift
 *  system was wired to the store while the screen that used it was referenced
 *  from no file. Both compiled cleanly and both were reported as done.
 *
 *  tsc cannot catch this: unreachable code is still valid code. So this script
 *  asks the question tsc does not - can the player actually get here?
 *
 *  Run before calling anything finished:   node scripts/reachability.js
 * ========================================================================== */
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const files = [];
(function walk(d) {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) walk(p);
        else if (/\.tsx?$/.test(e.name)) files.push(p);
    }
})(SRC);

const read = f => fs.readFileSync(f, 'utf8');
const body = new Map(files.map(f => [f, read(f)]));
const rel = f => path.relative(SRC, f);
const isDisabled = f => /features\/(life|love|casino|shopping)\//.test(rel(f));

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How many files other than `self` mention `name` as a whole word. */
const refs = (name, self) => {
    let n = 0;
    const re = new RegExp(`\\b${esc(name)}\\b`);
    for (const [f, t] of body) if (f !== self && re.test(t)) n++;
    return n;
};

/**
 * Is it used inside its own file, beyond the declaration itself?
 *
 * Without this the audit cried wolf: loyaltyOf, fatigueMultiplier and
 * contextMultiplier are all exported helpers that governance.ts uses
 * internally, and they were being reported as dead. An audit that reports
 * healthy code is worse than no audit - it gets ignored.
 */
const usedInternally = (name, self) =>
    (body.get(self).match(new RegExp(`\\b${esc(name)}\\b`, 'g')) || []).length > 1;

/** A file may opt out with `// @orphan-ok <reason>` - legacy kept on purpose. */
const optedOut = f => /@orphan-ok\s/.test(body.get(f));

/**
 * A single export may opt out with `// @orphan-ok-symbol <name> - <reason>`.
 * Used for leftovers inside a file that is otherwise very much alive - a
 * whole-file opt-out there would blind the audit to real problems.
 */
const symbolOptedOut = (name, f) =>
    new RegExp(`@orphan-ok-symbol\\s+${esc(name)}\\b`).test(body.get(f));

/**
 * `// @orphan-todo <reason>` marks work that is genuinely UNFINISHED rather
 * than legacy. It is listed separately and does not fail the audit.
 *
 * The distinction matters: an audit that can never reach zero gets ignored,
 * which is precisely how the codebase ended up carrying 53 unreachable items
 * in the first place. Legacy is closed with a reason; unfinished work stays
 * visible as a list of known gaps.
 */
const todos = [];
const isTodo = f => /@orphan-todo\s/.test(body.get(f));

const problems = { components: [], storeActions: [], engineExports: [], statsFields: [], hooks: [], frozenText: [], newGame: [] };

// --- 0) Hooks below an early return ----------------------------------------
//  React counts hooks per render and refuses a mismatch. A component that
//  bails out early and then calls more hooks crashes the moment the bail-out
//  stops happening - "Rendered more hooks than during the previous render."
//
//  This was written twice in one week: ProductDetailModal and then
//  MemberInteractionModal, in both cases by adding a store selector to the
//  bottom of a component that already had an early return at the top. It does
//  not fail tsc and it only crashes on the path the developer does not take
//  while testing, so it needs a machine to catch it.
const HOOK = /\b(useState|useEffect|useMemo|useCallback|useRef|useReducer|useContext|use[A-Z]\w*Store)\s*\(/;
for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f))) {
    const lines = read(f).split('\n');
    let guard = -1;
    for (let i = 0; i < lines.length; i++) {
        // An early return inside a component body (indented, returns nothing useful)
        if (/^\s{2,8}(if \s*\(.*\)\s*)?return (null|undefined);?\s*$/.test(lines[i])) guard = i;
        else if (/^\s{0,4}(export )?(const|function) [A-Z]/.test(lines[i])) guard = -1;  // new component
        else if (guard >= 0 && HOOK.test(lines[i]) && !/^\s*(\/\/|\*)/.test(lines[i])) {
            problems.hooks.push(`${rel(f)}:${i + 1}  hook after early return on line ${guard + 1}`);
            guard = -1;
        }
    }
}

// --- 0b) Translations frozen at module load ---------------------------------
//  `name: t('data.capacity.workshop')` inside a module-level array runs ONCE,
//  when the file is imported. Switch language later and the string never
//  changes - the player sees English everywhere except the facility ladder,
//  the product names and the morale items, which stay in whatever language
//  the app happened to start in.
//
//  A getter fixes it: `get name() { return t('...'); }` evaluates on access.
//  Only MODULE-LEVEL data counts. `text: t('ui.reset')` inside an Alert array
//  lives in a function and is evaluated per call, which is fine - flagging it
//  produced 48 findings of which 45 were noise.
for (const f of files.filter(f => !isDisabled(f) && !optedOut(f))) {
    const lines = read(f).split('\n');
    let inData = false;
    lines.forEach((line, i) => {
        // A top-level data declaration: `export const X = [` / `const X: T = {`
        // `const X = [` and also the multi-line form, where a type annotation
        // spans several lines and the `= [` lands on a line starting with `}>`.
        // Missing that variant hid HOMESCREEN_APPS, whose labels were frozen.
        if (/^(export\s+)?const\s+\w+[^=]*=\s*[[{]\s*$/.test(line)) inData = true;
        else if (/^\s*\}>\s*=\s*[[{]\s*$/.test(line)) inData = true;
        else if (/^(export\s+)?const\s+\w+\s*:\s*\w/.test(line) && !/=/.test(line)) inData = false;
        else if (/^[\]}];?\s*$/.test(line)) inData = false;
        // Anything containing a function opens a new scope - not module data
        else if (/^(export\s+)?(const|function)\s/.test(line) && /=>|function/.test(line)) inData = false;

        // `prop: t(...)` anywhere on the line, not only at its start - inline
        // object literals like `{ key: 'x', label: t('y'), icon: 'z' }` put it
        // in the middle, which is exactly where HOMESCREEN_APPS hid.
        if (inData && /\b\w+:\s*t\(/.test(line) && !/^\s*(\/\/|\*)/.test(line)) {
            problems.frozenText.push(`${rel(f)}:${i + 1}  ${line.trim().slice(0, 60)}`);
        }
    });
}

// --- 0c) Persisted stores a new game does not clear --------------------------
//  Every store that writes to disk has to be (a) in PERSIST_KEYS so the disk
//  copy is deleted, and (b) reset in memory, since zustand keeps the old data
//  in RAM until the app restarts and will write it straight back.
//
//  Missing either half is silent: the game opens, it runs, and only some
//  numbers are wrong. That is how "my R&D points carried over" happens.
{
    const ng = body.get(files.find(f => f.endsWith('core/newGame.ts'))) || '';
    for (const f of files.filter(f => /use\w+Store\.ts$/.test(f) && !optedOut(f))) {
        const t = read(f);
        if (!/persist\(/.test(t)) continue;
        const key = [...t.matchAll(/name:\s*'([\w-]+)'/g)].pop()?.[1];
        const hook = t.match(/export const (use\w+Store)/)?.[1];
        if (!key || !hook) continue;
        if (/@orphan-ok/.test(t)) continue;

        const onDisk = ng.includes(`'${key}'`);
        const inMemory = new RegExp(`${esc(hook)}[^\n]*\\.(reset|resetAchievements|initializeGame)|callReset\\('${esc(hook)}'`).test(ng)
            || new RegExp(`${esc(hook)}\\.setState`).test(ng);

        if (!onDisk || !inMemory) {
            problems.newGame.push(
                `${hook}  (${rel(f)})  disk=${onDisk ? 'ok' : 'MISSING from PERSIST_KEYS'}  memory=${inMemory ? 'ok' : 'NOT RESET'}`);
        }
    }
}

// --- 1) Components nothing renders -----------------------------------------
//  Matched on IMPORT PATH, not on symbol name. Matching the exported symbol
//  gave false positives: RAndDModal.tsx exports `RAndDModalRevised` as a const
//  and the real component as the default, so the audit hunted for a name
//  nobody imports while the file itself was rendered every game.
for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f))) {
    if (optedOut(f)) continue;
    const base = path.basename(f).replace(/\.tsx$/, '');
    const imported = [...body].some(([g, t]) =>
        g !== f && new RegExp(`from\\s+['"][^'"]*\\b${esc(base)}['"]`).test(t));
    if (imported) continue;
    const m = read(f).match(/export default (?:function )?(\w+)|export const (\w+)\s*[:=]/);
    const label = `${(m && (m[1] || m[2])) || base}  (${rel(f)})`;
    if (isTodo(f)) {
        const why = (body.get(f).match(/@orphan-todo\s+(.*)/) || [])[1] || '';
        todos.push(`${label}\n          ${why}`);
    } else {
        problems.components.push(label);
    }
}

// --- 2) Store actions no component calls ------------------------------------
for (const f of files.filter(f => /use\w+Store\.ts$/.test(f))) {
    if (isDisabled(f) || optedOut(f)) continue;   // shelved modules are not a finding
    const t = read(f);
    const iface = t.match(/interface \w*State \{([\s\S]*?)\n\}/);
    if (!iface) continue;
    for (const line of iface[1].split('\n')) {
        const a = line.match(/^\s{4}(\w+):\s*\(/);           // action signature
        if (!a) continue;
        let used = 0;
        for (const [g, gt] of body) {
            if (g === f) continue;
            if (isDisabled(g)) continue;
            if (new RegExp(`\\b${a[1]}\\b`).test(gt)) used++;
        }
        if (used === 0 && !symbolOptedOut(a[1], f)) problems.storeActions.push(`${a[1]}()  (${rel(f)})`);
    }
}

// --- 3) Engine exports the game never consumes ------------------------------
for (const f of files.filter(f => /core\/market\/\w+\.ts$/.test(f))) {
    if (optedOut(f)) continue;
    for (const m of read(f).matchAll(/export const (\w+)\s*=\s*\(/g)) {
        // Only flag it if nothing anywhere uses it - including its own file.
        if (refs(m[1], f) === 0 && !usedInternally(m[1], f) && !symbolOptedOut(m[1], f)) {
            problems.engineExports.push(`${m[1]}()  (${rel(f)})`);
        }
    }
}

// --- 4) Stats fields written by the engine and read by no screen ------------
const statsFile = files.find(f => f.endsWith('useStatsStore.ts'));
if (statsFile) {
    const iface = read(statsFile).match(/interface StatsState \{([\s\S]*?)\n\}/);
    const tsx = files.filter(f => f.endsWith('.tsx') && !isDisabled(f));
    if (iface) {
        for (const line of iface[1].split('\n')) {
            const m = line.match(/^\s{2}(\w+)\??:/);
            if (!m || /^(set|update|reset)/.test(m[1])) continue;
            const written = [...body].some(([g, t]) =>
                g !== statsFile && new RegExp(`\\b${m[1]}\\s*:`).test(t));
            const shown = tsx.some(g => new RegExp(`\\b${m[1]}\\b`).test(body.get(g)));
            if (written && !shown) problems.statsFields.push(m[1]);
        }
    }
}

// --- report -----------------------------------------------------------------
const section = (title, list, why) => {
    if (!list.length) { console.log(`\x1b[32m  OK  \x1b[0m ${title}`); return 0; }
    console.log(`\x1b[31m FAIL \x1b[0m ${title}  (${list.length})`);
    console.log(`        ${why}`);
    list.forEach(l => console.log(`        - ${l}`));
    return list.length;
};

console.log('\nREACHABILITY AUDIT — can the player actually get here?\n');
let total = 0;
total += section('Persisted stores a new game does not clear', problems.newGame,
    'Old data walks into the next game. Both halves are needed: the disk key and the in-memory reset.');
total += section('Translations frozen at module load', problems.frozenText,
    'Evaluated once on import, so they never follow a language change. Use a getter.');
total += section('Hooks called after an early return', problems.hooks,
    'React will crash with "Rendered more hooks than during the previous render".');
total += section('Components nothing renders', problems.components,
    'Written, compiles, and no screen mounts it.');
total += section('Store actions nothing calls', problems.storeActions,
    'The state can change but nothing in the UI ever triggers it.');
total += section('Engine functions nothing uses', problems.engineExports,
    'Pure logic that no caller reaches. Correct and inert.');
total += section('Stats written but never displayed', problems.statsFields,
    'The engine computes it every quarter and the player never sees it.');

if (todos.length) {
    console.log(`\x1b[33m TODO \x1b[0m Unfinished, tracked on purpose  (${todos.length})`);
    todos.forEach(l => console.log(`        - ${l}`));
}

console.log(`\n${total === 0 ? '\x1b[32mNothing orphaned.\x1b[0m' : `\x1b[33m${total} unreachable item(s).\x1b[0m`}`);
console.log('(features/life, love, casino, shopping are flagged off and excluded.)\n');
process.exit(0);
