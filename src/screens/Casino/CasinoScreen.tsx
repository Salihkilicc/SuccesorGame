import React, {useMemo, useState} from 'react';
import {Alert, Modal, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import AppScreen from '../../components/layout/AppScreen';
import {theme} from '../../theme';
import {useStatsStore} from '../../store';
import type {CasinoStackParamList} from '../../navigation';

type LocationId = 'greece' | 'las_vegas' | 'monaco' | 'montenegro' | 'macau' | 'singapore';

type CasinoLocation = {
  id: LocationId;
  name: string;
  requirement: number;
  tagline: string;
};

const CASINO_LOCATIONS: CasinoLocation[] = [
  {id: 'greece', name: 'Greece', requirement: 0, tagline: 'Open to every guest'},
  {id: 'las_vegas', name: 'Las Vegas', requirement: 20, tagline: 'Strip neon and quick action'},
  {id: 'monaco', name: 'Monaco', requirement: 40, tagline: 'Velvet ropes and old money'},
  {id: 'montenegro', name: 'Montenegro', requirement: 30, tagline: 'Adriatic rooms, tailored service'},
  {id: 'macau', name: 'Macau', requirement: 50, tagline: 'VIP junkets and baccarat whales'},
  {id: 'singapore', name: 'Singapore', requirement: 60, tagline: 'Skyline luxury and crisp floors'},
];

const SLOT_VARIANTS: Array<{
  id: CasinoStackParamList['SlotsGame']['variant'];
  title: string;
  icon: string;
  note: string;
}> = [
  {id: 'street_fighter', title: 'Street Fighter Slots', icon: '🎮', note: 'Volatility: Medium'},
  {id: 'poseidon', title: "Poseidon's Fortune", icon: '🌊', note: 'Volatility: Medium-High'},
  {id: 'high_roller', title: 'High Roller Deluxe', icon: '💎', note: 'Volatility: High'},
];

const CasinoScreen = () => {
  const navigation = useNavigation<NativeStackNavigationProp<CasinoStackParamList>>();
  const {casinoReputation, money} = useStatsStore();
  const [selectedLocation, setSelectedLocation] = useState<LocationId>('greece');
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const reputationValue = useMemo(
    () => Math.max(0, Math.min(100, Math.round(casinoReputation ?? 0))),
    [casinoReputation],
  );

  const location = useMemo(
    () => CASINO_LOCATIONS.find(item => item.id === selectedLocation) ?? CASINO_LOCATIONS[0],
    [selectedLocation],
  );

  const handleSelectLocation = (target: CasinoLocation) => {
    if (reputationValue < target.requirement) {
      Alert.alert(
        'Not enough reputation',
        `Requires Casino Rep ${target.requirement}+ to enter.`,
      );
      return;
    }
    setSelectedLocation(target.id);
    setLocationModalVisible(false);
  };

  const renderSlotCard = (variant: (typeof SLOT_VARIANTS)[number]) => (
    <Pressable
      key={variant.id}
      onPress={() => navigation.navigate('SlotsGame', {variant: variant.id})}
      style={({pressed}) => [styles.slotCard, pressed && styles.cardPressed]}>
      <Text style={styles.slotIcon}>{variant.icon}</Text>
      <Text style={styles.slotTitle}>{variant.title}</Text>
      <Text style={styles.slotNote}>{variant.note}</Text>
      <Text style={styles.slotCta}>Play ›</Text>
    </Pressable>
  );

  return (
    <AppScreen title="Casino" subtitle="Premium Hub">
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}>
          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.pageTitle}>Casino</Text>
            <Text style={styles.pageSubtitle}>
              Pick your location, check your reputation, and dive into the tables.
            </Text>
          </View>
          <View style={styles.bankrollPill}>
            <Text style={styles.pillLabel}>Bankroll</Text>
            <Text style={styles.pillValue}>${money.toLocaleString()}</Text>
          </View>
        </View>

        <View style={styles.topRow}>
          <Pressable
            onPress={() => setLocationModalVisible(true)}
            style={({pressed}) => [styles.locationCard, pressed && styles.cardPressed]}>
            <Text style={styles.locationLabel}>Selected Casino</Text>
            <Text style={styles.locationName}>{location.name}</Text>
            <Text style={styles.locationTagline}>{location.tagline}</Text>
            <Text style={styles.changeHint}>Tap to change location</Text>
          </Pressable>

          <View style={styles.repCard}>
            <Text style={styles.repLabel}>Casino Rep</Text>
            <Text style={styles.repValue}>{reputationValue} / 100</Text>
            <View style={styles.repTrack}>
              <View style={[styles.repFill, {width: `${reputationValue}%`}]} />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Slots</Text>
          <View style={styles.slotGrid}>{SLOT_VARIANTS.map(renderSlotCard)}</View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Roulette</Text>
          <Pressable
            onPress={() => navigation.navigate('RouletteGame')}
            style={({pressed}) => [styles.rouletteCard, pressed && styles.cardPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.rouletteLabel}>European Roulette Table</Text>
              <Text style={styles.rouletteNote}>Single zero, tailored limits.</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('RouletteGame')}
              style={({pressed}) => [styles.playPill, pressed && styles.playPillPressed]}>
              <Text style={styles.playPillText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Texas Shuffle</Text>
          <Pressable
            onPress={() => navigation.navigate('PokerGame')}
            style={({pressed}) => [styles.tableCard, pressed && styles.cardPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.tableTitle}>Texas Hold'em (2 Players)</Text>
              <Text style={styles.tableNote}>Heads-up energy with fast blinds.</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('PokerGame')}
              style={({pressed}) => [styles.playPill, pressed && styles.playPillPressed]}>
              <Text style={styles.playPillText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Blackjack</Text>
          <Pressable
            onPress={() => navigation.navigate('BlackjackGame')}
            style={({pressed}) => [styles.tableCard, pressed && styles.cardPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.tableTitle}>Blackjack 21</Text>
              <Text style={styles.tableNote}>Smooth dealing, quick payouts.</Text>
            </View>
            <Pressable
              onPress={() => navigation.navigate('BlackjackGame')}
              style={({pressed}) => [styles.playPill, pressed && styles.playPillPressed]}>
              <Text style={styles.playPillText}>Play</Text>
            </Pressable>
          </Pressable>
        </View>
      </ScrollView>

      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}>
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setLocationModalVisible(false)}>
          <Pressable style={styles.modalCard} onPress={e => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select Casino Location</Text>
                <Text style={styles.modalSubtitle}>Each floor has its own mood.</Text>
              </View>
              <Pressable
                onPress={() => setLocationModalVisible(false)}
                style={({pressed}) => [styles.closeButton, pressed && styles.cardPressed]}>
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>

            <View style={styles.modalList}>
              {CASINO_LOCATIONS.map(item => {
                const locked = reputationValue < item.requirement;
                const isSelected = item.id === selectedLocation;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleSelectLocation(item)}
                    style={({pressed}) => [
                      styles.locationRow,
                      locked && styles.locationRowLocked,
                      isSelected && styles.locationRowSelected,
                      pressed && styles.cardPressed,
                    ]}>
                    <View style={{flex: 1}}>
                      <View style={styles.locationRowHeader}>
                        <Text style={styles.locationRowName}>
                          {item.name}
                          {locked ? ' 🔒' : ''}
                        </Text>
                        {isSelected ? <Text style={styles.selectedBadge}>Selected</Text> : null}
                      </View>
                      <Text style={styles.locationRowTagline}>{item.tagline}</Text>
                      <Text style={styles.locationRequirement}>
                        {item.requirement > 0
                          ? `Requires Casino Rep ${item.requirement}+`
                          : 'Open to all players'}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
};

export default CasinoScreen;

const styles = StyleSheet.create({
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
    paddingBottom: theme.spacing.xl * 2.5,
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.md,
  },
  pageTitle: {
    color: theme.colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pageSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 19,
    maxWidth: '90%',
  },
  bankrollPill: {
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'flex-start',
    gap: theme.spacing.xs / 2,
  },
  pillLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  pillValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  topRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  locationCard: {
    flex: 1,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  locationLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  locationName: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  locationTagline: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 18,
  },
  changeHint: {
    color: theme.colors.accent,
    fontSize: theme.typography.caption,
    marginTop: theme.spacing.xs,
    fontWeight: '700',
  },
  repCard: {
    width: 150,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    justifyContent: 'center',
  },
  repLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.5,
  },
  repValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  repTrack: {
    height: 8,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: 999,
    overflow: 'hidden',
  },
  repFill: {
    height: '100%',
    backgroundColor: theme.colors.accent,
  },
  section: {
    gap: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  slotCard: {
    flex: 1,
    minWidth: '46%',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  slotIcon: {
    fontSize: 26,
  },
  slotTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body + 2,
    fontWeight: '800',
  },
  slotNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  slotCta: {
    color: theme.colors.accent,
    fontSize: theme.typography.body,
    fontWeight: '700',
    marginTop: theme.spacing.xs,
  },
  rouletteCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rouletteLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body + 1,
    fontWeight: '700',
  },
  rouletteNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  tableCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tableTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body + 1,
    fontWeight: '700',
  },
  tableNote: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  playPill: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  playPillPressed: {
    opacity: 0.85,
    transform: [{scale: 0.98}],
  },
  playPillText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  cardPressed: {
    transform: [{scale: 0.98}],
    opacity: 0.96,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeIcon: {
    fontSize: 16,
    color: theme.colors.textPrimary,
    fontWeight: '800',
  },
  modalList: {
    gap: theme.spacing.sm,
  },
  locationRow: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  locationRowLocked: {
    opacity: 0.5,
  },
  locationRowSelected: {
    borderColor: theme.colors.accent,
  },
  locationRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationRowName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body + 1,
    fontWeight: '800',
  },
  selectedBadge: {
    color: theme.colors.accent,
    fontWeight: '800',
    fontSize: theme.typography.caption,
  },
  locationRowTagline: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  locationRequirement: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
});
