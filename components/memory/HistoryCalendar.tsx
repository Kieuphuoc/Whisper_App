import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Ionicons } from '@expo/vector-icons';
import { VoicePin } from '@/types';
import { BASE_URL } from '@/configs/Apis';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, withRepeat, withTiming, withSequence, withDelay, interpolate } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const GRID_COLS = 7;


function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function clampToValidDate(input?: string) {
  if (!input) return null;
  const d = new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}

function fmtKey(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function mondayFirstWeekdayIndex(d: Date) {
  // JS getDay(): 0=CN ... 6=T7 -> convert to 0=T2 ... 6=CN
  return (d.getDay() + 6) % 7;
}

interface HistoryCalendarProps {
  pins: VoicePin[];
  currentTheme: any;
  onSelectPin: (pin: VoicePin) => void;
  startDate?: string;
  onPressAddToday?: () => void;
}

const getPinImage = (pin: VoicePin) => {
  const imgUrl = pin.images?.[0]?.imageUrl || pin.imageUrl;
  if (!imgUrl) return null;
  return imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
};

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({
  pins,
  currentTheme,
  onSelectPin,
  startDate,
  onPressAddToday,
}) => {
  const today = useMemo(() => startOfDay(new Date()), []);

  // MONTH NAVIGATION STATE
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(0);

  const pinsByDateKey = useMemo(() => {
    const map: Record<string, VoicePin[]> = {};
    for (const pin of pins) {
      const d = startOfDay(new Date(pin.createdAt));
      const key = fmtKey(d);
      (map[key] = map[key] ?? []).push(pin);
    }
    return map;
  }, [pins]);

  const monthRange = useMemo(() => {
    const now = new Date();
    const start = clampToValidDate(startDate) ?? (pins.length ? new Date(pins.reduce((min, p) => (new Date(p.createdAt) < new Date(min.createdAt) ? p : min), pins[0]).createdAt) : now);
    const startMonth = new Date(start.getFullYear(), start.getMonth(), 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const months: { monthKey: string; label: string; year: number; month: number; daysInMonth: number }[] = [];
    for (let d = new Date(startMonth); d <= endMonth; d = new Date(d.getFullYear(), d.getMonth() + 1, 1)) {
      const year = d.getFullYear();
      const month = d.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      months.push({
        monthKey: `${year}-${month}`,
        label: `tháng ${month + 1} ${year}`, // LOWERCASE as requested
        year,
        month,
        daysInMonth,
      });
    }
    return months.reverse(); // Latest months first
  }, [startDate, pins]);

  const activeMonth = monthRange[selectedMonthIdx] || monthRange[0];

  const nextMonth = () => {
      if (selectedMonthIdx > 0) setSelectedMonthIdx(v => v - 1);
  };
  const prevMonth = () => {
      if (selectedMonthIdx < monthRange.length - 1) setSelectedMonthIdx(v => v + 1);
  };

  if (!activeMonth) return null;

  return (
    <View style={styles.container}>
        {/* Navigation Row */}
        <View style={styles.navRow}>
            <TouchableOpacity 
                onPress={prevMonth} 
                disabled={selectedMonthIdx >= monthRange.length - 1}
                style={[
                    styles.navBtn, 
                    { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.primary + '33' },
                    selectedMonthIdx >= monthRange.length - 1 && { opacity: 0.3 }
                ]}
            >
                <Ionicons name="chevron-back" size={24} color={currentTheme.colors.text} />
            </TouchableOpacity>

            <MotiView
                key={activeMonth.monthKey}
                from={{ opacity: 0, translateY: -5 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.monthInfo}
            >
                <View style={styles.glowDot} />
                <Text style={[styles.monthTitle, { color: currentTheme.colors.text }]}>
                    {activeMonth.label}
                </Text>
            </MotiView>

            <TouchableOpacity 
                onPress={nextMonth}
                disabled={selectedMonthIdx === 0}
                style={[
                    styles.navBtn, 
                    { backgroundColor: currentTheme.colors.surface, borderColor: currentTheme.colors.primary + '33' },
                    selectedMonthIdx === 0 && { opacity: 0.3 }
                ]}
            >
                <Ionicons name="chevron-forward" size={24} color={currentTheme.colors.text} />
            </TouchableOpacity>
        </View>

        <MotiView
          key={activeMonth.monthKey + '-grid'}
          from={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 15 }}
          style={styles.monthWrapper}
        >
          <View style={[styles.monthCard]}>
            <View style={styles.grid}>
              {/* Date cells */}

              {(() => {
                const firstOfMonth = new Date(activeMonth.year, activeMonth.month, 1);
                const leadingEmptyCells = mondayFirstWeekdayIndex(firstOfMonth);
                const totalCells = leadingEmptyCells + activeMonth.daysInMonth;
                const trailingEmptyCells = (GRID_COLS - (totalCells % GRID_COLS)) % GRID_COLS;

                const monthCells: Array<{ type: 'empty' } | { type: 'day'; day: number }> = [];
                for (let i = 0; i < leadingEmptyCells; i++) monthCells.push({ type: 'empty' });
                for (let day = 1; day <= activeMonth.daysInMonth; day++) monthCells.push({ type: 'day', day });
                for (let i = 0; i < trailingEmptyCells; i++) monthCells.push({ type: 'empty' });

                return monthCells.map((cell, i) => {
                  if (cell.type === 'empty') {
                    return <View key={`empty-${i}`} style={[styles.dayCell, styles.emptyDayCell]} />;
                  }

                  const day = cell.day;
                  const cellDate = new Date(activeMonth.year, activeMonth.month, day);
                  const cellDateStart = startOfDay(cellDate);
                  const key = fmtKey(cellDateStart);
                  const dayPins = pinsByDateKey[key];

                  // Show newest pin first; if there are images, prioritize newest pin with image.
                  const dayPinsSorted = [...(dayPins ?? [])].sort(
                    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                  );
                  const firstPinWithImage = dayPinsSorted.find((p) => !!getPinImage(p));
                  const representativePin = firstPinWithImage ?? dayPinsSorted[0];
                  const imgUrl = representativePin ? getPinImage(representativePin) : null;

                  const isToday = cellDateStart.getTime() === today.getTime();
                  const isFuture = cellDateStart.getTime() > today.getTime();
                  const showAdd = isToday && !dayPins?.length && !!onPressAddToday;

                  return (
                    <MotiView
                      key={`day-${day}`}
                      from={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 12, type: 'spring' }}
                      style={styles.dayCell}
                    >
                      {imgUrl ? (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => representativePin && onSelectPin(representativePin)}
                          style={[styles.pinImageWrapper, shadowStyle]}
                        >
                          <Image source={{ uri: imgUrl }} style={styles.pinImage} />
                          <LinearGradient
                            colors={['transparent', 'rgba(0,0,0,0.4)']}
                            style={StyleSheet.absoluteFill}
                          />
                          <View style={styles.dateOverlay}>
                            <Text style={styles.dateNumberText}>{day}</Text>
                          </View>
                          {dayPins.length > 1 && (
                            <MotiView
                              from={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              style={styles.badge}
                            >
                              <Text style={styles.badgeText}>{dayPins.length}</Text>
                            </MotiView>
                          )}
                        </TouchableOpacity>
                      ) : dayPins?.length ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => representativePin && onSelectPin(representativePin)}
                          style={styles.pinFallbackWrapper}
                        >
                          <View style={styles.pinFallbackIcon}>
                            <Ionicons name="mic" size={16} color="#8b5cf6" />
                          </View>
                          <Text style={styles.pinFallbackDateText}>{day}</Text>
                          {dayPins.length > 1 && (
                            <View style={[styles.badge, styles.fallbackBadge]}>
                              <Text style={styles.badgeText}>{dayPins.length}</Text>
                            </View>
                          )}
                        </TouchableOpacity>
                      ) : showAdd ? (
                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={onPressAddToday}
                          style={[
                            styles.addWrapper,
                            { borderColor: currentTheme.colors.primary + '66', backgroundColor: currentTheme.colors.primary + '10' }
                          ]}
                        >
                          <BlurView intensity={20} tint="light" style={StyleSheet.absoluteFill} />
                          <LinearGradient
                            colors={[currentTheme.colors.primary + '40', 'transparent']}
                            style={StyleSheet.absoluteFill}
                          />
                          <Ionicons name="add" size={24} color={currentTheme.colors.primary} />
                          <Text style={[styles.todayText, { color: currentTheme.colors.primary }]}>Nay</Text>
                        </TouchableOpacity>
                      ) : isFuture ? (
                        <View style={[
                          styles.futurePlaceholder,
                          { borderColor: currentTheme.colors.textMuted + '20', backgroundColor: currentTheme.colors.surface + '80' }
                        ]}>
                          <BlurView intensity={5} tint="light" style={StyleSheet.absoluteFill} />
                          <Text style={[styles.futureDateText, { color: currentTheme.colors.textMuted + '40' }]}>{day}</Text>
                        </View>
                      ) : (
                        <View style={styles.pastEmpty}>
                          <View style={[styles.dot, { backgroundColor: currentTheme.colors.textMuted + '20' }]} />
                          <Text style={[styles.pastDateText, { color: currentTheme.colors.textMuted + '60' }]}>{day}</Text>
                        </View>
                      )}
                    </MotiView>
                  );
                });
              })()}
            </View>
          </View>
        </MotiView>
    </View>
  );
};


