// src/features/assets/personalScreen.test.ts
//
// ============================================================================
//  THE SCREEN THAT DID NOT KNOW IT WAS PERSONAL
// ============================================================================
//
//  Everything on it comes from `personalQuarter` - the player's salary, rent,
//  tax, tuition, partner and portfolio - and not one figure belongs to the
//  company. It was captioned ASSETS / Wealth Management and every label was a
//  `company.*` key.
//
//  Three real defects came out of the tidying, and this file pins all three
//  plus the wording, because a rename with a bug still inside it is worse than
//  the bug on its own: it looks finished.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { personalNetWorth } from '../../core/market/personalEconomy';
import { en } from '../../core/i18n/en';
import { tr } from '../../core/i18n/tr';

const read = (p: string) => fs.readFileSync(path.join(__dirname, p), 'utf8');

const code = (p: string) =>
    read(p)
        .replace(/\{?\/\*[\s\S]*?\*\/\}?/g, '')
        .split('\n')
        .filter(l => !/^\s*(\/\/|\*)/.test(l))
        .map(l => l.replace(/\s\/\/.*$/, ''))
        .join('\n');

// ============================================================================
//  1. THE MINUS SIGN ON THE PLAYER'S SAVINGS
// ============================================================================

describe('a breakdown row', () => {
    it('takes its sign from its own type, not from a prop the caller may forget', () => {
        // `isIncome` had two answers for a question with three. The assets
        // section could not say "neither", so it fell through to the expense
        // branch and rendered cash as "Cash (Liquid) -$450,000".
        const src = code('components/AssetsUI.tsx');
        expect(src).not.toMatch(/isIncome/);
        expect(src).toMatch(/item\?\.type === 'income'/);
        expect(src).toMatch(/const sign = kind === 'income' \? '\+' : kind === 'expense' \? '-' : ''/);
    });

    it('and an asset gets no sign and no signal colour', () => {
        // A holding is not a profit or a loss. Green and red are spoken for.
        const src = code('components/AssetsUI.tsx');
        expect(src).toMatch(/: theme\.colors\.textPrimary;/);
    });
});

// ============================================================================
//  2. TWO NET WORTHS UNDER ONE NAME
// ============================================================================

