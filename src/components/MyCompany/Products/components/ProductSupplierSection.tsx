import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { theme } from '../../../../theme';
import { Supplier } from '../../../../store/useProductStore';
import SectionCard from '../../../common/SectionCard';
import GameButton from '../../../common/GameButton';

interface Props {
    currentSupplier: Supplier;
    supplierOptions: Supplier[];
    showSuppliers: boolean;
    onFindSuppliers: () => void;
    onSelectSupplier: (supplier: Supplier) => void;
}

const ProductSupplierSection = ({
    currentSupplier,
    supplierOptions,
    showSuppliers,
    onFindSuppliers,
    onSelectSupplier,
}: Props) => {
    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>SUPPLIER CHAIN</Text>

            <SectionCard
                title={currentSupplier.name}
                subtitle={`Quality: ${currentSupplier.quality}%`}
                rightText={`$${currentSupplier.cost}/unit`}
            />

            <GameButton
                title={showSuppliers ? "Cancel Search" : "Find New Suppliers"}
                variant="secondary"
                onPress={onFindSuppliers}
                style={{ marginTop: 8 }}
            />

            {showSuppliers && (
                <View style={styles.optionsList}>
                    {supplierOptions.map((supplier, idx) => (
                        <SectionCard
                            key={idx}
                            title={supplier.name}
                            subtitle={`Q: ${supplier.quality}%`}
                            rightText={`$${supplier.cost}`}
                            onPress={() => onSelectSupplier(supplier)}
                            style={{ backgroundColor: theme.colors.card }} // Slightly distinct
                        />
                    ))}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        gap: 4,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        color: theme.colors.textMuted,
        letterSpacing: 0.5,
        marginLeft: 4,
        marginBottom: 4,
    },
    optionsList: {
        gap: 8,
        marginTop: 8,
        paddingLeft: 12,
        borderLeftWidth: 2,
        borderLeftColor: theme.colors.border,
    },
});

export default ProductSupplierSection;
