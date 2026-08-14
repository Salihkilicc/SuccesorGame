// src/core/news/newsEngine.ts
import { useStatsStore } from '../store/useStatsStore';
import { useNewsStore, NewsPayload } from '../store/useNewsStore';
import { useProductStore } from '../store/useProductStore';
import { useCorporateFinanceStore } from '../../features/finance/stores/useCorporateFinanceStore';
import {
  SILICON_NEWS_POOL,
  SPECIAL_NEWS_POOL,
  LIVING_WORLD_NEWS_POOL,
  PEAR_RIVAL_NEWS_POOL,
  NewsTier,
  NewsSpecialCondition,
  NewsTemplate,
} from '../../data/news/siliconNewsPool';

export { SILICON_NEWS_POOL, SPECIAL_NEWS_POOL, LIVING_WORLD_NEWS_POOL, PEAR_RIVAL_NEWS_POOL };
export type { NewsTemplate, NewsTier, NewsSpecialCondition };

/**
 * Randomly samples `count` distinct elements from an array using Fisher-Yates shuffle.
 */
const sampleRandomItems = <T>(items: T[], count: number): T[] => {
  if (!items || items.length === 0) return [];
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
};

/**
 * Resolves the appropriate news tier based on company valuation across 7 narrative arcs:
 * - tier1_early: < $50M (Hale is a dying joke / bankruptcy countdown)
 * - tier2_rising: $50M - $500M (Fluke, luck, rivals dismiss)
 * - tier3_serious: $500M - $5B (Rivals sweat, Wall St takes Hale seriously)
 * - tier4_global: $5B - $50B (Titan war with Pear, ruthless CEO narrative)
 * - tier5_titan: $50B - $250B (Hale shapes global economy, rivals begging for buyouts)
 * - tier6_apex: $250B - $1T (Near-monopoly, antitrust fails, Pax Hale)
 * - tier7_trillion: >= $1T (Orbital colonies, buying nations' debts, dystopian singularity)
 */
export const getNewsTierByValuation = (companyValue: number): NewsTier => {
  if (companyValue < 50_000_000) return 'tier1_early';
  if (companyValue < 500_000_000) return 'tier2_rising';
  if (companyValue < 5_000_000_000) return 'tier3_serious';
  if (companyValue < 50_000_000_000) return 'tier4_global';
  if (companyValue < 250_000_000_000) return 'tier5_titan';
  if (companyValue < 1_000_000_000_000) return 'tier6_apex';
  return 'tier7_trillion';
};

/**
 * Detects whether the company is in a bizarre contrast state:
 * - hated_but_rich: Company Value is huge (>= $500M) while Brand Value is dead (<= 25)
 * - loved_but_poor: Company Value is low (< $50M) while Brand Value is huge (>= 65)
 */
export const getSpecialNewsCondition = (
  companyValue: number,
  brandValue: number,
): NewsSpecialCondition | null => {
  if (companyValue >= 500_000_000 && brandValue <= 25) {
    return 'hated_but_rich';
  }
  if (companyValue < 50_000_000 && brandValue >= 65) {
    return 'loved_but_poor';
  }
  return null;
};

/**
 * Generates tailored product launch headlines
 */
const getProductLaunchTemplate = (productName: string, category?: string): NewsTemplate => {
  const templates: NewsTemplate[] = [
    {
      type: 'player',
      category: 'Breaking',
      source: 'TechCrunch',
      text: `Hale officially launches '${productName}', taking the ${category || 'consumer tech'} market by storm with unprecedented launch demand.`,
    },
    {
      type: 'player',
      category: 'Exclusive',
      source: 'The Verge',
      text: `Tech reviewers praise Hale's new '${productName}', calling its engineering and competitive price a serious challenge to Cupertino.`,
    },
    {
      type: 'rival',
      category: 'Market',
      source: 'Wall St Journal',
      text: `Pear and Microhard engineering teams initiate urgent tear-downs of Hale's newly released '${productName}'.`,
    },
  ];
  return sampleRandomItems(templates, 1)[0];
};

/**
 * Generates tailored acquisition (M&A) headlines
 */
const getAcquisitionTemplate = (subsidiaryName: string): NewsTemplate => {
  const templates: NewsTemplate[] = [
    {
      type: 'player',
      category: 'Breaking',
      source: 'Financial Times',
      text: `Hale closes landmark corporate takeover of ${subsidiaryName}, absorbing its core patents and cementing a powerful strategic footprint.`,
    },
    {
      type: 'rival',
      category: 'Corporate',
      source: 'Bloomberg Markets',
      text: `Pear and Microhard executives express deep boardroom anxiety following Hale's strategic buyout of ${subsidiaryName}.`,
    },
    {
      type: 'world',
      category: 'Market',
      source: 'Wall St Journal',
      text: `Wall Street reacts with applause to Hale's acquisition of ${subsidiaryName}, citing expanded operational moat and market synergies.`,
    },
  ];
  return sampleRandomItems(templates, 1)[0];
};

/**
 * Generates an authentic 4-article quarterly news edition reacting dynamically to:
 * - Newly released products
 * - Corporate company acquisitions (M&A)
 * - Current player valuation Tier & brand contrast states
 * - Pear & Rival counter-moves
 * - Global semiconductor and macro movements
 *
 * @param currentQuarter Current game quarter index (e.g. 1, 2, 3...)
 * @returns Array of exactly 4 generated news items pushed to useNewsStore
 */
