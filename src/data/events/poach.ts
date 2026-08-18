// src/data/events/poach.ts
//
// ============================================================================
//  PEAR TAKES YOUR PEOPLE
// ============================================================================
//
//  TRIGGER. Hostility above `low` — he does not bother with you until you are
//  worth bothering with. This is the first thing he does, long before he makes
//  an offer for the company, and it is deliberately the smallest possible
//  version of him: no letter, no threat, just your CTO forwarding a number.
//
//  WHY THE CTO BRINGS IT. Because she is the one being bought, and the scene
//  only works if she tells you herself. She is not asking for a raise; she is
//  telling you what happened and watching what you do. There is a branch where
//  you insult her.
//
//  NO CORRECT ANSWER. Matching costs cash you may not have and teaches your
//  people that leaving is how you get paid. Not matching is honest and may
//  cost you her. Pear wins something either way, which is the characterisation.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

const COUNTER_OFFER = 400_000;

export const poachConversation: Conversation = {
    id: 'event-poach',
    channel: 'message',
    from: 'cto',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Pear made offers to four of my engineers this week. Not the junior ones. I am telling you rather than negotiating with you, so please do not treat this as a negotiation.',
            choices: [
                { text: 'What did they offer?', next: 'number' },
                { text: 'What do you want to do?', next: 'asked' },
            ],
        },

        {
            id: 'number',
            speaker: 'cto',
            text: 'Sixty percent over what we pay, and the work is duller. Two of them are going to take it anyway, because sixty percent is sixty percent and nobody has ever been paid in interesting work.',
            choices: [
                { text: 'Match it for the two.', next: 'matched', when: [{ kind: 'capitalAtLeast', amount: COUNTER_OFFER }] },
                { text: 'Let them go.', next: 'released' },
            ],
        },

        {
            id: 'asked',
            speaker: 'cto',
            // Asking her first costs nothing and she notices. This is the
            // branch where the same two answers are still available - the
            // reward for asking is information, not a discount.
            text: 'I want to keep two of them and I do not much mind about the other two. I also want to know that if I say that out loud, it does not end up being about my loyalty.',
            choices: [
                { text: 'It does not. Match the two.', next: 'matched', when: [{ kind: 'capitalAtLeast', amount: COUNTER_OFFER }] },
                { text: 'We cannot pay Pear money. I am sorry.', next: 'released' },
            ],
        },

        {
            id: 'matched',
            speaker: 'cto',
            text: 'Then they stay, and by Christmas everyone here will know that the way to get paid is to take a call from Pear. I am not saying it was the wrong call. I am saying it has a bill attached that does not arrive this quarter.',
            choices: [
                {
                    text: 'I know.',
                    effects: [
                        { kind: 'capital', amount: -COUNTER_OFFER },
                        { kind: 'dial', dial: 'pearHostility', delta: 5 },
                        {
                            kind: 'news',
                            headline: 'Senior engineers stay put after a counter-offer. Recruiters describe the market as "hot".',
                        },
                    ],
                },
            ],
        },

        {
            id: 'released',
            speaker: 'cto',
            text: 'Fine. Honestly, fine. I would rather be told no than be told yes by someone who cannot afford it. Research slows down for two quarters and then we are level again.',
            choices: [
                {
                    text: 'Thank you.',
                    effects: [
                        { kind: 'dial', dial: 'pearHostility', delta: 8 },
                        // He got four engineers for nothing and learned you
                        // will not fight for them.
                        { kind: 'brand', amount: -2 },
                        { kind: 'researchers', amount: -2 },
                        {
                            kind: 'news',
                            headline: 'Pear confirms four senior engineering hires from a competitor.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const poachEvent: GameEvent = {
    id: 'poach',
    when: [
        { kind: 'quarterAtLeast', quarter: 20 },
        { kind: 'dialAtLeast', dial: 'pearHostility', band: 'low' },
    ],
    chance: 0.18,
    cooldown: 8,
    conversation: poachConversation,
    headline: 'Recruiters circling the sector. Pear is said to be hiring aggressively.',
    // Above the recall: when both are possible in the same quarter, the one
    // that moves the Pear relationship is the one that matters to the spine.
    priority: 1,
};
