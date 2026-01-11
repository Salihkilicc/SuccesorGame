import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Alert,
} from 'react-native';
import { theme } from '../../core/theme';
import { useMarketStore } from '../../core/store/useMarketStore';
import { useAssetsLogic } from '../../features/assets/hooks/useAssetsLogic';

interface PortfolioModalProps {
  visible: boolean;
  onClose: () => void;
}

const PortfolioModal: React.FC<PortfolioModalProps> = ({ visible, onClose }) => {
  const { getPortfolioList } = useAssetsLogic();
  const { buyAsset, sellAsset } = useMarketStore();
  const portfolioList = getPortfolioList();

  const handleBuy = (symbol: string, currentPrice: number, type: 'stock' | 'crypto' | 'bond') => {
    Alert.prompt(
      'Buy Stock',
      `How many shares of ${symbol} would you like to buy at $${currentPrice.toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy',
          onPress: (quantity?: string) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0) {
              buyAsset(symbol, currentPrice, qty, type);
            }
          },
        },
      ],
      'plain-text',
      '1'
    );
  };

  const handleSell = (symbol: string, currentPrice: number, maxQuantity: number) => {
    Alert.prompt(
      'Sell Stock',
      `How many shares of ${symbol} would you like to sell at $${currentPrice.toFixed(2)}? (Max: ${maxQuantity})`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sell',
          onPress: (quantity?: string) => {
            const qty = parseInt(quantity || '0', 10);
            if (qty > 0 && qty <= maxQuantity) {
              sellAsset(symbol, qty, currentPrice);
            } else if (qty > maxQuantity) {
              Alert.alert('Error', `You only have ${maxQuantity} shares`);
            }
          },
        },
      ],
      'plain-text',
      maxQuantity.toString()
    );
  };

  const renderItem = ({ item }: { item: ReturnType<typeof getPortfolioList>[0] }) => {
    const isProfitable = item.profitLoss >= 0;

    return (
      <View style={styles.itemRow}>
        <View style={styles.itemLeft}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemSymbol}>{item.symbol}</Text>
          <Text style={styles.itemQuantity}>{item.quantity} shares @ ${item.averageCost.toFixed(2)}</Text>
        </View>

        <View style={styles.itemRight}>
          <Text style={styles.itemValue}>${item.currentValue.toLocaleString()}</Text>
          <Text style={[styles.itemPL, isProfitable ? styles.profit : styles.loss]}>
            {isProfitable ? '+' : ''}{item.profitLoss.toFixed(2)} ({item.profitLossPercent.toFixed(1)}%)
          </Text>

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.buyButton, pressed && styles.buttonPressed]}
              onPress={() => handleBuy(item.symbol, item.currentPrice, item.type)}>
              <Text style={styles.buyButtonText}>+ Buy</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.sellButton, pressed && styles.buttonPressed]}
              onPress={() => handleSell(item.symbol, item.currentPrice, item.quantity)}>
              <Text style={styles.sellButtonText}>- Sell</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const totalValue = portfolioList.reduce((sum, item) => sum + item.currentValue, 0);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>My Portfolio</Text>
              <Text style={styles.totalValue}>Total Value: ${totalValue.toLocaleString()}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>

          {portfolioList.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No active investments</Text>
              <Text style={styles.emptySubtext}>Buy stocks from the market to get started</Text>
            </View>
          ) : (
            <FlatList
              data={portfolioList}
              keyExtractor={(item) => item.symbol}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radius.lg,
    borderTopRightRadius: theme.radius.lg,
    maxHeight: '85%',
    paddingBottom: theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: theme.spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  totalValue: {
    fontSize: theme.typography.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: theme.colors.textPrimary,
  },
  listContent: {
    padding: theme.spacing.lg,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  itemLeft: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  itemName: {
    fontSize: theme.typography.body,
    fontWeight: '600',
    color: theme.colors.textPrimary,
  },
  itemSymbol: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '700',
  },
  itemQuantity: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
  },
  itemRight: {
    alignItems: 'flex-end',
    gap: theme.spacing.xs,
  },
  itemValue: {
    fontSize: theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  itemPL: {
    fontSize: theme.typography.caption,
    fontWeight: '600',
  },
  profit: {
    color: theme.colors.success,
  },
  loss: {
    color: theme.colors.danger,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.xs,
  },
  buyButton: {
    backgroundColor: theme.colors.success + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.success,
  },
  sellButton: {
    backgroundColor: theme.colors.danger + '20',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.sm,
    borderWidth: 1,
    borderColor: theme.colors.danger,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  buyButtonText: {
    color: theme.colors.success,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  sellButtonText: {
    color: theme.colors.danger,
    fontSize: theme.typography.caption,
    fontWeight: '700',
  },
  separator: {
    height: theme.spacing.sm,
  },
  emptyState: {
    padding: theme.spacing.lg * 2,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyText: {
    fontSize: theme.typography.subtitle,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  emptySubtext: {
    fontSize: theme.typography.caption,
    color: theme.colors.textSecondary,
  },
});

export default PortfolioModal;
