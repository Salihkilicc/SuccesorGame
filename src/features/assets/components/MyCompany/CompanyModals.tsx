// src/features/MyCompany/components/CompanyModals.tsx
import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { theme } from '../../../../core/theme';
import GameButton from '../../../../components/common/GameButton';

// Modalların importları (Aynen taşıyoruz)
import CorporateFinanceHubModal from '../../../../components/MyCompany/Finance/CorporateFinanceHubModal';
import BorrowModal from '../../../../components/MyCompany/Finance/BorrowModal';
import RepayModal from '../../../../components/MyCompany/Finance/RepayModal';
import GameModal from '../../../../components/common/GameModal';
import ProductsScreen from '../../../../features/products/screens/ProductsScreen';
import EmployeesModule from '../../../../components/MyCompany/Management/EmployeesModule';
import ShareControlHub from '../../../../components/MyCompany/Shares/ShareControlHub';
import BuybackModal from '../../../../components/MyCompany/Shares/BuybackModal';
import DilutionModal from '../../../../components/MyCompany/Shares/DilutionModal';
import DividendModal from '../../../../components/MyCompany/Shares/DividendModal';
// KURUL ODASI: eski `BoardMembersModal` yalnizca uyeleri LISTELIYORDU ve
// "Call Emergency Vote" dugmesi console.log yapiyordu. Yerine karar
// verilen ekran geldi — lobi, soz, oy dokumu ve gorevden alma uyarisi.
import BoardRoomModal from '../../../../components/MyCompany/Shares/BoardRoomModal';
import ShareholderProfileModal from '../../../../components/MyCompany/Shares/ShareholderProfileModal';
import GiftSelectionModal from '../../../../components/MyCompany/Shares/GiftSelectionModal';
import ShareNegotiationModal from '../../../../components/MyCompany/Shares/ShareNegotiationModal';
import RAndDModal from '../../../../components/MyCompany/Actions/RAndDModal';
import { AcquisitionModal } from '../../../../components/MyCompany/Actions/AcquisitionModal';
import ExistingCompaniesModal from '../../../../components/MyCompany/Finance/ExistingCompaniesModal';

// Tipler
type CompanyModalsProps = {
  modals: any; // State objesi
  toggleModal: (key: string, value: boolean) => void;
  financeActions: {
    borrowConfig: any;
    setBorrowConfig: any;
    repayConfig: any;
    setRepayConfig: any;
    handleBorrow: (amount: number, rate: number) => void;
    handleRepay: (amount: number) => void;
  };
  shareActions: {
    onOpenAction: (actionType: string) => void;
    onSelectMember: (member: any) => void;
    handleLaunchIPO?: () => void;
  };
  companyCapital: number;
  companyDebtTotal: number;
  selectedShareholder?: any;
};

export const CompanyModals = ({
  modals,
  toggleModal,
  financeActions,
  shareActions,
  companyCapital,
  companyDebtTotal,
  selectedShareholder
}: CompanyModalsProps) => {
    useLocale();

  const { borrowConfig, setBorrowConfig, repayConfig, setRepayConfig, handleBorrow, handleRepay } = financeActions;

  return (
    <>
      {/* --- FİNANS --- */}
      <CorporateFinanceHubModal
        visible={!!modals.finance}
        onClose={() => toggleModal('finance', false)}
        onRequestLoan={() => { toggleModal('finance', false); toggleModal('borrow', true); }}
        onRepayDebt={() => { toggleModal('finance', false); toggleModal('repay', true); }}
      />

      <BorrowModal
        visible={!!modals.borrow}
        onClose={() => { toggleModal('borrow', false); setTimeout(() => toggleModal('finance', true), 300); }}
      />

      <RepayModal
        visible={!!modals.repay}
        onClose={() => { toggleModal('repay', false); setTimeout(() => toggleModal('finance', true), 300); }}
      />

      {/* --- ÜRÜN & YÖNETİM --- */}
      <GameModal visible={!!modals.product} onClose={() => toggleModal('product', false)}>
        <ProductsScreen />
      </GameModal>

      {!!modals.management && (
        <View style={localStyles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => toggleModal('management', false)} />
          <View style={localStyles.card}>
            <Text style={localStyles.title}>{t('company.hrManagement')}</Text>
            <View style={{ gap: 12 }}>
              {/* "Factories & Production" kaldirildi: fabrika sayisi diye bir
                  sey kalmadi. Kapasite tesis KADEMESINDEN geliyor ve kontrolu
                  My Company ekranindaki FacilityPanel'de. */}
              <GameButton title={`👥 ${t('company.employeesMorale')}`} variant="secondary" onPress={() => { toggleModal('management', false); setTimeout(() => toggleModal('employees', true), 300); }} />
              <GameButton title={t('company.close')} variant="ghost" onPress={() => toggleModal('management', false)} />
            </View>
          </View>
        </View>
      )}

      <EmployeesModule visible={!!modals.employees} onClose={() => toggleModal('employees', false)} />

      {/* --- HİSSELER & DİĞER --- */}
      <ShareControlHub
        visible={!!modals.shareControl}
        onClose={() => toggleModal('shareControl', false)}
        onOpenIPO={shareActions.handleLaunchIPO || (() => shareActions.onOpenAction('ipo'))}
        onOpenDilution={() => { toggleModal('shareControl', false); setTimeout(() => toggleModal('dilution', true), 300); }}
        onOpenDividend={() => { toggleModal('shareControl', false); setTimeout(() => toggleModal('dividend', true), 300); }}
        onOpenBuyback={() => { toggleModal('shareControl', false); setTimeout(() => toggleModal('buyback', true), 300); }}
      />

      {/* Equity Action Modals */}
      <BuybackModal
        visible={!!modals.buyback}
        onClose={() => toggleModal('buyback', false)}
      />

      <DilutionModal
        visible={!!modals.dilution}
        onClose={() => toggleModal('dilution', false)}
      />

      <DividendModal
        visible={!!modals.dividend}
        onClose={() => toggleModal('dividend', false)}
      />

      <BoardRoomModal
        visible={!!modals.boardMembers}
        onClose={() => toggleModal('boardMembers', false)}
      />

      {selectedShareholder && (
        <>
          <ShareholderProfileModal
            visible={!!modals.profile}
            member={selectedShareholder}
            onClose={() => toggleModal('profile', false)}
          />

          <GiftSelectionModal
            visible={!!modals.gift}
            shareholder={selectedShareholder}
            onClose={() => toggleModal('gift', false)}
          />

          <ShareNegotiationModal
            visible={!!modals.negotiate}
            shareholder={selectedShareholder}
            onClose={() => toggleModal('negotiate', false)}
          />
        </>
      )}

      <RAndDModal visible={!!modals.rnd} onClose={() => toggleModal('rnd', false)} />
      <AcquisitionModal visible={!!modals.acquire} onClose={() => toggleModal('acquire', false)} />
      <ExistingCompaniesModal visible={!!modals.existingCompanies} onClose={() => toggleModal('existingCompanies', false)} />
    </>
  );
};

const localStyles = StyleSheet.create({
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 999 },
  card: { backgroundColor: theme.colors.card, borderRadius: 16, padding: 20, width: '90%', maxWidth: 400, gap: 16, borderWidth: 1, borderColor: theme.colors.border },
  title: { color: theme.colors.textPrimary, fontSize: 18, fontWeight: '800' },
});