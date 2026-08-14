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
            text: 'The plant ran below crew all quarter. Unbuilt capacity is lost revenue; we are paying facility overhead on lines we cannot staff.',
            choices: [
                { text: 'Why are we understaffed?', next: 'how' },
                { text: 'It will balance out.', next: 'evenOut' },
            ],
        },

        {
            id: 'how',
            speaker: 'coo',
            text: 'Facility expansion added line capacity, but staff targets on your dashboard were not adjusted to match.',
            choices: [
                { text: 'What is required?', next: 'need' },
                { text: 'It will balance out.', next: 'evenOut' },
            ],
        },

        {
            id: 'evenOut',
            speaker: 'coo',
            text: 'I will document the capacity gap in the quarterly report for the operational record.',
            choices: [
                {
                    text: '(leave it)',
                    effects: [
                        { kind: 'flag', flag: 'cooOverruled' },
                        {
                            kind: 'schedule',
                            conversation: 'coo-ops-note-cc',
                            afterQuarters: 1,
                            expiresAfter: 4,
                        },
                    ],
                },
                { text: 'Wait. What do you need?', next: 'need' },
            ],
        },

        {
            id: 'need',
            speaker: 'coo',
            text: 'Raise the headcount target on the staff screen; nothing does it automatically. Avoid relying on overtime to patch production gaps.',
            choices: [
                { text: 'Overtime is cheaper short-term.', next: 'overtime' },
                {
                    text: 'I will adjust the target.',
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
            text: 'It is cheaper this quarter. But morale is the interest we pay later: running it anyway burns out experienced hands.',
            choices: [
                {
                    text: 'Run it anyway.',
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
                    text: 'Hire crew instead.',
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
    chance: 0.40,
    cooldown: 4,
    conversation: cooLineShort,
    headline: 'Hale is understood to be running its main line below rated crew.',
    priority: 3,
};

// ============================================================================
//  2. THE FLOOR STOPS
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
            text: 'Production has halted. The floor clocked in and stood at stations. They are not asking for more than the people down the road.',
            choices: [
                { text: 'What is their demand?', next: 'want' },
                { text: 'Dismiss shift.', next: 'sendHome' },
            ],
        },

        {
            id: 'want',
            speaker: 'coo',
            text: 'Market rate wages. Not above it. Sub-market pay loses people at twice the rate.',
            choices: [
                {
                    text: 'Restore market wages.',
                    effects: [
                        { kind: 'flag', flag: 'plantWalkout' },
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
                { text: 'Workers are replaceable.', next: 'replaced' },
            ],
        },

        {
            id: 'sendHome',
            speaker: 'coo',
            text: 'Sent home for the day, but the stoppage resumes tomorrow without a wage adjustment.',
            choices: [
                { text: 'What is their demand?', next: 'want' },
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
            text: 'They can. But those worth their wage leave first, and we recruit whoever nobody else wanted.',
            choices: [
                {
                    text: 'Maintain current pay.',
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
                { text: 'Restore to market rate.', next: 'want' },
            ],
        },
    ],
};

export const cooWalkoutEvent: GameEvent = {
    id: 'coo-walkout',
    when: FLOOR_STOPPED,
    chance: 0.45,
    cooldown: 8,
    conversation: cooWalkout,
    headline: 'Unrest reported on the Hale production floor.',
    priority: 5,
};

// ============================================================================
//  3. THE QUARTERLY NOTE, IN TWO VERSIONS
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
            text: 'Line ran below rated crew for part of the quarter. Output tracked staffing, as it always does. Scrap was in band. Overtime as authorised.\n\nD.W.',
            choices: [
                { text: 'Anything to watch next quarter?', next: 'watching' },
                { text: '(file it)' },
            ],
        },
        {
            id: 'watching',
            speaker: 'coo',
            text: 'Keep staffing targets aligned with facility scale as capacity expands.\n\nD.W.',
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
            text: 'Line ran below rated crew for part of the quarter. Output tracked staffing, as it always does. Scrap was in band. Overtime as authorised.\n\nNote: did not receive a decision on staffing.\n\nD.W.\n\ncc: Board of Directors',
            choices: [
                { text: 'Why copy the board?', next: 'why' },
                { text: '(file it)' },
            ],
        },
        {
            id: 'why',
            speaker: 'coo',
            text: 'I am not making a point. I am writing down what happened. Answer me next time.\n\nD.W.',
        },
    ],
};
