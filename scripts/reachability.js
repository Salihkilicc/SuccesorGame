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

const problems = { components: [], storeActions: [], engineExports: [], statsFields: [], hooks: [], frozenText: [], newGame: [], palette: [], contrast: [], stringGuards: [] };

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
        });
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
        // Collect every container that paints a background, with its span.
        const spans = [];
        for (const tag of TAGS) {
            for (const m of src.matchAll(new RegExp(`<${esc(tag)}\\b`, 'g'))) {
                const j = endOpen(src, m.index);
                if (j < 0 || src[j - 1] === '/') continue;
                // In a style ARRAY the last entry wins, so resolve to the last
                // style that sets the property - not the first. Reading the
                // first made `[tabText, active && activeTabText]` look broken
                // when the override right after it was the fix.
                let fill = null;
                for (const s of src.slice(m.index, j).matchAll(/styles\.(\w+)/g)) {
                    const t = tokenOf(s[1], 'bg');
                    if (t) fill = t;
                }
                const inline = src.slice(m.index, j)
                    .match(/backgroundColor: *(?:theme\.)?colors\.(\w+)(?! *\+)/);
                if (inline) fill = inline[1];
                if (!fill || !TOKENS.has(fill)) continue;
                const re = new RegExp(`<(/?)${esc(tag)}\\b`, 'g');
                re.lastIndex = j + 1;
                let depth = 1, end = src.length, hit;
                while (depth > 0 && (hit = re.exec(src))) {
                    depth += hit[1] === '/' ? -1 : 1;
                    if (depth === 0) end = hit.index;
                }
                spans.push({ start: m.index, end, fill });
            }
        }

        const seen = new Set();
        for (const tm of src.matchAll(/<Text\b/g)) {
            const te = endOpen(src, tm.index);
            if (te < 0) continue;
            let tok = null, styleName = null;
            for (const s of src.slice(tm.index, te).matchAll(/styles\.(\w+)/g)) {
                const t = tokenOf(s[1], 'color');
                if (t) { tok = t; styleName = s[1]; }
            }
            const inline = src.slice(tm.index, te)
                .match(/\bcolor: *(?:theme\.)?colors\.(\w+)/);
            if (inline) { tok = inline[1]; styleName = styleName || 'inline'; }
            if (!tok || !TOKENS.has(tok)) continue;

            // The label sits on its INNERMOST painted ancestor, not on every
            // ancestor. A cyan button inside a dark card was being checked
            // against the card too, which reported the button's own correct
            // dark label as unreadable.
            let inner = null;
            for (const s of spans) {
                if (s.start >= tm.index || s.end <= tm.index) continue;
                if (!inner || s.start > inner.start) inner = s;
            }
            if (!inner) continue;

            const r = ratio(hx(TOKENS.get(tok)), hx(TOKENS.get(inner.fill)));
            const key = `${styleName}|${inner.fill}`;
            if (r < 3 && !seen.has(key)) {
                seen.add(key);
                const ln = src.slice(0, tm.index).split('\n').length;
                problems.contrast.push(
                    `${rel(f)}:${ln}  ${tok} on ${inner.fill} fill = ${r.toFixed(2)}`);
            }
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
total += section('Text unreadable on the ground', problems.contrast,
    'Below 3:1 against the background. Fill tones are not text colours - use their light form.');
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
console.log('(features/life, love, casino, shopping are flagged off and excluded.)\n');
process.exit(0);
