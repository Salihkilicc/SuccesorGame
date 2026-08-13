// src/data/story/fatherMorale.ts
//
// ============================================================================
//  THE MORALE BEAT — market pay buys you people who do not leave
// ============================================================================
//
//  WHAT THE TRIGGER ACTUALLY IS, because the obvious reading of it is wrong.
//
//  Morale does not fall to 70. It FALLS TOWARDS 70 and never arrives: the
//  workforce starts at 75 and walks 30% of the remaining gap to its wage
//  target every quarter, so on market pay it goes 73.5, 72.5, 71.8, 71.3,
//  70.9 - approaching the anchor from above, forever. There is no quarter in
//  which it is below 70 and there never will be. See core/market/workforce.ts.
//
//  So this is not a crisis event, and writing it as one would have been
//  writing about something that cannot happen. It is a MEDIOCRITY event, and
//  that turns out to be the better scene: paying the market rate does not
//  make anyone unhappy, it makes them ordinary. They stay. They do not care.
//  The father's objection is not that the line is about to stop - it is that
//  the player has mistaken "nobody is complaining" for "this is working".
//
//  ---------------------------------------------------------------------------
//  HIS PARANOIA, DOING REAL WORK AGAIN
//  ---------------------------------------------------------------------------
//  Same construction as Q1: the mechanics he cites are exactly true - morale
//  drives scrap and output, a bonus is a one-off that decays, market pay
//  parks you at the middle - and the frame he puts round them is a man who
//  believes loyalty must be purchased because it is never given.
//
//  The player can take the bonus as good management or as buying people, and
//  both readings survive the scene. What he will not allow is the third
//  option, which is not thinking about it.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

export const fatherMorale: Conversation = {
    id: 'father-morale',
    channel: 'message',
    from: 'father',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            text: 'I looked at your floor numbers. Nobody has quit. Nobody has complained.\n\nThat is not the compliment you think it is. Go and look at the morale figure before you answer me.',
            choices: [
                { text: 'It is around seventy. That is fine.', next: 'fine' },
                { text: 'What should it be?', next: 'shouldBe' },
            ],
        },

        {
            id: 'fine',
            speaker: 'father',
            // The engine's actual behaviour, stated plainly: the anchor is
            // where market pay parks you and it does not move on its own.
            text: 'It is exactly fine. That is the problem — it is the number you get for paying precisely what everyone else pays, and it will sit there for nine years if you let it.\n\nFine is not a plateau you are resting on. It is the one you were put on.',
            choices: [
                { text: 'What should it be?', next: 'shouldBe' },
                { text: 'People are not machines you tune.', next: 'notMachines' },
            ],
        },

        {
            id: 'notMachines',
            speaker: 'father',
            // He concedes and it costs him nothing, which is worse than
            // arguing. This is the scene's clearest look at the second
            // reading of him.
            text: 'No. Machines are cheaper and they tell you when they are unhappy.\n\nI am not asking you to like this. I am telling you that a man who is paid the average does average work, and that when it matters he will be at home, correctly, on time, having done exactly what was asked.\n\nI had a foreman for nineteen years who would have slept in that building. He went to a competitor for eleven per cent more and I could not match it, because eleven per cent of a wage bill was a conversation with a board, and by the time the conversation finished he had a desk somewhere else.',
            choices: [
                { text: 'What should it be?', next: 'shouldBe' },
            ],
        },

        {
            id: 'shouldBe',
            speaker: 'father',
            // All true: morale drives scrap (scrapMultiplier) and output
            // (efficiencyMultiplier), and both sit at the rated figure at 70.
            text: 'Higher than the middle, or you are paying for the middle in scrap and never seeing the invoice for it.\n\nEvery point under is product on the floor you paid to make and cannot sell. It does not appear as a line called "morale". It appears as a yield you assume is normal, because it has been normal since the day you started.',
            choices: [
                { text: 'So I raise wages.', next: 'wages' },
                { text: 'So I pay a bonus.', next: 'bonus' },
            ],
        },

        {
            id: 'wages',
            speaker: 'father',
            // Accurate: wageMoraleTarget has a ceiling of 85, and the
            // pay-cut shock makes a raise a commitment rather than a dial.
            text: 'You can. It is permanent, it compounds, and it will carry you to about eighty-five and no further — money alone has a ceiling and that is where it is.\n\nAnd you will not be taking it back. Cut a wage you have raised and you will pay for it twice: once in the money and once in what they decide about you.',
            choices: [
                { text: 'Then a bonus, this quarter.', next: 'bonus' },
                { text: 'I will take the ceiling.', next: 'ceiling' },
            ],
        },

        {
            id: 'ceiling',
            speaker: 'father',
            text: 'Then do it knowing it is a decision you are making once. Most men make it by accident, in a good quarter, and spend the next four explaining it.',
            choices: [
                { text: 'And the bonus?', next: 'bonus' },
            ],
        },

        {
            id: 'bonus',
            speaker: 'father',
            // The instruction the lock is gating. Honest about the decay:
            // a bonus is a one-off and the tick treats it as one.
            text: 'A bonus is a different instrument and you should not confuse them. It is one quarter of goodwill, bought outright, and it fades. That is not a flaw — sometimes one quarter is precisely what you need.\n\nDo it now. Team Morale, on your company screen. And do it while the quarter is good, not when you need something.',
            choices: [
                { text: 'Why does that matter?', next: 'whyTiming' },
                { text: 'Paying it.', next: 'close' },
            ],
        },

        {
            id: 'whyTiming',
            speaker: 'father',
            // The line that is either the wisest thing he says or the
            // saddest. It reads both ways and the scene does not choose.
            text: 'Because a gift given the week before you ask for overtime is not a gift, it is an invoice, and they will read it as one. They always do.\n\nGive it in a quarter where you want nothing. Then, in the quarter where you want something, you will have somewhere to stand.',
            choices: [
                { text: 'That is a cold way to describe generosity.', next: 'cold' },
                { text: 'Paying it.', next: 'close' },
            ],
        },

        {
            id: 'cold',
            speaker: 'father',
            text: 'It is. I have also never had a good year I could not trace back to somebody who did not have to help me and did.\n\nBoth of those are true and I have stopped trying to reconcile them. Pay the bonus.',
            choices: [
                { text: 'Paying it.', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'father',
            // Terminal, and the last line is the thesis: he cannot tell the
            // difference between care and purchase either, and has decided
            // not to mind. The player has to decide whether that is wisdom.
            text: 'Good.\n\nAnd look at the yield next quarter, not the morale number. The number is how they feel. The yield is what it was worth.',
        },
    ],
};
