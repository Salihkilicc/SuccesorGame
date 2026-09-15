// src/components/common/SponsorDroughtWarningModal.tsx
import React from 'react';
import { t } from '../../core/i18n';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
} from 'react-native';
import { DROUGHT_GRACE_QUARTERS, DROUGHT_PENALTY_CAP, DROUGHT_PENALTY_PER_QUARTER } from '../../core/market/sponsorship';

interface Props {
    visible: boolean;
    quartersWithout: number;
    currentPenalty: number;
    onClose: () => void;
}

const SponsorDroughtWarningModal = ({ visible, quartersWithout, currentPenalty, onClose }: Props) => {
    const overBy = Math.max(0, quartersWithout - DROUGHT_GRACE_QUARTERS);
    const penaltyCapped = currentPenalty >= DROUGHT_PENALTY_CAP;
    const quartersUntilCap = Math.ceil((DROUGHT_PENALTY_CAP - currentPenalty) / DROUGHT_PENALTY_PER_QUARTER);

    return (
        <Modal statusBarTranslucent navigationBarTranslucent
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.iconRow}>
                        <Text style={styles.icon}>📉</Text>
                    </View>

                    <Text style={styles.title}>{t('spon.ceilingEroding')}</Text>
                    <Text style={styles.subtitle}>
                        {t('spon.nameOnNothing', { quarters: quartersWithout, over: overBy })}
                    </Text>

                    <View style={styles.statBox}>
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('spon.quartersWithout')}</Text>
                            <Text style={styles.statValueWarn}>{quartersWithout}</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>{t('spon.ceilingLost')}</Text>
                            <Text style={styles.statValueWarn}>-{currentPenalty.toFixed(1)} pts</Text>
                        </View>
                        <View style={styles.statDivider} />
                        <View style={styles.statRow}>
                            <Text style={styles.statLabel}>
                                {penaltyCapped ? t('spon.ceilingPenaltyCapped') : t('spon.quartersUntilCap')}
                            </Text>
                            <Text style={styles.statValueWarn}>
                                {penaltyCapped ? t('spon.ptsMax', { points: DROUGHT_PENALTY_CAP }) : quartersUntilCap}
                            </Text>
                        </View>
                    </View>

                    <Text style={styles.body}>
                        {t('spon.bodyPart1')}{' '}
                        <Text style={styles.accentBrand}>{t('spon.bodyEquilibrium')}</Text>
                        {' '}{t('spon.bodyPart2')}{' '}
                        <Text style={styles.accentWarn}>{t('spon.bodyCeiling')}</Text>
                        {' '}{t('spon.bodyPart3')}
                    </Text>
                    {!penaltyCapped && (
                        <Text style={styles.bodySmall}>
                            {t('spon.checkYourMail')}
                        </Text>
                    )}

                    <Pressable
                        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
                        onPress={onClose}
                    >
                        <Text style={styles.btnText}>{t('ui.understood')}</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(10,16,22,0.88)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        width: '100%',
        backgroundColor: '#1E2830',
        borderRadius: 16,
        padding: 24,
        borderWidth: 1,
        borderColor: 'rgba(255,169,77,0.35)',
        shadowColor: '#FFA94D',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.20,
        shadowRadius: 20,
        elevation: 14,
    },
    iconRow: {
        alignItems: 'center',
        marginBottom: 12,
    },
    icon: {
        fontSize: 40,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFA94D',
        textAlign: 'center',
        letterSpacing: 0.5,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.60)',
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 18,
    },
    accentWarn: {
        color: '#FFA94D',
        fontWeight: '600',
    },
    accentBrand: {
        color: '#FFA94D',
        fontWeight: '700',
    },
    statBox: {
        backgroundColor: 'rgba(255,169,77,0.05)',
        borderRadius: 10,
        borderWidth: 1,
        borderColor: 'rgba(255,169,77,0.20)',
        marginBottom: 18,
        overflow: 'hidden',
    },
    statRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
    },
    statDivider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.06)',
    },
    statLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.50)',
    },
    statValue: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    statValueWarn: {
        fontSize: 13,
        fontWeight: '600',
        color: '#FFA94D',
    },
    body: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.58)',
        lineHeight: 20,
        marginBottom: 10,
        textAlign: 'center',
    },
    bodySmall: {
        fontSize: 12,
        color: 'rgba(255,169,77,0.85)',
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    btn: {
        marginTop: 8,
        backgroundColor: 'rgba(255,169,77,0.12)',
        borderRadius: 10,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,169,77,0.40)',
    },
    btnPressed: {
        opacity: 0.75,
        backgroundColor: 'rgba(255,169,77,0.22)',
    },
    btnText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#FFA94D',
        letterSpacing: 0.3,
    },
});

export default SponsorDroughtWarningModal;
