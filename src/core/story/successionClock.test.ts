// src/core/story/successionClock.test.ts
//
// ============================================================================
//  TWO THINGS THAT PUNISHED THE PLAYER FOR PLAYING WELL
// ============================================================================
//
//  Reported as a child becoming chief executive at three or four, and as
//  being barred from the chair while holding a hundred per cent of the
//  company having done nothing illegal. Both were measured before either was
//  touched, and neither was quite what it looked like.
//
//  THE CLOCK. `currentMonth` is a month of the YEAR, one to twelve, and
//  advanceMonth wraps it with `while (m > 12) { m -= 12; age += 1 }`. The
//  succession added `yearsHeld * 12` straight onto it, so a chair held
//  thirteen years wrote month 163 and the NEXT quarter ran that loop thirteen
//  times. Measured: the sixteen year old who had just inherited the company
//  was twenty nine, three months later.
//
//  THE DEFENCE. An empty board scored zero loyalty, and zero on that scale
//  means every director testifying against you. The player with no board is
//  the player who bought them all out - which the game offers as a way to win.
// ============================================================================

import { judge, provenBuys, recordSuspicion } from './manipulation';
import { NO_BOARD_LOYALTY, boardLoyalty } from './runManipulation';
import { runSuccession } from './runSuccession';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useGameStore } from '../store/useGameStore';
import { useIdentityStore, initialIdentityState } from '../store/useIdentityStore';
import { useStatsStore } from '../store';

const kid = (age: number) => ({
    id: 'heir', name: 'Elena Hale', age, gender: 'Female',
    educationLevel: 'None', relationshipWithPlayer: 60, role: 'Infant',
    legitimate: true,
    stats: { intelligence: 50, charisma: 50, ambition: 50, discipline: 50 },
});

describe('the calendar survives a chair that stood empty', () => {
    beforeEach(() => {
        useIdentityStore.setState({
            ...initialIdentityState,
            firstName: 'Salih', lastName: 'Hale', ownFirstName: 'Salih', created: true,
        });
        useStatsStore.setState({ money: 1_000_000 } as never);
    });

    const succeedWith = (childAge: number, startMonth = 7) => {
        useGameStore.setState({ currentMonth: startMonth, age: 61 } as never);
        useFamilyStore.setState({
            children: [kid(childAge)], designatedSuccessorId: null,
        } as never);
        return runSuccession();
    };

    it('the month stays a month, whatever the wait was', () => {
        // 163 was the measured value. A month of the year cannot be 163.
        for (const childAge of [0, 1, 3, 8, 15]) {
            succeedWith(childAge);
            const m = (useGameStore.getState() as { currentMonth: number }).currentMonth;
            expect(m).toBeGreaterThanOrEqual(1);
            expect(m).toBeLessThanOrEqual(12);
        }
    });

    it('and the heir is sixteen, not twenty nine a quarter later', () => {
        const plan = succeedWith(3);
        expect(plan!.yearsHeld).toBe(13);
        expect(plan!.ceo.age).toBe(16);

        // What the next tick would do, in the arithmetic advanceMonth uses.
        const g = useGameStore.getState() as { currentMonth: number; age: number };
        let month = g.currentMonth + 3;
        let age = g.age;
        while (month > 12) { month -= 12; age += 1; }
        expect(age).toBeLessThanOrEqual(17);
    });

    it('and an heir already grown does not move the calendar at all', () => {
        useGameStore.setState({ currentMonth: 5, age: 61 } as never);
        useFamilyStore.setState({
            children: [kid(20)], designatedSuccessorId: null,
        } as never);
        const plan = runSuccession();
        expect(plan!.yearsHeld).toBe(0);
        expect((useGameStore.getState() as { currentMonth: number }).currentMonth).toBe(5);
    });
});

