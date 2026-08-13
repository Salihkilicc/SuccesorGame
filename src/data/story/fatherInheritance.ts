// src/data/story/fatherInheritance.ts
//
// ============================================================================
//  THE FIRST THING HE SAYS, AND HE NEVER ONCE SAYS "I"
// ============================================================================
//
//  Before this scene the game opened with a man telling you the production
//  line was cold. Correct, useful, and it skipped the only question a person
//  actually has on their third day: what is this thing I have been handed.
//
//  So he answers it. The whole scene is him describing the company, and the
//  design is that every fact is TRUE and every explanation is a man who has
//  never been the reason for anything.
//
//  ---------------------------------------------------------------------------
//  WHAT HE IS DESCRIBING IS NOT A BANKRUPTCY
//  ---------------------------------------------------------------------------
//  It would be easier to write if it were, and it would be a lie. Measured
//  from the stores, the player starts with:
//
//      2,000,000 in company capital     no debt at all
//      22 employees                     a tier-one floor
//      brand 18, about 0.4% share       and THIRTY-FIVE PER CENT of it
//
//  The company is solvent. It is small, and it is not his any more, and those
//  are different failures. A founder who took it from all of it to a third of
//  it over twenty years, one emergency at a time, is a far worse thing to
//  inherit than a debt - a debt you can pay.
//
//  This matters for a reason beyond taste: the player can open the shareholder
//  screen thirty seconds later. If he says the company is drowning and the
//  balance sheet says otherwise, he stops being an unreliable narrator and
//  becomes a bug. Everything he states here is checkable, and checks out.
//
//  ---------------------------------------------------------------------------
//  THE FOUR NAMES, AND THE FOUR REASONS THAT ARE NOT HIM
//  ---------------------------------------------------------------------------
//  The 65% he no longer holds has faces on it, and he has a story for each:
//
//      Marcus 'The Wolf'   17%   "circled a bad winter"      - the recession
//      Julian, your brother 15%  "was in the will"           - your grandfather
//      Elena Vance         14%   "took it as a condition"    - the banks
//      Victor K.           11%   "was already in the room"   - a lawyer
//
//  Four transfers, four culprits, and the same signature at the bottom of all
//  four pages. He does not notice. He is not lying either - each story is
//  broadly what happened. He simply cannot see the one thing common to them.
//
//  The player is never told this. There is one answer - "Who signed them?" -
//  that walks him straight at it, and what he does is change the subject to
//  the factory floor. That is the whole characterisation, and it costs one
//  card.
//
//  ---------------------------------------------------------------------------
//  WHY IT IS A MESSAGE AND NOT A LETTER
//  ---------------------------------------------------------------------------
//  Because he is not composing. He is going, one thought at a time, in the
//  order the resentments occur to him, and half of it arrives as a second
//  paragraph he did not need to send.
// ============================================================================

import type { Conversation } from '../../core/story/graph';

// ---------------------------------------------------------------------------
//  THE FIGURES HE QUOTES
// ---------------------------------------------------------------------------
//  Declared here and pinned by fatherInheritance.test.ts against the actual
//  stores, so a rebalance that moves the player's opening stake cannot quietly
//  leave the first character in the game stating a number that is no longer
//  true. Story data may not import the engine - see scripts/reachability.js -
//  which is why these are re-declared rather than imported.
// ---------------------------------------------------------------------------
export const PLAYER_STAKE = 35;
export const WOLF_STAKE = 17;
export const BROTHER_STAKE = 15;
export const VANCE_STAKE = 14;
export const VICTOR_STAKE = 11;
export const OPENING_HEADCOUNT = 22;