const shadowStyle = {
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.15,
  shadowRadius: 8,
  elevation: 5,
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
  monthWrapper: {
    width: '100%',
    marginBottom: 10,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  navBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  monthInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
  },
  glowDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7c3aed',
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  monthCard: {
    width: '100%',
    padding: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
  },
  dayCell: {
    // total horizontal space = width - 30 (wrapper margin) - 20 (blur padding) - 30 (container padding) = width - 80
    // We use a small extra buffer (2px) and floor to prevent sub-pixel wrapping issues
    width: Math.floor((width - 82 - 6 * (GRID_COLS - 1)) / GRID_COLS),
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyDayCell: {
    opacity: 0,
  },
  pinImageWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1a1a1a',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  pinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  dateOverlay: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 4,
    paddingHorizontal: 4,
  },
  dateNumberText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  addWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  todayText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '900',
    marginTop: 2,
  },
  futurePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  futureDateText: {
    color: 'rgba(255,255,255,0.2)',
    fontSize: 12,
    fontWeight: '700',
  },
  pastEmpty: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  pastDateText: {
    color: 'rgba(255,255,255,0.3)',
    fontSize: 11,
    fontWeight: '600',
  },
  pinFallbackWrapper: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(139, 92, 246, 0.25)',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    position: 'relative',
  },
  pinFallbackIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.14)',
    marginBottom: 2,
  },
  pinFallbackDateText: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '800',
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#7c3aed',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  fallbackBadge: {
    borderColor: 'rgba(255,255,255,0.8)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
  },
  separatorContainer: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorIcon: {
    padding: 10,
  },
});

export default HistoryCalendar;
