import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../core/theme';

interface CompanyActionsProps {
  onOpenFinance: () => void;
  onOpenBoard: () => void;
  onOpenProduction: () => void;
  onOpenHR: () => void;
}

const ACTIONS = [
  { label: 'Finance Hub', key: 'finance', icon: '🏦', description: 'Capital & debt', borderColor: 'rgba(255, 215, 0, 0.5)', glowColor: '#FFD700' }, // Gold
  { label: 'Boardroom', key: 'board', icon: '📈', description: 'Board & shareholders', borderColor: 'rgba(48, 209, 88, 0.5)', glowColor: '#30D158' }, // Green
  { label: 'Production', key: 'production', icon: '🏭', description: 'Factories & output', borderColor: 'rgba(10, 132, 255, 0.5)', glowColor: '#0A84FF' }, // Blue
  { label: 'Workforce', key: 'hr', icon: '👥', description: 'Employees & morale', borderColor: 'rgba(191, 90, 242, 0.5)', glowColor: '#BF5AF2' }, // Purple
] as const;

const CompanyActions = ({ onOpenFinance, onOpenBoard, onOpenProduction, onOpenHR }: CompanyActionsProps) => {
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
        <Text style={styles.title}>Company Actions</Text>
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
    backgroundColor: '#1C1C1E', // Dark Gray
    borderRadius: theme.radius.md,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#333',
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
    backgroundColor: '#1C1C1E', // Dark Gray - HARDCODED
    borderRadius: 16,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333', // Subtle border - HARDCODED
    gap: theme.spacing.xs,
    // Premium shadows - CRUCIAL
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonPressed: {
    backgroundColor: '#2C2C2E',
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
