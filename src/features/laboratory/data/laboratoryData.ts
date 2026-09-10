// Laboratory facility tiers and researcher economics

// ============================================================================
//  THE FIVE BUILDINGS SPEAK TURKISH NOW
// ============================================================================
//
//  `name` and `description` were plain English strings and LaboratoryScreen
//  renders all three of them straight - the building's name, its one-line
//  description, and the next tier's name inside the upgrade button. Three
//  English lines on a screen the tutorial now walks every player into.
//
//  Reported as "argede cevrilmeyen yazolar var", and scripts/untranslated.js
//  cannot see them: it reads Text children and naming props out of the .tsx
//  files, and these arrive there through a variable from a .ts one. Same
//  blind spot that hid the magnates' lines and the one product name in
//  unlockableProductsData.
//
//  GETTERS, not values, and that is the pattern the product catalogue
//  already uses (see unlockableProductsData.ts). A value would be read once
//  at module load, in whatever language was active then, and would not
//  change when the player switches language in Settings. A getter is
//  evaluated at the moment the screen paints.
// ============================================================================

import { t } from '../../../core/i18n';

export interface FacilityTier {
    tier: number;
    name: string;
    icon: string;
    capacity: number;
    upgradeCost: {
        cash: number;
        rp: number;
    } | null; // null for tier 1 (default)
    description: string;
}

// NOT: laboratuvar yukseltmelerinin RP maliyetleri, urun ve fabrika
// merdivenleriyle AYNI olcege tasindi. Once eski (71 kat kucuk) olcekte
// kalmislardi ve laboratuvar buyutmek anlamsiz derecede ucuzdu.
//
// DIKKAT: bu dosyadaki FACILITY_TIERS, core/market/capacity.ts icindeki
// ayni isimli URETIM tesisi merdiveniyle KARISTIRILMAMALI. Bu laboratuvar
// binasi; o uretim hatti.
export const FACILITY_TIERS: FacilityTier[] = [
    {
        tier: 1,
        get name() { return t('lab.tierCorporateAnnex'); },
        icon: '🏢',
        capacity: 500,
        upgradeCost: null,
        get description() { return t('lab.tierCorporateAnnexDesc'); },
    },
    {
        tier: 2,
        get name() { return t('lab.tierInnovationPlaza'); },
        icon: '🏛️',
        capacity: 2500,
        upgradeCost: {
            cash: 50_000_000, // $50M
            rp: 357_000,
        },
        get description() { return t('lab.tierInnovationPlazaDesc'); },
    },
    {
        tier: 3,
        get name() { return t('lab.tierAdvancedTechCenter'); },
        icon: '🏗️',
        capacity: 8000,
        upgradeCost: {
            cash: 250_000_000, // $250M
            rp: 7_140_000,
        },
        get description() { return t('lab.tierAdvancedTechCenterDesc'); },
    },
    {
        tier: 4,
        get name() { return t('lab.tierFutureCampus'); },
        icon: '🌆',
        capacity: 15000,
        upgradeCost: {
            cash: 10_000_000_000, // $10B
            rp: 22_800_000,
        },
        get description() { return t('lab.tierFutureCampusDesc'); },
    },
    {
        tier: 5,
        get name() { return t('lab.tierGlobalSiliconHQ'); },
        icon: '🏙️',
        capacity: 36000,
        upgradeCost: {
            cash: 25_000_000_000, // $25B
            rp: 71_400_000,
        },
        get description() { return t('lab.tierGlobalSiliconHQDesc'); },
    },
];

// Researcher economics
// ============================================================================
//  ARASTIRMACI EKONOMISI
// ============================================================================
//  ESKIDEN: kisi basi 500.000 dolar SABIT maas, 100'luk partiler halinde
//  ise alim. Oyuncunun ceyreklik kari 800.000 dolarken tek bir parti
//  50 milyon dolara mal oluyordu. Ar-Ge fiilen kapaliydi.
//
//  SIMDI: maas uretim personelinin piyasa maasina bagli (uzman oldugu
//  icin katli). Boylece sirket buyudukce Ar-Ge de olceklenir.
//  Bkz. core/market/workforce.ts -> researcherWage
//
//  SALARY_PER_QUARTER sadece GERIYE DONUK uyum icin duruyor; motorun
//  gercekten tahsil ettigi tutar workforce.ts'ten gelir.
// ============================================================================
import { researchOutput } from '../../../core/market/workforce';

export const RESEARCHER_ECONOMICS = {
    /** ESKI ALAN — gercek maas core/market/workforce.ts -> researcherWage */
    SALARY_PER_QUARTER: 30_000,
    /**
     * SHELVED — a second formula for a number the engine already computes.
     *
     * The screen multiplied headcount by this and showed the result as
     * "Target Output". The engine awards `researchOutput(n)` - 600 x n^0.85,
     * with diminishing returns - so the header understated what a researcher
     * produces by between thirty and sixty times:
     *
     *      1 researcher    shown      10    actually     600
     *     10 researchers   shown     100    actually   4,247
     *    100 researchers   shown   1,000    actually  30,071
     *
     * Which is the one number a player reads before deciding whether to hire,
     * and it told them the answer was no.
     *
     * Kept as a note rather than deleted so nobody reintroduces a per-head
     * constant: research does not scale linearly on purpose, and a flat rate
     * per person cannot express that.
     *
     *   RP_OUTPUT_PER_QUARTER: 10,
     */
    /** 100'luk parti sinirI kaldirildi; tek tek de alinabilir */
    HIRE_INCREMENT: 1,
};

// Helper functions
export const getFacilityByTier = (tier: number): FacilityTier | undefined => {
    return FACILITY_TIERS.find(f => f.tier === tier);
};

export const getNextTier = (currentTier: number): FacilityTier | null => {
    return FACILITY_TIERS.find(f => f.tier === currentTier + 1) || null;
};

export const calculateQuarterlyCost = (researcherCount: number): number => {
    return researcherCount * RESEARCHER_ECONOMICS.SALARY_PER_QUARTER;
};

/**
 * What a research team produces in a quarter.
 *
 * Delegates rather than calculates. It used to hold its own arithmetic and
 * disagreed with the engine by a factor of forty; a display formula that is
 * not the engine's formula is a lie with a nice font.
 */
export const calculateQuarterlyRP = (researcherCount: number): number =>
    researchOutput(researcherCount);
