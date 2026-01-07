import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useStatsStore, useUserStore, useGameStore, usePlayerStore } from '../../store';
import { theme } from '../../theme';
import type { LifeStackParamList } from '../../navigation';

type Navigation = NativeStackNavigationProp<LifeStackParamList, 'Profile'>;

const ProfileScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { money, netWorth, companyValue, casinoReputation } = useStatsStore();
  const { core, attributes } = usePlayerStore();
  const { health, stress } = core;
  const charisma = attributes.charm;
  const { name, bio, avatarUrl, partner, hasPremium, setName, setBio } = useUserStore();

  const initials = name?.[0]?.toUpperCase() ?? 'Y';

  const handleChangeAvatar = () => {
    console.log('[Profile] Change Avatar placeholder');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
          <Text style={styles.subtitle}>Your rich identity</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarText}>{initials}</Text>
              )}
            </View>
            <View style={{ flex: 1, gap: theme.spacing.sm }}>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.inputName}
              />
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Your bio"
                placeholderTextColor={theme.colors.textMuted}
                style={styles.inputBio}
                multiline
              />
            </View>
          </View>
          <Pressable
            onPress={handleChangeAvatar}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonText}>Change Avatar (placeholder)</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.grid}>
            <OverviewItem label="Net Worth" value={`$${netWorth.toLocaleString()}`} />
            <OverviewItem label="Cash" value={`$${money.toLocaleString()}`} />
            <OverviewItem label="Charisma" value={`${charisma}`} />
            <OverviewItem label="Health" value={`${health}`} />
            <OverviewItem label="Stress" value={`${stress}`} />
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Status</Text>
          <Text style={styles.statusText}>
            {partner ? `In a relationship with ${partner.name}` : 'Single'}
          </Text>
          <Text style={styles.statusText}>
            CEO of Rich Industries — Value: ${companyValue.toLocaleString()}
          </Text>
          <Text style={styles.statusText}>Casino reputation: {casinoReputation}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Account / Meta</Text>
          <Text style={styles.statusText}>Premium: {hasPremium ? 'Active' : 'Inactive'}</Text>
          <Pressable
            onPress={() => navigation.getParent()?.navigate('Assets', { screen: 'Premium' })}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonText}>Go to Premium</Text>
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('Achievements')}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonText}>View Achievements</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              console.log('[Debug] Stats', useStatsStore.getState());
              console.log('[Debug] Player', usePlayerStore.getState());
              console.log('[Debug] User', useUserStore.getState());
              console.log('[Debug] Game', useGameStore.getState());
            }}
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
            <Text style={styles.secondaryButtonText}>Log State</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

type OverviewItemProps = {
  label: string;
  value: string;
};

const OverviewItem = ({ label, value }: OverviewItemProps) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

export default ProfileScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
  },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  profileRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    alignItems: 'center',
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 999,
  },
  avatarText: {
    color: theme.colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
  },
  inputName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
    padding: 0,
  },
  inputBio: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    padding: 0,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  metricCard: {
    width: '47%',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  metricLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  metricValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  statusText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
  secondaryButton: {
    backgroundColor: theme.colors.accentSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
  secondaryButtonText: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
});
