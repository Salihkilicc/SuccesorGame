import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../core/theme';

// --- HEADER ---
export const ShopHeader = ({ title, money, onBack, formatMoney }: any) => (
    <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        <View style={styles.balanceContainer}>
            <Text style={styles.balanceLabel}>{t('ui.cash')}</Text>
            <Text style={styles.balanceValue}>{formatMoney(money)}</Text>
        </View>
    </View>
);

// --- SHOP LIST CARD (Ana Menüdeki Kartlar) ---
export const ShopListCard = ({ shop, onPress }: any) => {
    useLocale();
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
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(255,255,255,0.06)', backgroundColor: '#31241F' },
    backButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#31241F', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    backButtonPressed: { backgroundColor: '#31241F', transform: [{ scale: 0.95 }] },
    backIcon: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    headerTitle: { flex: 1, textAlign: 'center', fontSize: theme.typography.subtitle, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.5, marginHorizontal: theme.spacing.md },
    balanceContainer: { alignItems: 'flex-end', minWidth: 80 },
    balanceLabel: { color: '#FFFFFF', fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
    balanceValue: { color: '#FFFFFF', fontSize: theme.typography.caption, fontWeight: '700' },
    shopCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#31241F', padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.06)', marginBottom: theme.spacing.sm },
    shopCardPressed: { backgroundColor: '#31241F', transform: [{ scale: 0.98 }] },
    shopIconContainer: { width: 48, height: 48, borderRadius: theme.radius.sm, backgroundColor: '#31241F', alignItems: 'center', justifyContent: 'center', marginRight: theme.spacing.md },
    shopIcon: { fontSize: 24 },
    shopInfo: { flex: 1, gap: 2 },
    shopName: { color: '#FFFFFF', fontSize: theme.typography.body, fontWeight: '700' },
    shopDescription: { color: '#FFFFFF', fontSize: theme.typography.caption },
    arrowContainer: { paddingLeft: theme.spacing.md },
    arrow: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
    itemCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#31241F', padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.06)' },
    itemInfo: { flex: 1, marginRight: theme.spacing.md },
    itemName: { color: '#FFFFFF', fontSize: theme.typography.body, fontWeight: '700', marginBottom: 4 },
    itemMetaRow: { flexDirection: 'column', gap: 2 },
    itemBrand: { color: '#FFFFFF', fontSize: theme.typography.caption },
    itemPrice: { color: '#E9B8C9', fontSize: theme.typography.body, fontWeight: '700', marginTop: 2 },
    buyButton: { backgroundColor: '#533D35', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm, borderRadius: theme.radius.sm, minWidth: 80, alignItems: 'center' },
    buyButtonPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    buyButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: theme.typography.caption },
    ownedButton: { backgroundColor: '#31241F', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    ownedButtonText: { color: '#FFFFFF' },
    sectionHeader: { color: '#FFFFFF', fontSize: theme.typography.caption, fontWeight: '700', letterSpacing: 1, marginBottom: theme.spacing.xs, marginLeft: theme.spacing.xs },
});