import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Dimensions,
    ScrollView,
} from 'react-native';
import { theme } from '../../../../core/theme';
import { CLUBS, NightOutClub } from './useNightOutSystem';
import { InventoryItem } from '../../../../core/store/useUserStore';

import NightOutLocationView from './components/NightOutLocationView';
import NightOutTravelView from './components/NightOutTravelView';
import NightOutFooterView from './components/NightOutFooterView';

type NightOutSetupModalProps = {
    visible: boolean;
    onClose: () => void;
    onConfirm: () => void;
    selectedClub: NightOutClub;
    setSelectedClub: (club: NightOutClub) => void;
    selectedAircraft: InventoryItem | null;
    setSelectedAircraft: (item: InventoryItem | null) => void;
    aircrafts: InventoryItem[];
    needsTravel: boolean;
    totalCost: number;
};

const { width } = Dimensions.get('window');

const NightOutSetupModal = ({
    visible,
    onClose,
    onConfirm,
    selectedClub,
    setSelectedClub,
    selectedAircraft,
    setSelectedAircraft,
    aircrafts,
    needsTravel,
    totalCost,
}: NightOutSetupModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <Text style={styles.title}>PLAN YOUR NIGHT</Text>
                    <Text style={styles.subtitle}>Select a destination & travel method</Text>

                    <ScrollView style={styles.scrollContent}>
                        {/* LOCATION SELECTOR */}
                        <NightOutLocationView
                            clubs={CLUBS}
                            selectedClub={selectedClub}
                            onSelectClub={setSelectedClub}
                        />

                        {/* AIRCRAFT SELECTOR (Conditional) */}
                        <NightOutTravelView
                            needsTravel={needsTravel}
                            aircrafts={aircrafts}
                            selectedAircraft={selectedAircraft}
                            onSelectAircraft={setSelectedAircraft}
                        />
                    </ScrollView>

                    {/* FOOTER */}
                    <NightOutFooterView
                        totalCost={totalCost}
                        onConfirm={onConfirm}
                        onClose={onClose}
                    />
                </View>
            </View>
        </Modal>
    );
};

export default NightOutSetupModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
    },
    card: {
        width: Math.min(400, width - 32),
        height: '80%',
        backgroundColor: '#121212',
        borderRadius: theme.radius.lg,
        borderWidth: 1,
        borderColor: '#333',
        padding: 20,
        overflow: 'hidden',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: theme.colors.primary,
        textAlign: 'center',
        marginBottom: 4,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    subtitle: {
        fontSize: 14,
        color: '#888',
        textAlign: 'center',
        marginBottom: 20,
    },
    scrollContent: {
        flex: 1,
    },
});
