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
//  So it looks at four places and no others:
//
//      <Text>Hello</Text>                a child of a Text element
//      title="Hello"                     the props that name things
//      label= / summary= / placeholder= / note=
//
//  That is where sentences live. It is not exhaustive and it is not trying to
//  be: it is the net under the specific mistake this project keeps making,
//  which is a screen built in English and translated later.
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
    const t = s.trim();
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
        if (!/\.tsx$/.test(e.name) || /\.test\.tsx$/.test(e.name)) continue;
        out.push(full);
    }
    return out;
};

const FLAGGED_OFF = /[\\/]features[\\/]life[\\/]/;

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

const findings = [];

for (const file of walk(SRC)) {
    if (FLAGGED_OFF.test(file)) continue;
    const rel = path.relative(SRC, file);
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    if (fileExempt(lines)) continue;

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
    console.log('(features/life is flagged off and excluded. `// @english-ok <reason>` exempts a line.)\n');
}

module.exports = { findings };
