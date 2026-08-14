// src/core/story/binning.test.ts
//
// ============================================================================
//  WHAT THROWING A ROW AWAY IS ALLOWED TO COST
// ============================================================================
//
//  The swipe was built so the player could clear the clutter: a sponsorship
//  offer nobody wants, a conversation that has been played out. That is the
//  case it was designed for and it works.
//
//  Two rows in those lists are not clutter, and in a list they look exactly
//  like the ones that are.
//
//    A BOARD WAITING FOR AN ANSWER. The offer stays `open` in the negotiation
//    store and `send` refuses a second approach while one is open - so binning
//    the reply locks that company out of the game FOR EVER, with the reason
//    living in a store the player has no way to see. This is the one that
//    matters: it is not the letter being lost, it is a mechanic quietly
//    closing.
//
//    AN UNPLAYED SCENE. Marked seen the moment it was delivered, so deleting
//    the row is the only way in this game to lose a piece of the story
//    permanently and silently.
//
//  Neither is prevented. It is the player's phone, and a delete that argues
//  with you is worse than one that tells you. Both are said out loud, and the
//  negotiation is cleaned up rather than stranded.
// ============================================================================

import { useNegotiationStore, initialNegotiationState } from '../store/useNegotiationStore';
import { useMailStore, initialMailState } from '../store/useMailStore';
import { useMessageStore, initialMessageState } from '../store/useMessageStore';

const OFFER = {
    id: 'offer-1', targetId: 'medidevice', targetName: 'MediDevice',
    subject: 'purchase' as const, sentQuarter: 1, status: 'open' as const,
    score: 0.1, risk: 'Medium' as const, marketCap: 1_000_000_000,
    reply: { kind: 'accept' as const },
};

beforeEach(() => {
    useNegotiationStore.setState({
        ...initialNegotiationState, offers: [OFFER as never], _hasHydrated: true,
    });
    useMailStore.setState({ ...initialMailState, inbox: [] });
    useMessageStore.setState({ ...initialMessageState });
});

describe('a company that is waiting on you', () => {
    it('cannot be written to twice while the first letter is open', () => {
        // The rule that makes binning the reply dangerous. Stated here so the
        // reason the screen withdraws is visible from the test rather than
        // only from a comment on the screen.
        const r = useNegotiationStore.getState().send({
            targetId: 'medidevice', targetName: 'MediDevice', subject: 'purchase',
            marketCap: 1e9, risk: 'Medium', acquirerValuation: 1e9, quarter: 4,
        });
        expect(r.ok).toBe(false);
    });

    it('so withdrawing is what throwing their reply away has to mean', () => {
        useNegotiationStore.getState().withdraw('offer-1');
        expect(useNegotiationStore.getState().offers[0].status).toBe('closed');
    });

    it('and then they can be approached again', () => {
        // The assertion that makes the whole guard worth having: without the
        // withdrawal this company is gone from the game and nothing says so.
        useNegotiationStore.getState().withdraw('offer-1');
        const r = useNegotiationStore.getState().send({
            targetId: 'medidevice', targetName: 'MediDevice', subject: 'purchase',
            marketCap: 1e9, risk: 'Medium', acquirerValuation: 1e9, quarter: 4,
        });
        expect(r.ok).toBe(true);
    });

    it('while a board that asked you not to write again still means it', () => {
        // Withdrawing is not an undo. A refusal that closed the company off
        // stays closed, or the swipe becomes a way of laundering a no.
        useNegotiationStore.setState({ closedForever: { medidevice: true } });
        const r = useNegotiationStore.getState().send({
            targetId: 'medidevice', targetName: 'MediDevice', subject: 'purchase',
            marketCap: 1e9, risk: 'Medium', acquirerValuation: 1e9, quarter: 9,
        });
        expect(r.ok).toBe(false);
    });
});

describe('the deletes themselves', () => {
    it('a letter goes and takes nothing else with it', () => {
        useMailStore.setState({
            inbox: [
                { id: 'a', fromName: 'X', fromEmail: 'x@x', subject: 'A', body: '', atMonth: 1, isRead: false, category: 'Primary' },
                { id: 'b', fromName: 'Y', fromEmail: 'y@y', subject: 'B', body: '', atMonth: 1, isRead: false, category: 'Primary' },
            ] as never,
        });
        useMailStore.getState().deleteMail('a');
        expect(useMailStore.getState().inbox.map(m => m.id)).toEqual(['b']);
    });

    it('and a thread goes without touching the others', () => {
        useMessageStore.setState({
            threads: [
                { id: 'cfo', name: 'A', role: 'r', initials: 'A', unread: 0, messages: [] },
                { id: 'coo', name: 'B', role: 'r', initials: 'B', unread: 0, messages: [] },
            ] as never,
        });
        useMessageStore.getState().removeThread('cfo');
        expect(useMessageStore.getState().threads.map(t => t.id)).toEqual(['coo']);
    });

    it('and deleting something that is not there changes nothing', () => {
        // The gesture animates the row off the edge and THEN calls the store,
        // so a second release during the animation is reachable.
        useMailStore.setState({ inbox: [] });
        expect(() => useMailStore.getState().deleteMail('gone')).not.toThrow();
        expect(useMailStore.getState().inbox).toEqual([]);
    });
});
