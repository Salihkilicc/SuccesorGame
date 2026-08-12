// tools/exportStoryText.js
//
// ============================================================================
//  EVERY LINE OF DIALOGUE, IN ONE FILE, FOR A TRANSLATOR
// ============================================================================
//
//  Run:  node tools/exportStoryText.js
//  Out:  build/story-en.json   — what to translate
//        build/story-report.txt — how much there is, per character
//
//  The JSON is grouped by conversation and carries the SPEAKER on every line,
//  because that is the single most useful thing a translator can be told
//  about this text: the same sentence is a different sentence from Arthur
//  Vance than from Marco Alvarez, and the whole cast was built on that.
//
//  Choices are marked `player` - they are things the chief executive says out
//  loud, not narration, and they are the lines most often mistranslated into
//  descriptions of an action.
// ============================================================================

const ts = require('typescript');
const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'src');
const OUT = path.join(__dirname, '..', 'build');

const cache = new Map();
const load = (file) => {
    const key = path.resolve(file);
    if (cache.has(key)) return cache.get(key);
    const js = ts.transpileModule(fs.readFileSync(key, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2019 },
    }).outputText;
    const module = { exports: {} };
    cache.set(key, module.exports);
    const req = (spec) => {
        if (!spec.startsWith('.')) return {};
        const base = path.resolve(path.dirname(key), spec);
        const found = [base + '.ts', base + '.tsx', path.join(base, 'index.ts')]
            .find(fs.existsSync);
        return found ? load(found) : {};
    };
    try {
        // eslint-disable-next-line no-new-func
        new Function('module', 'exports', 'require', js)(module, module.exports, req);
    } catch (e) {
        console.error('could not load', path.relative(SRC, key), '-', e.message);
    }
    cache.set(key, module.exports);
    return module.exports;
};

const { CONVERSATIONS } = load(path.join(SRC, 'data/story/index.ts'));
const { CAST } = load(path.join(SRC, 'data/story/cast.ts'));

const out = {};
const counts = {};
let lines = 0;
let words = 0;

for (const c of CONVERSATIONS) {
    const entries = [];
    const add = (key, speaker, text, kind) => {
        entries.push({ key, speaker, kind, en: text });
        lines += 1;
        words += text.split(/\s+/).filter(Boolean).length;
        counts[speaker] = (counts[speaker] || 0) + 1;
    };

    if (c.subject) add(`${c.id}/@subject`, c.from, c.subject, 'subject');
    for (const n of c.nodes) {
        add(`${c.id}/${n.id}`, n.speaker, n.text, 'body');
        (n.choices || []).forEach((ch, i) => {
            add(`${c.id}/${n.id}#${i}`, 'player', ch.text, 'choice');
        });
    }

    out[c.id] = {
        channel: c.channel,
        from: c.from,
        speakerName: CAST[c.from] ? CAST[c.from].name : c.from,
        tone: CAST[c.from] ? CAST[c.from].tone : undefined,
        lines: entries,
    };
}

fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(path.join(OUT, 'story-en.json'), JSON.stringify(out, null, 2));

const report = [
    `conversations : ${CONVERSATIONS.length}`,
    `lines         : ${lines}`,
    `words         : ~${words}`,
    '',
    'lines per speaker:',
    ...Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([k, v]) =>
        `  ${(CAST[k] ? CAST[k].name : k).padEnd(28)} ${v}`),
].join('\n');

fs.writeFileSync(path.join(OUT, 'story-report.txt'), report);
console.log(report);
console.log(`\nwritten: build/story-en.json`);
