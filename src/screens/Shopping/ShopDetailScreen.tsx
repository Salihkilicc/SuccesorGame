import React, { useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Pressable,
    SafeAreaView,
    Alert,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { theme } from '../../theme';
import { useStatsStore, useUserStore } from '../../store';
import { SHOP_DATA } from '../../data/ShoppingData';
import type { AssetsStackParamList } from '../../navigation/RootNavigator';

type ShopDetailRouteProp = RouteProp<AssetsStackParamList, 'ShopDetail'>;

const formatMoney = (value: number) => {
    return `$${value.toLocaleString()}`;
};

const ShopDetailScreen = () => {
    const route = useRoute<ShopDetailRouteProp>();
    const navigation = useNavigation();
    const { shopId } = route.params;

    const { money, update: updateStats } = useStatsStore();
    const { addItem, inventory } = useUserStore();

    const shop = useMemo(() => SHOP_DATA.find(s => s.id === shopId), [shopId]);

    if (!shop) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Shop not found</Text>
                <Pressable onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                    <Text style={styles.goBackText}>Go Back</Text>
                </Pressable>
            </View>
        );
    }

    const handleBuy = (item: (typeof shop.items)[0]) => {
        // Check if already owned
        const isOwned = inventory.some(
            invItem => invItem.id === item.id || (invItem.name === item.name && invItem.shopId === shop.id)
        );

        if (isOwned) return;

        if (money < item.price) {
            Alert.alert('Insufficient Funds', "You don't have enough cash to buy this item.");
            return;
        }

        // Process Purchase
        Alert.alert(
            'Confirm Purchase',
            `Buy ${item.name} for ${formatMoney(item.price)}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Buy',
                    style: 'default',
                    onPress: () => {
                        // Deduct money
                        updateStats({ money: money - item.price });

                        // Add to inventory
                        addItem({
                            id: item.id,
                            name: item.name,
                            price: item.price,
                            type: item.type,
                            shopId: shop.id,
                            brand: (item as any).brand,
                            location: (item as any).location,
                            purchasedAt: Date.now(),
                        });

                        // If it's a ring, user might want to know it's special
                        if (item.type === 'ring') {
                            Alert.alert('Success', `You purchased ${item.name}! This can be used for proposals.`);
                        } else {
                            Alert.alert('Success', `You are now the owner of ${item.name}!`);
                        }
                    },
                },
            ]
        );
    };

    const renderItem = ({ item }: { item: (typeof shop.items)[0] }) => {
        const isOwned = inventory.some(invItem => invItem.id === item.id);

        return (
            <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemMetaRow}>
                        {(item as any).brand && <Text style={styles.itemBrand}>{(item as any).brand}</Text>}
                        <Text style={styles.itemPrice}>{formatMoney(item.price)}</Text>
                    </View>
                </View>

                <Pressable
                    onPress={() => handleBuy(item)}
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
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <Text style={styles.headerTitle} numberOfLines={1}>
                    {shop.name}
                </Text>
                <View style={styles.balanceContainer}>
                    <Text style={styles.balanceLabel}>CASH</Text>
                    <Text style={styles.balanceValue}>{formatMoney(money)}</Text>
                </View>
            </View>

            <FlatList
                data={shop.items}
                keyExtractor={item => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        color: theme.colors.danger,
        fontSize: 16,
        marginBottom: 20,
    },
    goBackBtn: {
        padding: 10,
        backgroundColor: theme.colors.card,
        borderRadius: 8,
    },
    goBackText: {
        color: theme.colors.textPrimary,
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
        flex: 1,
        textAlign: 'center',
        fontSize: theme.typography.subtitle,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: 0.5,
        marginHorizontal: theme.spacing.md,
    },
    balanceContainer: {
        alignItems: 'flex-end',
        minWidth: 80,
    },
    balanceLabel: {
        color: theme.colors.textMuted,
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    balanceValue: {
        color: theme.colors.success,
        fontSize: theme.typography.caption, // slightly smaller to fit
        fontWeight: '700',
    },
    listContent: {
        padding: theme.spacing.lg,
        gap: theme.spacing.md,
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: theme.colors.card,
        padding: theme.spacing.md,
        borderRadius: theme.radius.md,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: theme.colors.border,
    },
    itemInfo: {
        flex: 1,
        marginRight: theme.spacing.md,
    },
    itemName: {
        color: theme.colors.textPrimary,
        fontSize: theme.typography.body,
        fontWeight: '700',
        marginBottom: 4,
    },
    itemMetaRow: {
        flexDirection: 'column',
        gap: 2,
    },
    itemBrand: {
        color: theme.colors.textSecondary,
        fontSize: theme.typography.caption,
    },
    itemPrice: {
        color: theme.colors.success,
        fontSize: theme.typography.body,
        fontWeight: '700',
        marginTop: 2,
    },
    buyButton: {
        backgroundColor: theme.colors.accent,
        paddingHorizontal: theme.spacing.lg,
        paddingVertical: theme.spacing.sm,
        borderRadius: theme.radius.sm,
        minWidth: 80,
        alignItems: 'center',
    },
    buyButtonPressed: {
        opacity: 0.9,
        transform: [{ scale: 0.98 }],
    },
    buyButtonText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: theme.typography.caption,
    },
    ownedButton: {
        backgroundColor: theme.colors.cardSoft,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    ownedButtonText: {
        color: theme.colors.textMuted,
    },
});

export default ShopDetailScreen;
