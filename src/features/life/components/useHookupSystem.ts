import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export type HookupCandidate = {
    id: string;
    name: string;
    gender: 'Male' | 'Female';
    age: number;
    sexuality: 'Straight' | 'Bisexual' | 'Gay';
    scenario: string;
    avatarUrl?: string; // Placeholder for now
};

const NAMES_FEMALE = ['Jessica', 'Elena', 'Sarah', 'Maria', 'Chloe', 'Sofia', 'Emma', 'Isabella', 'Mia', 'Ava'];
const NAMES_MALE = ['Marcus', 'David', 'James', 'Michael', 'Lucas', 'Alexander', 'William', 'Benjamin', 'Daniel', 'Henry'];

const SCENARIOS = [
    '{NAME} is smiling at you from across the bar.',
    '{NAME} looks like they want to get to know you better.',
    'You made eye contact with {NAME} and felt a spark.',
    '{NAME} just bought you a drink and winked.',
    '{NAME} is staring at you with intense interest.',
];

export const useHookupSystem = () => {
    const [modalVisible, setModalVisible] = useState(false);
    const [currentCandidate, setCurrentCandidate] = useState<HookupCandidate | null>(null);

    const generateRandomPerson = useCallback((): HookupCandidate => {
        const isFemale = Math.random() > 0.5;
        const gender = isFemale ? 'Female' : 'Male';
        const nameList = isFemale ? NAMES_FEMALE : NAMES_MALE;
        const name = nameList[Math.floor(Math.random() * nameList.length)];
        const age = Math.floor(Math.random() * (50 - 18 + 1)) + 18; // 18 - 50

        // Simple random sexuality distribution
        const randSex = Math.random();
        let sexuality: 'Straight' | 'Bisexual' | 'Gay' = 'Straight';
        if (randSex > 0.85) sexuality = 'Gay';
        else if (randSex > 0.70) sexuality = 'Bisexual';

        const rawScenario = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
        const scenario = rawScenario.replace('{NAME}', name);

        return {
            id: Math.random().toString(36).substr(2, 9),
            name,
            gender,
            age,
            sexuality,
            scenario,
        };
    }, []);

    const startHookup = useCallback(() => {
        const candidate = generateRandomPerson();
        setCurrentCandidate(candidate);
        setModalVisible(true);
    }, [generateRandomPerson]);

    const acceptHookup = useCallback(() => {
        setModalVisible(false);
        // TODO: Integrate with actual stats system in the future
        // e.g., decrease stress, health risk check, etc.

        // Wait for modal fade out
        setTimeout(() => {
            // Simple toast for now (Alert in RN)
            // In a real app we might use a dedicated Toast component
            console.log('Hookup accepted with:', currentCandidate?.name);
        }, 300);
    }, [currentCandidate]);

    const rejectHookup = useCallback(() => {
        setModalVisible(false);
    }, []);

    const closeHookupModal = useCallback(() => {
        setModalVisible(false);
    }, []);

    return {
        isHookupVisible: modalVisible,
        hookupCandidate: currentCandidate,
        startHookup,
        acceptHookup,
        rejectHookup,
        closeHookupModal
    };
};
