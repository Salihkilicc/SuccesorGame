import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Alert,
    Dimensions,
    SafeAreaView
} from 'react-native';
import { usePlayerStore } from '../../../../core/store/usePlayerStore';

// --- TYPES ---

type Position = [number, number]; // [row, col]

interface GameState {
    playerPos: Position;
    policePositions: Position[];
    status: 'PLAYING' | 'WON' | 'LOST';
    moveCount: number;
    stamina: number;
}

interface PoliceChaseGameProps {
    onComplete: (won: boolean) => void;
    onClose: () => void;
}

// --- CONSTANTS ---

const GRID_SIZE = 5;
const SAFE_HOUSE: Position = [4, 4];
const INITIAL_PLAYER_POS: Position = [0, 0];
const POLICE_COUNT = 2;
const MAX_STAMINA = 100;
const STAMINA_COST_PER_MOVE = 15;
const TICK_INTERVAL = 1000;

// --- HELPER FUNCTIONS ---

// --- HELPER FUNCTIONS ---

const generateRandomPolicePositions = (count: number): Position[] => {
    const positions: Position[] = [];
    const occupied = new Set<string>([
        `${INITIAL_PLAYER_POS[0]},${INITIAL_PLAYER_POS[1]}`,
        `${SAFE_HOUSE[0]},${SAFE_HOUSE[1]}`
    ]);

    while (positions.length < count) {
        const row = Math.floor(Math.random() * GRID_SIZE);
        const col = Math.floor(Math.random() * GRID_SIZE);
        const key = `${row},${col}`;

        if (!occupied.has(key)) {
            positions.push([row, col]);
            occupied.add(key);
        }
    }
    return positions;
};

const isPositionEqual = (pos1: Position, pos2: Position): boolean => {
    return pos1[0] === pos2[0] && pos1[1] === pos2[1];
};

const movePoliceRandomly = (policePos: Position): Position => {
    const [row, col] = policePos;
    const moves: Position[] = [];

    // Valid moves
    if (row > 0) moves.push([row - 1, col]); // Up
    if (row < GRID_SIZE - 1) moves.push([row + 1, col]); // Down
    if (col > 0) moves.push([row, col - 1]); // Left
    if (col < GRID_SIZE - 1) moves.push([row, col + 1]); // Right

    // Pick random move
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    return randomMove;
};

// --- COMPONENT ---