export const fatherInheritance: Conversation = {
    id: 'father-inheritance',
    channel: 'message',
    from: 'father',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            // He starts mid-thought and mid-argument, with somebody who is
            // not in the room. That is the whole man in two lines.
            text: 'Sit down. And I mean sit — I can hear you standing.\n\nThey will have given you a folder. Whatever is in the folder, it will not have said the one number, because nobody who is paid by the hour puts the bad number on the first page.',
            choices: [
                { text: 'What number?', next: 'thirtyFive' },
                { text: 'I have read the folder.', next: 'readIt' },
            ],
        },

        {
            id: 'readIt',
            speaker: 'father',
            text: 'Then tell me what you own.\n\nNot the company. You. What is yours, on paper, if this all goes wrong on a Tuesday.',
            choices: [
                { text: 'Thirty-five per cent.', next: 'knewIt' },
                { text: 'I assumed all of it.', next: 'thirtyFive' },
            ],
        },

        {
            id: 'knewIt',
            speaker: 'father',
            // The one moment he is nearly proud, and it lasts nine words.
            text: 'Good. You read the back.\n\nMost people read the front and the front is written to be read.',
            choices: [
                { text: 'So who has the other sixty-five?', next: 'whoHas' },
            ],
        },

        {
            id: 'thirtyFive',
            speaker: 'father',
            text: 'Thirty-five per cent.\n\nYour grandfather started it with all of it and a shed. You have a third and a chair. I would like you to know that number before a stranger tells you it in a room.',
            choices: [
                { text: 'Who has the rest?', next: 'whoHas' },
                { text: 'How did it get to a third?', next: 'howGotHere' },
            ],
        },

        {
            id: 'whoHas',
            speaker: 'father',
            // Four names, four numbers, all real. The story attached to each
            // arrives on the next cards.
            text: 'Four people, and you will meet all of them within a month.\n\nMarcus Wolf, seventeen. Your brother, fifteen. Elena Vance, fourteen. Victor K., eleven.\n\nNot one of them has ever stood on the floor of the building they own a piece of.',
            choices: [
                { text: 'How did each of them get theirs?', next: 'howGotHere' },
                { text: 'Then I need two of them for anything.', next: 'arithmetic' },
            ],
        },

        {
            id: 'arithmetic',
            speaker: 'father',
            // True of the board engine: 35 alone passes nothing, and the
            // combinations he names are the real ones.
            text: 'You need your brother, or you need two of the others. That is the arithmetic and it does not care how you feel about it.\n\nWhich is why the room matters more than the report. Everyone learns that late. I learned it late.',
            choices: [
                { text: 'How did each of them get theirs?', next: 'howGotHere' },
            ],
        },

        {
            id: 'howGotHere',
            speaker: 'father',
            // Culprit one: the recession. Note the shape - something HAPPENED
            // to him, and Wolf is described as weather rather than as a man
            // he negotiated with.
            text: 'The Wolf came in the winter of the crash. Everyone was selling and he was buying and he called that courage in an interview. Seventeen per cent, at a price that was an insult in any year but that one.\n\nThe banks had shut the window. You cannot run a floor on a shut window.',
            choices: [
                { text: 'And Elena Vance?', next: 'vance' },
                { text: 'You could have closed the plant for a year.', next: 'closedPlant' },
            ],
        },

        {
            id: 'closedPlant',
            speaker: 'father',
            // The only moment in the scene where he is unambiguously right,
            // and it is about other people rather than himself.
            text: 'With eighty families on it. Yes. That was the other option and I want you to hold on to the fact that it WAS an option, because one day somebody will tell you there was no choice and there is always a choice, it is only ever that the other one is worse.\n\nElena Vance is next. Ask.',
            choices: [
                { text: 'And Elena Vance?', next: 'vance' },
            ],
        },

        {
            id: 'vance',
            speaker: 'father',
            // Culprit two: the banks. And the first real crack - she is on
            // the board to WATCH him, which he reports as an indignity rather
            // than as a judgement anybody made about him.
            text: 'Fourteen, and she did not pay for it in money. She paid for it by signing next to me when nobody else would, and the price was a seat and the right to ask.\n\nThe banks wanted an adult in the room. That was the phrase. An adult in the room, said to a man of fifty-two.',
            choices: [
                { text: 'And Victor K.?', next: 'victor' },
                { text: 'Was she right to ask?', next: 'wasSheRight' },
            ],
        },

        {
            id: 'wasSheRight',
            speaker: 'father',
            // He cannot answer it. He answers a different, adjacent question
            // and does not notice he has moved.
            text: 'She was thorough. Thorough is not the same as right, and I have watched thorough people be catastrophically wrong at great length and with excellent minutes.\n\nShe is still there. She will still be there when you are my age.',
            choices: [
                { text: 'And Victor K.?', next: 'victor' },
            ],
        },

        {
            id: 'victor',
            speaker: 'father',
            // Culprit three: a lawyer, and a document he did not read.
            text: 'Victor was in the room for something else entirely and left with eleven per cent of a company he had not walked into that morning intending to own.\n\nThere was a clause. I did not put it there. A man whose hourly rate I was paying put it there, on page nine, and I signed page twelve.',
            choices: [
                { text: 'And Julian? He has fifteen.', next: 'brother' },
                { text: 'Who signed them?', next: 'whoSigned' },
            ],
        },

        {
            id: 'brother',
            speaker: 'father',
            // Culprit four: your grandfather. The most revealing of the set -
            // he is annoyed at a dead man for an even split, and the sentence
            // he uses to be fair to Julian is the cruellest one in the scene.
            text: 'Your brother has fifteen because your grandfather wrote a will in a decade when men divided things evenly and thought it was kindness.\n\nJulian will be warm to you. He is warm to everybody, it costs him nothing, and I am not saying that against him. I am saying it so that you do not mistake it for information.',
            choices: [
                { text: 'Who signed them?', next: 'whoSigned' },
                { text: 'What is left, then?', next: 'whatIsLeft' },
            ],
        },

        {
            id: 'whoSigned',
            speaker: 'father',
            // ------------------------------------------------------------------
            //  THE CARD THE WHOLE SCENE IS BUILT AROUND
            // ------------------------------------------------------------------
            //  He is asked the only question that puts the four stories
            //  together, and he does not deny it, does not get angry, and does
            //  not answer it. He agrees with the premise and then talks about
            //  the floor - because the floor is a place where he was right.
            //
            //  No dial moves. No flag is raised. If the player sees it, they
            //  see it; the game does not lean over and point.
            // ------------------------------------------------------------------
            text: 'I did.\n\nAll four. Different pens, one hand.\n\nThe floor is what you should be asking about. The floor is the only part of this that has ever done what it was told.',
            choices: [
                { text: 'Tell me about the floor.', next: 'whatIsLeft' },
                { text: 'I was asking about the pen.', next: 'thePen' },
            ],
        },

        {
            id: 'thePen',
            speaker: 'father',
            // Pushed twice, he still does not arrive. What he offers instead
            // is the closest he comes to an apology in the entire game, and
            // it is addressed to a circumstance rather than to a choice.
            text: 'And I have told you. I signed them. What would you like me to add to it — that I felt terrible? I felt terrible. It is not a line on the register.\n\nEvery one of those was a Thursday where the alternative was worse. You will have your own Thursdays. Then we will talk about pens.',
            choices: [
                { text: 'What is left, then?', next: 'whatIsLeft' },
            ],
        },

        {
            id: 'whatIsLeft',
            speaker: 'father',
            // Now the state of the company, all of it true: two million,
            // no debt, twenty-two people, one tier-one floor.
            text: 'Two million in the account and not one penny owed to anybody. Write that down, because it is the only sentence in this conversation you will miss later.\n\nTwenty-two people. One floor, the small kind. And a share of the market so thin that the men who own the rest of it have not yet been told your name.',
            choices: [
                { text: 'That is not much of a company.', next: 'notMuch' },
                { text: 'No debt is something.', next: 'noDebt' },
            ],
        },

        {
            id: 'noDebt',
            speaker: 'father',
            text: 'It is the whole thing. It is what four bad decisions bought — and yes, I hear it, I am telling you that giving away two thirds of a company was the thing that kept it.\n\nIt was. Both of those are true at once and you will spend a while not liking that.',
            choices: [
                { text: 'So what do I do first?', next: 'close' },
            ],
        },

        {
            id: 'notMuch',
            speaker: 'father',
            // And here he is simply correct, which is why the scene can end
            // on him. The player will be able to check every word of it.
            text: 'No. It is not.\n\nIt is a small solvent company with a cold line, in a market where the man at the top does more in a morning than you will do this year. I am not going to dress that up. You would find out in a fortnight and then you would stop believing the useful things I tell you as well.',
            choices: [
                { text: 'So what do I do first?', next: 'close' },
            ],
        },

        {
            id: 'close',
            speaker: 'father',
            // Hands off to father-q1, which is the scene that was previously
            // the opening. Not scheduled from here - father-q1 is queued by
            // OPENING_CONVERSATIONS and is already behind this in the inbox -
            // so this card only has to point at it.
            text: 'You start the line. Everything else in this company is an opinion; the line is the only part that produces a fact.\n\nI will write to you about it within the hour. I will not have improved by then.',
            choices: [
                { text: 'I know.', effects: [] },
                {
                    text: 'Thank you for telling me the number.',
                    // The one place warmth is allowed to land, and even here
                    // he takes it back inside the same message. No dial: this
                    // is three days in and there is nothing yet to move.
                    next: 'thanked',
                },
            ],
        },

        {
            id: 'thanked',
            speaker: 'father',
            text: 'Somebody was going to. Better me than a man across a table who has already decided what he wants from you.\n\nStart the line.',
            choices: [
                { text: '(put the phone down)', effects: [] },
            ],
        },
    ],
};

// ============================================================================
//  HOW IT ARRIVES
// ============================================================================
//
//  Through OPENING_CONVERSATIONS in data/story/index.ts, FIRST in that list.
//  `seedOpening` walks the list in order and marks every id urgent, so it is
//  the first thing the player reads and it does not queue behind a random
//  event - a player told to set a production target before anybody has told
//  them what they own has been given the tutorial backwards.
//
//  SHELVED: this was written as a StoryBeat as well, which would have been a
//  second delivery route for one scene. Kept as a note rather than as code,
//  because the failure it would cause - the same conversation queued twice
//  from two lists - is one this project has already paid for elsewhere.
//
//    export const fatherInheritanceBeat: StoryBeat = {
//        conversation: fatherInheritance.id,
//        urgent: true,
//    };
// ============================================================================
