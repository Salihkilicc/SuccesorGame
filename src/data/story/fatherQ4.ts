// src/data/story/fatherQ4.ts
//
// ============================================================================
//  THE LAST QUARTER, AND HE TEACHES NOTHING
// ============================================================================
//
//  Every other scene of his hangs off a mechanic: a production target, an
//  invoice, a morale figure, a marketing budget. This one hangs off nothing.
//  It is the only conversation in the first year that the player could skip
//  entirely without losing a single number, and it is the point of the year.
//
//  ---------------------------------------------------------------------------
//  WHY THE FOURTH QUARTER WAS EMPTY, AND WHY THAT WAS WRONG
//  ---------------------------------------------------------------------------
//  The year ran: two scenes in the first quarter, one in the second, one in
//  the third, silence in the fourth, and then a CFO ringing to say your father
//  died at his desk. So the last thing the player ever heard from him was a
//  lecture about marketing budgets, and the gap before the phone call was an
//  accident of scheduling rather than anything anybody chose.
//
//  A death lands in proportion to how recently the person was real. One
//  quarter of nothing, then the news, means he was last real as a man
//  explaining discipline in advertising spend.
//
//  ---------------------------------------------------------------------------
//  HE DOES NOT KNOW, AND HE ALMOST DOES
//  ---------------------------------------------------------------------------
//  The scene must not become a goodbye. He has no idea; he dies at his desk
//  next quarter with the coffee still warm, which is not the death of a man
//  who has been putting his affairs in order.
//
//  So what he does is start a sentence he does not finish. That is all. He
//  gets close enough that the player can feel it on the second playthrough
//  and not on the first, which is the only honest way to write it.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';

/**
 * Fourth quarter, and before the fifth where the phone rings.
 *
 * `noFlag fatherDead` is not decoration - a beat becomes due the first
 * quarter its own `when` holds, and without it a player who reached quarter
 * four late could be given this on the same tick as the news.
 */
const WHEN: Condition[] = [
    { kind: 'quarterAtLeast', quarter: 4 },
    // ------------------------------------------------------------------
    //  AND NOT AFTER, WHICH IS THE UNUSUAL HALF
    // ------------------------------------------------------------------
    //  Almost every beat in this game opens and stays open - a letter that
    //  becomes possible in year three should not expire because the player
    //  was slow. This one closes, because the quarter after it is the
    //  quarter he dies.
    //
    //  Without the bound, `quarter >= 4` and the death's `quarter >= 5`
    //  both hold from the fifth quarter on, and a player who had not yet
    //  been given this would get a message from him and the call saying he
    //  died that morning in the same inbox. Beat order makes that unlikely.
    //  Unlikely is not good enough here.
    //
    //  Paired with `urgent` below: the window is one quarter wide, so the
    //  scene must not be able to lose its place in it to a random event.
    // ------------------------------------------------------------------
    { kind: 'quarterAtMost', quarter: 4 },
    { kind: 'noFlag', flag: 'fatherDead' },
];

