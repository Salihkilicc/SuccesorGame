// src/data/events/recall.ts
//
// ============================================================================
//  THE BATCH — a quality failure you find out about from outside
// ============================================================================
//
//  TRIGGER. Only once you are big enough to be worth writing about: a real
//  company, a real quarter of production behind you. The COO brings it, not
//  the CFO, because this is an operations failure and it matters that the
//  person who owns the problem is the person telling you about it.
//
//  WHAT IT IS ABOUT. There is no innocent branch. The fault is real; the only
//  question is whether you say so first. Announcing costs money now and buys
//  back reputation; waiting costs nothing this quarter and costs more later.
//  That is the actual shape of every product recall that has ever happened,
//  and it is the reason this is the first event written rather than a
//  supplier price rise: it is a decision, not a number.
//
//  THE REPUTATION EFFECT IS THE POINT. `brand` now runs through
//  applyCorporateShock, so a hit here travels down into every category you
//  operate in, weighted - it costs you most where your name counted for most.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

const RECALL_COST = 900_000;

export const recallConversation: Conversation = {
    id: 'event-recall',
    channel: 'message',
    from: 'coo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'We have a bad batch. Not a rumour — I have the returns in front of me and the failure rate is about one in forty. It is a supplier part, which does not help us, because our name is on the box.',
            choices: [
                { text: 'How many are out there?', next: 'scale' },
                { text: 'Can we quietly fix it in the next run?', next: 'quiet' },
            ],
        },

        {
            id: 'scale',
            speaker: 'coo',
            text: 'Eleven thousand units, give or take. A recall runs us the better part of a million and we would be announcing it ourselves, this week. The alternative is that someone else announces it in about two months.',
            choices: [
                { text: 'Announce it. This week.', next: 'announced' },
                { text: 'Two months is two months.', next: 'buried' },
            ],
        },

        {
            id: 'quiet',
            speaker: 'coo',
            text: 'We can. We would also be selling eleven thousand units we know are faulty while we do it. I will do it if you tell me to — I would like it in writing.',
            choices: [
                {
                    text: 'Then we announce.',
                    next: 'announced',
                    // He asked for it in writing and you did not need to be
                    // asked twice. That is the whole trust gain.
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 3 }],
                },
                { text: 'Nothing in writing. Fix it in the run.', next: 'buried' },
            ],
        },

        {
            id: 'announced',
            speaker: 'coo',
            text: 'Then I will have it out by Thursday. We will take a beating for a fortnight and it will be a smaller one than the alternative. I will send you the numbers when I have them.',
            choices: [
                {
                    text: 'Do it.',
                    effects: [
                        { kind: 'capital', amount: -RECALL_COST },
                        // Smaller than the buried branch, and it is the
                        // difference that is the lesson rather than the sign.
                        { kind: 'brand', amount: -4 },
                        { kind: 'dial', dial: 'publicReputation', delta: 4 },
                        {
                            kind: 'news',
                            headline: 'Voluntary recall announced. Analysts call the disclosure "unusually fast".',
                        },
                    ],
                },
            ],
        },

        {
            id: 'buried',
            speaker: 'coo',
            // No choices. He has said what he is going to say.
            text: 'Understood. For the record, I think this is the expensive option and we will not find out why for about two months.',
        },
    ],
};

export const recallEvent: GameEvent = {
    id: 'recall',
    when: [
        { kind: 'quarterAtLeast', quarter: 5 },
        // You need something to recall. Capital is the cheapest available
        // proxy for "this is a real manufacturer now" - the condition
        // vocabulary has no unit count, and inventing one for a single event
        // would be worse than using a coarse gate honestly.
        { kind: 'capitalAtLeast', amount: 5_000_000 },
    ],
    chance: 0.12,
    // Twelve quarters. It can happen twice in a long career; it should not be
    // a thing that happens to you every other year.
    cooldown: 12,
    conversation: recallConversation,
    headline: 'Reports of a defect rate in a recent production batch.',
};
