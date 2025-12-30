import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../../../theme';
import { useStatsStore, useGameStore } from '../../../store';
import { useProductStore } from '../../../store/useProductStore';
import type { AssetsStackParamList } from '../../../navigation';
import { formatCurrency } from './NativeEconomy';



// --- COMPONENTS ---
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
import GameModal from '../../../components/common/GameModal';
import SectionCard from '../../../components/common/SectionCard';
import GameButton from '../../../components/common/GameButton';
import ManagementCard from '../../../components/MyCompany/ManagementCard';

type DepartmentCardProps = {
  icon: string;
  title: string;
  subtitle: string;
  onPress: () => void;
};

const DepartmentCard = ({ icon, title, subtitle, onPress }: DepartmentCardProps) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [styles.departmentCard, pressed && styles.departmentCardPressed]}
  >
    <Text style={styles.departmentIcon}>{icon}</Text>
    <Text style={styles.departmentTitle}>{title}</Text>
    <Text style={styles.departmentSubtitle}>{subtitle}</Text>
  </Pressable>
);

const MyCompanyScreen = () => {
  const navigation =
    useNavigation<NativeStackNavigationProp<AssetsStackParamList>>();
  const insets = useSafeAreaInsets();

  // Store Data
  const {
    companySharePrice,
    companyDailyChange,
    companyDebtTotal,
    companyOwnership,
    employeeCount,
    borrowCapital,
    repayCapital,
    companyValue,
    companyCapital,
    money: playerCash,
    netWorth: playerNetWorth,
    monthlyIncome: playerIncome,

    monthlyExpenses: playerExpenses,
    setField,
    factoryCount,
  } = useStatsStore();

  const handlePurchaseFactory = (delta: number) => {
    if (delta === 0) return;

    const cost = Math.abs(delta) * 50_000_000;
    const newCount = factoryCount + delta;

    if (delta > 0) {
      // Buying factories
      if (companyCapital < cost) {
        Alert.alert('Insufficient Capital', 'You cannot afford this expansion.');
        return;
      }
      setField('companyCapital', companyCapital - cost);
      setField('factoryCount', newCount);
      Alert.alert('Success', `Purchased ${delta} Factories!`);
    } else {
      // Selling factories
      const refund = cost * 0.5; // 50% refund
      setField('companyCapital', companyCapital + refund);
      setField('factoryCount', newCount);
      Alert.alert('Success', `Sold ${Math.abs(delta)} Factories for ${refund.toLocaleString()}!`);
    }
  };

  const handleHireEmployees = (delta: number) => {
    if (delta === 0) return;

    const cost = Math.abs(delta) * 5_000;
    const newCount = employeeCount + delta;
    const currentLimit = factoryCount * 500;

    if (delta > 0) {
      // Hiring employees
      if (companyCapital < cost) {
        Alert.alert('Insufficient Capital', 'You cannot afford these hiring fees.');
        return;
      }
      if (newCount > currentLimit) {
        Alert.alert('Capacity Reached', `Each factory supports 500 employees. Build more factories first.`);
        return;
      }
      setField('companyCapital', companyCapital - cost);
      setField('employeeCount', newCount);
      Alert.alert('Success', `Hired ${delta} Employees!`);
    } else {
      // Firing employees (no refund, just severance cost)
      setField('companyCapital', companyCapital - cost); // Severance pay
      setField('employeeCount', newCount);
      Alert.alert('Notice', `Fired ${Math.abs(delta)} Employees (Severance: $${cost.toLocaleString()})`);
    }
  };

  const { resetGame } = useGameStore();
  const { products } = useProductStore();

  // --- REMOVED QUARTERLY REPORT LOGIC AND STATE ---

  const handleRestartGame = async () => {
    try {
      await resetGame();
    } catch (e) {
      console.error("Failed to restart game", e);
    }
  };

  // State Management
  const [activeShareholder, setActiveShareholder] = useState<Shareholder | null>(null);
  const [profileShareholder, setProfileShareholder] = useState<Shareholder | null>(null);
  const [activeAction, setActiveAction] = useState<'gift' | 'negotiate' | null>(null);
  const [activeShareAction, setActiveShareAction] = useState<'ipo' | 'dilution' | 'dividend' | 'buyback' | null>(null);

  // Modal Visibilities
  const [isFinanceHubVisible, setFinanceHubVisible] = useState(false);
  const [isProductHubVisible, setProductHubVisible] = useState(false);
  const [isManagementHubVisible, setManagementHubVisible] = useState(false);
  const [isShareControlVisible, setShareControlVisible] = useState(false);
  const [isBoardMembersVisible, setBoardMembersVisible] = useState(false);
  const [isRndVisible, setRndVisible] = useState(false);
  const [isAcquireVisible, setAcquireVisible] = useState(false);
  const [isExistingCompaniesVisible, setExistingCompaniesVisible] = useState(false);

  // Sub Modals
  const [isFactoriesVisible, setFactoriesVisible] = useState(false);
  const [isEmployeesVisible, setEmployeesVisible] = useState(false);

  const [borrowConfig, setBorrowConfig] = useState<{ visible: boolean; type: string; rate: number }>({
    visible: false,
    type: '',
    rate: 0,
  });
  const [repayConfig, setRepayConfig] = useState<{ visible: boolean }>({
    visible: false,
  });

  const activeProductsCount = products.filter(p => p.status === 'active').length;

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

        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => {
              if (navigation.canGoBack()) navigation.goBack();
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}>
            <Text style={styles.backIcon}>←</Text>
          </Pressable>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>Command Center</Text>
            <Text style={styles.subtitle}>Manage your company operations</Text>
          </View>
        </View>

        {/* Unified Company Header Card */}
        <View style={styles.headerCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.companyTitle}>My Company</Text>

          </View>

          <View style={styles.shareRow}>
            <Text style={styles.sharePrice}>${companySharePrice.toFixed(2)}</Text>
            <Text style={[
              styles.shareChange,
              (companyDailyChange || 0) >= 0 ? styles.changePositive : styles.changeNegative
            ]}>
              {(companyDailyChange || 0) >= 0 ? '+' : ''}{(companyDailyChange || 0).toFixed(2)}%
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Valuation</Text>
              <Text style={styles.statValue}>{formatCurrency(companyValue || 0)}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Capital</Text>
              <Text style={styles.statValue}>{formatCurrency(companyCapital || 0)}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>CEO Cash</Text>
              <Text style={[styles.statValue, styles.textSuccess]}>
                {formatCurrency(playerCash || 0)}
              </Text>
            </View>
          </View>
        </View>

        {/* Player Personal Finance Card */}
        <View style={styles.headerCard}>
          <Text style={[styles.companyTitle, { fontSize: 18, marginBottom: 8 }]}>Personal Finances</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Net Worth</Text>
              <Text style={styles.statValue}>{formatCurrency(playerNetWorth || 0)}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Income</Text>
              <Text style={[styles.statValue, styles.textSuccess]}>+{formatCurrency(playerIncome || 0)}</Text>
            </View>
            <View style={styles.statSeparator} />
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Expenses</Text>
              <Text style={[styles.statValue, styles.textDanger]}>-{formatCurrency(playerExpenses || 0)}</Text>
            </View>
          </View>
        </View>

        {/* Operations Management Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>OPERATIONS MANAGEMENT</Text>
        </View>

        <View style={{ gap: 12 }}>
          <ManagementCard
            title="Factories"
            icon="🏭"
            currentValue={factoryCount}
            maxValue={Math.floor((companyCapital || 0) / 50_000_000)}
            costPerUnit={50_000_000}
            onSave={handlePurchaseFactory}
          />
          <ManagementCard
            title="Employees"
            icon="👥"
            currentValue={employeeCount}
            maxValue={Math.min(
              Math.floor((companyCapital || 0) / 5_000),
              (factoryCount * 500) - employeeCount
            )}
            costPerUnit={5_000}
            onSave={handleHireEmployees}
          />
        </View>

        {/* Departments Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>DEPARTMENTS</Text>
        </View>

        <View style={styles.departmentsGrid}>
          <DepartmentCard
            icon="🏦"
            title="Finance"
            subtitle={`Debt: ${formatCurrency(companyDebtTotal)}`}
            onPress={() => setFinanceHubVisible(true)}
          />
          <DepartmentCard
            icon="🏭"
            title="Products"
            subtitle={`${activeProductsCount} Active`}
            onPress={() => setProductHubVisible(true)}
          />
          <DepartmentCard
            icon="👥"
            title="HR & Management"
            subtitle={`${employeeCount} Employees`}
            onPress={() => setManagementHubVisible(true)}
          />
          <DepartmentCard
            icon="📈"
            title="Stock Market"
            subtitle={`${companyOwnership.toFixed(1)}% Owned`}
            onPress={() => setShareControlVisible(true)}
          />
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>QUICK ACTIONS</Text>
        </View>

        <View style={{ gap: 8 }}>
          <SectionCard
            title="🔬 R&D Investment"
            subtitle="Invest in future growth"
            onPress={() => setRndVisible(true)}
          />
          <SectionCard
            title="🧩 Acquire Company"
            subtitle="Expand your empire"
            onPress={() => setAcquireVisible(true)}
          />
          <SectionCard
            title="👔 Board Members"
            subtitle="View shareholders"
            onPress={() => setBoardMembersVisible(true)}
          />
          <SectionCard
            title="🏢 Existing Companies"
            subtitle="Manage subsidiaries"
            onPress={() => setExistingCompaniesVisible(true)}
          />
        </View>

      </ScrollView>

      {/* --- MODAL AREA (Outside ScrollView) --- */}

      {/* Finance Modals */}
      <CorporateFinanceHubModal
        visible={isFinanceHubVisible}
        onClose={() => setFinanceHubVisible(false)}
        onSelectLoan={(type, rate) => {
          setFinanceHubVisible(false);
          setBorrowConfig({ visible: true, type, rate });
        }}
        onSelectRepay={() => {
          setFinanceHubVisible(false);
          setRepayConfig({ visible: true });
        }}
      />
      {borrowConfig.visible && (
        <BorrowModal
          visible={borrowConfig.visible}
          type={borrowConfig.type}
          rate={borrowConfig.rate}
          maxLimit={Math.max(10_000_000, (companyCapital || 0) * 0.5)}
          onClose={() => {
            setBorrowConfig({ ...borrowConfig, visible: false });
            setTimeout(() => setFinanceHubVisible(true), 300);
          }}
          onConfirm={(amount) => {
            borrowCapital(amount, borrowConfig.rate);
            setBorrowConfig({ ...borrowConfig, visible: false });
            setTimeout(() => setFinanceHubVisible(true), 300);
          }}
        />
      )}
      {repayConfig.visible && (
        <RepayModal
          visible={repayConfig.visible}
          totalDebt={companyDebtTotal}
          cash={companyCapital || 0}
          onClose={() => {
            setRepayConfig({ ...repayConfig, visible: false });
            setTimeout(() => setFinanceHubVisible(true), 300);
          }}
          onRepay={(amount) => {
            repayCapital(amount);
            setRepayConfig({ ...repayConfig, visible: false });
            setTimeout(() => setFinanceHubVisible(true), 300);
          }}
        />
      )}

      {/* Other Modals */}
      <GameModal
        visible={isProductHubVisible}
        onClose={() => setProductHubVisible(false)}
      >
        <ProductHub onClose={() => setProductHubVisible(false)} />
      </GameModal>

      {isManagementHubVisible && (
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setManagementHubVisible(false)} />
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>HR & Management</Text>
            <View style={{ gap: 12 }}>
              <GameButton
                title="🏭 Factories & Production"
                variant="secondary"
                onPress={() => {
                  setManagementHubVisible(false);
                  setTimeout(() => setFactoriesVisible(true), 300);
                }}
              />
              <GameButton
                title="👥 Employees & Morale"
                variant="secondary"
                onPress={() => {
                  setManagementHubVisible(false);
                  setTimeout(() => setEmployeesVisible(true), 300);
                }}
              />
              <GameButton
                title="Close"
                variant="ghost"
                onPress={() => setManagementHubVisible(false)}
              />
            </View>
          </View>
        </View>
      )}

      <FactoriesModule visible={isFactoriesVisible} onClose={() => setFactoriesVisible(false)} />
      <EmployeesModule visible={isEmployeesVisible} onClose={() => setEmployeesVisible(false)} />

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

      <BoardMembersModal
        visible={isBoardMembersVisible}
        onClose={() => setBoardMembersVisible(false)}
        onSelectMember={(member) => {
          setBoardMembersVisible(false);
          setTimeout(() => {
            setProfileShareholder(member);
          }, 300);
        }}
      />

      <RAndDModal visible={isRndVisible} onClose={() => setRndVisible(false)} />
      <AcquireStartupModal visible={isAcquireVisible} onClose={() => setAcquireVisible(false)} />
      <ExistingCompaniesModal visible={isExistingCompaniesVisible} onClose={() => setExistingCompaniesVisible(false)} />

      {/* Shareholder Actions */}
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
    gap: theme.spacing.lg,
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
  headerCard: {
    backgroundColor: theme.colors.cardSoft,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    marginBottom: theme.spacing.sm,
    gap: 8,
  },
  companyTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textPrimary,
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 8,
  },
  sharePrice: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  shareChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  changePositive: {
    color: theme.colors.success,
  },
  changeNegative: {
    color: theme.colors.danger,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  statCol: {
    flex: 1,
    gap: 4,
  },
  statSeparator: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 12,
  },
  statLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  textSuccess: {
    color: theme.colors.success,
  },
  textDanger: {
    color: theme.colors.danger,
  },
  sectionHeader: {
    marginTop: theme.spacing.sm,
  },
  sectionTitle: {
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginLeft: 4,
  },
  departmentsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
  },
  departmentCard: {
    flexBasis: '48%',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    gap: theme.spacing.sm,
    minHeight: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  departmentCardPressed: {
    backgroundColor: theme.colors.cardSoft,
    transform: [{ scale: 0.98 }],
  },
  departmentIcon: {
    fontSize: 32,
  },
  departmentTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textPrimary,
    textAlign: 'center',
  },
  departmentSubtitle: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.lg,
    zIndex: 999,
  },
  modalCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    width: '90%',
    maxWidth: 400,
    gap: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    color: theme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
  },
});