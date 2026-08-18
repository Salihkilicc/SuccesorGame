// src/data/events/corporateOps.ts
//
// ============================================================================
//  CORPORATE MANAGEMENT & OPERATIONS EVENTS
// ============================================================================
//  Rich, recurring operational events covering:
//    1. Plant & Manufacturing Efficiency (COO Dana Whitfield)
//    2. Global Supply Chain & Logistics (COO Dana Whitfield)
//    3. R&D Lab Energy / Architecture Breakthrough (CTO Priya Raman)
//    4. Cloud Infrastructure & Scale Optimization (CTO Priya Raman)
//    5. Corporate Treasury & Reserve Strategy (CFO Arthur Vance)
//    6. Institutional Growth Investor Briefing (CFO Arthur Vance)
//    7. Board ESG & Governance Milestone (Board of Directors)
// ============================================================================

import type { Conversation } from '../../core/story/graph';
import type { Condition } from '../../core/story/conditions';
import type { GameEvent } from '../../core/events/types';

const GROWN: Condition[] = [
    { kind: 'flag', flag: 'fatherDead' },
    { kind: 'quarterAtLeast', quarter: 12 },
];

// ============================================================================
//  1. PLANT THROUGHPUT & AUTOMATION (COO)
// ============================================================================
export const opsPlantEfficiency: Conversation = {
    id: 'event-ops-plant-efficiency',
    channel: 'mail',
    from: 'coo',
    subject: 'OPERATIONS / Q-Review: Line throughput + automation proposal',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Plant 1 and Plant 2 ran at 94% uptime this quarter with near-zero downtime.\n\nWe have a window to either reinvest in robotic assembly tooling or distribute performance bonuses across the floor crews.',
            choices: [
                {
                    text: 'Invest in robotic line automation ({opsAutomationCost}).',
                    effects: [
                        { kind: 'capital', amount: -1_500_000 },
                        { kind: 'brand', amount: 3 },
                        { kind: 'morale', amount: 4 },
                        {
                            kind: 'news',
                            headline: 'Hale upgrades manufacturing line with advanced automation systems.',
                        },
                    ],
                },
                {
                    text: 'Distribute {opsBonusCost} in worker performance bonuses.',
                    effects: [
                        { kind: 'capital', amount: -600_000 },
                        { kind: 'morale', amount: 8 },
                        {
                            kind: 'news',
                            headline: 'Hale operations crew receives quarterly efficiency performance bonus.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const opsPlantEfficiencyEvent: GameEvent = {
    id: 'ops-plant-efficiency',
    when: GROWN,
    chance: 0.18,
    cooldown: 8,
    conversation: opsPlantEfficiency,
    headline: 'Manufacturing analysts report steady productivity gains across Hale plants.',
    priority: 2,
};

// ============================================================================
//  2. GLOBAL SUPPLY CHAIN & LOGISTICS (COO)
// ============================================================================
export const opsSupplyChain: Conversation = {
    id: 'event-ops-supply-chain',
    channel: 'mail',
    from: 'coo',
    subject: 'SUPPLY CHAIN / Freight contract renegotiation window',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'coo',
            text: 'Pacific and European container freight rates have temporarily dropped. Our primary logistics carrier is offering a 2-year locked rate if we commit upfront.',
            choices: [
                {
                    text: 'Lock in 2-year carrier rate ({opsLogisticsCost} commitment).',
                    effects: [
                        { kind: 'capital', amount: -1_200_000 },
                        { kind: 'brand', amount: 2 },
                        {
                            kind: 'news',
                            headline: 'Hale secures multi-year logistics agreement to insulate global shipping costs.',
                        },
                    ],
                },
                {
                    text: 'Stay on dynamic spot rates to preserve cash liquidity.',
                    effects: [],
                },
            ],
        },
    ],
};

export const opsSupplyChainEvent: GameEvent = {
    id: 'ops-supply-chain',
    when: GROWN,
    chance: 0.16,
    cooldown: 10,
    conversation: opsSupplyChain,
    headline: 'Supply chain index highlights favorable component shipping dynamics.',
    priority: 2,
};

// ============================================================================
//  3. R&D EFFICIENCY BREAKTHROUGH (CTO)
// ============================================================================
export const techLabBreakthrough: Conversation = {
    id: 'event-tech-lab-breakthrough',
    channel: 'message',
    from: 'cto',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'The architecture team just hit a major power-efficiency benchmark on our core controller stack. Thermal dissipation is down 22% in lab tests.',
            choices: [
                { text: 'What are our strategic options?', next: 'options' },
            ],
        },
        {
            id: 'options',
            speaker: 'cto',
            text: 'We can fast-track an expedited global patent filing ({techPatentCost}) to block competitors, or publish a landmark technical paper to boost engineering recruitment and brand prestige.',
            choices: [
                {
                    text: 'Expedite global patent filing ({techPatentCost}).',
                    effects: [
                        { kind: 'capital', amount: -800_000 },
                        { kind: 'brand', amount: 4 },
                        {
                            kind: 'news',
                            headline: 'Hale files key patents covering next-generation low-thermal architecture.',
                        },
                    ],
                },
                {
                    text: 'Publish technical paper and open benchmark.',
                    effects: [
                        { kind: 'brand', amount: 5 },
                        { kind: 'morale', amount: 4 },
                        {
                            kind: 'news',
                            headline: 'Hale technical whitepaper receives wide acclaim among hardware engineers.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const techLabBreakthroughEvent: GameEvent = {
    id: 'tech-lab-breakthrough',
    when: GROWN,
    chance: 0.18,
    cooldown: 8,
    conversation: techLabBreakthrough,
    headline: 'Tech journals report promising micro-architecture benchmarks out of Hale labs.',
    priority: 2,
};

// ============================================================================
//  4. CLOUD INFRASTRUCTURE SCALING (CTO)
// ============================================================================
export const techCloudScaling: Conversation = {
    id: 'event-tech-cloud-scaling',
    channel: 'mail',
    from: 'cto',
    subject: 'INFRASTRUCTURE / Telemetry load & distributed cluster upgrade',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cto',
            text: 'Active device telemetry and firmware distribution clusters are hitting peak load thresholds. We should reinforce infrastructure before holiday volume surges.',
            choices: [
                {
                    text: 'Deploy high-availability server clusters ({techCloudCost}).',
                    effects: [
                        { kind: 'capital', amount: -900_000 },
                        { kind: 'brand', amount: 3 },
                        {
                            kind: 'news',
                            headline: 'Hale completes multi-region infrastructure expansion to support device ecosystem.',
                        },
                    ],
                },
                {
                    text: 'Optimize existing cluster cache layers (low cost).',
                    effects: [
                        { kind: 'capital', amount: -150_000 },
                        { kind: 'morale', amount: 2 },
                    ],
                },
            ],
        },
    ],
};

export const techCloudScalingEvent: GameEvent = {
    id: 'tech-cloud-scaling',
    when: GROWN,
    chance: 0.15,
    cooldown: 10,
    conversation: techCloudScaling,
    headline: 'Cloud monitoring reports robust platform stability across Hale service networks.',
    priority: 1,
};

// ============================================================================
//  5. CORPORATE TREASURY STRATEGY (CFO)
// ============================================================================
export const cfoTreasuryYield: Conversation = {
    id: 'event-cfo-treasury-yield',
    channel: 'mail',
    from: 'cfo',
    subject: 'TREASURY / Corporate cash yield and asset allocation report',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'Our corporate cash balances are performing well in short-term liquid sovereign paper. We have generated surplus interest yields that can be allocated.',
            choices: [
                {
                    text: 'Reinvest yields into corporate working capital buffer.',
                    effects: [
                        { kind: 'capital', amount: 500_000 },
                        {
                            kind: 'news',
                            headline: 'Hale treasury management maintains disciplined balance sheet liquidity.',
                        },
                    ],
                },
                {
                    text: 'Direct surplus into ESG & corporate social initiatives.',
                    effects: [
                        { kind: 'brand', amount: 3 },
                        { kind: 'morale', amount: 3 },
                        {
                            kind: 'news',
                            headline: 'Hale announces expanded community science & engineering endowment.',
                        },
                    ],
                },
            ],
        },
    ],
};

export const cfoTreasuryYieldEvent: GameEvent = {
    id: 'cfo-treasury-yield',
    when: GROWN,
    chance: 0.16,
    cooldown: 8,
    conversation: cfoTreasuryYield,
    headline: 'Financial analysts note prudent treasury management at Hale.',
    priority: 2,
};

// ============================================================================
//  6. INSTITUTIONAL INVESTOR BRIEFING (CFO)
// ============================================================================
export const cfoInstitutionalInvestor: Conversation = {
    id: 'event-cfo-institutional-investor',
    channel: 'mail',
    from: 'cfo',
    subject: 'INVESTOR RELATIONS / Tier-1 Sovereign & Growth fund interest',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'Several European growth funds and family offices have initiated coverage on our corporate progress. They are requesting an executive leadership briefing.',
            choices: [
                {
                    text: 'Host private investor symposium & dinner ({cfoInvestorCost}).',
                    effects: [
                        { kind: 'capital', amount: -300_000 },
                        { kind: 'brand', amount: 4 },
                        {
                            kind: 'news',
                            headline: 'Institutional investors express confidence following Hale strategic briefing.',
                        },
                    ],
                },
                {
                    text: 'Direct funds to standard public quarterly filings.',
                    effects: [],
                },
            ],
        },
    ],
};

