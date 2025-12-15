import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Pressable,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../../theme';
import { useStatsStore } from '../../store';
import { SHOP_DATA } from '../../data/ShoppingData';
import type { AssetsStackParamList } from '../../navigation/RootNavigator';

const formatMoney = (value: number) => {
    return `$${value.toLocaleString()}`;
};

type ShoppingScreenNavigationProp = NativeStackNavigationProp<AssetsStackParamList>;

const ShoppingScreen = () => {
    const navigation = useNavigation<ShoppingScreenNavigationProp>();
    const { money } = useStatsStore();

    const renderShopCard = (shop: (typeof SHOP_DATA)[0]) => {
        let icon = '🛒';
        if (shop.category === 'Cars') icon = '🏎️';
        if (shop.category === 'Jewelry') icon = '💎';
        if (shop.category === 'RealEstate') icon = '🏰';
        if (shop.category === 'SpecialVehicles') icon = '✈️';
        if (shop.category === 'Marinas') icon = '⚓';

        return (
            <Pressable
                key={shop.id}
                onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })}
                style={({ pressed }) => [
                    styles.shopCard,
                    pressed && styles.shopCardPressed,
                ]}>
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

    const renderSection = (title: string, categoryFilter: string) => {
        const shops = SHOP_DATA.filter(s => s.category === categoryFilter);
        if (shops.length === 0) return null;

        return (
            <View style={styles.section}>
                <Text style={styles.sectionHeader}>{title}</Text>
                {shops.map(renderShopCard)}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

            {/* Header */}
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle}>Shopping</Text>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>CASH</Text>
                    <Text style={styles.balanceValue}>{formatMoney(money)}</Text>
                </View>
            </View>

            <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
                {renderSection('EXOTIC CARS', 'Cars')}
                {renderSection('JEWELRY & WATCHES', 'Jewelry')}
                {renderSection('REAL ESTATE', 'RealEstate')}
                {renderSection('SPECIAL VEHICLES', 'SpecialVehicles')}
                {renderSection('MARINA INVESTMENTS', 'Marinas')}
                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.md,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.background,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.card,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    backButtonPressed: {
        backgroundColor: theme.colors.cardSoft,
        transform: [{ scale: 0.95 }],
    },
    backIcon: {
        color: theme.colors.textPrimary,
        fontSize: 20,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: theme.typography.title,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: 0.5,
    },
    balanceContainer: {
        alignItems: 'flex-end',
    },
    balanceLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: theme.colors.success, // Green for money
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    content: {
        padding: theme.spacing.lg,
        paddingBottom: theme.spacing.xl,
    },
    section: {
        marginBottom: theme.spacing.xl,
        gap: theme.spacing.sm,
    },
    sectionHeader: {
        color: theme.colors.textMuted,
        fontSize: theme.typography.caption,
        fontWeight: '700',
        letterSpacing: 1,
        marginBottom: theme.spacing.xs,
        marginLeft: theme.spacing.xs,
    },
    shopCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
        marginBottom: theme.spacing.sm,
    },
    shopCardPressed: {
        backgroundColor: theme.colors.cardSoft,
        transform: [{ scale: 0.98 }],
    },
    shopIconContainer: {
        width: 48,
        height: 48,
        borderRadius: theme.radius.sm,
        backgroundColor: theme.colors.cardSoft,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: theme.spacing.md,
    },
    shopIcon: {
        fontSize: 24,
    },
    shopInfo: {
        flex: 1,
        gap: 2,
    },
    shopName: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.body,
        fontWeight: '700',
    },
    shopDescription: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.caption,
    },
    arrowContainer: {
        paddingLeft: theme.spacing.md,
    },
    arrow: {
        color: theme.colors.textMuted,
        fontSize: 20,
        fontWeight: 'bold',
    },
});

export default ShoppingScreen;