describe('owning the whole company is not a confession', () => {
    afterEach(() => { useShareholderStore.setState({ members: [] } as never); });

    it('an empty board is neutral, not hostile', () => {
        useShareholderStore.setState({ members: [] } as never);
        expect(boardLoyalty()).toBe(NO_BOARD_LOYALTY);
        expect(NO_BOARD_LOYALTY).toBeGreaterThan(0);
        expect(NO_BOARD_LOYALTY).toBeLessThan(100);
    });

    /** One purchase during a real crash, with the price recovering after. */
    const provenCase = () => {
        const buy = recordSuspicion({
            quarter: 10, price: 35, reference: 100,
            ownershipBefore: 55, ownershipAfter: 70,
        })!;
        expect(buy).toBeTruthy();
        return provenBuys([buy], { quarter: 12, price: 90 });
    };

    it('and the same purchase is judged the same with a board or without one', () => {
        // Measured before the fix: an ordinary board gave `fine` and NO board
        // gave `barred`, for the identical act. Buying out the last director
        // cannot be what turns a fine into a bar.
        const proven = provenCase();
        const wealth = 10_000_000;
        const ordinary = judge(proven, { boardLoyalty: 60, personalWealth: wealth });

        // Through boardLoyalty() with an empty store, NOT through the
        // constant: reading the constant here would test the number against
        // itself and pass even with the store function still returning zero.
        // Probed, and it did exactly that.
        useShareholderStore.setState({ members: [] } as never);
        const none = judge(proven, {
            boardLoyalty: boardLoyalty(), personalWealth: wealth,
        });

        expect(ordinary.verdict).toBe('fine');
        expect(none.verdict).toBe('fine');
    });

    it('though a board that despises you still costs you', () => {
        // The mechanic has to keep working. Neutral is not immunity.
        const proven = provenCase();
        const hated = judge(proven, { boardLoyalty: 0, personalWealth: 10_000_000 });
        expect(hated.verdict).toBe('barred');
    });

    it('and a big enough case still bars a player with nobody to speak for them', () => {
        // Two purchases, deeper, taking far more of the company.
        const buys = [
            recordSuspicion({ quarter: 8, price: 8, reference: 100, ownershipBefore: 20, ownershipAfter: 55 })!,
            recordSuspicion({ quarter: 9, price: 6, reference: 100, ownershipBefore: 55, ownershipAfter: 90 })!,
        ];
        const proven = provenBuys(buys, { quarter: 11, price: 95 });
        expect(proven.length).toBe(2);
        const j = judge(proven, { boardLoyalty: NO_BOARD_LOYALTY, personalWealth: 10_000_000 });
        expect(['barred', 'prison']).toContain(j.verdict);
    });
});

// ============================================================================
//  AND THE WAY THE GAME OFFERS TO TAKE YOUR OWN COMPANY
// ============================================================================
//
//  A treasury buyback RETIRES the shares. The player's count does not change
//  and their percentage rises anyway, because the denominator shrank. The
//  watch reads ownership going up while the price is down and cannot tell
//  that from accumulating stock - which is exactly the pattern it exists to
//  catch.
//
//  Measured on the real store: 35% to 100% in five buyouts, 69.4M of an 80M
//  treasury spent, and the share price falling from $10 to $2.06 as the cash
//  left. Rising ownership, falling price. The file opens on itself.
// ============================================================================

describe('a buyback is not an accumulation', () => {
    const { recordSuspicion } = require('./manipulation');
    const { runManipulationWatch } = require('./runManipulation');
    const { useStoryStore } = require('../store/useStoryStore');

    it('the ledger ignores the points the denominator gave you', () => {
        // Ten points of ownership, all of it from retiring shares.
        useStoryStore.setState({
            manipulationLedger: [], manipulationVerdict: null, ending: null,
        } as never);
        runManipulationWatch({
            quarter: 10, priceAtBuy: 30, referenceAtBuy: 100, priceNow: 30,
            ownershipBefore: 40, ownershipAfter: 50,
            ownershipFromBuyback: 10,
            personalWealth: 1_000_000,
        });
        expect(useStoryStore.getState().manipulationLedger).toEqual([]);
    });

    it('but a purchase alongside one still counts', () => {
        // Fifteen points, ten from the buyback and five actually bought.
        useStoryStore.setState({
            manipulationLedger: [], manipulationVerdict: null, ending: null,
        } as never);
        runManipulationWatch({
            quarter: 10, priceAtBuy: 30, referenceAtBuy: 100, priceNow: 30,
            ownershipBefore: 40, ownershipAfter: 55,
            ownershipFromBuyback: 10,
            personalWealth: 1_000_000,
        });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(1);
    });

    it('and a plain purchase is untouched', () => {
        useStoryStore.setState({
            manipulationLedger: [], manipulationVerdict: null, ending: null,
        } as never);
        runManipulationWatch({
            quarter: 10, priceAtBuy: 30, referenceAtBuy: 100, priceNow: 30,
            ownershipBefore: 40, ownershipAfter: 55,
            personalWealth: 1_000_000,
        });
        expect(useStoryStore.getState().manipulationLedger).toHaveLength(1);
    });

    it('and the rule itself is unchanged when nothing is subtracted', () => {
        expect(recordSuspicion({
            quarter: 1, price: 30, reference: 100,
            ownershipBefore: 40, ownershipAfter: 50,
        })).not.toBeNull();
    });
});