export const fatherQ4: Conversation = {
    id: 'father-q4',
    channel: 'message',
    from: 'father',
    when: WHEN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'father',
            // No number in the first line, for the first time all year.
            text: 'It has been a year.\n\nI am not going to ask how you think it went. You will tell me a figure and I will tell you what is wrong with it and we will both have had that conversation before.',
            choices: [
                { text: 'Then what are you asking?', next: 'asking' },
                { text: 'It went badly and you know it went badly.', next: 'badly' },
            ],
        },

        {
            id: 'badly',
            speaker: 'father',
            // He does not agree and does not console. He reframes, and the
            // reframe is the kindest thing he has said so far.
            text: 'It went. That is more than most first years manage.\n\nMine had a fire in it. An actual fire, in the paint store, in March. I have never told you that because for about fifteen years I was ashamed of it and then it became a story I could not work out how to start.',
            choices: [
                { text: 'You never said.', next: 'neverSaid' },
                { text: 'Then what are you asking?', next: 'asking' },
            ],
        },

        {
            id: 'neverSaid',
            speaker: 'father',
            text: 'No.\n\nThere is a version of me that told you that story when you were nine and it would have been a good story by then. I kept waiting for it to stop being an admission. It never did, so here it is at the wrong end.',
            choices: [
                { text: 'Then what are you asking?', next: 'asking' },
            ],
        },

        {
            id: 'asking',
            speaker: 'father',
            text: 'Whether you are sleeping.\n\nThat is not a soft question. A man who is not sleeping makes decisions at four in the morning and defends them at ten, and the defending is the part that ruins him. I have signed things at four in the morning.',
            // Two, because two is the limit and the audit is right about it -
            // see answerFit.ts for the measurement. Victor is reachable from
            // the honest answer below, which is the only place a player who
            // has made that connection would raise him anyway.
            choices: [
                { text: 'I am sleeping.', next: 'sleeping' },
                { text: 'Not much.', next: 'notMuch' },
            ],
        },

        {
            id: 'victor',
            speaker: 'father',
            // He does not dodge this one, and it is still not an apology.
            // He tells you what the hour was like rather than what he did.
            text: 'Page nine. Yes.\n\nIt was a Tuesday and I had been awake since the Sunday and there was a room of people who wanted it finished. I have gone back and read that clause perhaps forty times. It is not even hidden. It is in the same font as the rest of it.',
            choices: [
                { text: 'You should have slept.', next: 'neitherDidYou' },
                { text: 'I will try.', next: 'trying' },
            ],
        },

        {
            id: 'notMuch',
            speaker: 'father',
            text: 'No.\n\nThen fix that before you fix anything on the floor. Everything on that floor will still be broken on Thursday. It is very patient. It has waited for me through worse than you are having.',
            choices: [
                { text: 'You did not sleep either.', next: 'neitherDidYou' },
                { text: 'Is that what happened with Victor?', next: 'victor' },
            ],
        },

        {
            id: 'neitherDidYou',
            speaker: 'father',
            text: 'I did not. And I am telling you to, which you will find is most of what a father is by the end.\n\nDo as I say. It is better advice than I look.',
            choices: [
                { text: 'I will try.', next: 'trying' },
            ],
        },

        {
            id: 'sleeping',
            speaker: 'father',
            // He does not believe it and lets it stand, which is new for him.
            text: 'Good. I do not believe you and I am going to leave it there, because your mother would have asked twice and I have never once seen that work.\n\nShe would have got a better answer than this, mind.',
            choices: [
                { text: 'She would have got the truth.', next: 'trying' },
                { text: 'I will try.', next: 'trying' },
            ],
        },

        {
            id: 'trying',
            speaker: 'father',
            // ------------------------------------------------------------------
            //  THE SENTENCE HE DOES NOT FINISH
            // ------------------------------------------------------------------
            //  The whole scene is for this card. He gets to the edge of saying
            //  something and stops - not dramatically, not with an ellipsis
            //  hanging in the air, but by picking up a different sentence and
            //  carrying on, which is what people actually do.
            //
            //  Nothing marks it. No flag, no dial, no music. A player on their
            //  first run reads it as him being brisk. On a second run it is
            //  the last chance he had.
            // ------------------------------------------------------------------
            text: 'Right.\n\nThere is a thing I have been meaning to say to you since about April and every time I sit down to it I find I have written you about the yield instead.\n\nAnyway. The plant audit is due in the spring and they will want the paperwork from the ninety-four extension, which is in the second cabinet and not where anybody sensible would put it.',
            choices: [
                { text: 'What thing?', next: 'whatThing' },
                { text: 'Second cabinet. Noted.', next: 'noted' },
            ],
        },

        {
            id: 'whatThing',
            speaker: 'father',
            // Asked directly, he still does not arrive - and this time it is
            // not evasion, it is a man who genuinely cannot find the words
            // and is embarrassed to be seen looking for them.
            text: 'It will keep.\n\nIt is not bad. It is not a confession, before you sit there inventing one. It is only that it is the sort of thing that sounds enormous when you say it out loud and rather small written down, and I have not decided which of those it is yet.\n\nNext quarter. When the audit is done.',
            choices: [
                { text: 'Next quarter, then.', next: 'noted' },
                { text: 'Say it badly. I will not mind.', next: 'sayItBadly' },
            ],
        },

        {
            id: 'sayItBadly',
            speaker: 'father',
            // The closest he ever gets, and it is one word longer than he
            // meant it to be.
            text: 'You are better at this than I was at your age and I have not said so because I did not want you comfortable.\n\nThat is not the thing. That is a smaller thing I have also been carrying. The other one still needs the words.\n\nGo home. It is late where you are as well.',
            choices: [
                { text: '(go home)', next: 'noted' },
            ],
        },

        {
            id: 'noted',
            speaker: 'father',
            // Terminal. He gets the last word, as always, and it is about a
            // filing cabinet.
            text: 'Second cabinet. The one that sticks.\n\nGoodnight.',
            choices: [
                {
                    text: 'Goodnight.',
                    // No effects at all. Nothing in this conversation moves a
                    // number, which is the only way it could have been written
                    // without becoming another lesson.
                    effects: [],
                },
            ],
        },
    ],
};
