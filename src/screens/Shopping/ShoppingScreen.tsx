import React from 'react';
import { View, ScrollView, SafeAreaView, StatusBar, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../../theme';
import { useShopLogic } from './logic/useShopLogic';
import { ShopHeader, ShopListCard, SectionHeader } from './components/ShopUI';

const ShoppingScreen = () => {
    const navigation = useNavigation<any>();
    const { SHOP_DATA, money, formatMoney } = useShopLogic();

    const renderSection = (title: string, categoryFilter: string) => {
        const shops = SHOP_DATA.filter(s => s.category === categoryFilter);
        if (shops.length === 0) return null;

        return (
            <View style={styles.section}>
                <SectionHeader title={title} />
                {shops.map(shop => (
                    <ShopListCard 
                        key={shop.id} 
                        shop={shop} 
                        onPress={() => navigation.navigate('ShopDetail', { shopId: shop.id })} 
                    />
                ))}
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
            
            <ShopHeader 
                title="Shopping" 
                money={money} 
                onBack={() => navigation.goBack()} 
                formatMoney={formatMoney} 
            />

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
    container: { flex: 1, backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.lg, paddingBottom: theme.spacing.xl },
    section: { marginBottom: theme.spacing.xl, gap: theme.spacing.sm },
});

export default ShoppingScreen;