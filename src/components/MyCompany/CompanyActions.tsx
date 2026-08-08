// @orphan-ok superseded by features/assets/screens/MyCompanyScreen.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React from 'react';
import { t, useLocale } from '../../core/i18n';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

interface CompanyActionsProps {
  onOpenFinance: () => void;
  onOpenBoard: () => void;
  onOpenProduction: () => void;
  onOpenHR: () => void;
}

const ACTIONS = [
  { label: t('action.financeHub'), key: 'finance', icon: '🏦', description: t('action.capitalDebt'), borderColor: 'rgba(199,52,202,0.5)', glowColor: '#C734CA' }, // Gold
  { label: t('action.boardroom'), key: 'board', icon: '📈', description: t('action.boardShareholders'), borderColor: 'rgba(123,104,215,0.5)', glowColor: '#7B68D7' }, // Green
  { label: t('action.production'), key: 'production', icon: '🏭', description: t('action.factoriesOutput'), borderColor: 'rgba(123,104,215,0.5)', glowColor: '#6004BD' }, // Blue
  { label: t('action.workforce'), key: 'hr', icon: '👥', description: t('action.employeesMorale'), borderColor: 'rgba(199,52,202,0.5)', glowColor: '#6004BD' }, // Purple
] as const;

const CompanyActions = ({ onOpenFinance, onOpenBoard, onOpenProduction, onOpenHR }: CompanyActionsProps) => {
    useLocale();
  const handlePress = (key: (typeof ACTIONS)[number]['key']) => {
    switch (key) {
      case 'finance':
        onOpenFinance();
        return;
      case 'board':
        onOpenBoard();
        return;
      case 'production':
        onOpenProduction();
        return;
      case 'hr':
        onOpenHR();
        return;
      default:
        return;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('action.companyActions')}</Text>
      </View>
      <View style={styles.grid}>
        {ACTIONS.map(action => (
          <Pressable
            key={action.key}
            onPress={() => handlePress(action.key)}
            style={({ pressed }) => [
              styles.button,
              { borderColor: action.borderColor },
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.buttonText}>{action.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

export default CompanyActions;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#020626', // Dark Gray
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF', // White
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  button: {
    flexBasis: '48%',
    backgroundColor: '#0B0635', // Dark Gray - HARDCODED
    borderRadius: 16,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)', // Subtle border - HARDCODED
    gap: theme.spacing.xs,
    // Premium shadows - CRUCIAL
    shadowColor: '#020626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonPressed: {
    backgroundColor: '#0B0635',
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.6,
    elevation: 12,
  },
  icon: {
    fontSize: 22,
  },
  buttonText: {
    color: '#FFFFFF', // White - HARDCODED
    fontWeight: '700',
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
  description: {
    color: '#FFFFFF', // White - HARDCODED
    fontSize: theme.typography.caption + 1,
    textAlign: 'center',
    opacity: 0.7,
  },
});
