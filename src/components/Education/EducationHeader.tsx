import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../core/theme';

interface EducationHeaderProps {
    title?: string;
    rightAction?: {
        label: string;
        onPress: () => void;
    };
}

const EducationHeader = ({ title = "Education", rightAction }: EducationHeaderProps) => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="chevron-back" size={28} color={theme.colors.textPrimary} />
                </TouchableOpacity>
                <View style={styles.titleContainer}>
                    <Text style={styles.title}>{title}</Text>
                </View>
                {rightAction ? (
                    <TouchableOpacity onPress={rightAction.onPress} style={styles.rightBtn}>
                        <Text style={styles.rightBtnText}>{rightAction.label}</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={styles.placeholder} />
                )}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: theme.colors.card,
    },
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: theme.colors.card,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        zIndex: 10,
    },
    backBtn: {
        width: 40,
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
    },
    title: {
        color: theme.colors.textPrimary,
        fontSize: 18,
        fontWeight: 'bold',
    },
    rightBtn: {
        width: 60,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    rightBtnText: {
        color: theme.colors.accent,
        fontSize: 14,
        fontWeight: '600',
    },
    placeholder: {
        width: 40,
    }
});

export default EducationHeader;
