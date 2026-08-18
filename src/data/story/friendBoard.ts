// src/data/story/friendBoard.ts
//
// ============================================================================
//  THE LAST THING IN HIS ARC, AND THE ONLY WARM ONE IN THE ENDGAME
// ============================================================================
//
//  Everything else that reaches this point of a campaign is a letter from
//  somebody who wants something: an incumbent, a fund, a regulator, a rival.
//  This is the one scene where the player is the one offering, and where the
//  correct answer costs them something and is obviously right anyway.
//
//  ---------------------------------------------------------------------------
//  WHEN IT ARRIVES, AND WHY IT IS SO LATE
//  ---------------------------------------------------------------------------
//  Quarter forty, Planora bought, and him still fond of you. Late because a
//  board seat handed over in year three is a transaction; the same seat after
//  ten years of him bringing you rumours, asking for two hundred thousand
//  dollars, and selling you his company at eighty per cent is a different
//  object entirely.
//
//  It is also the only scene in the game the player can reach ONLY by having
//  been decent for a decade: he had to have been helped, he had to have grown,
//  he had to have sold you the company, and the dial has to be at the top.
//
//  ---------------------------------------------------------------------------
//  ONE PER CENT, AND HE HAS TO BE TOLD WHAT THAT MEANS
//  ---------------------------------------------------------------------------
//  A per cent of a company this size is more money than he has ever had, and
//  the scene's whole difficulty is that he does not want it - he thinks he is
//  being paid for something. The second card is the player explaining that a
//  seat without shares is a favour and a seat with them is a vote.
//
//  He is a Visionary with `rnd` as his pet issue (see data/market/founders.ts),
//  which means taking him on is not free: he will ask about research every
//  quarter for the rest of the game, and he will vote.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

/**
 * One per cent.
 *
 * Inside the band `directorFromAcquisition` uses for everybody else
 * (SEAT_MIN_STAKE 0.5%, SEAT_MAX_STAKE 3%), so this is a real seat on the same
 * cap table rather than a decoration - he votes with it, and the sink clamps
 * to the same band so a scene cannot invent a larger one.
 */
export const FRIEND_STAKE = 0.02;

const WHEN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    // Reached in year 8+ once Planora is acquired and friendship is top tier.
    { kind: 'quarterAtLeast', quarter: 32 },
    // You own his company - which means he sold it to you, which is its own
    // small tragedy and the reason this scene has to exist.
    { kind: 'owns', company: 'tech_planora' },
    // Ten years of it. The top band, not merely warm.
    { kind: 'dialAtLeast', dial: 'friendLoyalty', band: 'extreme' },
    { kind: 'flag', flag: 'friendGrewUp' },
    { kind: 'noFlag', flag: 'friendRefused' },
    { kind: 'noFlag', flag: 'friendOnBoard' },
];

export const friendBoardSeat: Conversation = {
    id: 'event-friend-board-seat',
    channel: 'message',
    from: 'friend',
    when: WHEN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'friend',
            text: 'your assistant scheduled a "board induction" on my calendar. is this genuine or an error?',
            choices: [
                { text: 'It is real. I want you on the board.', next: 'why' },
                { text: 'Wrong person. Sorry.', next: 'wrongPerson' },
            ],
        },

        {
            id: 'wrongPerson',
            speaker: 'friend',
            text: 'no worries at all. thought it sounded like a mixup.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [],
                },
                { text: 'No, it was not a mistake.', next: 'why' },
            ],
        },

        {
            id: 'why',
            speaker: 'friend',
            text: 'genuinely asking: what is my role? if it is just giving feedback, we already do that as friends.',
            choices: [
                { text: 'The job is challenging decisions constructively.', next: 'stake' },
                { text: 'Because you have always given candid advice.', next: 'stake' },
            ],
        },

        {
            id: 'stake',
            speaker: 'friend',
            text: 'the pack mentions a two per cent equity grant. that is significant value for a board seat.',
            choices: [
                { text: 'A seat with shares represents real governance.', next: 'accept' },
                { text: 'Standard alignment for directors.', next: 'accept' },
            ],
        },

        {
            id: 'accept',
            speaker: 'friend',
            text: 'in that case, yes. i will accept and be difficult about research spending on the board.',
            choices: [
                {
                    text: 'Glad to have you aboard.',
                    effects: [
                        { kind: 'boardSeat', person: 'tech_planora', stake: FRIEND_STAKE },
                        { kind: 'flag', flag: 'friendOnBoard' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 10 },
                        {
                            kind: 'news',
                            headline: 'Hale adds the founder of Planora to its board. He holds two per cent.',
                        },
                    ],
                },
                {
                    text: 'Take time to review the formal pack.',
                    effects: [
                        { kind: 'boardSeat', person: 'tech_planora', stake: FRIEND_STAKE },
                        { kind: 'flag', flag: 'friendOnBoard' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 6 },
                        {
                            kind: 'news',
                            headline: 'Hale adds the founder of Planora to its board. He holds two per cent.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const friendBoardSeatEvent: GameEvent = {
    id: 'friend-board-seat',
    when: WHEN,
    // High, because reaching the gate at all took ten years of decisions and
    // the scene should not then be withheld by a die.
    chance: 0.85,
    conversation: friendBoardSeat,
    headline: 'Hale is understood to be adding a director.',
    priority: 2,
};