export const PoliceChaseGame: React.FC<PoliceChaseGameProps> = ({ onComplete, onClose }) => {
    const { attributes } = usePlayerStore();

    // Gym Integration: Use strength as stamina proxy
    const playerStrength = attributes.strength || 50;
    // Cast attributes to any to access dynamic 'bodyguard' property until type is updated
    const bodyGuardLevel = (attributes as any).bodyguard || 0;
    const staminaRegenRate = Math.max(5, Math.floor(playerStrength / 10));

    // Calculate Police Count based on Bodyguard Level
    let policeCount = 2; // Default
    if (bodyGuardLevel <= 15) policeCount = 4;      // Nightmare (0-15)
    else if (bodyGuardLevel <= 50) policeCount = 3; // Hard (16-50)
    else if (bodyGuardLevel <= 85) policeCount = 2; // Medium (51-85)
    else policeCount = 1;                           // Easy (86-100)

    // Game State
    // Using simple initializer since we don't need prop-dependent state reset often
    const [gameState, setGameState] = useState<GameState>(() => ({
        playerPos: INITIAL_PLAYER_POS,
        policePositions: generateRandomPolicePositions(policeCount),
        status: 'PLAYING',
        moveCount: 0,
        stamina: MAX_STAMINA
    }));

    // Refs for strict control
    const gameOverHandled = useRef(false);
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Pulse Animation
    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.2,
                    duration: 500,
                    useNativeDriver: true
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 500,
                    useNativeDriver: true
                })
            ])
        ).start();
    }, [pulseAnim]);

    // Police AI Tick (The Game Loop)
    useEffect(() => {
        if (gameState.status !== 'PLAYING') return;

        const interval = setInterval(() => {
            setGameState(prev => {
                // If game already ended, do nothing
                if (prev.status !== 'PLAYING') return prev;

                // Move all police randomly
                const newPolicePositions = prev.policePositions.map(policePos =>
                    movePoliceRandomly(policePos)
                );

                // Check collision AFTER move
                const caught = newPolicePositions.some(policePos =>
                    isPositionEqual(policePos, prev.playerPos)
                );

                if (caught) {
                    return {
                        ...prev,
                        policePositions: newPolicePositions,
                        status: 'LOST'
                    };
                }

                // Regenerate stamina
                const newStamina = Math.min(MAX_STAMINA, prev.stamina + staminaRegenRate);

                return {
                    ...prev,
                    policePositions: newPolicePositions,
                    stamina: newStamina
                };
            });
        }, TICK_INTERVAL);

        return () => clearInterval(interval);
    }, [gameState.status, staminaRegenRate]);

    // Game Over Handler (Strict Lock)
    useEffect(() => {
        if (gameState.status === 'WON' && !gameOverHandled.current) {
            gameOverHandled.current = true;
            // Removed internal alert - delegate to onComplete immediately
            // But user requested specific alerts inside here.
            // Wait, standard practice is UI component handles UI, logic handles logic.
            // But user prompt specifically said:
            // Show Alert.alert("Escaped!", ...)
            // OK, I will follow instructions and put Alert here.
            // However, useBlackMarketSystem also has resolveRaid logic which shows alerts.
            // If I alert here AND resolveRaid alerts in parent, we get double alerts safely.
            // The prompt says: "useBlackMarketSystem to call resolveRaid".
            // It also says: "Show Alert.alert(...)".
            // I will trigger onComplete, and let parent handle it if logic is centralized.
            // BUT, the prompt explicitly asked for the Alert logic HERE in point 3.
            // I will assume the parent modal NO LONGER alerts if I am doing it here?
            // Actually, best practice: This component is "dumb". It just reports result.
            // The previous turn I moved alerts OUT to parent. Now they want them back IN?
            // Re-reading prompt: "The Fix: ... Show Alert.alert..."
            // I will put the alert here as requested, but I'll make sure `onComplete` is called in onPress.

            // NOTE: If parent also alerts, we have double alerts.
            // I'll stick to the specific instruction: "Refactor PoliceChaseGame.tsx... Show Alert.alert..."
            Alert.alert(
                "Escaped!",
                "You reached the safe zone!",
                [{ text: "OK", onPress: () => onComplete(true) }]
            );

        } else if (gameState.status === 'LOST' && !gameOverHandled.current) {
            gameOverHandled.current = true;
            Alert.alert(
                "Busted!",
                "The police caught you!",
                [{ text: "Damn", onPress: () => onComplete(false) }]
            );
        }
    }, [gameState.status, onComplete]);

    // Player Movement
    const movePlayer = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
        setGameState(prev => {
            if (prev.status !== 'PLAYING' || prev.stamina < STAMINA_COST_PER_MOVE) return prev;

            const [row, col] = prev.playerPos;
            let newRow = row;
            let newCol = col;

            switch (direction) {
                case 'up': newRow = Math.max(0, row - 1); break;
                case 'down': newRow = Math.min(GRID_SIZE - 1, row + 1); break;
                case 'left': newCol = Math.max(0, col - 1); break;
                case 'right': newCol = Math.min(GRID_SIZE - 1, col + 1); break;
            }

            const newPos: Position = [newRow, newCol];

            // 1. Check Collision with Police (Instant Loss)
            const caught = prev.policePositions.some(policePos =>
                isPositionEqual(policePos, newPos)
            );

            if (caught) {
                return {
                    ...prev,
                    playerPos: newPos,
                    status: 'LOST',
                    moveCount: prev.moveCount + 1,
                    stamina: prev.stamina - STAMINA_COST_PER_MOVE
                };
            }

            // 2. Check Safe House (Win)
            if (isPositionEqual(newPos, SAFE_HOUSE)) {
                return {
                    ...prev,
                    playerPos: newPos,
                    status: 'WON', // Stops loop immediately next render
                    moveCount: prev.moveCount + 1,
                    stamina: prev.stamina - STAMINA_COST_PER_MOVE
                };
            }

            // 3. Normal Move
            return {
                ...prev,
                playerPos: newPos,
                moveCount: prev.moveCount + 1,
                stamina: prev.stamina - STAMINA_COST_PER_MOVE
            };
        });
    }, []);

    // Render Grid
    const renderGrid = () => {
        const cells = [];
        for (let row = 0; row < GRID_SIZE; row++) {
            for (let col = 0; col < GRID_SIZE; col++) {
                const isPlayer = isPositionEqual(gameState.playerPos, [row, col]);
                const isPolice = gameState.policePositions.some(pos => isPositionEqual(pos, [row, col]));
                const isSafeHouse = isPositionEqual(SAFE_HOUSE, [row, col]);

                let content = '';
                if (isPlayer) content = '🏃';
                else if (isPolice) content = '👮';
                else if (isSafeHouse) content = '🏠';

                const cellStyle = [
                    styles.cell,
                    isPlayer && styles.playerCell,
                    isPolice && styles.policeCell,
                    isSafeHouse && styles.safeHouseCell
                ];

                cells.push(
                    <View key={`${row}-${col}`} style={cellStyle}>
                        <Text style={styles.emoji}>{content}</Text>
                    </View>
                );
            }
        }
        return cells;
    };

    const staminaPercentage = (gameState.stamina / MAX_STAMINA) * 100;
    const canMove = gameState.stamina >= STAMINA_COST_PER_MOVE;

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.header}>
                    <Text
                        style={styles.title}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.5}
                    >
                        🚨 POLICE CHASE 🚨
                    </Text>
                    <Text
                        style={styles.subtitle}
                        adjustsFontSizeToFit
                        numberOfLines={1}
                        minimumFontScale={0.5}
                    >
                        Reach the Green Zone
                    </Text>
                </View>

                {/* Stats */}
                <View style={styles.statsContainer}>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Moves:</Text>
                        <Text style={styles.statValue}>{gameState.moveCount}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Text style={styles.statLabel}>Stamina:</Text>
                        <View style={styles.staminaBarContainer}>
                            <View
                                style={[
                                    styles.staminaBar,
                                    {
                                        width: `${staminaPercentage}%`,
                                        backgroundColor:
                                            staminaPercentage > 50 ? '#4ade80' :
                                                staminaPercentage > 25 ? '#fbbf24' : '#ef4444'
                                    }
                                ]}
                            />
                        </View>
                        <Text style={styles.statValue}>{Math.floor(gameState.stamina)}</Text>
                    </View>
                </View>

                {/* Grid */}
                <View style={styles.gridContainer}>
                    <View style={styles.grid}>{renderGrid()}</View>
                </View>

                {/* Controls */}
                <View style={styles.controls}>
                    <View style={styles.controlRow}>
                        <TouchableOpacity
                            style={[styles.controlButton, !canMove && styles.controlButtonDisabled]}
                            onPress={() => movePlayer('up')}
                            disabled={!canMove || gameState.status !== 'PLAYING'}
                        >
                            <Text style={styles.controlText}>↑</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.controlRow}>
                        <TouchableOpacity
                            style={[styles.controlButton, !canMove && styles.controlButtonDisabled]}
                            onPress={() => movePlayer('left')}
                            disabled={!canMove || gameState.status !== 'PLAYING'}
                        >
                            <Text style={styles.controlText}>←</Text>
                        </TouchableOpacity>
                        <View style={styles.controlSpacer} />
                        <TouchableOpacity
                            style={[styles.controlButton, !canMove && styles.controlButtonDisabled]}
                            onPress={() => movePlayer('right')}
                            disabled={!canMove || gameState.status !== 'PLAYING'}
                        >
                            <Text style={styles.controlText}>→</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={styles.controlRow}>
                        <TouchableOpacity
                            style={[styles.controlButton, !canMove && styles.controlButtonDisabled]}
                            onPress={() => movePlayer('down')}
                            disabled={!canMove || gameState.status !== 'PLAYING'}
                        >
                            <Text style={styles.controlText}>↓</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Quit Button */}
                <TouchableOpacity style={styles.quitButton} onPress={onClose}>
                    <Text style={styles.quitText}>Give Up</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

