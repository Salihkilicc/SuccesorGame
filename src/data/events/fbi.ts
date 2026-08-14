// src/data/events/fbi.ts
//
// ============================================================================
//  THREE INVESTIGATIONS, AND THE ONLY WAY TO LOSE IS TO TALK
// ============================================================================
//
//  The three cases are about different things and the interviews are the same
//  shape, because interviews are.
//
//    FINANCIAL      the Braga payments. Only reaches a player who kept making
//                   them after being told what they were - see cfoArc.ts.
//    INSIDER        your brother's account, and the question of who told him.
//    ESPIONAGE      the number your friend gave you. Only reaches a player who
//                   used it.
//
//  ---------------------------------------------------------------------------
//  THE TRAP IS THE GRAPH, NOT A DIE
//  ---------------------------------------------------------------------------
//  A conversation cannot remember what you said. So the memory is BRANCHING:
//  the second card is where you commit to a version of events, and it leads to
//  two different third cards - one for each version - each offering answers
//  that are consistent or contradictory WITH THAT VERSION.
//
//  Which means the trap is entirely legible in the data and entirely invisible
//  in play. The player is not failing a dice roll; they are failing to
//  remember, two cards later, what they already said. That is what these
//  interviews are actually like and it is the only mechanic in the game that
//  the graph shape itself performs.
//
//  A BRIBE IS OFFERED EVERYWHERE AND IS ALWAYS FATAL. It is on the third card
//  of all three cases, phrased plausibly, and it ends the same way every time.
//  It is there because a player who has been sweating for three cards will
//  reach for it, and because there has to be one thing in this game that is
//  simply, unconditionally the wrong answer.
//
//  ---------------------------------------------------------------------------
//  WHAT BEING FOUND GUILTY DOES
//  ---------------------------------------------------------------------------
//  A fine, a brand collapse, and a public-standing collapse. The share price
//  follows from the brand rather than being written directly, because the tick
//  RECOMPUTES the valuation every quarter from earnings, revenue, brand and
//  share - a one-off write to companyValue would be erased by the next tick,
//  which is the bug this codebase found in `gameSink.brand` and should not
//  reintroduce. Brand persists, and `brandValuationMultiplier` carries it into
//  the multiple. That is the share collapse, correctly plumbed.
//
//  And `fbiGuilty` goes on poisoning things afterwards - see the standing
//  penalty in useGameStore's tick and the resistance term in negotiation.ts.
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { Effect } from '../../core/story/effects';
import type { GameEvent } from '../../core/events/types';

// ---------------------------------------------------------------------------
//  THE TWO ENDINGS, WRITTEN ONCE
// ---------------------------------------------------------------------------
//  Three cases that each invented their own penalty would drift, and the
//  player would learn that one investigation is worse than another for reasons
//  nobody decided.
// ---------------------------------------------------------------------------

const GUILTY: Effect[] = [
    { kind: 'flag', flag: 'fbiGuilty' },
    { kind: 'capital', amount: -18_000_000 },
    // The share collapse. Not a direct write - see the note above.
    { kind: 'brand', amount: -25 },
    { kind: 'dial', dial: 'publicReputation', delta: -35 },
    { kind: 'morale', amount: -18 },
    {
        kind: 'news',
        headline: 'Hale\'s chief executive is found to have obstructed a federal investigation. The stock is halted.',
    },
];

const CLEARED: Effect[] = [
    { kind: 'flag', flag: 'fbiCleared' },
    // Being cleared is not free either. Three quarters of lawyers and a year
    // of the phrase "under investigation" attached to your name.
    { kind: 'capital', amount: -2_400_000 },
    { kind: 'brand', amount: -4 },
    { kind: 'dial', dial: 'publicReputation', delta: 4 },
    {
        kind: 'news',
        headline: 'Federal investigators close their file on Hale without action.',
    },
];

/** Offered on the third card of every case. Always the same, always fatal. */
const bribe = (text: string) => ({ text, next: 'bribe' });

const bribeNode = (speaker: string) => ({
    id: 'bribe',
    speaker,
    // He does not react. That is the whole card.
    text: 'I am going to stop you there and I am going to read that back to you before you say anything else, because you should hear it in your own words.\n\nThis interview is recorded. It has been recorded since I told you it was, which was before you sat down.\n\nWe are finished for today.',
    choices: [
        { text: '(say nothing)', effects: GUILTY },
    ],
});

