import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import RAndDModal from './Actions/RAndDModal';
import LoanModal from './Actions/LoanModal';
import IssueSharesModal from './Actions/IssueSharesModal';
import AcquireStartupModal from './Actions/AcquireStartupModal';
import { theme } from '../../core/theme';

const ACTIONS = [
  { label: 'R&D Investment', key: 'rnd', icon: '🔬', description: 'Invest in innovation' },
  { label: 'Take Loan', key: 'loan', icon: '💳', description: 'Raise quick capital' },
  { label: 'Issue Shares', key: 'issue', icon: '📈', description: 'Sell equity for cash' },
  { label: 'Acquire Startup', key: 'acquire', icon: '🧩', description: 'Expand your portfolio' },
] as const;

const CompanyActions = () => {
  const [isRAndDVisible, setRAndDVisible] = useState(false);
  const [isLoanVisible, setLoanVisible] = useState(false);
  const [isIssueVisible, setIssueVisible] = useState(false);
  const [isAcquisitionVisible, setAcquisitionVisible] = useState(false);

  const handlePress = (key: (typeof ACTIONS)[number]['key']) => {
    switch (key) {
      case 'rnd':
        setRAndDVisible(true);
        return;
      case 'loan':
        setLoanVisible(true);
        return;
      case 'issue':
        setIssueVisible(true);
        return;
      case 'acquire':
        setAcquisitionVisible(true);
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
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.buttonText}>{action.label}</Text>
            <Text style={styles.description}>{action.description}</Text>
          </Pressable>
        ))}
      </View>

      <RAndDModal visible={isRAndDVisible} onClose={() => setRAndDVisible(false)} />
      <LoanModal visible={isLoanVisible} onClose={() => setLoanVisible(false)} />
      <IssueSharesModal
        visible={isIssueVisible}
        onClose={() => setIssueVisible(false)}
      />
      <AcquireStartupModal
        visible={isAcquisitionVisible}
        onClose={() => setAcquisitionVisible(false)}
      />
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
    backgroundColor: '#2C2C2E', // Light Gray
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
    gap: theme.spacing.xs,
  },
  buttonPressed: {
    backgroundColor: '#3A3A3C',
    transform: [{ scale: 0.98 }],
    borderColor: '#FFD700', // Gold border on press
  },
  icon: {
    fontSize: 22,
  },
  buttonText: {
    color: '#FFFFFF', // White
    fontWeight: '700',
    fontSize: theme.typography.body,
    textAlign: 'center',
  },
  description: {
    color: '#8E8E93', // Text Secondary
    fontSize: theme.typography.caption + 1,
    textAlign: 'center',
  },
});
