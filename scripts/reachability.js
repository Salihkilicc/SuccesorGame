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
 *  ---------------------------------------------------------------------------
 *  IT READS THE CODE. IT DOES NOT MATCH THE TEXT.
 *  ---------------------------------------------------------------------------
 *  For most of its life this script answered "is anything using X?" by looking
 *  for the string X in the other files. That is wrong in four ways and all
 *  four bit, one per session, each one found only by accident:
 *
 *      a commented-out call          - and this repo never deletes code
 *      an import with no call        - hid applyCorporateShock for weeks
 *      a name inside a string        - hid enroll() behind an i18n key
 *      two things sharing a name     - two dead acquireCompany()s, each the
 *                                      reason nobody found the other
 *
 *  Patching them one at a time was the wrong instinct and I did it twice
 *  before admitting it. Every patch was a narrower regex, and the next
 *  blindness was always whatever that regex still could not see. A regex
 *  cannot tell a call from a word, because it has no idea what a call is.
 *
 *  The program is now type-checked and every identifier is resolved to the
 *  declaration it points at. Comments are not nodes, string contents are not
 *  identifiers, an import specifier is its own kind of node, and two
 *  same-named members of different types are two different symbols. All four
 *  blindnesses stop being cases to handle and become things that cannot arise.
 *
 *  WHERE IT IS STILL APPROXIMATE, and it says so at the point it happens: the
 *  codebase uses `require()` deliberately to break import cycles, and the
 *  checker types that as `any`. Along those paths the index falls back to
 *  matching the name. Precision holds wherever the types do.
 *
 *  Costs about three seconds. Cheaper than one of the four bugs above.
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

// ===========================================================================
//  THE REFERENCE INDEX — READ THE CODE, DO NOT MATCH THE TEXT
// ===========================================================================
//
//  Every reachability pass here used to ask a regex whether a name appeared
//  in a file. Three separate blindnesses came out of that in three
//  consecutive sessions, and they were all the same mistake wearing different
//  clothes:
//
//    1. A COMMENTED-OUT CALL COUNTED AS A CALL. This project never deletes
//       code - retired things get commented out with a note - so shelving the
//       last caller of a function made that function look permanently alive.
//       The two house rules were cancelling each other out, a little more
//       with every shelved block. Found by shelving addSubsidiary's only
//       caller and watching the audit report clean.
//
//    2. AN IMPORT COUNTED AS A CALL. `applyCorporateShock` sat written and
//       tested and uncalled for weeks while useGameStore.ts imported it and
//       never invoked it. One import line was enough. The check that exists
//       to find dead code was the reason nobody found that dead code.
//
//    3. A NAME IN A COMMENT ANYWHERE COUNTED. The store-action pass looked
//       for the bare word in any file, so `recent()` was invisible because
//       the word "recent" appears in a comment in equity.ts. Any action named
//       with a common English word was unauditable.
//
//  Patching each one in turn was the wrong instinct, and I did it twice
//  before seeing that. Each patch was a narrower regex, and the next
//  blindness was always going to be whatever that regex still could not see.
//  A regex cannot tell a call from a word, because it does not know what a
//  call is.
//
//  So the file is PARSED. TypeScript is already a dependency and the story
//  pass already transpiles with it. `ts.createSourceFile` gives a syntax tree
//  in which comments are not nodes, string contents are not identifiers, and
//  an import specifier is a different kind of node from a reference. All
//  three blindnesses stop being special cases and become things the parser
//  never had.
//
//  ---------------------------------------------------------------------------
//  WHAT COUNTS AS A USE
//  ---------------------------------------------------------------------------
//  An identifier in REFERENCE position: read it, call it, pass it, render it,
//  reach it through a dot. Explicitly NOT:
//
//    - the name being declared (`const foo`, `function foo`, `foo: string`)
//    - an import or re-export specifier - naming something is not using it
//    - a key in an object literal (`{ foo: 1 }`), which is recorded
//      separately, because "written" and "read" are different questions and
//      the stats pass needs both
//
//  Type positions count. A type-only reference is still a reason the symbol
//  exists, and reporting it as dead would be a false alarm - which is the one
//  failure mode that gets an audit switched off.
//
//  ---------------------------------------------------------------------------
//  AND IT IS INDEXED BY SYMBOL, NOT BY NAME
//  ---------------------------------------------------------------------------
//  A syntax tree alone fixes comments, strings and imports, and it still gets
//  the fourth case wrong - because a name is not a thing. Two different stores
//  each declaring a dead method called `acquireCompany` made EACH OTHER look
//  alive: the audit found the name in the other file and stopped asking. Both
//  had been dead for as long as they had both existed, and the second one was
//  what hid the first.
//
//  So the whole program is type-checked and every identifier is resolved to
//  the declaration it actually points at. `enroll` on one store and `enroll`
//  on another are then two symbols that happen to be spelled the same, which
//  is what they always were.
//
//  Destructuring needed saying out loud: in `const { foo } = useStore()`, the
//  identifier is BOTH a new local and a read of the property. It is the way
//  most screens in this codebase call a store, so treating it as a pure
//  declaration - which is what it looks like structurally - would have made
//  most of the app's real calls invisible. That mistake was in the first
//  version of this index and it reported a live action as dead.
//
//  Costs about a second for 414 files.
// ===========================================================================
const ts = require('typescript');

