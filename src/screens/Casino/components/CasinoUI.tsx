// src/screens/Casino/components/CasinoUI.tsx
import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../theme';

// --- HEADER ---
export const CasinoHeader = ({ onBack, money }: { onBack: () => void, money: number }) => (
    <View style={styles.header}>
        <Pressable onPress={onBack} style={({ pressed }) => [styles.headerLeft, pressed && { opacity: 0.7 }]}>
            <Text style={styles.backIcon}>←</Text>
            <Text style={styles.headerTitle}>Casino</Text>
        </Pressable>
        <Text style={styles.balanceText}>${money.toLocaleString()}</Text>
    </View>
);

// --- REPUTATION BAR ---
export const ReputationSection = ({ reputation }: { reputation: number }) => {
    const safeRep = Math.max(0, Math.min(100, Math.round(reputation)));
    return (
        <View style={styles.repContainer}>
            <View style={styles.repHeader}>
                <Text style={styles.repLabel}>Casino Rep</Text>
                <Text style={styles.repValueText}>{safeRep} / 100</Text>
            </View>
            <View style={styles.repTrack}>
                <View style={[styles.repFill, { width: `${safeRep}%` }]} />
            </View>
        </View>
    );
};

// --- LOCATION BUTTON ---
export const LocationSelector = ({ name, onPress }: { name: string, onPress: () => void }) => (
    <View style={styles.locationContainer}>
        <Pressable onPress={onPress} style={({ pressed }) => [styles.locationButton, pressed && styles.cardPressed]}>
            <Text style={styles.locationLabel}>Selected Casino:</Text>
            <Text style={styles.locationValue}>{name.toUpperCase()}</Text>
        </Pressable>
        <Text style={styles.locationHint}>Tap for other casinos</Text>
    </View>
);

// --- GAME CARDS ---
export const GameRow = ({ title, note, onPress, btnText = 'Play' }: { title: string, note: string, onPress: () => void, btnText?: string }) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.gameRow, pressed && styles.cardPressed]}>
        <View style={{ gap: 4 }}>
            <Text style={styles.gameTitle}>{title}</Text>
            <Text style={styles.gameNote}>{note}</Text>
        </View>
        <Pressable onPress={onPress} style={styles.playButton}>
            <Text style={styles.playButtonText}>{btnText}</Text>
        </Pressable>
    </Pressable>
);

export const SlotCard = ({ title, icon, note, onPress }: any) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.slotCard, pressed && styles.cardPressed]}>
        <Text style={styles.slotIcon}>{icon}</Text>
        <Text style={styles.slotTitle}>{title}</Text>
        <Text style={styles.slotNote}>{note}</Text>
        <Text style={styles.slotCta}>Play ›</Text>
    </Pressable>
);

export const HighRollerCard = ({ title, icon, note, onPress }: any) => (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.highRollerCard, pressed && styles.cardPressed]}>
        <View style={styles.highRollerLeft}>
            <Text style={styles.highRollerIcon}>{icon}</Text>
            <View>
                <Text style={styles.highRollerTitle}>{title}</Text>
                <Text style={styles.highRollerNote}>{note}</Text>
            </View>
        </View>
        <Text style={styles.playCta}>Play ›</Text>
    </Pressable>
);

export const SectionTitle = ({ title }: { title: string }) => (
    <Text style={styles.sectionTitle}>{title}</Text>
);

const styles = StyleSheet.create({
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md, backgroundColor: theme.colors.card, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: theme.colors.border },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
    backIcon: { color: theme.colors.textPrimary, fontSize: 22, fontWeight: '300' },
    headerTitle: { color: theme.colors.textPrimary, fontSize: theme.typography.subtitle, fontWeight: '700' },
    balanceText: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '800', fontVariant: ['tabular-nums'] },
    repContainer: { flex: 1, padding: theme.spacing.md, justifyContent: 'center', gap: theme.spacing.sm },
    repHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    repLabel: { color: theme.colors.textMuted, fontSize: theme.typography.caption },
    repValueText: { color: theme.colors.accent, fontSize: theme.typography.caption, fontWeight: '700' },
    repTrack: { height: 6, backgroundColor: theme.colors.cardSoft, borderRadius: 999, overflow: 'hidden' },
    repFill: { height: '100%', backgroundColor: theme.colors.accent },
    locationContainer: { flex: 1, gap: theme.spacing.xs },
    locationButton: { backgroundColor: theme.colors.cardSoft, padding: theme.spacing.md, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, justifyContent: 'center' },
    locationLabel: { color: theme.colors.textMuted, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
    locationValue: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
    locationHint: { color: 'rgba(255,255,255,0.3)', fontSize: 11, alignSelf: 'center' },
    cardPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
    gameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.card, padding: theme.spacing.lg, borderRadius: theme.radius.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border },
    gameTitle: { color: theme.colors.textPrimary, fontSize: 15, fontWeight: '700' },
    gameNote: { color: theme.colors.textMuted, fontSize: 12 },
    playButton: { backgroundColor: theme.colors.accentSoft, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 999 },
    playButtonText: { color: theme.colors.accent, fontWeight: '700', fontSize: 12 },
    slotCard: { flex: 1, backgroundColor: theme.colors.card, borderRadius: theme.radius.lg, padding: theme.spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: theme.colors.border, alignItems: 'flex-start', gap: 6 },
    slotIcon: { fontSize: 24, marginBottom: 4 },
    slotTitle: { color: theme.colors.textPrimary, fontSize: theme.typography.body, fontWeight: '700' },
    slotNote: { color: theme.colors.textMuted, fontSize: 11 },
    slotCta: { color: theme.colors.accent, fontSize: 12, fontWeight: '700', marginTop: 4 },
    highRollerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: theme.colors.cardSoft, borderWidth: 1, borderColor: theme.colors.accentSoft, borderRadius: theme.radius.lg, padding: theme.spacing.lg },
    highRollerLeft: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md },
    highRollerIcon: { fontSize: 28 },
    highRollerTitle: { color: theme.colors.textPrimary, fontSize: 16, fontWeight: '800' },
    highRollerNote: { color: theme.colors.accent, fontSize: 12, fontWeight: '600' },
    playCta: { color: theme.colors.textPrimary, fontSize: 14, fontWeight: '700' },
    sectionTitle: { color: theme.colors.textSecondary, fontSize: theme.typography.body, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
});