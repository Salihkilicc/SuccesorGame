// src/features/casino/logic/useBlackjackLogic.ts
import { useState, useRef, useMemo } from 'react';
import { Alert } from 'react-native';
import { useStatsStore } from '../../../core/store'; // Store yolunu projene göre ayarla

// --- TİPLER VE SABİTLER ---
export type Card = {
    rank: string;
    suit: string;
    value: number;
};

type RoundState = 'idle' | 'player' | 'done';

const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'] as const;
const SUITS = ['♠', '♥', '♦', '♣'] as const;

// Helper: Kart Değeri
const rankValue = (rank: string) => {
    if (rank === 'A') return 11;
    if (['K', 'Q', 'J'].includes(rank)) return 10;
    return parseInt(rank, 10);
};

// Helper: Deste Oluştur
const createDeck = (): Card[] => {
    const deck: Card[] = [];
    SUITS.forEach(suit => {
        RANKS.forEach(rank => {
            deck.push({ rank, suit, value: rankValue(rank) });
        });
    });
    // Fisher-Yates Shuffle
    for (let i = deck.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
};

// Helper: Sayı Sınırlama
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const useBlackjackLogic = (initialBet: number = 5000) => {
    // Global Store
    const { money, setField, casinoReputation, setCasinoReputation } = useStatsStore();

    // Game State
    const [playerCards, setPlayerCards] = useState<Card[]>([]);
    const [dealerCards, setDealerCards] = useState<Card[]>([]);
    const [deck, setDeck] = useState<Card[]>([]);
    const [bet, setBet] = useState(initialBet);
    const [roundState, setRoundState] = useState<RoundState>('idle');
    const [status, setStatus] = useState('Place your bet and deal.');
    const [resultPopup, setResultPopup] = useState<{ type: 'win' | 'loss' | 'push', amount: number } | null>(null);
    const lossStreak = useRef(0);

    // --- HESAPLAMA FONKSİYONLARI ---
    const calculateHand = (cards: Card[]) => {
        let total = cards.reduce((sum, card) => sum + card.value, 0);
        let aces = cards.filter(card => card.rank === 'A').length;
        while (total > 21 && aces > 0) {
            total -= 10;
            aces -= 1;
        }
        const isBlackjack = cards.length === 2 && total === 21;
        return { total, isBlackjack };
    };

    const playerTotal = useMemo(() => calculateHand(playerCards).total, [playerCards]);
    const dealerTotal = useMemo(() => calculateHand(dealerCards).total, [dealerCards]);

    // --- OYUN MANTIĞI ---
    const reputationUp = (delta: number) => {
        setCasinoReputation(clamp(casinoReputation + delta, 0, 100));
    };

    const reputationDownSmall = () => {
        if (lossStreak.current >= 3) {
            setCasinoReputation(clamp(casinoReputation - 1, 0, 100));
            lossStreak.current = 0;
        }
    };

    const resolveRound = (outcome: 'win' | 'lose' | 'push' | 'blackjack') => {
        let winnings = 0;

        if (outcome === 'win') {
            winnings = bet * 2;
            reputationUp(1);
            lossStreak.current = 0;
            setStatus(`You win ${winnings.toLocaleString()}!`);
            setResultPopup({ type: 'win', amount: bet });
        } else if (outcome === 'blackjack') {
            winnings = Math.round(bet * 2.5);
            reputationUp(2);
            lossStreak.current = 0;
            setStatus('Blackjack! Premium payout.');
            setResultPopup({ type: 'win', amount: Math.round(bet * 1.5) });
        } else if (outcome === 'push') {
            winnings = bet;
            setStatus('Push. Bet returned.');
            setResultPopup({ type: 'push', amount: bet });
        } else {
            lossStreak.current += 1;
            reputationDownSmall();
            setStatus('Bust or dealer wins.');
            setResultPopup({ type: 'loss', amount: bet });
        }

        const nextMoney = money - bet + winnings;
        setField('money', nextMoney);
        setRoundState('done');
    };

    // --- ACTIONS (UI'ın kullanacağı fonksiyonlar) ---

    const actions = {
        deal: () => {
            setResultPopup(null);
            if (roundState === 'player') return;
            if (money < bet) {
                Alert.alert('Not enough cash', 'Lower your bet or build more bankroll.');
                return;
            }

            const freshDeck = createDeck();
            const nextPlayer = [freshDeck.pop()!, freshDeck.pop()!];
            const nextDealer = [freshDeck.pop()!, freshDeck.pop()!];

            setPlayerCards(nextPlayer);
            setDealerCards(nextDealer);
            setDeck(freshDeck);
            setRoundState('player');
            setStatus('Your move: HIT or STAND.');

            const player = calculateHand(nextPlayer);
            const dealer = calculateHand(nextDealer);

            if (player.isBlackjack || dealer.isBlackjack) {
                const outcome = player.isBlackjack && dealer.isBlackjack ? 'push'
                    : player.isBlackjack ? 'blackjack' : 'lose';
                resolveRound(outcome);
            }
        },

        hit: () => {
            if (roundState !== 'player') return;
            const nextDeck = [...deck];
            const card = nextDeck.pop();
            if (!card) return;

            const nextHand = [...playerCards, card];
            setPlayerCards(nextHand);
            setDeck(nextDeck);

            const { total } = calculateHand(nextHand);
            if (total > 21) {
                resolveRound('lose');
            }
        },

        stand: () => {
            if (roundState !== 'player') return;
            let nextDeck = [...deck];
            let nextDealer = [...dealerCards];

            // Krupiye 17 olana kadar çeker
            while (calculateHand(nextDealer).total < 17) {
                const draw = nextDeck.pop();
                if (!draw) break;
                nextDealer = [...nextDealer, draw];
            }

            setDealerCards(nextDealer);
            setDeck(nextDeck);

            const pTotal = calculateHand(playerCards).total;
            const dTotal = calculateHand(nextDealer).total;

            if (dTotal > 21) resolveRound('win');
            else if (pTotal > dTotal) resolveRound('win');
            else if (dTotal > pTotal) resolveRound('lose');
            else resolveRound('push');
        },

        adjustBet: (delta: number) => {
            setResultPopup(null);
            const next = clamp(bet + delta, 1000, 100_000);
            setBet(next);
        },

        closePopup: () => setResultPopup(null)
    };

    return {
        state: {
            playerCards,
            dealerCards,
            bet,
            roundState,
            status,
            resultPopup,
            playerTotal,
            dealerTotal,
            money
        },
        actions
    };
};