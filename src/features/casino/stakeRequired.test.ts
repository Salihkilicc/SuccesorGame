// src/features/casino/stakeRequired.test.ts
//
// ============================================================================
//  EVERY TABLE ARRIVED WITH A BET ALREADY ON IT
// ============================================================================
//
//  Asked for as "it should not be playable without choosing a bet, in any
//  game".
//
//  All three of the staked games opened with one already chosen:
//
//      slots       config.minBet
//      blackjack   500
//      roulette    1000
//
//  So SPIN and DEAL were live before the player had decided anything, and the
//  first tap on the roulette layout laid a chip whose size nobody had picked.
//  Which is how somebody plays a stake they never chose and then reasonably
//  wonders where the money went.
//
//  Zero means unchosen. It is not a legal stake, so the guards that already
//  refused a zero bet finally get to do their job - and the button says what
//  is missing instead of firing an alert after the tap, which is the same
//  rule the poker door follows.
//
//  POKER IS THE EXCEPTION AND IT IS THE RIGHT ONE. Its stake is the room's
//  door price rather than a choice, so there is nothing to pick; the decision
//  it asks for is whether to walk in. See core/casino/pokerStakes.ts.
// ============================================================================

import fs from 'fs';
import path from 'path';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const slotsHook = () => read('logic', 'useSlotsLogic.ts');
const rouletteHook = () => read('logic', 'useRouletteLogic.ts');
const blackjack = () => read('screens', 'BlackjackGameScreen.tsx');
const slots = () => read('screens', 'SlotsGameScreen.tsx');
const roulette = () => read('screens', 'RouletteGameScreen.tsx');

describe('nothing is staked until the player stakes it', () => {
    it('the slot opens with no chip on it', () => {
        // THE DEFECT. `initialBet ?? config.minBet` meant the machine was
        // always ready to take money.
        const src = slotsHook();
        expect(src).toMatch(/initialBet \? clamp\(initialBet, config\.minBet, maxBetLimit\) : 0/);
        expect(src).not.toMatch(/clamp\(initialBet \?\? config\.minBet/);
    });

    it('and blackjack does not deal itself a five hundred dollar hand', () => {
        const src = blackjack();
        expect(src).toMatch(/route\.params\?\.betAmount \?\? 0/);
        expect(src).not.toMatch(/betAmount \?\? 500/);
    });

    it('and roulette does not lay a chip nobody chose', () => {
        const src = rouletteHook();
        expect(src).toMatch(/useState<number>\(initialChip \?\? 0\)/);
        expect(src).not.toMatch(/initialChip \?\? 1000/);
    });

    it('and a stake passed in from the lobby is still honoured', () => {
        // The rooms hand a stake through route params. Refusing that would
        // break the way the player gets here.
        expect(slotsHook()).toMatch(/initialBet \?/);
        expect(blackjack()).toMatch(/route\.params\?\.betAmount/);
        expect(rouletteHook()).toMatch(/initialChip \?\?/);
    });
});

describe('and the control says what is missing rather than firing', () => {
    it('the slot button asks for a stake', () => {
        expect(slots()).toMatch(/bet <= 0 \? t\('casino\.pickChip'\)/);
    });

    it('and the blackjack button does too', () => {
        expect(blackjack()).toMatch(/bet <= 0 \? t\('casino\.pickChip'\)/);
    });

    it('and the roulette hint walks the player through both steps', () => {
        // Choose a chip, then put it somewhere, then spin. Three states, and
        // the hint was only ever telling them about the second.
        const src = roulette();
        expect(src).toMatch(/selectedChip <= 0 \? t\('casino\.pickChip'\)/);
        expect(src).toMatch(/bets\.length === 0 \? t\('casino\.placeChipsFirst'\)/);
        expect(src).toMatch(/t\('casino\.tapHub'\)/);
    });

    it('and the guards behind them still refuse, belt and braces', () => {
        // The label is the courtesy. The guard is the rule, and it was always
        // there - it simply could never be reached.
        expect(slotsHook()).toMatch(/if \(bet <= 0\) return casinoAlert/);
        expect(rouletteHook()).toMatch(/if \(selectedChip <= 0\) return;/);
    });

    it('and the play control is dead while nothing is staked', () => {
        expect(slots()).toMatch(/disabled=\{isSpinning \|\| bet <= 0\}/);
        expect(blackjack()).toMatch(/disabled=\{busy \|\| \(bet <= 0 && roundState === 'idle'\)\}/);
    });

    it('and the string exists in both languages', () => {
        const i18n = (f: string) =>
            fs.readFileSync(path.join(__dirname, '..', '..', 'core', 'i18n', f), 'utf8');
        for (const f of ['en.ts', 'tr.ts']) {
            expect([f, i18n(f).includes("'casino.pickChip'")]).toEqual([f, true]);
        }
    });
});

describe('and poker is exempt for a reason, not by oversight', () => {
    it('its stake is the room"s door price, so there is nothing to choose', () => {
        const poker = read('screens', 'PokerGameScreen.tsx');
        expect(poker).toMatch(/const doorPrice = pokerBuyInFor/);
        expect(poker).not.toMatch(/<CustomChipSelector/);
    });

    it('and it still refuses a player who cannot cover it', () => {
        expect(read('screens', 'PokerGameScreen.tsx'))
            .toMatch(/const canAfford = cash >= buyIn && buyIn > 0/);
    });
});
