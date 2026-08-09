import React from 'react';
import { t, useLocale } from '../../../../core/i18n';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView } from 'react-native';

// Icons
const ICONS = {
    MASSAGE: '💆‍♂️',
    GROOMING: '✂️',
    SURGERY: '💉',
    MEMBERSHIP: '👑',
    CLOSE: '←',
};

type SanctuaryHubViewProps = {
    navigate: (view: 'MASSAGE' | 'GROOMING' | 'SURGERY') => void;
    closeSanctuary: () => void;
    isVIPMember: boolean;
    buyMembership: () => void;
    onGoHome: () => void;
};

const SanctuaryHubView = ({ navigate, closeSanctuary, isVIPMember, buyMembership, onGoHome }: SanctuaryHubViewProps) => {
    useLocale();

    const handleBuyMembership = () => {
        if (!isVIPMember) {
            buyMembership();
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Image / Gradient Placeholder */}
            <View style={styles.backdrop} />

            <SafeAreaView style={styles.safeArea}>

                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity onPress={() => onGoHome()} style={styles.closeBtn}>
                        <Text style={styles.closeIcon}>{ICONS.CLOSE}</Text>
                    </TouchableOpacity>
                    <View style={styles.titleContainer}>
                        <Text style={styles.title}>{t('life.sanctuary')}</Text>
                        <Text style={styles.subtitle}>{t('life.wellnessAesthetics')}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView contentContainerStyle={styles.content}>

                    {/* VIP Banner */}
                    <TouchableOpacity
                        style={[styles.vipBanner, isVIPMember ? styles.vipActive : styles.vipInactive]}
                        onPress={handleBuyMembership}
                        activeOpacity={0.9}
                        disabled={isVIPMember}
                    >
                        <View style={styles.vipContent}>
                            <Text style={styles.vipTitle}>
                                {isVIPMember ? 'VIP PLATINUM ACTIVE ✨' : 'BECOME A VIP'}
                            </Text>
                            <Text style={styles.vipDesc}>
                                {isVIPMember
                                    ? 'Enjoy unlimted free Royal Massages.'
                                    : 'Access exclusive benefits and free treatments.'}
                            </Text>
                            {!isVIPMember && (
                                <View style={styles.priceTag}>
                                    <Text style={styles.priceText}>$20,000 / qtr</Text>
                                </View>
                            )}
                        </View>
                        <Text style={styles.vipIcon}>{ICONS.MEMBERSHIP}</Text>
                    </TouchableOpacity>

                    {/* Menu Grid */}
                    <View style={styles.grid}>

                        {/* Massage */}
                        <TouchableOpacity style={styles.card} onPress={() => navigate('MASSAGE')}>
                            <View style={[styles.iconContainer, { backgroundColor: '#434B50' }]}>
                                <Text style={styles.cardIcon}>{ICONS.MASSAGE}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{t('life.royalMassage')}</Text>
                            <Text style={styles.cardDesc}>{t('life.relieveStressRestoreHealth')}</Text>
                        </TouchableOpacity>

                        {/* Grooming */}
                        <TouchableOpacity style={styles.card} onPress={() => navigate('GROOMING')}>
                            <View style={[styles.iconContainer, { backgroundColor: '#434B50' }]}>
                                <Text style={styles.cardIcon}>{ICONS.GROOMING}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{t('life.groomingLounge')}</Text>
                            <Text style={styles.cardDesc}>{t('life.boostLuckStyle')}</Text>
                        </TouchableOpacity>

                        {/* Surgery */}
                        <TouchableOpacity style={styles.card} onPress={() => navigate('SURGERY')}>
                            <View style={[styles.iconContainer, { backgroundColor: '#434B50' }]}>
                                <Text style={styles.cardIcon}>{ICONS.SURGERY}</Text>
                            </View>
                            <Text style={styles.cardTitle}>{t('life.plasticSurgery')}</Text>
                            <Text style={styles.cardDesc}>{t('life.enhanceLooksCharm')}</Text>
                        </TouchableOpacity>

                    </View>

                </ScrollView>

            </SafeAreaView>

            {/* Universal Crystal Navigation Bar */}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#CFD0D2',
    },
    backdrop: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#CFD0D2', // Light gray background
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#434B50',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.48)',
    },
    closeBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#434B50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeIcon: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    titleContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 18,
        fontWeight: '900',
        color: '#FFFFFF',
        letterSpacing: 1,
    },
    subtitle: {
        fontSize: 12,
        color: '#FFFFFF',
        marginTop: 2,
    },
    content: {
        padding: 20,
        paddingBottom: 100,
    },
    vipBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 20,
        borderRadius: 20,
        marginBottom: 24,
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    vipActive: {
        backgroundColor: '#434B50', // Dark luxury
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.06)',
    },
    vipInactive: {
        backgroundColor: '#434B50',
    },
    vipContent: {
        flex: 1,
    },
    vipTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: '#FFFFFF', // Gold -> Light Green
        marginBottom: 4,
    },
    vipDesc: {
        fontSize: 12,
        color: '#FFFFFF',
        marginTop: 2,
    },
    vipIcon: {
        fontSize: 32,
        marginLeft: 16,
    },
    priceTag: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        alignSelf: 'flex-start',
        marginTop: 8,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    priceText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 12,
    },
    grid: {
        gap: 16,
    },
    card: {
        backgroundColor: '#434B50',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#1C242C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.48)',
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    cardIcon: {
        fontSize: 28,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
    },
    cardDesc: {
        fontSize: 13,
        color: '#FFFFFF',
    },
    bottomBarContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        width: '100%',
        zIndex: 100,
        elevation: 10,
    }
});

export default SanctuaryHubView;
