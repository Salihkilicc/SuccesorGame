import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { theme } from '../../../theme';
import GameModal from '../../../components/common/GameModal';

type Props = {
  result: {
    type: 'win' | 'loss' | 'push';
    amount: number;
  } | null;
  onHide?: () => void;
};

const GameResultPopup = ({ result, onHide }: Props) => {
  // If result is null, modal is not visible
  const visible = !!result;

  if (!result) return null;

  const isWin = result.type === 'win';
  const isPush = result.type === 'push';

  const color = isWin
    ? theme.colors.success
    : isPush
      ? theme.colors.warning
      : theme.colors.danger;

  const label = isWin ? 'WON' : isPush ? 'PUSH' : 'LOST';
  const sign = isWin ? '+' : isPush ? '' : '-';

  return (
    <GameModal
      visible={visible}
      onClose={onHide || (() => { })}
      title={label}
      subtitle={isWin ? 'Congratulations!' : isPush ? 'Draw game.' : 'Better luck next time.'}
    >
      <View style={styles.centerContent}>
        <Text style={[styles.amount, { color }]}>
          {sign}${result.amount.toLocaleString()}
        </Text>
      </View>
    </GameModal>
  );
};

export default GameResultPopup;

const styles = StyleSheet.create({
  centerContent: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  amount: {
    fontSize: 42,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
});
