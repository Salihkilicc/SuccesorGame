// src/features/profile/components/LuxoNetPreviewModal.tsx
import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useLuxoNetStore, LuxuryAsset } from '../../../core/store/useLuxoNetStore';
import { handleBuyLuxury } from '../../../logic/personalEventsLogic';

interface LuxoNetPreviewModalProps {
    visible: boolean;
    onClose: () => void;
}

export const LuxoNetPreviewModal: React.FC<LuxoNetPreviewModalProps> = ({
    visible,
    onClose,
}) => {
    const { catalog, ownedAssets } = useLuxoNetStore();

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <LinearGradient
                    colors={['#1F1A28', '#14121B', '#0D0B12']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.modalContent}
                >
                    {/* Header */}
                    <View style={styles.modalHeader}>
                        <View>
                            <View style={styles.titleRow}>
                                <Text style={styles.modalTitle}>LUXONET</Text>
                                <View style={styles.vaultBadge}>
                                    <Text style={styles.vaultBadgeText}>SOVEREIGN VAULT</Text>
                                </View>
                            </View>
                            <Text style={styles.modalSub}>
                                Exclusive Marketplace for Ultra-High-Net-Worth CEOs
                            </Text>
                        </View>

                        <Pressable style={styles.closeBtn} onPress={onClose}>
                            <Text style={styles.closeBtnText}>✕</Text>
                        </Pressable>
                    </View>

                    {/* Content Scroll */}
                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollBody}
                    >
                        <Text style={styles.sectionHeader}>CATALOG LISTINGS ({catalog.length})</Text>

                        {catalog.map((item: LuxuryAsset) => (
                            <LinearGradient
                                key={item.id}
                                colors={['#242032', '#1B1726', '#15121E']}
                                style={styles.catalogCard}
                            >
                                <View style={styles.itemHeader}>
                                    <View style={styles.itemMeta}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemBrand}>
                                            {item.brand} • {item.category}
                                        </Text>
                                    </View>
                                    <View style={styles.rarityBadge}>
                                        <Text style={styles.rarityBadgeText}>
                                            {item.rarity.toUpperCase()}
                                        </Text>
                                    </View>
                                </View>

                                <Text style={styles.itemDesc}>{item.description}</Text>

                                <View style={styles.specsRow}>
                                    <View style={styles.specBox}>
                                        <Text style={styles.specLabel}>PRESTIGE</Text>
                                        <Text style={styles.specValPurple}>+{item.prestigeScore}</Text>
                                    </View>
                                    <View style={styles.specBox}>
                                        <Text style={styles.specLabel}>ANNUAL UPKEEP</Text>
                                        <Text style={styles.specValWhite}>
                                            ${(item.annualMaintenanceCost / 1000).toFixed(0)}k/yr
                                        </Text>
                                    </View>
                                    <View style={styles.specBox}>
                                        <Text style={styles.specLabel}>APPRECIATION</Text>
                                        <Text style={styles.specValBlue}>
                                            {item.appreciationRatePerYear > 0 ? '+' : ''}
                                            {(item.appreciationRatePerYear * 100).toFixed(0)}%/yr
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.purchaseFooter}>
                                    <View>
                                        <Text style={styles.priceLabel}>ACQUISITION PRICE</Text>
                                        <Text style={styles.priceVal}>
                                            ${(item.price / 1_000_000).toFixed(2)}M
                                        </Text>
                                    </View>

                                    <Pressable
                                        style={styles.acquireBtn}
                                        onPress={() => {
                                            handleBuyLuxury(item);
                                        }}
                                    >
                                        <LinearGradient
                                            colors={['#FF9500', '#D97706']}
                                            style={styles.acquireBtnGradient}
                                        >
                                            <Text style={styles.acquireBtnText}>Acquire</Text>
                                        </LinearGradient>
                                    </Pressable>
                                </View>
                            </LinearGradient>
                        ))}
                    </ScrollView>
                </LinearGradient>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '85%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: '#FF9500',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#282336',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 1.5,
    },
    vaultBadge: {
        backgroundColor: '#382510',
        borderWidth: 1,
        borderColor: '#FF9500',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
    },
    vaultBadgeText: {
        color: '#FBBF24',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    modalSub: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 4,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#231E30',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#37304A',
    },
    closeBtnText: {
        color: '#CBD5E1',
        fontSize: 14,
        fontWeight: '700',
    },
    scrollBody: {
        paddingTop: 16,
        paddingBottom: 36,
    },
    sectionHeader: {
        color: '#94A3B8',
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: 12,
    },
    catalogCard: {
        borderRadius: 14,
        padding: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#312B42',
    },
    itemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    itemMeta: {
        flex: 1,
    },
    itemName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    itemBrand: {
        color: '#A78BFA',
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
    },
    rarityBadge: {
        backgroundColor: '#2E2248',
        borderWidth: 1,
        borderColor: '#8B5CF6',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    rarityBadgeText: {
        color: '#C084FC',
        fontSize: 9,
        fontWeight: '800',
    },
    itemDesc: {
        color: '#94A3B8',
        fontSize: 12,
        lineHeight: 17,
        marginBottom: 12,
    },
    specsRow: {
        flexDirection: 'row',
        backgroundColor: '#13111C',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 6,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#262136',
    },
    specBox: {
        flex: 1,
        alignItems: 'center',
    },
    specLabel: {
        color: '#64748B',
        fontSize: 8,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    specValPurple: {
        color: '#C084FC',
        fontSize: 11,
        fontWeight: '700',
    },
    specValWhite: {
        color: '#E2E8F0',
        fontSize: 11,
        fontWeight: '700',
    },
    specValBlue: {
        color: '#60A5FA',
        fontSize: 11,
        fontWeight: '700',
    },
    purchaseFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#282336',
    },
    priceLabel: {
        color: '#64748B',
        fontSize: 9,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    priceVal: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '800',
    },
    acquireBtn: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    acquireBtnGradient: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    acquireBtnText: {
        color: '#000000',
        fontSize: 12,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