const OPEN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'quarterAtLeast', quarter: 80 },
    // One verdict per campaign. Once you have been cleared or convicted, the
    // other two cases are somebody else's problem.
    { kind: 'noFlag', flag: 'fbiGuilty' },
    { kind: 'noFlag', flag: 'fbiCleared' },
];

// ============================================================================
//  CASE ONE — THE PAYMENTS
// ============================================================================
//  Only reaches a player who was told what the Braga payments were and kept
//  making them. The CFO's arc has been walking towards this since prompt 13.
//
//  THE FACT ESTABLISHED IN CARD TWO: when you found out. Everything in card
//  three hangs off it, and both versions are survivable if you hold them.
// ============================================================================
const FINANCIAL: Condition[] = [
    ...OPEN,
    { kind: 'flag', flag: 'bragaKeptPaying' },
];

export const fbiFinancial: Conversation = {
    id: 'event-fbi-financial',
    channel: 'mail',
    from: 'fbi',
    subject: 'Request for interview, File 24-CR-0891',
    when: FINANCIAL,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'fbi',
            text: 'This office is conducting an inquiry into payments made by your company to a beneficiary in the United Kingdom over a period of thirty-one years.\n\nYou are not the subject of the inquiry. An interview has been scheduled for the fourteenth. You may bring counsel.\n\nThis letter is a courtesy and does not require a reply.',
            choices: [
                { text: 'Attend. Alone.', next: 'q1' },
                { text: 'Attend with counsel.', next: 'q1' },
            ],
        },

        // --- CARD TWO: the fact you commit to -----------------------------
        {
            id: 'q1',
            speaker: 'fbi',
            text: 'Thank you for coming. This is recorded.\n\nThe payments continued for eleven quarters after you became chief executive. I would like to establish when you first understood what they were for.',
            choices: [
                { text: 'When my CFO told me. Last year.', next: 'toldLast' },
                { text: 'I have never been told what they were for.', next: 'neverTold' },
            ],
        },

        // --- CARD THREE, VERSION A ----------------------------------------
        {
            id: 'toldLast',
            speaker: 'fbi',
            // The consistent answer is the uncomfortable one, which is the
            // entire point of these interviews.
            text: 'Your finance director gave us the same date, so we can proceed.\n\nThen I would like to understand the eleven quarters. You knew what the payments were for and you authorised them anyway. Help me with why.',
            choices: [
                { text: 'Because stopping them would have exposed my father.', next: 'verdictClear' },
                // Contradicts the date he just confirmed.
                { text: 'I did not authorise them. They were automatic.', next: 'caught' },
            ],
        },
        // --- CARD THREE, VERSION B ----------------------------------------
        {
            id: 'neverTold',
            speaker: 'fbi',
            text: 'Very well.\n\nI have a note from your finance director recording a meeting in which he says he explained the arrangement to you in full. He is not accusing you of anything. He simply keeps notes.\n\nWould you like to revise your answer?',
            choices: [
                // Revising is allowed and costs nothing. Lying twice is what
                // is fatal, not being wrong once.
                { text: 'Yes. He told me last year.', next: 'revised' },
                { text: 'His note is mistaken.', next: 'caught' },
            ],
        },
        {
            id: 'revised',
            speaker: 'fbi',
            text: 'Noted, and I would rather have it in the second answer than not at all. People misremember dates; it is the second version that interests us, not the first.\n\nOne more and then you can go.',
            choices: [
                { text: 'Ask it.', next: 'lastQuestion' },
                bribe('Is there a way to make this go away?'),
            ],
        },
        {
            id: 'lastQuestion',
            speaker: 'fbi',
            text: 'Did anybody instruct you to continue the payments?',
            choices: [
                { text: 'No. That was mine.', next: 'verdictClear' },
                bribe('Whatever it takes to end this.'),
            ],
        },

        bribeNode('fbi'),

        {
            id: 'caught',
            speaker: 'fbi',
            // He is not triumphant. He is tired, and that is worse.
            text: 'That is the second time this afternoon that your account and the documents have not agreed, and I have to tell you that the second time is different from the first.\n\nI am going to suspend the interview. You will hear from us in writing and I would strongly advise you to have somebody with you when you do.',
            choices: [
                { text: '(say nothing)', effects: GUILTY },
            ],
        },

        {
            id: 'verdictClear',
            speaker: 'fbi',
            text: 'Then we have what we need.\n\nThe file will remain open for administrative purposes and I do not expect to trouble you again. For what it is worth, and it is worth very little: the arrangement you inherited was worse than anything you did about it.',
            choices: [
                { text: '(go home)', effects: CLEARED },
            ],
        },
    ],
};

