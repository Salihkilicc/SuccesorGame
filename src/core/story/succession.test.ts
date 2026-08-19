// src/core/story/succession.test.ts
//
// ============================================================================
//  THE COMPANY STAYS AND THE PERSON CHANGES
// ============================================================================
//
//  Two files under test and they are checked for opposite things.
//
//  succession.ts is checked for what it DECIDES, which is very little on
//  purpose: it composes `successorFor` and `divideEstate`, both of which have
//  their own tests, and a second copy of "the eldest unless one was named"
//  living inside it is exactly how the two would drift apart.
//
//  runSuccession.ts is checked for what it DOES NOT TOUCH. That is the whole
//  risk. newGame.ts exists because somebody forgot a store, and the failure
//  was silent: the game opened, it ran, only the numbers were wrong. This is
//  the same operation upside down and it has the same failure available to it,
//  so the assertions that matter are the ones about the capital, the products
//  and the plant still being there afterwards.
// ============================================================================

import { planSuccession, generationName, type SuccessionInput } from './succession';
import { runSuccession } from './runSuccession';
import { HEIR_STOCK_SHARE } from './inheritance';
import { useFamilyStore, initialFamilyState } from '../store/useFamilyStore';
import { useIdentityStore } from '../store/useIdentityStore';
import { useGameStore } from '../store/useGameStore';
import { useStatsStore } from '../store/useStatsStore';
import { useStoryStore } from '../store/useStoryStore';
import { useShareholderStore } from '../../features/shareholders/stores/useShareholderStore';

const heir = (id: string, name: string, age: number) => ({
    id, name, age, gender: 'Male' as const,
});

const input = (over: Partial<SuccessionInput> = {}): SuccessionInput => ({
    children: [heir('a', 'Elena Hale', 30), heir('b', 'Marcus Hale', 26)],
    designatedSuccessorId: 'a',
    survivingParent: { name: 'Claire Hale', age: 68 },
    estate: { cash: 4_000_000, shares: 6_500_000 },
    generation: 1,
    ...over,
});

describe('the plan', () => {
    it('puts the named successor in the chair', () => {
        const plan = planSuccession(input())!;
        expect(plan.ceo.id).toBe('a');
        // First name only. The surname is the company's and does not change
        // hands, which useIdentityStore already assumed.
        expect(plan.ceo.firstName).toBe('Elena Hale');
        expect(plan.ceo.age).toBe(30);
    });

    it('and hands them their slice rather than the dead man\'s balance', () => {
        // Continuing with the previous chief executive's private fortune
        // would mean the heir inherited nothing and the siblings inherited
        // from somebody who still had it.
        const plan = planSuccession(input())!;
        expect(plan.shares).toBeCloseTo(6_500_000 * HEIR_STOCK_SHARE, -1);
        expect(plan.cash).toBeLessThan(4_000_000);
    });

    it('and seats the siblings, because a share is a seat', () => {
        const plan = planSuccession(input())!;
        expect(plan.siblings).toHaveLength(1);
        expect(plan.siblings[0].id).toBe('b');
        expect(plan.siblings[0].shares).toBeGreaterThan(0);
    });

    it('but not a sibling holding nothing', () => {
        // A director on the board with nothing to vote is a name in a list.
        const plan = planSuccession(input({ estate: { cash: 100, shares: 1 } }))!;
        expect(plan.siblings.every(s => s.shares > 0)).toBe(true);
    });

    it('and keeps the mother, who holds no stock and would otherwise vanish', () => {
        const plan = planSuccession(input())!;
        expect(plan.survivingParent?.name).toBe('Claire Hale');
        expect(plan.siblings.some(s => s.name === 'Claire Hale')).toBe(false);
    });

    it('and counts the generation on', () => {
        expect(planSuccession(input({ generation: 1 }))!.generation).toBe(2);
        expect(planSuccession(input({ generation: 4 }))!.generation).toBe(5);
    });

    it('and is null when nobody can take over', () => {
        // Not a failure. It is the diedWithoutAnHeir branch, and the closing
        // screen simply does not offer the button.
        expect(planSuccession(input({ children: [heir('a', 'A Child', 9)] }))).toBeNull();
        expect(planSuccession(input({ children: [] }))).toBeNull();
    });

    it('and does not re-decide who the heir is', () => {
        // The rule lives in mortality.ts and is asserted there. This checks
        // only that the answer is the same one, which is what stops a second
        // copy of it appearing in here.
        expect(planSuccession(input({ designatedSuccessorId: null }))!.ceo.id).toBe('a');
        expect(planSuccession(input({ designatedSuccessorId: 'b' }))!.ceo.id).toBe('b');
    });
});

