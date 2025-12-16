import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, Animated } from 'react-native';
import { theme } from '../../../theme';
import { BLACK_MARKET_WEAPONS, BLACK_MARKET_SUBSTANCES } from '../../../data/BlackMarketData';
import OfferModal from './OfferModal';

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

    const renderMenu = () => (
        <View style={styles.menuContainer}>
            <Text style={styles.headerTitle}>THE UNDERGROUND</Text>
            <Text style={styles.headerSubtitle}>Money talks. Silence pays.</Text>

            <View style={styles.buttonsContainer}>
                <MenuButton
                    icon="🎨"
                    title="Art Thief"
                    subtitle="Stolen Masterpieces"
                    onPress={onSelectArt}
                />
                <MenuButton
                    icon="🏺"
                    title="Antique Dealer"
                    subtitle="History for Sale"
                    onPress={onSelectAntique}
                />
                <MenuButton
                    icon="💎"
                    title="Jewel Dealer"
                    subtitle="Royal Gems"
                    onPress={onSelectJewel}
                />
                <MenuButton
                    icon="🔫"
                    title="Arms Dealer"
                    subtitle="Lethal Hardware"
                    onPress={() => setView('WEAPONS')}
                    danger
                />
                <MenuButton
                    icon="💊"
                    title="Street Dealer"
                    subtitle="Quick Fix"
                    onPress={() => setView('SUBSTANCES')}
                    danger
                />
            </View>
        </View>
    );

    const renderList = (
        title: string,
        data: typeof BLACK_MARKET_WEAPONS | typeof BLACK_MARKET_SUBSTANCES,
        onBuy: (id: string) => void
    ) => (
        <View style={styles.listContainer}>
            <View style={styles.listHeader}>
                <Pressable onPress={() => setView('MENU')} style={styles.backButton}>
                    <Text style={styles.backText}>← Back</Text>
                </Pressable>
                <Text style={styles.listTitle}>{title}</Text>
                <View style={{ width: 50 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {data.map(item => (
                    <Pressable
                        key={item.id}
                        style={({ pressed }) => [styles.listItem, pressed && styles.pressed]}
                        onPress={() => onBuy(item.id)}
                    >
                        <View style={styles.itemRow}>
                            <View style={styles.itemInfo}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                {'description' in item && (
                                    <Text style={styles.itemDesc}>{item.description}</Text>
                                )}
                            </View>
                            <Text style={styles.itemPrice}>${item.price.toLocaleString()}</Text>
                        </View>
                    </Pressable>
                ))}
            </ScrollView>
        </View>
    );

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
                    {view === 'MENU' && renderMenu()}
                    {view === 'WEAPONS' && renderList("ARSENAL", BLACK_MARKET_WEAPONS, onBuyWeapon)}
                    {view === 'SUBSTANCES' && renderList("STREET STASH", BLACK_MARKET_SUBSTANCES, onBuySubstance)}
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

const MenuButton = ({ icon, title, subtitle, onPress, danger }: any) => (
    <Pressable
        style={({ pressed }) => [
            styles.menuButton,
            danger && styles.dangerButton,
            pressed && styles.pressed
        ]}
        onPress={onPress}
    >
        <Text style={styles.menuIcon}>{icon}</Text>
        <View>
            <Text style={[styles.menuTitle, danger && styles.dangerText]}>{title}</Text>
            <Text style={styles.menuSubtitle}>{subtitle}</Text>
        </View>
        <Text style={styles.arrow}>›</Text>
    </Pressable>
);

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
    menuContainer: {
        padding: 20,
        alignItems: 'center',
    },
    headerTitle: {
        color: '#fff',
        fontSize: 28,
        fontWeight: '900',
        letterSpacing: 4,
        marginBottom: 8,
    },
    headerSubtitle: {
        color: '#444',
        fontSize: 14,
        marginBottom: 50,
        fontStyle: 'italic',
    },
    buttonsContainer: {
        width: '100%',
        gap: 16,
    },
    menuButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#111',
        padding: 20,
        borderRadius: 4,
        borderLeftWidth: 3,
        borderLeftColor: '#444',
    },
    dangerButton: {
        borderLeftColor: '#900',
        backgroundColor: '#1a0505',
    },
    pressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.8,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 20,
    },
    menuTitle: {
        color: '#ddd',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    dangerText: {
        color: '#ff4444',
    },
    menuSubtitle: {
        color: '#555',
        fontSize: 12,
    },
    arrow: {
        color: '#333',
        fontSize: 24,
        fontWeight: 'bold',
        marginLeft: 'auto',
    },
    // List Styles
    listContainer: {
        flex: 1,
    },
    listHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#222',
        marginBottom: 10,
    },
    backButton: {
        padding: 10,
    },
    backText: {
        color: '#888',
    },
    listTitle: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        letterSpacing: 2,
    },
    scrollContent: {
        padding: 20,
        gap: 12,
    },
    listItem: {
        backgroundColor: '#111',
        padding: 16,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#222',
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    itemInfo: {
        flex: 1,
        marginRight: 10,
    },
    itemName: {
        color: '#eee',
        fontSize: 16,
        fontWeight: '600',
    },
    itemDesc: {
        color: '#555',
        fontSize: 12,
        marginTop: 4,
    },
    itemPrice: {
        color: '#ff4444',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default BlackMarketHubModal;
