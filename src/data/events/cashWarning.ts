// src/data/events/cashWarning.ts
//
// ============================================================================
//  THE CFO NOTICES BEFORE YOU DO
// ============================================================================
//
//  An event rather than a scheduled beat, because it is not a moment in the
//  story - it is a thing that happens whenever the money gets low, which might
//  be quarter six or might be never.
//
//  IT IS THE ARC'S ENGINE. The dividend crisis and the Braga thread are the
//  memorable scenes, but they fire once each. This is the one that can fire
//  four times across a campaign, and it is where cfoTrust actually moves in
//  the quantities that decide whether he ever opens up or eventually leaves.
//  An arc whose dial only moves in set-pieces is an arc the player experiences
//  as scripted; one that moves every time they brush him off is a relationship.
//
//  HE IS RIGHT, and that has to stay true even when it is inconvenient. The
//  trigger is a real number - capital below the threshold - so a player who
//  dismisses him is dismissing an accurate warning about their own balance
//  sheet. If the warning were sometimes noise, ignoring it would be reasonable
//  and the dial movement would be unfair.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { GameEvent } from '../../core/events/types';

/** Low enough to be frightening, high enough to still be fixable. */
const THRESHOLD = 2_000_000;

export const cashWarningConversation: Conversation = {
    id: 'event-cash-warning',
    channel: 'message',
    from: 'cfo',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'I would like to be boring at you for a moment.\n\nAt the current burn we have between two and three quarters of cash. Not a crisis. The quarter to fix it is this one, because the options at two quarters are all worse than the options at three.',
            choices: [
                { text: 'What are the options?', next: 'options' },
                { text: 'We have been lower.', next: 'beenLower' },
            ],
        },

        {
            id: 'beenLower',
            speaker: 'cfo',
            // He does not fight. He agrees, and files it - which is what he
            // does every time and what makes the eleventh time land.
            text: 'We have. Twice, and both times somebody paid late and it came right on its own.\n\nI am noting it rather than arguing about it. That is all this message was.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: -6 }],
                },
                { text: 'Go on, then. Options.', next: 'options' },
            ],
        },

        {
            id: 'options',
            speaker: 'cfo',
            text: 'Three, and none of them are clever.\n\nBuild less for a quarter and let the shelf empty. Borrow while the numbers still look like this. Or do nothing and find out, which is a real option and I am not being sarcastic — sometimes the invoice arrives.',
            choices: [
                { text: 'Which would you do?', next: 'whichWould' },
                { text: 'I will handle it.', next: 'handleIt' },
            ],
        },

        {
            id: 'whichWould',
            speaker: 'cfo',
            // Asking him is always rewarded, and the reward is a real opinion
            // rather than a hedge. This is the behaviour the arc is teaching.
            text: 'Borrow. This quarter, at this credit rating, for more than we need.\n\nThe cheapest money in this company\'s history is available in the quarter before you need any, and it stops being available in exactly the quarter you do.',
            choices: [
                {
                    text: 'Then that is what we do.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 8 }],
                },
                {
                    text: 'I would rather not owe anybody.',
                    effects: [
                        // A defensible answer that still costs a little,
                        // because he was asked and then overruled.
                        { kind: 'dial', dial: 'cfoTrust', delta: -2 },
                    ],
                },
            ],
        },

        {
            id: 'handleIt',
            speaker: 'cfo',
            text: 'Of course.\n\nI will put the three options in a note and you will have it by Thursday, in case it is useful.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: -4 }],
                },
                {
                    text: 'Send the note. I will read it.',
                    effects: [{ kind: 'dial', dial: 'cfoTrust', delta: 4 }],
                },
            ],
        },
    ],
};

export const cashWarningEvent: GameEvent = {
    id: 'cash-warning',
    when: [
        { kind: 'flag', flag: 'fatherDead' },
        { kind: 'noFlag', flag: 'cfoResigned' },
        // The real trigger. He is not being pessimistic; the number is the
        // number, which is what makes dismissing him a decision rather than
        // a reasonable response to noise.
        { kind: 'capitalAtMost', amount: THRESHOLD },
    ],
    chance: 0.85,
    // Often enough to be the arc's engine, not so often it becomes weather.
    cooldown: 6,
    conversation: cashWarningConversation,
    headline: 'Analysts note a tightening cash position at Hale.',
    // The highest priority in the pool, and the ordering is by how much the
    // player must act THIS quarter rather than by how important the news is.
    // Your brother having lunch with the buyer matters more in the long run
    // and can wait a quarter; being three quarters from empty cannot.
    priority: 5,
};
