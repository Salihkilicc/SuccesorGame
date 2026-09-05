// src/core/story/runSuccessionIdentity.test.ts
//
// ============================================================================
//  WHAT THE HANDOVER WRITES DOWN ABOUT THE NEW CHIEF EXECUTIVE
// ============================================================================
//
//  succession.ts is well tested; runSuccession.ts, the half that writes to
//  the stores, had no test file at all. That gap was measured rather than
//  assumed: `ceoId: plan.ceo.id` was deleted from the handover and all 494
//  tests in this area stayed green.
//
//  So a screen could be built on that field, work perfectly, and lose its
//  data to an unrelated edit with nothing going red - which is the exact
//  shape of failure that left 299 portraits unread for months.
//
//  This covers the identity handover only. The money, the shares and the
//  board are somebody else's test to write.
// ============================================================================

import { runSuccession } from './runSuccession';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStatsStore } from '../store/useStatsStore';
import { useIdentityStore, initialIdentityState } from '../store/useIdentityStore';

/** A family with two children, the elder designated. */
const seed = (over: Partial<Record<string, unknown>> = {}) => {
    useIdentityStore.setState({
        ...initialIdentityState,
        firstName: 'Salih', lastName: 'Hale', ownFirstName: 'Salih',
        gender: 'male', created: true,
    });
    useFamilyStore.setState({
        children: [
            {
                id: 'child-elena', name: 'Elena Hale', age: 28, gender: 'Female',
                educationLevel: 'University', relationshipWithPlayer: 70,
                role: 'Executive', legitimate: true,
                stats: { intelligence: 70, charisma: 60, ambition: 80, discipline: 65 },
            },
            {
                id: 'child-marcus', name: 'Marcus Hale', age: 24, gender: 'Male',
                educationLevel: 'University', relationshipWithPlayer: 50,
                role: 'Student', legitimate: true,
                stats: { intelligence: 60, charisma: 50, ambition: 55, discipline: 50 },
            },
        ],
        designatedSuccessorId: 'child-elena',
        ...over,
    } as never);
};

describe('the handover records WHICH child took the chair', () => {
    beforeEach(() => {
        seed();
        useStatsStore.setState({ money: 1_000_000 } as never);
    });

    afterEach(() => {
        useIdentityStore.setState(initialIdentityState);
    });

    it('the id, not only the first name', () => {
        // Two daughters of the same age are the same person to every screen
        // if only the name is kept. The id is what a portrait hangs on.
        const plan = runSuccession();
        expect(plan).not.toBeNull();
        expect(useIdentityStore.getState().ceoId).toBe(plan!.ceo.id);
        expect(useIdentityStore.getState().ceoId).toBe('child-elena');
    });

    it('and the name and gender describe the same person as the id', () => {
        // If these three ever disagree the header shows one person's face
        // above another person's name.
        const plan = runSuccession();
        const me = useIdentityStore.getState();
        expect(me.firstName).toBe('Elena');
        expect(me.gender).toBe('female');
        expect(me.ceoId).toBe(plan!.ceo.id);
    });

    it('and the founder had no id before it', () => {
        expect(initialIdentityState.ceoId).toBeUndefined();
    });

    it('and a second handover moves it on to the next heir', () => {
        runSuccession();
        expect(useIdentityStore.getState().ceoId).toBe('child-elena');

        // Elena is now the one in the chair; her sibling is what is left.
        useFamilyStore.setState({
            children: [{
                id: 'child-marcus', name: 'Marcus Hale', age: 40, gender: 'Male',
                educationLevel: 'University', relationshipWithPlayer: 50,
                role: 'Executive', legitimate: true,
                stats: { intelligence: 60, charisma: 50, ambition: 55, discipline: 50 },
            }],
            designatedSuccessorId: 'child-marcus',
        } as never);

        runSuccession();
        const me = useIdentityStore.getState();
        expect(me.ceoId).toBe('child-marcus');
        expect(me.firstName).toBe('Marcus');
        expect(me.gender).toBe('male');
    });

    it('and the player own name is left alone, so a new game can restore it', () => {
        runSuccession();
        expect(useIdentityStore.getState().ownFirstName).toBe('Salih');
    });
});
