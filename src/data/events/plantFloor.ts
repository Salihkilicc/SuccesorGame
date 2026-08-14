// src/data/events/plantFloor.ts
//
// ============================================================================
//  THE COO — SHE IS THE ONLY THING THAT WILL EVER TELL YOU
// ============================================================================
//
//  Dana Whitfield exists because of a hole in the shipped game, and the hole is
//  worth stating precisely before any of the writing makes sense.
//
//  ---------------------------------------------------------------------------
//  THE BUG THAT IS NOT A BUG
//  ---------------------------------------------------------------------------
//  Every facility tier needs about 1.5x the crew of the one below it: 48, 72,
//  108, 160. `staffingRatio` in market/capacity.ts scales production down by
//  exactly the fraction of that crew you have, so a plant at two thirds crew
//  makes two thirds of the units.
//
//  `targetHeadcount` is set in ONE place - the player moving a control on the
//  staff screen (useStatsStore.setTargetHeadcount). Nothing raises it when the
//  facility tier goes up. Nothing warns. Measured: upgrading lands you at 67%
//  staffed, and if the player never touches the staff screen again they stay
//  at 67% for the rest of the game, paying for a building they are running at
//  two thirds, with no number anywhere on any screen that says so.
//
//  That is a permanent, invisible, self-inflicted loss, and it is the most
//  likely single mistake in the game. A dialogue box saying "warning: low
//  staffing" would fix it and would be worth nothing. A person whose job is
//  the floor, who is angry about it on behalf of the people standing on that
//  floor, fixes it AND is a character.
//
//  ---------------------------------------------------------------------------
//  SHE POINTS AT THE SCREEN. SHE DOES NOT REACH THROUGH IT.
//  ---------------------------------------------------------------------------
//  Nothing in the effect vocabulary can hire, fire, set a headcount target or
//  toggle overtime, and none of that was added for her. Same contract as the
//  father's tutorial in year one: the story tells you what is wrong and where
//  the control is, and the player goes and moves it.
//
//  This matters for what the scenes are allowed to CLAIM. "I will raise the
//  target today" is a thing the player said, not a thing that happened, so no
//  scene here asserts the plant was fixed - see the note on the two quarterly
//  notes below, which differ on whether you ANSWERED her and nothing else.
//
//  ---------------------------------------------------------------------------
//  SHE HAS NO DIAL, AND THAT IS DELIBERATE
//  ---------------------------------------------------------------------------
//  See the note in core/story/state.ts. Her standing with you is employee
//  morale, which is an engine figure with its own physics, so there is no way
//  to be on good terms with your COO by picking the warm answer. You pay the
//  floor or you do not.
//
//  ---------------------------------------------------------------------------
//  NO NUMBERS SHE COULD NOT KNOW
//  ---------------------------------------------------------------------------
//  Scene text is static and the game is played at every scale from a 22-person
//  shed to a 41,700-person campus. "We are twenty-two people short" would be a
//  lie in almost every campaign. Everything she says is a RATIO or a named
//  thing - "under crew", "two thirds of a line", "the shift I cannot fill" -
//  which is true at tier 1 and at tier 20.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

/**
 * How short counts as short.
 *
 * 85, and the number is chosen against the engine rather than by feel. A tier
 * upgrade lands at ~67% and recovers to ~97% in two quarters if the player
 * raises the target, so 85 catches the gap and clears once it is dealt with.
 * At 95 she would be talking during the ordinary churn of a healthy plant;
 * at 70 she would only speak when it was already permanent.
 */
const SHORT = 85;