describe('a generation, said out loud', () => {
    it('is a family rather than a save slot', () => {
        expect(generationName(1)).toBe('the founder');
        expect(generationName(3)).toBe('the third generation');
    });

    it('and does not run out', () => {
        expect(generationName(9)).toBe('generation 9');
        expect(generationName(0)).toBe('the founder');
    });
});

// ============================================================================
//  AND WHAT IT DOES NOT TOUCH
// ============================================================================
describe('handing the company over', () => {
    beforeEach(() => {
        useStoryStore.setState({ ending: 'diedInOffice' } as never);
        useGameStore.setState({ age: 81 } as never);
        useStatsStore.setState({
            money: 4_000_000,
            companyCapital: 900_000_000,
            companyValue: 2_000_000_000,
            employeeCount: 1_400,
            facilityTier: 4,
        } as never);
        useShareholderStore.setState({ playerShareCount: 6_500_000, members: [] } as never);
        useIdentityStore.setState({ firstName: 'John', lastName: 'Hale', gender: 'male' } as never);
        useFamilyStore.setState({
            ...initialFamilyState,
            _hasHydrated: true,
            children: [
                { id: 'a', name: 'Elena Hale', age: 30, gender: 'Female', stats: {} },
                { id: 'b', name: 'Marcus Hale', age: 26, gender: 'Male', stats: {} },
            ],
            designatedSuccessorId: 'a',
            partner: { id: 'p', name: 'Claire Hale', stats: { age: 68 } },
            familyReputation: 71,
        } as never);
    });

    it('leaves the company exactly where it was', () => {
        // THE POINT OF CONTINUING. Handing the heir a clean company would be
        // a new game with a different name on it; they inherit a going
        // concern with its problems attached.
        runSuccession();
        const stats = useStatsStore.getState() as any;
        expect(stats.companyCapital).toBe(900_000_000);
        expect(stats.companyValue).toBe(2_000_000_000);
        expect(stats.employeeCount).toBe(1_400);
        expect(stats.facilityTier).toBe(4);
    });

    it('and makes you somebody else', () => {
        runSuccession();
        expect(useIdentityStore.getState().firstName).toBe('Elena Hale');
        expect(useIdentityStore.getState().gender).toBe('female');
        expect(useGameStore.getState().age).toBe(30);
    });

    it('while the name on the building does not change hands', () => {
        runSuccession();
        expect(useIdentityStore.getState().lastName).toBe('Hale');
    });

    it('and gives you what you inherited, which is less than he had', () => {
        runSuccession();
        expect((useStatsStore.getState() as any).money).toBeLessThan(4_000_000);
        expect(useShareholderStore.getState().playerShareCount)
            .toBeLessThan(6_500_000);
    });

    it('and puts your brother on your board', () => {
        // Twenty years of messages about the annual report, arriving as a
        // vote in the company he now has to watch his sister run.
        runSuccession();
        const members = useShareholderStore.getState().members;
        expect(members.some(m => m.name === 'Marcus Hale')).toBe(true);
        expect(members.find(m => m.name === 'Marcus Hale')?.shareCount)
            .toBeGreaterThan(0);
    });

    it('and gives you a family one generation along', () => {
        runSuccession();
        const family = useFamilyStore.getState();
        expect(family.generation).toBe(2);
        expect(family.children).toEqual([]);
        expect(family.partner).toBeNull();
        expect(family.designatedSuccessorId).toBeNull();
        // She holds no stock, so without this she would cease to exist at
        // the moment she became the most interesting person in the family.
        expect(family.survivingParent?.name).toBe('Claire Hale');
    });

    it('while the family standing carries, because it is the family\'s', () => {
        runSuccession();
        expect(useFamilyStore.getState().familyReputation).toBe(71);
    });

    it('and the game is no longer over', () => {
        runSuccession();
        expect(useStoryStore.getState().ending).toBeNull();
    });

    it('and there is nothing to hand over when nobody is of age', () => {
        useFamilyStore.setState({
            children: [{ id: 'a', name: 'A Child', age: 9, gender: 'Male', stats: {} }],
            designatedSuccessorId: null,
        } as never);
        expect(runSuccession()).toBeNull();
        // And crucially the run is still over, rather than continuing with
        // nobody in the chair.
        expect(useStoryStore.getState().ending).toBe('diedInOffice');
    });
});
