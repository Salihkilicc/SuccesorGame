import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../../core/theme';

export type ConclusionData = {
    text: string;
    stats: string[];
    isWild?: boolean;
};

type NightConclusionModalProps = {
    visible: boolean;
    data: ConclusionData | null;
    onClose: () => void;
};

const { width } = Dimensions.get('window');

const NightConclusionModal = ({ visible, data, onClose }: NightConclusionModalProps) => {
    if (!visible || !data) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={styles.contentContainer}>
                    <Text style={styles.narrativeText}>
                        {data.text}
                    </Text>

                    <View style={styles.divider} />

                    <View style={styles.minimalStatsRow}>
                        {data.stats.map((stat, index) => (
                            <View key={index} style={styles.badge}>
                                <Text style={styles.badgeText}>{stat}</Text>
                            </View>
                        ))}
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeButtonText}>Close Chapter</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default NightConclusionModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.95)',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
    },
    contentContainer: {
        width: '100%',
        alignItems: 'center',
    },
    narrativeText: {
        color: '#FFF',
        fontSize: 20,
        fontWeight: '500',
        fontFamily: 'System',
        textAlign: 'center',
        lineHeight: 32,
        marginBottom: 32,
        letterSpacing: 0.5,
    },
    divider: {
        width: 40,
        height: 1,
        backgroundColor: '#333',
        marginBottom: 32,
    },
    minimalStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 48,
        justifyContent: 'center',
    },
    badge: {
        backgroundColor: '#1A1A1A',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 100,
        borderWidth: 1,
        borderColor: '#333',
    },
    badgeText: {
        color: '#888',
        fontSize: 12,
        fontWeight: '600',
    },
    closeButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2,
    },
});
