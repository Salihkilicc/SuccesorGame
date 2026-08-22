// src/core/story/redelivery.test.ts
//
// ============================================================================
//  A LETTER THAT ARRIVES AGAIN ARRIVES WHOLE
// ============================================================================
//
//  "Bitmis mailler tekrar geliyor ve de sadece son kismi kaliyor."
//
//  Two separate faults reported as one sentence, and both come from the same
//  place: `sceneProgress` is keyed by CONVERSATION, while a conversation can
//  be delivered more than once.
//
//    THE MAIL SCREEN NEVER CLOSED ANYTHING. The messages screen has appended
//    the transcript and detached the conversation since it was written; the
//    mail screen called `navigation.goBack()`. So an answered letter kept its
//    `conversationId` and its saved progress, and re-opening it put the runner
//    back at a null node - which renders as the last exchange and a Close
//    button. The letter turns into a stub of itself.
//
//    AND THE NEXT COPY READ THE SAME RECORD. Events with a `cooldown` fire
//    again. A letter that genuinely arrives fresh, eight quarters later,
//    opened on its own ending.
//
//  The tests are about the two properties rather than about either mechanism,
//  because there are now two guards - the screen closes it, and `deliver`
//  clears it - and either one going quiet should fail something.
// ============================================================================

import { deliver } from './deliver';
import { useStoryStore, initialStoryState } from '../store/useStoryStore';
import { useMailStore } from '../store/useMailStore';
import { useGameStore } from '../store/useGameStore';

/** A mail scene that a repeatable event owns, so redelivery is a real case. */
const SCENE = 'event-cfo-treasury-yield';

const fresh = () => {
    useStoryStore.setState({ ...initialStoryState });
    useMailStore.setState({ inbox: [], _hasHydrated: true } as never);
    useGameStore.setState({ currentMonth: 40 } as never);
};

describe('when the same scene is delivered twice', () => {
    beforeEach(fresh);

    it('the second copy does not open on the first one\'s ending', () => {
        deliver(SCENE);
        // The player answers it. `finish()` records a null node and nothing
        // else does.
        useStoryStore.getState().saveScene(SCENE, { nodeId: null, history: [] });

        useGameStore.setState({ currentMonth: 64 } as never);
        deliver(SCENE);

        expect(useStoryStore.getState().sceneProgress[SCENE]).toBeUndefined();
    });

    it('and both letters are in the inbox, because both were sent', () => {
        deliver(SCENE);
        deliver(SCENE);
        const carrying = useMailStore.getState().inbox
            .filter(m => m.conversationId === SCENE);
        expect(carrying).toHaveLength(2);
    });
});

describe('and when one is answered', () => {
    beforeEach(fresh);

    it('it stops being playable', () => {
        deliver(SCENE);
        const mail = useMailStore.getState().inbox[0];
        useMailStore.getState().closeConversation(mail.id, [
            { from: 'them', text: 'The reserve position.' },
            { from: 'player', text: 'Reinvest it.' },
        ]);
        expect(useMailStore.getState().inbox[0].conversationId).toBeUndefined();
    });

    it('and becomes a record of what was said', () => {
        // Rather than a stub. This is what the messages screen has always
        // done with `appendTranscript`, and what the mail screen did not.
        deliver(SCENE);
        const mail = useMailStore.getState().inbox[0];
        const opening = mail.body;

        useMailStore.getState().closeConversation(mail.id, [
            { from: 'them', text: opening },
            { from: 'player', text: 'Reinvest it.' },
            { from: 'them', text: 'Then I will move it on Monday.' },
        ]);

        const after = useMailStore.getState().inbox[0];
        expect(after.body).toContain('Reinvest it.');
        expect(after.body).toContain('Then I will move it on Monday.');
        expect(after.isRead).toBe(true);
        // The opening is the body already, so it is not printed twice.
        expect(after.body.indexOf(opening)).toBe(after.body.lastIndexOf(opening));
    });

    it('while a letter answered with nothing said is left as it was', () => {
        deliver(SCENE);
        const mail = useMailStore.getState().inbox[0];
        const before = mail.body;
        useMailStore.getState().closeConversation(mail.id, [
            { from: 'them', text: before },
        ]);
        expect(useMailStore.getState().inbox[0].body).toBe(before);
    });
});
