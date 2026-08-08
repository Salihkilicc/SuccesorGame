import React from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, FlatList, SafeAreaView, StyleSheet, Text, Pressable } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { theme } from '../../../core/theme';
import { useShopLogic, ShopItem } from '../hooks/useShopping'; // Yeni Hook
import { ShopHeader, ShopItemCard } from '../components/ShopUI'; // Yeni UI
import { useEncounterSystem } from '../../../features/love/components/useEncounterSystem';
import { EncounterModal } from '../../../components';

const ShopDetailScreen = () => {
    useLocale();
    const route = useRoute<any>();
    const navigation = useNavigation();
    const { shopId } = route.params;

    const {
        isVisible: isEncounterVisible,
        currentScenario,
        candidate,
        triggerEncounter,
        handleDate,
        closeEncounter
    } = useEncounterSystem();

    const { shop, money, handleBuy, checkIfOwned, formatMoney, getDiscountedPrice, discountPercent } = useShopLogic(
        shopId,
        (type: string) => {
            const hasEncounter = triggerEncounter(type);
            return !!hasEncounter;
        }
    );

    if (!shop) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>{t('ui.shopNotFound')}</Text>
                <Pressable onPress={() => navigation.goBack()} style={styles.goBackBtn}>
                    <Text style={styles.goBackText}>{t('ui.goBack')}</Text>
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
                        isOwned={checkIfOwned(item.id)}
                        onBuy={() => handleBuy(item)}
                        formatMoney={formatMoney}
                        // Apply discount and show it by modifying item
                        item={{ ...item, price: getDiscountedPrice(item.price) }}
                    />
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            />

            {/* ENCOUNTER MODAL */}
            <EncounterModal
                visible={isEncounterVisible}
                candidate={candidate}
                scenario={currentScenario}
                context="shopping"
                onDate={handleDate}
                onHookup={() => {
                    // Simple feedback for hookup in shopping context (store clerk?)
                    closeEncounter();
                }}
                onIgnore={closeEncounter}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#1C242C' },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    errorText: { color: theme.colors.warning, fontSize: 16, marginBottom: 20 },
    goBackBtn: { padding: 10, backgroundColor: '#434B50', borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
    goBackText: { color: '#FFFFFF' },
    listContent: { padding: theme.spacing.lg },
});

export default ShopDetailScreen;