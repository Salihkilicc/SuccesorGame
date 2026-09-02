// src/core/story/runSuccession.ts
//
// ============================================================================
//  THE HALF THAT WRITES IT DOWN
// ============================================================================
//
//  succession.ts decides what the next generation IS. This is the only file
//  that knows which store holds what, and it is deliberately dumb: every
//  decision in here was already made somewhere with a test on it.
//
//  ---------------------------------------------------------------------------
//  IT IS THE MIRROR OF newGame.ts AND IT IS NOT A MODE OF IT
//  ---------------------------------------------------------------------------
//  `startNewGame` deletes twenty six keys and says, at length, why an exception
//  carved into a wipe is the bug that file exists to end. Adding a
//  `keepTheCompany` flag to it would carve exactly that exception, in exactly
//  that file, and the failure would be silent: one store not covered by the
//  condition and the heir starts with somebody else's laboratory.
//
//  So this touches SIX stores by name and touches nothing else. What it does
//  not mention, it does not change, and that list is the interesting one:
//  capital, products, brand, plant, market, subsidiaries, loans, territory,
//  sponsorships and the board all carry. The heir inherits a going concern
//  with its problems attached, which is the entire point of continuing.
// ============================================================================

import { useIdentityStore } from '../store/useIdentityStore';
import { succeedBoard } from './boardSuccession';
import { useGameStore } from '../store/useGameStore';
import { useStatsStore } from '../store/useStatsStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStoryStore } from '../store/useStoryStore';
import { useMessageStore } from '../store/useMessageStore';
import { CEO_BASE_SALARY_QUARTERLY } from '../market/personalEconomy';
import { PAY_CHANGE_COOLDOWN } from '../market/ceoPay';
import { currentQuarter } from './world';
import { useMailStore } from '../store/useMailStore';
import { SUCCESSION_CONVERSATIONS } from '../../data/story/firstQuarter';
import { CAST } from '../../data/story/cast';
import { planSuccession, type SuccessionPlan } from './succession';
import { divideBelongings } from './inheritance';

/**
 * The first thing anybody says to the new one.
 *
 * Posted here rather than queued as a STORY_BEAT for the same reason the
 * children's messages are: a Conversation is static data and these people are
 * named by the player, so `deliver` would put a cast id on the thread where a
 * real name belongs. See features/love/logic/runHeirs.ts, which does the same
 * two steps for the same reason.
 *
 * WHICH ONE depends on whether anybody else inherited stock. With a sibling it
 * comes from them and it is about the register; alone it comes from the CFO
 * and it is about an empty floor, which is the harder start rather than the
 * easier one.
 */
const postFirstLetter = (plan: SuccessionPlan) => {
    const sibling = plan.siblings[0];

    // ------------------------------------------------------------------
    //  THE HELD ONE COMES FIRST, BECAUSE IT IS THE BIGGER FACT
    // ------------------------------------------------------------------
    //  A sixteen year old walking into a company somebody else has been
    //  running for years is not "you have a sibling on the register", even
    //  when they do. The register is the second thing they need to know and
    //  they can read it off the board screen; who has been signing things is
    //  the thing only a person can tell them.
    // ------------------------------------------------------------------
    const conversation = plan.yearsHeld > 0
        ? SUCCESSION_CONVERSATIONS.held
        : sibling
            ? SUCCESSION_CONVERSATIONS.sibling
            : SUCCESSION_CONVERSATIONS.alone;

    const from = (sibling && plan.yearsHeld === 0)
        ? { id: sibling.id, name: sibling.name, role: 'Your family' }
        : { id: 'cfo', name: CAST.cfo?.name ?? 'The CFO', role: CAST.cfo?.role ?? 'CFO' };

    const opening = conversation.nodes.find(n => n.id === conversation.start);
    const month = useGameStore.getState().currentMonth;

    const messages = useMessageStore.getState();
    messages.sendFromCharacter(from, opening?.text ?? '', month);
    useMessageStore.setState(s => ({
        threads: s.threads.map(t =>
            t.id === from.id ? { ...t, conversationId: conversation.id } : t),
    }));
};

