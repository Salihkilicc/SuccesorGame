import React from 'react';
import { EducationEnrollmentView } from './EducationEnrollmentView';

// ========================================
// TYPES
// ========================================

interface EducationProgramsViewProps {
    onBack: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const EducationProgramsView: React.FC<EducationProgramsViewProps> = ({ onBack }) => {
    return <EducationEnrollmentView onBack={onBack} />;
};
