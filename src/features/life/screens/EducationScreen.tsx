import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EducationMasterModal } from '../components/Education/modals/EducationMasterModal';
import { EducationExamModal } from '../components/Education/modals/EducationExamModal';

const EducationScreen = () => {
    return (
        <View style={styles.container}>
            <EducationMasterModal />
            <EducationExamModal />
        </View>
    );
};

export default EducationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000000',
    },
});
