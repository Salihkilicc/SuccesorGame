// src/features/everyAvatar.test.ts
//
// ============================================================================
//  THE SWEEP, SO THEY STOP BEING FOUND ONE AT A TIME
// ============================================================================
//
//  Six surfaces were wired, then a seventh was reported - "partner sayfasina
//  giriyorum ve profil sayfasindaki foto icinde yok" - and looking for it
//  turned up five more alongside it. Every one of them was a circle with two
//  letters in it that nobody had thought to list.
//
//  Fixing them one report at a time is a slow way to find out how many there
//  are. So this asks the repository the question instead: which files draw an
//  avatar, and do they all go through the one component that knows how?
//
//  It is a source-level check by necessity - it is about coverage, not about
//  behaviour - so the comments are stripped first. A check that matched
//  shelved code inside a comment is a mistake already made twice today.
// ============================================================================

import fs from 'fs';
import path from 'path';

const SRC = path.resolve(__dirname, '..');

/** Source with block and line comments taken out. */
const live = (file: string): string =>
    fs.readFileSync(file, 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');

const screens = (): string[] => {
    const out: string[] = [];
    const walk = (dir: string) => {
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const p = path.join(dir, e.name);
            if (e.isDirectory()) { walk(p); continue; }
            if (e.name.endsWith('.tsx') && !/\.test\./.test(e.name)) out.push(p);
        }
    };
    walk(SRC);
    return out;
};

/**
 * Files that draw something avatar shaped.
 *
 * ---------------------------------------------------------------------------
 *  THE FIRST TELL COULD NOT SEE ITS OWN WORK
 * ---------------------------------------------------------------------------
 *  It matched the OLD style names - avatarText, avatarInitial, avatarEmoji -
 *  which is exactly what wiring a screen removes. Every file this sweep was
 *  written to protect dropped out of its own list the moment it was fixed,
 *  so the sweep could not catch a regression and could not find a screen
 *  that never used those names.
 *
 *  Probed: Portrait was stripped out of the partner page entirely and all
 *  four tests stayed green.
 *
 *  The word "avatar" survives the wiring, because the wrapper style keeps it
 *  - styles.avatar, styles.avatarWrap, styles.partnerAvatar. Broadening to
 *  that found two more files nobody had reported: a lender card drawing a
 *  shark ICON for a man who is on the board and has a portrait, and a pair of
 *  avatar styles referenced from nowhere at all.
 */
const AVATAR_TELL = /avatar/i;

/**
 * The one place a circle of letters is not a person.
 *
 * The education club shows its members as bare INITIAL STRINGS - there is no
 * id, no gender and no age behind them, and nothing was ever drawn for them.
 * Listed by name so that the exception is a decision on the record rather
 * than a file quietly failing to match a pattern.
 */
const NOT_PEOPLE = [
    path.join('features', 'life', 'components', 'Education', 'tabs', 'EducationClubView.tsx'),
    // The component itself. It is what everything else imports.
    path.join('components', 'common', 'Portrait.tsx'),
    // ------------------------------------------------------------------
    //  A PRODUCT IS NOT A PERSON
    // ------------------------------------------------------------------
    //  This draws the badge on a phone, a drone and a fusion reactor. It
    //  matches only because it reads `theme.colors.avatarTints` - the
    //  game's CATEGORICAL palette, which is named for the first place it
    //  was used and not for the only one. See ProductIcon.tsx: the eight
    //  category colours were hand-picked hexes and one of them was
    //  theme.colors.success, so a Bio-Tech badge drew the profit signal.
    //
    //  The tell is a word, so it will keep finding things like this. That
    //  is the trade: a sweep loose enough to catch a real avatar nobody
    //  named `avatar` will also catch a palette that is.
    // ------------------------------------------------------------------
    path.join('features', 'products', 'components', 'ProductIcon.tsx'),
];

describe('every avatar in the game goes through one component', () => {
    const drawing = () => screens().filter(f => AVATAR_TELL.test(live(f)));

    it('and there are files to check, so this is not vacuous', () => {
        // If the tells ever stop matching anything, this test would pass by
        // finding nothing rather than by everything being right.
        expect(drawing().length).toBeGreaterThan(12);
    });

    it('and every one of them imports Portrait', () => {
        const missing = drawing()
            .map(f => path.relative(SRC, f))
            .filter(rel => !NOT_PEOPLE.includes(rel))
            .filter(rel => !/import Portrait/.test(live(path.join(SRC, rel))));
        expect(missing).toEqual([]);
    });

    it('and the one exception is on the record and still there', () => {
        // A named exception that has been deleted or renamed would silently
        // stop excusing anything, and this list would be a lie.
        for (const rel of NOT_PEOPLE) {
            expect(fs.existsSync(path.join(SRC, rel))).toBe(true);
        }
    });

    it('and nothing outside the registry requires a portrait file directly', () => {
        // Portrait is the only door to the folder, and index.ts is the only
        // door to Portrait's lookup. Repeated here because this file is the
        // sweep and that is the invariant the sweep is protecting.
        const offenders = screens()
            .filter(f => /require\([^)]*assets\/portraits/.test(live(f)))
            .map(f => path.relative(SRC, f));
        expect(offenders).toEqual([]);
    });
});