const REFERENCE_INDEX = (() => {
    const cfgPath = path.join(__dirname, '..', 'tsconfig.srccheck.json');
    const cfg = ts.readConfigFile(cfgPath, ts.sys.readFile);
    const parsed = ts.parseJsonConfigFileContent(
        cfg.config, ts.sys, path.join(__dirname, '..'));
    const program = ts.createProgram(parsed.fileNames, { ...parsed.options, noEmit: true });
    const checker = program.getTypeChecker();

    /** A declaration's identity: where it is written. */
    const keyOf = node => `${node.getSourceFile().fileName}:${node.getStart()}`;

    /** declaration key -> the files that reference it. */
    const byDecl = new Map();
    /** file -> module specifiers it imports. */
    const importsOf = new Map();
    /** file -> names it uses as an object-literal KEY, which is a write. */
    const writesOf = new Map();
    // ----------------------------------------------------------------------
    //  WHERE THE TYPES RUN OUT
    // ----------------------------------------------------------------------
    //  This codebase reaches for `require('...')` on purpose, in about a dozen
    //  places, to break import cycles between the stores and the engine. The
    //  checker types that as `any`, so `require(x).useShareholderStore
    //  .getState().holdVote()` resolves to no symbol at all.
    //
    //  The first symbol-only version of this index reported twenty-two dead
    //  store actions. Most of them were live and called exactly that way -
    //  including `setValueAnchor`, which I had wired myself an hour earlier.
    //  An audit that cries wolf twenty-two times is an audit nobody reads
    //  again, and it would have been worse than the text matching it replaced.
    //
    //  So: symbol where there is one, NAME where there is not. Precision holds
    //  everywhere the types do, and degrades only along the `any` paths -
    //  which is the best any tool can do without types, and is honest about
    //  which half of the answer it is giving.
    // ----------------------------------------------------------------------
    /** file -> names referenced through an expression the checker cannot type. */
    const untypedUsesOf = new Map();

    const record = (symbol, file) => {
        if (!symbol) return;
        let s = symbol;
        // An imported name is an alias for the real thing; follow it, or every
        // reference would be attributed to the import statement.
        if (s.flags & ts.SymbolFlags.Alias) {
            try { s = checker.getAliasedSymbol(s); } catch { /* not an alias after all */ }
        }
        for (const d of s.declarations || []) {
            const k = keyOf(d);
            if (!byDecl.has(k)) byDecl.set(k, new Set());
            byDecl.get(k).add(file);
        }
    };

    for (const sf of program.getSourceFiles()) {
        if (sf.isDeclarationFile) continue;
        const file = path.resolve(sf.fileName);
        const imps = new Set();
        const writes = new Set();
        const untyped = new Set();
        importsOf.set(file, imps);
        writesOf.set(file, writes);
        untypedUsesOf.set(file, untyped);

        const isDeclarationName = (node) => {
            const p = node.parent;
            if (!p) return false;
            // `{ foo }` in an object literal is shorthand for `{ foo: foo }`.
            if (ts.isShorthandPropertyAssignment(p)) return false;
            return p.name === node && (
                ts.isVariableDeclaration(p) || ts.isFunctionDeclaration(p)
                || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p)
                || ts.isTypeAliasDeclaration(p) || ts.isEnumDeclaration(p)
                || ts.isEnumMember(p) || ts.isParameter(p)
                || ts.isPropertyDeclaration(p) || ts.isPropertySignature(p)
                || ts.isMethodDeclaration(p) || ts.isMethodSignature(p)
                || ts.isPropertyAssignment(p) || ts.isModuleDeclaration(p)
                || ts.isTypeParameterDeclaration(p)
            );
        };

        const visit = (node) => {
            // Naming something in an import is not using it. This is the line
            // that would have caught applyCorporateShock weeks earlier.
            if (ts.isImportDeclaration(node)) {
                if (ts.isStringLiteral(node.moduleSpecifier)) imps.add(node.moduleSpecifier.text);
                return;
            }
            if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
                if (ts.isStringLiteral(node.moduleSpecifier)) imps.add(node.moduleSpecifier.text);
                return;
            }
            // `require('./x')` is used deliberately here to break import
            // cycles, so it is a real edge and has to be recorded as one.
            if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)
                && node.expression.text === 'require'
                && node.arguments.length === 1 && ts.isStringLiteral(node.arguments[0])) {
                imps.add(node.arguments[0].text);
            }

            if (ts.isIdentifier(node)) {
                const p = node.parent;

                // A key in an object literal is a WRITE, not a read. The stats
                // pass needs the two apart: a field the engine writes and no
                // screen shows is the exact thing it is looking for.
                if (p && ts.isPropertyAssignment(p) && p.name === node) {
                    writes.add(node.text);
                } else if (p && ts.isBindingElement(p) && p.name === node && !p.propertyName) {
                    // `const { foo } = store` - a local AND a read of `foo`.
                    // Resolve through the pattern's type to get the PROPERTY
                    // rather than the local we are declaring.
                    const pattern = p.parent;
                    const prop = ts.isObjectBindingPattern(pattern)
                        ? checker.getTypeAtLocation(pattern).getProperty(node.text)
                        : undefined;
                    if (prop) record(prop, file);
                    else untyped.add(node.text);
                } else if (!isDeclarationName(node)) {
                    const sym = checker.getSymbolAtLocation(node);
                    if (sym) record(sym, file);
                    // Only a property reach - `x.foo` - is worth remembering
                    // when it does not resolve. A bare unresolved identifier
                    // is usually a global or a type parameter, and recording
                    // those would make the fallback match everything.
                    else if (p && ts.isPropertyAccessExpression(p) && p.name === node) {
                        untyped.add(node.text);
                    }
                }
            }
            ts.forEachChild(node, visit);
        };
        visit(sf);
    }

    return {
        /**
         * Files other than `self` that reference this declaration node.
         *
         * `name` is optional and turns on the untyped fallback: pass it when
         * the thing being looked for can be reached through a `require`, which
         * for a store action it always can.
         */
        referencingFiles(decl, self, name) {
            const set = new Set(byDecl.get(keyOf(decl)) || []);
            if (name) {
                for (const [f, names] of untypedUsesOf) if (names.has(name)) set.add(f);
            }
            return [...set].filter(f => path.resolve(f) !== path.resolve(self));
        },
        /** Does the declaring file use it itself, beyond declaring it? */
        usedInOwnFile(decl) {
            const set = byDecl.get(keyOf(decl)) || new Set();
            return set.has(path.resolve(decl.getSourceFile().fileName));
        },
        importsOf,
        writesOf,
        /** Parsed source, so passes can read declarations out of the tree. */
        sourceOf(f) {
            return program.getSourceFile(f) || program.getSourceFile(path.resolve(f));
        },
    };
})();
// ---------------------------------------------------------------------------
//  WHICH FEATURE FOLDERS ARE OFF - READ FROM THE FLAGS, NOT FROM A LIST
// ---------------------------------------------------------------------------
//  This was a hardcoded `(life|love|casino|shopping)`. The moment the casino
//  flag was switched back ON, sixteen live files stayed excluded from every
//  pass in this script - palette, exits, dead code, the lot - and the summary
//  line at the bottom went on claiming they were "flagged off". An audit that
//  disagrees with the app about what is shipping is worse than no audit,
//  because it reports green while looking away.
//
//  Read the flags instead. Turning a module on now turns its checks on with
//  it, which is the only arrangement where the green means anything.
// ---------------------------------------------------------------------------
const FEATURE_SRC = fs.readFileSync(path.join(SRC, 'core/featureFlags.ts'), 'utf8');
const flagOff = name =>
    new RegExp(`^\\s*${name}:\\s*false`, 'm').test(FEATURE_SRC);

/** Folder in features/ -> the flag that gates it. */
const GATED_FOLDERS = { life: 'life', love: 'love', casino: 'casino', shopping: 'shopping' };
const OFF_FOLDERS = Object.entries(GATED_FOLDERS)
    .filter(([, flag]) => flagOff(flag))
    .map(([folder]) => folder);

const isDisabled = f =>
    OFF_FOLDERS.length > 0 &&
    new RegExp(`features/(${OFF_FOLDERS.join('|')})/`).test(rel(f));

const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** How many files other than `self` reference this declaration. */
const refs = (decl, self, name) =>
    REFERENCE_INDEX.referencingFiles(decl, self, name).length;

/**
 * Is it used inside its own file, beyond the declaration itself?
 *
 * Without this the audit cried wolf: loyaltyOf, fatigueMultiplier and
 * contextMultiplier are all exported helpers that governance.ts uses
 * internally, and they were being reported as dead. An audit that reports
 * healthy code is worse than no audit - it gets ignored.
 */
//
// The checker distinguishes the declaration from a reference, so this is a
// plain lookup rather than "appears more than once".
const usedInternally = (decl) => REFERENCE_INDEX.usedInOwnFile(decl);

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

