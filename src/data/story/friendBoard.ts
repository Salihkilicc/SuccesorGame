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
export const FRIEND_STAKE = 0.01;

const WHEN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    // Late. A seat handed over in year three is a transaction.
    { kind: 'quarterAtLeast', quarter: 40 },
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
            // He opens by making it small, because he assumes it is small.
            text: 'your assistant put something in my calendar called "board induction" and i have been staring at it for twenty minutes\n\nis this a real thing or did somebody click the wrong person',
            choices: [
                { text: 'It is real. I want you on the board.', next: 'why' },
                { text: 'Wrong person. Sorry.', next: 'wrongPerson' },
            ],
        },

        {
            id: 'wrongPerson',
            speaker: 'friend',
            // The door does not slam. It just does not open, and he is fine,
            // and that is worse than if he minded.
            text: 'ha ok. i did think it was a lot\n\nno bother at all. tell whoever it was i said hi',
            choices: [
                {
                    text: '(leave it)',
                    // No dial movement. He is not hurt and pretending he is
                    // would be the game telling the player how to feel.
                    effects: [],
                },
                { text: 'No. It was not a mistake.', next: 'why' },
            ],
        },

        {
            id: 'why',
            speaker: 'friend',
            text: 'why though. genuinely\n\ni sold you my company. i am not being falsely modest, i am asking what the job is, because if the job is being your friend at a table then i already do that for free and it does not need a calendar invite',
            choices: [
                { text: 'The job is arguing with me in front of other people.', next: 'stake' },
                { text: 'Because you are the only one who has never wanted anything.', next: 'stake' },
            ],
        },

        {
            id: 'stake',
            speaker: 'friend',
            // The turn. He works out the number himself and it changes the
            // conversation completely.
            text: 'ok. ok\n\nthe pack says one per cent. i looked up what the company is worth this morning because i could not sleep and then i did the multiplication twice because i thought i had put a comma wrong\n\nthats not a board seat. thats a house. two houses',
            choices: [
                { text: 'A seat without shares is a favour. With them it is a vote.', next: 'accept' },
                { text: 'It is what everyone else at that table has.', next: 'accept' },
            ],
        },

        {
            id: 'accept',
            speaker: 'friend',
            text: 'right\n\nthen i am going to say yes before i think about it any more, and i am going to be difficult about research spending, and you are going to regret both of those things in about a year',
            choices: [
                {
                    text: 'I am counting on it.',
                    effects: [
                        { kind: 'boardSeat', person: 'tech_planora', stake: FRIEND_STAKE },
                        { kind: 'flag', flag: 'friendOnBoard' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 10 },
                        {
                            kind: 'news',
                            headline: 'Hale adds the founder of Planora to its board. He holds one per cent.',
                        },
                    ],
                },
                {
                    text: 'Take the week. Think about it properly.',
                    // Same outcome, and it should be: the offer was made and
                    // he said yes. A version where thinking about it loses him
                    // the seat would be punishing the careful answer.
                    effects: [
                        { kind: 'boardSeat', person: 'tech_planora', stake: FRIEND_STAKE },
                        { kind: 'flag', flag: 'friendOnBoard' },
                        { kind: 'dial', dial: 'friendLoyalty', delta: 6 },
                        {
                            kind: 'news',
                            headline: 'Hale adds the founder of Planora to its board. He holds one per cent.',
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
