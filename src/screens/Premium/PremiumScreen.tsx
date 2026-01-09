import React from 'react';
import { SafeAreaView, ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import PremiumBadge from '../../components/common/PremiumBadge';
import PremiumGate from '../../components/common/PremiumGate';
import { useUserStore } from '../../core/store';
import type { AssetsStackParamList } from '../../navigation';

const perks = [
  'VIP & Ultra VIP casino odalarına erişim',
  'Market’te Expert Analyst yorumları',
  'Daha zengin ve daha sık AI event’leri',
  'Reklamsız deneyim (placeholder)',
];

type Navigation = NativeStackNavigationProp<AssetsStackParamList, 'Premium'>;

const PremiumScreen = () => {
  const navigation = useNavigation<Navigation>();
  const { hasPremium, setHasPremium } = useUserStore();

  const handleUnlock = async () => {
    console.log('Premium unlocked (placeholder, no real payment)');
    await setHasPremium(true);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <PremiumBadge size="large" />
          <Text style={styles.title}>Premium Succesor</Text>
          <Text style={styles.subtitle}>
            Daha fazla erişim, daha güçlü yorumlar ve görünmez avantajlar için tek dokunuşla yükselt.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Avantajlar</Text>
          <View style={styles.list}>
            {perks.map(item => (
              <View key={item} style={styles.listItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        <PremiumGate
          hasPremium={hasPremium}
          fallback={
            <Text style={styles.helper}>
              Premium açık değil. Aşağıdaki butonla test amaçlı aktifleştirebilirsin.
            </Text>
          }>
          <Text style={styles.helper}>Premium açık. VIP içeriklere erişimin hazır.</Text>
        </PremiumGate>

        <Pressable
          onPress={handleUnlock}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
          <Text style={styles.primaryLabel}>Unlock Premium (Placeholder)</Text>
        </Pressable>

        <Text style={styles.note}>
          Gerçek ödeme entegrasyonu daha sonra eklenecek (placeholder).
        </Text>

        <Pressable
          onPress={() => navigation.goBack()}
          style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
          <Text style={styles.secondaryLabel}>Geri dön</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default PremiumScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    padding: 20,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
  },
  subtitle: {
    fontSize: 15,
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: '#ffffff',
    padding: 16,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e5e7eb',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    gap: 10,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  list: {
    gap: 6,
  },
  listItem: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    color: '#d97706',
    fontSize: 16,
    fontWeight: '800',
  },
  listText: {
    flex: 1,
    fontSize: 14,
    color: '#1f2937',
    lineHeight: 20,
  },
  helper: {
    color: '#6b7280',
    fontSize: 13,
    lineHeight: 18,
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 10,
  },
  primaryButton: {
    backgroundColor: '#111827',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    backgroundColor: '#0b1220',
    transform: [{ scale: 0.98 }],
  },
  primaryLabel: {
    color: '#fef3c7',
    fontWeight: '800',
    fontSize: 15,
  },
  note: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonPressed: {
    opacity: 0.8,
  },
  secondaryLabel: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 14,
  },
});