/** Money, written the way a solicitor writes it. */
const money = (n: number): string =>
    '$' + Math.round(n).toLocaleString('en-US');

/**
 * The executor sells what he has to, and then writes to say what he sold.
 *
 * TWO JOBS ON PURPOSE, and they are the same job: the collection changing
 * hands is a fact the player will otherwise learn by counting rows in an
 * inventory screen and noticing that the island is missing. This project has
 * spent months finding numbers that moved with nothing to announce them, and
 * an inheritance is the worst possible place to add another one.
 *
 * The letter is the screen. It names what went, what it raised, what the duty
 * was, and what is left - which is more than a dedicated screen would say and
 * arrives without the player having to go and look.
 */
const settleTheEstate = () => {
    const { useAssetStore } = require('../../features/shopping/store/useAssetStore');
    const owned = useAssetStore.getState().ownedItems as Array<{
        instanceId: string; name: string; marketValue: number;
    }>;
    if (!owned || owned.length === 0) return;

    const division = divideBelongings(owned);
    if (division.sold.length === 0) return;

    useAssetStore.setState({ ownedItems: division.kept } as never);

    // The lumpy remainder. A duty of one billion against a fleet whose
    // cheapest saleable piece is worth six is settled by selling the six, and
    // the difference belongs to the heir rather than to nobody.
    if (division.surplusCash > 0) {
        useStatsStore.setState(s => ({
            money: (s.money || 0) + division.surplusCash,
        } as never));
    }

    const keptValue = division.kept.reduce((sum, i) => sum + (i.marketValue || 0), 0);
    const list = division.sold.map(s => `  ${s.name}: ${money(s.marketValue)}`).join('\n');
    const surplus = division.surplusCash > 0
        ? `\n\nThe sales exceeded the assessment by ${money(division.surplusCash)}. `
        + 'That balance has been paid into your account.'
        : '';

    useMailStore.getState().receiveMail({
        fromName: 'Ashcombe & Reyes, Executors',
        fromEmail: 'estates@ashcombereyes.com',
        subject: 'Settlement of the estate: schedule of disposals',
        body: 'We write to confirm that the duty assessed on your late father\'s '
            + `personal effects, ${money(division.dutyDue)}, has been discharged.\n\n`
            + 'The following were sold at auction to meet it. We took the view that '
            + 'fewer large disposals would serve you better than many small ones.\n\n'
            + `${list}\n\n`
            + `These realised ${money(division.raised)} against the assessment.`
            + surplus
            + `\n\nThe remainder of the collection, ${division.kept.length} pieces `
            + `presently valued at ${money(keptValue)}, passes to you intact and is `
            + 'held in your name from today.\n\nWe are sorry for your loss.',
        atMonth: useGameStore.getState().currentMonth,
        category: 'Primary',
    });
};


/**
 * Hand the company to the heir, and become them.
 *
 * Returns the plan it applied, or null when there was nobody to hand it to -
 * which is not a failure. It is the `diedWithoutAnHeir` branch, and the closing
 * screen simply does not offer the button.
 */