describe('net worth', () => {
    it('counts the stake, which is usually most of it', () => {
        const withStake = personalNetWorth({
            cash: 100_000,
            equityValue: 40_000_000,
            investmentsValue: 250_000,
        });
        expect(withStake).toBe(40_350_000);
    });

    it('and the old answer was smaller than the card that led to it', () => {
        // The exact defect: home said cash + equity + investments, the screen
        // behind it said cash + 0 + investments. Pressing the card made the
        // player poorer.
        const oldAssetsAnswer = 100_000 + 0 + 250_000;
        const now = personalNetWorth({
            cash: 100_000,
            equityValue: 40_000_000,
            investmentsValue: 250_000,
        });
        expect(now).toBeGreaterThan(oldAssetsAnswer);
    });

    it('and it survives missing parts rather than becoming NaN', () => {
        expect(personalNetWorth({})).toBe(0);
        expect(personalNetWorth({ cash: 5_000 })).toBe(5_000);
        expect(personalNetWorth({ cash: 5_000, equityValue: undefined })).toBe(5_000);
    });

    it('and a debt is reported rather than hidden', () => {
        // Cash may go under. The parts are clamped, the total is not: a
        // negative shareholding is a bug, a negative bank balance is a story.
        expect(personalNetWorth({ cash: -20_000, equityValue: 5_000 })).toBe(-15_000);
    });

    it('and both screens read the one derivation', () => {
        const hook = code('hooks/useAssetsLogic.ts');
        expect(hook).toMatch(/netWorth: personalNetWorth\(/);
        expect(hook).toMatch(/const equityValue = \(playerShareCount \|\| 0\) \* \(stockPrice \|\| 0\)/);
        // And the home screen no longer keeps its own copy.
        const home = fs.readFileSync(
            path.join(__dirname, '../../screens/Home/HomeScreen.tsx'), 'utf8',
        )
            .split('\n')
            .filter(l => !/^\s*(\/\/|\*)/.test(l))
            .join('\n');
        expect(home).not.toMatch(/const realNetWorth = cash \+ equityValue/);
        expect(home).toMatch(/const realNetWorth = netWorth;/);
    });
});

// ============================================================================
//  3. THREE ROWS THAT COULD NEVER APPEAR
// ============================================================================

describe('the holdings the engine offered', () => {
    it('no longer include the three nothing ever writes', () => {
        // propertiesValue / vehiclesValue / belongingsValue are read here and
        // written nowhere, then removed by `amount > 0` without a word.
        const src = code('logic/EconomyEngine.ts');
        expect(src).not.toMatch(/statsState\?\.propertiesValue/);
        expect(src).not.toMatch(/statsState\?\.vehiclesValue/);
        expect(src).not.toMatch(/statsState\?\.belongingsValue/);
    });

    it('and they are shelved rather than deleted, with the term kept for them', () => {
        expect(read('logic/EconomyEngine.ts')).toContain('propertiesValue');
        const wealth = fs.readFileSync(
            path.join(__dirname, '../../core/market/personalEconomy.ts'), 'utf8',
        );
        expect(wealth).toContain('belongingsValue');
    });

    it('and the salary is called what it is', () => {
        const src = code('logic/EconomyEngine.ts');
        expect(src).not.toMatch(/'Job Salary'/);
        expect(src).toMatch(/'Your pay as CEO'/);
    });
});

// ============================================================================
//  4. THE WORDS
// ============================================================================

describe('the personal screen', () => {
    const PERSONAL_KEYS = [
        'personal.title', 'personal.subtitle', 'personal.netWorth',
        'personal.whatYouHold', 'personal.cash', 'personal.stake',
        'personal.investments', 'personal.lockedUp', 'personal.allCash',
        'personal.thisQuarter', 'personal.comesIn', 'personal.goesOut',
        'personal.leftOver', 'personal.incomeSources', 'personal.expenses',
        'personal.yourPay', 'personal.payTap',
        'personal.stakeDetail', 'personal.stakeNoName',
        'personal.luxury', 'personal.luxuryCount', 'personal.luxuryNote',
    ];

    it('does not label the player\'s own money as the company\'s', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/t\('company\./);
    });

    it('and every string it uses exists in BOTH catalogues', () => {
        // A missing key falls back to English, so a half translated screen
        // renders and says nothing about it. That is deliberate in i18n and
        // it means only a test can notice.
        for (const key of PERSONAL_KEYS) {
            expect(Object.prototype.hasOwnProperty.call(en, key)).toBe(true);
            expect(Object.prototype.hasOwnProperty.call(tr, key)).toBe(true);
        }
    });

    it('and none of them uses a dash, which is a house rule', () => {
        // Hyphenated words are fine. An em dash or a spaced hyphen is not.
        for (const key of PERSONAL_KEYS) {
            for (const catalogue of [en, tr]) {
                const text = (catalogue as Record<string, string>)[key] ?? '';
                expect(text).not.toMatch(/—/);
                expect(text).not.toMatch(/\s-\s/);
            }
        }
    });

    it('and the stake is named, because that is the point of the screen', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/t\('personal\.stake'\)/);
        expect(src).toMatch(/value=\{equityValue\}/);
        expect(src).toMatch(/personal\.lockedUp/);
    });

    it('and the locked share cannot report a nonsense percentage', () => {
        // A player underwater on cash would otherwise be told that minus four
        // hundred per cent of their wealth is tied up in shares.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/netWorth <= 0\) return 0/);
        expect(src).toMatch(/Math\.min\(1, equityValue \/ netWorth\)/);
    });
});

// ============================================================================
//  5. THE PAY ROW
// ============================================================================

describe('the pay row', () => {
    it('is on the screen the money lands on', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/formatMoney\(ceoPay\)/);
    });

    it('and the decision happens here rather than two screens away', () => {
        // First it was "Job Salary" with no route at all. Then it navigated
        // to Equity, where the panel lived. Now the panel lives here: a
        // personal salary settled on a company share screen was only findable
        // by a player who already knew to look there.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/setPayOpen\(true\)/);
        expect(src).toMatch(/<CeoPayPanel open=\{payOpen\}/);
        expect(src).not.toMatch(/navigation\.navigate\('StockMarket'\)/);
    });

    it('and says when it is locked rather than only refusing later', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/payLockedFor > 0/);
        expect(src).toMatch(/PAY_CHANGE_COOLDOWN/);
    });

    it('and shows the ceiling beside the figure', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/payCeiling\(trailingTotal\(/);
        expect(src).toMatch(/formatMoney\(payMax\)/);
    });
});

