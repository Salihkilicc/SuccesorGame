import React, { useMemo, useState, useRef } from 'react';
import { t, useLocale } from '../../../core/i18n';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Modal,
    Pressable,
    StatusBar,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import { useCalendarStore, CalendarEvent } from '../../../core/store/useCalendarStore';
import CrystalNavBar from '../../../navigation/components/CrystalNavBar';

// ─── Constants ───────────────────────────────────────────────────────────────

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CELL_SIZE = Math.floor((SCREEN_WIDTH - 32 - 6 * 0) / 7); // 7 columns, 16px side padding each

const MONTH_NAMES = [
    'January', 'February', 'March', 'April',
    'May', 'June', 'July', 'August',
    'September', 'October', 'November', 'December',
];

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const pad = (n: number) => String(n).padStart(2, '0');

const formatKey = (year: number, month: number, day: number) =>
    `${year}-${pad(month + 1)}-${pad(day)}`;

const getToday = () => {
    const t = new Date();
    return {
        key: formatKey(t.getFullYear(), t.getMonth(), t.getDate()),
        year: t.getFullYear(),
        month: t.getMonth(),
        day: t.getDate(),
    };
};

// Returns array of cells for a month grid (including leading/trailing nulls for alignment)
const buildMonthGrid = (year: number, monthIndex: number) => {
    const firstDay = new Date(year, monthIndex, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const cells: Array<{ day: number; dateKey: string } | null> = [];

    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        cells.push({ day: d, dateKey: formatKey(year, monthIndex, d) });
    }
    // Pad to complete last row
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
};

// ─── Day Cell ─────────────────────────────────────────────────────────────────

type DayCellProps = {
    day: number;
    dateKey: string;
    isToday: boolean;
    hasEvent: boolean;
    onPress: (dateKey: string) => void;
};

const DayCell = ({ day, dateKey, isToday, hasEvent, onPress }: DayCellProps) => {
    const dayOfWeek = new Date(dateKey).getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return (
        <TouchableOpacity
            style={styles.cell}
            activeOpacity={hasEvent ? 0.65 : 0.9}
            onPress={() => hasEvent && onPress(dateKey)}
        >
            {isToday ? (
                <LinearGradient
                    colors={['#E9B8C9', '#E3A857']}
                    style={styles.todayCircle}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Text style={styles.todayDayNum}>{day}</Text>
                </LinearGradient>
            ) : (
                <View style={[styles.dayCircle, hasEvent && styles.dayCircleEvent]}>
                    <Text style={[
                        styles.dayNum,
                        isWeekend && styles.dayNumWeekend,
                        hasEvent && styles.dayNumWithEvent,
                    ]}>
                        {day}
                    </Text>
                </View>
            )}
            {/* Event dot + star */}
            {hasEvent && (
                <Text style={[styles.eventStar, isToday && styles.eventStarToday]}>✦</Text>
            )}
        </TouchableOpacity>
    );
};

// ─── Month Block ──────────────────────────────────────────────────────────────

type MonthBlockProps = {
    year: number;
    monthIndex: number;
    eventMap: Record<string, CalendarEvent>;
    todayKey: string;
    onDayPress: (dateKey: string) => void;
    isCurrentMonth: boolean;
};