export const generateQuarterlyNews = (currentQuarter: number): NewsPayload[] => {
  const stats = useStatsStore.getState();
  const companyValue = stats.companyValue ?? 0;
  const brandValue = stats.brandValue ?? 0;

  const newsStore = useNewsStore.getState();
  const announcedProducts = newsStore.announcedProductIds || [];
  const announcedAcquisitions = newsStore.announcedAcquisitionIds || [];

  const selectedTemplates: NewsTemplate[] = [];

  // --- 1. DYNAMIC CHECK: NEW PRODUCT LAUNCH ---
  const allProducts = useProductStore.getState().products || [];
  const unannouncedProduct = allProducts.find((p) => p.id && !announcedProducts.includes(p.id));

  // --- 2. DYNAMIC CHECK: NEW COMPANY ACQUISITION ---
  const allSubsidiaries = useCorporateFinanceStore.getState().subsidiaries || [];
  const unannouncedSubsidiary = allSubsidiaries.find((s) => s.id && !announcedAcquisitions.includes(s.id));

  // Lead Story Priority:
  // 1. New Product Launch
  // 2. New Corporate Acquisition
  // 3. Special Contrast State (loved_but_poor / hated_but_rich)
  // 4. Valuation Tier Narrative Headline
  if (unannouncedProduct) {
    selectedTemplates.push(getProductLaunchTemplate(unannouncedProduct.name, unannouncedProduct.category));
    useNewsStore.getState().markProductAnnounced(unannouncedProduct.id);
  } else if (unannouncedSubsidiary) {
    selectedTemplates.push(getAcquisitionTemplate(unannouncedSubsidiary.name));
    useNewsStore.getState().markAcquisitionAnnounced(unannouncedSubsidiary.id);
  } else {
    const specialCondition = getSpecialNewsCondition(companyValue, brandValue);
    if (specialCondition) {
      const specialPool = SPECIAL_NEWS_POOL[specialCondition];
      selectedTemplates.push(...sampleRandomItems(specialPool, 1));
    } else {
      const tierKey = getNewsTierByValuation(companyValue);
      const tierPool = SILICON_NEWS_POOL[tierKey];
      const playerStories = tierPool.filter((t) => t.type === 'player');
      const leadPool = playerStories.length > 0 ? playerStories : tierPool;
      selectedTemplates.push(...sampleRandomItems(leadPool, 1));
    }
  }

  // If there's ALSO a pending acquisition when a product was announced, add it as second story
  if (unannouncedProduct && unannouncedSubsidiary) {
    selectedTemplates.push(getAcquisitionTemplate(unannouncedSubsidiary.name));
    useNewsStore.getState().markAcquisitionAnnounced(unannouncedSubsidiary.id);
  }

  const tierKey = getNewsTierByValuation(companyValue);
  const tierPool = SILICON_NEWS_POOL[tierKey];

  // --- ARCH-RIVAL 'PEAR' HEADLINE ---
  if (selectedTemplates.length < 2) {
    const pearStories = [
      ...PEAR_RIVAL_NEWS_POOL,
      ...tierPool.filter((t) => t.type === 'rival' && t.text.toLowerCase().includes('pear')),
    ];
    selectedTemplates.push(...sampleRandomItems(pearStories.length > 0 ? pearStories : PEAR_RIVAL_NEWS_POOL, 1));
  }

  // --- SECONDARY RIVAL MOVE (Microhard / Apex / Titan) ---
  if (selectedTemplates.length < 3) {
    const otherRivals = [
      ...LIVING_WORLD_NEWS_POOL.filter((t) => t.type === 'rival' && !t.text.toLowerCase().includes('pear')),
      ...tierPool.filter((t) => t.type === 'rival' && !t.text.toLowerCase().includes('pear')),
    ];
    selectedTemplates.push(...sampleRandomItems(otherRivals.length > 0 ? otherRivals : LIVING_WORLD_NEWS_POOL, 1));
  }

  // --- LIVING WORLD / GLOBAL SEMICONDUCTOR & MACRO SHIFT ---
  if (selectedTemplates.length < 4) {
    const worldStories = [
      ...LIVING_WORLD_NEWS_POOL.filter((t) => t.type === 'world'),
      ...tierPool.filter((t) => t.type === 'world'),
    ];
    const uniqueWorldStories = worldStories.filter(
      (t) => !selectedTemplates.some((s) => s.text === t.text),
    );
    selectedTemplates.push(
      ...sampleRandomItems(
        uniqueWorldStories.length > 0 ? uniqueWorldStories : worldStories,
        1,
      ),
    );
  }

  // Ensure we have exactly 4 distinct news items
  const finalTemplates = selectedTemplates.slice(0, 4);

  const newsBatch: NewsPayload[] = finalTemplates.map((template, idx) => ({
    type: template.type,
    category:
      template.category ||
      (idx === 0
        ? 'Breaking'
        : template.type === 'rival'
        ? 'Exclusive'
        : 'Market'),
    source:
      template.source ||
      (template.type === 'player' ? 'Silicon Chronicle' : 'Financial Times'),
    text: template.text,
    quarter: currentQuarter,
    isHero: idx === 0,
  }));

  // Push to Zustand store
  useNewsStore.getState().addNewsBatch(newsBatch);

  return newsBatch;
};
