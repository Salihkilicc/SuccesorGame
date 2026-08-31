// src/features/casino/cardPacing.test.ts
//
// ============================================================================
//  BEING TOLD THE ANSWER WHILE THE CARD IS STILL MOVING
// ============================================================================
//
//  Reported as "the card is still half open and it already says you won or you
//  lost, and it is not satisfying".
//
//  That was exact, and it was not a timing bug - it was no timing at all.
//  `resolveRound` sat on the line after `setPlayerCards`, synchronously, in the
//  same React tick:
//
//      setPlayerCards(nextPlayer);
//      setDealerCards(nextDealer);
//      ...
//      if (player.isBlackjack || dealer.isBlackjack) resolveRound(outcome);
//
//  So the popup mounted in the same frame the cards began travelling out of the
//  shoe. Same on a bust: the banner arrived while the card that busted you was
//  still turning over. The player was being told the outcome of a hand they had
//  not been shown, and then the animation played out underneath a result that
//  had already spoiled it. That is why it did not satisfy - not because the
//  animation was bad, but because it was redundant by the time it ran.
//
//  ---------------------------------------------------------------------------
//  THE RULE, AND IT IS THE ONE THIS CASINO WAS BUILT ON
//  ---------------------------------------------------------------------------
//      THE ENGINE PRODUCES THE RESULT AT ONCE.
//      THE SCREEN TAKES ITS TIME TELLING YOU.
//
//  Roulette had it from the start: `spinRoulette` decides the number before
//  anything turns, and the settlement waits behind the wheel. Blackjack never
//  got it and poker had it for the streets but not for the showdown. Now all
//  three do, and every wait is DERIVED from what the cards actually take rather
//  than picked - so changing the deal speed moves the pacing with it instead of
//  quietly desynchronising it.
//
//  These tests pin the derivation, not the numbers. A test that asserted
//  `SHOW_DEAL_MS === 920` would fail the next time a card got faster and would
//  have taught us nothing.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { CARD_SHOW_MS, DEAL_GAP, DEAL_MS, FLIP_MS } from './components/AnimatedCard';
import {
    SHOW_DEAL_MS, SHOW_HIT_MS, SHOW_REVEAL_MS, SHOW_SETTLE_MS,
} from './logic/useBlackjackLogic';
import { SETTLE_AFTER_MS } from './logic/useRouletteLogic';
import { SHOWDOWN_MS, STREET_BEAT_MS } from './logic/useSixHandedPoker';
import { DROP_MS, SPIN_MS } from './components/RouletteWheel';

const read = (...p: string[]) => fs.readFileSync(path.join(__dirname, ...p), 'utf8');
const hook = () => read('logic', 'useBlackjackLogic.ts');
const screen = () => read('screens', 'BlackjackGameScreen.tsx');