const MonthBlock = ({ year, monthIndex, eventMap, todayKey, onDayPress, isCurrentMonth }: MonthBlockProps) => {
    const cells = useMemo(() => buildMonthGrid(year, monthIndex), [year, monthIndex]);
    const rows = [];
    for (let i = 0; i < cells.length; i += 7) {
        rows.push(cells.slice(i, i + 7));
    }

    return (
        <View style={[styles.monthBlock, isCurrentMonth && styles.monthBlockCurrent]}>
            {/* Month header */}
            <View style={styles.monthHeader}>
                <Text style={[styles.monthName, isCurrentMonth && styles.monthNameCurrent]}>
                    {MONTH_NAMES[monthIndex]}
                </Text>
                {isCurrentMonth && (
                    <View style={styles.currentMonthBadge}>
                        <Text style={styles.currentMonthBadgeText}>{t('life.now')}</Text>
                    </View>
                )}
            </View>

            {/* Day-of-week labels */}
            <View style={styles.weekLabelsRow}>
                {DAY_LABELS.map((label, i) => (
                    <View key={i} style={styles.cell}>
                        <Text style={[styles.weekLabel, (i === 0 || i === 6) && styles.weekLabelWeekend]}>
                            {label}
                        </Text>
                    </View>
                ))}
            </View>

            {/* Date rows */}
            {rows.map((row, rowIdx) => (
                <View key={rowIdx} style={styles.weekRow}>
                    {row.map((cell, cellIdx) =>
                        cell ? (
                            <DayCell
                                key={cell.dateKey}
                                day={cell.day}
                                dateKey={cell.dateKey}
                                isToday={cell.dateKey === todayKey}
                                hasEvent={Boolean(eventMap[cell.dateKey])}
                                onPress={onDayPress}
                            />
                        ) : (
                            <View key={`empty-${cellIdx}`} style={styles.cell} />
                        ),
                    )}
                </View>
            ))}
        </View>
    );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────

const CalendarScreen = () => {
    useLocale();
    const navigation = useNavigation();
    const { events } = useCalendarStore();
    const insets = useSafeAreaInsets();

    const today = useMemo(() => getToday(), []);
    const [selectedYear, setSelectedYear] = useState(today.year); // keeping state for logic, but removing UI
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const eventMap = useMemo(() => {
        const map: Record<string, CalendarEvent> = {};
        events.forEach((e) => { map[e.date] = e; });
        return map;
    }, [events]);

    const handleDayPress = (dateKey: string) => {
        const ev = eventMap[dateKey];
        if (ev) setSelectedEvent(ev);
    };

    return (
        <View style={styles.root}>
            <StatusBar barStyle="light-content" />

            <LinearGradient
                colors={['#000000', '#000000', '#000000']}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            <View style={[styles.safeArea]}>
                {/* ── Header ── */}
                <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.6, transform: [{ scale: 0.95 }] }]}
                    >
                        <MaterialCommunityIcons name="arrow-left" size={24} color="#E9B8C9" />
                    </Pressable>

                    <View style={styles.headerCenter}>
                        <Text style={styles.headerTitle}>{t('life.calendar')}</Text>
                        <View style={styles.headerAccent} />
                    </View>
                </View>

                {/* ── Scrollable months ── */}
                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {Array.from({ length: 12 - today.month }, (_, i) => {
                        const monthIndex = today.month + i;
                        return (
                            <MonthBlock
                                key={monthIndex}
                                year={selectedYear}
                                monthIndex={monthIndex}
                                eventMap={eventMap}
                                todayKey={today.key}
                                onDayPress={handleDayPress}
                                isCurrentMonth={selectedYear === today.year && monthIndex === today.month}
                            />
                        );
                    })}
                    <View style={{ height: 140 }} />
                </ScrollView>

                {/* Universal Crystal Navigation Bar */}
                <CrystalNavBar activeTab="Home" variant="dark" hideDots={true} />
            </View>

            {/* ── Event Detail Modal ── */}
            <Modal
                visible={selectedEvent !== null}
                transparent
                animationType="fade"
                statusBarTranslucent
                onRequestClose={() => setSelectedEvent(null)}
            >
                <Pressable style={styles.modalOverlay} onPress={() => setSelectedEvent(null)}>
                    <Pressable onPress={e => e.stopPropagation()}>
                        <View style={styles.modalCard}>
                            {/* Top glow strip */}
                            <LinearGradient
                                colors={['rgba(197,160,89,0.3)', 'transparent']}
                                style={styles.modalTopGlow}
                                start={{ x: 0.5, y: 0 }}
                                end={{ x: 0.5, y: 1 }}
                            />

                            {/* Star icon */}
                            <LinearGradient
                                colors={['#E9B8C9', '#E3A857', '#473633']}
                                style={styles.modalStar}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 1 }}
                            >
                                <Text style={styles.modalStarText}>✦</Text>
                            </LinearGradient>

                            <Text style={styles.modalDate}>{selectedEvent?.date}</Text>
                            <Text style={styles.modalTitle}>{selectedEvent?.title}</Text>

                            <View style={styles.modalRule} />

                            <Text style={styles.modalDesc}>{selectedEvent?.description}</Text>

                            <Pressable
                                onPress={() => setSelectedEvent(null)}
                                style={({ pressed }) => [styles.modalDismiss, pressed && { opacity: 0.7 }]}
                            >
                                <Text style={styles.modalDismissText}>{t('life.dismiss')}</Text>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        </View>
    );
};