// ============================================================================
//  CASE TWO — THE ACCOUNT
// ============================================================================
//  Your brother traded before an announcement. He always does. The question is
//  whether you told him, and the honest answer is survivable.
// ============================================================================
const INSIDER: Condition[] = [
    ...OPEN,
    // 'none' rather than 'low', and the difference matters: brotherTrust
    // STARTS at 40, which is already the 'low' band, so gating there would
    // have opened this case for every player in the game from quarter ten.
    // The same mistake the father's morale scene made with 70.
    { kind: 'dialAtMost', dial: 'brotherTrust', band: 'none' },
];

export const fbiInsider: Conversation = {
    id: 'event-fbi-insider',
    channel: 'mail',
    from: 'fbi',
    subject: 'Request for interview, File 24-CR-1140',
    when: INSIDER,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'fbi',
            text: 'This office is examining trading in your company\'s securities in the four days preceding three separate announcements.\n\nOne account is of interest. The account holder shares your surname.\n\nAn interview has been scheduled. You may bring counsel.',
            choices: [
                { text: 'Attend.', next: 'q1' },
                { text: 'Call my brother first.', next: 'calledFirst' },
            ],
        },
        {
            id: 'calledFirst',
            speaker: 'fbi',
            // The letter said nothing about not calling him. It did not need
            // to, and that is the trap - and it is not fatal, only expensive.
            text: 'Before we begin: you telephoned the account holder on the evening of the ninth, for nineteen minutes.\n\nThat is not an offence and I am not suggesting it was. I mention it so that you know I have the log, and so that neither of us wastes an afternoon.',
            choices: [
                { text: 'I did. He is my brother.', next: 'q1' },
                bribe('What would it take to leave him out of this?'),
            ],
        },

        {
            id: 'q1',
            speaker: 'fbi',
            text: 'This is recorded.\n\nIn the week before the announcement, did you discuss the company\'s position with anybody outside the company?',
            choices: [
                { text: 'I discuss the company with my brother constantly.', next: 'constantly' },
                { text: 'No. Nobody outside the company.', next: 'nobody' },
            ],
        },

        {
            id: 'constantly',
            speaker: 'fbi',
            text: 'Thank you. That is a more useful answer than the one I usually get.\n\nThen let me narrow it. In those conversations, did you tell him anything that was not already public?',
            choices: [
                { text: 'Yes, and I should not have.', next: 'verdictClear' },
                // Contradicts "constantly" only if you now claim there was
                // nothing to tell, which the calls make impossible.
                { text: 'We only ever talked about family.', next: 'caught' },
            ],
        },

        {
            id: 'nobody',
            speaker: 'fbi',
            text: 'The account holder telephoned your office eleven times that week and spoke to you on four occasions, for a total of one hour and six minutes.\n\nI will give you the same opportunity I give everybody: would you like to revise that answer?',
            choices: [
                { text: 'Yes. I talk to my brother.', next: 'revised' },
                { text: 'Those calls were personal.', next: 'caught' },
            ],
        },
        {
            id: 'revised',
            speaker: 'fbi',
            text: 'Noted.\n\nAnd in those calls, did you tell him anything that was not already public?',
            choices: [
                { text: 'Yes. I did not think about it.', next: 'verdictClear' },
                bribe('There is a number that ends this. Name it.'),
            ],
        },

        bribeNode('fbi'),

        {
            id: 'caught',
            speaker: 'fbi',
            text: 'That is the second answer this afternoon that the records do not support.\n\nI am suspending the interview. I would like to say one thing that is not part of it: your brother told us everything in forty minutes and he did not have to be asked twice.',
            choices: [
                { text: '(say nothing)', effects: GUILTY },
            ],
        },

        {
            id: 'verdictClear',
            speaker: 'fbi',
            text: 'Then we are done with you, and I will be candid: what you have described is careless rather than criminal, and the difference is entirely that you said it out loud.\n\nYour brother is a separate matter and not one I can discuss.',
            choices: [
                { text: '(go home)', effects: CLEARED },
            ],
        },
    ],
};