export const cfoInstitutionalInvestorEvent: GameEvent = {
    id: 'cfo-institutional-investor',
    when: GROWN,
    chance: 0.15,
    cooldown: 12,
    conversation: cfoInstitutionalInvestor,
    headline: 'Buy-side equity analysts increase focus on Hale market positioning.',
    priority: 2,
};

// ============================================================================
//  7. BOARD ESG & GOVERNANCE MILESTONE (BOARD)
// ============================================================================
export const boardEsgMilestone: Conversation = {
    id: 'event-board-esg-milestone',
    channel: 'mail',
    from: 'cfo',
    subject: 'BOARD NOTICE / Corporate governance & sustainability rating update',
    when: GROWN,
    start: 'open',
    nodes: [
        {
            id: 'open',
            speaker: 'cfo',
            text: 'Circulated on behalf of the Governance and Audit Committee.\n\nHale has achieved an AA rating in the global corporate governance benchmark. The Board recommends public acknowledgment.',
            choices: [
                {
                    text: 'Publish governance milestone in annual stakeholder review.',
                    effects: [
                        { kind: 'brand', amount: 3 },
                        {
                            kind: 'news',
                            headline: 'Hale receives top governance recognition from corporate rating agencies.',
                        },
                    ],
                },
                {
                    text: 'Acknowledge internally and stay focused on quarterly execution.',
                    effects: [
                        { kind: 'morale', amount: 2 },
                    ],
                },
            ],
        },
    ],
};

export const boardEsgMilestoneEvent: GameEvent = {
    id: 'board-esg-milestone',
    when: GROWN,
    chance: 0.14,
    cooldown: 12,
    conversation: boardEsgMilestone,
    headline: 'Governance rating agency awards Hale high marks for operational transparency.',
    priority: 1,
};

// ============================================================================
//  EXPORT PACK
// ============================================================================
export const CORPORATE_OPS_CONVERSATIONS = [
    opsPlantEfficiency,
    opsSupplyChain,
    techLabBreakthrough,
    techCloudScaling,
    cfoTreasuryYield,
    cfoInstitutionalInvestor,
    boardEsgMilestone,
];

export const CORPORATE_OPS_EVENTS = [
    opsPlantEfficiencyEvent,
    opsSupplyChainEvent,
    techLabBreakthroughEvent,
    techCloudScalingEvent,
    cfoTreasuryYieldEvent,
    cfoInstitutionalInvestorEvent,
    boardEsgMilestoneEvent,
];
