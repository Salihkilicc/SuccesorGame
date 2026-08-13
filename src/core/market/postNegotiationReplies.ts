// src/core/market/postNegotiationReplies.ts
//
// ============================================================================
//  TURNING A RESOLVED OFFER INTO A LETTER IN THE INBOX
// ============================================================================
//
//  The third file in the same three-way split the story uses: negotiation.ts
//  decides (pure), useNegotiationStore remembers (persisted), and this one
//  touches the app. Called once a quarter from the tick.
//
//  WHY THE REPLY IS MAIL RATHER THAN A CONVERSATION. The story's conversation
//  runner is the better machine - it validates, it audits, the graph is
//  checked - and it cannot be used here for one reason: a `Conversation` is
//  STATIC DATA. Its text is written at author time. A reply that has to name a
//  company, quote a premium the player has never seen before and repeat a
//  number the negotiator picked from a resistance score cannot be static, and
//  faking it with placeholders would put a templating language inside a data
//  file that the whole story system exists to keep free of them.
//
//  So the letter is generated, and the price of that is real: the audit cannot
//  read these the way it reads a scene. What it gets instead is the test file
//  next to this one, which plays every personality through every subject.
// ============================================================================

import { useMailStore } from '../store/useMailStore';
import { useNegotiationStore } from '../store/useNegotiationStore';
import { useGameStore } from '../store/useGameStore';
import { currentQuarter } from '../story/world';
import { negotiatorFor } from '../../data/market/negotiators';
import { type Offer, type Demand } from './negotiation';
import { HOSTILE_MULTIPLE } from './mergers';
import { INITIAL_MARKET_ITEMS } from '../../features/assets/data/marketData';

const pct = (r: number) => `${Math.round(r * 100)}%`;

/** The one line that states what they want, in plain terms. */
export const demandLine = (demand: Demand): string => {
    switch (demand.kind) {
        case 'none':
            return '';
        case 'seat':
            return 'CONDITION: a seat on your board.';
        case 'reputation':
            return `CONDITION: your public standing at ${demand.floor} or better on the day of signing.`;
        case 'price':
            return `CONDITION: ${pct(demand.extraPremium)} above the customary premium.`;
    }
    const never: never = demand;
    throw new Error(`Unhandled demand: ${JSON.stringify(never)}`);
};

/**
 * Only for the SENDER NAME on the envelope.
 *
 * The reply itself resolves against `offer.risk`, frozen when the letter was
 * sent, so a company whose rating moves between writing and hearing back does
 * not change the answer. This lookup exists because the mail needs a name and
 * the offer does not carry one.
 */
const riskOf = (targetId: string): string =>
    (INITIAL_MARKET_ITEMS as any[]).find(i => i.id === targetId)?.risk ?? 'Medium';

export const bodyFor = (offer: Offer): string => {
    const n = negotiatorFor(offer.targetId, offer.risk ?? riskOf(offer.targetId));
    if (!offer.reply) return '';

    if (offer.reply.kind === 'refuse') {
        return [
            n.lines.refuseLine,
            '',
            // ALWAYS TOLD, EVEN IN THE REFUSAL. The rude route being open is
            // not a secret, and stating its price here is what lets a refusal
            // be weighed rather than merely suffered.
            //
            // IT USED TO QUOTE `hostilePremiumFor(offer.score)`, which the
            // engine no longer charges - so the letter was the third place
            // this game printed a hostile price that was not the hostile
            // price. One number, everywhere. See HOSTILE_MULTIPLE.
            `— A tender directly to their shareholders would clear at ${HOSTILE_MULTIPLE}x market.`,
        ].join('\n');
    }

    if (offer.reply.kind === 'accept') {
        return `${n.lines.engage}\n\n${n.lines.met}`;
    }

    const d = offer.reply.demand;
    if (d.kind === 'none') {
        // The partnership and notice routes, which never produce a plain yes.
        return `${n.lines.engage}\n\n${n.lines.demandLine}`;
    }
    return [n.lines.engage, '', n.lines.demandLine, '', demandLine(d)].join('\n');
};

const senderEmail = (offer: Offer): string =>
    `office@${offer.targetId.replace(/^[a-z]+_/, '')}.com`;

const subjectLine = (offer: Offer): string => {
    switch (offer.subject) {
        case 'purchase': return `RE: Offer to acquire ${offer.targetName}`;
        case 'merger': return `RE: Proposal — merger of equals`;
        case 'partnership': return `RE: Commercial partnership`;
        case 'notice': return `RE: Notice of intent`;
    }
};

/**
 * Answer every offer that has waited its quarter.
 *
 * Returns the offers it posted, so the tick's test can assert on them without
 * reading the mail store.
 */
export const postDueReplies = (): Offer[] => {
    const quarter = currentQuarter();
    const answered = useNegotiationStore.getState().resolveDue(quarter);
    if (!answered.length) return [];

    const month = useGameStore.getState().currentMonth;
    for (const offer of answered) {
        const n = negotiatorFor(offer.targetId, offer.risk ?? riskOf(offer.targetId));
        useMailStore.getState().receiveMail({
            fromName: n.name,
            fromEmail: senderEmail(offer),
            subject: subjectLine(offer),
            body: bodyFor(offer),
            atMonth: month,
            category: 'Primary',
            negotiationId: offer.status === 'open' ? offer.id : undefined,
        });
    }
    return answered;
};
