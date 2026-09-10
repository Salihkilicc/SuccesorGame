// src/components/MyCompany/Shares/shareSaleLook.test.ts
//
// ============================================================================
//  THE PAGE WHERE YOU SELL YOUR OWN SHARES LOOKED OLD, AND HERE IS WHY
// ============================================================================
//
//  Reported as "eski kalmis, renove et", which is a taste sentence. Most of
//  what was behind it was not taste at all - it was three rules the project
//  already has, broken in one file:
//
//    1. The primary action of the screen was WHITE ON #CFD0D2. Measured 1.54.
//       theme.ts states that number in its own header, and the identical bug
//       was fixed on the board member's offer button one prompt earlier - same
//       silver, same white label, a different file. That fix changed one
//       button instead of sweeping for the pattern.
//
//    2. The trust meter had FOUR bands and TWO colours, and the comments named
//       four: Red, Orange, Yellow and "Green". Red, Orange and Yellow were all
//       the same pink, and Green was the light grey. So a director at 29 and
//       one at 69 were painted identically, and the comments described a
//       design that was never built.
//
//    3. #FF8A8A is `negative` - "this is costing you" - and it was used as a
//       fill on the sell button and as the colour of a director at 65 trust.
//       Neither is costing the player anything, and the standing rule is that
//       the signal colours are text only.
//
//  The layout was not touched. Rearranging a screen while fixing it is how a
//  fix becomes a redesign nobody asked for.
// ============================================================================

import fs from 'fs';
import path from 'path';

import { TRUST_BANDS, offerLook, trustLook } from './logic/trustLook';
import { theme } from '../../../core/theme';

const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SHARES = path.join(ROOT, 'src', 'components', 'MyCompany', 'Shares');

const read = (f: string) => fs.readFileSync(path.join(SHARES, f), 'utf8');
const live = (f: string) =>
    read(f)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

