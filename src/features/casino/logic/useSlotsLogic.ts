import { useState, useRef, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, usePlayerStore } from '../../../core/store';
import { SLOT_CONFIG, SlotVariant, miniOdds, symbolByIcon, iconStrip, symbolsFor } from './slotsData';
import { CASINO_LOCATIONS } from '../data/casinoData';
import { REPUTATION_CEILING, reputationForBet } from '../data/casinoData';
import { casinoAlert } from '../../../data/i18n/casinoText';
import { spinSlot, type SlotSpin } from '../../../core/casino/slots';

export type Grid = [string, string, string][];

// Helper to get random item safely
const getRandomSymbol = (symbols: string[]) => {
  if (!symbols || symbols.length === 0) return '🍒';
  return symbols[Math.floor(Math.random() * symbols.length)] || symbols[0];
};

// Helper to generate a completely random grid (for animation)
// ==========================================================================
//  THE CLOCK, IN ONE PLACE
// ==========================================================================
//  Module scope rather than inside the hook, because the reels need the same
//  numbers the payout timer uses and two copies of a timing is how a reel
//  lands after the money has already been paid.
// ==========================================================================

/** How long the reels blur before the first one stops. */
export const SPIN_MS = 520;
/** The gap between one reel stopping and the next. */
export const REEL_GAP = 200;
/** How long a reel takes to settle onto its face. */
export const SETTLE_MS = 260;
/**
 * And the extra the LAST reel takes when the first two already match.
 *
 * The whole of the anticipation. It changes no odds at all - the outcome was
 * decided before anything moved - it only spends the one moment in the spin
 * where the answer is still genuinely coming. Every machine in every casino
 * does this, and it is the reason the third reel is worth watching.
 */
export const HANG_MS = 450;

/** A plain index into the face list. */
const rnd = (n: number): number => Math.min(n - 1, Math.max(0, Math.floor(Math.random() * n)));

