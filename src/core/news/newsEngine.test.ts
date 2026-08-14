// src/core/news/newsEngine.test.ts
import { useNewsStore } from '../store/useNewsStore';
import { useStatsStore, initialStatsState } from '../store/useStatsStore';
import { useProductStore, initialProductState } from '../store/useProductStore';
import { useCorporateFinanceStore } from '../../features/finance/stores/useCorporateFinanceStore';
import {
  generateQuarterlyNews,
  getNewsTierByValuation,
  getSpecialNewsCondition,
} from './newsEngine';
import {
  SILICON_NEWS_POOL,
  SPECIAL_NEWS_POOL,
  LIVING_WORLD_NEWS_POOL,
  PEAR_RIVAL_NEWS_POOL,
} from '../../data/news/siliconNewsPool';

describe('SiliconNews Engine with Dynamic Reactions to Products & Acquisitions', () => {
  beforeEach(() => {
    useNewsStore.getState().reset();
    useProductStore.setState({ ...initialProductState, products: [] });
    useCorporateFinanceStore.setState({ subsidiaries: [] });
    useStatsStore.setState({
      ...initialStatsState,
      companyValue: 5_000_000,
      brandValue: 10,
    } as any);
  });

  it('has extensive Pear rival stories available', () => {
    expect(PEAR_RIVAL_NEWS_POOL.length).toBeGreaterThan(10);
    expect(LIVING_WORLD_NEWS_POOL.length).toBeGreaterThan(15);
  });

  it('generates a clean 4-article quarterly edition', () => {
    const news = generateQuarterlyNews(1);
    expect(news).toHaveLength(4);
    expect(news[0].isHero).toBe(true);
    expect(news[0].quarter).toBe(1);

    const storeState = useNewsStore.getState();
    expect(storeState.newsHistory).toHaveLength(4);
  });

  it('generates a breaking news headline when a new product is launched', () => {
    // Add a new product
    useProductStore.setState({
      products: [
        {
          id: 'quantum_phone_x',
          name: 'Quantum Phone X',
          category: 'Smartphones',
          productionUnits: 100,
          inventory: 50,
          revenue: 100000,
        } as any,
      ],
    });

    const news = generateQuarterlyNews(2);
    expect(news).toHaveLength(4);
    expect(news[0].text).toContain('Quantum Phone X');
    expect(news[0].isHero).toBe(true);

    // Verify it is marked as announced
    expect(useNewsStore.getState().announcedProductIds).toContain('quantum_phone_x');

    // Next quarter without new products should not re-announce it
    const nextNews = generateQuarterlyNews(3);
    expect(nextNews[0].text).not.toContain('Quantum Phone X');
  });

  it('generates a breaking news headline when a company is acquired', () => {
    // Add an acquired subsidiary
    useCorporateFinanceStore.setState({
      subsidiaries: [
        {
          id: 'sub_neurotech',
          name: 'NeuroTech Dynamics',
          sector: 'Technology',
          valuation: 50_000_000,
          acquiredAt: 1,
          history: [],
          lastChangePercent: 0,
          strategy: { marketing: 2, rnd: 3, production: 3, workforce: 2 },
        },
      ],
    });

    const news = generateQuarterlyNews(4);
    expect(news).toHaveLength(4);
    expect(news[0].text).toContain('NeuroTech Dynamics');
    expect(news[0].isHero).toBe(true);

    // Verify it is marked as announced
    expect(useNewsStore.getState().announcedAcquisitionIds).toContain('sub_neurotech');

    // Next quarter without new acquisitions should not re-announce it
    const nextNews = generateQuarterlyNews(5);
    expect(nextNews[0].text).not.toContain('NeuroTech Dynamics');
  });

  it('accurately resolves tier across all 7 valuation brackets', () => {
    expect(getNewsTierByValuation(10_000_000)).toBe('tier1_early');
    expect(getNewsTierByValuation(100_000_000)).toBe('tier2_rising');
    expect(getNewsTierByValuation(1_500_000_000)).toBe('tier3_serious');
    expect(getNewsTierByValuation(25_000_000_000)).toBe('tier4_global');
    expect(getNewsTierByValuation(100_000_000_000)).toBe('tier5_titan');
    expect(getNewsTierByValuation(500_000_000_000)).toBe('tier6_apex');
    expect(getNewsTierByValuation(2_000_000_000_000)).toBe('tier7_trillion');
  });

  it('detects hated_but_rich condition and makes it the top hero story', () => {
    expect(getSpecialNewsCondition(600_000_000, 15)).toBe('hated_but_rich');

    useStatsStore.setState({
      companyValue: 800_000_000,
      brandValue: 12,
    } as any);

    const news = generateQuarterlyNews(15);
    expect(news).toHaveLength(4);
    expect(news[0].isHero).toBe(true);

    const specialTexts = SPECIAL_NEWS_POOL.hated_but_rich.map((n) => n.text);
    expect(specialTexts).toContain(news[0].text);
  });

  it('detects loved_but_poor condition and makes it the top hero story', () => {
    expect(getSpecialNewsCondition(20_000_000, 80)).toBe('loved_but_poor');

    useStatsStore.setState({
      companyValue: 15_000_000,
      brandValue: 90,
    } as any);

    const news = generateQuarterlyNews(3);
    expect(news).toHaveLength(4);
    expect(news[0].isHero).toBe(true);

    const specialTexts = SPECIAL_NEWS_POOL.loved_but_poor.map((n) => n.text);
    expect(specialTexts).toContain(news[0].text);
  });
});
