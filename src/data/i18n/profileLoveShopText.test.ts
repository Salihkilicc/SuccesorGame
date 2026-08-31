// src/data/i18n/profileLoveShopText.test.ts

import { useLocaleStore } from '../../core/i18n';
import {
    translateEducationLevel,
    translateSocialClass,
    translateTrait,
    translateOccupation,
    translateRarity,
    translateCategory,
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
        });

        it('reverses Turkish terms back to English if stored in Turkish', () => {
            expect(translateEducationLevel('Lise')).toBe('High School');
            expect(translateSocialClass('Yüksek Sosyete')).toBe('High Society');
            expect(translateTrait('Vizyoner')).toBe('Visionary');
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
        });

        it('translates occupations', () => {
            expect(translateOccupation('Supermodel')).toBe('Süpermodel');
            expect(translateOccupation('Venture Capitalist')).toBe('Girişim Sermayedarı');
            expect(translateOccupation('Tech Founder')).toBe('Teknoloji Kurucusu');
        });

        it('translates rarities and categories', () => {
            expect(translateRarity('SOVEREIGN')).toBe('EGEMEN');
            expect(translateRarity('LEGENDARY')).toBe('EFSANEVİ');
            expect(translateCategory('REAL_ESTATE')).toBe('Gayrimenkul');
            expect(translateCategory('WATCH')).toBe('Saatler');
        });
    });
});
