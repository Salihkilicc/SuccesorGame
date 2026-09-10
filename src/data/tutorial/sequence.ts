// src/data/tutorial/sequence.ts
//
// ============================================================================
//  THE FIRST YEAR, AS LOCKS
// ============================================================================
//
//  One entry per moment the father takes the wheel. The words he says are
//  conversations (prompt 11 onwards); these are only the gates that make the
//  player do the thing while he is saying it.
//
//  Every one of them names `canEngage`, and that is the rule rather than a
//  habit: a lock that can be cleared by spending money must not engage when
//  there is none. The audit enforces exactly that shape, and the timed skip
//  covers whatever the audit cannot see.
//
//  Two entries here for now - the ones already specified. The rest arrive
//  with the scenes they belong to, because a lock without its dialogue is a
//  screen that dims and points at a button for no stated reason.
// ============================================================================

import { DIM_HEAVY, type TutorialLock } from '../../core/tutorial/locks';

// ============================================================================
//  WHAT A RESEARCHER COSTS TO HIRE, WRITTEN OUT RATHER THAN IMPORTED
// ============================================================================
//
//  It WAS imported, from features/laboratory/data/laboratoryData, and the
//  reachability audit refused the file: story and tutorial data may not reach
//  outside core/story and data/story. That guard is not incidental, its own
//  comment says what it is for - "the start of dragging zustand and
//  AsyncStorage into an audit script" - and the laboratory module reaches
//  workforce.ts and from there into the stores.
//
//  The cost of the import was quiet and would have been missed: the audit does
//  not fail on it, it DEGRADES. `data/tutorial could not be checked` and the
//  whole folder stops being validated, so a broken lock would have sailed
//  through afterwards. Found because the unreachable count moved 123 -> 124.
//
//  So the number is here, and the copy cannot drift: sequence.test.ts asserts
//  this equals RESEARCHER_ECONOMICS.SALARY_PER_QUARTER, which a test may
//  import because a test is not the audit. A boundary that forbids the import,
//  welded shut by a test, is the established shape for this.
// ============================================================================

/** Flat, up front, out of COMPANY CAPITAL. See useLaboratoryStore. */
export const RESEARCHER_HIRE_PRICE = 30_000;

// ============================================================================
//  WHY THE MORALE THRESHOLD IS NOT 70
// ============================================================================
//
//  It was specified as 70, on the reasoning that 70 is MORALE_ANCHOR - where
//  market pay parks morale - so nearly every player would see the event. The
//  reasoning is right and the number does not work, and it is worth writing
//  down why rather than quietly using a different one.
//
//  MORALE NEVER GOES BELOW 70. It approaches it. The workforce starts at 75
//  and closes 30% of the remaining gap to its wage target each quarter, so on
//  market pay it runs 73.5, 72.5, 71.8, 71.3, 70.9, 70.6, 70.4, 70.3 - an
//  asymptote. Measured over eight quarters in the real tick, not reasoned
//  about. `moraleAtMost: 70` would fire for nobody, ever, which is the exact
//  opposite of the intent.
//
//  72 is the smallest round number that delivers what was actually asked for:
//  it is crossed in the second or third quarter of ordinary play, so the
//  event lands inside the tutorial year for anyone paying the market rate,
//  and it does NOT fire for a player who has already pushed morale up - which
//  is the one group who has earned skipping the lesson.
//
//  Kept as a named constant so the number is in one place and moving it is a
//  decision rather than a search.
// ============================================================================
export const MORALE_EVENT_THRESHOLD = 72;