const problems = { components: [], storeActions: [], engineExports: [], statsFields: [], hooks: [], frozenText: [], newGame: [], palette: [], contrast: [], stringGuards: [], exits: [], story: [] };

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
// A .tsx TEST is not a component that nothing renders - it is a test, and
// what renders it is jest. This project's first .tsx test file appeared as a
// finding the moment it was written, which would have taught whoever wrote
// the second one that the audit punishes rendering tests.
for (const f of files.filter(f =>
    f.endsWith('.tsx') && !/\.test\.tsx$/.test(f) && !isDisabled(f))) {
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
//
//  `@survives-new-game <reason>` is the way out, and it is a NARROW one: it
//  skips this pass only. Settings used a blanket `@orphan-ok` for the same
//  job, which also turned off the palette, frozen-text and dead-code checks
//  on that file - a large hole to open for one small exemption. A store that
//  outlives a run is a real category (the player's own name is not part of a
//  save) but it has to be declared, because the default has to stay "a new
//  game clears everything".
{
    const ng = body.get(files.find(f => f.endsWith('core/newGame.ts'))) || '';
    for (const f of files.filter(f => /use\w+Store\.ts$/.test(f) && !optedOut(f))) {
        const t = read(f);
        if (!/persist\(/.test(t)) continue;
        if (/@survives-new-game\s/.test(t)) continue;
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

// --- 0d) Colours outside the palette ----------------------------------------
//  The project carried 393 distinct colours across 2,750 usages - three golds,
//  four reds and six backgrounds all doing the same jobs. That inconsistency,
//  not any single choice, is what made the app feel scattered from screen to
//  screen. They are consolidated to fifteen; this keeps them there.
const PALETTE = new Set([
    '#1C242C', '#323A40', '#434B50', '#535B5F', '#666E70',   // ground + elevation ladder
    '#FFFFFF', '#000000',                                     // the ONLY two text colours
    '#05A8F6', '#7DD3FC', '#0C6C9C',                          // the blues, as fills
    '#8C9494', '#CFD0D2',                                     // the greys
    '#4ADE80', '#FF8A8A',                                     // profit and loss ONLY
    '#FFA94D', '#D6A96C',                                     // brand value, section headings
    '#C4B5FD',                                                // research points
    // The header rules. Wayfinding only - never text, never a fill of any
    // size. Enforced below in 0d2.
    '#EFC94C', '#3FC9C0', '#A78BFA', '#F09BD0', '#93A0F7',
    // The unread badge. A fill, and the only red that is one - see theme.ts.
    '#D32F2F',
]);
//  Checked in rgba() form too. The last palette change only rewrote hex, so
//  59 files quietly kept the previous theme's magenta as rgba(199,52,202,a) -
//  including the four department cards on My Company, whose comments still
//  read "Gold" and "Green" while the values were magenta. A colour spelled in
//  decimal is the same colour; the audit has to read both spellings.
const rgbToHex = (r, g, b) =>
    '#' + [r, g, b].map(v => (+v).toString(16).padStart(2, '0')).join('').toUpperCase();

for (const f of files.filter(f => !isDisabled(f) && !optedOut(f) && !f.endsWith('theme.ts'))) {
    const seen = new Map();
    read(f).split('\n').forEach((line, i) => {
        if (/^\s*(\/\/|\*)/.test(line)) return;          // comments may cite old values
        for (const m of line.matchAll(/#[0-9A-Fa-f]{6}/g)) {
            const hex = m[0].toUpperCase();
            if (!PALETTE.has(hex) && !seen.has(hex)) seen.set(hex, i + 1);
        }
        for (const m of line.matchAll(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*[,)]/g)) {
            const hex = rgbToHex(m[1], m[2], m[3]);
            if (!PALETTE.has(hex) && !seen.has(hex)) seen.set(hex, i + 1);
        }
    });
    for (const [hex, ln] of seen) {
        problems.palette.push(`${rel(f)}:${ln}  ${hex}`);
    }
}

// --- 0d2) The profit/loss colours used as decoration -------------------------
//  Green and red are the only two colours in the app that MEAN something, and
//  that only works if they appear nowhere else. They kept drifting: the credit
//  rating painted six of its seven grades red (AAA included), the back arrow
//  was red, and the share price - a number with no direction of its own - was
//  red. At that point red no longer says "loss", it just says "text".
//
//  So: the signal tokens may be a text colour and nothing else. A fill or a
//  border using them is the drift starting again.
//
//  The rule now covers seven tokens rather than five. `brand`, `brandMuted`
//  and `rp` joined it the day they were created: a colour that says "this is
//  brand value" stops saying it the moment a card is filled with it.
//
//  And the MIRROR: the category colours are the opposite case. They exist to
//  be a line under a header, so a `color:` using one is the same mistake
//  pointing the other way - wayfinding borrowed as meaning. They live in
//  `theme.categories`, which makes both halves greppable.
{
    // Exact match, not a substring: `up` and `down` are short enough to hide
    // inside other token names (a `dropdown` fill would have been reported as
    // a signal). A `negativeSoft` tint is genuinely meant to be a fill, so
    // anchoring loses nothing.
    const SIGNAL = /^(positive|negative|success|danger|error|brand|brandMuted|rp|up|down)$/;
    for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
        read(f).split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line)) return;

            // The badge red used as TEXT. The mirror of the signal rule: it
            // is a fill and only a fill, which is what keeps it from becoming
            // a second loss red.
            for (const m of line.matchAll(/\bcolor:\s*(?:theme\.)?colors\.notification\b(?!Text)/g)) {
                problems.palette.push(
                    `${rel(f)}:${i + 1}  colors.notification used as text - it is a badge fill`);
            }

            // A category colour used as TEXT. The header rule is the only
            // thing these are for.
            for (const m of line.matchAll(/\bcolor:\s*(?:theme\.)?categories\.(\w+)/g)) {
                problems.palette.push(
                    `${rel(f)}:${i + 1}  categories.${m[1]} used as text - it is a header rule, not a meaning`);
            }
            // matchAll, not match: these styles are often written one per line
            // as `{ backgroundColor: x, borderColor: y }`, and stopping at the
            // first hit reported the fill while missing the border beside it.
            for (const m of line.matchAll(/(backgroundColor|border[A-Za-z]*Color):\s*(?:theme\.)?colors\.(\w+)/g)) {
                if (SIGNAL.test(m[2])) {
                    problems.palette.push(`${rel(f)}:${i + 1}  ${m[2]} used as ${m[1]}`);
                }
            }
            // The profit/loss colours written as RAW HEX rather than through
            // their tokens. This is how the red kept leaking back in after
            // every sweep: CollapsibleSection painted every section HEADING
            // with #FF8A8A, so "Competitors" and "R&D Upgrades" read as
            // problems on every screen in the app. A signal spelled as a
            // literal is a signal nobody can grep for by token.
            for (const m of line.matchAll(/\bcolor:\s*'(#FF8A8A|#4ADE80)'/gi)) {
                problems.palette.push(
                    `${rel(f)}:${i + 1}  ${m[1]} as raw hex - use colors.negative / colors.positive`);
            }
            // The same signal spelled as a JSX PROP rather than a style. This
            // is how the loss red survived every previous sweep as the BACK
            // ARROW on Profile and Notes: `<Icon color="#FF8A8A" />` is not a
            // style block, so nothing above was looking at it. A red arrow
            // out of a screen says the way back is a loss.
            //
            // Gradient arrays too - Notes drew its "new note" button as a
            // gradient from #FF8A8A to #FF8A8A, which is a fill wearing a
            // gradient's clothes.
            for (const m of line.matchAll(/(?:color|Color)\s*=\s*["'](#FF8A8A|#4ADE80)["']/g)) {
                problems.palette.push(
                    `${rel(f)}:${i + 1}  ${m[1]} as a JSX prop - a signal colour on a control`);
            }
            for (const m of line.matchAll(/colors=\{\[[^\]]*(#FF8A8A|#4ADE80)[^\]]*\]\}/g)) {
                problems.palette.push(
                    `${rel(f)}:${i + 1}  ${m[1]} in a gradient - a signal colour as a fill`);
            }
        });
    }
}

// --- 0d5) A way out that is not THE way out ----------------------------------
//  The app once had, at the same time: "← Close" as text, a bare "←", a "✕"
//  in the top right, a "← Back", a full-width Close at the bottom, and screens
//  with no way out at all. The player's note was that leaving should not
//  depend on how a screen happened to be built.
//
//  So there is one header component, and this pass is what keeps it the only
//  one. Any reachable file that draws an exit glyph without going through
//  ScreenHeader is building a second way out.
//
//  The vote glyphs on the board screens are the same character as a close
//  (`{v.vote === 'YES' ? '✓' : '✕'}`), which would be a false positive - but
//  those files use ScreenHeader, so they are already exempt. That is the
//  reason the test is "does this file use the header", not "does this line
//  look like a close".
{
//  TWO REFINEMENTS, both paid for by a false positive:
//
//  - A GLYPH WITH WORDS BESIDE IT IS A LABEL, not an exit. "✖ Skip" on the
//    match popup is a choice in a game, and reporting it taught me that the
//    test has to be "is the glyph the whole button", not "does the glyph
//    appear". Icon NAMES are exempt from that softening - nothing is called
//    `arrow-left` by accident.
//
//  - `@exit-ok <reason>` on the line or just above it. The settings drawer on
//    Home is shelved behind a flag that is off; its close button is code kept
//    on purpose, and a whole-file opt-out there would blind the audit to the
//    rest of the busiest screen in the app.
    // Two regexes for one character class, and NOT an oversight: a /g regex
    // keeps `lastIndex` between calls, so using the same object for `.test()`
    // and `.replace()` makes the test alternate true/false down the file. It
    // reported the pass as clean while four real cases sat in front of it.
    const GLYPH = /[✕✖⨯←]/;
    const GLYPH_ALL = /[✕✖⨯←]/g;
    const ICON = /arrow-left|window-close|close-circle/;
    for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
        const src = read(f);
        if (/ScreenHeader/.test(src)) continue;
        const lines = src.split('\n');
        lines.forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line)) return;
            if (lines.slice(Math.max(0, i - 3), i + 1).some(l => /@exit-ok\s/.test(l))) return;

            if (!ICON.test(line)) {
                // The CAPTURE, not the match: `line.match(..., 'g')` returns
                // the delimiters too, so the leftover after stripping the
                // glyph was always "><" - non-empty, so every real case was
                // dismissed as "a label". The pass reported clean twice.
                const inner = [...line.matchAll(/>([^<>{}]*)</g)].map(m => m[1]).join(' ');
                if (!GLYPH.test(inner)) return;
                // Anything left once the glyph goes means it was a label.
                if (inner.replace(GLYPH_ALL, '').trim()) return;
            }
            problems.exits.push(`${rel(f)}:${i + 1}  ${line.trim().slice(0, 68)}`);
        });
    }
}

