import React, { useMemo, useState, useEffect } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { useStatsStore } from '../../../store';
import { useProductStore } from '../../../store/useProductStore';
import type { AssetsStackParamList } from '../../../navigation';
import RAndDModal from '../../../components/MyCompany/Actions/RAndDModal';
import AcquireStartupModal from '../../../components/MyCompany/Actions/AcquireStartupModal';
import ExistingCompaniesModal from '../../../components/MyCompany/Actions/ExistingCompaniesModal';
import FactoriesModule from '../../../components/MyCompany/Management/FactoriesModule';
import EmployeesModule from '../../../components/MyCompany/Management/EmployeesModule';
import ProductHub from '../../../components/MyCompany/Products/ProductHub';
import ShareControlHub from '../../../components/MyCompany/Shares/ShareControlHub';
import BoardMembersModal from '../../../components/MyCompany/Shares/BoardMembersModal';
import ShareNegotiationModal from '../../../components/MyCompany/Shares/ShareNegotiationModal';
import ShareholderProfileModal from '../../../components/MyCompany/Shares/ShareholderProfileModal';
import GiftSelectionModal from '../../../components/MyCompany/Shares/GiftSelectionModal';
import IPOWarningModal from '../../../components/MyCompany/Shares/IPOWarningModal';
import DilutionModal from '../../../components/MyCompany/Shares/DilutionModal';
import DividendModal from '../../../components/MyCompany/Shares/DividendModal';
import BuybackModal from '../../../components/MyCompany/Shares/BuybackModal';
import { Shareholder } from '../../../store/useStatsStore';
import CorporateFinanceHubModal from '../../../components/MyCompany/Finance/CorporateFinanceHubModal';
import BorrowModal from '../../../components/MyCompany/Finance/BorrowModal';
import RepayModal from '../../../components/MyCompany/Finance/RepayModal';

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

