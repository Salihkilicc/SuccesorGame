// src/data/i18n/mailMessagesText.test.ts

import { useLocaleStore } from '../../core/i18n';
import {
    translateMessageText,
    translateMailSubject,
    translateRole,
    translateSenderName,
    translateMailBody,
    ROLES_TR,
    SENDER_NAMES_TR,
    SUBJECTS_TR,
    TEXT_TR,
} from './mailMessagesText';

describe('mailMessagesText', () => {
    beforeEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    afterEach(() => {
        useLocaleStore.setState({ locale: 'en' });
    });

    describe('when locale is English (en)', () => {
        it('returns original English text unchanged', () => {
            const sample = 'Congratulations on the launch. I mean that.';
            expect(translateMessageText(sample)).toBe(sample);
        });

        it('returns original English role unchanged', () => {
            expect(translateRole('Chief Operating Officer')).toBe('Chief Operating Officer');
            expect(translateRole('Head of Production')).toBe('Head of Production');
        });

        it('returns original English sender name unchanged', () => {
            expect(translateSenderName('Your Father')).toBe('Your Father');
            expect(translateSenderName('Facilities')).toBe('Facilities');
        });

        it('returns original English mail subject unchanged', () => {
            expect(translateMailSubject('Parking bay 1, reallocation')).toBe('Parking bay 1, reallocation');
            expect(translateMailSubject('Initiating coverage, HALE')).toBe('Initiating coverage, HALE');
        });

        it('reverses Turkish text back to English if stored in Turkish', () => {
            const tr = 'Lansman için tebrik ederim. Samimiyetimle söylüyorum.';
            expect(translateMessageText(tr)).toBe('Congratulations on the launch. I mean that.');
        });
    });

    describe('when locale is Turkish (tr)', () => {
        beforeEach(() => {
            useLocaleStore.setState({ locale: 'tr' });
        });

        it('translates seed messages', () => {
            expect(translateMessageText('Congratulations on the launch. I mean that.'))
                .toBe('Lansman için tebrik ederim. Samimiyetimle söylüyorum.');
        });

        it('translates roles', () => {
            expect(translateRole('Chief Financial Officer')).toBe('Mali İşler Direktörü');
            expect(translateRole('Head of Production')).toBe('Üretim Direktörü');
            expect(translateRole('Founder')).toBe('Kurucu');
        });

        it('translates sender names', () => {
            expect(translateSenderName('Your Father')).toBe('Baban');
            expect(translateSenderName('Facilities')).toBe('Tesis Yönetimi');
        });

        it('translates mail subjects', () => {
            expect(translateMailSubject('Parking bay 1, reallocation')).toBe('1 numaralı park yeri, yeniden tahsis');
            expect(translateMailSubject('Initiating coverage, HALE')).toBe('Kapsama alma bildirimi, HALE');
            expect(translateMailSubject('RE: Offer to acquire Voltmotors')).toBe('Voltmotors şirketini devralma teklifi hk.');
            expect(translateMailSubject('Sponsorship — St. Jude')).toBe('Sponsorluk — St. Jude');
        });

        it('translates neglect lines', () => {
            const pearText = 'Nathan has asked me to close the file on this one, since it has been open a quarter without a response from your side.\n\nHe notes that the terms were time sensitive and that this is not a criticism. He would like it recorded that the offer was made.\n\nSent on behalf of N. Vogel.';
            expect(translateMessageText(pearText)).toContain('Nathan bu dosyanın kapatılmasını rica etti');
        });

        it('translates partner strain lines', () => {
            const overtime = 'The plant ran late again this quarter, so you did.\n\nI am not asking you to stop. I am telling you that I noticed, once, and then I will not mention it again.';
            expect(translateMessageText(overtime)).toContain('Bu çeyrek fabrika yine geç saatlere kaldı');
        });

        it('translates partner aid offer line', () => {
            const aid = 'I looked at the account, which I know I am not supposed to do.\n\nI can put in $500,000 and I would rather do it now than after you have had to ask. Say the word and it is done.';
            expect(translateMessageText(aid)).toContain('Hesaba baktım; biliyorum bakmamam gerekirdi');
            expect(translateMessageText(aid)).toContain('$500,000');
        });

        it('translates negotiation conditions dynamically', () => {
            expect(translateMessageText('CONDITION: a seat on your board.'))
                .toBe('ŞART: Yönetim kurulunuzda bir koltuk.');
            expect(translateMessageText('CONDITION: your public standing at 60 or better on the day of signing.'))
                .toBe('ŞART: İmza gününde kamu itibarınızın en az 60 olması.');
            expect(translateMessageText('CONDITION: 10% above the customary premium.'))
                .toBe('ŞART: Alışılagelmiş primin %10 üzerinde ödeme.');
        });
    });
});