// ============================================================================
//  6. THE LOOK
// ============================================================================

describe('the cards', () => {
    it('are the app\'s cards, not the home screen\'s widgets', () => {
        // ----------------------------------------------------------------
        //  THE HOME SCREEN'S LOOK DOES NOT TRAVEL
        // ----------------------------------------------------------------
        //  The lit rim and the diagonal rake took eight rounds to land, and
        //  they belong to two widgets floating on a wallpaper. Carried onto
        //  a page INSIDE the app they made a destination read as a home
        //  screen tile. Reported as "ana sayfadaki kart sistemini kullanma".
        //
        //  Inside the app a card is `theme.colors.card` at 16 with a
        //  hairline border, which is what the product cards are.
        // ----------------------------------------------------------------
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/borderColor: 'rgba\(255,255,255,0\.22\)'/);
        expect(src).not.toMatch(/locations=\{/);
        expect(src).not.toMatch(/LinearGradient/);
        expect(src).toMatch(/backgroundColor: theme\.colors\.card/);
        expect(src).toMatch(/borderColor: theme\.colors\.border/);
    });

    it('and are one component rather than three copies of one style', () => {
        // Two identical gradients forty lines apart is how the home screen
        // shipped a fix to one card and not the other. The technique changed;
        // the reason for writing it once did not.
        const src = code('screens/AssetsScreen.tsx');
        expect((src.match(/<View style=\{styles\.card\}>/g) ?? []).length).toBe(1);
        expect((src.match(/<Card>/g) ?? []).length).toBeGreaterThanOrEqual(3);
    });

    it('and an icon box does not dissolve into the card behind it', () => {
        // `surface` and `card` are the SAME hex, #323A40. The icon boxes sat
        // on `surface` and read fine only because the card behind them used
        // to be the darker `background`. Changing the card would have left
        // nothing but a hairline. A token that happens to contrast is not a
        // token that contrasts.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/holdingIcon: \{[\s\S]{0,400}backgroundColor: theme\.colors\.surface,/);
        expect(src).toMatch(/holdingIcon: \{[\s\S]{0,900}backgroundColor: theme\.colors\.surfaceRaised/);
    });

    it('and the screen uses the one header this app has', () => {
        // Eight style keys reimplemented a centred title, a back button and a
        // bottom rule. ScreenHeader also colours that rule by SECTION, from
        // the route, which a hand-rolled header cannot do at all.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/<ScreenHeader\s+title=\{t\('personal\.title'\)\}/);
        expect(src).not.toMatch(/styles\.headerTitle/);
        expect(src).not.toMatch(/styles\.backButton/);
    });

    it('and leaves room for the nav bar rather than drawing its own', () => {
        // CrystalNavBar is absolute against the window and rendered once by
        // RootNavigator. 44 files used to render their own copy, and on some
        // of them it sat outside the touchable area and did nothing.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/CrystalNavBar/);
        const pad = Number(src.match(/paddingBottom: (\d+),/)?.[1]);
        expect(pad).toBeGreaterThanOrEqual(110);
    });

    it('and the background is a colour rather than a gradient of one colour', () => {
        // Three identical #1C242C stops over absoluteFill, drawn by the most
        // expensive component in the tree.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/colors=\{\['#1C242C', '#1C242C', '#1C242C'\]\}/);
    });

    it('and it takes its colours from tokens', () => {
        // The card's own hexes were #434B50 with a light grey shadow, from
        // before the palette existed.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/backgroundColor: '#434B50'/);
        expect(src).toMatch(/backgroundColor: theme\.colors\.background/);
    });
});


// ============================================================================
//  7. WHAT THE STAKE ACTUALLY IS
// ============================================================================
//
//  The row showed a money figure and, when the company happened to have a
//  name, the words "in Nexus". The PERCENTAGE appeared nowhere on the screen -
//  and it is the number the whole game turns on: below fifty, every decision
//  goes to a vote. See governance.CONTROL_THRESHOLD.
// ============================================================================

describe('the stake row', () => {
    it('says what share of the company it is, somewhere the eye lands', () => {
        // ----------------------------------------------------------------
        //  IT WAS ALREADY THERE AND IT MAY AS WELL NOT HAVE BEEN
        // ----------------------------------------------------------------
        //  The first attempt put the percentage in `sub`, which is eleven
        //  point at fifty per cent white on ONE line. So
        //  "35.0% of Nexus Dynamics · 3,500,000 shares" arrived faint and
        //  truncated at whatever the row had left. Reported as the stake
        //  looking unchanged, and it did.
        //
        //  This rule is about PLACEMENT, not presence, because presence was
        //  never the problem. Control is decided at fifty per cent; that
        //  number gets its own element.
        // ----------------------------------------------------------------
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/chip=\{`\$\{\(stats\.companyOwnership \?\? 0\)\.toFixed\(1\)\}%`\}/);
        // And not buried back in the faint one line subtitle.
        expect(src).not.toMatch(/percent: \(stats\.companyOwnership/);
    });

    it('and the chip is a real element rather than more muted text', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/chipText: \{[\s\S]{0,200}color: theme\.colors\.textPrimary/);
        expect(src).not.toMatch(/chipText: \{[\s\S]{0,200}color: theme\.colors\.textMuted/);
    });

    it('and how many shares that is', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/shares: formatNumber\(playerShareCount \|\| 0\)/);
    });

    it('and still says something when the company has no name yet', () => {
        // It used to pass `undefined` and drop the line entirely, which is
        // exactly the moment a player is least sure what they own.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/stats\.companyName \? 'personal\.stakeDetail' : 'personal\.stakeNoName'/);
        expect(src).not.toMatch(/: undefined\}/);
    });

    it('and both wordings carry the share count', () => {
        // The percentage moved to the chip, so these carry what is left. The
        // no-name case still has to say SOMETHING - a run before the company
        // is named is when a player is least sure what they own.
        for (const catalogue of [en, tr]) {
            const c = catalogue as Record<string, string>;
            expect(c['personal.stakeDetail']).toContain('{shares}');
            expect(c['personal.stakeNoName']).toContain('{shares}');
            expect(c['personal.stakeDetail']).toContain('{company}');
        }
    });
});

