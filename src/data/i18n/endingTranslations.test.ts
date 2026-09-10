// src/data/i18n/endingTranslations.test.ts

import { useLocaleStore } from '../../core/i18n';
import { ENDINGS } from '../story/endings';
import {
    translateEnding,
    translateRecordRow,
    translateRecordValue,
    ENDINGS_TR,
} from './endingTranslations';

describe('endingTranslations', () => {
    beforeEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    afterEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    it('has translations for all 11 endings in ENDINGS', () => {
        const endingIds = Object.keys(ENDINGS);
        expect(endingIds.length).toBe(11);
        for (const id of endingIds) {
            expect(ENDINGS_TR[id]).toBeDefined();
            expect(ENDINGS_TR[id].title).toBeTruthy();
            expect(ENDINGS_TR[id].body).toBeTruthy();
        }
    });

    describe('when locale is English (en)', () => {
        it('returns ending unchanged in English', () => {
            const ending = ENDINGS.soldToPear;
            const res = translateEnding(ending);
            expect(res.title).toBe(ending.title);
            expect(res.body).toBe(ending.body);
        });

        it('returns record rows unchanged', () => {
            const row = { label: 'In the chair for', value: '15 years, 2 quarters' };
            const res = translateRecordRow(row);
            expect(res.label).toBe('In the chair for');
            expect(res.value).toBe('15 years, 2 quarters');
        });
    });

    describe('when locale is Turkish (tr)', () => {
        beforeEach(() => {
            useLocaleStore.setState({ locale: 'tr' });
        });

        it('translates soldToPear ending', () => {
            const ending = ENDINGS.soldToPear;
            const res = translateEnding(ending);
            expect(res.title).toBe('TEKLİFİ KABUL ETTİN');
            expect(res.body).toContain('Para bir Salı günü hesaba geçti.');
        });

        it('translates convictedOfManipulation ending', () => {
            const ending = ENDINGS.convictedOfManipulation;
            const res = translateEnding(ending);
            expect(res.title).toBe('İYİLEŞMENİN KENDİSİ KANITTI');
            expect(res.body).toContain('O sırada kimse seni durdurmadı.');
        });

        it('translates record row labels and time/family/stake values', () => {
            expect(translateRecordRow({ label: 'In the chair for', value: '1 year, 1 quarter' }))
                .toEqual({ label: 'Koltukta geçirilen süre', value: '1 yıl, 1 çeyrek' });

            expect(translateRecordRow({ label: 'Family', value: '2 children, one of them named' }))
                .toEqual({ label: 'Aile', value: '2 çocuk, veliaht seçildi' });

            expect(translateRecordRow({ label: 'The family holds', value: '55% of the company' }))
                .toEqual({ label: 'Ailenin elindeki pay', value: "Şirketin %55'i" });

            expect(translateRecordRow({ label: 'Your successor took', value: 'Nothing' }))
                .toEqual({ label: 'Varisine kalan pay', value: 'Hiçbir şey' });
        });
    });
});
