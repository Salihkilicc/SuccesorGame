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
import { useGameStore } from '../store/useGameStore';
import { useStatsStore } from '../store/useStatsStore';
import { useFamilyStore } from '../store/useFamilyStore';
import { useStoryStore } from '../store/useStoryStore';
import { useMessageStore } from '../store/useMessageStore';
import { useMailStore } from '../store/useMailStore';
import { SUCCESSION_CONVERSATIONS } from '../../data/story/firstQuarter';
import { CAST } from '../../data/story/cast';
import { planSuccession, type SuccessionPlan } from './succession';

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
    const conversation = sibling
        ? SUCCESSION_CONVERSATIONS.sibling
        : SUCCESSION_CONVERSATIONS.alone;

    const from = sibling
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
        })),
        designatedSuccessorId: family.designatedSuccessorId ?? null,
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
    //  2. AND YOU HAVE WHAT YOU INHERITED, WHICH IS NOT WHAT YOU HAD
    // ------------------------------------------------------------------
    //  The heir's personal cash is their slice of the estate rather than the
    //  dead founder's balance. Somebody who continued with the previous
    //  chief executive's private fortune would have inherited nothing and
    //  the siblings would have inherited from a man who still had it.
    // ------------------------------------------------------------------
    useStatsStore.setState({ money: plan.cash } as never);

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
                ...st.members,
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
    //  6. AND THE GAME IS NOT OVER
    // ------------------------------------------------------------------
    //  Last, so that nothing above can throw and leave a run playable with a
    //  half applied succession. If any of it fails, the ending stands and the
    //  player is on the closing screen, which is a bad outcome rather than a
    //  broken one.
    // ------------------------------------------------------------------
    useStoryStore.setState({ ending: null } as never);

    if (__DEV__) {
        console.log(`[succession] ${plan.ceo.firstName} takes over, `
            + `${plan.shares} shares, ${plan.siblings.length} siblings on the board`);
    }
    return plan;
};