export const TUTORIAL_SEQUENCE: TutorialLock[] = [
    // ========================================================================
    //  RESEARCH — TRIGGERED BY THE PLAYER, NOT BY THE CALENDAR
    // ========================================================================
    //  FIRST IN THE ARRAY ON PURPOSE, and that needs saying because it looks
    //  like it should be last.
    //
    //  `activeLock` walks this list in order and shows the first unfinished
    //  step whose gate holds. Both of these are gated on a flag the player
    //  raises by OPENING the research page, so they are invisible until then
    //  - a lock nothing has triggered is skipped, not shown.
    //
    //  Which means putting them first costs nothing and buys the thing that
    //  matters: when somebody taps into research in the middle of quarter
    //  one, the lesson they just asked for takes priority over the lesson the
    //  first year was going to give them anyway. Placed at the end, the
    //  marketing step would have won and the research lesson would simply
    //  never have appeared.
    //
    //  And they are NOT gated on the father being alive. Everything else here
    //  is, because the first year is a tutorial with a narrator. This one can
    //  fire in year four, so it is Priya's - see data/story/ctoResearch.ts.
    // ========================================================================
    {
        id: 'rnd-lab',
        highlight: 'rndLab',
        speaker: 'cto',
        instruction: 'Open the laboratory.',
        conversation: 'cto-research',
        // ------------------------------------------------------------------
        //  HIRING ENDS THE WHOLE LESSON, NOT JUST THE STEP AFTER IT
        // ------------------------------------------------------------------
        //  `rndHired` appears in BOTH steps' conditions on purpose. Without
        //  it here, a player who hired somebody and later came back to the
        //  laboratory would be told to open the laboratory - which they are
        //  looking at - because this step had never been marked done.
        //
        //  A lesson ends when the thing it was teaching has been done, not
        //  when its last card happened to be dismissed.
        // ------------------------------------------------------------------
        satisfied: [{
            kind: 'any',
            of: [
                { kind: 'flag', flag: 'rndLabOpened' },
                { kind: 'flag', flag: 'rndHired' },
            ],
        }],
        canEngage: [
            // The trigger. Until the player has opened research at all, this
            // lock does not exist as far as the overlay is concerned.
            { kind: 'flag', flag: 'rndOpened' },
        ],
    },

    {
        // ------------------------------------------------------------------
        //  HIRING IS THE STEP AGAIN, AND THE TRAP IS CLOSED A DIFFERENT WAY
        // ------------------------------------------------------------------
        //  THE HISTORY, because this is a decision being reversed rather than
        //  a gap being filled, and the reasoning that reversed it the first
        //  time was correct.
        //
        //  It began as "hire a researcher". That was taken out because hiring
        //  is expensive and may be the wrong call this quarter: a tutorial has
        //  no business insisting on a purchase, and a player who correctly
        //  decided not to buy was left in front of an instruction they had
        //  already understood and rejected. So it became an `acknowledge`
        //  step - read it, tap it away.
        //
        //  Asked for again, on the grounds that a player who reads past this
        //  never sees a research point and therefore never learns what the
        //  number on that screen is for. That is true, and it is the failure
        //  the acknowledge version trades away.
        //
        //  What makes the demand safe now is `canEngage`, which is way (1) of
        //  the three in core/tutorial/locks.ts: THE LOCK NEVER ENGAGES FOR A
        //  PLAYER WHO CANNOT AFFORD TO CLEAR IT. The old objection was that
        //  the step could be impossible; a step that does not appear when it
        //  would be impossible cannot be.
        //
        //  WHICH PRICE, and it matters. There are two numbers for what a
        //  researcher costs and both are live:
        //
        //      useLaboratoryStore.hireResearchers   flat 30,000, up front
        //      workforce.researcherWage             14,400 at tier 1, scaling
        //
        //  The gate has to use the FIRST, because that is the one the hire
        //  button will refuse the player on. Gating on the wage would let the
        //  lock engage at twenty thousand and then have the purchase fail,
        //  which is the trap arriving by a different door. Imported rather
        //  than typed so the day somebody reconciles the two, this follows.
        //
        //  AND WHICH POCKET, which was got wrong first time and caught by the
        //  test below. `cashAtLeast` reads the player's PERSONAL money, and
        //  LaboratoryScreen pays for this out of `companyCapital` with
        //  `deductCapital`. Gated on cash, a player with a rich company and an
        //  empty wallet would never be taught the lesson, and one with a fat
        //  wallet and a broke company would be taught it and then refused -
        //  the same trap through a third door.
        //
        //  What is still given up: a player who CAN afford one and has
        //  sensibly decided not to is pushed anyway. That is a real cost and
        //  it was weighed rather than missed.
        // ------------------------------------------------------------------
        id: 'rnd-hire',
        highlight: 'rndHire',
        speaker: 'cto',
        instruction: 'Hire a researcher. They are not cheap and the salary does not stop.',
        satisfied: [{ kind: 'flag', flag: 'rndHired' }],
        canEngage: [
            { kind: 'flag', flag: 'rndLabOpened' },
            { kind: 'capitalAtLeast', amount: RESEARCHER_HIRE_PRICE },
        ],
    },

    {
        // ------------------------------------------------------------------
        //  AND THE POINT ITSELF, THE QUARTER IT SHOWS UP
        // ------------------------------------------------------------------
        //  The lesson used to be one line carrying both halves: what a
        //  researcher costs AND what the points do. Two things in one
        //  sentence, read once, in front of a number that was still zero.
        //
        //  Split, each half arrives when it can be seen. The price lands at
        //  the moment of paying it, above. This one waits until somebody is
        //  employed, which means the counter on that screen has moved, which
        //  is the only moment the sentence "points open products" has
        //  anything to point at.
        //
        //  `acknowledge`, and here that IS the right shape: there is nothing
        //  to do with a research point yet, and demanding a spend the quarter
        //  after demanding a hire would be the tutorial taking two purchases
        //  in a row.
        // ------------------------------------------------------------------
        id: 'rnd-points',
        highlight: 'rndPoints',
        speaker: 'cto',
        acknowledge: true,
        instruction: 'That number is not money and you cannot buy your way past it. Points arrive every quarter your people are working, and they are the only thing that changes what this company is able to build.',
        canEngage: [
            { kind: 'flag', flag: 'rndHired' },
        ],
    },

    {
        // ------------------------------------------------------------------
        //  Q1 — BE HEARD
        // ------------------------------------------------------------------
        //  THIS USED TO ASK FOR A PRODUCTION TARGET, and it read as nonsense
        //  on the screen it pointed at. "Nothing in this company is real
        //  until something is being built" - said to a player looking at a
        //  phone that has been in production since before they arrived.
        //
        //  A first lesson has to name something the player can see is
        //  missing, or the tutorial is telling them about a company that is
        //  not the one in front of them. The phone is made and it is sold;
        //  what is actually zero is the marketing budget. Nobody outside the
        //  building knows the thing exists, and that is a real hole with a
        //  real control attached to it.
        //
        //  Same highlight key as before, so the sequence still walks the
        //  player from the department tile into the product card - the
        //  budget lives INSIDE the product, and the instruction carries that
        //  second step because a lock cannot light a control behind a modal.
        // ------------------------------------------------------------------
        //  ---------------------------------------------------------------
        //  AND WHY IT IS TWO STEPS
        //  ---------------------------------------------------------------
        //  The budget lives INSIDE the product sheet, and on iOS a Modal is
        //  presented in its own window above everything in the React tree -
        //  including the overlay mounted at the root of the navigator. One
        //  lock could light the card that opens the sheet or a control
        //  inside it, never both, and in practice the second one not at all:
        //  the hole simply never appeared, which is what "it does not
        //  highlight the marketing" meant.
        //
        //  So the card is step one and the budget row is step two, and the
        //  overlay is rendered inside the sheet as well so it can reach it.
        //  ---------------------------------------------------------------
        id: 'q1-open-product',
        highlight: 'products',
        // His voice, not the manual's. Short because it sits on a dimmed screen
        // for as long as it takes - the argument is in the conversation.
        speaker: 'father',
        // SHORT. It sits on a dimmed screen the player is trying to use, and
        // every extra clause is a sentence read while waiting to be allowed
        // to do the thing. The reasoning is his job, in the conversation.
        instruction: 'Open the product.',
        satisfied: [{ kind: 'flag', flag: 'tutorialProductOpened' }],
        canEngage: [
            // Only in the first year. After that he is either dead or has
            // stopped explaining, and a tutorial that reappears in year three
            // is a bug.
            { kind: 'noFlag', flag: 'fatherDead' },
            // THE ESCAPE. Clearing this step costs money, so it must not
            // engage for a company that has none - see the three ways out in
            // core/tutorial/locks.ts. The opening capital is 2,000,000, so
            // this holds on any ordinary first quarter and stops holding for
            // a player who has already spent their way into trouble.
            { kind: 'capitalAtLeast', amount: 500_000 },
        ],
    },

    {
        // ------------------------------------------------------------------
        //  Q1, STEP TWO — PUT SOMETHING BEHIND IT
        // ------------------------------------------------------------------
        //  Lit from inside the product sheet, which is the only place the
        //  overlay can reach this control. See the note on the step above.
        // ------------------------------------------------------------------
        id: 'q1-marketing',
        highlight: 'marketing',
        speaker: 'father',
        instruction: 'Raise the marketing, then save.',
        satisfied: [{ kind: 'flag', flag: 'tutorialMarketingSet' }],
        canEngage: [
            { kind: 'noFlag', flag: 'fatherDead' },
            // Clearing this one costs money, so it must not engage for a
            // company that has none - the first of the three ways out.
            { kind: 'capitalAtLeast', amount: 500_000 },
        ],
    },

    {
        // ------------------------------------------------------------------
        //  THE MORALE EVENT — the one that would have been a trap
        // ------------------------------------------------------------------
        //  This is the case the whole escape design exists for. "Distribute a
        //  bonus" is cleared by SPENDING, so a company with an empty account
        //  would have been locked out of its own game.
        //
        //  `canEngage` is what stops that: the lock does not appear at all
        //  unless the company can afford the bonus. A player with no cash gets
        //  no lesson here, and no lesson is the correct outcome - the lesson
        //  is about choosing to spend, and there is no choice at zero.
        //
        //  Threshold is 70 on the player's call. Worth knowing: MORALE_ANCHOR
        //  is also 70, which is where market pay naturally parks morale, so
        //  this fires for nearly everyone rather than only for the careless.
        //  That makes it a guaranteed teaching beat rather than a discovery.
        // ------------------------------------------------------------------
        id: 'morale-bonus',
        // Heavier than the default. This one points at a department tile on
        // a plain screen - there is nothing behind the paint the player needs
        // to read, unlike the product and laboratory sheets where the dim was
        // covering the very figures the decision is made from.
        dim: DIM_HEAVY,
        highlight: 'teamMorale',
        // Not "morale is slipping" any more - it is not slipping, it has
        // settled, and telling the player otherwise would be the game
        // describing something they can go and see is untrue.
        speaker: 'father',
        // Not 'slipping' - it has settled, and the player can go and look.
        // A tutorial that describes something they can see is untrue teaches
        // them to stop reading it. fatherMorale.test.ts holds that.
        instruction: 'Pay a bonus. They are on the market rate and doing market work.',
        conversation: 'father-morale',
        satisfied: [{ kind: 'flag', flag: 'tutorialBonusPaid' }],
        canEngage: [
            { kind: 'noFlag', flag: 'fatherDead' },
            // THE ESCAPE. Cannot demand what cannot be paid.
            { kind: 'capitalAtLeast', amount: 250_000 },
            // The trigger itself, which this lock did not have at all - it
            // would have engaged on quarter one regardless of morale.
            { kind: 'moraleAtMost', value: MORALE_EVENT_THRESHOLD },
        ],
    },

    // ========================================================================
    //  SHELVED: Q3 — BEING HEARD
    // ========================================================================
    //  Its lesson moved to the first quarter, where the hole it names is
    //  actually visible: the phone ships from day one with a marketing
    //  budget of zero. Kept here rather than removed because the REASONING
    //  is still the best thing in this file and would be re-derived badly
    //  if it were thrown away - particularly the note on why the escape
    //  clause could not have been demanded by the audit.
    //
    //  It is inert as well as shelved: it waits on `tutorialMarketingSet`,
    //  which the first lock now raises, so `activeLock` would skip it as
    //  already satisfied even if it were still in the array.
    //
    //  Its conversation, father-marketing, is NOT lost. It is a story beat
    //  now (data/story/index.ts) and still arrives in the third quarter,
    //  which is where it belongs - the scene is about share being taken,
    //  and share cannot have been taken in the first quarter.
    //
    //  {
    //      // Time-based rather than triggered by a share number, and that
    //      // is deliberate after the morale threshold: a condition on share
    //      // would need share to actually fall, and a player doing well
    //      // would never see the lesson. Competitors ARE taking share in
    //      // the third quarter of every game - that is what a market with a
    //      // 31% incumbent does.
    //      id: 'q3-marketing',
    //      highlight: 'products',
    //      speaker: 'father',
    //      instruction: 'Put money behind it. A product with no budget is a product nobody has heard of.',
    //      conversation: 'father-marketing',
    //      satisfied: [{ kind: 'flag', flag: 'tutorialMarketingSet' }],
    //      canEngage: [
    //          { kind: 'noFlag', flag: 'fatherDead' },
    //          { kind: 'quarterAtLeast', quarter: 3 },
    //          // THE ESCAPE, and the audit could not have demanded it. Its
    //          // no-escape rule looks for money in `satisfied`, and
    //          // `satisfied` here is a FLAG - which happens to be raised by
    //          // spending. The cost is real and completely invisible to the
    //          // check. See the note in core/tutorial/locks.ts validateLocks.
    //          { kind: 'capitalAtLeast', amount: 500_000 },
    //      ],
    //  },
    {
        // ------------------------------------------------------------------
        //  AND SOMEBODY HAS TO SAY THE WORD RESEARCH FIRST
        // ------------------------------------------------------------------
        //  THE WHOLE RESEARCH LESSON COULD ONLY START IF THE PLAYER HAD
        //  ALREADY FOUND IT. `rnd-lab` is gated on `rndOpened`, which
        //  ResearchScreen raises when it mounts - so the chain waited for
        //  somebody who already knew where to go, and a player who never
        //  wandered in was never told that research existed.
        //
        //  Reported as the laboratory lesson not appearing. The other half of
        //  that was the returning-player check disabling every lock (see
        //  core/newGame.ts); this is the half that was missing even when the
        //  locks were on.
        //
        //  LAST IN THE ARRAY, and gated on marketing being set, so it is the
        //  last thing the first year teaches. The first two lessons are about
        //  the thing the company already sells and this is the first about
        //  what it might sell next, which is the right order to meet them in.
        //
        //  BEHIND THE MORALE STEP specifically, and that is why it is last
        //  rather than merely after marketing. Morale is on a clock: it
        //  crosses the threshold in the second or third quarter and the lesson
        //  is about that moment. Research is on no clock at all - it is as
        //  true in quarter nine as in quarter three - so when both are
        //  available the timed one goes first and this waits.
        //
        //  It is HIS, unlike the three steps it leads into. He is alive here
        //  and it is his company; Priya takes over the moment the laboratory
        //  is open, which is where she has been waiting - see
        //  data/story/ctoResearch.ts.
        //
        //  No `canEngage` on money. Opening a page costs nothing, and a
        //  company with no cash is the one that most needs to know what the
        //  laboratory is for.
        // ------------------------------------------------------------------
        id: 'q1-research',
        highlight: 'rndDepartment',
        instruction: 'Open research. Nothing this company sells was new when I arrived.',
        satisfied: [{ kind: 'flag', flag: 'rndOpened' }],
        canEngage: [
            { kind: 'noFlag', flag: 'fatherDead' },
            { kind: 'flag', flag: 'tutorialMarketingSet' },
        ],
    },
];