export const runSuccession = (): SuccessionPlan | null => {
    const family = useFamilyStore.getState();
    const stats = useStatsStore.getState() as any;

    const board = (() => {
        try {
            return require('../../features/shareholders/stores/useShareholderStore')
                .useShareholderStore;
        } catch {
            return null;
        }
    })();

    const plan = planSuccession({
        children: (family.children ?? []).map(c => ({
            id: c.id, name: c.name, age: c.age, gender: c.gender,
            // Or the estate the player is SHOWN and the estate they are GIVEN
            // disagree about an illegitimate child.
            legitimate: c.legitimate !== false,
        })),
        designatedSuccessorId: family.designatedSuccessorId ?? null,
        lastName: useIdentityStore.getState().lastName,
        // The partner becomes the surviving parent. Her `stats.age` is the
        // only age this family stores for her.
        survivingParent: family.partner
            ? { name: family.partner.name, age: family.partner.stats?.age ?? 0 }
            : null,
        estate: {
            cash: stats.money ?? 0,
            shares: board?.getState()?.playerShareCount ?? 0,
        },
        generation: family.generation ?? 1,
    });

    if (!plan) return null;

    // ------------------------------------------------------------------
    //  1. YOU ARE SOMEBODY ELSE NOW
    // ------------------------------------------------------------------
    //  The SURNAME does not change hands. useIdentityStore asks for a first
    //  name and holds the family name fixed, which was written for a player
    //  starting a second company and turns out to be exactly right here: the
    //  name on the building is the one thing a succession cannot alter.
    //
    //  `tutorialCompleted` and `endingsSeen` are untouched, deliberately.
    //  They are facts about the person holding the phone, and that person has
    //  not changed.
    // ------------------------------------------------------------------
    useIdentityStore.setState({
        firstName: plan.ceo.firstName,
        gender: plan.ceo.gender,
    });
    useGameStore.setState({ age: plan.ceo.age } as never);

    // ------------------------------------------------------------------
    //  AND THE YEARS THE CHAIR STOOD EMPTY
    // ------------------------------------------------------------------
    //  Zero in the ordinary case. Above zero when the only heir was a child:
    //  the company was held until they turned sixteen, and the calendar has
    //  to move with them or the family reads as having been frozen.
    //
    //  The siblings age here rather than in `planSuccession`, because that
    //  file is pure and this is the one that owns what a store looks like
    //  afterwards. Their SHARES are unaffected - the estate was divided on
    //  the day of the death, whatever year the new one starts reading it.
    // ------------------------------------------------------------------
    if (plan.yearsHeld > 0) {
        useGameStore.setState(g => ({
            currentMonth: (g.currentMonth ?? 1) + plan.yearsHeld * 12,
        }) as never);
    }

    // ------------------------------------------------------------------
    //  2. AND YOU HAVE WHAT YOU INHERITED, WHICH IS NOT WHAT YOU HAD
    // ------------------------------------------------------------------
    //  The heir's personal cash is their slice of the estate rather than the
    //  dead founder's balance. Somebody who continued with the previous
    //  chief executive's private fortune would have inherited nothing and
    //  the siblings would have inherited from a man who still had it.
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    //  AND THE NEW CHIEF EXECUTIVE IS ON THE FOUNDER'S WAGE
    // ------------------------------------------------------------------
    //  Two things, and the second is a bug rather than a decision.
    //
    //  THE PACKAGE DOES NOT INHERIT. The board approved a salary for a
    //  person, not for a chair. A successor who walked into a parent's
    //  maximum package would be paid the ceiling from their first morning
    //  without ever having asked anybody, which is the whole point of
    //  ceoPay.ts arriving through a vote.
    //
    //  AND THE CLOCK HAS TO BE RESET, because `currentQuarter()` is derived
    //  from `age - initialGameState.age` and the new player is SIXTEEN
    //  against a starting age of twenty. So the counter collapses to nearly
    //  zero while `ceoPaySetQuarter` still holds the number from a life that
    //  ran for decades. `quartersSinceChange` comes out NEGATIVE, and the
    //  successor is told to wait a hundred and twenty quarters before they
    //  may set their own pay. Found by reading rather than by playing, which
    //  is the only way anybody was ever going to find it.
    // ------------------------------------------------------------------
    useStatsStore.setState({
        money: plan.cash,
        ceoPayQuarterly: CEO_BASE_SALARY_QUARTERLY,
        ceoPaySetQuarter: currentQuarter() - PAY_CHANGE_COOLDOWN,
    } as never);

    // ------------------------------------------------------------------
    //  3. THE SIBLINGS ARRIVE ON THE REGISTER
    // ------------------------------------------------------------------
    //  The piece everything else was building towards. A share is a seat, so
    //  the children who have been writing to you about the annual report for
    //  twenty years become directors in the company their brother now runs,
    //  using the store that can already remove a chief executive.
    //
    //  `trust` at 40 rather than 50: they start below neutral because they
    //  have just been passed over, and `isHostile` is false because being
    //  disappointed in somebody is not the same as moving against them yet.
    //  Both of those are the board system's own vocabulary, which is the
    //  reason none of this needed inventing.
    // ------------------------------------------------------------------
    if (board) {
        board.setState((st: any) => ({
            playerShareCount: plan.shares,
            members: [
                // ----------------------------------------------------------
                //  AND EVERYBODY ELSE AT THE TABLE HAS CHILDREN TOO
                // ----------------------------------------------------------
                //  The founder became their own child and the siblings
                //  arrived, and Elena Vance sat in the same chair with the
                //  same grudge one generation later. The company outlives
                //  the people; so does the seat.
                //
                //  ONE HEIR PER SEAT, the whole holding. The founder's
                //  ESTATE splits - that is how the siblings arrive and how
                //  control slips - but a director's holding does not, or the
                //  board would double every generation and drown the player
                //  in cousins. See core/story/boardSuccession.ts.
                //
                //  Nobody who left comes back: they are already absent from
                //  this array and nothing here adds a seat.
                //
                //  THE BROTHER'S THREAD ENDS WITH HIM, deliberately. His seat
                //  gets an heir like every other, and that heir has a new id,
                //  so `brother.ts` stops finding him - it degrades to the
                //  story's opening value by design. The arc is written about
                //  a man who was in his father's will, and his child was not.
                // ----------------------------------------------------------
                ...succeedBoard(st.members ?? [], (family.generation ?? 1) + 1),
                ...plan.siblings.map(s => ({
                    id: `DIR_HEIR_${s.id}`,
                    name: s.name,
                    shareCount: s.shares,
                    trait: 'Conservative' as const,
                    trust: 40,
                    relationship: 50,
                    isHostile: false,
                    origin: 'Founder' as const,
                })),
            ],
        }));
        try { board.getState().recalculateBoardMood(); } catch { /* older store */ }
    }

    // ------------------------------------------------------------------
    //  3b. AND THE PREVIOUS ONE'S REPUTATION DOES NOT COME WITH THE CHAIR
    // ------------------------------------------------------------------
    //  `usePlayerStore.reputation` is where the casino, the street and the
    //  police remember you, and it is about a PERSON rather than a company.
    //  Left alone, a thirty year old who has never been anywhere inherits
    //  six hundred points of Macau and the home screen calls her "Known in
    //  Macau" on her first morning.
    //
    //  Found by the title system rather than by reading this file, which is
    //  the argument for putting a fact on the screen: nothing had ever
    //  DISPLAYED that number, so nothing had ever noticed it surviving.
    //
    //  Only `reputation` is cleared. The rest of that store is money, which
    //  useStatsStore owns for this purpose (see step 2), and vitals that
    //  nothing in the current game moves.
    // ------------------------------------------------------------------
    try {
        const { usePlayerStore } = require('../store/usePlayerStore');
        usePlayerStore.setState({
            reputation: { social: 0, street: 0, business: 0, police: 0, casino: 0 },
        });
    } catch { /* player store not ready */ }

    // ------------------------------------------------------------------
    //  4. A FAMILY ONE GENERATION ALONG
    // ------------------------------------------------------------------
    //  The heir has no partner and no children, because they are twenty two
    //  and have been running a company for four days. Their siblings are on
    //  the board rather than in here; their mother is, because she holds no
    //  stock and would otherwise cease to exist at the moment she became the
    //  most interesting person in the family.
    //
    //  `familyReputation` carries. It is the family's standing, not the dead
    //  man's, and it is what the courtship system reads when the new chief
    //  executive starts meeting people.
    // ------------------------------------------------------------------
    useFamilyStore.setState({
        partner: null,
        exPartners: [],
        children: [],
        designatedSuccessorId: null,
        courtshipCooldown: {},
        generation: plan.generation,
        survivingParent: plan.survivingParent,
    } as never);

    // ------------------------------------------------------------------
    //  5. THE PHONE IS THEIRS
    // ------------------------------------------------------------------
    //  Cleared rather than carried, and the reason is one specific bug: a
    //  thread left open is a thread somebody can reply into, and the people
    //  in this inbox were writing to a man who is dead. The CFO's
    //  commiserations about the father, the brother's needling, an
    //  unanswered letter from Pear - every one of them would arrive as a
    //  message addressed to somebody who is not reading it.
    //
    //  `seenScenes` in the story store is NOT cleared, so nothing replays.
    //  That is the safe half of the choice: a scene about the founder's
    //  father must never reach his grandson. Which scenes a successor SHOULD
    //  hear again is a separate piece of writing and gets its own list, the
    //  way the opening act did.
    // ------------------------------------------------------------------
    // NOT `reset()`, and this is the one thing a test caught rather than a
    // reading. `useMessageStore.reset()` restores `initialMessageState`,
    // which SEEDS the head of production congratulating you on the launch.
    // Correct for a new game and absurd for somebody who has just inherited
    // a company with fourteen hundred people in it. An empty inbox is the
    // honest state; the letter below is what goes in it.
    useMessageStore.setState({ threads: [], _hasHydrated: true } as never);
    useMailStore.getState().reset();

    // ------------------------------------------------------------------
    //  AND THEN ONE MESSAGE ARRIVES IN IT
    // ------------------------------------------------------------------
    //  AFTER the reset, obviously, and the ordering is the only fragile
    //  thing in this file: posted before it, the letter would be the one
    //  thing the wipe took.
    //
    //  The first generation opened on a letter from a father. The second
    //  would otherwise open on a quarterly report and silence, which is a
    //  continuation rather than a beginning.
    // ------------------------------------------------------------------
    try {
        postFirstLetter(plan);
    } catch (e) {
        // A missing message store is not a reason to leave the player on
        // the closing screen with a succession half applied.
        console.warn('[succession] first letter not delivered', e);
    }

    // ------------------------------------------------------------------
    //  5b. THE EXECUTOR HAS BEEN THROUGH THE HOUSE
    // ------------------------------------------------------------------
    //  This file has never mentioned the collection, so the one asset class
    //  that should be hardest to keep was the only one passing intact: the
    //  cash was split down to the child and the stock down to the share,
    //  and a thirty billion dollar fleet came through whole and untaxed.
    //
    //  A yacht does not divide, so the duty is raised by SELLING, from the
    //  most valuable down. Which is what an executor does with a bill and a
    //  fortnight, and - without anybody designing it - the better story:
    //  the island and the yacht go, the watches come down. Measured on a
    //  full collection, seven of eighty five pieces cover the duty and
    //  seventy eight arrive, worth four tenths of what they were.
    //
    //  AFTER the mail reset above, for the same reason the first letter is:
    //  posted before it, the solicitor's letter is the one thing the wipe
    //  takes. See core/story/inheritance.divideBelongings.
    // ------------------------------------------------------------------
    try {
        settleTheEstate();
    } catch (e) {
        console.warn('[succession] the estate could not be settled', e);
    }

    // ------------------------------------------------------------------
    //  6. AND THE GAME IS NOT OVER
    // ------------------------------------------------------------------
    //  Last, so that nothing above can throw and leave a run playable with a
    //  half applied succession. If any of it fails, the ending stands and the
    //  player is on the closing screen, which is a bad outcome rather than a
    //  broken one.
    // ------------------------------------------------------------------
    // ------------------------------------------------------------------
    //  AND PEAR FINDS OUT
    // ------------------------------------------------------------------
    //  `succeeded` is what brings him back. He wrote to a twenty six year
    //  old who had just inherited once already, and a second inheritance is
    //  the same opportunity with a bigger number on it. The letter itself
    //  is gated on NOT owning Pear, so a family that bought him gets
    //  silence, which is the reward.
    //
    //  AND THE SEEN MARK COMES OFF. `seenScenes` is deliberately not
    //  cleared by a succession - nothing about the founder should replay -
    //  but this one letter is per GENERATION rather than per save. Without
    //  the removal Pear writes to the second Hale and never to the third,
    //  which would be the one silence in this game that means nothing.
    // ------------------------------------------------------------------
    useStoryStore.getState().raise('succeeded');
    useStoryStore.setState(st => ({
        seenScenes: st.seenScenes.filter(id => id !== 'pear-offer-heir'),
    }));

    useStoryStore.setState({ ending: null } as never);

    if (__DEV__) {
        console.log(`[succession] ${plan.ceo.firstName} takes over, `
            + `${plan.shares} shares, ${plan.siblings.length} siblings on the board`);
    }
    return plan;
};
