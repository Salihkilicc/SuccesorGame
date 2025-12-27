import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type BlackMarketMenuViewProps = {
    onSelectArt: () => void;
    onSelectAntique: () => void;
    onSelectJewel: () => void;
    onSelectWeapons: () => void;
    onSelectSubstances: () => void;
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

const BlackMarketMenuView = ({
    onSelectArt,
    onSelectAntique,
    onSelectJewel,
    onSelectWeapons,
    onSelectSubstances,
}: BlackMarketMenuViewProps) => {
    return (
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
                    onPress={onSelectWeapons}
                    danger
                />
                <MenuButton
                    icon="💊"
                    title="Street Dealer"
                    subtitle="Quick Fix"
                    onPress={onSelectSubstances}
                    danger
                />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
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
});

export default BlackMarketMenuView;
