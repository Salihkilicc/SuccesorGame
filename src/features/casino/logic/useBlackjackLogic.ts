// src/features/casino/logic/useBlackjackLogic.ts
import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { REPUTATION_CEILING, reputationForBet } from '../data/casinoData';
import { casinoAlert } from '../../../data/i18n/casinoText';
import { CARD_SHOW_MS, DEAL_GAP, DEAL_MS, FLIP_MS } from '../components/AnimatedCard';
import {
    dealerPlay,
    freshDeck,
    handValue,
    settle,
    shuffle,
    type Card,
} from '../../../core/casino/blackjack';

// --- TİPLER VE SABİTLER ---
/**
 * Re-exported rather than re-declared.
 *
 * This file had its own `Card` shape - `rank: string` - beside the engine's
 * `rank: Rank`, which is the looser of the two and would have let a typo
 * through. One definition, in the file that knows what a card is worth.
 */
export type { Card } from '../../../core/casino/blackjack';

type RoundState = 'idle' | 'player' | 'done';

// ============================================================================
//  THE RULES LIVE IN core/casino/blackjack.ts NOW
// ============================================================================
//  The deck, the shuffle, the ace demotion and the dealer's draw were all in
//  this file, and none of them could be tested: the shuffle was inline in a
//  handler and the dealer's whole hand was a `while` loop inside `stand`.
//
//  The dealer's draw mattered most. It returned only the finished hand, so the
//  screen had no way to lay the cards down one at a time - a dealer who
//  arrives at nineteen instantly is a number appearing, not a dealer.
//  `dealerPlay` returns the cards IN ORDER now.
// ============================================================================

// Helper: Sayı Sınırlama
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// ============================================================================
//  THE ENGINE KNOWS AT ONCE. THE TABLE TAKES ITS TIME TELLING YOU.
// ============================================================================
//
//  Reported as "the card is still half open and it already says you won or you
//  lost, and it is not satisfying".
//
//  That was exact. `resolveRound` was called on the same line that dealt the
//  cards - synchronously, in the same React tick - so the popup mounted in the
//  same frame in which the cards began travelling out of the shoe. The player
//  was told the outcome of a hand they had not been shown yet, and then the
//  animation played out underneath a banner that had already spoiled it.
//
//  Roulette got this right and blackjack never did: there the wheel turns for
//  three seconds and the settlement waits behind it, even though `spinRoulette`
//  decided the number before anything moved. Same idea here. The engine still
//  settles the instant it can - that is what makes it testable - and these
//  numbers are only how long the TELLING takes.
//
//  Every one of them is derived from what the cards actually do rather than
//  picked, so changing the deal speed in AnimatedCard moves the pacing with it
//  instead of quietly desynchronising it.
// ============================================================================

/** The opening deal: four cards staggered, the last one landing and turning. */
export const SHOW_DEAL_MS = DEAL_GAP * 3 + DEAL_MS + CARD_SHOW_MS - DEAL_MS;

/** One card on a hit. No stagger ahead of it, so just the card. */
export const SHOW_HIT_MS = CARD_SHOW_MS + 90;

/**
 * The hole card turning over, plus a beat to look at it.
 *
 * THE MOST DRAMATIC MOMENT AT THE TABLE and it deserves its own pause. The
 * dealer's draw waits behind this, which is why the screen offsets the drawn
 * cards by the same amount.
 */
export const SHOW_REVEAL_MS = FLIP_MS + 200;

/** And the last card the dealer draws still has to land and turn. */
export const SHOW_SETTLE_MS = CARD_SHOW_MS + 120;