// --- 0d6) The player's name, read from the store that does not own it -------
//  Onboarding writes the name to useIdentityStore. useUserStore still has a
//  `name` field holding the old 'John Rich' default, and the home screen went
//  on reading THAT - so the player typed a name, the game saved it, and the
//  first screen after onboarding greeted him as John Rich.
//
//  The two stores are not interchangeable and the difference is the whole
//  point: useUserStore is wiped by a new game, and who you are is not. So
//  destructuring `name` or `gender` off useUserStore is always the bug, and
//  it is quiet - it compiles, it renders, it is just the wrong person.
{
    for (const f of files.filter(f => /\.tsx?$/.test(f) && !isDisabled(f) && !optedOut(f))) {
        if (/useUserStore\.ts$/.test(f)) continue;   // the declaration itself
        read(f).split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line)) return;
            // `const { name, bio, gender } = useUserStore()` and the selector
            // form `useUserStore(s => s.name)`.
            const destructured = line.match(/const\s*\{([^}]*)\}\s*=\s*useUserStore\(/);
            const selected = line.match(/useUserStore\(\s*\w+\s*=>\s*\w+\.(name|gender)\b/);
            const hit = selected?.[1]
                || (destructured && /(^|,)\s*(name|gender)\s*(,|$)/.test(destructured[1])
                    ? (/(^|,)\s*name\s*(,|$)/.test(destructured[1]) ? 'name' : 'gender')
                    : null);
            if (!hit) return;
            problems.palette.push(
                `${rel(f)}:${i + 1}  useUserStore.${hit} - superseded by useIdentityStore, and wiped by a new game`);
        });
    }
}


