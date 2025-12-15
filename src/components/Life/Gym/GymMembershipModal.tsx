import React from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import { theme } from '../../../theme';
import { GYM_TIERS, GymMembershipType } from './useGymSystem';

type GymMembershipModalProps = {
    visible: boolean;
    onClose: () => void;
    onPurchase: (tier: GymMembershipType) => void;
};

const { width } = Dimensions.get('window');

const GymMembershipModal = ({
    visible,
    onClose,
    onPurchase,
}: GymMembershipModalProps) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.container}>
                    <Text style={styles.title}>SELECT MEMBERSHIP</Text>
                    <Text style={styles.subtitle}>Unlock your potential.</Text>

                    <View style={styles.cardsContainer}>
                        {/* TITANIUM CARD */}
                        <Pressable
                            onPress={() => onPurchase('titanium')}
                            style={({ pressed }) => [
                                styles.card,
                                styles.titaniumCard,
                                pressed && styles.cardPressed,
                            ]}>
                            <View style={styles.cardHeader}>
                                <Text style={styles.tierName}>TITANIUM</Text>
                                <Text style={styles.tierPrice}>$2,000</Text>
                            </View>
                            <Text style={styles.featurePoints}>
                                • Advanced Equipment{'\n'}
                                • Sauna & Spa Access{'\n'}
                                • Clean Environment
                            </Text>
                            <View style={styles.chip} />
                        </Pressable>

                        {/* OR SEPARATOR */}
                        <Text style={styles.orText}>OR</Text>

                        {/* ELITE CARD */}
                        <Pressable
                            onPress={() => onPurchase('elite')}
                            style={({ pressed }) => [
                                styles.card,
                                styles.eliteCard,
                                pressed && styles.cardPressed,
                            ]}>
                            <View style={styles.cardHeader}>
                                <Text style={[styles.tierName, styles.eliteText]}>
                                    OLYMPUS ELITE
                                </Text>
                                <Text style={[styles.tierPrice, styles.eliteText]}>
                                    $25,000
                                </Text>
                            </View>
                            <Text style={[styles.featurePoints, styles.eliteText]}>
                                • Invite Only{'\n'}
                                • Celebrity Trainers{'\n'}
                                • 2x Stat Multiplier{'\n'}
                                • Networking Events
                            </Text>
                            <View style={[styles.chip, styles.eliteChip]} />
                        </Pressable>
                    </View>

                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={styles.closeText}>Maybe Later</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
};

export default GymMembershipModal;

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.9)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        width: '100%',
        padding: 20,
        alignItems: 'center'
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: theme.colors.textPrimary,
        letterSpacing: 2
    },
    subtitle: {
        fontSize: 14,
        color: theme.colors.textSecondary,
        marginBottom: 30
    },
    cardsContainer: {
        width: '100%',
        gap: 20,
        maxWidth: 400
    },
    card: {
        height: 180,
        borderRadius: 16,
        padding: 20,
        justifyContent: 'space-between',
        borderWidth: 1,
        elevation: 5
    },
    cardPressed: {
        transform: [{ scale: 0.98 }],
        opacity: 0.9
    },
    titaniumCard: {
        backgroundColor: '#2C3E50',
        borderColor: '#95A5A6'
    },
    eliteCard: {
        backgroundColor: '#000',
        borderColor: theme.colors.primary, // Gold
        shadowColor: theme.colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.4,
        shadowRadius: 10
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start'
    },
    tierName: {
        fontSize: 18,
        fontWeight: '900',
        color: '#ECF0F1',
        letterSpacing: 1
    },
    tierPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#BDC3C7'
    },
    featurePoints: {
        fontSize: 13,
        color: '#BDC3C7',
        lineHeight: 20
    },
    chip: {
        width: 40,
        height: 30,
        backgroundColor: '#BDC3C7',
        borderRadius: 6,
        alignSelf: 'flex-start'
    },
    eliteText: {
        color: theme.colors.primary
    },
    eliteChip: {
        backgroundColor: theme.colors.primary,
        opacity: 0.8
    },
    orText: {
        color: '#666',
        fontWeight: '700',
        fontSize: 12,
        textAlign: 'center',
        marginVertical: -10
    },
    closeButton: {
        marginTop: 40,
        padding: 10
    },
    closeText: {
        color: theme.colors.textSecondary,
        textDecorationLine: 'underline'
    }
});