const InfoRow = ({ label, value, tone }: InfoRowProps) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text
      style={[
        styles.infoValue,
        tone === 'danger' && { color: theme.colors.danger },
        tone === 'success' && { color: theme.colors.success },
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

const InvestmentRow = ({ icon, title, description, onPress }: InvestmentRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.investmentRow, pressed && styles.rowPressed]}>
    <View style={styles.investmentLabel}>
      <Text style={styles.investmentIcon}>{icon}</Text>
      <View style={{ gap: theme.spacing.xs }}>
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

const ModalCard = ({ visible, title, onClose, children }: ModalCardProps) => (
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
            style={({ pressed }) => [styles.closeCircle, pressed && styles.closeCirclePressed]}>
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

const OverlayActionRow = ({ title, description, onPress }: OverlayActionRowProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.overlayAction, pressed && styles.rowPressed]}>
    <View style={{ gap: theme.spacing.xs }}>
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

const BigCardButton = ({ title, description, onPress }: BigCardButtonProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.bigCard, pressed && styles.bigCardPressed]}>
    <View style={{ gap: theme.spacing.xs }}>
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
    isPublic,
    companyValue,
    companySharePrice,
    companyDailyChange,
    companyRevenueMonthly,
    companyExpensesMonthly,
    companyCapital,
    companyDebt,
    companyDebtTotal,
    companyOwnership, // Player's %
    productionCapacity,
    factoryCount,
    employeeCount,
    money,
    setField,
    setCompanyCapital,
    borrowCapital,
    repayCapital,
  } = useStatsStore();

  // TEMPORARY: Force update capital for M&A testing
  useEffect(() => {
    if (companyCapital < 100_000_000_000) {
      setCompanyCapital(100_000_000_000);
    }
  }, []);

  const { products } = useProductStore();
  // Root Level Interaction State
  const [activeShareholder, setActiveShareholder] = useState<Shareholder | null>(null);
  const [profileShareholder, setProfileShareholder] = useState<Shareholder | null>(null);
  const [activeAction, setActiveAction] = useState<'gift' | 'negotiate' | null>(null);

  const handleOpenGift = (shareholder: Shareholder) => {
    setActiveShareholder(shareholder);
    setActiveAction('gift');
  };

  const handleOpenNegotiate = (shareholder: Shareholder) => {
    setActiveShareholder(shareholder);
    setActiveAction('negotiate');
  };

  // Share Control Sub-Modal State
  const [activeShareAction, setActiveShareAction] = useState<'ipo' | 'dilution' | 'dividend' | 'buyback' | null>(null);

  const [isDebtModalVisible, setDebtModalVisible] = useState(false);
  const [isBoardMembersVisible, setBoardMembersVisible] = useState(false);
  const [isShareControlVisible, setShareControlVisible] = useState(false);
  const [isManagementVisible, setManagementVisible] = useState(false);
  const [isRndVisible, setRndVisible] = useState(false);

  // Finance Sub-Modal State
  const [borrowConfig, setBorrowConfig] = useState<{ visible: boolean; type: string; rate: number }>({
    visible: false,
    type: '',
    rate: 0,
  });
  const [repayConfig, setRepayConfig] = useState<{ visible: boolean }>({
    visible: false,
  });
  const [isAcquireVisible, setAcquireVisible] = useState(false);
  const [isExistingCompaniesVisible, setExistingCompaniesVisible] = useState(false);
  const [isExpertVisible, setExpertVisible] = useState(false);
  const [isFactoriesVisible, setFactoriesVisible] = useState(false);
  const [isEmployeesVisible, setEmployeesVisible] = useState(false);

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

  return (
    <View style={styles.safeArea}>
      <ScrollView
        style={{ flex: 1 }}
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
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
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
            style={({ pressed }) => [styles.debtPill, pressed && styles.pillPressed]}>
            <Text style={styles.debtText}>Debts</Text>
            <Text style={styles.debtValue}>{formatMoney(companyDebtTotal)}</Text>
          </Pressable>
        </View>

        <View style={styles.sharesCard}>
          <View style={styles.sharesHeader}>
            <Text style={styles.sharesLabel}>Shares</Text>
            <Pressable
              onPress={() => setBoardMembersVisible(true)}
              style={({ pressed }) => [styles.expand, pressed && styles.expandPressed]}>
              <Text style={styles.expandText}>Board Members ↗</Text>
            </Pressable>
          </View>
          <Text style={styles.stakeValue}>Your stake: {playerStake.toFixed(1)}%</Text>
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
            description="Manage subsidiaries"
            onPress={() => setExistingCompaniesVisible(true)}
          />
          <InvestmentRow
            icon="🧠"
            title="Expert Advice"
            description="Get premium insights for a fee."
            onPress={() => setExpertVisible(true)}
          />
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Products</Text>
        </View>
        <ProductHub />

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

      <CorporateFinanceHubModal
        visible={isDebtModalVisible}
        onClose={() => setDebtModalVisible(false)}
        onSelectLoan={(type, rate) => {
          // Close Hub, Open Borrow Modal
          setDebtModalVisible(false);
          setBorrowConfig({ visible: true, type, rate });
        }}
        onSelectRepay={() => {
          // Close Hub, Open Repay Modal
          setDebtModalVisible(false);
          setRepayConfig({ visible: true });
        }}
      />

      {/* Corporate Finance Sub-Modals */}
      {borrowConfig.visible && (
        <BorrowModal
          visible={borrowConfig.visible}
          type={borrowConfig.type}
          rate={borrowConfig.rate}
          maxLimit={Math.max(10_000_000, companyRevenueMonthly * 5)}
          onClose={() => {
            setBorrowConfig({ ...borrowConfig, visible: false });
            setTimeout(() => setDebtModalVisible(true), 300); // Re-open Hub
          }}
          onConfirm={(amount) => {
            borrowCapital(amount, borrowConfig.rate);
            setBorrowConfig({ ...borrowConfig, visible: false });
            setTimeout(() => setDebtModalVisible(true), 300); // Re-open Hub
          }}
        />
      )}

      {repayConfig.visible && (
        <RepayModal
          visible={repayConfig.visible}
          totalDebt={companyDebtTotal}
          cash={companyCapital}
          onClose={() => {
            setRepayConfig({ ...repayConfig, visible: false });
            setTimeout(() => setDebtModalVisible(true), 300); // Re-open Hub
          }}
          onRepay={(amount) => {
            repayCapital(amount);
            setRepayConfig({ ...repayConfig, visible: false });
            setTimeout(() => setDebtModalVisible(true), 300); // Re-open Hub
          }}
        />
      )}

      <BoardMembersModal
        visible={isBoardMembersVisible}
        onClose={() => setBoardMembersVisible(false)}
        onSelectMember={(member) => {
          setBoardMembersVisible(false);
          // Small delay to allow fade out
          setTimeout(() => {
            setProfileShareholder(member);
          }, 300);
        }}
      />

      <ModalCard
        visible={isExpertVisible}
        title="Expert Advice"
        onClose={() => setExpertVisible(false)}>
        <View style={{ gap: theme.spacing.md }}>
          <View style={{ gap: theme.spacing.xs }}>
            <Text style={styles.modalBodyText}>
              You can ask an expert to review your company and portfolio.
            </Text>
            <Text style={styles.modalSubText}>Cost: {formatMoney(EXPERT_COST)} (placeholder).</Text>
          </View>
          <View style={styles.modalButtonRow}>
            <Pressable
              onPress={() => setExpertVisible(false)}
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.secondaryButtonPressed]}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              onPress={handleExpertPay}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}>
              <Text style={styles.primaryButtonText}>Pay &amp; Ask</Text>
            </Pressable>
          </View>
        </View>
      </ModalCard>

      <ShareControlHub
        visible={isShareControlVisible}
        onClose={() => setShareControlVisible(false)}
        onOpenIPO={() => {
          setShareControlVisible(false);
          setTimeout(() => setActiveShareAction('ipo'), 300);
        }}
        onOpenDilution={() => {
          setShareControlVisible(false);
          setTimeout(() => setActiveShareAction('dilution'), 300);
        }}
        onOpenDividend={() => {
          setShareControlVisible(false);
          setTimeout(() => setActiveShareAction('dividend'), 300);
        }}
        onOpenBuyback={() => {
          setShareControlVisible(false);
          setTimeout(() => setActiveShareAction('buyback'), 300);
        }}
      />

      <ModalCard
        visible={isManagementVisible}
        title="Company Management"
        onClose={() => setManagementVisible(false)}>
        <View style={{ gap: theme.spacing.lg }}>
          <Pressable
            onPress={() => {
              setManagementVisible(false);
              setTimeout(() => setFactoriesVisible(true), 300);
            }}
            style={({ pressed }) => [styles.managementRow, pressed && styles.rowPressed]}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={styles.actionTitle}>🏭 Factories & Production</Text>
              <Text style={styles.actionDescription}>Manage infrastructure.</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              setManagementVisible(false);
              setTimeout(() => setEmployeesVisible(true), 300);
            }}
            style={({ pressed }) => [styles.managementRow, pressed && styles.rowPressed]}>
            <View style={{ gap: theme.spacing.xs }}>
              <Text style={styles.actionTitle}>👥 Employees & Morale</Text>
              <Text style={styles.actionDescription}>Manage workforce.</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>

          <Pressable
            onPress={() => setManagementVisible(false)}
            style={({ pressed }) => [styles.closeButton, pressed && styles.closeButtonPressed]}>
            <Text style={styles.closeButtonText}>Close Management</Text>
          </Pressable>
        </View>
      </ModalCard>

      <FactoriesModule visible={isFactoriesVisible} onClose={() => setFactoriesVisible(false)} />
      <EmployeesModule visible={isEmployeesVisible} onClose={() => setEmployeesVisible(false)} />

      <RAndDModal visible={isRndVisible} onClose={() => setRndVisible(false)} />
      <AcquireStartupModal visible={isAcquireVisible} onClose={() => setAcquireVisible(false)} />

      {/* Existing Companies Modal */}
      <ExistingCompaniesModal visible={isExistingCompaniesVisible} onClose={() => setExistingCompaniesVisible(false)} />

      {/* Root Level Modals */}
      {activeShareholder && (
        <>
          <GiftSelectionModal
            visible={activeAction === 'gift'}
            shareholder={activeShareholder}
            onClose={() => setActiveAction(null)}
          />
          <ShareNegotiationModal
            visible={activeAction === 'negotiate'}
            shareholder={activeShareholder}
            onClose={() => setActiveAction(null)}
          />
        </>
      )}

      {profileShareholder && (
        <ShareholderProfileModal
          visible={!!profileShareholder}
          shareholder={profileShareholder}
          onClose={() => {
            setProfileShareholder(null);
            // Small delay to allow fade out
            setTimeout(() => {
              setBoardMembersVisible(true);
            }, 300);
          }}
          onOpenGift={(shareholder) => {
            setProfileShareholder(null);
            setBoardMembersVisible(false);
            setTimeout(() => {
              setActiveShareholder(shareholder);
              setActiveAction('gift');
            }, 300);
          }}
          onOpenNegotiate={(shareholder) => {
            setProfileShareholder(null);
            setBoardMembersVisible(false);
            setTimeout(() => {
              setActiveShareholder(shareholder);
              setActiveAction('negotiate');
            }, 300);
          }}
        />
      )}

      {/* Share Control Sub-Modals */}
      <IPOWarningModal
        visible={activeShareAction === 'ipo'}
        onClose={() => setActiveShareAction(null)}
      />
      <DilutionModal
        visible={activeShareAction === 'dilution'}
        onClose={() => setActiveShareAction(null)}
      />
      <DividendModal
        visible={activeShareAction === 'dividend'}
        onClose={() => setActiveShareAction(null)}
      />
      <BuybackModal
        visible={activeShareAction === 'buyback'}
        onClose={() => setActiveShareAction(null)}
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
    transform: [{ scale: 0.97 }],
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
    transform: [{ scale: 0.98 }],
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
    transform: [{ scale: 0.99 }],
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
    transform: [{ scale: 0.96 }],
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
    transform: [{ scale: 0.98 }],
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
    transform: [{ scale: 0.98 }],
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
    transform: [{ scale: 0.98 }],
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
    transform: [{ scale: 0.99 }],
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
    transform: [{ scale: 0.98 }],
  },
  chipText: {
    color: theme.colors.textPrimary,
    fontWeight: '700',
    fontSize: theme.typography.caption + 1,
  },
  pillPressed: {
    backgroundColor: theme.colors.card,
    transform: [{ scale: 0.98 }],
  },
});
