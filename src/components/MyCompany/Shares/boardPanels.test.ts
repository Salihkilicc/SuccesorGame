// src/components/MyCompany/Shares/boardPanels.test.ts
//
// ============================================================================
//  THREE THINGS ABOUT THE BOARD MEMBER SCREEN
// ============================================================================
//
//  Reported together, and the third one turned out not to be what it looked
//  like:
//
//    1. "Update the warning that comes up when you press Blackmail."
//    2. "These dinner and gift panels are much too long, needlessly, and
//        renovate their symbols to suit the game's theme."
//    3. "When I buy a board member out, does it make sense that I buy it with
//        the COMPANY'S money? Because I am buying it for myself. That felt
//        absurd."
//
//  ---------------------------------------------------------------------------
//  THE THIRD ONE IS THE INTERESTING ONE, AND THE ENGINE WAS ALREADY RIGHT
//  ---------------------------------------------------------------------------
//  It would be absurd, and it is not what happens. `negotiateSharePurchase`
//  has done the right thing for a long time: the treasury route RETIRES the
//  holding. The player's share count does not change, the total supply shrinks,
//  and their percentage rises because the denominator did. It also goes to a
//  board vote first, because it is the board's money.
//
//  So this was never a mechanic problem. It was that the only sentence saying
//  so lived in an info box BELOW the Make Offer button. The row you actually
//  choose from said one thing - "Your stake 33% becomes 41%" - and a player
//  reading that while paying with the company's cash draws exactly the
//  conclusion that was drawn.
//
//  Which is this codebase's signature failure wearing a new coat. Usually it
//  is correct data that nothing reads. Here it is correct BEHAVIOUR that
//  nothing explains until after the decision is made.
//
//  These tests pin both halves: that the engine still retires the shares, and
//  that the screen says so before the button rather than after it.
// ============================================================================

import fs from 'fs';
import path from 'path';
import {
    BUYOUT_ROUTE_EXPLANATIONS, BUYOUT_ROUTE_LABELS, quoteAllBuyoutRoutes,
    type BuyoutRoute,
} from '../../../core/market/buyoutFinancing';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const modal = () => read('MemberInteractionModal.tsx');
const i18n = (f: string) =>
    fs.readFileSync(path.join(__dirname, '..', '..', '..', 'core', 'i18n', f), 'utf8');

describe('the company route really does tear the shares up', () => {
    const INPUT = {
        price: 40_000_000,
        playerCash: 1_000_000,
        companyCapital: 900_000_000,
        companyValuation: 4_000_000_000,
        existingDebt: 0,
        totalShares: 10_000_000,
        playerShares: 3_500_000,
        targetShares: 800_000,
        interestRate: 0.08,
    };

    it('buying it yourself gives you the shares and shrinks nothing', () => {
        const q = quoteAllBuyoutRoutes(INPUT).cash;
        expect(q.totalSharesAfter).toBe(INPUT.totalShares);
        expect(q.proposalKind).toBeFalsy();
    });

    it('the company buying it destroys them instead', () => {
        // THE THING THE PLAYER THOUGHT WAS HAPPENING, AND IS NOT. No shares
        // arrive in the player's hands; the supply falls by the whole holding.
        const q = quoteAllBuyoutRoutes(INPUT).treasury;
        expect(q.totalSharesAfter).toBe(INPUT.totalShares - INPUT.targetShares);
        expect(q.personalCashUsed).toBe(0);
        expect(q.companyCashUsed).toBeGreaterThan(0);
    });

    it('and your percentage rises anyway, because the denominator fell', () => {
        const q = quoteAllBuyoutRoutes(INPUT).treasury;
        expect(q.ownershipAfter).toBeGreaterThan(q.ownershipBefore);
        // And it is arithmetic, not a gift: the same count over fewer shares.
        expect(q.ownershipAfter).toBeCloseTo(
            (INPUT.playerShares / (INPUT.totalShares - INPUT.targetShares)) * 100, 4,
        );
    });

    it('and spending their money is their decision, so it goes to a vote', () => {
        const all = quoteAllBuyoutRoutes(INPUT);
        expect(all.treasury.proposalKind).toBeTruthy();
        expect(all.leveraged.proposalKind).toBeTruthy();
        expect(all.cash.proposalKind).toBeFalsy();
    });
});

