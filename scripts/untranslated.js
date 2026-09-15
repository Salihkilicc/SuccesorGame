#!/usr/bin/env node
// scripts/untranslated.js
//
// ============================================================================
//  EVERY SENTENCE A TURKISH PLAYER READS IN ENGLISH
// ============================================================================
//
//  Reported as a list of places: the mail, the message previews, the reply
//  screen, the financial report, the financing tab, the partner cards,
//  LuxoNet, the marriage modals, the successor modal, the titles on the home
//  screen. Every one of those was found by playing.
//
//  A list found by playing is a list that is never finished, and the tenth
//  one is always found by somebody who is not looking for it. So this looks
//  instead, and it looks at the surface a player actually reads.
//
//  ---------------------------------------------------------------------------
//  WHAT IT LOOKS AT, AND WHY NOT EVERYTHING
//  ---------------------------------------------------------------------------
//  A naive sweep for string literals in .tsx drowns: icon names, style values,
//  route names, accessibility roles, test ids and store keys are all strings
//  and none of them is read by anybody. The signal to noise decides whether a
//  check like this survives its first week.
//
//  So it looks at a few places and no others:
//
//      <Text>Hello</Text>                a child of a Text element
//      title="Hello"                     the props that name things
//      label= / summary= / placeholder= / note=
//      Alert.alert('Hello', 'World')     and the button labels inside it
//
//  That is where sentences live. It is not exhaustive and it is not trying to
//  be: it is the net under the specific mistake this project keeps making,
//  which is a screen built in English and translated later.
//
//  ---------------------------------------------------------------------------
//  THE TWO HOLES THIS NET HAD, AND WHAT WAS SITTING IN THEM
//  ---------------------------------------------------------------------------
//  It reported zero for weeks while a Turkish player was being asked, in
//  English, whether to erase their entire save:
//
//      Alert.alert(
//        'New Game',
//        'All progress will be erased and a fresh run will be set up. Are you
//         sure?',
//
//  Two separate blind spots, and both of them were in this file rather than in
//  the screens:
//
//    ONLY .tsx     The walk skipped every `.ts`, which is where the hooks live
//                  - useAssetsLogic, useProductsLogic, useBuybackLogic. A file
//                  extension was deciding whether player-facing text counted.
//
//    NO ALERT      An Alert's title and body are bare arguments, not a Text
//                  child and not a named prop, so even in a `.tsx` they went
//                  past all four rules. HomeScreen and NotesScreen are `.tsx`
//                  and were missed anyway.
//
//  A green check that is not looking is worse than no check, because it is
//  quoted as evidence. "untranslated 0" appeared in three commit messages of
//  mine as proof of something it had not examined.
//
//  ---------------------------------------------------------------------------
//  AND IT ONLY LOOKS AT SCREENS SOMEBODY CAN REACH
//  ---------------------------------------------------------------------------
//  `features/life` is behind a flag that is false, and reporting three hundred
//  strings from a module nobody can open would bury the twenty that matter.
//  The same argument scripts/reachability.js makes for the same folder.
// ============================================================================

const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
//  WHERE IT LOOKS, AND WHY THAT IS AN ARGUMENT
// ---------------------------------------------------------------------------
//  `src` by default and anywhere on request. The test that proves this net
//  catches a fish needs to drop one in, and dropping it into the real `src`
//  meant writing a file into the tree WHILE the rest of the suite was walking
//  it - jest runs suites in parallel, and personalCash.test.ts failed once
//  because of exactly that. A root argument makes the probe hermetic.
// ---------------------------------------------------------------------------
//  AND ONLY WHEN IT IS THE PROGRAM. `require.main === module` is the guard,
//  and it is not decoration: under jest `process.argv[2]` is whatever test
//  path was passed on the command line, so without this the sweep pointed
//  itself at a test file the moment anybody ran one suite on its own. Caught
//  by running this file alone and watching it disagree with the full suite.
const SRC = (require.main === module && process.argv[2])
    ? path.resolve(process.argv[2])
    : path.join(__dirname, '..', 'src');

