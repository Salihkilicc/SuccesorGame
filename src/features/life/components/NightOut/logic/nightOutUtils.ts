import { REGIONAL_NAMES, RegionCode } from '../data/nightOutVenues';

// Mini-Game Jobs
export const NIGHT_JOBS = ['Model', 'Influencer', 'CEO', 'Artist', 'Student', 'Designer', 'DJ', 'Actor', 'Heir/Heiress'];

export const generateMiniGamePartner = (region: RegionCode) => {
    const isMale = Math.random() < 0.5;
    const nameList = isMale ? REGIONAL_NAMES[region].male : REGIONAL_NAMES[region].female;
    const name = nameList[Math.floor(Math.random() * nameList.length)];
    const jobTitle = NIGHT_JOBS[Math.floor(Math.random() * NIGHT_JOBS.length)];

    return {
        name,
        job: { title: jobTitle },
        gender: isMale ? 'male' : 'female'
    };
};

export interface WildNightResult {
    stressChange: number;
    moneyLost: number;
    healthChange: number;
    trustChange: number;
    narrative: string;
    statsDisplay: string[];
    triggerPregnancy: boolean;
}

export const calculateWildNightOutcome = (currentMoney: number, currentTrust: number = 0): WildNightResult => {
    // WILD CALCULATION (High Risk, High Reward: Stress -25, but independent risks)
    const events: string[] = [];
    let moneyCopy = currentMoney;
    let moneyLost = 0;
    let stressChange = -25;
    let healthChange = 0;
    let trustChange = 0;

    // 1. Robbery Risk (7%)
    if (Math.random() < 0.07) {
        // Robbery takes 11% of CURRENT money
        const stolenAmount = Math.floor(moneyCopy * 0.11);

        if (stolenAmount > 0) {
            moneyCopy -= stolenAmount;
            moneyLost += stolenAmount;
            events.push(`Mugged outside club: -$${stolenAmount.toLocaleString()} (11%)`);
        }
    }

    // 2. Disease Risk (7%)
    if (Math.random() < 0.07) {
        healthChange -= 20;
        events.push('Caught a virus: Health -20');
    }

    // 3. Blackmail Risk (7%)
    if (Math.random() < 0.07) {
        const blackmailCost = 50000;
        moneyCopy -= blackmailCost;
        moneyLost += blackmailCost;

        // Business Trust -5
        trustChange -= 5;

        events.push('Scandal leaked: Trust -5 & -$50k');
    }

    // Build narrative and stats
    let narrative = "It was a legendary night...";
    const statsDisplay: string[] = ["Stress -25"];

    // Add narrative based on events
    if (events.some(e => e.includes('Mugged'))) {
        narrative += " until you realized your wallet was gone.";
        const robberyEvent = events.find(e => e.includes('Mugged'));
        if (robberyEvent) {
            // Extract the dollar amount properly
            const match = robberyEvent.match(/\$([0-9,]+)/);
            if (match) {
                statsDisplay.push(`-$${match[1]} (Mugged)`);
            }
        }
    }
    if (events.some(e => e.includes('Health'))) {
        narrative += " but you woke up feeling terrible.";
        statsDisplay.push("Health -20");
    }
    if (events.some(e => e.includes('Scandal'))) {
        narrative += " and someone took compromising photos.";
        statsDisplay.push("Trust -5");
        statsDisplay.push("-$50k (Blackmail)");
    }

    // 4. Pregnancy Risk (7%)
    const triggerPregnancy = Math.random() < 0.07;

    return {
        stressChange,
        moneyLost,
        healthChange,
        trustChange,
        narrative,
        statsDisplay,
        triggerPregnancy
    };
};