// --- STYLES ---

const { width } = Dimensions.get('window');
const GRID_CONTAINER_WIDTH = width * 0.90; // 90%
const CELL_MARGIN = 2;
const cellSize = Math.floor((GRID_CONTAINER_WIDTH - (GRID_SIZE * CELL_MARGIN * 2) - 10) / GRID_SIZE);

const CONTROL_BUTTON_SIZE = 60;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
        paddingHorizontal: 0,
        paddingBottom: 20,
        justifyContent: 'space-evenly',
        alignItems: 'center'
    },
    header: {
        alignItems: 'center',
        marginTop: 5,
        marginBottom: 5,
        width: '90%'
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#ef4444',
        textShadowColor: '#dc2626',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
        fontFamily: 'Courier New',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 14,
        color: '#9ca3af',
        marginTop: 2,
        fontFamily: 'Courier New',
        textAlign: 'center',
    },
    statsContainer: {
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 5,
        width: '90%',
        marginBottom: 5,
        borderWidth: 1,
        borderColor: '#374151'
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4
    },
    statLabel: {
        fontSize: 12,
        color: '#9ca3af',
        width: 70,
        fontFamily: 'Courier New'
    },
    statValue: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#fff',
        marginLeft: 10,
        fontFamily: 'Courier New'
    },
    staminaBarContainer: {
        flex: 1,
        height: 10,
        backgroundColor: '#374151',
        borderRadius: 5,
        overflow: 'hidden',
        marginHorizontal: 10
    },
    staminaBar: {
        height: '100%',
        borderRadius: 5
    },
    gridContainer: {
        alignItems: 'center',
        marginBottom: 10
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: GRID_CONTAINER_WIDTH,
        backgroundColor: '#1a1a1a',
        borderRadius: 12,
        padding: 2,
        borderWidth: 2,
        borderColor: '#374151',
        justifyContent: 'center'
    },
    cell: {
        width: cellSize,
        height: cellSize,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#262626',
        margin: CELL_MARGIN,
        borderRadius: 8
    },
    playerCell: {
        backgroundColor: '#1e40af',
        borderWidth: 2,
        borderColor: '#3b82f6'
    },
    policeCell: {
        backgroundColor: '#991b1b',
        borderWidth: 2,
        borderColor: '#ef4444'
    },
    safeHouseCell: {
        backgroundColor: '#065f46',
        borderWidth: 2,
        borderColor: '#10b981'
    },
    emoji: {
        fontSize: Math.min(30, cellSize * 0.7)
    },
    controls: {
        alignItems: 'center',
        marginBottom: 10
    },
    controlRow: {
        flexDirection: 'row',
        marginVertical: 2
    },
    controlButton: {
        width: CONTROL_BUTTON_SIZE,
        height: CONTROL_BUTTON_SIZE,
        backgroundColor: '#374151',
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 12,
        marginHorizontal: 5,
        borderWidth: 2,
        borderColor: '#4b5563',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
    },
    controlButtonDisabled: {
        backgroundColor: '#1f2937',
        borderColor: '#374151',
        opacity: 0.5
    },
    controlText: {
        fontSize: 28,
        color: '#fff',
        fontWeight: 'bold'
    },
    controlSpacer: {
        width: CONTROL_BUTTON_SIZE,
        marginHorizontal: 5
    },
    quitButton: {
        backgroundColor: '#7c2d12',
        paddingVertical: 10,
        paddingHorizontal: 40,
        borderRadius: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ea580c',
        marginTop: 5
    },
    quitText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: 'bold',
        fontFamily: 'Courier New'
    }
});