export const useBlackjackLogic = (initialBet: number = 500000) => {
    // Global Store
    const { money, setField } = useStatsStore();
    const { reputation, updateReputation } = usePlayerStore();
    const casinoReputation = reputation.casino;

    // Game State
    const [playerCards, setPlayerCards] = useState<Card[]>([]);
    const [dealerCards, setDealerCards] = useState<Card[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const [bet, setBet] = useState(initialBet);
    const [roundState, setRoundState] = useState<RoundState>('idle');
    const [status, setStatus] = useState('Place your bet and deal.');
    const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss' | 'push', amount: number } | null>(null);
    const lossStreak = useRef(0);
    /**
     * How many cards the dealer drew on the last stand.
     *
     * The table staggers them so they arrive one at a time; without it the
     * dealer goes from two cards to five in a single frame.
     */
    const [dealerDrawn, setDealerDrawn] = useState(0);

    /**
     * True while the table is still showing you something.
     *
     * Cards in the air, a hole card turning, a dealer drawing. The buttons are
     * dead for the duration, because a player who can hit while the previous
     * card is still travelling gets two cards arriving on top of each other.
     */
    const [busy, setBusy] = useState(false);

    /**
     * Whether the dealer's second card has been turned face up.
     *
     * Separate from `roundState` on purpose. The hole card must turn the
     * INSTANT the player stands, but the round is not over until the dealer
     * has finished drawing and the settlement has been shown - and those are
     * seconds apart now. Reading the reveal off `roundState === 'player'`
     * would keep the card face down until the very end and throw away the one
     * moment the hand is actually about.
     */
    const [holeRevealed, setHoleRevealed] = useState(false);

    // ------------------------------------------------------------------
    //  AND EVERY TIMER IS CANCELLABLE
    // ------------------------------------------------------------------
    //  A settlement that fires into a screen the player has already left
    //  pays out into a dead component. Held here and cleared on unmount.
    // ------------------------------------------------------------------
    const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
    const clearTimers = useCallback(() => {
        timers.current.forEach(clearTimeout);
        timers.current = [];
    }, []);
    useEffect(() => clearTimers, [clearTimers]);

    /** Do this once the table has finished showing what it is showing. */
    const after = useCallback((ms: number, run: () => void) => {
        timers.current.push(setTimeout(run, ms));
    }, []);

    /** See core/casino/blackjack.ts. */
    const calculateHand = handValue;

    const playerTotal = useMemo(() => calculateHand(playerCards).total, [playerCards]);
    const dealerTotal = useMemo(() => calculateHand(dealerCards).total, [dealerCards]);

    // --- OYUN MANTIĞI ---
    const reputationUp = (delta: number) => {
    // ------------------------------------------------------------------
    //  THE ONLY PLACE THE COMPANY FINDS OUT YOU WERE HERE
    // ------------------------------------------------------------------
    //  The casino has been in this game since before any of the story and it
    //  has never cost the chief executive anything except money - a player
    //  could be at a table every week for nine years and nothing in the
    //  company would know. This marks the quarter. See
    //  core/store/useCasinoRiskStore.ts for why it is a boolean rather than a
    //  tally, and data/events/casino.ts for what three in a row does.
    // ------------------------------------------------------------------
    try {
        require('../../../core/store/useCasinoRiskStore')
            .useCasinoRiskStore.getState().recordVisit();
    } catch { /* risk store not ready */ }

    // ------------------------------------------------------------------
    //  AND THE QUARTER ONLY HAS SO MUCH STANDING IN IT
    // ------------------------------------------------------------------
    //  Nothing limits how long a player sits here - no energy, no cap on
    //  hands - so without this the seven room ladder falls in one evening.
    //  `bankReputation` returns what was actually allowed, which is 0 once
    //  the quarter is spent. See MAX_REP_PER_QUARTER.
    // ------------------------------------------------------------------
    const allowed = (() => {
        try {
            return require('../../../core/store/useCasinoRiskStore')
                .useCasinoRiskStore.getState().bankReputation(delta);
        } catch {
            return delta;
        }
    })();
    if (allowed <= 0) return;
        updateReputation('casino', clamp(Math.round(casinoReputation + allowed), 0, REPUTATION_CEILING));
    };

    const reputationDownSmall = () => {
        if (lossStreak.current >= 3) {
            updateReputation('casino', clamp(casinoReputation - 1, 0, REPUTATION_CEILING));
            lossStreak.current = 0;
        }
    };

    const resolveRound = (outcome: 'win' | 'lose' | 'push' | 'blackjack') => {
        let winnings = 0;

        // Harcama bazlı reputation: minimum 1 + her $10K bahis = +1 rep
        const spendingRep = reputationForBet(bet);
        reputationUp(spendingRep);

        if (outcome === 'win') {
            winnings = bet * 2;
            reputationUp(1);
            lossStreak.current = 0;
            setStatus(`You win ${winnings.toLocaleString()}!`);
            setResultPopup({ type: 'win', amount: bet });
        } else if (outcome === 'blackjack') {
            winnings = Math.round(bet * 2.5);
            reputationUp(2);
            lossStreak.current = 0;
            setStatus('Blackjack! Premium payout.');
            setResultPopup({ type: 'win', amount: Math.round(bet * 1.5) });
        } else if (outcome === 'push') {
            winnings = bet;
            setStatus('Push. Bet returned.');
            setResultPopup({ type: 'push', amount: bet });
        } else {
            lossStreak.current += 1;
            reputationDownSmall();
            setStatus('Bust or dealer wins.');
            setResultPopup({ type: 'loss', amount: bet });
        }

        const nextMoney = money - bet + winnings;
        setField('money', nextMoney);
        setRoundState('done');

        // ------------------------------------------------------------------
        //  AND THE TABLE IS FREE AGAIN
        // ------------------------------------------------------------------
        //  Reported as "in blackjack I cannot play any more after I lose".
        //  That was mine, and it was a bad one: `busy` is set when the show
        //  starts and every path cleared it EXCEPT this one. Standing is the
        //  path, and standing is how most hands end - so the table locked
        //  solid after nearly every hand and DEAL stayed dead forever.
        //
        //  It belongs here rather than in the three callers, because "the
        //  hand is over" and "the table has stopped showing you things" are
        //  the same moment, and three callers is three chances to forget.
        //  Which is exactly what happened.
        // ------------------------------------------------------------------
        setBusy(false);
    };

    // --- ACTIONS (UI'ın kullanacağı fonksiyonlar) ---

    const actions = {
        deal: () => {
            setResultPopup(null);
            if (roundState === 'player' || busy) return;
            if (bet <= 0) {
                casinoAlert('Place Bet', 'Please place a bet on the table.');
                return;
            }
            if (money < bet) {
                casinoAlert('Not enough cash', 'Lower your bet or build more bankroll.');
                return;
            }

            clearTimers();
            const dealt = shuffle(freshDeck());
            const nextPlayer = [dealt.pop()!, dealt.pop()!];
            const nextDealer = [dealt.pop()!, dealt.pop()!];

            setPlayerCards(nextPlayer);
            setDealerCards(nextDealer);
            setDeck(dealt);
            setDealerDrawn(0);
            setHoleRevealed(false);
            setRoundState('player');
            setStatus('Dealing...');
            setBusy(true);

            const player = calculateHand(nextPlayer);
            const dealer = calculateHand(nextDealer);

            // DECIDED HERE, BEFORE A CARD HAS LANDED. The wait below is the
            // telling of it, not the deciding.
            const natural = player.isBlackjack || dealer.isBlackjack;
            const outcome = player.isBlackjack && dealer.isBlackjack ? 'push'
                : player.isBlackjack ? 'blackjack' : 'lose';

            after(SHOW_DEAL_MS, () => {
                setBusy(false);
                if (!natural) {
                    setStatus('Your move: HIT or STAND.');
                    return;
                }
                // A natural shows the dealer's hole card too. There is nothing
                // left to play for, so there is nothing left to hide.
                setHoleRevealed(true);
                after(SHOW_REVEAL_MS, () => resolveRound(outcome));
            });
        },

        hit: () => {
            if (roundState !== 'player' || busy) return;
            const nextDeck = [...deck];
            const card = nextDeck.pop();
            if (!card) return;

            const nextHand = [...playerCards, card];
            setPlayerCards(nextHand);
            setDeck(nextDeck);
            setBusy(true);

            const { total } = calculateHand(nextHand);

            after(SHOW_HIT_MS, () => {
                setBusy(false);
                // THE CARD HAS TO BE FACE UP BEFORE IT CAN BUST YOU. This is
                // the one that was reported: the bust banner used to arrive
                // while the card that caused it was still turning over.
                if (total > 21) resolveRound('lose');
            });
        },

        stand: () => {
            if (roundState !== 'player' || busy) return;

            // ONE CALL, and it hands back the cards IN ORDER so the table can
            // lay them down one at a time. See core/casino/blackjack.ts.
            const play = dealerPlay(dealerCards, deck);
            setDealerCards(play.cards);
            setDeck(play.deck);
            setDealerDrawn(play.drawn.length);
            setBusy(true);
            setStatus('Dealer plays.');

            // And one call for who won, rather than four branches here.
            const outcome = settle(playerCards, play.cards, bet).outcome;

            // ---- and now the show, in three beats ----
            //  The hole card turns FIRST and on its own, because it is the
            //  moment the hand is about. The drawn cards are already in state
            //  but the screen holds them back by SHOW_REVEAL_MS, so they
            //  arrive after it rather than over the top of it. Only once the
            //  last of them has landed and turned does anybody say who won.
            //
            //  Dumping all of it into one frame is what made this
            //  unsatisfying: the drama and the answer arrived together, so
            //  there was no drama.
            setHoleRevealed(true);
            const showing = play.drawn.length > 0
                ? SHOW_REVEAL_MS + SHOW_SETTLE_MS + (play.drawn.length - 1) * DEAL_GAP
                : SHOW_REVEAL_MS + 220;
            after(showing, () => resolveRound(outcome));
        },

        adjustBet: (delta: number) => {
            if (busy) return;
            setResultPopup(null);
            const next = clamp(bet + delta, 10, 100_000_000_000);
            setBet(next);
        },

        closePopup: () => setResultPopup(null)
    };

    return {
        state: {
            playerCards,
            dealerCards,
            bet,
            roundState,
            status,
            resultPopup,
            playerTotal,
            dealerTotal,
            dealerDrawn,
            money,
            busy,
            /**
             * Whether the hole card is still face down.
             *
             * Computed here rather than in the screen, which used to derive it
             * from `roundState === 'player'` - and that no longer works now
             * that the round stays open while the dealer draws.
             */
            hideHole: roundState === 'player' && !holeRevealed,
        },
        actions
    };
};