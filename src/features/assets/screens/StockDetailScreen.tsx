import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const StockDetailScreen = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>Stock Detail Screen (Placeholder)</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#121212',
    },
    text: {
        color: '#FFFFFF',
        fontSize: 18,
    },
});

export default StockDetailScreen;
