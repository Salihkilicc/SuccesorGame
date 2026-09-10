// src/data/i18n/profileLoveShopText.test.ts

import { useLocaleStore } from '../../core/i18n';
import {
    translateEducationLevel,
    translateSocialClass,
    translateTrait,
    translateOccupation,
    translateRarity,
    translateCategory,
    translateShopDescription,
    translateItemName,
    translateItemSpec,
    translateScenario,
} from './profileLoveShopText';

describe('profileLoveShopText', () => {
    beforeEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    afterEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    describe('when locale is English (en)', () => {
        it('returns English terms unchanged', () => {
            expect(translateEducationLevel('High School')).toBe('High School');
            expect(translateSocialClass('High Society')).toBe('High Society');
            expect(translateTrait('Analytical')).toBe('Analytical');
            expect(translateOccupation('Venture Capitalist')).toBe('Venture Capitalist');
            expect(translateRarity('LEGENDARY')).toBe('LEGENDARY');
            expect(translateCategory('VEHICLE')).toBe('VEHICLE');
            expect(translateCategory('SPACE')).toBe('SPACE');
            expect(translateOccupation('Silicon Valley Tech CEO')).toBe('Silicon Valley Tech CEO');
            expect(translateTrait('Strategic Mind')).toBe('Strategic Mind');
            expect(translateTrait('Elegant')).toBe('Elegant');
            expect(translateShopDescription('Your palace in the clouds.')).toBe('Your palace in the clouds.');
            expect(translateItemName('The Flying Palace (S900 Custom)')).toBe('The Flying Palace (S900 Custom)');
            expect(translateItemSpec('Gold Plated')).toBe('Gold Plated');
            expect(translateScenario({ id: 'vip_davos', text: 'English text', flirt: 'English flirt' })).toEqual({
                id: 'vip_davos',
                text: 'English text',
                flirt: 'English flirt',
            });
        });

        it('reverses Turkish terms back to English if stored in Turkish', () => {
            expect(translateEducationLevel('Lise')).toBe('High School');
            expect(translateSocialClass('Yüksek Sosyete')).toBe('High Society');
            expect(translateTrait('Vizyoner')).toBe('Visionary');
            expect(translateOccupation('Hükümran Hükümdar')).toBe('Reigning Sovereign');
            expect(translateCategory('Uzay')).toBe('SPACE');
            expect(translateShopDescription('Bulutlardaki sarayınız.')).toBe('Your palace in the clouds.');
            expect(translateItemName('Uçan Saray (S900 Özel Yapım)')).toBe('The Flying Palace (S900 Custom)');
            expect(translateItemSpec('Altın Kaplama')).toBe('Gold Plated');
        });
    });

    describe('when locale is Turkish (tr)', () => {
        beforeEach(() => {
            useLocaleStore.setState({ locale: 'tr' });
        });

        it('translates education levels', () => {
            expect(translateEducationLevel('Elementary')).toBe('İlkokul');
            expect(translateEducationLevel('Undergraduate')).toBe('Lisans');
            expect(translateEducationLevel('PhD')).toBe('Doktora');
        });

        it('translates social classes and tiers', () => {
            expect(translateSocialClass('Corporate Elite')).toBe('Kurumsal Elit');
            expect(translateSocialClass('High Society')).toBe('Yüksek Sosyete');
            expect(translateSocialClass('Blue Collar')).toBe('Mavi Yaka');
        });

        it('translates traits', () => {
            expect(translateTrait('Analytical')).toBe('Analitik');
            expect(translateTrait('Charismatic')).toBe('Karizmatik');
            expect(translateTrait('Reckless')).toBe('Pervasız');
            expect(translateTrait('Strategic Mind')).toBe('Stratejik Zeka');
            expect(translateTrait('Elegant')).toBe('Zarif');
            expect(translateTrait('Newborn Successor')).toBe('Yeni Doğan Varis');
        });

        it('translates occupations', () => {
            expect(translateOccupation('Supermodel')).toBe('Süpermodel');
            expect(translateOccupation('Venture Capitalist')).toBe('Girişim Sermayedarı');
            expect(translateOccupation('Tech Founder')).toBe('Teknoloji Kurucusu');
            expect(translateOccupation('Silicon Valley Tech CEO')).toBe('Silikon Vadisi Teknoloji CEO’su');
            expect(translateOccupation('Reigning Sovereign')).toBe('Hükümran Hükümdar');
            expect(translateOccupation('Formula 1 Team Principal')).toBe('Formula 1 Takım Patronu');
        });

        it('translates rarities and categories', () => {
            expect(translateRarity('SOVEREIGN')).toBe('EGEMEN');
            expect(translateRarity('LEGENDARY')).toBe('EFSANEVİ');
            expect(translateCategory('REAL_ESTATE')).toBe('Gayrimenkul');
            expect(translateCategory('WATCH')).toBe('Saatler');
            expect(translateCategory('SPACE')).toBe('Uzay');
        });

        it('translates shop descriptions, item names, specs, and encounter scenarios', () => {
            expect(translateShopDescription('Your palace in the clouds.')).toBe('Bulutlardaki sarayınız.');
            expect(translateShopDescription('Buy the horizon.')).toBe('Ufku satın alın.');
            expect(translateItemName('The Gigayacht')).toBe('Gigayat');
            expect(translateItemName('Tokyo Spire')).toBe('Tokyo Gökdeleni');
            expect(translateItemSpec('Double Decker')).toBe('Çift Katlı');
            expect(translateItemSpec('Mach 0.94')).toBe('Mach 0.94 Hız');

            const scenario = translateScenario({ id: 'vip_davos', text: 'Eng text', flirt: 'Eng flirt' });
            expect(scenario?.text).toContain("Davos'taki");
            expect(scenario?.flirt).toContain("Klosters'ta");
        });
    });
});