// ============================================================================
//  8. LUXONET, READ FOR THE FIRST TIME
// ============================================================================
//
//  `getTotalPortfolioValue`, `getTotalAnnualMaintenance`, `quarterlyTick` and
//  `getTotalPrestige` all had ZERO callers. Four query helpers, a quarterly
//  tick returning maintenance and value change, and an owned-assets array, and
//  nothing anywhere consulted any of it. A player could buy a hypercar and
//  their wealth would not move by a dollar.
//
//  The signature failure of this codebase for the sixth time this session.
// ============================================================================

describe('the luxury row', () => {
    it('reads what the store has been recording all along', () => {
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/useLuxoNetStore/);
        expect(src).toMatch(/currentMarketValue/);
        expect(src).toMatch(/annualMaintenanceCost/);
    });

    it('and is information only, with no door into LuxoNet', () => {
        // Asked for in those words. The row must not become a shop entrance.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/openLuxoNet/);
        expect(src).not.toMatch(/navigate\('Profile'/);
        expect(src).not.toMatch(/LuxoNetPreviewModal|LuxoNetInventoryModal/);
    });

    it('and is not folded into the net worth above it', () => {
        // A display commit should not quietly change what the player is worth.
        // `personalNetWorth` takes belongingsValue and this screen does not
        // pass it - deliberately, and the note says so.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).not.toMatch(/belongingsValue: luxuryValue/);
        expect(src).not.toMatch(/netWorth \+ luxuryValue/);
    });

    it('and stays away when there is nothing to report', () => {
        // An empty luxury row on a founder's first quarter is an
        // advertisement rather than a fact.
        const src = code('screens/AssetsScreen.tsx');
        expect(src).toMatch(/\{luxuryCount > 0 && \(/);
    });
});
