// src/features/casino/slotCabinet.test.ts
//
// ============================================================================
//  THE MACHINE HAD NO BODY
// ============================================================================
//
//  Reported as "the flow on the slot is good, very good, I liked it, but the
//  slot needs a complete makeover, it does not look good at all".
//
//  That split matters and it shaped the whole change: the FLOW was right - the
//  reel stagger, the hang on the last reel when the first two match, the amount
//  rising and fading - and not one millisecond of it is touched here. What was
//  wrong is that the machine was a rounded grey rectangle in the same colour as
//  every card in the game, holding three reels. Nothing said cabinet.
//
//  And a second thing, which nobody reported because you cannot report the
//  absence of something you were never shown: THE SCREEN NEVER SAID WHICH
//  MACHINE YOU WERE AT. The Ticker, the Boardroom and the Dynasty pay
//  differently and hold different symbols, and all three rendered identically.
//  Three machines that look the same are one machine. The marquee is the fix
//  for that, and it is the reason the crown carries text rather than a pattern.
//
//  ---------------------------------------------------------------------------
//  AND ONE REAL DEFECT FELL OUT OF IT
//  ---------------------------------------------------------------------------
//  The reel window has two 40 point scrims, top and bottom, left over from when
//  the window was 192 points tall and they dimmed the two rows that do not pay.
//  The window became 64 points when the three row bug was fixed - so the two
//  scrims OVERLAPPED and covered the entire symbol in a fifty per cent black
//  wash. The one thing the player is meant to look at was the darkest thing on
//  the machine, and that is a good part of "it does not look good at all".
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    CHASE_MS, FLASH_MS, LAMPS, MARQUEE_H, PILLAR_W, TRAY_H,
} from './components/SlotCabinet';
import { SYMBOL_HEIGHT } from './components/Reel';
import { SLOT_CONFIG, VARIANTS } from './logic/slotsData';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const cabinet = () => read('components', 'SlotCabinet.tsx');
const reel = () => read('components', 'Reel.tsx');
const screen = () => read('screens', 'SlotsGameScreen.tsx');

