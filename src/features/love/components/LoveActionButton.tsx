import React from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../../core/theme';

type LoveActionButtonProps = {
  title: string;
  description?: string;
  emoji: string;
  onPress: () => void;
  disabled?: boolean;
};

const LoveActionButton = ({
  title,
  description,
  emoji,
  onPress,
  disabled = false,
}: LoveActionButtonProps) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={({ pressed }) => [
      styles.button,
      disabled && styles.buttonDisabled,
      pressed && !disabled && styles.buttonPressed,
    ]}>
    <Text style={styles.emoji}>{emoji}</Text>
    <Text style={styles.label}>{title}</Text>
    {description ? <Text style={styles.description}>{description}</Text> : null}
  </Pressable>
);

export default LoveActionButton;

const styles = StyleSheet.create({
  button: {
    flexBasis: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.accentSoft,
  },
  buttonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.98 }],
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  description: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
});