// ---------------------------------------------------------------------------
//  WCAG contrast, so "invisible" is a number rather than an opinion
// ---------------------------------------------------------------------------
const lum = (hex: string): number => {
    const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255)
        .map(v => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const contrast = (a: string, b: string): number => {
    const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
    return (hi + 0.05) / (lo + 0.05);
};

describe('the button you press to sell was very nearly not there', () => {
    it('white on that silver is 1.54, which the theme already says', () => {
        // The measurement, kept, so nobody has to trust the sentence.
        expect(contrast('#CFD0D2', '#FFFFFF')).toBeLessThan(1.6);
        expect(contrast('#CFD0D2', '#000000')).toBeGreaterThan(13);
        // And theme.ts carries the same two numbers in its own header.
        const th = fs.readFileSync(path.join(ROOT, 'src', 'core', 'theme.ts'), 'utf8');
        expect(th).toMatch(/#CFD0D2\s+13\.61\s+1\.54\s+BLACK/);
    });

    it('so the offer button is the primary fill with the text the palette pairs to it', () => {
        const src = live('ShareholderProfileModal.tsx');
        expect(src).toMatch(/backgroundColor: theme\.colors\.primary/);
        expect(src).not.toMatch(/tradeMode === 'buy' \? '#CFD0D2'/);

        const sheet = src.slice(src.lastIndexOf('StyleSheet.create('));
        const label = sheet.slice(sheet.indexOf('makeOfferButtonText: {'));
        expect(label.slice(0, 400)).toMatch(/color: theme\.colors\.onLight/);
        expect(label.slice(0, 400)).not.toMatch(/#FFFFFF/);
    });

    it('and the pair it actually uses clears 4.5', () => {
        expect(contrast(theme.colors.primary, theme.colors.onLight)).toBeGreaterThan(4.5);
    });

    it('and a label that wraps stays centred', () => {
        // "Hisseleri sat" is short and "Satin almayi onayla" is not.
        // alignItems centres the Text element, never the lines inside it.
        const sheet = live('ShareholderProfileModal.tsx');
        const label = sheet.slice(sheet.indexOf('makeOfferButtonText: {'));
        expect(label.slice(0, 400)).toMatch(/textAlign: 'center'/);
    });

    it('and the loss red is not a fill on this screen any more', () => {
        // "Signal colours are text only, never fills or borders." Selling
        // your own shares is a transaction, not a loss.
        const src = live('ShareholderProfileModal.tsx');
        expect(src).not.toMatch(/backgroundColor: '#FF8A8A'/);
        expect(src).not.toMatch(/: '#FF8A8A' \}/);
    });
});

describe('and nowhere else in this folder repeats it', () => {
    it('no light fill is ever given white text', () => {
        // ------------------------------------------------------------------
        //  THE SWEEP THE LAST FIX SHOULD HAVE BEEN
        // ------------------------------------------------------------------
        //  MemberInteractionModal's offer button was fixed one prompt ago and
        //  this one survived, because that fix looked at a button rather than
        //  at the pattern. So this looks at the pattern: any style block that
        //  sets BOTH a light background and a colour, anywhere in Shares.
        //
        //  Pass 0f of the reachability audit cannot see these - it resolves
        //  theme TOKENS through a light fill, and every one of these is a
        //  literal hex written inline.
        // ------------------------------------------------------------------
        const bad: string[] = [];
        for (const file of fs.readdirSync(SHARES).filter(f => f.endsWith('.tsx'))) {
            const src = live(file);
            for (const [, name, body] of src.matchAll(/(\w+):\s*\{([^}]*)\}/g)) {
                const bg = (body.match(/backgroundColor:\s*'(#[0-9A-Fa-f]{6})'/) || [])[1];
                const fg = (body.match(/(?<!background)color:\s*'(#[0-9A-Fa-f]{6})'/) || [])[1];
                if (!bg || !fg) continue;
                const ratio = contrast(bg, fg);
                if (ratio < 4.5) bad.push(`${file} ${name}: ${fg} on ${bg} = ${ratio.toFixed(2)}`);
            }
        }
        expect(bad).toEqual([]);
    });
});

describe('and how much a director trusts you has one answer now', () => {
    it('five bands, and every one of them says something different', () => {
        // It had four bands and two colours here, three bands in the board
        // room and five on the member's screen. Three answers to one question.
        expect(TRUST_BANDS).toHaveLength(5);
        const labels = [100, 70, 50, 30, 10].map(v => trustLook(v).label);
        expect(new Set(labels).size).toBe(5);
    });

    it('and three distinct appearances rather than two', () => {
        const colours = [100, 70, 50, 30, 10].map(v => trustLook(v).color);
        expect(new Set(colours).size).toBe(3);
        // The old version: four thresholds, two values, and three of the four
        // identical. This is the shape that made the meter say nothing.
        const old = [29, 49, 69, 90].map(v => (v < 70 ? '#FF8A8A' : '#CFD0D2'));
        expect(new Set(old).size).toBe(2);
    });

    it('and a director who trusts you is never painted as a loss', () => {
        // #FF8A8A is `negative`, and the theme says what it means in a
        // sentence: "this is costing you". Somebody at 65 is costing nothing.
        for (const v of [40, 50, 60, 65, 80, 100]) {
            expect(trustLook(v).color).not.toBe(theme.colors.negative);
        }
    });

    it('and nothing it returns is a raw hex', () => {
        const src = read('logic/trustLook.ts');
        const inCode = src.split('\n').filter(l => !/^\s*(\/\/|\*)/.test(l)).join('\n');
        expect(inCode).not.toMatch(/#[0-9A-Fa-f]{6}/);
    });

    it('and rubbish does not throw or land at an extreme', () => {
        for (const v of [undefined, NaN, -50, 1e9]) {
            expect(() => trustLook(v as number)).not.toThrow();
        }
        expect(trustLook(-50).percent).toBe(0);
        expect(trustLook(1e9).percent).toBe(100);
        expect(trustLook(undefined).label).toBe(trustLook(0).label);
    });

    it('and all three screens ask the same door', () => {
        for (const file of [
            'ShareholderProfileModal.tsx',
            'MemberInteractionModal.tsx',
            'BoardRoomModal.tsx',
        ]) {
            const src = live(file);
            expect(src).toMatch(/trustLook\(/);
            // And none of them keeps a private ladder of its own.
            expect(src).not.toMatch(/trust >= 60 \? theme\.colors\.up/);
            expect(src).not.toMatch(/if \(trust < 30\) return/);
            expect(src).not.toMatch(/if \(trust >= 80\) return \{ label/);
        }
    });
});

describe('and how your offer is being taken says three things', () => {
    it('insulted, neutral and happy do not look alike', () => {
        // The one piece of feedback the screen gives while the player drags
        // the premium, and an insulting offer used to look exactly like a
        // fair one.
        const looks = [-10, 10, 40].map(offerLook);
        expect(new Set(looks.map(l => l.color)).size).toBe(3);
        expect(new Set(looks.map(l => l.label)).size).toBe(3);
    });

    it('and the boundaries are where they always were', () => {
        // Behaviour unchanged; only the appearance was wrong. Nothing about
        // WHEN somebody is insulted has moved.
        expect(offerLook(-1).label).toBe(offerLook(-100).label);
        expect(offerLook(0).label).toBe(offerLook(20).label);
        expect(offerLook(21).label).toBe(offerLook(200).label);
        expect(offerLook(0).label).not.toBe(offerLook(-1).label);
        expect(offerLook(20).label).not.toBe(offerLook(21).label);
    });

    it('and being offered too little is a caution rather than a loss', () => {
        expect(offerLook(-10).color).toBe(theme.colors.warning);
        expect(offerLook(-10).color).not.toBe(theme.colors.negative);
    });
});
