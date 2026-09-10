// src/features/os/settingsWiring.test.ts
//
// ============================================================================
//  THE RULE IS TESTED NEXT DOOR. THIS IS WHETHER ANYTHING PRESSES IT
// ============================================================================
//
//  Both of these features are one screen away from being invisible, and this
//  project has shipped that exact shape before: a god mode modal whose only
//  door was a screen behind a flag that was false, and an acquisition path
//  that wrote to a list the engine never read.
//
//  So the gesture and the character change are measured as VALUES in
//  core/adminGesture.test.ts and core/changeCharacter.test.ts, and what is
//  measured here is the wiring: that the version line is pressable, that the
//  press reaches the counter, that the admin section is drawn when the counter
//  says so, and that the new row exists and calls the right thing.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.join(__dirname, '..', '..');
const live = (rel: string) =>
    fs.readFileSync(path.join(SRC, rel), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

const screen = () => live(path.join('features', 'os', 'screens', 'SettingsScreen.tsx'));
const logic = () => live(path.join('features', 'os', 'logic', 'useSettingsLogic.ts'));

describe('the hidden door is actually pressable', () => {
    it('the version line is a Pressable and it calls the counter', () => {
        const src = screen();
        expect(src).toMatch(/<Pressable onPress=\{actions\.tapVersion\}/);
        expect(src).toMatch(/os\.successorOsV100/);
    });

    it('and the press reaches the pure rule rather than counting inline', () => {
        // A counter written inline in the component is a rule nothing can
        // test. See the header of core/adminGesture.ts.
        const src = logic();
        expect(src).toMatch(/from '\.\.\/\.\.\/\.\.\/core\/adminGesture'/);
        expect(src).toMatch(/tap\(prev, Date\.now\(\)\)/);
    });

    it('and the admin section is drawn when the gesture opens it', () => {
        // ------------------------------------------------------------------
        //  THE REPORTED BUG, AS ONE LINE
        // ------------------------------------------------------------------
        //  It read `{FEATURES.godMode && (`, and godMode is __DEV__, so a
        //  release build never drew the section at all.
        // ------------------------------------------------------------------
        const src = screen();
        expect(src).toMatch(/\{\(FEATURES\.godMode \|\| state\.isAdminUnlocked\) && \(/);
    });

    it('and it still works in a dev build without any tapping', () => {
        // The flag is kept rather than replaced: somebody running from Xcode
        // should not have to perform a gesture to get their own tools.
        const src = screen();
        expect(src).toMatch(/FEATURES\.godMode/);
    });

    it('and the button under it still runs the real thing', () => {
        const src = logic();
        expect(src).toMatch(/applyAdminMode\(\)/);
    });
});

describe('and Change your character is under New Game', () => {
    it('the row exists and calls the flow', () => {
        const src = screen();
        expect(src).toMatch(/label=\{t\('os\.changeCharacter'\)\}/);
        expect(src).toMatch(/onPress=\{actions\.handleChangeCharacter\}/);
    });

    it('and it is BELOW New Game, which is the whole placement', () => {
        // Asked for as "a button under New Game". It does everything New Game
        // does and one thing more, so above it would read as the smaller of
        // the two.
        const src = screen();
        expect(src.indexOf("t('os.newGame')")).toBeGreaterThan(-1);
        expect(src.indexOf("t('os.changeCharacter')"))
            .toBeGreaterThan(src.indexOf("t('os.newGame')"));
    });

    it('and it says what it does before the dialog does', () => {
        // A destructive row whose only explanation is inside the dialog it
        // opens makes the player open the dialog to find out.
        // Scoped to the row rather than matched anywhere in the file. A
        // wiring test that matches loosely is one that passes on somebody
        // else's line - see the note in generationMarket.test.ts, where
        // exactly that hid a missing gate for a whole probe.
        const src = screen();
        const start = src.indexOf("label={t('os.changeCharacter')}");
        expect(start).toBeGreaterThan(-1);
        const row = src.slice(start, src.indexOf('/>', start));
        expect(row).toMatch(/description=\{t\('os\.changeCharacterSub'\)\}/);
        expect(row).toMatch(/isDestructive/);
    });

    it('and the handler goes through changeCharacter, not its own copy', () => {
        const src = logic();
        expect(src).toMatch(/changeCharacter \}? ?from '\.\.\/\.\.\/\.\.\/core\/newGamePrompt'|changeCharacter,?\s*\}\s*from/);
        expect(src).toMatch(/await changeCharacter\(\)/);
    });

    it('and it does NOT pop the screen afterwards', () => {
        // New Game calls goBack. This one must not: by the time it returns,
        // the navigator has been replaced by the onboarding form, and popping
        // a screen off a stack that is no longer mounted lands on nothing.
        const src = logic();
        const handler = src.slice(
            src.indexOf('const handleChangeCharacter'),
            src.indexOf('const handleAdminUnlock'),
        );
        expect(handler.length).toBeGreaterThan(50);
        expect(handler).not.toMatch(/goBack/);
    });
});

describe('and both languages have the words', () => {
    const dict = (lang: 'en' | 'tr') => live(path.join('core', 'i18n', `${lang}.ts`));

    it('every new key is in English and in Turkish', () => {
        const keys = [
            'os.changeCharacter', 'os.changeCharacterSub', 'os.adminTapsLeft',
            'newGame.characterTitle', 'newGame.characterSummary',
            'newGame.characterNote', 'newGame.characterConfirm',
            'newGame.characterCancel',
        ];
        const missing: string[] = [];
        for (const lang of ['en', 'tr'] as const) {
            const src = dict(lang);
            for (const k of keys) if (!src.includes(`'${k}'`)) missing.push(`${lang}:${k}`);
        }
        expect(missing).toEqual([]);
    });

    it('and no dash got into the Turkish, which the player reads', () => {
        const DASH = /[—–]|(?:^|\s)-(?:\s|$)/;
        const src = dict('tr');
        const mine = src.split('\n').filter(l =>
            /'(os\.changeCharacter|os\.changeCharacterSub|newGame\.character)/.test(l));
        expect(mine.length).toBeGreaterThan(5);
        expect(mine.filter(l => DASH.test(l.split(': ')[1] ?? ''))).toEqual([]);
    });
});