describe('and the screen says so before the button, not after it', () => {
    it('the row you choose from names where the shares go', () => {
        // THE DEFECT. It said only what happened to the percentage, which is
        // the one fact consistent with the wrong conclusion.
        const src = modal();
        expect(src).toMatch(/q\.proposalKind \? t\('mem\.tornUp'\) : t\('mem\.youKeepThem'\)/);
    });

    it('and the full explanation moved above the offer button', () => {
        // A paragraph after the control that commits to the purchase is not
        // an explanation, it is a receipt.
        const src = modal();
        const info = src.indexOf('BUYOUT_ROUTE_EXPLANATIONS[route]');
        const button = src.indexOf('onPress={handleMakeOffer}');
        expect(info).toBeGreaterThan(-1);
        expect(button).toBeGreaterThan(-1);
        expect(info).toBeLessThan(button);
    });

    it('and the explanations themselves still say it plainly', () => {
        expect(BUYOUT_ROUTE_EXPLANATIONS.treasury).toMatch(/tears it up|torn up|no shares/i);
        expect(BUYOUT_ROUTE_EXPLANATIONS.cash).toMatch(/keep them|yourself/i);
        for (const r of Object.keys(BUYOUT_ROUTE_LABELS) as BuyoutRoute[]) {
            expect(BUYOUT_ROUTE_EXPLANATIONS[r].length).toBeGreaterThan(80);
        }
    });

    it('and the stake line is translatable rather than an English literal', () => {
        const src = modal();
        expect(src).toMatch(/t\('mem\.stakeMove'/);
        expect(src).not.toMatch(/Your stake \$\{/);
    });
});

describe('and the locked door is still a door', () => {
    it('the blackmail panel speaks in the world, not in features', () => {
        // It said "This feature is locked. Unlock by completing the Corporate
        // Espionage storyline", under a spy emoji. Nothing else in the
        // boardroom talks about features and unlocks.
        const src = modal();
        expect(src).toMatch(/title: t\('mem\.blackmailTitle'\)/);
        expect(src).toMatch(/summary: t\('mem\.blackmailBody'\)/);
        expect(src).not.toMatch(/'🕵️ Blackmail'/);
        expect(src).not.toMatch(/alert\.thisFeatureIsLockedN/);
    });

    it('and the storyline is a note rather than the whole message', () => {
        expect(modal()).toMatch(/note: t\('mem\.blackmailNote'\)/);
    });
});

describe('and the gift and dinner panels are short', () => {
    it('the gift panel carries one figure, not a ledger and two paragraphs', () => {
        const src = modal();
        const at = src.indexOf("title: t('mem.sendGiftTitle')");
        const panel = src.slice(at, src.indexOf('confirmLabel', at));
        const lines = (panel.match(/\{ label:/g) || []).length;
        expect(lines).toBe(1);
    });

    it('and the body text is a sentence rather than a lecture', () => {
        // Measured against the strings themselves, which is where the length
        // actually lived.
        for (const f of ['en.ts', 'tr.ts']) {
            const src = i18n(f);
            for (const key of ['mem.sendGiftBody2', 'mem.dinnerBody2']) {
                const line = src.split('\n').find(l => l.includes(`'${key}'`)) || '';
                expect([f, key, line.length]).toEqual([f, key, expect.any(Number)]);
                expect(line.length).toBeLessThan(110);
                // And no embedded paragraph breaks, which is what made them tall.
                expect([f, key, line.includes('\\n')]).toEqual([f, key, false]);
            }
        }
    });

    it('and the note is one line about who it lands on', () => {
        const src = modal();
        expect(src).toMatch(/note: t\('mem\.giftLikes'\)/);
        expect(src).toMatch(/note: t\('mem\.dinnerLikes'\)/);
        expect(src).not.toMatch(/A gift is a MONEY gesture/);
        expect(src).not.toMatch(/Dinner is a RECOGNITION gesture/);
    });
});

describe('and the symbols belong to this game', () => {
    it('no emoji left in the titles', () => {
        for (const f of ['en.ts', 'tr.ts']) {
            const src = i18n(f);
            for (const key of ['mem.sendGiftTitle', 'mem.dinnerTitle']) {
                const line = src.split('\n').find(l => l.includes(`'${key}'`)) || '';
                expect([f, key, /[\u{1F300}-\u{1FAFF}]/u.test(line)]).toEqual([f, key, false]);
            }
        }
        expect(modal()).not.toMatch(/🔒/);
    });

    it('and the badges use the theme rather than three loose hex literals', () => {
        // THE DEFECT. Amber, cornflower and slate, from whichever component
        // they were copied out of, sitting in a boardroom built entirely from
        // the theme.
        const src = modal();
        expect(src).toMatch(/badgeLive: \{[\s\S]{0,120}theme\.colors\.highlightSoft/);
        expect(src).toMatch(/badgeDead: \{/);
        for (const hex of ['#FBBF24', '#60A5FA', '#94A3B8']) {
            expect([hex, src.includes(hex)]).toEqual([hex, false]);
        }
    });

    it('and the one you cannot use looks like every other dead control', () => {
        const src = modal();
        expect(src).toMatch(/styles\.badgeDead\]}>\s*<MaterialCommunityIcons name="incognito"[\s\S]{0,80}theme\.colors\.textMuted/);
    });
});

describe('and every new string exists in both languages, without a dash', () => {
    const KEYS = [
        'common.ok', 'mem.cashAfter', 'mem.locked', 'mem.stakeMove',
        'mem.blackmailTitle', 'mem.blackmailBody', 'mem.blackmailNote',
        'mem.giftLikes', 'mem.dinnerLikes', 'mem.youKeepThem', 'mem.tornUp',
    ];

    it('both files carry all of them', () => {
        for (const f of ['en.ts', 'tr.ts']) {
            const src = i18n(f);
            for (const key of KEYS) {
                expect([f, key, src.includes(`'${key}'`)]).toEqual([f, key, true]);
            }
        }
    });

    it('and none of them uses a dash, which is banned in player text', () => {
        for (const f of ['en.ts', 'tr.ts']) {
            const src = i18n(f);
            for (const key of KEYS) {
                const line = src.split('\n').find(l => l.includes(`'${key}'`)) || '';
                expect([f, key, /—|–| - /.test(line)]).toEqual([f, key, false]);
            }
        }
    });
});
