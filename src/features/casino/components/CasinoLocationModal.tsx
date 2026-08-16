// src/features/casino/components/CasinoLocationModal.tsx
import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    TouchableOpacity,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CASINO_LOCATIONS, LocationId, CasinoLocation } from '../data/casinoData';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import { formatCompact } from '../../../core/utils';

interface CasinoLocationModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocationId: LocationId;
    unlockedLocations: CasinoLocation[];
    onSelectLocation: (id: LocationId) => void;
}

const CasinoLocationModal: React.FC<CasinoLocationModalProps> = ({
    visible,
    onClose,
    currentLocationId,
    unlockedLocations,
    onSelectLocation,
}) => {
    useLocale();

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

                <View style={styles.modalContent}>
                    {/* Modal Header */}
                    <View style={styles.header}>
                        <View style={styles.headerLeft}>
                            <MaterialCommunityIcons name="map-marker-radius" size={20} color={theme.colors.primary} />
                            <Text style={styles.title}>{t('ui.travelTo') || 'SELECT CASINO DESTINATION'}</Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                            <MaterialCommunityIcons name="close" size={18} color="#FFFFFF" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
                        {CASINO_LOCATIONS.map((loc) => {
                            const isUnlocked = unlockedLocations.some((l) => l.id === loc.id);
                            const isSelected = currentLocationId === loc.id;
                            const isLocked = !isUnlocked;

                            return (
                                <TouchableOpacity
                                    key={loc.id}
                                    onPress={() => {
                                        if (isUnlocked) {
                                            onSelectLocation(loc.id as LocationId);
                                            onClose();
                                        }
                                    }}
                                    activeOpacity={isUnlocked ? 0.75 : 1}
                                    style={[
                                        styles.card,
                                        isSelected && {
                                            borderColor: loc.theme.primary,
                                            shadowColor: loc.theme.primary,
                                            shadowOpacity: 0.4,
                                            shadowRadius: 10,
                                        },
                                        isLocked && styles.cardLocked,
                                    ]}
                                >
                                    {/* City Thematic Background Gradient */}
                                    <LinearGradient
                                        colors={
                                            isLocked
                                                ? ['#20262C', '#181E23']
                                                : isSelected
                                                ? [loc.theme.gradient[0] + '33', '#1C242C']
                                                : ['#2A3238', '#1C242C']
                                        }
                                        style={StyleSheet.absoluteFillObject}
                                        start={{ x: 0, y: 0 }}
                                        end={{ x: 1, y: 1 }}
                                    />

                                    {/* Left City Flag & Icon Badge */}
                                    <View
                                        style={[
                                            styles.iconWrapper,
                                            {
                                                backgroundColor: isLocked ? 'rgba(255,255,255,0.05)' : loc.theme.badgeBg,
                                                borderColor: isLocked ? 'rgba(255,255,255,0.1)' : loc.theme.primary,
                                            },
                                        ]}
                                    >
                                        <Text style={styles.flagEmoji}>{loc.theme.flag}</Text>
                                        <MaterialCommunityIcons
                                            name={isLocked ? 'lock' : (loc.theme.icon as any) || 'cards-playing-outline'}
                                            size={16}
                                            color={isLocked ? theme.colors.textMuted : loc.theme.primary}
                                        />
                                    </View>

                                    {/* Middle Details */}
                                    <View style={styles.detailsBlock}>
                                        <View style={styles.cityNameRow}>
                                            <Text
                                                style={[
                                                    styles.locName,
                                                    { color: isLocked ? theme.colors.textMuted : '#FFFFFF' },
                                                ]}
                                            >
                                                {loc.name.toUpperCase()}
                                            </Text>
                                            <Text style={[styles.locSub, { color: isLocked ? theme.colors.textMuted : loc.theme.textColor }]}>
                                                • {loc.subTitle}
                                            </Text>
                                        </View>

                                        <View style={styles.metaRow}>
                                            {isLocked ? (
                                                <View style={styles.lockedPill}>
                                                    <MaterialCommunityIcons name="shield-lock-outline" size={12} color={theme.colors.negative} />
                                                    <Text style={styles.lockedText}>
                                                        Req: {loc.requirement} Casino Rep
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.maxBetPill}>
                                                    <Text style={[styles.maxBetLabel, { color: loc.theme.primary }]}>
                                                        MAX BET:
                                                    </Text>
                                                    <Text style={styles.maxBetValue}>
                                                        ${formatCompact(loc.maxBet)}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Right Selection Indicator */}
                                    {isSelected ? (
                                        <View style={[styles.currentBadge, { backgroundColor: loc.theme.primary }]}>
                                            <MaterialCommunityIcons name="check" size={14} color="#000000" />
                                            <Text style={styles.currentBadgeText}>{t('ui.current') || 'ACTIVE'}</Text>
                                        </View>
                                    ) : isUnlocked ? (
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                                    ) : (
                                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CasinoLocationModal;

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10, 14, 18, 0.85)',
        justifyContent: 'center',
        padding: 16,
    },
    modalContent: {
        backgroundColor: '#1C242C',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.12)',
        maxHeight: '85%',
        overflow: 'hidden',
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
        elevation: 8,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 18,
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255, 255, 255, 0.08)',
        backgroundColor: '#232C34',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 1.2,
    },
    closeBtn: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    list: {
        padding: 14,
        gap: 10,
    },
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 14,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
    },
    cardLocked: {
        opacity: 0.65,
        borderColor: 'rgba(255, 255, 255, 0.04)',
    },
    iconWrapper: {
        width: 44,
        height: 44,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        marginRight: 12,
        gap: 2,
    },
    flagEmoji: {
        fontSize: 14,
    },
    detailsBlock: {
        flex: 1,
        gap: 3,
    },
    cityNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 4,
    },
    locName: {
        fontSize: 14,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    locSub: {
        fontSize: 11,
        fontWeight: '600',
    },
    metaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 2,
    },
    maxBetPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    maxBetLabel: {
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    maxBetValue: {
        fontSize: 11,
        color: '#FFFFFF',
        fontWeight: '700',
    },
    lockedPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    lockedText: {
        fontSize: 10,
        color: theme.colors.negative,
        fontWeight: '700',
    },
    currentBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    currentBadgeText: {
        color: '#000000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
