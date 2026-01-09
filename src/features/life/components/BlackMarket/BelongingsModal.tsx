import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, SafeAreaView } from 'react-native';
import { theme } from '../../../../core/theme';
import { useUserStore, InventoryItem } from '../../../../core/store/useUserStore';

type BelongingsModalProps = {
    visible: boolean;
    onClose: () => void;
};

const formatMoney = (value: number) => `$${value.toLocaleString()}`;

export default function BelongingsModal({ visible, onClose }: BelongingsModalProps) {
    const { inventory } = useUserStore();
    const [activeTab, setActiveTab] = useState<'artifacts' | 'weapons' | 'jewelry' | 'properties' | 'cars' | 'aircrafts' | 'marine'>('artifacts');

    // Filter Logic
    const artifacts = inventory.filter(i => ['art', 'antique'].includes(i.type) || i.type === 'artifact');
    const weapons = inventory.filter(i => i.type === 'weapon');

    // Jewelry: rings, watches, gems, necklaces, etc.
    const jewelry = inventory.filter(i => ['ring', 'watch', 'gem', 'necklace', 'bracelet', 'tiara', 'earrings', 'brooch', 'watch_jewelry', 'jewel'].includes(i.type));

    // Properties: mansions, penthouses, villas, etc.
    const properties = inventory.filter(i => ['penthouse', 'mansion', 'villa', 'estate', 'apartment', 'yali', 'house', 'land', 'ranch', 'chalet', 'vineyard', 'townhouse', 'lodge', 'camp', 'riad', 'resort', 'suite', 'castle', 'island', 'marina'].includes(i.type));

    // Cars
    const cars = inventory.filter(i => i.type === 'car');

    // Aircrafts: planes, helicopters, jets
    const aircrafts = inventory.filter(i => ['plane', 'helicopter', 'jet'].includes(i.type));

    // Marine: yachts, boats, submarines, ships
    const marine = inventory.filter(i => ['yacht', 'boat', 'submarine', 'ship', 'cruise_ship'].includes(i.type));

    const getIcon = (type: string) => {
        if (['plane', 'helicopter', 'jet'].includes(type)) return '✈️';
        if (['yacht', 'boat', 'submarine', 'ship', 'cruise_ship'].includes(type)) return '⚓';
        if (['penthouse', 'mansion', 'villa', 'estate', 'apartment', 'yali', 'house', 'land', 'ranch', 'chalet', 'vineyard', 'townhouse', 'lodge', 'camp', 'riad', 'resort', 'suite', 'castle', 'island', 'marina'].includes(type)) return '🏰';
        if (['ring', 'watch', 'gem', 'necklace', 'bracelet', 'tiara', 'earrings', 'brooch', 'watch_jewelry', 'jewel'].includes(type)) return '💎';
        if (type === 'car') return '🏎️';
        if (type === 'weapon') return '🔫';
        if (type === 'art') return '🎨';
        if (type === 'antique' || type === 'artifact') return '🏺';
        return '📦';
    };

    const renderItem = (item: InventoryItem) => (
        <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemIcon}>
                <Text style={{ fontSize: 24 }}>
                    {getIcon(item.type)}
                </Text>
            </View>
            <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemMeta}>
                    {item.brand || item.location ? (item.brand || item.location) : item.type.toUpperCase()} • {formatMoney(item.price)}
                </Text>
            </View>
        </View>
    );

    let activeList: InventoryItem[] = [];
    switch (activeTab) {
        case 'artifacts': activeList = artifacts; break;
        case 'weapons': activeList = weapons; break;
        case 'jewelry': activeList = jewelry; break;
        case 'properties': activeList = properties; break;
        case 'cars': activeList = cars; break;
        case 'aircrafts': activeList = aircrafts; break;
        case 'marine': activeList = marine; break;
    }

    const TABS = ['artifacts', 'weapons', 'jewelry', 'properties', 'cars', 'aircrafts', 'marine'] as const;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={styles.container}>
                <View style={styles.header}>
                    <Text style={styles.title}>MY BELONGINGS</Text>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Close</Text>
                    </Pressable>
                </View>

                {/* Tabs */}
                <View style={{ height: 60 }}>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabsContainer}>
                        {TABS.map(tab => (
                            <Pressable
                                key={tab}
                                style={[styles.tab, activeTab === tab && styles.activeTab]}
                                onPress={() => setActiveTab(tab)}
                            >
                                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                                    {tab.toUpperCase()}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                </View>

                <ScrollView contentContainerStyle={styles.listContent}>
                    {activeList.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Nothing here yet.</Text>
                        </View>
                    ) : (
                        activeList.map(renderItem)
                    )}
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#121212',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
    closeButton: {
        padding: 8,
    },
    closeText: {
        color: theme.colors.textMuted,
        fontSize: 16,
    },
    tabsContainer: {
        flexDirection: 'row',
        padding: 16,
        gap: 12,
    },
    tab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: '#1E1E1E',
        borderWidth: 1,
        borderColor: '#333',
    },
    activeTab: {
        backgroundColor: '#fff',
        borderColor: '#fff',
    },
    tabText: {
        color: '#888',
        fontSize: 12,
        fontWeight: 'bold',
    },
    activeTabText: {
        color: '#000',
    },
    listContent: {
        padding: 16,
        paddingBottom: 40,
        gap: 12,
    },
    itemCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E1E1E',
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#333',
    },
    itemIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    itemMeta: {
        color: '#666',
        fontSize: 12,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        color: '#444',
        fontSize: 16,
    },
});
