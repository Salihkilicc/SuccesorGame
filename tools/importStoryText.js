// tools/importStoryText.js
//
// ============================================================================
//  THE TRANSLATION COMES BACK IN THROUGH ONE DOOR
// ============================================================================
//
//  Run:  node tools/importStoryText.js build/story-tr.json [more.json ...]
//
//  Accepts either shape, because a model asked for a thousand lines will be
//  asked in batches and the batches come back looking different:
//
//      { "scene/card": "Türkçe", ... }                       flat
//      { "scene-id": { "lines": [ { key, tr }, ... ] } }      grouped
//
//  Merges into the existing STORY_TR rather than replacing it, so batch six
//  does not delete batches one through five - which is the failure this file
//  exists to prevent.
//
//  ---------------------------------------------------------------------------
//  IT REFUSES KEYS THAT ARE NOT IN THE STORY
//  ---------------------------------------------------------------------------
//  A model handed a thousand keys will occasionally invent one, or repair a
//  typo in one, and a dictionary entry under a key nothing looks up is a line
//  that silently stays English forever. Those are reported and dropped, not
//  written. The same check is a test (src/data/i18n/storyText.test.ts) so it
//  also catches the reverse case: a scene renamed after the translation.
// ============================================================================

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DICT = path.join(__dirname, '..', 'src/data/i18n/storyText.ts');
const EXPORT = path.join(__dirname, '..', 'build/story-en.json');

const files = process.argv.slice(2);
if (!files.length) {
    console.error('usage: node tools/importStoryText.js <translated.json> [...]');
    process.exit(1);
}

// The set of legal keys, taken from the export rather than re-derived, so the
// importer and the exporter cannot disagree about what a key looks like.
if (!fs.existsSync(EXPORT)) execFileSync('node', [path.join(__dirname, 'exportStoryText.js')]);
const exported = JSON.parse(fs.readFileSync(EXPORT, 'utf8'));
const legal = new Set();
const english = new Map();
for (const conv of Object.values(exported)) {
    for (const l of conv.lines) { legal.add(l.key); english.set(l.key, l.en); }
}

// --- read whatever shape arrived ------------------------------------------
const incoming = {};
for (const f of files) {
    const raw = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const [k, v] of Object.entries(raw)) {
        if (typeof v === 'string') { incoming[k] = v; continue; }
        for (const l of (v && v.lines) || []) {
            if (l && l.key && typeof (l.tr ?? l.text) === 'string') {
                incoming[l.key] = l.tr ?? l.text;
            }
        }
    }
}

const unknown = Object.keys(incoming).filter(k => !legal.has(k));
const untouched = Object.entries(incoming).filter(([k, v]) => v.trim() === english.get(k));
for (const k of unknown) delete incoming[k];

// --- merge with what is already in the file --------------------------------
let src = fs.readFileSync(DICT, 'utf8');
const open = src.indexOf('export const STORY_TR: StoryDictionary = {');
const close = src.indexOf('\n};', open);
if (open < 0 || close < 0) throw new Error('could not find STORY_TR in storyText.ts');

const existing = {};
for (const m of src.slice(open, close).matchAll(/^\s*'((?:[^'\\]|\\.)*)':\s*'((?:[^'\\]|\\.)*)',$/gm)) {
    existing[m[1].replace(/\\'/g, "'")] = m[2];
}

const merged = { ...existing };
for (const [k, v] of Object.entries(incoming)) {
    if (v.trim()) merged[k] = v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

const body = Object.keys(merged).sort()
    .map(k => `    '${k.replace(/'/g, "\\'")}': '${merged[k]}',`)
    .join('\n');

src = src.slice(0, open)
    + 'export const STORY_TR: StoryDictionary = {\n'
    + '    // Filled by tools/exportStoryText.js -> a translator -> \n'
    + '    // tools/importStoryText.js. Sorted by key; edit by re-importing.\n'
    + body
    + src.slice(close);
fs.writeFileSync(DICT, src);

console.log(`imported : ${Object.keys(incoming).length}`);
console.log(`total    : ${Object.keys(merged).length} / ${legal.size}`);
if (unknown.length) {
    console.log(`\nDROPPED ${unknown.length} key(s) not in the story:`);
    unknown.slice(0, 20).forEach(k => console.log('  ' + k));
}
if (untouched.length) {
    console.log(`\n${untouched.length} line(s) came back identical to the English.`);
    console.log('Some of these are correct (names, "ok"). Most are a skipped batch.');
}
