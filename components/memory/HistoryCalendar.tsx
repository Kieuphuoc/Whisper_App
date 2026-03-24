import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoicePin } from '@/types';
import { BASE_URL } from '@/configs/Apis';

const { width } = Dimensions.get('window');
const GRID_COLS = 6;

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
        label: `tháng ${month + 1} ${year}`,
        year,
        month,
        daysInMonth,
      });
    }
    return months;
  }, [startDate, pins]);

  return (
    <View style={styles.container}>
      {monthRange.map((monthData, index) => (
        <View key={monthData.monthKey} style={styles.monthWrapper}>
          {/* Month Card */}
          <View
            style={[
              styles.monthCard,
              {
                backgroundColor: currentTheme.colors.surfaceAlt,
                shadowColor: '#000',
              },
            ]}
          >
            <Text style={[styles.monthTitle, { color: currentTheme.colors.text, fontFamily: currentTheme.typography.fonts.bold }]}>
              {monthData.label}
            </Text>

            <View style={styles.grid}>
              {Array.from({ length: monthData.daysInMonth }).map((_, i) => {
                const day = i + 1;
                const cellDate = new Date(monthData.year, monthData.month, day);
                const cellDateStart = startOfDay(cellDate);
                const key = fmtKey(cellDateStart);
                const dayPins = pinsByDateKey[key];
                const firstPin = dayPins?.[0];
                const imgUrl = firstPin ? getPinImage(firstPin) : null;

                const isToday = cellDateStart.getTime() === today.getTime();
                const isFuture = cellDateStart.getTime() > today.getTime();
                const showAdd = isToday && !dayPins?.length && !!onPressAddToday;

                return (
                  <View key={day} style={styles.dayCell}>
                    {imgUrl ? (
                      <TouchableOpacity
                        activeOpacity={0.8}
                        onPress={() => onSelectPin(firstPin)}
                        style={[styles.pinImageWrapper, shadowStyle]}
                      >
                        <Image source={{ uri: imgUrl }} style={styles.pinImage} />
                        {dayPins.length > 1 && (
                          <View style={styles.badge}>
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
                          {
                            borderColor: currentTheme.colors.primary,
                            backgroundColor: currentTheme.colors.primary + '10',
                          },
                        ]}
                      >
                        <Ionicons name="add" size={20} color={currentTheme.colors.primary} />
                      </TouchableOpacity>
                    ) : isFuture ? (
                      <View
                        style={[
                          styles.futurePlaceholder,
                          {
                            backgroundColor: currentTheme.colors.textMuted + '10',
                            borderColor: currentTheme.colors.textMuted + '15',
                          },
                        ]}
                      />
                    ) : (
                      <View style={[styles.dot, { backgroundColor: currentTheme.colors.textMuted + '40' }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Dashed line separator */}
          {index < monthRange.length - 1 && (
            <View style={styles.separatorWrapper}>
              <View style={[styles.dashedLine, { borderColor: currentTheme.colors.textMuted + '30' }]} />
            </View>
          )}
        </View>
      ))}
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
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  monthWrapper: {
    alignItems: 'center',
    width: '100%',
  },
  monthCard: {
    width: '100%',
    borderRadius: 30,
    padding: 24,
    marginBottom: 0,
  },
  monthTitle: {
    fontSize: 18,
    marginBottom: 20,
    textTransform: 'lowercase',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 12,
  },
  dayCell: {
    width: (width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS,
    height: (width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinImageWrapper: {
    width: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    height: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#333',
    position: 'relative',
  },
  pinImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  addWrapper: {
    width: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    height: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  futurePlaceholder: {
    width: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    height: ((width - 40 - 48 - 12 * (GRID_COLS - 1)) / GRID_COLS) * 1.2,
    borderRadius: 12,
    borderWidth: 1,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#8b5cf6',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
  },
  separatorWrapper: {
    height: 40,
    justifyContent: 'center',
  },
  dashedLine: {
    height: 40,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
  },
});

export default HistoryCalendar;