describe('the symbol is no longer the darkest thing on the machine', () => {
    it('the two scrims are shelved rather than left covering the window', () => {
        // THE DEFECT. Two 40 point shades in a 64 point window overlap by 16
        // and wash the whole symbol out.
        const src = reel();
        expect(src).not.toMatch(/<View style=\{styles\.shadeTop\}/);
        expect(src).not.toMatch(/<View style=\{styles\.shadeBottom\}/);
        // Shelved in place, not deleted.
        expect(src).toMatch(/\/\/ shadeTop: \{/);
        expect(src).toMatch(/\/\/ shadeBottom: \{/);
    });

    it('and the arithmetic that made it inevitable is written down', () => {
        // 40 + 40 > 64. Any future window shorter than twice a shade has the
        // same problem, so the number is what the test checks.
        expect(SYMBOL_HEIGHT).toBeLessThan(80);
        expect(reel()).toMatch(/covered the ENTIRE symbol/);
    });

    it('and what replaced them sits above the icon rather than over it', () => {
        const src = reel();
        expect(src).toMatch(/glassLip: \{/);
        const lip = src.slice(src.indexOf('glassLip: {'));
        const height = Number((lip.match(/height: (\d+)/) || [])[1]);
        expect(height).toBeLessThan(SYMBOL_HEIGHT / 3);
    });

    it('and the window is darker than the frame, or it is not a window', () => {
        // The ground, which is the darkest tone the theme has - not an
        // invented darker hex, which is what I reached for first and what the
        // palette audit correctly flagged. The card grey it used to be is the
        // same grey as every card in the game, which is why the machine
        // looked like a card.
        const src = reel();
        expect(src).toMatch(/backgroundColor: theme\.colors\.background,/);
        expect(src).not.toMatch(/reelContainer:[\s\S]{0,600}backgroundColor: '#/);
    });
});

describe('and the machine has a body', () => {
    it('drawn, rather than a rounded rectangle with a border', () => {
        const src = cabinet();
        expect(src).toMatch(/from 'react-native-svg'/);
        expect(src).toMatch(/<Rect/);
        expect(src).toMatch(/<Path/);
        expect(src).toMatch(/LinearGradient/);
    });

    it('with a marquee, pillars, glass and a tray', () => {
        const src = cabinet();
        for (const part of ['THE MARQUEE', 'THE PILLARS', 'THE GLASS BEZEL', 'THE TRAY']) {
            expect(src).toContain(part);
        }
        expect(MARQUEE_H).toBeGreaterThan(24);
        expect(TRAY_H).toBeGreaterThan(0);
        expect(PILLAR_W).toBeGreaterThan(0);
    });

    it('and the screen uses it instead of the grey box', () => {
        const src = screen();
        expect(src).toMatch(/<SlotCabinet/);
        expect(src).not.toMatch(/<View style=\{\[styles\.machineContainer/);
        // Shelved in place.
        expect(src).toMatch(/\/\/ machineContainer: \{/);
    });

    it('and the payline rule that was drawn across the whole machine is gone', () => {
        // 84 points tall at forty per cent, over a window that is 64. Each
        // reel draws its own inside its own glass now.
        const src = screen();
        expect(src).not.toMatch(/<View style=\{\[styles\.payline/);
        expect(src).toMatch(/\/\/ payline: \{/);
    });
});

describe('and it tells you which machine you are standing at', () => {
    it('the name is on the marquee', () => {
        // THE PART THAT IS INFORMATION RATHER THAN DECORATION. Three machines
        // that pay differently used to render identically.
        expect(screen()).toMatch(/title=\{config\.title\}/);
        expect(cabinet()).toMatch(/\{title\.toUpperCase\(\)\}/);
    });

    it('and all three machines actually have distinct names to show', () => {
        const titles = VARIANTS.map(v => SLOT_CONFIG[v].title);
        expect(new Set(titles).size).toBe(VARIANTS.length);
        for (const title of titles) expect(title.length).toBeGreaterThan(0);
    });

    it('and it is RN text, so it survives translation', () => {
        // SVG <Text> would not wrap or localise like the rest of the game.
        expect(cabinet()).toMatch(/<Text numberOfLines=\{1\} style=\{styles\.marqueeText\}>/);
    });

    it('and it is DARK on the lit crown, using the theme token for it', () => {
        // THE HOUSE RULE, and I got it wrong on the first pass: I picked a
        // dark navy hex because it looked right against the blue crown. The
        // theme says black is used on every light fill and no third text
        // colour exists - a raw hex here is both a palette drift and a claim
        // no audit can check.
        const src = cabinet();
        const marquee = src.slice(src.indexOf('marqueeText: {'));
        const decl = marquee.slice(0, marquee.indexOf('}'));
        expect(decl).toMatch(/color: theme\.colors\.onLight,/);
        expect(decl).not.toMatch(/color: '#/);
    });

    it('and the lit fill is a real background, not an SVG shape underneath', () => {
        // Otherwise nothing can verify the rule above: the contrast audit sees
        // dark text with no readable background and reports it against the
        // ground, which is the correct answer to the question it can ask.
        expect(cabinet()).toMatch(/backgroundColor: tint/);
    });

    it('and every room primary really is a fill that takes black', () => {
        // MEASURED, not assumed. If a room is ever themed with a dark primary
        // the marquee becomes black on black and this is what catches it.
        const hx = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
        const lum = (c: number[]) => {
            const [r, g, b] = c.map(v => {
                const s = v / 255;
                return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
            });
            return 0.2126 * r + 0.7152 * g + 0.0722 * b;
        };
        const ratio = (a: number[], b: number[]) => {
            const [l1, l2] = [lum(a), lum(b)];
            return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const black = hx('#000000');
        const white = hx('#FFFFFF');

        const data = fs.readFileSync(
            path.join(__dirname, 'data', 'casinoData.ts'), 'utf8');
        const primaries = [...data.matchAll(/^\s+primary: '(#[0-9A-Fa-f]{6})'/gm)]
            .map(m => m[1]);
        expect(primaries.length).toBeGreaterThan(2);
        for (const p of primaries) {
            expect(ratio(hx(p), black)).toBeGreaterThan(ratio(hx(p), white));
            expect(ratio(hx(p), black)).toBeGreaterThan(4.5);
        }
    });
});

describe('and the lamps react to the spin', () => {
    it('they chase while the reels turn', () => {
        const src = cabinet();
        expect(screen()).toMatch(/spinning=\{isSpinning\}/);
        expect(src).toMatch(/Animated\.loop\(/);
        expect(CHASE_MS).toBeGreaterThan(300);
    });

    it('and they stop and reset when it stops, rather than running forever', () => {
        // A loop left running behind a still machine is a battery drain that
        // shows up as nothing on screen.
        expect(cabinet()).toMatch(/if \(!spinning\) \{\s*chase\.stopAnimation\(\);\s*chase\.setValue\(0\);/);
    });

    it('and they all come up together on a win', () => {
        expect(screen()).toMatch(/won=\{!!showResult && lastResult\?\.type === 'win'\}/);
        expect(FLASH_MS).toBeGreaterThan(100);
    });

    it('and the chase is one value phase shifted, not one timer per lamp', () => {
        // Five timers would drift apart and the light would stop travelling.
        const src = cabinet();
        expect(src).toMatch(/const at = i \/ LAMPS;/);
        expect((src.match(/new Animated\.Value\(0\)/g) || []).length).toBe(2);
        expect(LAMPS).toBeGreaterThan(2);
    });

    it('and a win during a spin lights everything rather than overflowing', () => {
        expect(cabinet()).toMatch(/Animated\.add\(chasePart, flash\)[\s\S]{0,140}extrapolate: 'clamp'/);
    });

    it('and every animation is native driven', () => {
        const src = cabinet();
        expect(src).not.toMatch(/useNativeDriver: false/);
        const timings = (src.match(/Animated\.timing\(/g) || []).length;
        const natives = (src.match(/useNativeDriver: true/g) || []).length;
        expect(natives).toBe(timings);
    });
});

describe('and none of the timing the player liked was touched', () => {
    it('the cabinet knows nothing about when a reel stops', () => {
        // The complaint was the look, and only the look. A makeover that
        // quietly changed the pacing would have broken the one part that was
        // working.
        const src = cabinet();
        expect(src).not.toMatch(/HANG_MS|REEL_GAP|SPIN_MS|settleMs|reelDelays/);
    });

    it('and the reel still takes its stagger and its settle from the hook', () => {
        const src = screen();
        expect(src).toMatch(/delay=\{reelDelays\[colIdx\] \?\? 0\}/);
        expect(src).toMatch(/settleMs=\{settleMs\}/);
    });
});