// ============================================================================
//  CASE THREE — THE NUMBER
// ============================================================================
//  Only reaches a player who used the number their friend gave them. The mole
//  arc has been waiting for this since prompt 20, and the FBI's own note in
//  mole.ts says the odds of contact rise on the second use rather than the
//  first - this is what they rise towards.
// ============================================================================
const ESPIONAGE: Condition[] = [
    ...OPEN,
    { kind: 'flag', flag: 'moleEngaged' },
];

export const fbiEspionage: Conversation = {
    id: 'event-fbi-espionage',
    channel: 'mail',
    from: 'fbi',
    subject: 'Request for interview, File 24-CR-2207',
    when: ESPIONAGE,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'fbi',
            text: 'This office has arrested an individual in connection with unauthorised access to the systems of a technology company.\n\nThe individual has provided a list of persons who engaged his services. Your company appears on it.\n\nAn interview has been scheduled. You may bring counsel. We would advise it.',
            choices: [
                { text: 'Attend.', next: 'q1' },
                { text: 'Attend with three lawyers.', next: 'q1' },
            ],
        },

        {
            id: 'q1',
            speaker: 'fbi',
            text: 'This is recorded.\n\nHave you ever paid, directly or otherwise, for information about a competitor that was not publicly available?',
            choices: [
                { text: 'Yes. Once.', next: 'yesOnce' },
                { text: 'No.', next: 'no' },
            ],
        },

        {
            id: 'yesOnce',
            speaker: 'fbi',
            // Admitting is survivable, and it is the harder answer, which is
            // the design of all three of these.
            text: 'I appreciate that. Most people take about nine minutes to get there.\n\nWho gave you the contact?',
            choices: [
                { text: 'A friend. He did not know what I would do with it.', next: 'lastQuestion' },
                // Contradicts "yes, once".
                { text: 'I found the number myself.', next: 'caught' },
            ],
        },

        {
            id: 'no',
            speaker: 'fbi',
            text: 'The individual has produced a payment, a date and a device identifier belonging to your company.\n\nWould you like to revise that answer?',
            choices: [
                { text: 'Yes. Once, and I regret it.', next: 'lastQuestion' },
                { text: 'He is lying to reduce his own exposure.', next: 'caught' },
            ],
        },

        {
            id: 'lastQuestion',
            speaker: 'fbi',
            text: 'Last one. Did you receive anything of value from that access?',
            choices: [
                { text: 'Information I would rather not have had.', next: 'verdictClear' },
                bribe('Whatever this costs, I will pay it.'),
            ],
        },

        bribeNode('fbi'),

        {
            id: 'caught',
            speaker: 'fbi',
            text: 'Second time this afternoon.\n\nI am suspending the interview. You should understand that the individual we arrested has been cooperative for three weeks and that nothing you have said today was new to me before you said it.',
            choices: [
                { text: '(say nothing)', effects: GUILTY },
            ],
        },

        {
            id: 'verdictClear',
            speaker: 'fbi',
            text: 'Then that is the file.\n\nThere will be a civil matter and it will be expensive and it is not mine. As far as this office is concerned you have been straight with me, and that is worth more here than most people believe it is.',
            choices: [
                { text: '(go home)', effects: CLEARED },
            ],
        },
    ],
};

// ============================================================================
//  THE POOL
// ============================================================================
//  Once per campaign each. Priority 5: an interview date is not a thing that
//  waits behind two condolence letters.
// ============================================================================
const fbiEvent = (
    id: string,
    conversation: Conversation,
    when: Condition[],
    headline: string,
): GameEvent => ({
    id, when, conversation, headline, chance: 0.25, priority: 5,
});

export const fbiFinancialEvent = fbiEvent('fbi-financial', fbiFinancial, FINANCIAL,
    'Federal investigators are understood to be examining historic payments made by Hale.');
export const fbiInsiderEvent = fbiEvent('fbi-insider', fbiInsider, INSIDER,
    'Regulators are reviewing trading in Hale shares ahead of three announcements.');
export const fbiEspionageEvent = fbiEvent('fbi-espionage', fbiEspionage, ESPIONAGE,
    'An arrest in a corporate intrusion case is said to have produced a client list.');

export const FBI_CONVERSATIONS = [fbiFinancial, fbiInsider, fbiEspionage];
export const FBI_EVENTS = [fbiFinancialEvent, fbiInsiderEvent, fbiEspionageEvent];
