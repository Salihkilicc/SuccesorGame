import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../theme';

// --- HEADER ---
export const ShopHeader = ({ title, money, onBack, formatMoney }: any) => (
    <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>CASH</Text>
            <Text style={styles.balanceValue}>{formatMoney(money)}</Text>
        </View>
    </View>
);

// --- SHOP LIST CARD (Ana Menüdeki Kartlar) ---
export const ShopListCard = ({ shop, onPress }: any) => {
    let icon = '🛒';
    if (shop.category === 'Cars') icon = '🏎️';
    if (shop.category === 'Jewelry') icon = '💎';
    if (shop.category === 'RealEstate') icon = '🏰';
    if (shop.category === 'SpecialVehicles') icon = '✈️';
    if (shop.category === 'Marinas') icon = '⚓';

    return (
        <Pressable onPress={onPress} style={({ pressed }) => [styles.shopCard, pressed && styles.shopCardPressed]}>
            <View style={styles.shopIconContainer}>
                <Text style={styles.shopIcon}>{icon}</Text>
            </View>
            <View style={styles.shopInfo}>
                <Text style={styles.shopName}>{shop.name}</Text>
                <Text style={styles.shopDescription}>{shop.description || shop.category}</Text>
            </View>
            <View style={styles.arrowContainer}>
                <Text style={styles.arrow}>›</Text>
            </View>
        </Pressable>
    );
};

// --- ITEM CARD (Detay Ekranındaki Ürünler) ---
export const ShopItemCard = ({ item, isOwned, onBuy, formatMoney }: any) => (
    <View style={styles.itemCard}>
        <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <View style={styles.itemMetaRow}>
                {item.brand && <Text style={styles.itemBrand}>{item.brand}</Text>}
                <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
            </View>
        </View>

        <Pressable
            onPress={onBuy}
            disabled={isOwned}
            style={({ pressed }) => [
                styles.buyButton,
                isOwned && styles.ownedButton,
                !isOwned && pressed && styles.buyButtonPressed,
            ]}>
            <Text style={[styles.buyButtonText, isOwned && styles.ownedButtonText]}>
                {isOwned ? 'OWNED' : 'BUY'}
            </Text>
        </Pressable>
    </View>
);

export const SectionHeader = ({ title }: { title: string }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
);

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border, backgroundColor: theme.colors.background },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: theme.colors.card, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: theme.colors.border },
    backButtonPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.95 }] },
    backIcon: { color: theme.colors.textPrimary, fontSize: 20, fontWeight: 'bold' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: theme.typography.subtitle, fontWeight: '800', color: theme.colors.textPrimary, letterSpacing: 0.5, marginHorizontal: theme.spacing.md },
    balanceContainer: { alignItems: 'flex-end', minWidth: 80 },
    balanceLabel: { color: theme.colors.textMuted, fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    balanceValue: { color: theme.colors.success, fontSize: theme.typography.caption, fontWeight: '700' },
    shopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.card, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, marginBottom: theme.spacing.sm },
    shopCardPressed: { backgroundColor: theme.colors.cardSoft, transform: [{ scale: 0.98 }] },
    shopIconContainer: { width: 48, height: 48, borderRadius: theme.radius.sm, backgroundColor: theme.colors.cardSoft, alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
    shopIcon: { fontSize: 24 },
    shopInfo: { flex: 1, gap: 2 },
    shopName: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '700' },
    shopDescription: { color: theme.colors.textSecondary, fontSize: theme.typography.caption },
    arrowContainer: { paddingLeft: theme.spacing.md },
    arrow: { color: theme.colors.textMuted, fontSize: 20, fontWeight: 'bold' },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: theme.colors.card, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    itemInfo: { flex: 1, marginRight: theme.spacing.md },
    itemName: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '700', marginBottom: 4 },
    itemMetaRow: { flexDirection: 'column', gap: 2 },
    itemBrand: { color: theme.colors.textSecondary, fontSize: theme.typography.caption },
    itemPrice: { color: theme.colors.success, fontSize: theme.typography.body, fontWeight: '700', marginTop: 2 },
    buyButton: { backgroundColor: theme.colors.accent, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.sm, minWidth: 80, alignItems: 'center' },
    buyButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    buyButtonText: { color: '#fff', fontWeight: '700', fontSize: theme.typography.caption },
    ownedButton: { backgroundColor: theme.colors.cardSoft, borderWidth: 1, borderColor: theme.colors.border },
    ownedButtonText: { color: theme.colors.textMuted },
    sectionHeader: { color: theme.colors.textMuted, fontSize: theme.typography.caption, fontWeight: '700', letterSpacing: 1, marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
});