const generateRandomGrid = (symbols: string[]): Grid => {
  return Array.from({ length: 3 }, () => [
    getRandomSymbol(symbols),
    getRandomSymbol(symbols),
    getRandomSymbol(symbols)
  ]) as Grid;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

type OutcomeTier = 'JACKPOT' | 'MINI' | 'LOSS';

export const useSlotsLogic = (
  variant: SlotVariant,
  initialBet?: number,
  customMaxBet?: number,
  /** The city's five faces, cheapest first. See data/casinoData.ts. */
  slotFaces?: readonly string[],
) => {
  const config = SLOT_CONFIG[variant];

  // ----------------------------------------------------------------------
  //  THE MACHINE'S MATHS, THE CITY'S FACES
  // ----------------------------------------------------------------------
  //  A slot per city, and only the symbols change. See `slotFaces` in
  //  data/casinoData.ts for why the split is here rather than seven copies
  //  of a payout table.
  // ----------------------------------------------------------------------
  //  The faces are PASSED IN rather than looked up, because the room the
  //  player is in lives in `useCasinoSystem`'s own state and only the screen
  //  has it. A hook that guessed would be a second answer to a question the
  //  screen already knows.
  const faces = slotFaces ?? CASINO_LOCATIONS[0].slotFaces;
  const symbols = useMemo(
    () => symbolsFor(config, faces),
    [variant, faces.join(',')],
  );
  /**
   * THE REEL STRIP, AS ONE ARRAY THAT DOES NOT CHANGE IDENTITY.
   *
   * Reported as "the slot plays by itself now and then while it is sitting
   * still". It was: `iconStrip(symbols)` was called in the returned state
   * object, so it built a NEW array on every render. The Reel's effect has
   * that array in its dependency list, so every render re-ran the effect and
   * the reel replayed its landing animation - a machine spinning with nobody
   * touching it.
   */
  const symbolIcons = useMemo(() => iconStrip(symbols), [symbols]);

  const maxBetLimit = customMaxBet ?? config.maxBet;

  const { money, spendMoney, earnMoney } = useStatsStore();
  const { reputation, updateReputation } = usePlayerStore();
  const casinoReputation = reputation.casino;

  const [grid, setGrid] = useState<Grid>(() => generateRandomGrid(iconStrip(symbols)));
  // ------------------------------------------------------------------
  //  NOTHING IS STAKED UNTIL THE PLAYER STAKES IT
  // ------------------------------------------------------------------
  //  Asked for as "it should not be playable without choosing a bet, in any
  //  game". This defaulted to `config.minBet`, so the machine arrived with a
  //  chip already on it and SPIN was live before the player had decided
  //  anything - which is how somebody plays a stake they never chose and
  //  then reasonably wonders where the money went.
  //
  //  Zero means unchosen. It is not a legal stake, so every guard that
  //  already refused a zero bet now does the work, and the button says what
  //  is missing instead of firing.
  // ------------------------------------------------------------------
  const [bet, setBet] = useState<number>(() =>
    initialBet ? clamp(initialBet, config.minBet, maxBetLimit) : 0);

  const [isSpinning, setIsSpinning] = useState(false);
  const [message, setMessage] = useState('Ready to spin');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ type: 'win' | 'loss' | 'push', amount: number } | null>(null);

  const lossStreak = useRef(0);
  /** The grid that actually landed, for the payout to read. */
  const targetGridRef = useRef<Grid | null>(null);
  /** What the engine decided, kept for the timer that pays it out. */
  const spinRef = useRef<SlotSpin | null>(null);
  /** True while the last reel is hanging, so the reel can be told to wait. */
  const [hold, setHold] = useState(false);

  useEffect(() => {
    setGrid(generateRandomGrid(iconStrip(symbols)));
  }, [variant]);

  useEffect(() => {
    if (bet > 0 && bet > maxBetLimit) setBet(maxBetLimit);
  }, [maxBetLimit]);

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
    updateReputation('casino', clamp(casinoReputation - 1, 0, REPUTATION_CEILING));
  };

  // ------------------------------------------------------------------
  //  THE ODDS COME FROM THE MACHINE, NOT FROM THIS FILE
  // ------------------------------------------------------------------
  //  They were 1/14 and 1/6 here, the same for all three machines, while
  //  each machine carried its own payout table that nothing read. So the
  //  three differed only in which pictures went past, and the pair of them
  //  together returned 0.548 of the stake - a forty five per cent house
  //  edge nobody had multiplied out. See logic/slotsData.ts.
  // ------------------------------------------------------------------
  const ODDS = {
    JACKPOT: config.jackpotOdds,
    MINI: miniOdds(config),
  };

  // Step 1: Determine Outcome (The Math)
  // ==========================================================================
  //  THE SPIN, AND WHY IT IS A TENTH OF ITS OLD LENGTH
  // ==========================================================================
  //  Reported as "the slots are very slow, one spin every four seconds, they
  //  spin and spin". MEASURED, the old sequence was:
  //
  //      setTimeout(2000)          the blur
  //      + reel stagger 0/300/600  the stops
  //      + 400                     the last settle
  //      + setTimeout(1140)        "suspense", after everything had landed
  //      = 4.14 seconds a spin
  //
  //  And for the whole first two seconds it called `setGrid` from a
  //  `setInterval` every ninety milliseconds - a full React re-render of the
  //  machine, eleven times a second, on the JavaScript thread. That is the
  //  other half of the complaint: the spinning is what made it slow.
  //
  //  The blur is the REEL'S job now and it runs on the UI thread; this hook
  //  sets no grid state while anything is moving.
  //
  //  ORDINARY SPIN: 520 + 400 + 260 = 1.18 seconds.
  //
  //  THE 1140ms OF SUSPENSE IS GONE, and the anticipation replaces it. A flat
  //  wait after the reels have stopped is not suspense, it is a pause: the
  //  player can already see what they got. Real suspense is the third reel
  //  hanging while the first two match, which is the one moment where the
  //  answer is genuinely still coming.
  // ==========================================================================

  /** See SPIN_MS, REEL_GAP, SETTLE_MS and HANG_MS at the top of this file. */
  /**
   * And the extra the LAST reel takes when the first two already match.
   *
   * The whole of the anticipation. It changes no odds at all - the outcome was
   * decided before anything moved - it only spends the one moment in the spin
   * where the answer is still coming. Every machine in every casino does this
   * and it is the reason the third reel is worth watching.
   */

  const handleSpin = () => {
    if (bet <= 0) return casinoAlert('Place Bet', 'Select a chip to play!');
    if (isSpinning) return;
    if (!spendMoney(bet)) return casinoAlert('Funds', "You don't have enough cash!");

    // DECIDED HERE, BEFORE ANYTHING MOVES. See core/casino/slots.ts.
    const spin = spinSlot(config);
    spinRef.current = spin;

    const icons = symbolIcons;
    const face = (i: number) => icons[i] ?? icons[0];
    const targetGrid: Grid = [
      [face(rnd(icons.length)), face(rnd(icons.length)), face(rnd(icons.length))],
      [face(spin.payline[0]), face(spin.payline[1]), face(spin.payline[2])],
      [face(rnd(icons.length)), face(rnd(icons.length)), face(rnd(icons.length))],
    ];
    targetGridRef.current = targetGrid;

    // The last reel hangs when there is something to hang for: the first two
    // faces match, so the third one still decides it.
    const hanging = spin.payline[0] === spin.payline[1];
    setHold(hanging);

    setIsSpinning(true);
    setShowResult(false);
    setMessage('Spinning...');
    setLastResult(null);

    // ONE state write while it spins, not eleven a second.
    setTimeout(() => {
      setGrid(targetGrid);
      setIsSpinning(false);
    }, SPIN_MS);

    const lastReelStops = SPIN_MS + REEL_GAP * 2 + (hanging ? HANG_MS : 0) + SETTLE_MS;
    setTimeout(() => processResult(spin), lastReelStops);
  };

  const processResult = (spin: SlotSpin) => {
    const outcome: OutcomeTier =
      spin.outcome === 'jackpot' ? 'JACKPOT' : spin.outcome === 'second' ? 'MINI' : 'LOSS';
    let winAmount = 0;
    let resultType: 'win' | 'loss' = 'loss';

    // Harcama bazlı reputation: minimum 1 + her $10K bahis = +1 rep
    const spendingRep = reputationForBet(bet);
    reputationUp(spendingRep);

    if (outcome === 'JACKPOT') {
      // ------------------------------------------------------------
      //  WHAT LANDED IS WHAT IT PAYS
      // ------------------------------------------------------------
      //  This was `bet * 3` whatever the reels showed, which made the
      //  payout table - eighteen hand-written numbers across three
      //  machines - decoration, and made the reels decoration with it.
      //  Three crowns is a hundred times the stake now, and three
      //  bears is three, because that is what the machine says.
      // ------------------------------------------------------------
      const landed = symbolByIcon(symbols, targetGridRef.current?.[1]?.[0] ?? '');
      const multiple = landed?.payout ?? config.payouts[0];
      winAmount = Math.round(bet * multiple);
      resultType = 'win';
      lossStreak.current = 0;
      reputationUp(3);
      setMessage(`JACKPOT! +$${winAmount.toLocaleString()}`);
    } else if (outcome === 'MINI') {
      winAmount = Math.round(bet * config.twoKindMultiplier);
      resultType = 'win';
      lossStreak.current = 0;
      reputationUp(1);
      setMessage(`MINI WIN! +$${winAmount.toLocaleString()}`);
    } else {
      // LOSS
      winAmount = 0;
      resultType = 'loss';
      lossStreak.current += 1;
      reputationDownSmall();
      setMessage('No match.');
    }

    if (winAmount > 0) {
      earnMoney(winAmount);
    }

    // Show Popup
    // ------------------------------------------------------------------
    //  THE STAKE ON A LOSS, NOT THE WINNINGS
    // ------------------------------------------------------------------
    //  This passed `winAmount`, which is zero when you lose, so the result
    //  read "-$0". Hidden for as long as the word DEFEAT was the loudest
    //  thing on the card - see components/GameResultPopup.tsx, which is now
    //  only the number. Blackjack and poker were already passing the stake.
    // ------------------------------------------------------------------
    setLastResult({ type: resultType, amount: resultType === 'win' ? winAmount : bet });
    setShowResult(true);
  };

  const setBetAmount = (val: number) => {
    setBet(clamp(val, config.minBet, maxBetLimit));
  };

  const hideResult = () => {
    setShowResult(false);
    setLastResult(null);
  };

  return {
    state: {
      grid, bet, isSpinning, message, showResult, lastResult, money,
      /** True while the last reel is hanging on a matching pair. */
      hold,
      /** What each reel waits before it settles, so the screen has one source. */
      reelDelays: [0, REEL_GAP, REEL_GAP * 2 + (hold ? HANG_MS : 0)] as const,
      settleMs: SETTLE_MS,
      config: { ...config, maxBet: maxBetLimit },
      // The zipped faces, so the screen draws exactly what the payout read.
      symbols,
      symbolIcons,
    },
    actions: { handleSpin, setBetAmount, hideResult }
  };
};