// ---------------------------------------------------------------------------
//  WHAT IS NOT A SENTENCE
// ---------------------------------------------------------------------------
//  A string that is a single symbol, a number, a currency, a route name or a
//  three letter code is not something anybody translates. `%`, `+`, `OK` and
//  `Q1` are the same in both languages and always will be.
const NOT_A_SENTENCE = [
    /^[\s\W\d]*$/,                       // punctuation, spaces, digits only
    /^[A-Z]{1,4}\d*$/,                   // OK, RP, Q1, CEO
    /^\$?[\d.,]+[KMBTQ%]?$/,             // 1.2M, 45%, $300
    /^[a-z0-9-]+$/,                      // icon names, ids, kebab keys
    /^\{.*\}$/,                          // an interpolation on its own
];

const isSentence = (s) => {
    // ----------------------------------------------------------------------
    //  WHAT IS INSIDE `${...}` IS NOT WRITING
    // ----------------------------------------------------------------------
    //  `-${formatMoney(result.tax)}` and `\n\n${gate.reason}` were both
    //  reported, because the identifiers inside the braces are made of
    //  letters and the test below only asks for letters. There is nothing to
    //  translate in either: the sentence they belong to lives in the
    //  dictionary, and these are the figure being slotted into it.
    //
    //  Stripped rather than allowed wholesale, so a template that DOES carry
    //  prose still counts. `${n} units still in the warehouse` loses the
    //  count and keeps the sentence.
    // ----------------------------------------------------------------------
    const t = s.replace(/\$\{[^}]*\}/g, '').replace(/\\n/g, ' ').trim();
    if (t.length < 3) return false;
    if (NOT_A_SENTENCE.some(re => re.test(t))) return false;
    // Has to contain a run of letters. "· 12 ·" does not.
    return /[A-Za-z]{3}/.test(t);
};

/** Files a player can reach. */
const walk = (dir, out = []) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) { walk(full, out); continue; }
        // `.ts` as well as `.tsx`. The hooks that raise the dialogs are `.ts`,
        // and an extension was deciding whether a sentence counted.
        if (!/\.tsx?$/.test(e.name) || /\.test\.tsx?$/.test(e.name)) continue;
        out.push(full);
    }
    return out;
};

// ---------------------------------------------------------------------------
//  WHICH FOLDERS ARE OFF - READ FROM THE FLAGS, NOT FROM A LIST
// ---------------------------------------------------------------------------
//  This was `/features\/life\//`, hardcoded, and scripts/reachability.js had
//  already made this exact mistake and already fixed it, with the reason
//  written down: an audit that disagrees with the app about what is shipping
//  reports green while looking away.
//
//  The same fix, for the same reason. `shopping` is off too and was being
//  counted; `casino` is ON and a hardcoded list from the old days would have
//  been excluding it. Turning a module on now turns its translation check on
//  with it.
// ---------------------------------------------------------------------------
const FEATURE_SRC = fs.readFileSync(
    path.join(__dirname, '..', 'src', 'core', 'featureFlags.ts'), 'utf8');

const GATED_FOLDERS = ['life', 'love', 'casino', 'shopping'];
const OFF_FOLDERS = GATED_FOLDERS.filter(
    name => new RegExp(`^\\s*${name}:\\s*false`, 'm').test(FEATURE_SRC));

const FLAGGED_OFF = OFF_FOLDERS.length
    ? new RegExp(`[\\\\/]features[\\\\/](${OFF_FOLDERS.join('|')})[\\\\/]`)
    : /$^/;

/** `// @english-ok <reason>` on the line, or the two above it. */
const allowed = (lines, i) =>
    [lines[i], lines[i - 1], lines[i - 2]].some(l => /@english-ok\s/.test(l || ''));

// ---------------------------------------------------------------------------
//  A WHOLE FILE MAY BE EXEMPT, AND ONLY FOR ONE REASON
// ---------------------------------------------------------------------------
//  Three of the findings are in the shelved LuxoNet modals: complete, correct,
//  and mounted by nothing. Translating a screen nobody can open is work that
//  cannot be checked by playing, and it would make this list read as done
//  while the words it counted stayed unread.
//
//  So the marker goes in the first few lines, where the shelving note already
//  is, and it has to say why. Same shape as `@palette-source` in
//  scripts/reachability.js and for the same reason: a narrow, declared
//  exemption beats a silent one.
// ---------------------------------------------------------------------------
const fileExempt = (lines) =>
    lines.slice(0, 8).some(l => /@english-ok\s/.test(l));

