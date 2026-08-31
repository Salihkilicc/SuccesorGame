// src/data/i18n/siliconNewsTranslations.test.ts
import { useLocaleStore } from '../../core/i18n';
import {
  translateNewsHeadline,
  translateNewsCategory,
  translateNewsReadTime,
  NEWS_HEADLINES_EN_TO_TR,
} from './siliconNewsTranslations';

describe('siliconNewsTranslations', () => {
  afterEach(() => {
    useLocaleStore.setState({ locale: 'en' });
  });

  describe('English mode (locale === en)', () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: 'en' });
    });

    it('returns exact English text for all news headlines', () => {
      const sample = "Pear unveils its next-gen 'PearPhone Ultra', removing all physical buttons in favor of haptic pressure sensors.";
      expect(translateNewsHeadline(sample)).toBe(sample);
    });

    it('reverses Turkish headlines back to English to prevent leakage', () => {
      const tr = "Pear, tüm fiziksel tuşları kaldırıp yerine dokunsal basınç sensörleri getirdiği yeni nesil 'PearPhone Ultra'yı tanıttı.";
      const en = "Pear unveils its next-gen 'PearPhone Ultra', removing all physical buttons in favor of haptic pressure sensors.";
      expect(translateNewsHeadline(tr)).toBe(en);
    });

    it('keeps categories in English', () => {
      expect(translateNewsCategory('Breaking')).toBe('Breaking');
      expect(translateNewsCategory('Exclusive')).toBe('Exclusive');
      expect(translateNewsCategory('Market')).toBe('Market');
      expect(translateNewsCategory('Son Dakika')).toBe('Breaking');
    });

    it('keeps read time in English', () => {
      expect(translateNewsReadTime('2 min read')).toBe('2 min read');
      expect(translateNewsReadTime('2 dk okuma')).toBe('2 min read');
    });
  });

  describe('Turkish mode (locale === tr)', () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: 'tr' });
    });

    it('translates Pear rival news headlines', () => {
      const en = "Pear unveils its next-gen 'PearPhone Ultra', removing all physical buttons in favor of haptic pressure sensors.";
      const tr = translateNewsHeadline(en);
      expect(tr).toBe("Pear, tüm fiziksel tuşları kaldırıp yerine dokunsal basınç sensörleri getirdiği yeni nesil 'PearPhone Ultra'yı tanıttı.");
    });

    it('translates tier 1 early news headlines', () => {
      const en = "A Goldman Sachs intern accidentally rates Hale equity as 'Worthless Scrap Metal' before an editor hastily upgrades it to 'Strong Sell'.";
      const tr = translateNewsHeadline(en);
      expect(tr).toContain("Bir Goldman Sachs stajyeri Hale hissesini yanlışlıkla 'Değersiz Hurda Metal'");
    });

    it('translates apex tier news headlines', () => {
      const en = "Hale becomes the first corporation in human history to officially cross the $1 Trillion market valuation threshold.";
      const tr = translateNewsHeadline(en);
      expect(tr).toContain("1 Trilyon Dolarlık piyasa değeri eşiğini");
    });

    it('translates dynamic product launch headlines', () => {
      const en = "Hale officially launches 'Quantum Phone X', taking the consumer tech market by storm with unprecedented launch demand.";
      const tr = translateNewsHeadline(en);
      expect(tr).toContain("Hale, 'Quantum Phone X' ürününü resmen piyasaya sürdü");
    });

    it('translates dynamic acquisition headlines', () => {
      const en = "Hale closes landmark corporate takeover of NeuroTech Dynamics, absorbing its core patents and cementing a powerful strategic footprint.";
      const tr = translateNewsHeadline(en);
      expect(tr).toContain("Hale, NeuroTech Dynamics şirketinin tarihi devralımını tamamladı");
    });

    it('translates dynamic board seat headlines', () => {
      const en = "Marcus Hale joins the Hale board.";
      const tr = translateNewsHeadline(en);
      expect(tr).toBe("Marcus Hale, Hale yönetim kuruluna katıldı.");
    });

    it('translates dynamic luxury lifestyle headlines', () => {
      const en = "Hale CEO acquires Bugatti Chiron in massive power display!";
      const tr = translateNewsHeadline(en);
      expect(tr).toBe("Hale CEO'su, büyük bir güç gösterisiyle Bugatti Chiron edindi!");
    });

    it('translates categories to Turkish', () => {
      expect(translateNewsCategory('Breaking')).toBe('Son Dakika');
      expect(translateNewsCategory('Exclusive')).toBe('Özel Haber');
      expect(translateNewsCategory('Market')).toBe('Piyasa');
      expect(translateNewsCategory('Tech')).toBe('Teknoloji');
      expect(translateNewsCategory('Corporate')).toBe('Kurumsal');
      expect(translateNewsCategory('Analysis')).toBe('Analiz');
      expect(translateNewsCategory('Legal')).toBe('Hukuk');
      expect(translateNewsCategory('Media')).toBe('Medya');
    });

    it('translates read time to Turkish', () => {
      expect(translateNewsReadTime('2 min read')).toBe('2 dk okuma');
      expect(translateNewsReadTime('5 min read')).toBe('5 dk okuma');
    });
  });

  describe('Dictionary coverage', () => {
    it('has translations for all 359 distinct news templates', () => {
      expect(Object.keys(NEWS_HEADLINES_EN_TO_TR).length).toBeGreaterThanOrEqual(359);
    });
  });
});
