// @orphan-ok duplicate - the live one is exported from features/products/components/ProductModals.tsx
// Kept deliberately: nothing renders this, and it is not meant to be.
import React, { useState, useEffect } from 'react';
import { t, useLocale } from '../../../core/i18n';
import { View, Text, Modal, StyleSheet, Pressable, ScrollView, Alert } from 'react-native';
import { theme } from '../../../core/theme';
import ConfirmPanel from '../../../components/common/ConfirmPanel';
import { Product } from '../data/productsData';
import { useProductsLogic } from '../logic/useProductsLogic';
import ScreenHeader from '../../../components/common/ScreenHeader';

interface ProductLaunchModalProps {
    visible: boolean;
    product: Product | null;
    onClose: () => void;
    onLaunchComplete: () => void;
}

export const ProductLaunchModal: React.FC<ProductLaunchModalProps> = ({ visible, product, onClose, onLaunchComplete }) => {
    useLocale();
    const [step, setStep] = useState(1);
    const [analysisData, setAnalysisData] = useState<any>(null);
    const [panel, setPanel] = useState<null | {
        title: string; summary?: string; confirmLabel: string;
        tone?: 'default' | 'danger'; onDismiss?: () => void;
    }>(null);
    const { actions } = useProductsLogic();
    const { performMarketAnalysis, launchProduct } = actions;

    useEffect(() => {
        if (visible) {
            setStep(1);
            setAnalysisData(null);
        }
    }, [visible]);

    if (!product) return null;

    const handleMarketAnalysis = () => {
        const result = performMarketAnalysis(product);
        setAnalysisData(result);
        setStep(2);
    };

    const handleLaunch = () => {
        const success = launchProduct(product);
        if (success) {
            setPanel({
                title: t('alert.success'),
                summary: `${product.name} has been launched successfully!`,
                confirmLabel: 'OK',
                onDismiss: onLaunchComplete,
            });
        } else {
            setPanel({
                title: t('alert.error'),
                summary: t('alert.failedToLaunchProductCheck'),
                confirmLabel: 'OK',
                tone: 'danger',
            });
        }
    };

    const renderStep1 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>{t('product.productSummary')}</Text>
            <View style={styles.infoRow}>
                <Text style={styles.label}>{t('product.name')}</Text>
                <Text style={styles.value}>{product.icon} {product.name}</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.label}>{t('product.description')}</Text>
                <Text style={styles.value} numberOfLines={3}>{product.description}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
                <Text style={styles.label}>{t('product.baseRDCost')}</Text>
                <Text style={styles.costValue}>{product.rndCost} Pts</Text>
            </View>
            <View style={styles.infoRow}>
                <Text style={styles.label}>{t('product.baseDemand')}</Text>
                <Text style={styles.value}>{product.marketDemand}%</Text>
            </View>

            <Pressable style={styles.primaryBtn} onPress={handleMarketAnalysis}>
                <Text style={styles.btnText}>{t('product.performMarketAnalysis')}</Text>
            </Pressable>
        </View>
    );

    const renderStep2 = () => (
        <View style={styles.stepContainer}>
            <Text style={styles.sectionTitle}>{t('product.marketAnalysisResults')}</Text>
            {analysisData && (
                <>
                    <View style={styles.chartContainer}>
                        {/* Simple Bar Chart Visualization */}
                        {(analysisData.chartData as number[]).map((val, idx) => (
                            <View key={idx} style={styles.barWrapper}>
                                <View style={[styles.bar, { height: val, backgroundColor: theme.colors.accent }]} />
                            </View>
                        ))}
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('product.estimatedDemand')}</Text>
                        <Text style={styles.valueHighlight}>{analysisData.demand}%</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('product.recommendedPrice')}</Text>
                        <Text style={styles.valueHighlight}>${analysisData.suggestedPrice}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.label}>{t('product.competition')}</Text>
                        <Text style={styles.value}>{analysisData.competition}</Text>
                    </View>
                    <View style={styles.tipsBox}>
                        <Text style={styles.tipText}>{t('product.tipInitialProductionWillMatch')}</Text>
                    </View>
                </>
            )}

            <Pressable style={styles.successBtn} onPress={handleLaunch}>
                <Text style={styles.btnText}>{t('product.launchProduct')}</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
                <Text style={styles.secondaryBtnText}>{t('product.back')}</Text>
            </Pressable>
        </View>
    );

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.card}>
                    <ScreenHeader
                        inset={false}
                        title={step === 1 ? t('product.newProductLaunch') : t('product.marketResearch')}
                        onBack={onClose}
                    />

                    {step === 1 && renderStep1()}
                    {step === 2 && renderStep2()}
                </View>
            </View>

            <ConfirmPanel
                visible={!!panel}
                title={panel?.title || ''}
                summary={panel?.summary}
                tone={panel?.tone}
                confirmLabel={panel?.confirmLabel || 'OK'}
                onCancel={() => { const done = panel?.onDismiss; setPanel(null); done?.(); }}
            />
        </Modal>
    );
};

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(28,36,44,0.85)',
        justifyContent: 'center',
        padding: 20,
    },
    card: {
        backgroundColor: theme.colors.card,
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    closeIcon: {
        fontSize: 24,
        color: theme.colors.textSecondary,
    },
    stepContainer: {
        gap: 16,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: theme.colors.textSecondary,
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 14,
        color: theme.colors.textSecondary,
    },
    value: {
        fontSize: 14,
        fontWeight: '600',
        color: theme.colors.textPrimary,
    },
    valueHighlight: {
        fontSize: 16,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    costValue: {
        // A cost is not a loss; the label already says what it is.
        fontSize: 14,
        fontWeight: 'bold',
        color: theme.colors.textPrimary,
    },
    divider: {
        height: 1,
        backgroundColor: theme.colors.border,
        marginVertical: 4,
    },
    primaryBtn: {
        backgroundColor: theme.colors.primary,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    successBtn: {
        backgroundColor: theme.colors.accent,
        padding: 14,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 10,
    },
    secondaryBtn: {
        padding: 14,
        alignItems: 'center',
    },
    btnText: {
        color: theme.colors.onLight,
        fontWeight: 'bold',
        fontSize: 14,
    },
    secondaryBtnText: {
        color: theme.colors.textSecondary,
    },
    chartContainer: {
        flexDirection: 'row',
        height: 100,
        alignItems: 'flex-end',
        justifyContent: 'space-around',
        backgroundColor: theme.colors.cardSoft,
        borderRadius: 8,
        padding: 10,
        marginBottom: 10,
    },
    barWrapper: {
        flex: 1,
        alignItems: 'center',
    },
    bar: {
        width: 12,
        borderRadius: 4,
    },
    tipsBox: {
        backgroundColor: theme.colors.cardSoft,
        padding: 10,
        borderRadius: 6,
    },
    tipText: {
        fontSize: 12,
        color: theme.colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
    },
});
