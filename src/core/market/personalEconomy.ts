// src/core/market/personalEconomy.ts
//
// ============================================================================
//  WHAT THE PLAYER PERSONALLY EARNS AND SPENDS
// ============================================================================
//
//  There were THREE numbers for one salary and none of them agreed.
//
//    useStatsStore          `monthlyIncome: 8_000`, commented "Kurucu maasi"
//    useGameStore:331       `stats.monthlyIncome || 5000`
//    EconomyEngine:10       `const baseSalary = 45000` - quarterly
//
//  The third is the one that moves money. The first two are inert in a way
//  worth spelling out, because it is a shape this codebase keeps producing:
//  the quarter reads `monthlyIncome`, writes the same value straight back to
//  the store, and hands it out as `result.data.playerIncome`. A field that
//  copies itself forever and is then given to nobody - the only consumer of
//  `playerIncome` is a native bridge interface that is never called.
//
//  So the game had a salary the player could see the name of and never the
//  amount of, and a different salary that was actually paid.
//
//  ---------------------------------------------------------------------------
//  AND WHY THE UNITS ARE IN THE NAMES
//  ---------------------------------------------------------------------------
//  `monthlyIncome` held 8,000 while the engine paid 45,000 a QUARTER. Anybody
//  reconciling those two would have been out by a factor of three before they
//  started. This is the same fault that made the buyout comparison meaningless
//  - two quantities, one name, two units - so every constant here says which
//  it is, and the conversion happens in one place.
//
//  ---------------------------------------------------------------------------
//  WHAT THIS IS NOT
//  ---------------------------------------------------------------------------
//  This is the LIFE economy: a salary, a roof, and what it costs to be the
//  sort of person who runs a company. It is deliberately flat. It does not
//  scale with the business and it is not supposed to, because the levers that
//  do scale are elsewhere and each one costs something:
//
//    the CEO bonus     core/market/compensation.ts, 4% of the year's profit
//    a dividend        pays EVERY shareholder, including the family you are
//                      trying to buy out
//    selling shares    raises cash by giving up the thing you wanted cash for
//
//  Nobody buys out a sibling on a salary, and they are not meant to. See
//  core/market/buyoutFinancing.ts for what pays for that instead.
//
//  PURE. No stores. The education multiplier and the tuition bill are passed
//  in, because they belong to a system this file has no business knowing.
// ============================================================================

/** Four quarters to a year, three months to a quarter. Written once. */
export const MONTHS_PER_QUARTER = 3;

/**
 * The founder's own pay, per QUARTER, before education.
 *
 * Flat for the whole run. A CEO who cannot set their own salary is a gap -
 * `salaryRatio` exists for every employee and nothing exists for the player -
 * but a fixed number that is honest beats three that disagree, and the fix for
 * that gap is a decision the board should get to vote on rather than a
 * constant.
 */
export const CEO_BASE_SALARY_QUARTERLY = 45_000;

/** A roof, per QUARTER. */
export const HOUSING_COST_QUARTERLY = 20_000;

/** Being the sort of person who runs a company, per QUARTER. */
export const LIFESTYLE_COST_QUARTERLY = 10_000;

/** Personal income tax. Flat, because a bracket table would imply precision. */
export const PERSONAL_TAX_RATE = 0.20;

/** Quarterly yield on a holding, by what kind of thing it is. */
export const PORTFOLIO_YIELD_QUARTERLY = {
    stock: 0.005,
    fund: 0.003,
    /** Bonds pay a coupon off face value, so they are worked out separately. */
    bond: 0,
    crypto: 0,
} as const;

export type PersonalIncomeInput = {
    /** From the education system. 1.0 with no degree. */
    educationMultiplier: number;
    /**
     * What the player has set their own pay to, per QUARTER.
     *
     * Omitted means the base. It is passed in rather than read here because
     * whether the player may set it at all is a board decision, and this file
     * has no business knowing about boards. See core/market/ceoPay.ts.
     */
    ceoPayQuarterly?: number;
    /**
     * The most the company can carry, per QUARTER. From ceoPay.payCeiling.
     *
     * Passed in and applied HERE rather than only at the moment the pay is
     * set, for two reasons that are really one:
     *
     *   Education multiplies the salary, and it multiplies by up to SIX. A
     *   capped number multiplied afterwards is not capped, so a player with
     *   all three degrees sitting at the ceiling was paid six times what the
     *   board had approved - twelve per cent of revenue instead of two.
     *
     *   And a ceiling only checked on the way in is a ceiling that stops
     *   applying the moment revenue falls. A company whose sales collapse
     *   would go on paying the salary of the company it used to be.
     *
     * Omitted means uncapped, which is what the tests of the life economy
     * alone want.
     */
    payCeilingQuarterly?: number;
    /** Dividends and coupons, per QUARTER, already summed. */
    portfolioIncomeQuarterly: number;
};

export type PersonalExpenseInput = {
    /** Tuition this quarter, from the education system. */
    educationCostQuarterly: number;
    /** What a partner costs, per QUARTER. */
    partnerCostQuarterly: number;
};

export type PersonalQuarter = {
    salary: number;
    portfolioIncome: number;
    totalIncome: number;

    tax: number;
    housing: number;
    lifestyle: number;
    education: number;
    partner: number;
    totalExpenses: number;

    netFlow: number;
};

/**
 * One quarter of the player's own finances.
 *
 * The single source. `EconomyEngine` builds its report off this and the
 * quarter tick writes the SAME figures into the store, so the number on the
 * screen and the number in the field cannot drift apart again.
 */
export const personalQuarter = (
    income: PersonalIncomeInput,
    expenses: PersonalExpenseInput,
): PersonalQuarter => {
    const multiplier = Number.isFinite(income?.educationMultiplier)
        ? Math.max(0, income.educationMultiplier)
        : 1;

    const basePay = Number.isFinite(income?.ceoPayQuarterly)
        ? Math.max(0, income!.ceoPayQuarterly!)
        : CEO_BASE_SALARY_QUARTERLY;
    // A degree gets you TO the number faster. It does not raise the roof.
    const uncapped = basePay * multiplier;
    const ceiling = Number.isFinite(income?.payCeilingQuarterly)
        ? Math.max(0, income!.payCeilingQuarterly!)
        : Infinity;
    const salary = Math.min(uncapped, ceiling);
    const portfolioIncome = Math.max(0, income?.portfolioIncomeQuarterly || 0);
    const totalIncome = salary + portfolioIncome;

    // Tax is on income rather than on the salary alone, which is why it sits
    // with the expenses: it is the largest of them at every point in the game.
    const tax = totalIncome * PERSONAL_TAX_RATE;
    const education = Math.max(0, expenses?.educationCostQuarterly || 0);
    const partner = Math.max(0, expenses?.partnerCostQuarterly || 0);

    const totalExpenses = HOUSING_COST_QUARTERLY
        + LIFESTYLE_COST_QUARTERLY
        + partner
        + education
        + tax;

    return {
        salary,
        portfolioIncome,
        totalIncome,
        tax,
        housing: HOUSING_COST_QUARTERLY,
        lifestyle: LIFESTYLE_COST_QUARTERLY,
        education,
        partner,
        totalExpenses,
        netFlow: totalIncome - totalExpenses,
    };
};

/**
 * The same figures as a MONTHLY rate.
 *
 * `useStatsStore.monthlyIncome` and `monthlyExpenses` say monthly in their
 * names and were holding numbers nobody had converted. They are written from
 * here now, so the name is true.
 */
export const asMonthly = (quarterly: number): number =>
    (quarterly || 0) / MONTHS_PER_QUARTER;
