import React from 'react';
import {Pressable, Text, StyleSheet} from 'react-native';

type LoveActionButtonProps = {
  label: string;
  emoji: string;
  onPress: () => void;
  disabled?: boolean;
};

const LoveActionButton = ({
  label,
  emoji,
  onPress,
  disabled = false,
}: LoveActionButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({pressed}) => [
      styles.button,
      disabled && styles.buttonDisabled,
      pressed && !disabled && styles.buttonPressed,
    ]}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.label}>{label}</Text>
  </Pressable>
);

export default LoveActionButton;

const styles = StyleSheet.create({
  button: {
    flexBasis: '48%',
    backgroundColor: '#ec4899',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 6,
  },
  buttonPressed: {
    backgroundColor: '#db2777',
    transform: [{scale: 0.98}],
  },
  buttonDisabled: {
    backgroundColor: '#fbcfe8',
  },
  emoji: {
    fontSize: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});
