import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VoicePin } from '@/types';
import { BASE_URL } from '@/configs/Apis';

const { width } = Dimensions.get('window');
const GRID_COLS = 6;
const DAY_SIZE = (width - 80) / GRID_COLS; 

interface HistoryCalendarProps {
  pins: VoicePin[];
  currentTheme: any;
  onSelectPin: (pin: VoicePin) => void;
}

const getPinImage = (pin: VoicePin) => {
  const imgUrl = pin.images?.[0]?.imageUrl || pin.imageUrl;
  if (!imgUrl) return null;
  return imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl.startsWith('/') ? '' : '/'}${imgUrl}`;
};

const HistoryCalendar: React.FC<HistoryCalendarProps> = ({ pins, currentTheme, onSelectPin }) => {
  const groupedData = useMemo(() => {
    const monthsMap: Record<string, Record<number, VoicePin[]>> = {};

    pins.forEach((pin) => {
      const date = new Date(pin.createdAt);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      const day = date.getDate();

      if (!monthsMap[monthKey]) {
        monthsMap[monthKey] = {};
      }
      if (!monthsMap[monthKey][day]) {
        monthsMap[monthKey][day] = [];
      }
      monthsMap[monthKey][day].push(pin);
    });

    // Convert to sorted array
    return Object.keys(monthsMap)
      .map((key) => {
        const [year, month] = key.split('-').map(Number);
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        return {
          monthKey: key,
          label: `tháng ${month + 1} ${year}`,
          year,
          month,
          daysInMonth,
          pinsByDay: monthsMap[key],
        };
      })
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      });
  }, [pins]);

  return (
    <View style={styles.container}>
      {groupedData.map((monthData, index) => (
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
                const dayPins = monthData.pinsByDay[day];
                const firstPin = dayPins?.[0];
                const imgUrl = firstPin ? getPinImage(firstPin) : null;

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
                    ) : (
                      <View style={[styles.dot, { backgroundColor: currentTheme.colors.textMuted + '40' }]} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>

          {/* Dashed line separator */}
          {index < groupedData.length - 1 && (
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
    width: DAY_SIZE,
    height: DAY_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinImageWrapper: {
    width: DAY_SIZE * 1.2,
    height: DAY_SIZE * 1.2,
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
