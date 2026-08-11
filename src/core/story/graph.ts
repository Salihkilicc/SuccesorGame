// src/core/story/graph.ts
//
// ============================================================================
//  WHAT A CONVERSATION IS
// ============================================================================
//
//  A graph of cards. Each card is someone speaking and at most two answers;
//  each answer points at another card or at nothing, and may carry effects.
//  That is the whole model, and it is deliberately small - a shape this plain
//  can be written quickly, read by a stranger, and CHECKED BY A MACHINE.
//
//  The last one is why the shape matters more than it looks. `validate` below
//  is what stops this becoming spaghetti: broken links, orphan cards and cards
//  that trap the player are all findable by walking the data, and they are all
//  invisible by reading it - a scene with a dead link looks finished.
//
//  ---------------------------------------------------------------------------
//  NO CODE IN HERE, AND NONE IN THE DATA
//  ---------------------------------------------------------------------------
//  This file imports the effect and condition TYPES and nothing else. It knows
//  nothing about React, stores or the screen. A conversation is a value: it
//  can be written in a data file, printed, diffed, and validated by a script
//  with no app around it.
//
//  ---------------------------------------------------------------------------
//  TERMINAL CARDS ARE NORMAL. LOCKED CARDS ARE NOT.
//  ---------------------------------------------------------------------------
//  A card with no choices means the other person had the last word - the
//  conversation ends and the player closes it. That is not a trap and the
//  audit leaves it alone.
//
//  A trap is a card whose every choice is GATED, because at runtime all of
//  them can fail their condition at once and leave a card with no buttons.
//  The runner refuses to hang - it always offers a way out - but the audit
//  still complains, because a card meant to pose a decision that silently
//  offers only "Close" is a writing bug even when it does not freeze anything.
// ============================================================================

import type { Effect } from './effects';
import type { Condition } from './conditions';

export type Channel = 'message' | 'mail';

export type Choice = {
    /** The button. Keep it short - it is a thing a person would actually say. */
    text: string;
    /**
     * Where it goes. Undefined ENDS the conversation, which is how "you cut
     * them off" is written: no target, and the window closes.
     */
    next?: string;
    /** What it does. From the closed list in effects.ts. */
    effects?: Effect[];
    /**
     * Only offer this answer when all of these hold.
     *
     * Use sparingly. A card where EVERY choice is gated can end up with no
     * answers available, and the audit flags that - see the note above.
     */
    when?: Condition[];
};

export type StoryNode = {
    id: string;
    /** Cast id. Prompt 3 turns these into real characters; today it is a name. */
    speaker: string;
    text: string;
    /** At most two. Zero means they had the last word. */
    choices?: Choice[];
};

export type Conversation = {
    id: string;
    /** Which app it arrives in. The runner is the same either way. */
    channel: Channel;
    from: { id: string; name: string; role: string };
    /** Mail has a subject line; a message does not. */
    subject?: string;
    /** When this may fire at all. */
    when?: Condition[];
    /** The first card. */
    start: string;
    nodes: StoryNode[];
};

// ---------------------------------------------------------------------------
//  VALIDATION — the thing that keeps this honest
// ---------------------------------------------------------------------------

export type GraphProblem = {
    conversation: string;
    node?: string;
    kind:
    | 'duplicate-node'
    | 'missing-start'
    | 'broken-link'
    | 'unreachable'
    | 'too-many-choices'
    | 'all-choices-gated';
    detail: string;
};

/**
 * Walk one conversation and report everything wrong with it.
 *
 * Pure, and takes the conversation as a value, so the audit script can call it
 * over a data file with no app running - which is the only way a check like
 * this actually gets run.
 */
export const validate = (c: Conversation): GraphProblem[] => {
    const problems: GraphProblem[] = [];
    const at = (kind: GraphProblem['kind'], detail: string, node?: string) =>
        problems.push({ conversation: c.id, node, kind, detail });

    // --- ids must be unique, or a link means two different things
    const seen = new Set<string>();
    for (const n of c.nodes) {
        if (seen.has(n.id)) at('duplicate-node', `two nodes share the id "${n.id}"`, n.id);
        seen.add(n.id);
    }

    if (!seen.has(c.start)) {
        at('missing-start', `start "${c.start}" is not a node in this conversation`);
        // Everything below would be noise without an entry point.
        return problems;
    }

    // --- links must land somewhere real
    for (const n of c.nodes) {
        const choices = n.choices ?? [];
        if (choices.length > 2) {
            at('too-many-choices', `${choices.length} choices; two is the limit`, n.id);
        }
        for (const ch of choices) {
            if (ch.next !== undefined && !seen.has(ch.next)) {
                at('broken-link', `"${ch.text}" points at "${ch.next}", which does not exist`, n.id);
            }
        }
        // --- a card that can offer nothing
        if (choices.length > 0 && choices.every(ch => (ch.when ?? []).length > 0)) {
            at(
                'all-choices-gated',
                'every answer is conditional, so the player can arrive at a card with no answers',
                n.id,
            );
        }
    }

    // --- every card must be enterable
    const reachable = new Set<string>([c.start]);
    const queue = [c.start];
    while (queue.length) {
        const id = queue.shift()!;
        const node = c.nodes.find(n => n.id === id);
        for (const ch of node?.choices ?? []) {
            if (ch.next && seen.has(ch.next) && !reachable.has(ch.next)) {
                reachable.add(ch.next);
                queue.push(ch.next);
            }
        }
    }
    for (const n of c.nodes) {
        if (!reachable.has(n.id)) {
            at('unreachable', 'written, but nothing leads here', n.id);
        }
    }

    return problems;
};

export const validateAll = (list: Conversation[]): GraphProblem[] => {
    const problems = list.flatMap(validate);
    // Conversation ids are referenced from outside (a thread points at one),
    // so a duplicate there is worse than a duplicate node.
    const seen = new Set<string>();
    for (const c of list) {
        if (seen.has(c.id)) {
            problems.push({
                conversation: c.id,
                kind: 'duplicate-node',
                detail: 'two conversations share this id',
            });
        }
        seen.add(c.id);
    }
    return problems;
};

/** The card the runner should show, or undefined if the id is bad. */
export const nodeById = (c: Conversation, id: string): StoryNode | undefined =>
    c.nodes.find(n => n.id === id);