/**
 * The floor has stopped.
 *
 * 49.9, AND THE TENTH MATTERS. The number is not invented for this scene - it
 * is the engine's own cliff, where `attritionRate` doubles:
 *
 *     if (morale < 50) rate *= 2;
 *
 * That test is STRICT, and `moraleAtMost` is inclusive. Written as 50 the
 * scene fires at exactly 50.0 as well, which is the one value where the
 * doubling has not switched on yet - so she would arrive saying "we lose
 * people at twice the rate" in the single quarter where that is false.
 *
 * `updateMorale` rounds to one decimal place, so 49.9 is the largest value the
 * engine can actually hold below the cliff, and gating there makes her claim
 * true in every quarter she can possibly say it. Found by the test below,
 * which compares the gate against `attritionRate` rather than against a copy
 * of the number.
 *
 * Reachable and earned. Measured settle points: pay at market parks the floor
 * at 70.1, at 0.85 of market 53.6, at 0.80 48.1. Overtime takes another ten
 * off, a layoff of a quarter of the floor takes fifteen at once. It needs two
 * bad decisions or one sustained one.
 */
export const WALKOUT_MORALE = 49.9;

// ============================================================================
//  1. THE LINE IS SHORT
// ============================================================================
//  The common one, and the one that is quietly costing the player the most.
//  Her first card does not open with a complaint, it opens with the fact that
//  makes it urgent: manufacturing does not catch up. A quarter of missing
//  output is missing forever, which is exactly the thing a CEO looking at a
//  spreadsheet assumes is a timing difference.
// ============================================================================
/**
 * Named once and shared by the scene and its event, rather than written twice.
 *
 * The conversation's `when` is the trigger and there is deliberately no second
 * place to state it - a scene that can fire and a scene that can be delivered
 * disagreeing is a bug with no symptom except a quarter where nothing happens.
 */
const LINE_SHORT: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'staffingAtMost', percent: SHORT },
];

export const cooLineShort: Conversation = {
    id: 'event-coo-line-short',
    channel: 'message',
    from: 'coo',
    when: LINE_SHORT,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'The plant is under crew and it has been for the whole quarter.\n\nThe part people upstairs never believe: a unit we do not build this quarter is not late, it is gone. It does not queue up and arrive in the spring. We are paying rent on capacity we cannot run.',
            choices: [
                { text: 'How did we get short?', next: 'how' },
                { text: 'It will even out.', next: 'evenOut' },
            ],
        },

        {
            id: 'how',
            speaker: 'coo',
            // The actual mechanism, said plainly, because the player genuinely
            // cannot see it anywhere else in the game.
            text: 'You bought a bigger building.\n\nThat is not a dig, it is the arithmetic. A tier up is more capacity and more crew. The capacity arrives the day the build finishes. The crew arrives when I am allowed to go and find them, and the number I am allowed to find is set on your screen, not mine.',
            choices: [
                { text: 'So what do you need?', next: 'need' },
                { text: 'Then it corrects itself.', next: 'evenOut' },
            ],
        },

        {
            id: 'evenOut',
            speaker: 'coo',
            // She does not argue and does not sulk. She tells you what she is
            // going to do about being ignored, which is the whole character.
            text: 'It might.\n\nI will put it in the quarterly note either way. That is not a threat, that is what the note is for.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'flag', flag: 'cooOverruled' },
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note-cc',
                            afterQuarters: 1,
                            // If it cannot be delivered within a year the
                            // quarter it describes is ancient history and a
                            // note about it would be a ghost.
                            expiresAfter: 4,
                        },
                    ],
                },
                // The way back. Same rule as the Pear ending and the friend's
                // refusal: a lasting consequence arrived at by tapping through
                // is one the player will not own.
                { text: 'Wait. What do you need?', next: 'need' },
            ],
        },

        {
            id: 'need',
            speaker: 'coo',
            text: 'Two things, and one of them is free.\n\nRaise the headcount target on the staff screen. I cannot do that and you can, and nothing does it automatically when the plant grows, I have checked, twice, in front of your father.\n\nSecond: do not switch overtime on to cover the gap.',
            choices: [
                { text: 'Overtime is cheaper.', next: 'overtime' },
                {
                    text: 'I will raise it today.',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
            ],
        },

        {
            id: 'overtime',
            speaker: 'coo',
            // She concedes the point completely, which is what makes the rest
            // of it land. Overtime really is cheaper this quarter, and the
            // engine really does take morale every quarter it stays on.
            text: 'It is cheaper this quarter. I am not going to pretend otherwise.\n\nBut the people on that line are the same people next quarter and the quarter after, and it takes morale off them every quarter it is switched on. You are not buying hours. You are borrowing them, and morale is the interest.',
            choices: [
                {
                    text: 'Run it. I will pay the interest.',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                {
                    text: 'Then we hire. Raise the target.',
                    effects: [
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
            ],
        },
    ],
};

export const cooLineShortEvent: GameEvent = {
    id: 'coo-line-short',
    when: LINE_SHORT,
    chance: 0.8,
    // Often enough to catch a player who upgraded and forgot, not so often
    // that she becomes the weather of a plant that is merely growing.
    cooldown: 4,
    conversation: cooLineShort,
    headline: 'Hale is understood to be running its main line below rated crew.',
    priority: 3,
};

// ============================================================================
//  2. THE FLOOR STOPS
// ============================================================================
//  The one the prompt calls a revolt, and the writing decision is that it is
//  not one. Nobody shouts. They clock on and stand there, which is worse to be
//  told about and much worse to look at.
//
//  Their demand is market pay and not a penny over it - the exact number the
//  salary screen is a ratio OF. There is no negotiation in this scene because
//  there is nothing to negotiate: they have asked for the thing the game
//  already defines as normal.
// ============================================================================
const FLOOR_STOPPED: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'moraleAtMost', value: WALKOUT_MORALE },
];