// ---------------------------------------------------------------------------
//  THE STRINGS INSIDE AN Alert.alert(...)
// ---------------------------------------------------------------------------
//  Line by line does not work here. A real call in this tree spans a dozen
//  lines, the body is often built with `+` across several of them, and the
//  buttons are objects. So this one rule reads the whole call.
//
//  It reports a literal only when it is NOT the argument of `t(...)`, which is
//  the one distinction that matters: `t('home.newGame')` is translated and
//  `'New Game'` is not, and they look identical to a line-based regex.
//
//  Template literals count. `Sold all assets for ${formatMoney(x)}` is a
//  sentence with a number in it, not a number.
// ---------------------------------------------------------------------------
/**
 * Comments blanked out, offsets preserved.
 *
 * This file's own comments quote the English they are about, and the big ones
 * sit INSIDE the call they explain. Without this the sweep reported its own
 * explanations as findings, and worse, a `)` in a comment ended the call early
 * and the real body was never read. Spaces rather than deletion so every index
 * and line number still points where it did.
 */
const blankComments = (source) => {
    const out = source.split('');
    let quote = null, line = false, block = false;
    for (let i = 0; i < source.length; i++) {
        const c = source[i], next = source[i + 1], prev = source[i - 1];
        if (line) { if (c === '\n') line = false; else out[i] = ' '; continue; }
        if (block) {
            if (c === '*' && next === '/') { out[i] = ' '; out[i + 1] = ' '; i++; block = false; }
            else if (c !== '\n') out[i] = ' ';
            continue;
        }
        if (quote) { if (c === quote && prev !== '\\') quote = null; continue; }
        if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
        if (c === '/' && next === '/') { line = true; out[i] = ' '; continue; }
        if (c === '/' && next === '*') { block = true; out[i] = ' '; continue; }
    }
    return out.join('');
};

/**
 * Every string literal in `text`, as [offsetWithinText, contents].
 * Skips the argument of `t(...)`, which is the one distinction that matters:
 * `t('home.newGame')` is translated and `'New Game'` is not, and they look
 * identical to a line-based regex.
 */
