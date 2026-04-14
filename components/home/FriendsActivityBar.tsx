import React from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    useColorScheme,
    Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { theme } from '@/constants/Theme';
import { FriendUser } from '@/hooks/useFriends';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
    friends: FriendUser[];
    onPressFriend: (friend: FriendUser) => void;
    onPressSeeAll: () => void;
    receivedCount?: number;
}

export default function FriendsActivityBar({
    friends,
    onPressFriend,
    onPressSeeAll,
    receivedCount = 0,
}: Props) {
    const colorScheme = useColorScheme() || 'light';
    const currentTheme = theme[colorScheme];

    return (
        <View style={styles.outerContainer}>
            <View 
                style={[
                    styles.containerStyle, 
                    { 
                        backgroundColor: currentTheme.colors.background,
                        borderColor: colorScheme === 'dark' ? '#333' : '#e5e7eb',
                    }
                ]}
            >
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContainer}
                >
                    {/* See All / Plus button */}
                    <TouchableOpacity
                        style={styles.friendItem}
                        onPress={onPressSeeAll}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.avatarCircle, { backgroundColor: currentTheme.colors.primary + '15', borderColor: currentTheme.colors.primary + '30' }]}>
                            <Ionicons name="people" size={22} color={currentTheme.colors.primary} />
                            {receivedCount > 0 && (
                                <View style={styles.badge}>
                                    <Text style={styles.badgeText}>{receivedCount}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.friendName, { color: currentTheme.colors.textSecondary }]}>Tất cả</Text>
                    </TouchableOpacity>

                    {friends.map((friend, index) => (
                        <MotiView
                            key={friend.id}
                            from={{ opacity: 0, scale: 0.8, translateX: 20 }}
                            animate={{ opacity: 1, scale: 1, translateX: 0 }}
                            transition={{ delay: index * 100, type: 'spring' }}
                        >
                            <TouchableOpacity
                                style={styles.friendItem}
                                onPress={() => onPressFriend(friend)}
                                activeOpacity={0.7}
                            >
                                <View style={styles.avatarWrapper}>
                                    {friend.hasNewPost && (
                                        <MotiView
                                            from={{ scale: 1, opacity: 0.8 }}
                                            animate={{ scale: 1.3, opacity: 0 }}
                                            transition={{
                                                type: 'timing',
                                                duration: 2000,
                                                loop: true,
                                                repeatReverse: false,
                                            }}
                                            style={[styles.glowRing, { borderColor: currentTheme.colors.primary }]}
                                        />
                                    )}
                                    {friend.avatar ? (
                                        <Image 
                                            source={{ uri: friend.avatar }} 
                                            style={styles.avatar}
                                            transition={400}
                                        />
                                    ) : (
                                        <View style={[styles.avatar, styles.placeholderAvatar]}>
                                            <Text style={styles.initials}>
                                                {(friend.displayName ?? friend.username).slice(0, 1).toUpperCase()}
                                            </Text>
                                        </View>
                                    )}
                                    {friend.hasNewPost && (
                                        <View style={[styles.newIndicator, { backgroundColor: currentTheme.colors.primary }]} />
                                    )}
                                </View>
                                <Text
                                    style={[styles.friendName, { color: currentTheme.colors.textSecondary }]}
                                    numberOfLines={1}
                                >
                                    {friend.displayName ?? friend.username}
                                </Text>
                            </TouchableOpacity>
                        </MotiView>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    outerContainer: {
        position: 'absolute',
        bottom: 124, 
        left: 20,
        right: 20,
        zIndex: 1000,
    },
    containerStyle: {
        borderRadius: 32,
        overflow: 'hidden',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    scrollContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        alignItems: 'center',
        gap: 2,
    },
    friendItem: {
        alignItems: 'center',
        width: 64,
        marginRight: 8,
    },
    avatarWrapper: {
        width: 52,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    avatarCircle: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 13,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    placeholderAvatar: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#ede9fe',
    },
    initials: {
        fontSize: 18,
        fontWeight: '800',
        color: '#8b5cf6',
    },
    glowRing: {
        position: 'absolute',
        width: 52,
        height: 52,
        borderRadius: 14,
        borderWidth: 2,
    },
    newIndicator: {
        position: 'absolute',
        bottom: 1,
        right: 1,
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: '#fff',
    },
    friendName: {
        fontSize: 10,
        fontWeight: '700',
        textAlign: 'center',
        opacity: 0.8,
    },
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#ef4444',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 1.5,
        borderColor: '#fff',
    },
    badgeText: {
        color: '#fff',
        fontSize: 9,
        fontWeight: '900',
    },
});
