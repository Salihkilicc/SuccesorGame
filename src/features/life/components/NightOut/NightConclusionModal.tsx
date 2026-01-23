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
    enjoymentScore?: number;
    themeColor?: string;
    venueEmoji?: string;
    venueName?: string;
};

type NightConclusionModalProps = {
    visible: boolean;
    data: ConclusionData | null;
    onClose: () => void;
};

const { width } = Dimensions.get('window');

const NightConclusionModal = ({ visible, data, onClose }: NightConclusionModalProps) => {
    if (!visible || !data) return null;

    const themeColor = data.themeColor || '#fff';
    const isVibeCheck = typeof data.enjoymentScore === 'number';

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={() => { }}>
            <View style={styles.backdrop}>
                <View style={[
                    styles.container,
                    isVibeCheck && { borderColor: themeColor, borderWidth: 1 }
                ]}>

                    {/* Header for Vibe Check */}
                    {isVibeCheck && (
                        <View style={styles.header}>
                            <Text style={styles.headerEmoji}>{data.venueEmoji}</Text>
                            <Text style={[styles.headerTitle, { color: themeColor }]}>
                                {data.venueName}
                            </Text>
                        </View>
                    )}

                    {/* VIBE METER */}
                    {isVibeCheck && (
                        <View style={styles.meterContainer}>
                            <Text style={[styles.meterLabel, { color: themeColor }]}>
                                VIBE CHECK: {data.enjoymentScore}%
                            </Text>
                            <View style={styles.progressBarBg}>
                                <View style={[
                                    styles.progressBarFill,
                                    {
                                        width: `${data.enjoymentScore || 0}%`,
                                        backgroundColor: themeColor
                                    }
                                ]} />
                            </View>
                        </View>
                    )}

                    {/* Narrative Text */}
                    <View style={styles.content}>
                        <Text style={[
                            styles.narrativeText,
                            data.isWild && styles.wildText,
                            isVibeCheck && {
                                fontSize: 18,
                                opacity: Math.max(0.6, (data.enjoymentScore || 0) / 100),
                                color: (data.enjoymentScore || 0) > 80 ? '#fff' : '#ccc'
                            }
                        ]}>
                            {data.text}
                        </Text>
                    </View>

                    {/* Minimalist Stat Badges */}
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
        padding: 20
    },
    container: {
        width: '100%',
        maxWidth: 400,
        backgroundColor: '#0a0a0a',
        padding: 32,
        borderRadius: 20,
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12
    },
    headerEmoji: {
        fontSize: 32
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '900',
        textTransform: 'uppercase',
        letterSpacing: 2
    },
    meterContainer: {
        width: '100%',
        marginBottom: 24,
    },
    meterLabel: {
        fontSize: 12,
        fontWeight: '800',
        marginBottom: 8,
        letterSpacing: 1,
        textAlign: 'right'
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#333',
        borderRadius: 4,
        overflow: 'hidden',
        width: '100%'
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4
    },
    content: {
        marginBottom: 32,
        width: '100%'
    },
    narrativeText: {
        color: '#fff',
        fontSize: 22,
        textAlign: 'center',
        fontStyle: 'italic',
        fontWeight: '300',
        lineHeight: 32,
    },
    wildText: {
        color: '#ff4444',
        fontWeight: '600'
    },
    minimalStatsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 32
    },
    badge: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
    },
    badgeText: {
        color: theme.colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 0.5
    },
    closeButton: {
        paddingVertical: 12,
    },
    closeButtonText: {
        color: '#666',
        fontSize: 14,
        textTransform: 'uppercase',
        letterSpacing: 2
    }
});