export const cooWalkout: Conversation = {
    id: 'event-coo-walkout',
    channel: 'message',
    from: 'coo',
    when: FLOOR_STOPPED,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'I am standing on the floor. Nobody is working.\n\nNobody is shouting either. They came in, they clocked on, and they are at their stations doing nothing. I have been asked to pass on one sentence and I am going to pass it on exactly as it was given to me.\n\n"We are not asking for more than the people down the road."',
            choices: [
                { text: 'What do they want?', next: 'want' },
                { text: 'Send them home.', next: 'sendHome' },
            ],
        },

        {
            id: 'want',
            speaker: 'coo',
            text: 'Market. That is the entire demand. Not above it.\n\nAnd the number is on your salary screen as a ratio, so you already know what you have been running. What you do not know is that below this point we lose people at twice the rate, that is not me being dramatic, it is what the last four quarters did, and I have been replacing them quietly, and I have run out of quietly.',
            choices: [
                {
                    text: 'Put it back to market.',
                    effects: [
                        { kind: 'flag', flag: 'plantWalkout' },
                        // It happened, so it is news either way. The quiet
                        // version: a stoppage that ended the same day.
                        {
                            kind: 'news',
                            headline: 'Brief stoppage at the Hale plant ends the same afternoon.',
                        },
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                { text: 'They can be replaced.', next: 'replaced' },
            ],
        },

        {
            id: 'sendHome',
            speaker: 'coo',
            text: 'I did that at ten. They went without a word, which you should find more worrying than if they had argued.\n\nThey will be back tomorrow. So will this.',
            choices: [
                { text: 'What do they want?', next: 'want' },
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'flag', flag: 'plantWalkout' },
                        { kind: 'flag', flag: 'cooOverruled' },
                        { kind: 'dial', dial: 'publicReputation', delta: -6 },
                        {
                            kind: 'news',
                            headline: 'Workers at Hale stop the line over pay. The company has not commented.',
                        },
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note-cc',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
            ],
        },

        {
            id: 'replaced',
            speaker: 'coo',
            // True, and the order of the sentence is the argument: she agrees
            // first. Everything the engine does here is real - hiring is a
            // quarter delayed, new staff run at half efficiency for a quarter,
            // and low morale lowers the hiring cap, so the good ones go first.
            text: 'They can. It takes a quarter to hire them and a quarter before they are worth their wage.\n\nAnd the ones who leave first are the ones who can walk into a job tomorrow. What you keep is whoever nobody else wanted. I have watched a plant do this once before and it does not look like a disaster, it looks like everything taking slightly longer forever.',
            choices: [
                {
                    text: 'Do it my way.',
                    effects: [
                        { kind: 'flag', flag: 'plantWalkout' },
                        { kind: 'flag', flag: 'cooOverruled' },
                        { kind: 'dial', dial: 'publicReputation', delta: -6 },
                        {
                            kind: 'news',
                            headline: 'Workers at Hale stop the line over pay. The company has not commented.',
                        },
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note-cc',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                { text: '...no. Put it back to market.', next: 'want' },
            ],
        },
    ],
};

export const cooWalkoutEvent: GameEvent = {
    id: 'coo-walkout',
    when: FLOOR_STOPPED,
    chance: 0.9,
    cooldown: 8,
    conversation: cooWalkout,
    headline: 'Unrest reported on the Hale production floor.',
    // The joint highest in the pool, alongside the cash warning, and by the
    // same rule: priority is how much the player must act THIS quarter rather
    // than how large the story is. The line is stopped.
    priority: 5,
};

// ============================================================================
//  3. THE QUARTERLY NOTE, IN TWO VERSIONS
// ============================================================================
//  This is the "formal mail at quarter end" half of the character, and the two
//  versions are the point of writing her at all.
//
//  THEY DIFFER ON ONE THING: WHETHER YOU ANSWERED HER. Not whether you were
//  right, not whether the plant recovered - the scene cannot know either of
//  those, because the fix happens on a screen a quarter later and no effect in
//  the vocabulary can verify it. It CAN know whether the player replied,
//  because that happened in the conversation. So that is all it claims.
//
//  The second version is the same letter with two additions: a sentence saying
//  she raised it and got no reply, and a cc line. She is not being vindictive.
//  She is a professional creating a record that protects her, which is what
//  people do around a boss who does not answer, and the player gets to notice
//  that they have become that boss.
// ============================================================================
export const cooOpsNote: Conversation = {
    id: 'coo-ops-note',
    channel: 'mail',
    from: 'coo',
    subject: 'Operations, quarter close',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Standard note, no surprises in it.\n\nLine ran below rated crew for part of the quarter. Output tracked staffing, as it always does. Scrap was in band. Overtime as authorised.\n\nAs discussed.\n\nD.W.',
            choices: [
                { text: 'Thanks. Anything I should be watching?', next: 'watching' },
                { text: '(file it)' },
            ],
        },
        {
            id: 'watching',
            speaker: 'coo',
            text: 'The staff target, every time the plant grows. It is the one number in this company that does not move on its own and everyone assumes does.\n\nI will keep saying it until it stops being true.',
        },
    ],
};

export const cooOpsNoteCc: Conversation = {
    id: 'coo-ops-note-cc',
    channel: 'mail',
    from: 'coo',
    subject: 'Operations, quarter close',
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            // Identical body. The two added sentences and the cc are the whole
            // difference, and they are the sound of somebody protecting
            // themselves rather than attacking you.
            text: 'Standard note, no surprises in it.\n\nLine ran below rated crew for part of the quarter. Output tracked staffing, as it always does. Scrap was in band. Overtime as authorised.\n\nI raised the staffing position with the CEO during the quarter and did not receive a decision, so I am recording it here.\n\nD.W.\n\ncc: Board of Directors',
            choices: [
                { text: 'Why is the board on this?', next: 'why' },
                { text: '(file it)' },
            ],
        },
        {
            id: 'why',
            speaker: 'coo',
            // No apology and no accusation. She explains the procedure, which
            // is more damning than either.
            text: 'Because the plant lost a quarter of output and somebody will ask who knew.\n\nI am not making a point. I am answering that question in advance, in writing, once, so that I do not have to answer it under oath later. Your father understood the difference and never took it personally.\n\nAnswer me next time and the note goes back to one page.',
        },
    ],
};