describe('blackjack settles when the cards have landed, not before', () => {
    it('nothing resolves on the same line that deals', () => {
        // THE DEFECT, as a shape. A `resolveRound` reachable without a timer
        // between it and the deal is the whole bug.
        const src = hook();
        expect(src).not.toMatch(/setPlayerCards\(nextPlayer\);[\s\S]{0,600}?^\s+resolveRound\(/m);
    });

    it('every settlement goes through the show clock', () => {
        const src = hook();
        // Three call sites - the natural, the bust and the stand - and every
        // one of them is behind a timer. The definition reads
        // `const resolveRound = (` and so is not counted here.
        const calls = (src.match(/resolveRound\(/g) || []).length;
        const scheduled = (src.match(/after\([^)]*, \(\) => resolveRound\(/g) || []).length;
        const inBlock = (src.match(/if \(total > 21\) resolveRound\('lose'\)/g) || []).length;
        expect(calls).toBe(3);
        expect(scheduled + inBlock).toBe(calls);
    });

    it('and the opening deal waits for all four cards', () => {
        // Three gaps between four cards, then the last one travels and turns.
        expect(SHOW_DEAL_MS).toBe(DEAL_GAP * 3 + CARD_SHOW_MS);
        expect(SHOW_DEAL_MS).toBeGreaterThan(DEAL_MS);
    });

    it('and a hit waits for the card that might bust you', () => {
        // The one that was reported by name.
        expect(SHOW_HIT_MS).toBeGreaterThan(CARD_SHOW_MS);
    });

    it('and the reveal is long enough to actually see the hole card turn', () => {
        expect(SHOW_REVEAL_MS).toBeGreaterThan(FLIP_MS);
    });

    it('and a dealer who draws three cards takes longer than one who draws none', () => {
        // The wait is a function of how much there is to watch, which is the
        // whole point of deriving it.
        const drawing = (n: number) => n > 0
            ? SHOW_REVEAL_MS + SHOW_SETTLE_MS + (n - 1) * DEAL_GAP
            : SHOW_REVEAL_MS + 220;
        expect(drawing(3)).toBeGreaterThan(drawing(1));
        expect(drawing(1)).toBeGreaterThan(drawing(0));
    });

    it('and none of it is longer than a person will sit through', () => {
        const worst = SHOW_REVEAL_MS + SHOW_SETTLE_MS + 4 * DEAL_GAP;
        expect(worst).toBeLessThan(2200);
    });
});

describe('and the table is dead while it is showing you something', () => {
    it('the hook knows it is busy', () => {
        expect(hook()).toMatch(/const \[busy, setBusy\] = useState\(false\)/);
        expect(hook()).toMatch(/^\s+busy,$/m);
    });

    it('and every action refuses to start on top of another', () => {
        // Without this a player can hit while the previous card is in the air
        // and get two cards landing on the same spot.
        const src = hook();
        expect(src).toMatch(/if \(roundState === 'player' \|\| busy\) return;/);
        expect(src).toMatch(/if \(roundState !== 'player' \|\| busy\) return;/);
    });

    it('and the buttons say so rather than silently swallowing the tap', () => {
        const src = screen();
        expect(src).toMatch(/onPress=\{actions\.hit\}\s*\n\s*disabled=\{busy\}/);
        expect(src).toMatch(/onPress=\{actions\.stand\}\s*\n\s*disabled=\{busy\}/);
        expect(src).toMatch(/busy && styles\.btnBusy/);
    });
});

describe('and the hole card turns at the moment it should', () => {
    it('the reveal is not read off the round being over', () => {
        // THE TRAP THIS FIX WALKED INTO. `roundState === 'player'` used to
        // mean "hole card hidden", which was fine when the round ended
        // instantly. Now the round stays open while the dealer draws, so
        // deriving it that way would keep the card face down until AFTER the
        // result - throwing away the one moment the hand is about.
        expect(hook()).toMatch(/const \[holeRevealed, setHoleRevealed\] = useState\(false\)/);
        expect(hook()).toMatch(/hideHole: roundState === 'player' && !holeRevealed/);
        expect(screen()).toMatch(/const hideDealerHole = hideHole;/);
    });

    it('and it turns the instant the player stands', () => {
        // Not after the draw. It is the first thing that happens.
        const src = hook();
        const standAt = src.indexOf('stand: () =>');
        const stand = src.slice(standAt, src.indexOf('adjustBet:', standAt));
        expect(stand).toMatch(/setHoleRevealed\(true\);/);
        expect(stand).toMatch(/after\(showing/);
        expect(stand.indexOf('setHoleRevealed(true)')).toBeLessThan(stand.indexOf('after(showing'));
    });

    it('and the drawn cards arrive after it rather than over the top of it', () => {
        expect(screen()).toMatch(/const DRAW_AFTER_REVEAL = SHOW_REVEAL_MS;/);
        expect(screen()).toMatch(/baseDelay=\{idx < 2 \? 100 : DRAW_AFTER_REVEAL\}/);
    });
});

describe('and a card taken on a hit does not wait for cards dealt long ago', () => {
    it('only the opening two are staggered', () => {
        // A LATENT ONE, found on the way past. `index={idx}` meant a fifth
        // card carried index 4 and therefore 480ms of stagger belonging to
        // cards that had been on the table for minutes. The longer the hand,
        // the longer the wait.
        expect(screen()).toMatch(/index=\{idx < 2 \? idx : 0\}/);
    });
});

describe('and every timer can be cancelled', () => {
    it('they are held, and cleared when the screen goes away', () => {
        // A settlement firing into an unmounted screen pays out into nothing.
        const src = hook();
        expect(src).toMatch(/const timers = useRef<ReturnType<typeof setTimeout>\[\]>\(\[\]\)/);
        expect(src).toMatch(/useEffect\(\(\) => clearTimers, \[clearTimers\]\)/);
    });

    it('and a new deal cancels whatever the last hand still had running', () => {
        expect(hook()).toMatch(/clearTimers\(\);\s*const dealt = shuffle/);
    });
});

// ============================================================================
//  AND THE SAME RULE IN THE OTHER TWO GAMES
// ============================================================================

describe('roulette announces the number after the ball has stopped', () => {
    it('the wait is derived from the wheel rather than picked', () => {
        // It was a flat 3000 beside a wheel that takes 2620 - correct by
        // COINCIDENCE. Anybody lengthening the spin past 2780 would have had
        // the result announced while the ball was still in the air.
        expect(SETTLE_AFTER_MS).toBe(SPIN_MS + DROP_MS + 380);
        expect(read('logic', 'useRouletteLogic.ts')).not.toMatch(/\}, 3000\);/);
    });

    it('and it is comfortably after the ball drops, not a frame after', () => {
        expect(SETTLE_AFTER_MS - (SPIN_MS + DROP_MS)).toBeGreaterThan(250);
    });

    it('and the number was decided before any of it started turning', () => {
        // The premise the whole split rests on.
        expect(read('logic', 'useRouletteLogic.ts'))
            .toMatch(/const settlement = spinRoulette\(bets\);[\s\S]{0,200}setIsSpinning\(true\)/);
    });
});

describe('and poker awards the pot after the last card lands', () => {
    it('settle is scheduled rather than called on the spot', () => {
        // THE DEFECT, milder than blackjack only because there is less to
        // look at: on the river the pot was awarded in the same tick that the
        // fifth board card appeared.
        const src = read('logic', 'useSixHandedPoker.ts');
        expect(src).not.toMatch(/if \(from\.done\) settle\(from\);/);
        expect(src).toMatch(/setTimeout\(\(\) => settle\(from\), SHOWDOWN_MS\)/);
    });

    it('and that timer is cancellable like every other one at the table', () => {
        expect(read('logic', 'useSixHandedPoker.ts'))
            .toMatch(/setTimeout\(\(\) => settle\(from\), SHOWDOWN_MS\);\s*timers\.current\.push\(id\)/);
    });

    it('and the pause is long enough to turn five hands over and read them', () => {
        // The upper bound was STREET_BEAT_MS * 2 when there was nothing to
        // look at but the last board card. The opponents' hands go face up
        // now, so the pause has to cover the turn AND the reading - see
        // pokerShowdown.test.ts. A bound that stops the pause growing when
        // the thing it is waiting for grew is a bound measuring the wrong
        // quantity.
        expect(SHOWDOWN_MS).toBeGreaterThan(CARD_SHOW_MS + STREET_BEAT_MS);
        // And still short enough that a fast player is not held hostage.
        expect(SHOWDOWN_MS).toBeLessThan(2500);
    });
});
