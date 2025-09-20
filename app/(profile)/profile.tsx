import MiniVoiceCard from '@/components/MiniVoiceCard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Apis, { authApis, endpoints } from '../../configs/Apis';
import { getLocationNameShort } from '../../utils/geocoding';


type User = {
    id: number,
    username: string;
    displayName: string;
    avatar?: string;
}
type Stats = {
    friendCount: number;
    totalListens: number;
    voicePinCount: number;
}

type VoicePin = {
    id: string;
    latitude: number;
    longitude: number;
    emotion: string;
    description: string;
    duration: number;
    visibility: 'PUBLIC' | 'PRIVATE' | 'FRIENDS';
    audioUrl?: string;
    imageUrl?: string;
    address?: string;
    createdAt: string;
    user?: {
        id: number,
        username: string;
        displayName: string;

        avatar?: string;
    };
    likes?: number;
    replies?: number;
};
export default function ProfileScreen() {
    const { userId } = useLocalSearchParams();
    const id = parseInt(userId as string, 10);
    const [user, setUser] = useState<User | null>(null);
    const [stats, setStats] = useState<Stats | null>(null);
    const [voicePin, setVoicePin] = useState<VoicePin[]>([]);
    const [userLocation, setUserLocation] = useState<string>('Loading...');
    const [friendRequestStatus, setFriendRequestStatus] = useState<'none' | 'pending' | 'friends' | 'loading'>('none');

    const [loading, setLoading] = useState<boolean>(false);

    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'pins' | 'memories'>('pins');

    const loadMe = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).get(endpoints['me'])

            const data = res.data;
            console.log(data)
            setUser(data);
        } catch (ex: any) {
            console.log('Error loading Me:', ex);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            setLoading(true)
             const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }
            const res = await authApis(token).get(endpoints['meStats'])

            const data = res.data;
            console.log(data)
            setStats(data);
        } catch (ex: any) {
            console.log('Error loading Stats:', ex);
        } finally {
            setLoading(false);
        }
    };

    const loadVoicePin = async () => {
        try {
            setLoading(true);
            const res = await Apis.get(endpoints['voicePublicByUser'](id))

            const data = res.data;
            console.log(data.data)
            setVoicePin(data.data);
        } catch (ex: any) {
            console.log('Error loading VoicePin:', ex);
        } finally {
            setLoading(false);
        }
    };

    const handleAddFriend = async () => {
        try {
            setFriendRequestStatus('loading');
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).post(endpoints['friendRequest'], {
                receiverId: id
            });

            console.log('Friend request sent:', res.data);
            setFriendRequestStatus('pending');

            // Có thể thêm toast notification ở đây
            alert('Đã gửi lời mời kết bạn!');

        } catch (ex: any) {
            console.log('Error sending friend request:', ex);
            setFriendRequestStatus('none');

            // Xử lý lỗi cụ thể
            if (ex.response?.status === 400) {
                alert('Không thể gửi lời mời kết bạn. Có thể bạn đã là bạn bè hoặc đã gửi lời mời trước đó.');
            } else {
                alert('Có lỗi xảy ra khi gửi lời mời kết bạn. Vui lòng thử lại.');
            }
        }
    };

    useEffect(() => {
        loadMe();
        loadStats();
        loadVoicePin();
    }, []);

    useEffect(() => {
        const loadUserLocation = async () => {
            if (voicePin.length > 0) {
                try {
                    // Lấy location từ voice pin đầu tiên hoặc gần nhất
                    const firstPin = voicePin[0];
                    const location = await getLocationNameShort(firstPin.latitude, firstPin.longitude);
                    setUserLocation(location);
                } catch (error) {
                    console.error('Error loading user location:', error);
                    setUserLocation('Unknown Location');
                }
            }
        };

        loadUserLocation();
    }, [voicePin]);

    const mostPlayedMemories = [
        {
            id: '1',
            title: 'Peaceful Morning',
            emotion: '😌',
            duration: '1:30',
            playCount: 45,
        },
        {
            id: '2',
            title: 'City Sounds',
            emotion: '🏙️',
            duration: '0:55',
            playCount: 32,
        },
        {
            id: '3',
            title: 'Nature Walk',
            emotion: '🌿',
            duration: '2:45',
            playCount: 28,
        },
    ];



    const MemoryCard = ({ memory }: { memory: any }) => (
        <View style={styles.memoryBento}>
            <View style={styles.memoryHeader}>
                <View style={styles.memoryIconContainer}>
                    <Text style={styles.memoryEmoji}>{memory.emotion}</Text>
                </View>
                <View style={styles.memoryInfo}>
                    <Text style={styles.memoryTitle}>{memory.title}</Text>
                    <Text style={styles.memoryDuration}>{memory.duration}</Text>
                </View>
                <View style={styles.playCountContainer}>
                    <Text style={styles.playCount}>{memory.playCount}</Text>
                    <Text style={styles.playCountLabel}>plays</Text>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            {/* Header */}
            {/* <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Ionicons name="arrow-back" size={20} color="#8b5cf6" />
                </TouchableOpacity>

                <TouchableOpacity style={styles.settingsButton}>
                    <Ionicons name="settings-outline" size={20} color="#8b5cf6" />
                </TouchableOpacity>
            // </View> */}


            <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                {/* Profile Info */}
                <View style={styles.profileBento}>
                    <View style={styles.profileImageContainer}>
                        <Image
                            source={{ uri: user?.avatar || 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg' }}
                            style={styles.profileImage}
                        />
                        <View style={styles.onlineIndicator} />
                    </View>

                    <View style={styles.profileInfo}>
                        <Text style={styles.username}>{user?.displayName}</Text>
                        <Text style={styles.userBio}>Voice storyteller & memory collector</Text>
                        <Text style={styles.userLocation}>{userLocation}</Text>
                    </View>
                </View>

                {/* Stats */}
                <View style={styles.statsBento}>
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats?.voicePinCount}</Text>
                        <Text style={styles.statLabel}>Voice Pins</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats?.totalListens}</Text>
                        <Text style={styles.statLabel}>Total Plays</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                        <Text style={styles.statValue}>{stats?.friendCount}</Text>
                        <Text style={styles.statLabel}>Friend</Text>
                    </View>
                </View>


                {/* Tabs */}
                <View style={styles.tabsBento}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'pins' && styles.activeTab]}
                        onPress={() => setActiveTab('pins')}
                    >
                        <Text style={[styles.tabText, activeTab === 'pins' && styles.activeTabText]}>
                            Voice Pins
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'memories' && styles.activeTab]}
                        onPress={() => setActiveTab('memories')}
                    >
                        <Text style={[styles.tabText, activeTab === 'memories' && styles.activeTabText]}>
                            Most Played
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {activeTab === 'pins' ? (
                        <View style={styles.pinsContainer}>
                            {voicePin.map((voicePin) => (
                                <MiniVoiceCard key={voicePin.id} voicePin={voicePin} />
                            ))}
                        </View>
                    ) : (
                        <View style={styles.memoriesContainer}>
                            {mostPlayedMemories.map((memory) => (
                                <MemoryCard key={memory.id} memory={memory} />
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    settingsButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    scrollView: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    profileBento: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    profileImageContainer: {
        position: 'relative',
        marginRight: 16,
    },
    profileImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#10b981',
        borderWidth: 3,
        borderColor: '#f8fafc',
    },
    profileInfo: {
        flex: 1,
    },
    username: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1e293b',
        marginBottom: 4,
    },
    userBio: {
        fontSize: 14,
        color: '#64748b',
        marginBottom: 4,
    },
    userLocation: {
        fontSize: 12,
        color: '#9ca3af',
    },
    statsBento: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        elevation: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statValue: {
        fontSize: 20,
        fontWeight: '700',
        color: '#8b5cf6',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '500',
    },
    statDivider: {
        width: 1,
        height: 40,
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        marginHorizontal: 8,
    },
    actionsBento: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
    },
    following: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    followingText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    followingPending: {
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    followingTextPending: {
        color: '#10b981',
    },
    followingFriends: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    followingTextFriends: {
        color: '#8b5cf6',
    },
    followingLoading: {
        backgroundColor: 'rgba(156, 163, 175, 0.1)',
        borderColor: 'rgba(156, 163, 175, 0.3)',
    },
    followingTextLoading: {
        color: '#9ca3af',
    },
    messageButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    messageText: {
        marginLeft: 8,
        fontSize: 14,
        fontWeight: '600',
        color: '#8b5cf6',
    },
    tabsBento: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 4,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#8b5cf6',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#6b7280',
    },
    activeTabText: {
        color: '#ffffff',
        fontWeight: '600',
    },
    contentContainer: {
        paddingBottom: 20,
    },
    pinsContainer: {
        gap: 12,
    },

    memoriesContainer: {
        gap: 12,
    },
    memoryBento: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    memoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    memoryIconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    memoryEmoji: {
        fontSize: 18,
    },
    memoryInfo: {
        flex: 1,
    },
    memoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    memoryDuration: {
        fontSize: 12,
        color: '#64748b',
    },
    playCountContainer: {
        alignItems: 'center',
    },
    playCount: {
        fontSize: 16,
        fontWeight: '700',
        color: '#8b5cf6',
    },
    playCountLabel: {
        fontSize: 10,
        color: '#9ca3af',
    },
});
