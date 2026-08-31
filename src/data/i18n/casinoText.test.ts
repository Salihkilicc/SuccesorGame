// src/data/i18n/casinoText.test.ts
import { useLocaleStore } from '../../core/i18n';
import {
  translateCasinoLocationName,
  translateCasinoLocationSubtitle,
  translateCasinoRank,
  translateCasinoBadge,
  translateDozenBet,
  translateOutsideBet,
  translateCasinoStatus,
  translateCasinoAlert,
} from './casinoText';

describe('casinoText', () => {
  afterEach(() => {
    useLocaleStore.setState({ locale: 'en' });
  });

  describe('English mode (locale === en)', () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: 'en' });
    });

    it('returns exact English location names and subtitles', () => {
      expect(translateCasinoLocationName('Athens')).toBe('Athens');
      expect(translateCasinoLocationName('Istanbul')).toBe('Istanbul');
      expect(translateCasinoLocationSubtitle('The Agora')).toBe('The Agora');
      expect(translateCasinoLocationSubtitle("Dragon's Ascendancy")).toBe("Dragon's Ascendancy");
    });

    it('reverses Turkish location names and subtitles back to English', () => {
      expect(translateCasinoLocationName('Atina')).toBe('Athens');
      expect(translateCasinoLocationName('İstanbul')).toBe('Istanbul');
      expect(translateCasinoLocationSubtitle('Agora')).toBe('The Agora');
    });

    it('returns exact English ranks and badges', () => {
      expect(translateCasinoRank('High Roller')).toBe('High Roller');
      expect(translateCasinoRank('VIP Lounge')).toBe('VIP Lounge');
      expect(translateCasinoBadge('3:2 PAYOUT')).toBe('3:2 PAYOUT');
      expect(translateCasinoBadge('MEGA JACKPOT')).toBe('MEGA JACKPOT');
    });

    it('returns exact English bets and statuses', () => {
      expect(translateDozenBet('1st 12')).toBe('1st 12');
      expect(translateOutsideBet('EVEN')).toBe('EVEN');
      expect(translateCasinoStatus('Place your bet and deal.')).toBe('Place your bet and deal.');
      expect(translateCasinoStatus('Spinning...')).toBe('Spinning...');
      expect(translateCasinoStatus('You win $10,000!')).toBe('You win $10,000!');
    });
  });

  describe('Turkish mode (locale === tr)', () => {
    beforeEach(() => {
      useLocaleStore.setState({ locale: 'tr' });
    });

    it('translates location names and subtitles', () => {
      expect(translateCasinoLocationName('Athens')).toBe('Atina');
      expect(translateCasinoLocationName('ATHENS')).toBe('ATİNA');
      expect(translateCasinoLocationName('Istanbul')).toBe('İstanbul');
      expect(translateCasinoLocationName('London')).toBe('Londra');
      expect(translateCasinoLocationName('Macau')).toBe('Makao');

      expect(translateCasinoLocationSubtitle('The Agora')).toBe('Agora');
      expect(translateCasinoLocationSubtitle('Bosphorus Royale')).toBe('Boğaziçi Royale');
      expect(translateCasinoLocationSubtitle('Neon Palace')).toBe('Neon Sarayı');
      expect(translateCasinoLocationSubtitle("Dragon's Ascendancy")).toBe('Ejderha Yükselişi');
    });

    it('translates VIP ranks', () => {
      expect(translateCasinoRank('High Roller')).toBe('Yüksek Bahisçi');
      expect(translateCasinoRank('VIP Lounge')).toBe('VIP Salonu');
      expect(translateCasinoRank('Gambler')).toBe('Kumarbaz');
      expect(translateCasinoRank('Member')).toBe('Üye');
    });

    it('translates badges', () => {
      expect(translateCasinoBadge('3:2 PAYOUT')).toBe('3:2 ÖDEME');
      expect(translateCasinoBadge('35:1 SINGLE ZERO')).toBe('35:1 TEK SIFIR');
      expect(translateCasinoBadge('NO LIMIT VIP')).toBe('LİMİTSİZ VIP');
    });

    it('translates table bets', () => {
      expect(translateDozenBet('1st 12')).toBe('1. 12');
      expect(translateDozenBet('2nd 12')).toBe('2. 12');
      expect(translateDozenBet('3rd 12')).toBe('3. 12');

      expect(translateOutsideBet('EVEN')).toBe('ÇİFT');
      expect(translateOutsideBet('ODD')).toBe('TEK');
      expect(translateOutsideBet('◆ RED')).toBe('◆ KIRMIZI');
      expect(translateOutsideBet('◆ BLACK')).toBe('◆ SİYAH');
    });

    it('translates Blackjack statuses', () => {
      expect(translateCasinoStatus('Place your bet and deal.')).toBe('Bahsinizi koyun ve dağıtın.');
      expect(translateCasinoStatus('Your move: HIT or STAND.')).toBe('Sıra sizde: KART ÇEK veya KAL.');
      expect(translateCasinoStatus('You win 1,000,000!')).toBe('1,000,000 kazandınız!');
      expect(translateCasinoStatus('Blackjack! Premium payout.')).toBe('Blackjack! Özel kazanç.');
      expect(translateCasinoStatus('Push. Bet returned.')).toBe('Berabere. Bahis iade edildi.');
      expect(translateCasinoStatus('Bust or dealer wins.')).toBe('Battınız veya krupiye kazandı.');
    });

    it('translates Poker statuses', () => {
      expect(translateCasinoStatus('2-player Hold’em. Progressive betting.')).toBe("2 kişilik Hold'em. Kademeli bahis.");
      expect(translateCasinoStatus('Flop dealt. Continue to double bet.')).toBe('Flop açıldı. Bahsi ikiye katlamak için devam edin.');
      expect(translateCasinoStatus('Turn revealed. Continue to triple bet.')).toBe('Turn açıldı. Bahsi üçe katlamak için devam edin.');
      expect(translateCasinoStatus('River revealed. Showdown!')).toBe('River açıldı. Kartlar açılsın!');
      expect(translateCasinoStatus('You win! Score: 42 vs 38')).toBe('Kazandınız! Skor: 42 vs 38');
      expect(translateCasinoStatus('Dealer wins. Score: 45 vs 40')).toBe('Krupiye kazandı. Skor: 45 vs 40');
      expect(translateCasinoStatus('Folded. You lost $50,000.')).toBe('Çekildiniz. $50,000 kaybettiniz.');
      expect(translateCasinoStatus('Ready for next hand.')).toBe('Yeni el için hazır.');
    });

    it('translates Roulette statuses', () => {
      expect(translateCasinoStatus('Place your chips on the table.')).toBe('Çiplerinizi masaya yerleştirin.');
      expect(translateCasinoStatus('Spinning...')).toBe('Dönüyor...');
      expect(translateCasinoStatus('Won $2,500,000!')).toBe('$2,500,000 kazandınız!');
      expect(translateCasinoStatus('No luck this time.')).toBe('Bu sefer şans yaver gitmedi.');
    });

    it('translates Slots statuses', () => {
      expect(translateCasinoStatus('Ready to spin')).toBe('Çevirmeye hazır');
      expect(translateCasinoStatus('JACKPOT! +$500,000')).toBe('JACKPOT! +$500,000');
      expect(translateCasinoStatus('MINI WIN! +$50,000')).toBe('MİNİ KAZANÇ! +$50,000');
      expect(translateCasinoStatus('No match.')).toBe('Eşleşme yok.');
    });

    it('translates alerts', () => {
      expect(translateCasinoAlert('Place Bet')).toBe('Bahis Koyun');
      expect(translateCasinoAlert('Please place a bet on the table.')).toBe('Lütfen masaya bir bahis koyun.');
      expect(translateCasinoAlert('Not enough cash')).toBe('Yetersiz Bakiye');
      expect(translateCasinoAlert('Lower your bet or build more bankroll.')).toBe('Bahsinizi düşürün veya kasanızı artırın.');
      expect(translateCasinoAlert('You need 10000 to start.')).toBe('Başlamak için 10000 tutarına ihtiyacınız var.');
      expect(translateCasinoAlert('Select a chip to play!')).toBe('Oynamak için bir çip seçin!');
    });
  });
});
