import React from 'react';
import { View, StyleSheet } from 'react-native';

import { EducationMasterModal } from '../components/Education/modals/EducationMasterModal';
import { EducationExamModal } from '../components/Education/modals/EducationExamModal';
import AppLaunchLoader from '../../../components/common/AppLaunchLoader';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const EducationScreen = () => {
    return (
        <View style={styles.container}>
            <AppLaunchLoader
                appName="Education"
                appIcon={<MaterialCommunityIcons name="school" size={64} color="#FFFFFF" />}
                backgroundColor="#31241F"
            >
                <EducationMasterModal />
                <EducationExamModal />
            </AppLaunchLoader>
        </View>
    );
};

export default EducationScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#31241F',
    },
});
