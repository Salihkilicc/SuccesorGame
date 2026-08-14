// src/data/events/shortSeller.ts
//
// ============================================================================
//  SOMEBODY IS BETTING AGAINST YOU IN PUBLIC
// ============================================================================
//
//  TRIGGER. Quarter twelve and a company worth having an opinion about. This
//  is the event that makes being big feel different from being small: nobody
//  writes a report about a company nobody has heard of.
//
//  IT IS THE VULTURE, AND HE IS NOT WRONG. The report is accurate. That is
//  what makes the scene work - the temptation is to write a short-seller as a
//  liar so the player can righteously ignore him, and then there is no
//  decision. He has read your filings properly. The question is what you say
//  to people who have also read them.
//
//  ONE BRANCH COSTS NOTHING AND IS STILL THE WORST ONE. Saying nothing is
//  free this quarter. It is also how the market learns that your silence
//  means yes.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

export const shortSellerConversation: Conversation = {
    id: 'event-short-seller',
    channel: 'mail',
    from: 'vulture',
    subject: 'Courtesy copy, publishing Tuesday',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'vulture',
            text: 'We are publishing a short thesis on your company on Tuesday. Forty pages. As a courtesy, here is the summary: we think your reported margins depend on inventory you are not selling, and we think you know that.\n\nWe are not asking for a comment. We are telling you it exists.',
            choices: [
                { text: 'Have the CFO answer it, line by line.', next: 'rebutted' },
                { text: 'Say nothing.', next: 'silent' },
            ],
        },

        {
            id: 'rebutted',
            speaker: 'vulture',
            // He answers the rebuttal himself, which is the point: it lands,
            // and he is unbothered, and both of those are true at once.
            text: 'Your finance director published a response before we published the report. That is a first, and it is a good one, half the desks now have your numbers next to ours.\n\nWe still think we are right. But we have stopped being the only voice.',
            choices: [
                {
                    text: 'We will see on Tuesday.',
                    effects: [
                        { kind: 'dial', dial: 'cfoTrust', delta: 5 },
                        { kind: 'dial', dial: 'publicReputation', delta: 3 },
                        { kind: 'brand', amount: -3 },
                        {
                            kind: 'news',
                            headline: 'Short thesis published, and rebutted the same morning. The stock ends the day roughly flat.',
                        },
                    ],
                },
            ],
        },

        {
            id: 'silent',
            speaker: 'vulture',
            text: 'Noted. For what it is worth, silence is the response we hope for. It is not read as confidence.',
            choices: [
                {
                    text: '(no reply)',
                    effects: [
                        { kind: 'dial', dial: 'publicReputation', delta: -8 },
                        { kind: 'dial', dial: 'cfoTrust', delta: -4 },
                        // Roughly three times the rebutted branch. The gap is
                        // the whole lesson and it should be legible from the
                        // brand number alone.
                        { kind: 'brand', amount: -9 },
                        {
                            kind: 'news',
                            headline: 'Short thesis published. The company declined to comment.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const shortSellerEvent: GameEvent = {
    id: 'short-seller',
    when: [
        { kind: 'quarterAtLeast', quarter: 12 },
        { kind: 'capitalAtLeast', amount: 25_000_000 },
    ],
    chance: 0.10,
    cooldown: 16,
    conversation: shortSellerConversation,
    headline: 'A special situations fund is said to be circulating a short thesis.',
    priority: 2,
};
