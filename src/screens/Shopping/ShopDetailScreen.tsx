import React from 'react';
import { View, FlatList, SafeAreaView, StyleSheet, Text, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useShopLogic, ShopItem } from './logic/useShopLogic'; // Yeni Hook
import { ShopHeader, ShopItemCard } from './components/ShopUI'; // Yeni UI

const ShopDetailScreen = () => {
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { shopId } = route.params;

    const { shop, money, handleBuy, checkIfOwned, formatMoney } = useShopLogic(shopId);

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

    return (
        <SafeAreaView style={styles.container}>
            <ShopHeader
                title={shop.name}
                money={money}
                onBack={() => navigation.goBack()}
                formatMoney={formatMoney}
            />

            <FlatList
                data={shop.items}
                keyExtractor={item => item.id}
                renderItem={({ item }: { item: ShopItem }) => (
                    <ShopItemCard
                        item={item}
                        isOwned={checkIfOwned(item.id)}
                        onBuy={() => handleBuy(item)}
                        formatMoney={formatMoney}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: theme.colors.danger, fontSize: 16, marginBottom: 20 },
    goBackBtn: { padding: 10, backgroundColor: theme.colors.card, borderRadius: 8 },
    goBackText: { color: theme.colors.textPrimary },
    listContent: { padding: theme.spacing.lg },
});

export default ShopDetailScreen;