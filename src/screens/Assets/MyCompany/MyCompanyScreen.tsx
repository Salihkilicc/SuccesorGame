import React, {useMemo, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {theme} from '../../../theme';
import {useStatsStore} from '../../../store';
import type {AssetsStackParamList} from '../../../navigation';
import RAndDModal from '../../../components/MyCompany/Actions/RAndDModal';
import AcquireStartupModal from '../../../components/MyCompany/Actions/AcquireStartupModal';

const formatMoney = (value: number) => {
  const absolute = Math.abs(value);
  const sign = value < 0 ? '-' : '';

  if (absolute >= 1_000_000_000) {
    const formatted = (absolute / 1_000_000_000).toFixed(1);
    return `${sign}$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}B`;
  }
  if (absolute >= 1_000_000) {
    const formatted = (absolute / 1_000_000).toFixed(1);
    return `${sign}$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}M`;
  }
  if (absolute >= 1_000) {
    const formatted = (absolute / 1_000).toFixed(1);
    return `${sign}$${formatted.endsWith('.0') ? formatted.slice(0, -2) : formatted}K`;
  }
  return `${sign}$${absolute.toLocaleString()}`;
};

type InfoRowProps = {
  label: string;
  value: string;
  tone?: 'danger' | 'success';
};

const InfoRow = ({label, value, tone}: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        tone === 'danger' && {color: theme.colors.danger},
        tone === 'success' && {color: theme.colors.success},
      ]}>
      {value}
    </Text>
  </View>
);

type InvestmentRowProps = {
  icon: string;
  title: string;
  description: string;
  onPress: () => void;
};

const InvestmentRow = ({icon, title, description, onPress}: InvestmentRowProps) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.investmentRow, pressed && styles.rowPressed]}>
    <View style={styles.investmentLabel}>
      <Text style={styles.investmentIcon}>{icon}</Text>
      <View style={{gap: theme.spacing.xs}}>
        <Text style={styles.investmentTitle}>{title}</Text>
        <Text style={styles.investmentDescription}>{description}</Text>
      </View>
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

type ModalCardProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

const ModalCard = ({visible, title, onClose, children}: ModalCardProps) => (
  <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
    <View style={styles.modalBackdrop}>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
        <View />
      </Pressable>
      <View style={styles.modalCard}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <Pressable
            onPress={onClose}
            style={({pressed}) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
            <Text style={styles.closeCircleText}>×</Text>
          </Pressable>
        </View>
        {children}
      </View>
    </View>
  </Modal>
);

type OverlayActionRowProps = {
  title: string;
  description: string;
  onPress: () => void;
};

const OverlayActionRow = ({title, description, onPress}: OverlayActionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.overlayAction, pressed && styles.rowPressed]}>
    <View style={{gap: theme.spacing.xs}}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDescription}>{description}</Text>
    </View>
    <Text style={styles.chevron}>›</Text>
  </Pressable>
);

type BigCardButtonProps = {
  title: string;
  description: string;
  onPress: () => void;
};

const BigCardButton = ({title, description, onPress}: BigCardButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({pressed}) => [styles.bigCard, pressed && styles.bigCardPressed]}>
    <View style={{gap: theme.spacing.xs}}>
      <Text style={styles.bigCardTitle}>{title}</Text>
      <Text style={styles.bigCardDescription}>{description}</Text>
    </View>
    <Text style={styles.bigCardArrow}>↗</Text>
  </Pressable>
);

const EXPERT_COST = 50_000;

const MyCompanyScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const insets = useSafeAreaInsets();
  const {
    shareholders,
    companySharePrice,
    companyRevenueMonthly,
    companyExpensesMonthly,
    companyCapital,
    companyDebtTotal,
    companyValue,
    money,
    setField,
  } = useStatsStore();

  const [isDebtModalVisible, setDebtModalVisible] = useState(false);
  const [isSharesVisible, setSharesVisible] = useState(false);
  const [isShareControlVisible, setShareControlVisible] = useState(false);
  const [isManagementVisible, setManagementVisible] = useState(false);
  const [isRndVisible, setRndVisible] = useState(false);
  const [isAcquireVisible, setAcquireVisible] = useState(false);
  const [isExpertVisible, setExpertVisible] = useState(false);
  const [employeeMorale, setEmployeeMorale] = useState(72);
  const [factoryLevel, setFactoryLevel] = useState(1);
  const [productionCapacity, setProductionCapacity] = useState(120);

  const playerStake = useMemo(
    () => shareholders.find(holder => holder.type === 'player')?.percentage ?? 0,
    [shareholders],
  );

  const profit = companyRevenueMonthly - companyExpensesMonthly;

  const handleExpertPay = () => {
    setField('money', Math.max(0, money - EXPERT_COST));
    console.log('Expert advice granted (placeholder)');
    setExpertVisible(false);
  };

  const adjustMorale = (delta: number) => {
    setEmployeeMorale(current => {
      const next = Math.max(0, Math.min(100, current + delta));
      return next;
    });
    console.log('Employees morale adjusted (placeholder)');
  };

  const handleFactoryTuning = () => {
    setFactoryLevel(level => level + 1);
    setProductionCapacity(cap => cap + 25);
    console.log('Factory tuning placeholder');
  };

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + theme.spacing.xl * 2,
            paddingTop: insets.top + theme.spacing.md,
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={({pressed}) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>My Company</Text>
            <Text style={styles.subtitle}>Financial overview of your main company</Text>
          </View>
        </View>

        <View style={styles.financialBar}>
          <Text style={styles.financialLabel}>Financials</Text>
          <Pressable
            onPress={() => setDebtModalVisible(true)}
            style={({pressed}) => [styles.debtPill, pressed && styles.pillPressed]}>
            <Text style={styles.debtText}>Debts</Text>
            <Text style={styles.debtValue}>{formatMoney(companyDebtTotal)}</Text>
          </Pressable>
        </View>

        <View style={styles.sharesCard}>
          <View style={styles.sharesHeader}>
            <Text style={styles.sharesLabel}>Shares</Text>
            <Pressable
              onPress={() => setSharesVisible(true)}
              style={({pressed}) => [styles.expand, pressed && styles.expandPressed]}>
              <Text style={styles.expandText}>Expand ↗</Text>
            </Pressable>
          </View>
          <Text style={styles.stakeValue}>Your stake: {playerStake}%</Text>
          <Text style={styles.stakeHint}>
            Anchored by family and seasoned investors. Tap to see full list.
          </Text>
        </View>

        <View style={styles.detailsCard}>
          <View style={styles.detailsHeader}>
            <Text style={styles.detailsTitle}>Financial Details</Text>
            <Text style={styles.detailsCaption}>Valuation {formatMoney(companyValue)}</Text>
          </View>
          <View style={styles.detailsRow}>
            <View style={styles.detailsCol}>
              <InfoRow label="Share Price" value={`$${companySharePrice.toFixed(2)}`} />
              <InfoRow label="Monthly Revenue" value={formatMoney(companyRevenueMonthly)} />
              <InfoRow label="Capital" value={formatMoney(companyCapital)} />
            </View>
            <View style={styles.detailsCol}>
              <InfoRow label="Total Debt" value={formatMoney(companyDebtTotal)} tone="danger" />
              <InfoRow label="Monthly Expenses" value={formatMoney(companyExpensesMonthly)} />
              <InfoRow
                label="Profit (Monthly)"
                value={formatMoney(profit)}
                tone={profit >= 0 ? 'success' : 'danger'}
              />
            </View>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Investments</Text>
        </View>
        <View style={styles.investmentsCard}>
          <InvestmentRow
            icon="🔬"
            title="R&D Investment"
            description="Invest in future growth."
            onPress={() => setRndVisible(true)}
          />
          <InvestmentRow
            icon="🧩"
            title="Acquire Company"
            description="Buy new companies to expand your empire."
            onPress={() => setAcquireVisible(true)}
          />
          <InvestmentRow
            icon="🏢"
            title="Existing Companies"
            description="View and manage your current portfolio."
            onPress={() => console.log('Open existing companies management')}
          />
          <InvestmentRow
            icon="🧠"
            title="Expert Advice"
            description="Get premium insights for a fee."
            onPress={() => setExpertVisible(true)}
          />
        </View>

        <View style={styles.bottomRow}>
          <BigCardButton
            title="Share Control"
            description="Dilution, buyback, IPO"
            onPress={() => setShareControlVisible(true)}
          />
          <BigCardButton
            title="Company Management"
            description="Factories, employees, morale"
            onPress={() => setManagementVisible(true)}
          />
        </View>
      </ScrollView>

      <ModalCard
        visible={isDebtModalVisible}
        title="Debts"
        onClose={() => setDebtModalVisible(false)}>
        <View style={{gap: theme.spacing.sm}}>
          <Text style={styles.modalBodyText}>Total Debt: {formatMoney(companyDebtTotal)}</Text>
          <Text style={styles.modalSubText}>Monthly payments (placeholder)</Text>
        </View>
      </ModalCard>

      <ModalCard
        visible={isSharesVisible}
        title="Shareholders"
        onClose={() => setSharesVisible(false)}>
        <View style={styles.shareholderList}>
          {shareholders.map(holder => (
            <View key={holder.id} style={styles.shareholderRow}>
              <Text style={styles.shareholderName}>
                {holder.type === 'player' ? 'You' : holder.name}
              </Text>
              <Text style={styles.shareholderValue}>{holder.percentage}%</Text>
            </View>
          ))}
        </View>
        <Pressable
          onPress={() => setSharesVisible(false)}
          style={({pressed}) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
          <Text style={styles.closeButtonText}>Close</Text>
        </Pressable>
      </ModalCard>

      <ModalCard
        visible={isExpertVisible}
        title="Expert Advice"
        onClose={() => setExpertVisible(false)}>
        <View style={{gap: theme.spacing.md}}>
          <View style={{gap: theme.spacing.xs}}>
            <Text style={styles.modalBodyText}>
              You can ask an expert to review your company and portfolio.
            </Text>
            <Text style={styles.modalSubText}>Cost: {formatMoney(EXPERT_COST)} (placeholder).</Text>
          </View>
          <View style={styles.modalButtonRow}>
            <Pressable
              onPress={() => setExpertVisible(false)}
              style={({pressed}) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleExpertPay}
              style={({pressed}) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>Pay &amp; Ask</Text>
            </Pressable>
          </View>
        </View>
      </ModalCard>

      <ModalCard
        visible={isShareControlVisible}
        title="Share Control"
        onClose={() => setShareControlVisible(false)}>
        <View style={{gap: theme.spacing.md}}>
          <OverlayActionRow
            title="Dilution / New Shareholders"
            description="Issue new shares and bring in new investors."
            onPress={() =>
              console.log('Dilution placeholder: will change shareholders in future')
            }
          />
          <OverlayActionRow
            title="Buyback"
            description="Buy back your own shares to increase your stake."
            onPress={() => console.log('Buyback placeholder')}
          />
          <OverlayActionRow
            title="IPO / Go Public"
            description="Take the company public and unlock new possibilities."
            onPress={() => console.log('IPO placeholder')}
          />
          <Pressable
            onPress={() => setShareControlVisible(false)}
            style={({pressed}) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </ModalCard>

      <ModalCard
        visible={isManagementVisible}
        title="Company Management"
        onClose={() => setManagementVisible(false)}>
        <View style={{gap: theme.spacing.md}}>
          <Pressable
            onPress={handleFactoryTuning}
            style={({pressed}) => [styles.managementRow, pressed && styles.rowPressed]}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.actionTitle}>🏭 Factories &amp; Production</Text>
              <Text style={styles.actionDescription}>
                Adjust production capacity and efficiency.
              </Text>
              <Text style={styles.managementMeta}>
                Level {factoryLevel} • Capacity {productionCapacity} units
              </Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <View style={styles.employeesBlock}>
            <View style={{gap: theme.spacing.xs}}>
              <Text style={styles.actionTitle}>👥 Employees &amp; Morale</Text>
              <Text style={styles.actionDescription}>
                Adjust salaries, bonuses, and morale.
              </Text>
              <Text style={styles.managementMeta}>Current morale: {employeeMorale}%</Text>
            </View>
            <View style={styles.moraleActions}>
              <Pressable
                onPress={() => adjustMorale(-6)}
                style={({pressed}) => [styles.chipButton, pressed && styles.chipButtonPressed]}>
                <Text style={styles.chipText}>Cut Costs</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustMorale(0)}
                style={({pressed}) => [styles.chipButton, pressed && styles.chipButtonPressed]}>
                <Text style={styles.chipText}>Keep Stable</Text>
              </Pressable>
              <Pressable
                onPress={() => adjustMorale(5)}
                style={({pressed}) => [styles.chipButton, pressed && styles.chipButtonPressed]}>
                <Text style={styles.chipText}>Give Bonuses</Text>
              </Pressable>
            </View>
          </View>

          <Pressable
            onPress={() => setManagementVisible(false)}
            style={({pressed}) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </ModalCard>

      <RAndDModal visible={isRndVisible} onClose={() => setRndVisible(false)} />
      <AcquireStartupModal
        visible={isAcquireVisible}
        onClose={() => setAcquireVisible(false)}
      />
    </View>
  );
};

export default MyCompanyScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.card,
  },
  backButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.97}],
  },
  backIcon: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  titleGroup: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  title: {
    fontSize: theme.typography.title,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  subtitle: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  financialBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  financialLabel: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  debtPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.cardSoft,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  debtText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  debtValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  sharesCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.md,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.xs,
  },
  sharesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sharesLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
  },
  expand: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  expandPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.98}],
  },
  expandText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    fontWeight: '700',
  },
  stakeValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  stakeHint: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  detailsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.md,
  },
  detailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  detailsTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  detailsCaption: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
  },
  detailsCol: {
    flex: 1,
    gap: theme.spacing.sm,
  },
  infoRow: {
    gap: theme.spacing.xs / 2,
  },
  infoLabel: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  infoValue: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '800',
  },
  investmentsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  investmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  investmentLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    flex: 1,
  },
  investmentIcon: {
    fontSize: 20,
  },
  investmentTitle: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  investmentDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  chevron: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
  },
  bottomRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  bigCard: {
    flex: 1,
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.md,
    justifyContent: 'space-between',
    minHeight: 120,
  },
  bigCardPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.99}],
  },
  bigCardTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle,
    fontWeight: '800',
  },
  bigCardDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  bigCardArrow: {
    color: theme.colors.textSecondary,
    alignSelf: 'flex-end',
    fontSize: theme.typography.subtitle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '95%',
    maxWidth: 520,
    gap: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.subtitle + 2,
    fontWeight: '800',
  },
  closeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.cardSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeCirclePressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.96}],
  },
  closeCircleText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.subtitle,
    fontWeight: '700',
  },
  modalBodyText: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    lineHeight: 20,
  },
  modalSubText: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  shareholderList: {
    gap: theme.spacing.sm,
  },
  shareholderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.border,
    paddingBottom: theme.spacing.sm,
  },
  shareholderName: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '700',
  },
  shareholderValue: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.body,
  },
  closeButton: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  closeButtonPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
  closeButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  secondaryButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.98}],
  },
  secondaryButtonText: {
    color: theme.colors.textSecondary,
    fontWeight: '700',
    fontSize: theme.typography.body,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: theme.colors.accent,
    borderRadius: theme.radius.sm,
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  primaryButtonPressed: {
    transform: [{scale: 0.98}],
  },
  primaryButtonText: {
    color: theme.colors.textPrimary,
    fontWeight: '800',
    fontSize: theme.typography.body,
  },
  overlayAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  actionTitle: {
    color: theme.colors.textPrimary,
    fontSize: theme.typography.body,
    fontWeight: '800',
  },
  actionDescription: {
    color: theme.colors.textSecondary,
    fontSize: theme.typography.caption + 1,
    lineHeight: 18,
  },
  rowPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.99}],
  },
  managementRow: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
  },
  managementMeta: {
    color: theme.colors.textMuted,
    fontSize: theme.typography.caption,
  },
  employeesBlock: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
  },
  moraleActions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  chipButton: {
    flex: 1,
    backgroundColor: theme.colors.card,
    borderRadius: 999,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  chipButtonPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{scale: 0.98}],
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  pillPressed: {
    backgroundColor: theme.colors.card,
    transform: [{scale: 0.98}],
  },
});