// --- 0d7) Conversation graphs -----------------------------------------------
//  A story told as a graph has three failures that are invisible by reading
//  and obvious by walking:
//
//    a link to a card that does not exist   - the branch just stops
//    a card nothing leads to                - written, never seen
//    a card whose every answer is gated     - can offer nothing at all
//
//  All three look FINISHED in the data file, which is exactly why a person
//  cannot be the check.
//
//  IT RUNS THE APP'S OWN VALIDATOR. core/story/graph.ts is transpiled and
//  called directly, so the audit and the runner cannot drift into disagreeing
//  about what a valid graph is - there is one definition of "valid" and both
//  of them use it.
//
//  Transpiled with the TypeScript compiler rather than stripped with regexes.
//  I tried the regex first and it fell over on `export type Channel = ...` -
//  which is the honest outcome, because a regex that understands TypeScript
//  types is just a worse compiler. `transpileModule` also drops `import type`
//  lines for free, so a data file's type imports never need resolving.
{
    const ts = require('typescript');
    const dir = path.join(SRC, 'data/story');

    /**
     * Run one TS file as CommonJS and hand back its exports.
     *
     * It resolves relative imports, because graph.ts genuinely needs one -
     * `canUseChannel` lives in cast.ts. But ONLY within core/story and
     * data/story: anything reaching outside those is either a layering
     * mistake or the start of dragging zustand and AsyncStorage into an audit
     * script, and both are worth stopping at the door rather than debugging
     * later.
     */
    //  core/events and data/events joined the list when events became data.
    //  They only reach INTO core/story - conditions, graph - never the other
    //  way, so the layering the guard exists to protect is intact and the
    //  event pool can be validated by the same loader.
    const STORY_DIRS = [
        path.join(SRC, 'core/story'), path.join(SRC, 'data/story'),
        path.join(SRC, 'core/events'), path.join(SRC, 'data/events'),
    ];
    const cache = new Map();
    const loadTs = (file) => {
        const key = path.resolve(file);
        if (cache.has(key)) return cache.get(key);
        if (!STORY_DIRS.some(d => key.startsWith(d))) {
            throw new Error(`story code may not reach outside core/story and data/story (${rel(file)})`);
        }
        const js = ts.transpileModule(read(key), {
            compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
        }).outputText;
        const module = { exports: {} };
        cache.set(key, module.exports);   // set first, so a cycle terminates
        const req = (spec) => {
            if (!spec.startsWith('.')) {
                throw new Error(`story code may not import packages (${spec})`);
            }
            const base = path.resolve(path.dirname(key), spec);
            const candidate = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')]
                .find(fs.existsSync);
            if (!candidate) throw new Error(`cannot resolve ${spec} from ${rel(key)}`);
            return loadTs(candidate);
        };
        // eslint-disable-next-line no-new-func
        new Function('module', 'exports', 'require', js)(module, module.exports, req);
        cache.set(key, module.exports);
        return module.exports;
    };

    if (fs.existsSync(dir)) {
        let validate = null;
        let CAST = null;
        try {
            validate = loadTs(path.join(SRC, 'core/story/graph.ts')).validate;
        } catch (e) {
            problems.story.push(`core/story/graph.ts  validator would not load: ${e.message}`);
        }
        // The cast, so the channel rule can be enforced rather than trusted.
        // Pear writes letters; a scene that has him texting is a piece of
        // characterisation quietly dying, and it reads perfectly well.
        try {
            CAST = loadTs(path.join(dir, 'cast.ts')).CAST;
        } catch (e) {
            problems.story.push(`data/story/cast.ts  could not be read: ${e.message}`);
        }

        // A scene file, its own tests, and the two support files are three
        // different things. Without the .test exclusion the pass reported
        // "exports no conversation" against a test that was never meant to.
        const isSceneFile = f =>
            /\.ts$/.test(f) && !/\.test\.ts$/.test(f)
            && f !== 'index.ts' && f !== 'cast.ts' && f !== 'endings.ts';

        const dataFiles = fs.readdirSync(dir).filter(isSceneFile);

        // Event scenes live in data/events and are registered in the story
        // index, so they count as known ids and are validated like any other.
        const eventDir = path.join(SRC, 'data/events');
        const eventFiles = fs.existsSync(eventDir)
            ? fs.readdirSync(eventDir).filter(isSceneFile)
            : [];

        // Every conversation id in the game, gathered before validating any of
        // them - a scene can schedule a reply that lives in another file.
        const known = new Set();
        const collect = (base, files) => {
            for (const file of files) {
                try {
                    for (const v of Object.values(loadTs(path.join(base, file)))) {
                        if (v && typeof v === 'object' && v.id && Array.isArray(v.nodes)) known.add(v.id);
                    }
                } catch { /* reported below when it is loaded for real */ }
            }
        };
        collect(dir, dataFiles);
        collect(eventDir, eventFiles);

        const index = fs.existsSync(path.join(dir, 'index.ts'))
            ? read(path.join(dir, 'index.ts')) : '';

        // ------------------------------------------------------------------
        //  EVENT SCENES, THROUGH THE SAME VALIDATOR
        // ------------------------------------------------------------------
        //  They are conversations. Giving them a second, gentler check because
        //  they happen to live in another folder is how two definitions of
        //  "valid" get started.
        // ------------------------------------------------------------------
        for (const file of eventFiles) {
            let exported;
            try {
                exported = loadTs(path.join(eventDir, file));
            } catch (e) {
                problems.story.push(`data/events/${file}  could not be read: ${e.message}`);
                continue;
            }
            for (const c of Object.values(exported)) {
                if (!(c && typeof c === 'object' && c.id && Array.isArray(c.nodes))) continue;
                if (validate) {
                    for (const pr of validate(c, CAST, known)) {
                        problems.story.push(
                            `data/events/${file}  ${pr.conversation}${pr.node ? '/' + pr.node : ''}  ${pr.kind}: ${pr.detail}`);
                    }
                }
                // The headline appears and the message never does. That is
                // what an unregistered event scene looks like from the
                // player's side, and nothing else would report it.
                if (!index.includes(file.replace(/\.ts$/, ''))) {
                    problems.story.push(
                        `data/events/${file}  ${c.id} is not in data/story/index.ts, so the inbox cannot deliver it`);
                }
            }
        }

        // ------------------------------------------------------------------
        //  AN ENDING THAT DOES NOT EXIST
        // ------------------------------------------------------------------
        //  The same failure as a broken link, at the worst possible moment:
        //  the player makes the biggest decision in the game, presses the
        //  button, and nothing happens. `ending` effects name an id in
        //  data/story/endings.ts and this checks they are all real.
        // ------------------------------------------------------------------
        try {
            const { ENDINGS } = loadTs(path.join(dir, 'endings.ts'));
            const known = new Set(Object.keys(ENDINGS));
            const walk = (c, file) => {
                for (const node of c.nodes || []) {
                    for (const choice of node.choices || []) {
                        for (const e of choice.effects || []) {
                            if (e.kind === 'ending' && !known.has(e.ending)) {
                                problems.story.push(
                                    `${file}  ${c.id}/${node.id}  unknown-ending: "${e.ending}" is not in data/story/endings.ts`);
                            }
                        }
                    }
                }
            };
            for (const file of dataFiles) {
                for (const v of Object.values(loadTs(path.join(dir, file)))) {
                    if (v && typeof v === 'object' && v.id && Array.isArray(v.nodes)) {
                        walk(v, `data/story/${file}`);
                    }
                }
            }
            for (const file of eventFiles) {
                for (const v of Object.values(loadTs(path.join(eventDir, file)))) {
                    if (v && typeof v === 'object' && v.id && Array.isArray(v.nodes)) {
                        walk(v, `data/events/${file}`);
                    }
                }
            }
        } catch (e) {
            problems.story.push(`data/story/endings.ts  could not be checked: ${e.message}`);
        }

        // ------------------------------------------------------------------
        //  THE TRIGGERS THEMSELVES
        // ------------------------------------------------------------------
        //  A random event's characteristic bug is not a crash. It is firing
        //  the wrong thing at the wrong time and looking fine. Because the
        //  triggers are data, the app's own validator can read them.
        // ------------------------------------------------------------------
        try {
            const { validateEvents } = loadTs(path.join(SRC, 'core/events/engine.ts'));
            const { EVENTS } = loadTs(path.join(eventDir, 'index.ts'));
            for (const pr of validateEvents(EVENTS, known)) {
                problems.story.push(`data/events  ${pr.event}  ${pr.kind}: ${pr.detail}`);
            }
            // Registered in the pool, or it never rolls. Same failure as an
            // unregistered conversation, one level up.
            for (const file of eventFiles) {
                const exported = loadTs(path.join(eventDir, file));
                for (const [name, v] of Object.entries(exported)) {
                    const isEvent = v && typeof v === 'object'
                        && typeof v.chance === 'number' && v.conversation;
                    if (isEvent && !EVENTS.some(e => e.id === v.id)) {
                        problems.story.push(
                            `data/events/${file}  ${name} is not in data/events/index.ts, so it can never fire`);
                    }
                }
            }
        } catch (e) {
            problems.story.push(`data/events  could not be checked: ${e.message}`);
        }

        for (const file of dataFiles) {
            let exported;
            try {
                exported = loadTs(path.join(dir, file));
            } catch (e) {
                problems.story.push(`data/story/${file}  could not be read: ${e.message}`);
                continue;
            }

            const conversations = Object.values(exported)
                .filter(v => v && typeof v === 'object' && v.id && Array.isArray(v.nodes));

            if (conversations.length === 0) {
                problems.story.push(`data/story/${file}  exports no conversation`);
                continue;
            }

            for (const c of conversations) {
                if (validate) {
                    for (const pr of validate(c, CAST, known)) {
                        problems.story.push(
                            `data/story/${file}  ${pr.conversation}${pr.node ? '/' + pr.node : ''}  ${pr.kind}: ${pr.detail}`);
                    }
                }
                // Written but not registered is not in the game - and, worse,
                // nothing above would have checked it either.
                if (!index.includes(file.replace(/\.ts$/, ''))) {
                    problems.story.push(
                        `data/story/${file}  ${c.id} is not in data/story/index.ts, so it is not in the game`);
                }
            }
        }
    }
}