const literals = (text) => {
    const out = [];
    let q = null, start = -1;
    for (let m = 0; m < text.length; m++) {
        const c = text[m], prev = text[m - 1];
        if (q) {
            if (c === q && prev !== '\\') {
                const body = text.slice(start + 1, m);
                if (!/\bt\($/.test(text.slice(Math.max(0, start - 2), start))) {
                    out.push([start, body]);
                }
                q = null;
            }
            continue;
        }
        if (c === '"' || c === "'" || c === '`') { q = c; start = m; }
    }
    return out;
};

/** Split an argument list at the commas that are actually separators. */
const topLevelArgs = (inner) => {
    const parts = [];
    let depth = 0, q = null, from = 0;
    for (let i = 0; i < inner.length; i++) {
        const c = inner[i], prev = inner[i - 1];
        if (q) { if (c === q && prev !== '\\') q = null; continue; }
        if (c === '"' || c === "'" || c === '`') { q = c; continue; }
        if ('([{'.includes(c)) depth++;
        else if (')]}'.includes(c)) depth--;
        else if (c === ',' && depth === 0) { parts.push([from, inner.slice(from, i)]); from = i + 1; }
    }
    parts.push([from, inner.slice(from)]);
    return parts;
};

// ---------------------------------------------------------------------------
//  EVERYTHING INSIDE A <Text> ELEMENT
// ---------------------------------------------------------------------------
//  The line-based Text rule wanted `<Text` or `</Text>` on the SAME LINE as
//  the words, and the sentences that matter are the ones long enough to wrap:
//
//      <Text style={...}>
//          {formatNumber(tempCount)} researchers produce{' '}
//          ...
//          power of 0.85 - doubling the team does not double the discoveries.
//      </Text>
//
//  Nine lines of English on the laboratory screen, invisible to a sweep
//  reporting zero. The same rule missed the buttons, because their words are
//  inside an expression rather than beside the tag:
//
//      <Text ...>{hasChanges ? 'CONFIRM' : `ARRIVES IN Q${q}`}</Text>
//
//  So the unit is the ELEMENT, not the line. A <Text> exists to put words on
//  the screen, which makes everything between its tags a candidate and makes
//  this precise rather than broad: the attributes of the opening tag, where
//  the styles and the icon names live, are outside it by construction.
// ---------------------------------------------------------------------------

/** Walk to the index just past the `>` that closes a tag opened at `from`. */
const endOfTag = (s, from) => {
    let depth = 0, q = null;
    for (let i = from; i < s.length; i++) {
        const c = s[i], prev = s[i - 1];
        if (q) { if (c === q && prev !== '\\') q = null; continue; }
        if (c === '"' || c === "'" || c === '`') { q = c; continue; }
        if (c === '{') depth++;
        else if (c === '}') depth--;
        else if (c === '>' && depth === 0) return i + 1;
    }
    return -1;
};

const scanTextElements = (source, push) => {
    const OPEN = /<Text(\s|>)/g;
    let m;
    while ((m = OPEN.exec(source)) !== null) {
        const openEnd = endOfTag(source, m.index);
        if (openEnd === -1) continue;
        // `<Text ... />` renders nothing of its own.
        if (source[openEnd - 2] === '/') continue;

        // Matching `</Text>`, counting nested ones.
        let depth = 1, i = openEnd, close = -1;
        while (i < source.length) {
            const nextOpen = source.indexOf('<Text', i);
            const nextClose = source.indexOf('</Text>', i);
            if (nextClose === -1) break;
            if (nextOpen !== -1 && nextOpen < nextClose) {
                const e = endOfTag(source, nextOpen);
                if (e !== -1 && source[e - 2] !== '/') depth++;
                i = e === -1 ? nextOpen + 5 : e;
                continue;
            }
            depth--;
            if (depth === 0) { close = nextClose; break; }
            i = nextClose + 7;
        }
        if (close === -1) continue;

        const inner = source.slice(openEnd, close);

        // Raw text, and the literals inside `{...}`. Nested tag markup is
        // skipped whole, so a nested <Text style={...}> contributes its words
        // and not its styling.
        let j = 0;
        let raw = '', rawAt = 0;
        const flush = () => {
            if (isSentence(raw)) push(openEnd + rawAt, raw.trim());
            raw = '';
        };
        while (j < inner.length) {
            const c = inner[j];
            if (c === '<') {
                flush();
                const e = endOfTag(inner, j);
                j = e === -1 ? j + 1 : e;
                continue;
            }
            if (c === '{') {
                flush();
                let d = 0, k = j, q = null;
                for (; k < inner.length; k++) {
                    const ch = inner[k], prev = inner[k - 1];
                    if (q) { if (ch === q && prev !== '\\') q = null; continue; }
                    if (ch === '"' || ch === "'" || ch === '`') { q = ch; continue; }
                    if (ch === '{') d++;
                    else if (ch === '}') { d--; if (d === 0) break; }
                }
                const expr = inner.slice(j, k + 1);
                for (const [where, text] of literals(expr)) {
                    if (isSentence(text)) push(openEnd + j + where, text);
                }
                j = k + 1;
                continue;
            }
            if (!raw) rawAt = j;
            raw += c;
            j++;
        }
        flush();
    }
};

const scanAlerts = (source, push) => {
    let at = 0;
    while ((at = source.indexOf('Alert.alert', at)) !== -1) {
        const open = source.indexOf('(', at);
        if (open === -1) break;

        let depth = 0, end = open, quote = null;
        for (; end < source.length; end++) {
            const c = source[end], prev = source[end - 1];
            if (quote) { if (c === quote && prev !== '\\') quote = null; continue; }
            if (c === '"' || c === "'" || c === '`') { quote = c; continue; }
            if (c === '(') depth++;
            else if (c === ')') { depth--; if (depth === 0) break; }
        }

        // ------------------------------------------------------------------
        //  ARGUMENT BY ARGUMENT, NOT THE WHOLE CALL
        // ------------------------------------------------------------------
        //  Reading every literal between the parentheses looked right and was
        //  not. A button's `onPress` is a function body sitting inside the
        //  call, and it has strings of its own: store field names, console
        //  tags. The sweep reported `'companyOwnership'` from an update() and
        //  `'[DilutionLogic] Dilution executed:'` from a console.log, and a
        //  net that catches the wrong fish gets ignored, which is how it ends
        //  up reporting zero again.
        //
        //  A player reads three things: the title, the body, and the words on
        //  the buttons. So those three and nothing else.
        // ------------------------------------------------------------------
        const argsFrom = open + 1;
        const args = topLevelArgs(source.slice(argsFrom, end));

        // Title and body: every literal, because the body is routinely built
        // with `+` across a dozen lines.
        for (const [offset, arg] of args.slice(0, 2)) {
            for (const [where, text] of literals(arg)) {
                if (isSentence(text)) push(argsFrom + offset + where, text);
            }
        }

        // The buttons: the `text:` of each, and only that.
        if (args[2]) {
            const [offset, arg] = args[2];
            for (const m of arg.matchAll(/\btext:\s*(['"`])((?:\\.|(?!\1).)*)\1/g)) {
                const quoteAt = m.index + m[0].indexOf(m[1]);
                if (/\bt\($/.test(arg.slice(Math.max(0, quoteAt - 2), quoteAt))) continue;
                if (isSentence(m[2])) push(argsFrom + offset + quoteAt, m[2]);
            }
        }

        // ------------------------------------------------------------------
        //  AND ON TO THE NEXT `Alert.alert`, INCLUDING ONE INSIDE THIS ONE
        // ------------------------------------------------------------------
        //  This was `end + 1`, which skipped past the whole call - and the
        //  result Alerts live INSIDE the first one's onPress. Two of the
        //  sharpest strings in the game, 'It worked!' and 'Backfired!', went
        //  quiet the moment the onPress bodies stopped being read. Stepping
        //  one character finds them, and cannot double-report, because the
        //  outer pass now only reads the title, the body and the buttons.
        // ------------------------------------------------------------------
        at = open + 1;
    }
};

const findings = [];

for (const file of walk(SRC)) {
    if (FLAGGED_OFF.test(file)) continue;
    const rel = path.relative(SRC, file);
    const source = fs.readFileSync(file, 'utf8');
    const lines = source.split('\n');
    if (fileExempt(lines)) continue;

    const clean = blankComments(source);
    const report = (kind) => (index, text) => {
        const line = source.slice(0, index).split('\n').length;
        if (allowed(lines, line - 1)) return;
        findings.push({ rel, line, text, kind });
    };

    // 3. The dialogs. Whole-call rather than line by line, see scanAlerts.
    scanAlerts(clean, report('Alert'));

    // 4. Whole <Text> elements, for the sentences long enough to wrap and the
    //    button words that live inside an expression.
    scanTextElements(clean, report('Text'));

    lines.forEach((line, i) => {
        if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
        if (allowed(lines, i)) return;

        // 1. A Text element whose child is a bare string.
        //    `<Text ...>Hello</Text>` and `>Hello<` inside a Text block.
        const child = line.match(/>\s*([A-Za-z][^<>{}\n]{2,})\s*</);
        if (child && /<Text|<\/Text>/.test(line) && isSentence(child[1])) {
            findings.push({ rel, line: i + 1, text: child[1].trim(), kind: 'Text' });
            return;
        }

        // 2. The props that name things.
        const prop = line.match(/\b(title|label|summary|placeholder|note|description|confirmLabel|cancelLabel)=["']([^"'\n]{3,})["']/);
        if (prop && isSentence(prop[2])) {
            findings.push({ rel, line: i + 1, text: prop[2], kind: prop[1] });
        }
    });
}

// ---------------------------------------------------------------------------
//  REPORT
// ---------------------------------------------------------------------------
const byFile = new Map();
for (const f of findings) {
    if (!byFile.has(f.rel)) byFile.set(f.rel, []);
    byFile.get(f.rel).push(f);
}

const files = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);

console.log('\nUNTRANSLATED — what a Turkish player reads in English\n');
if (findings.length === 0) {
    console.log('\x1b[32m  OK  \x1b[0m Nothing on a reachable screen.\n');
} else {
    for (const [rel, list] of files) {
        console.log(`\x1b[33m${String(list.length).padStart(3)}\x1b[0m  ${rel}`);
        for (const f of list.slice(0, 6)) {
            console.log(`       ${String(f.line).padStart(4)}  ${f.kind.padEnd(12)} ${f.text.slice(0, 64)}`);
        }
        if (list.length > 6) console.log(`       ... and ${list.length - 6} more`);
    }
    console.log(`\n\x1b[33m${findings.length}\x1b[0m string(s) across ${files.length} file(s).`);
    console.log(`(${OFF_FOLDERS.map(f => `features/${f}`).join(', ')} flagged off and excluded. \`// @english-ok <reason>\` exempts a line.)\n`);
}

module.exports = { findings };
