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
import { CASINO_LOCATIONS, LocationId, CasinoLocation, VIP_LOCATION } from '../data/casinoData';
import { t, useLocale } from '../../../core/i18n';
import { theme } from '../../../core/theme';
import { formatCompact } from '../../../core/utils';
import {
  translateCasinoLocationName,
  translateCasinoLocationSubtitle,
} from '../../../data/i18n/casinoText';
import { maxBetFor } from '../data/casinoStakes';
import { useStatsStore } from '../../../core/store/useStatsStore';

interface CasinoLocationModalProps {
    visible: boolean;
    onClose: () => void;
    currentLocationId: LocationId;
    unlockedLocations: CasinoLocation[];
    onSelectLocation: (id: LocationId) => void;
    // ----------------------------------------------------------------------
    //  THE PRIVATE ROOM, WHICH IS NOT A CITY
    // ----------------------------------------------------------------------
    //  Reported twice in one sentence: the noir button breaks the casino card
    //  when it appears, and it should live at the bottom of the countries in
    //  travel, "like a country button but not a country, the premium place
    //  only the important people play in".
    //
    //  It broke the card because it was a second control in the header row
    //  beside the travel button - two pills competing for a width that only
    //  fits one, so the row wrapped and took the layout with it.
    //
    //  And travel is where it belongs. Every other way of changing where you
    //  are playing is in this list; the room was the one exception, and being
    //  an exception is what put it in the header in the first place.
    //
    //  Optional, so a caller that has no VIP door simply does not draw one.
    // ----------------------------------------------------------------------
    vipVisible?: boolean;
    vipAllowed?: boolean;
    vipLabel?: string;
    inVip?: boolean;
    onVipPress?: () => void;
}

const CasinoLocationModal: React.FC<CasinoLocationModalProps> = ({
    visible,
    onClose,
    currentLocationId,
    unlockedLocations,
    onSelectLocation,
    vipVisible,
    vipAllowed,
    vipLabel,
    inVip,
    onVipPress,
}) => {
    useLocale();
    /**
     * The ceiling is a share of what the player has, so this list has to know
     * how rich they are. It used to print a constant. See data/casinoStakes.ts.
     */
    const playerMoney = useStatsStore(st => st.money);

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
                            <Text style={styles.title}>{t('casino.selectDestination')}</Text>
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
                                                {translateCasinoLocationName(loc.name).toUpperCase()}
                                            </Text>
                                            <Text style={[styles.locSub, { color: isLocked ? theme.colors.textMuted : loc.theme.textColor }]}>
                                                • {translateCasinoLocationSubtitle(loc.subTitle)}
                                            </Text>
                                        </View>

                                        <View style={styles.metaRow}>
                                            {isLocked ? (
                                                <View style={styles.lockedPill}>
                                                    <MaterialCommunityIcons name="shield-lock-outline" size={12} color={theme.colors.negative} />
                                                    <Text style={styles.lockedText}>
                                                        {t('casino.reqRep').replace('{rep}', String(loc.requirement))}
                                                    </Text>
                                                </View>
                                            ) : (
                                                <View style={styles.maxBetPill}>
                                                    <Text style={[styles.maxBetLabel, { color: loc.theme.primary }]}>
                                                        {t('casino.maxBet')}:
                                                    </Text>
                                                    <Text style={styles.maxBetValue}>
                                                        ${formatCompact(maxBetFor(loc, playerMoney))}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {/* Right Selection Indicator */}
                                    {isSelected ? (
                                        <View style={[styles.currentBadge, { backgroundColor: loc.theme.primary }]}>
                                            <MaterialCommunityIcons name="check" size={14} color="#000000" />
                                            <Text style={styles.currentBadgeText}>{t('casino.active')}</Text>
                                        </View>
                                    ) : isUnlocked ? (
                                        <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.textMuted} />
                                    ) : (
                                        <MaterialCommunityIcons name="lock-outline" size={20} color={theme.colors.textMuted} />
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                        {/* ----------------------------------------------
                            AND THE ROOM THAT IS NOT A CITY

                            Last, under all of them, and deliberately not
                            styled like one: no flag, no reputation gate, a
                            gold hairline and a crown. It should read as the
                            place at the end of the list rather than as the
                            sixth city.
                           ---------------------------------------------- */}
                        {vipVisible && (
                            <TouchableOpacity
                                onPress={() => { onVipPress?.(); onClose(); }}
                                activeOpacity={vipAllowed || inVip ? 0.75 : 1}
                                style={[styles.vipRow, !(vipAllowed || inVip) && styles.vipRowShut]}
                            >
                                <View style={styles.vipBadge}>
                                    <MaterialCommunityIcons
                                        name="crown-outline"
                                        size={18}
                                        color={VIP_LOCATION.theme.primary}
                                    />
                                </View>
                                <View style={styles.detailsBlock}>
                                    <Text style={[styles.locName, { color: VIP_LOCATION.theme.primary }]}>
                                        {translateCasinoLocationName(VIP_LOCATION.name).toUpperCase()}
                                    </Text>
                                    <Text style={styles.vipSub}>{vipLabel}</Text>
                                </View>
                                <MaterialCommunityIcons
                                    name={vipAllowed || inVip ? 'chevron-right' : 'lock'}
                                    size={20}
                                    color={vipAllowed || inVip ? VIP_LOCATION.theme.primary : theme.colors.textMuted}
                                />
                            </TouchableOpacity>
                        )}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

export default CasinoLocationModal;

const styles = StyleSheet.create({
    /**
     * A country button that is plainly not a country.
     *
     * Same height and the same three columns as a city row, so it belongs to
     * the list; a gold hairline and no flag, so nobody mistakes it for one.
     */
    vipRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 14,
        marginTop: 4,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: 'rgba(239, 201, 76, 0.45)',
        backgroundColor: 'rgba(239, 201, 76, 0.06)',
    },
    vipRowShut: { opacity: 0.55 },
    vipBadge: {
        width: 38,
        height: 38,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(239, 201, 76, 0.45)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    vipSub: {
        color: theme.colors.textMuted,
        fontSize: 11,
        marginTop: 2,
    },
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
        // The badge takes the room's primary and every room primary is a
        // light colour, #05A8F6 through #EFC94C. Dark on those measures 7.9
        // to 13.1; white on the gold room would be 1.60.
        // @contrast-checked loc.theme.primary
        color: '#000000',
        fontSize: 10,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
});