// --- 0d8) Teaching locks that could trap the player ----------------------
//  A lock dims the screen and lights one control. If that control cannot be
//  used, the game is not lost - it is STUCK, and the player cannot tell the
//  difference until it is too late.
//
//  The shape this catches: a lock cleared by SPENDING with nothing stopping
//  it engaging when there is no money. That is the bonus trap, and it is
//  visible in the data. The ones that are not visible are why the overlay's
//  timed skip exists and is not optional.
{
    const ts = require('typescript');
    const seqFile = path.join(SRC, 'data/tutorial/sequence.ts');
    const coreFile = path.join(SRC, 'core/tutorial/locks.ts');

    if (fs.existsSync(seqFile) && fs.existsSync(coreFile)) {
        const runTs = (file) => {
            const js = ts.transpileModule(read(file), {
                compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
            }).outputText;
            const module = { exports: {} };
            const req = (spec) => {
                const base = path.resolve(path.dirname(file), spec);
                const found = [base + '.ts', path.join(base, 'index.ts')].find(fs.existsSync);
                if (!found) throw new Error(`cannot resolve ${spec}`);
                return runTs(found);
            };
            // eslint-disable-next-line no-new-func
            new Function('module', 'exports', 'require', js)(module, module.exports, req);
            return module.exports;
        };
        try {
            const { validateLocks } = runTs(coreFile);
            const { TUTORIAL_SEQUENCE } = runTs(seqFile);
            for (const pr of validateLocks(TUTORIAL_SEQUENCE)) {
                problems.story.push(`data/tutorial/sequence.ts  ${pr.lock}  ${pr.kind}: ${pr.detail}`);
            }
            // A lock pointing at a key no screen registers dims the screen and
            // lights nothing - which reads as a freeze even though it is not.
            const registered = new Set();
            for (const f of files) {
                for (const m of read(f).matchAll(/tutorialKey=["']([\w-]+)["']/g)) registered.add(m[1]);
            }
            for (const l of TUTORIAL_SEQUENCE) {
                if (!registered.has(l.highlight)) {
                    problems.story.push(
                        `data/tutorial/sequence.ts  ${l.id}  highlights "${l.highlight}", which no screen registers`);
                }
            }
        } catch (e) {
            problems.story.push(`data/tutorial  could not be checked: ${e.message}`);
        }
    }
}

// --- 0d3) `{someString && <JSX/>}` -------------------------------------------
//  A guard on a STRING renders the string when it is empty: `'' && <Text/>`
//  evaluates to `''`, and React Native refuses to draw a bare string with
//  "Text strings must be rendered within a <Text> component". The crash gives
//  a stack of nothing but React internals - no component name, no file - so it
//  cost several passes to find by hand. `!!` costs nothing and ends it.
//
//  Same hazard with a number: `{count && <X/>}` prints 0.
{
    const STRINGY = /^(title|subtitle|name|label|text|message|note|hint|desc|description|reason|symbol|summary|caption|error|msg|value|unit|why|detail|placeholder|tag|category|region|count|total|length)$/i;
    for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
        read(f).split('\n').forEach((line, i) => {
            if (/^\s*(\/\/|\*)/.test(line)) return;
            for (const m of line.matchAll(/\{\s*(?:[\w.?]+\.)?(\w+)\s*&&\s*[(<]/g)) {
                if (STRINGY.test(m[1]) && !/\{\s*!!/.test(m[0])) {
                    problems.stringGuards.push(
                        `${rel(f)}:${i + 1}  {${m[1]} && ...} - use !! or it renders '' / 0`);
                }
            }
        });
    }
}

// --- 0d4) Whitespace that survives as a text node -----------------------------
//  JSX drops whitespace-only text that contains a NEWLINE. Whitespace on a
//  SINGLE line between two tags is kept as a real text node - and React Native
//  refuses to draw one outside <Text>:
//
//      {/* comment */}            </View>      <- a text node lives in there
//      </ScrollView>            </SafeAreaView>
//
//  46 of these appeared at once when a regex removed a component and left the
//  neighbouring tags sharing a line. They caused the console error that took
//  four passes to find: the stack is React internals only - no file, no
//  component - and nothing looks wrong on screen. A machine has to see it.
//
//  Parsed rather than matched. A regex cannot tell whether the whitespace sits
//  inside a <Text>, where it is legal, and guessing produced both misses and
//  false alarms.
{
    let ts = null;
    try { ts = require(path.join(__dirname, '..', 'node_modules', 'typescript')); } catch { /* optional */ }
    if (ts) {
        for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
            const src = read(f);
            const sf = ts.createSourceFile(f, src, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
            const visit = node => {
                if (ts.isJsxText(node)) {
                    const raw = node.getFullText(sf);
                    if (raw.length && raw.trim() === '' && !raw.includes('\n')) {
                        const p = node.parent;
                        const tag = ts.isJsxElement(p) ? p.openingElement.tagName.getText(sf) : '?';
                        if (tag !== 'Text') {
                            const ln = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
                            problems.stringGuards.push(
                                `${rel(f)}:${ln}  whitespace between tags on one line renders as text inside <${tag}>`);
                        }
                    }
                }
                ts.forEachChild(node, visit);
            };
            visit(sf);
        }
    }
}

// --- 0e) Text that cannot be read on the ground -----------------------------
//  Chained palette migrations quietly turned old `color: '#000'` into the
//  BACKGROUND colour, so 89 labels became invisible - the player found it as
//  "this button and its text are both gone". Fill tones are dark by design and
//  make unreadable text; each has a lightened form for that job.
{
    const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const lum = c => {
        const [r, g, b] = c.map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
        const l1 = lum(a), l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };
    const GROUND = hx('#020626');

    for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
        read(f).split('\n').forEach((line, i) => {
            const m = line.match(/\bcolor: *'(#[0-9A-Fa-f]{6})'/);
            if (m && ratio(hx(m[1].toUpperCase()), GROUND) < 3) {
                problems.contrast.push(`${rel(f)}:${i + 1}  ${m[1]} on the ground`);
            }
            const faint = line.match(/\bcolor: *'rgba\(255,255,255, *([\d.]+)\)'/);
            if (faint && parseFloat(faint[1]) < 0.35) {
                problems.contrast.push(`${rel(f)}:${i + 1}  white at ${faint[1]} alpha`);
            }
        });
    }
}

// --- 0f) Text on a LIGHT fill ----------------------------------------------
//  Pass 0e only ever compared text against the ground, so an entire class was
//  invisible to it: a label is white, the ground is dark, but the button under
//  the label is filled cyan. White on cyan measures 2.34 and white on lavender
//  1.72 - painted, unreadable, and passing the audit. The player reported it as
//  "the Directors tab and its text both look like they aren't there".
//
//  A style block alone cannot see this; the fill and the label live in separate
//  blocks and are only related through the JSX tree. So this walks the tree:
//  find a container whose style carries a light backgroundColor, then check
//  every <Text> inside its span against that fill.
{
    const hx = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
    const lum = c => {
        const [r, g, b] = c.map(v => {
            v /= 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const ratio = (a, b) => {
        const l1 = lum(a), l2 = lum(b);
        return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    };

    // Resolve theme tokens to hex straight from theme.ts, so the audit cannot
    // drift out of step with the palette the way a hardcoded copy would.
    const TOKENS = new Map();
    for (const m of read(path.join(SRC, 'core/theme.ts'))
        .matchAll(/(\w+): *'(#[0-9A-Fa-f]{6})'/g)) {
        if (!TOKENS.has(m[1])) TOKENS.set(m[1], m[2].toUpperCase());
    }
    const LIGHT = t => TOKENS.has(t) && lum(hx(TOKENS.get(t))) > 0.25;

    // The open tag cannot be found with indexOf('>'): `style={({pressed}) => [`
    // contains one. Track bracket depth and skip the arrow.
    const endOpen = (s, i) => {
        let d = 0;
        for (; i < s.length; i++) {
            const c = s[i];
            if ('{(['.includes(c)) d++;
            else if ('})]'.includes(c)) d--;
            else if (c === '>' && d === 0 && s[i - 1] !== '=') return i;
        }
        return -1;
    };
    const TAGS = ['TouchableOpacity', 'Pressable', 'TouchableHighlight', 'View'];

    for (const f of files.filter(f => f.endsWith('.tsx') && !isDisabled(f) && !optedOut(f))) {
        const src = read(f);
        const blocks = new Map();
        for (const m of src.matchAll(/(\w+): *\{([^{}]*)\}/g)) blocks.set(m[1], m[2]);
        const tokenOf = (name, prop) => {
            const b = blocks.get(name);
            if (!b) return null;
            // `colors.danger + '20'` is a 12.5%-alpha TINT, not a fill: over a
            // dark surface it resolves to #3C225F. Reading it as a solid light
            // fill is how an earlier pass talked me into putting dark text on a
            // dark box. Anything with an alpha suffix is not a light fill.
            const re = prop === 'bg'
                ? /backgroundColor: *(?:theme\.)?colors\.(\w+)(?! *\+)/
                : /(?:^|\n)\s*color: *(?:theme\.)?colors\.(\w+)/;
            return (b.match(re) || [])[1] || null;
        };
        // ------------------------------------------------------------------
        //  A STYLE ARRAY IS NOT A LIST, IT IS A SET OF POSSIBLE SCREENS
        // ------------------------------------------------------------------
        //  `[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleThem]`
        //  does not resolve to one style. It resolves to one of two, and which
        //  one decides what the text sitting inside it should be.
        //
        //  Reading it as "last entry wins" paired the MINE text colour with
        //  the THEM background - two branches that can never both be on - and
        //  reported the message thread as unreadable. It is not. That screen
        //  is where every story scene is read, so a false alarm there is
        //  exactly the one that gets a rule quietly dropped instead of obeyed.
        //
        //  So each entry carries the condition that switches it on, and the
        //  check enumerates the real combinations. Two entries guarded by the
        //  SAME condition text can never be on at once, which is the whole
        //  fix - the container and the label are usually guarded by the same
        //  `isMine`, and that is what ties them together.
        // ------------------------------------------------------------------

        /**
         * Ordered style entries in one open tag, each with the guard that
         * enables it. `cond ? A : B` becomes A-if-cond and B-if-not-cond;
         * `cond && A` becomes A-if-cond; a bare entry has no guard.
         */
        const entriesIn = (slice) => {
            const out = [];
            // Ternary first, so its two branches are not also read as bare.
            const claimed = new Set();
            for (const m of slice.matchAll(
                /([A-Za-z_$][\w$.]*)\s*\?\s*styles\.(\w+)\s*:\s*styles\.(\w+)/g)) {
                out.push({ name: m[2], guard: m[1], on: true, at: m.index });
                out.push({ name: m[3], guard: m[1], on: false, at: m.index + 1 });
                claimed.add(m[2]); claimed.add(m[3]);
            }
            for (const m of slice.matchAll(
                /([A-Za-z_$][\w$.]*)\s*&&\s*styles\.(\w+)/g)) {
                out.push({ name: m[2], guard: m[1], on: true, at: m.index });
                claimed.add(m[2]);
            }
            for (const m of slice.matchAll(/styles\.(\w+)/g)) {
                if (!claimed.has(m[1])) out.push({ name: m[1], guard: null, on: true, at: m.index });
            }
            return out.sort((a, b) => a.at - b.at);
        };

        /** The entry that actually applies, given a truth value per guard. */
        const resolve = (entries, prop, world) => {
            let token = null, from = null;
            for (const e of entries) {
                if (e.guard && (world[e.guard] ?? true) !== e.on) continue;
                const t = tokenOf(e.name, prop);
                if (t) { token = t; from = e.name; }
            }
            return { token, from };
        };

        /** Every consistent combination of the guards involved. Capped. */
        const worlds = (guards) => {
            const g = [...new Set(guards.filter(Boolean))].slice(0, 6);
            const out = [];
            for (let mask = 0; mask < (1 << g.length); mask++) {
                const w = {};
                g.forEach((name, i) => { w[name] = !!(mask & (1 << i)); });
                out.push(w);
            }
            return out;
        };

        // Collect every container that paints a background, with its span.
        const spans = [];
        for (const tag of TAGS) {
            for (const m of src.matchAll(new RegExp(`<${esc(tag)}\\b`, 'g'))) {
                const j = endOpen(src, m.index);
                if (j < 0 || src[j - 1] === '/') continue;
                const slice = src.slice(m.index, j);
                const entries = entriesIn(slice);
                const inline = slice
                    .match(/backgroundColor: *(?:theme\.)?colors\.(\w+)(?! *\+)/);
                // ----------------------------------------------------------
                //  A FILL THIS SCRIPT CANNOT READ IS STILL A FILL
                // ----------------------------------------------------------
                //  `backgroundColor: avatarTintFor(name)` paints the box, and
                //  the audit has no idea with what. Treating it as "does not
                //  paint" made the label inside get checked against the ROW
                //  behind it instead - so black initials on a light avatar
                //  were reported as black on the dark ground, 1.34.
                //
                //  Marked unknown instead. Anything sitting on it is skipped,
                //  because the honest answer here is "cannot tell", and a
                //  confident wrong answer is what makes people stop reading
                //  the output. The tints themselves are measured where they
                //  are declared, in theme.ts.
                // ----------------------------------------------------------
                const paintsUnknown = !inline
                    && /backgroundColor:/.test(slice)
                    && !entries.some(e => tokenOf(e.name, 'bg'));
                const paints = inline || paintsUnknown
                    || entries.some(e => tokenOf(e.name, 'bg'));
                if (!paints) continue;
                const re = new RegExp(`<(/?)${esc(tag)}\\b`, 'g');
                re.lastIndex = j + 1;
                let depth = 1, end = src.length, hit;
                while (depth > 0 && (hit = re.exec(src))) {
                    depth += hit[1] === '/' ? -1 : 1;
                    if (depth === 0) end = hit.index;
                }
                spans.push({
                    start: m.index, end, entries,
                    inlineFill: inline && inline[1],
                    unknown: paintsUnknown,
                });
            }
        }

        const seen = new Set();
        for (const tm of src.matchAll(/<Text\b/g)) {
            const te = endOpen(src, tm.index);
            if (te < 0) continue;
            const slice = src.slice(tm.index, te);
            const textEntries = entriesIn(slice);
            const inlineText = slice.match(/\bcolor: *(?:theme\.)?colors\.(\w+)/);
            if (!inlineText && !textEntries.some(e => tokenOf(e.name, 'color'))) continue;

            // The label sits on its INNERMOST painted ancestor, not on every
            // ancestor. A cyan button inside a dark card was being checked
            // against the card too, which reported the button's own correct
            // dark label as unreadable.
            let inner = null;
            for (const s of spans) {
                if (s.start >= tm.index || s.end <= tm.index) continue;
                if (!inner || s.start > inner.start) inner = s;
            }
            // Its nearest background is one this script cannot resolve, so
            // there is nothing honest to compare against.
            if (!inner || inner.unknown) continue;

            // Guards from BOTH the label and its background, evaluated
            // together - that shared `isMine` is the whole point.
            const allGuards = [...inner.entries, ...textEntries].map(e => e.guard);
            for (const world of worlds(allGuards)) {
                const fill = inner.inlineFill
                    || resolve(inner.entries, 'bg', world).token;
                const text = inlineText
                    ? inlineText[1]
                    : resolve(textEntries, 'color', world).token;
                if (!fill || !text || !TOKENS.has(fill) || !TOKENS.has(text)) continue;

                const r = ratio(hx(TOKENS.get(text)), hx(TOKENS.get(fill)));
                const key = `${text}|${fill}`;
                if (r < 3 && !seen.has(key)) {
                    seen.add(key);
                    const ln = src.slice(0, tm.index).split('\n').length;
                    problems.contrast.push(
                        `${rel(f)}:${ln}  ${text} on ${fill} fill = ${r.toFixed(2)}`);
                }
            }
        }
    }
}

// --- 1) Components nothing renders -----------------------------------------
//  Matched on IMPORT PATH, not on symbol name. Matching the exported symbol
//  gave false positives: RAndDModal.tsx exports `RAndDModalRevised` as a const
//  and the real component as the default, so the audit hunted for a name
//  nobody imports while the file itself was rendered every game.
//
//  The path now comes from the parsed import declaration rather than from a
//  regex, so a filename mentioned in a comment - or in a commented-out import,
//  which is exactly what shelving one produces - no longer counts as rendering
//  the screen.
// A .tsx TEST is not a component that nothing renders - it is a test, and
// what renders it is jest. This project's first .tsx test file appeared as a
// finding the moment it was written, which would have taught whoever wrote
// the second one that the audit punishes rendering tests.
for (const f of files.filter(f =>
    f.endsWith('.tsx') && !/\.test\.tsx$/.test(f) && !isDisabled(f))) {
    if (optedOut(f)) continue;
    const base = path.basename(f).replace(/\.tsx$/, '');
    const imported = [...REFERENCE_INDEX.importsOf].some(([g, specs]) =>
        path.resolve(g) !== path.resolve(f) && [...specs].some(s => path.basename(s) === base));
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

// ---------------------------------------------------------------------------
//  READING A DECLARATION OUT OF THE TREE RATHER THAN OFF THE PAGE
// ---------------------------------------------------------------------------
//  The two passes below used to find their subjects with `^\s{4}(\w+):\s*\(`
//  and `^\s{2}(\w+)\??:` - four spaces meant "an action", two meant "a stats
//  field". Reformatting a file, or nesting an interface one level deeper,
//  silently emptied the check and it would have reported a clean pass while
//  looking at nothing. Indentation is not a language feature here.
// ---------------------------------------------------------------------------
//  ---------------------------------------------------------------------------
//  AND IT WAS STILL ONLY READING A MINORITY OF THE STORES
//  ---------------------------------------------------------------------------
//  Two narrower assumptions survived the rewrite above, and between them they
//  hid FIFTEEN of the stores in this project:
//
//    1. `ts.isInterfaceDeclaration` only. Most stores here are written
//       `type XStore = XState & { ...actions }` - a type ALIAS holding an
//       INTERSECTION, which this walked straight past.
//    2. A name matcher of /State$/. In those same stores `XState` holds only
//       the data; every action lives on `XStore`.
//
//  So `useMessageStore`, `useGameStore`, `useStatsStore`, `useStoryStore` and
//  eleven others were never inspected at all, and the headline number was
//  measured against whatever was left. A check that silently examines a third
//  of its subject is worse than no check, because it reports OK.
//  ---------------------------------------------------------------------------

/** Members of every interface, type alias or intersection whose name matches. */
const interfaceMembers = (f, matches) => {
    const out = [];
    const sf = REFERENCE_INDEX.sourceOf(f);
    if (!sf) return out;
    // Members of a TypeLiteral, or of every literal inside an intersection.
    const membersOf = (type) => {
        if (!type) return [];
        if (ts.isTypeLiteralNode(type)) return type.members;
        if (ts.isIntersectionTypeNode(type)) return type.types.flatMap(membersOf);
        return [];
    };
    ts.forEachChild(sf, (node) => {
        const named = ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node);
        if (!named || !matches(node.name.text)) return;
        const members = ts.isInterfaceDeclaration(node) ? node.members : membersOf(node.type);
        for (const m of members) {
            if (!m.name || !ts.isIdentifier(m.name)) continue;
            const type = m.type;
            out.push({
                name: m.name.text,
                decl: m,
                // A function-typed property is an action; anything else is data.
                isFunction: !!type && (ts.isFunctionTypeNode(type)
                    || (ts.isUnionTypeNode(type) && type.types.some(ts.isFunctionTypeNode))),
            });
        }
    });
    return out;
};

// --- 2) Store actions no component calls ------------------------------------
for (const f of files.filter(f => /use\w+Store\.ts$/.test(f))) {
    if (isDisabled(f) || optedOut(f)) continue;   // shelved modules are not a finding
    for (const member of interfaceMembers(f, n => /(State|Store|Actions)$/.test(n))) {
        if (!member.isFunction) continue;
        // Zustand's persist middleware calls this one, from inside the store's
        // own file, through `onRehydrateStorage`. The pass below deliberately
        // does not count same-file references - an action called only by its
        // own neighbours can still be a dead chain - so this framework
        // contract has to be named. It is one name with one meaning in every
        // store, which is why it is allowed here rather than by twelve
        // identical opt-out comments.
        if (member.name === 'setHasHydrated') continue;
        // Files that reference THIS action, resolved by symbol - so an
        // identically named action on another store is not mistaken for a
        // caller, which is how two dead `acquireCompany`s kept each other
        // alive for months.
        const callers = REFERENCE_INDEX.referencingFiles(member.decl, f, member.name)
            .filter(g => !isDisabled(g));
        if (callers.length === 0 && !symbolOptedOut(member.name, f)) {
            problems.storeActions.push(`${member.name}()  (${rel(f)})`);
        }
    }
}

// --- 3) Engine exports the game never consumes ------------------------------
for (const f of files.filter(f => /core\/market\/\w+\.ts$/.test(f))) {
    if (optedOut(f)) continue;
    const sf = REFERENCE_INDEX.sourceOf(f);
    if (!sf) continue;
    ts.forEachChild(sf, (node) => {
        if (!ts.isVariableStatement(node)) return;
        const exported = (node.modifiers || []).some(mo => mo.kind === ts.SyntaxKind.ExportKeyword);
        if (!exported) return;
        for (const d of node.declarationList.declarations) {
            if (!ts.isIdentifier(d.name)) continue;
            const init = d.initializer;
            // Only functions. An exported constant is data and is reached by
            // being read, which this pass would report as dead.
            if (!init || !(ts.isArrowFunction(init) || ts.isFunctionExpression(init))) continue;
            const name = d.name.text;
            // Only flag it if nothing anywhere uses it - including its own
            // file. The name is passed so a `require('./brand').thing()` call
            // counts; the engine is reached that way from the quarter tick.
            if (refs(d, f, name) === 0 && !usedInternally(d) && !symbolOptedOut(name, f)) {
                problems.engineExports.push(`${name}()  (${rel(f)})`);
            }
        }
    });
}

// --- 4) Stats fields written by the engine and read by no screen ------------
const statsFile = files.find(f => f.endsWith('useStatsStore.ts'));
if (statsFile) {
    const tsx = files.filter(f => f.endsWith('.tsx') && !isDisabled(f));
    for (const member of interfaceMembers(statsFile, n => n === 'StatsState')) {
        if (member.isFunction || /^(set|update|reset)/.test(member.name)) continue;
        // WRITTEN: it appears as an object key somewhere else - which is what
        // `{ brandValue: 12 }` is, and the only shape the engine writes stats in.
        //
        // By NAME rather than by symbol, deliberately: an engine write is a
        // bare object literal handed to update(), and its keys often resolve
        // to nothing at all. The looser test is the right one here because the
        // consequence of a false "written" is only that the second half of the
        // question gets asked.
        const written = [...REFERENCE_INDEX.writesOf].some(([g, set]) =>
            path.resolve(g) !== path.resolve(statsFile) && set.has(member.name));
        // SHOWN: a screen references THIS field. By symbol, so a same-named
        // field on some other object cannot stand in for it.
        const shown = REFERENCE_INDEX.referencingFiles(member.decl, statsFile)
            .some(g => tsx.some(t => path.resolve(t) === path.resolve(g)));
        if (written && !shown) problems.statsFields.push(member.name);
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
total += section('Text unreadable on the ground', problems.contrast,
    'Below 3:1 against the background. Fill tones are not text colours - use their light form.');
total += section('Conversations that cannot be played', problems.story,
    'Broken links, cards nothing leads to, and cards that can offer no answer.');
total += section('A way out that is not the one way out', problems.exits,
    'One header draws the back arrow. A second exit is how the app got six of them.');
total += section('Colours outside the palette', problems.palette,
    'Consolidated to fifteen tokens. A new hex here is how the drift starts again.');
total += section('Persisted stores a new game does not clear', problems.newGame,
    'Old data walks into the next game. Both halves are needed: the disk key and the in-memory reset.');
total += section('Translations frozen at module load', problems.frozenText,
    'Evaluated once on import, so they never follow a language change. Use a getter.');
total += section('Hooks called after an early return', problems.hooks,
    'React will crash with "Rendered more hooks than during the previous render".');
total += section('Renders as a bare text node', problems.stringGuards,
    'React Native refuses these: "Text strings must be rendered within a <Text> component".');
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
console.log(OFF_FOLDERS.length
    ? `(features/${OFF_FOLDERS.join(', ')} are flagged off and excluded.)\n`
    : '(every feature folder is switched on and checked.)\n');
process.exit(0);
