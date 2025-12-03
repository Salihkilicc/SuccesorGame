import React, {useState} from 'react';
import {View, Text, StyleSheet, Pressable} from 'react-native';
import RAndDModal from './Actions/RAndDModal';
import LoanModal from './Actions/LoanModal';
import IssueSharesModal from './Actions/IssueSharesModal';
import AcquireStartupModal from './Actions/AcquireStartupModal';

const ACTIONS = [
  {label: '🔬 R&D Investment', key: 'rnd'},
  {label: '💳 Take Loan', key: 'loan'},
  {label: '📈 Issue Shares', key: 'issue'},
  {label: '🧩 Acquire Startup', key: 'acquire'},
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
            style={({pressed}) => [
              styles.button,
              pressed && styles.buttonPressed,
            ]}>
            <Text style={styles.buttonText}>{action.label}</Text>
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
    backgroundColor: '#0C0F1A',
    borderRadius: 14,
    padding: 16,
    gap: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#181C2A',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EEF2FF',
    letterSpacing: 0.3,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  button: {
    flexBasis: '48%',
    backgroundColor: '#1B2340',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#263157',
  },
  buttonPressed: {
    backgroundColor: '#202A4A',
    transform: [{scale: 0.98}],
  },
  buttonText: {
    color: '#E6ECF7',
    fontWeight: '700',
    fontSize: 14,
    textAlign: 'center',
  },
});
