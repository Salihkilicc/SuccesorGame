// src/core/story/risk.test.ts
//
// ============================================================================
//  THE ONE COIN IN THE GAME, MEASURED
// ============================================================================
//
//  `risk` is the only effect that consults a die, and it exists for one file -
//  data/events/espionage.ts, where paying criminals is the decision whose
//  content IS the uncertainty.
//
//  Two claims, and both are the kind that would be wrong silently:
//
//    THE ODDS ARE THE ODDS. A seventy that is really an eighty-five is a lie
//    the player can never detect from inside a campaign, because they see it
//    once. This runs four thousand payments and counts.
//
//    IT IS FLIPPED ONCE. If the betrayal were an event with a 30% chance it
//    would roll every quarter and reach everybody eventually - so this also
//    checks that one call queues at most one scene.
//
//  SEEDED, so it cannot flake. The generator is the same LCG the event tests
//  use for fixed dice.
// ============================================================================

jest.mock('@react-native-async-storage/async-storage', () => ({
    __esModule: true,
    default: {
        getItem: jest.fn(async () => null),
        setItem: jest.fn(async () => { }),
        removeItem: jest.fn(async () => { }),
    },
}));

import { useGameStore, initialGameState } from '../store/useGameStore';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { gameSink } from './gameSink';
import { KEPT_PROMISE, KESTREL_PROMISE } from '../../data/events/espionage';

const seeded = (seed: number) => {
    let s = seed >>> 0;
    return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
};
const realRandom = Math.random;
afterEach(() => { Math.random = realRandom; });

const fresh = () => {
    useGameStore.setState({ ...initialGameState, _hasHydrated: true, currentMonth: 121, age: 55 });
    useStoryStore.setState({ ...initialStoryState, _hasHydrated: true });
};

/** Pay N times and count how often the promise was broken. */
const betrayalRate = (chance: number, n: number): number => {
    Math.random = seeded(20260811);
    let betrayed = 0;
    for (let i = 0; i < n; i++) {
        fresh();
        gameSink().risk(chance, 'event-espionage-broker-betrayal', 3);
        if (useStoryStore.getState().pending.length > 0) betrayed++;
    }
    return betrayed / n;
};

describe('the odds are the odds', () => {
    it('seventy per cent really is seventy per cent', () => {
        const rate = betrayalRate(KEPT_PROMISE, 4000);
        expect(rate).toBeGreaterThan(0.27);
        expect(rate).toBeLessThan(0.33);
    });

    it('and the cheap crew really is worse, by the amount stated', () => {
        // The price ladder is only a decision if the small ransom is worse at
        // the thing being bought. Measured rather than trusted to the constant.
        const cheap = betrayalRate(KESTREL_PROMISE, 4000);
        const dear = betrayalRate(KEPT_PROMISE, 4000);
        expect(cheap).toBeGreaterThan(dear + 0.10);
    });

    it('a certainty never betrays and an impossibility always does', () => {
        expect(betrayalRate(1, 200)).toBe(0);
        expect(betrayalRate(0, 200)).toBe(1);
    });
});

describe('and it is flipped once', () => {
    it('one payment queues at most one scene', () => {
        Math.random = seeded(7);
        for (let i = 0; i < 200; i++) {
            fresh();
            gameSink().risk(KEPT_PROMISE, 'event-espionage-broker-betrayal', 3);
            expect(useStoryStore.getState().pending.length).toBeLessThanOrEqual(1);
        }
    });

    it('and the betrayal is urgent, because it is the payoff of a decision', () => {
        // Holding it behind two condolence letters would be the wrong quarter
        // to find out in.
        Math.random = () => 0.99;      // always betrayed
        fresh();
        gameSink().risk(KEPT_PROMISE, 'event-espionage-broker-betrayal', 3);
        const [queued] = useStoryStore.getState().pending;
        expect(queued.urgent).toBe(true);
        expect(queued.conversationId).toBe('event-espionage-broker-betrayal');
    });

    it('and it arrives later rather than in the same quarter', () => {
        // You pay, and then you live a few quarters believing it worked.
        Math.random = () => 0.99;
        fresh();
        gameSink().risk(KEPT_PROMISE, 'event-espionage-broker-betrayal', 3);
        const [queued] = useStoryStore.getState().pending;
        expect(queued.dueQuarter).toBeGreaterThan(queued.queuedAtQuarter);
    });
});