export default CalendarScreen;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: '#000000' },
    safeArea: { flex: 1 },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 16,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'rgba(197,160,89,0.15)',
        minHeight: 70,
    },
    backBtn: {
        width: 38,
        height: 38,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'absolute',
        left: 16,
        bottom: 12, // Align closer to the bottom of the header consistently
        zIndex: 10,
        backgroundColor: 'rgba(197,160,89,0.08)',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.2)',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 6,
        textTransform: 'uppercase',
    },
    headerAccent: {
        width: 32,
        height: 2,
        backgroundColor: '#E9B8C9', // Gold accent
        marginTop: 6,
        borderRadius: 2,
        shadowColor: '#E9B8C9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },


    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 16, paddingTop: 12 },

    // Month block
    monthBlock: {
        marginBottom: 24,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.025)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
        paddingBottom: 10,
    },
    monthBlockCurrent: {
        backgroundColor: 'rgba(197,160,89,0.05)',
        borderColor: 'rgba(197,160,89,0.18)',
    },
    monthHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingTop: 14,
        paddingBottom: 8,
        gap: 8,
    },
    monthName: {
        fontSize: 18,
        fontWeight: '300',
        color: '#FFFFFF',
        letterSpacing: 4,
        textTransform: 'uppercase',
    },
    monthNameCurrent: {
        color: '#E9B8C9',
        fontWeight: '600',
    },
    currentMonthBadge: {
        backgroundColor: 'rgba(197,160,89,0.18)',
        borderRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.35)',
        paddingHorizontal: 6,
        paddingVertical: 2,
    },
    currentMonthBadgeText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#E9B8C9',
        letterSpacing: 1.5,
    },

    // Day-of-week label row
    weekLabelsRow: {
        flexDirection: 'row',
        paddingHorizontal: 4,
        marginBottom: 2,
    },
    weekLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: '#614A4B',
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    weekLabelWeekend: { color: 'rgba(74,74,98,0.6)' },

    // Week row
    weekRow: {
        flexDirection: 'row',
        paddingHorizontal: 4,
    },

    // Cell (shared by DayCell and empty)
    cell: {
        flex: 1,
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        paddingBottom: 2,
    },

    // Day number circle
    dayCircle: {
        width: CELL_SIZE * 0.72,
        height: CELL_SIZE * 0.72,
        borderRadius: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
    },
    dayCircleEvent: {
        backgroundColor: 'rgba(197,160,89,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.3)',
    },
    dayNum: {
        fontSize: 14,
        fontWeight: '500',
        color: '#E9B8C9',
        textAlign: 'center',
    },
    dayNumWeekend: { color: 'rgba(192,192,208,0.4)' },
    dayNumWithEvent: { color: '#FFFFFF', fontWeight: '700' },

    // Today
    todayCircle: {
        width: CELL_SIZE * 0.72,
        height: CELL_SIZE * 0.72,
        borderRadius: CELL_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#E9B8C9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
        elevation: 6,
    },
    todayDayNum: {
        fontSize: 14,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
    },

    // Event star (below day number)
    eventStar: {
        position: 'absolute',
        bottom: 1,
        fontSize: 7,
        color: '#E9B8C9',
        textShadowColor: 'rgba(197,160,89,0.9)',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 6,
    },
    eventStarToday: { color: '#E3A857' },

    // Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.78)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalCard: {
        width: '100%',
        backgroundColor: '#000000',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.38)',
        paddingHorizontal: 28,
        paddingTop: 32,
        paddingBottom: 24,
        alignItems: 'center',
        overflow: 'hidden',
        shadowColor: '#E9B8C9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 30,
        elevation: 14,
    },
    modalTopGlow: {
        ...StyleSheet.absoluteFillObject,
        height: 80,
        borderRadius: 22,
    },
    modalStar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 16,
        shadowColor: '#E9B8C9',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 18,
        elevation: 10,
    },
    modalStarText: { fontSize: 24, color: '#FFF' },
    modalDate: {
        fontSize: 11,
        color: '#614A4B',
        letterSpacing: 2,
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFFFFF',
        textAlign: 'center',
        letterSpacing: 0.2,
        marginBottom: 18,
    },
    modalRule: {
        width: '75%',
        height: StyleSheet.hairlineWidth,
        backgroundColor: 'rgba(197,160,89,0.3)',
        marginBottom: 18,
    },
    modalDesc: {
        fontSize: 14,
        color: '#B28C96',
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 28,
    },
    modalDismiss: {
        width: '100%',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(197,160,89,0.35)',
        backgroundColor: 'rgba(197,160,89,0.08)',
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalDismissText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#E9B8C9',
        letterSpacing: 2.5,
    },
});
