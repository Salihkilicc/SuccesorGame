import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useStatsStore, Shareholder } from '../../../core/store/useStatsStore';

export type TransactionType = 'buy' | 'sell';
export type NegotiationResult = 'pending' | 'success' | 'fail';

export interface NegotiationLogicResult {
    // State
    transactionType: TransactionType;
    setTransactionType: (type: TransactionType) => void;
    quantity: number;
    setQuantity: (val: number) => void;
    offerPrice: string;
    setOfferPrice: (val: string) => void;
    result: NegotiationResult;

    // Calculated Values
    maxQuantity: number;
    currentTotal: number;
    npcOfferPrice: number;

    // Actions
    handleAction: () => void;
    handleRejectOffer: () => void;
    handleClose: () => void;
}

/**
 * Hook: useNegotiationLogic
 * 
 * Handles business logic for ShareNegotiationModal.
 * - Manages negotiation state (pending/success/fail).
 * - Calculates max tradeable quantities.
 * - Executes buy/sell logic including RNG for NPC acceptance.
 */
export const useNegotiationLogic = (
    visible: boolean,
    shareholder: Shareholder,
    onClose: () => void
): NegotiationLogicResult => {

    const {
        companySharePrice,
        money,
        shareholders,
        setField,
        setShareholders,
        updateShareholderRelationship,
    } = useStatsStore();

    // Local State
    const [transactionType, setTransactionType] = useState<TransactionType>('buy');
    const [quantity, setQuantity] = useState(1);
    const [offerPrice, setOfferPrice] = useState(companySharePrice.toString());
    const [result, setResult] = useState<NegotiationResult>('pending');

    // NPC Logic Constants
    const npcOfferPrice = companySharePrice * 1.2; // Premium offer when they want to buy from you
    const relationship = shareholder.relationship || 50;

    // Reset State on Open
    useEffect(() => {
        if (visible) {
            setResult('pending');
            setOfferPrice(companySharePrice.toString());
            setQuantity(1);
            setTransactionType('buy');
        }
    }, [visible, companySharePrice]);

    // Calculations
    const maxQuantity = transactionType === 'buy'
        ? Math.floor(shareholder.percentage * 10) // 1 Lot = 0.1% Share. Max is their total holding.
        : 10; // Player sell limit (Game balance)

    const finalPrice = transactionType === 'buy' ? parseFloat(offerPrice) : npcOfferPrice;
    const currentTotal = finalPrice * quantity || 0;

    // Actions
    const commitTransaction = (type: TransactionType, price: number, total: number) => {
        const pctChange = quantity * 0.1; // 1 Lot = 0.1%

        // 1. Update Cash
        if (type === 'buy') {
            setField('money', money - total);
        } else {
            setField('money', money + total);
        }

        // 2. Update Shareholdings
        const newShareholders = shareholders.map(sh => {
            if (sh.id === shareholder.id) {
                return {
                    ...sh,
                    percentage: type === 'buy'
                        ? Math.max(0, sh.percentage - pctChange)
                        : sh.percentage + pctChange
                };
            }
            if (sh.id === 'player') {
                return {
                    ...sh,
                    percentage: type === 'buy'
                        ? sh.percentage + pctChange
                        : Math.max(0, sh.percentage - pctChange)
                };
            }
            return sh;
        });

        setShareholders(newShareholders);

        // 3. Sync Player Ownership Field
        const player = newShareholders.find(s => s.id === 'player');
        if (player) setField('companyOwnership', player.percentage);

        // 4. Relationship Boost
        updateShareholderRelationship(shareholder.id, 2);
        setResult('success');
    };

    const handleAction = () => {
        if (transactionType === 'buy') {
            // BUY Logic
            if (money < currentTotal) {
                Alert.alert('Insufficient Funds', "You don't have enough cash for this offer.");
                return;
            }

            // NPC Decision Logic
            const priceRatio = finalPrice / companySharePrice;
            let success = false;

            if (relationship > 80) success = priceRatio >= 0.9;
            else if (relationship < 30) success = priceRatio > 1.2;
            else success = priceRatio >= 1.0 || (Math.random() > 0.5 && priceRatio > 0.95);

            if (success) {
                commitTransaction('buy', finalPrice, currentTotal);
            } else {
                setResult('fail');
                updateShareholderRelationship(shareholder.id, -2);
            }

        } else {
            // SELL Logic (Player accepts NPC offer)
            commitTransaction('sell', finalPrice, currentTotal);
        }
    };

    const handleRejectOffer = () => {
        setResult('fail');
        updateShareholderRelationship(shareholder.id, -5); // NPC offended
    };

    const handleClose = () => {
        onClose();
    };

    return {
        transactionType,
        setTransactionType,
        quantity,
        setQuantity,
        offerPrice,
        setOfferPrice,
        result,
        maxQuantity,
        currentTotal,
        npcOfferPrice,
        handleAction,
        handleRejectOffer,
        handleClose
    };
};
