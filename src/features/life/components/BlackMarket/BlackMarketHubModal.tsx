import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../core/theme';
import { BLACK_MARKET_WEAPONS, BLACK_MARKET_SUBSTANCES } from '../../../../data/BlackMarketData';
import OfferModal from './OfferModal';
import BlackMarketMenuView from './components/BlackMarketMenuView';
import BlackMarketListView from './components/BlackMarketListView';

type BlackMarketHubModalProps = {
    visible: boolean;
    onClose: () => void;

    // Actions derived from Hook
    onSelectArt: () => void;
    onSelectAntique: () => void;
    onSelectJewel: () => void;
    onBuyWeapon: (id: string) => void;
    onBuySubstance: (id: string) => void;

    // Offer Props
    offerVisible: boolean;
    offerItem: any;
    onAcceptOffer: () => void;
    onRejectOffer: () => void;
};

type ViewState = 'MENU' | 'WEAPONS' | 'SUBSTANCES';

const BlackMarketHubModal = ({
    visible,
    onClose,
    onSelectArt,
    onSelectAntique,
    onSelectJewel,
    onBuyWeapon,
    onBuySubstance,
    offerVisible,
    offerItem,
    onAcceptOffer,
    onRejectOffer
}: BlackMarketHubModalProps) => {
    const [view, setView] = useState<ViewState>('MENU');

    const handleClose = () => {
        setView('MENU');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent={false}
            onRequestClose={handleClose}
        >
            <View style={styles.container}>
                <Pressable style={styles.closeOverlay} onPress={handleClose}>
                    <Text style={styles.closeText}>LEAVE</Text>
                </Pressable>

                <View style={styles.content}>
                    {view === 'MENU' && (
                        <BlackMarketMenuView
                            onSelectArt={onSelectArt}
                            onSelectAntique={onSelectAntique}
                            onSelectJewel={onSelectJewel}
                            onSelectWeapons={() => setView('WEAPONS')}
                            onSelectSubstances={() => setView('SUBSTANCES')}
                        />
                    )}
                    {view === 'WEAPONS' && (
                        <BlackMarketListView
                            title="ARSENAL"
                            data={BLACK_MARKET_WEAPONS}
                            onBuy={onBuyWeapon}
                            onBack={() => setView('MENU')}
                        />
                    )}
                    {view === 'SUBSTANCES' && (
                        <BlackMarketListView
                            title="STREET STASH"
                            data={BLACK_MARKET_SUBSTANCES}
                            onBuy={onBuySubstance}
                            onBack={() => setView('MENU')}
                        />
                    )}
                </View>

                {/* Embedded Offer Modal (Overlay) */}
                <OfferModal
                    visible={offerVisible}
                    item={offerItem}
                    onBuy={onAcceptOffer}
                    onReject={onRejectOffer}
                />
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#050505',
    },
    closeOverlay: {
        position: 'absolute',
        top: 50,
        right: 20,
        zIndex: 10,
        padding: 10,
    },
    closeText: {
        color: '#666',
        fontWeight: 'bold',
        fontSize: 12,
        letterSpacing: 2,
    },
    content: {
        flex: 1,
        paddingTop: 80,
    },
});

export default BlackMarketHubModal;
