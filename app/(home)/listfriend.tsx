import { authApis, endpoints } from '@/configs/Apis';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Friend = {
    id: number;           // id của người dùng
    username: string;     // tên đăng nhập
    displayName: string;  // tên hiển thị
    avatar?: string;      // ảnh đại diện (tùy chọn)
    isOnline?: boolean;   // trạng thái online
    lastSeen?: string;    // thời gian hoạt động cuối
};

type FriendRequest = {
    id: number;
    sender: Friend;
    receiver: Friend;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
};


const FriendCard = ({ friend }: { friend: Friend }) => {
    const router = useRouter();

    const handlePress = () => {
        router.push({ pathname: '/(home)/profile', params: { userId: friend.id } });
    };

    return (
        <TouchableOpacity style={styles.friendCard} onPress={handlePress}>
            <View style={styles.friendAvatarContainer}>
                <Image
                    source={{ uri: friend.avatar || 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg' }}
                    style={styles.friendAvatar}
                />
                {friend.isOnline && <View style={styles.onlineIndicator} />}
            </View>

            <View style={styles.friendInfo}>
                <View style={styles.friendHeader}>
                    <Text style={styles.friendName}>{friend.displayName}</Text>
                    <Text style={styles.friendUsername}>@{friend.username}</Text>
                </View>

                <View style={styles.friendDetails}>
                    <View style={styles.friendDetailItem}>
                        <Ionicons name="location-outline" size={12} color="#9ca3af" />
                        <Text style={styles.friendDetailText}>Hà Nội, Việt Nam</Text>
                    </View>
                    <View style={styles.friendDetailItem}>
                        <Ionicons name="people-outline" size={12} color="#9ca3af" />
                        <Text style={styles.friendDetailText}>5 bạn chung</Text>
                    </View>
                </View>

                <Text style={styles.lastSeen}>
                    {friend.isOnline ? 'Đang hoạt động' : friend.lastSeen || '2 giờ trước'}
                </Text>
            </View>

            <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="chatbubble-outline" size={16} color="#8b5cf6" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

const FriendRequestCard = ({
    friendRequest,
    onAccept,
    onReject
}: {
    friendRequest: FriendRequest;
    onAccept: (id: number) => void;
    onReject: (id: number) => void;
}) => {
    const router = useRouter();
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePress = () => {
        router.push({ pathname: '/(home)/profile', params: { userId: friendRequest.sender.id } });
    };

    const handleAccept = async () => {
        setIsProcessing(true);
        try {
            await onAccept(friendRequest.id);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleReject = async () => {
        setIsProcessing(true);
        try {
            await onReject(friendRequest.id);
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <View style={styles.friendRequestCard}>
            <TouchableOpacity style={styles.friendRequestContent} onPress={handlePress}>
                <View style={styles.friendAvatarContainer}>
                    <Image
                        source={{ uri: friendRequest.sender.avatar || 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg' }}
                        style={styles.friendAvatar}
                    />
                    {friendRequest.sender.isOnline && <View style={styles.onlineIndicator} />}
                </View>

                <View style={styles.friendInfo}>
                    <View style={styles.friendHeader}>
                        <Text style={styles.friendName}>{friendRequest.sender.displayName}</Text>
                        <Text style={styles.friendUsername}>@{friendRequest.sender.username}</Text>
                    </View>

                    <View style={styles.friendDetails}>
                        <View style={styles.friendDetailItem}>
                            <Ionicons name="location-outline" size={12} color="#9ca3af" />
                            <Text style={styles.friendDetailText}>Hà Nội, Việt Nam</Text>
                        </View>
                        <View style={styles.friendDetailItem}>
                            <Ionicons name="people-outline" size={12} color="#9ca3af" />
                            <Text style={styles.friendDetailText}>3 bạn chung</Text>
                        </View>
                    </View>

                    <Text style={styles.lastSeen}>
                        {friendRequest.sender.isOnline ? 'Đang hoạt động' : friendRequest.sender.lastSeen || '1 giờ trước'}
                    </Text>
                </View>
            </TouchableOpacity>
            <View style={styles.actionButtons}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.acceptButton]} 
                    onPress={handleAccept}
                    disabled={isProcessing}
                >
                    <Ionicons name="checkmark" size={16} color="#ffffff" />
                    <Text style={styles.acceptButtonText}>
                        {isProcessing ? 'Đang xử lý...' : 'Đồng ý'}
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={[styles.actionButton, styles.rejectButton]} 
                    onPress={handleReject}
                    disabled={isProcessing}
                >
                    <Ionicons name="close" size={16} color="#ffffff" />
                    <Text style={styles.rejectButtonText}>
                        {isProcessing ? 'Đang xử lý...' : 'Từ chối'}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

export default function ListFriendScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOnline, setFilterOnline] = useState(false);
    const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

    // const filteredFriends = mockFriends.filter(friend => {
    //     const matchesSearch = friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    //         friend.username.toLowerCase().includes(searchQuery.toLowerCase());
    //     const matchesFilter = !filterOnline || friend.isOnline;
    //     return matchesSearch && matchesFilter;
    // });
    const [loading, setLoading] = useState(false);
    const [friend, setFriend] = useState<Friend[]>([]);
    const [pending, setPending] = useState<FriendRequest[]>([]);
    const [received, setReceived] = useState<FriendRequest[]>([]);


    // const onlineCount = mockFriends.filter(friend => friend.isOnline).length;

    const loadFriend = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).get(endpoints['friendList']);
            const data = res.data;
            console.log('Friends:', data.data);

            // Thêm dữ liệu giả về trạng thái online
            const friendsWithOnlineStatus = (data.data || []).map((friend: Friend) => ({
                ...friend,
                isOnline: Math.random() > 0.5, // 50% chance online
                lastSeen: friend.isOnline ? undefined : `${Math.floor(Math.random() * 24)} giờ trước`
            }));

            setFriend(friendsWithOnlineStatus);
        } catch (ex: any) {
            console.log('Error loading Friends:', ex);
        } finally {
            setLoading(false);
        }
    };

    const loadPending = async () => {
        try {
            setLoading(true);
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).get(endpoints['friendPending']);
            const data = res.data;
            console.log('Pending data:', data);
            console.log('Sent requests:', data.sent);
            console.log('Received requests:', data.received);

            // Thêm dữ liệu giả về trạng thái online cho sent requests
            const sentWithOnlineStatus = (data.sent || []).map((request: any) => ({
                ...request,
                receiver: {
                    ...request.receiver,
                    isOnline: Math.random() > 0.6, // 40% chance online
                    lastSeen: request.receiver.isOnline ? undefined : `${Math.floor(Math.random() * 12)} giờ trước`
                }
            }));

            // Thêm dữ liệu giả về trạng thái online cho received requests
            const receivedWithOnlineStatus = (data.received || []).map((request: any) => ({
                ...request,
                sender: {
                    ...request.sender,
                    isOnline: Math.random() > 0.4, // 60% chance online
                    lastSeen: request.sender.isOnline ? undefined : `${Math.floor(Math.random() * 6)} giờ trước`
                }
            }));

            setPending(sentWithOnlineStatus);
            setReceived(receivedWithOnlineStatus);
        } catch (ex: any) {
            console.log('Error loading Pending:', ex);
        } finally {
            setLoading(false);
        }
    };

    // Hàm xử lý chấp nhận friend request
    const handleAcceptFriendRequest = async (requestId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).post(endpoints['friendRespond'](requestId), {
                status: 'accept'
            });

            console.log('Friend request accepted:', res.data);

            // Cập nhật UI - xóa khỏi received requests
            setReceived(prev => prev.filter(req => req.id !== requestId));

            // Có thể thêm toast notification ở đây
            alert('Đã chấp nhận lời mời kết bạn!');

        } catch (ex: any) {
            console.log('Error accepting friend request:', ex);
            alert('Có lỗi xảy ra khi chấp nhận lời mời kết bạn. Vui lòng thử lại.');
        }
    };

    // Hàm xử lý từ chối friend request
    const handleRejectFriendRequest = async (requestId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).post(endpoints['friendRespond'](requestId), {
                status: 'reject'
            });

            console.log('Friend request rejected:', res.data);

            // Cập nhật UI - xóa khỏi received requests
            setReceived(prev => prev.filter(req => req.id !== requestId));

            // Có thể thêm toast notification ở đây
            alert('Đã từ chối lời mời kết bạn!');

        } catch (ex: any) {
            console.log('Error rejecting friend request:', ex);
            alert('Có lỗi xảy ra khi từ chối lời mời kết bạn. Vui lòng thử lại.');
        }
    };

    // Hàm xử lý hủy friend request đã gửi
    const handleCancelFriendRequest = async (requestId: number) => {
        try {
            const token = await AsyncStorage.getItem('token');
            if (!token) {
                throw new Error('No token found');
            }

            const res = await authApis(token).delete(endpoints['friendCancel'](requestId));

            console.log('Friend request cancelled:', res.data);

            // Cập nhật UI - xóa khỏi pending requests
            setPending(prev => prev.filter(req => req.id !== requestId));

            // Có thể thêm toast notification ở đây
            alert('Đã hủy lời mời kết bạn!');

        } catch (ex: any) {
            console.log('Error cancelling friend request:', ex);
            alert('Có lỗi xảy ra khi hủy lời mời kết bạn. Vui lòng thử lại.');
        }
    };

    useEffect(() => {
        loadFriend();
        loadPending();
    }, []);
    return (
        <View style={styles.container}>

            {/* Tab Navigation */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
                    onPress={() => setActiveTab('friends')}
                >
                    <Ionicons
                        name="people-outline"
                        size={20}
                        color={activeTab === 'friends' ? '#8b5cf6' : '#9ca3af'}
                    />
                    <Text style={[styles.tabText, activeTab === 'friends' && styles.activeTabText]}>
                        Bạn bè
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={[styles.tab, activeTab === 'requests' && styles.activeTab]}
                    onPress={() => setActiveTab('requests')}
                >
                    <Ionicons
                        name="person-add-outline"
                        size={20}
                        color={activeTab === 'requests' ? '#8b5cf6' : '#9ca3af'}
                    />
                    <Text style={[styles.tabText, activeTab === 'requests' && styles.activeTabText]}>
                        Lời mời kết bạn
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder={activeTab === 'friends' ? "Tìm kiếm bạn bè..." : "Tìm kiếm lời mời..."}
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                {activeTab === 'friends' && (
                <TouchableOpacity
                    style={[styles.filterButton, filterOnline && styles.filterButtonActive]}
                        onPress={() => setFilterOnline(!filterOnline)}
                >
                    <Ionicons name="radio-button-on" size={16} color={filterOnline ? "#8b5cf6" : "#9ca3af"} />
                    <Text style={[styles.filterText, filterOnline && styles.filterTextActive]}>
                        Chỉ online
                    </Text>
                </TouchableOpacity>
                )}
            </View>

            {/* Content based on active tab */}
            <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {activeTab === 'friends' ? (
                    // Friends Tab Content
                    <>
                        {/* Current Friends */}
                        {friend && friend.length > 0 && (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Bạn bè ({friend.length})</Text>
                            </View>
                        )}
                        {friend?.map((item) => (
                            <FriendCard key={item.id} friend={item} />
                        ))}

                        {/* Empty State for Friends */}
                        {(!friend || friend.length === 0) && (
                            <View style={styles.emptyState}>
                                <Ionicons name="people-outline" size={48} color="#9ca3af" />
                                <Text style={styles.emptyStateText}>Chưa có bạn bè</Text>
                                <Text style={styles.emptyStateSubtext}>Bắt đầu kết nối với mọi người!</Text>
                            </View>
                        )}
                    </>
                ) : (
                    // Requests Tab Content
                    <>
                        {/* Received Friend Requests */}
                        {received && received.length > 0 && (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Lời mời đã nhận ({received.length})</Text>
                            </View>
                        )}
                        {received?.map((item) => (
                            <FriendRequestCard
                                key={item.id}
                                friendRequest={item}
                                onAccept={handleAcceptFriendRequest}
                                onReject={handleRejectFriendRequest}
                            />
                        ))}

                        {/* Pending Friend Requests */}
                        {pending && pending.length > 0 && (
                            <View style={styles.sectionHeader}>
                                <Text style={styles.sectionTitle}>Pending friend requests ({pending.length})</Text>
                            </View>
                        )}
                        {pending?.map((item) => (
                            <View key={item.id} style={styles.sentRequestCard}>
                                <FriendCard friend={item.receiver} />
                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    // onPress={() => handleCancelFriendRequest(item.id)}
                                    onPress={() => handleAcceptFriendRequest(item.id)}  
                                >
                                    <Ionicons name="checkmark" size={16} color="green" />
                                    <Text style={styles.cancelButtonText}>Đồng ý</Text>
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* Empty State for Requests */}
                        {(!received || received.length === 0) && (!pending || pending.length === 0) && (
                            <View style={styles.emptyState}>
                                <Ionicons name="person-add-outline" size={48} color="#9ca3af" />
                                <Text style={styles.emptyStateText}>Không có lời mời kết bạn</Text>
                                <Text style={styles.emptyStateSubtext}>Tất cả lời mời đã được xử lý!</Text>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        marginHorizontal: 20,
        marginTop: 20,
        marginBottom: 16,
        borderRadius: 16,
        padding: 4,
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    activeTab: {
        backgroundColor: '#8b5cf6',
        shadowColor: '#8b5cf6',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#9ca3af',
    },
    activeTabText: {
        color: '#ffffff',
        fontWeight: '600',
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
    searchContainer: {
        flexDirection: 'row',
        paddingHorizontal: 20,
        paddingVertical: 16,
        gap: 12,
    },
    searchBar: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        gap: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
        gap: 6,
    },
    filterButtonActive: {
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        borderColor: 'rgba(139, 92, 246, 0.3)',
    },
    filterText: {
        fontSize: 12,
        color: '#9ca3af',
        fontWeight: '500',
    },
    filterTextActive: {
        color: '#8b5cf6',
    },
    friendsList: {
        flex: 1,
        paddingHorizontal: 20,
    },
    friendCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    friendAvatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    friendAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
    },
    onlineIndicator: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#f8fafc',
    },
    friendInfo: {
        flex: 1,
    },
    friendHeader: {
        marginBottom: 4,
    },
    friendName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginBottom: 2,
    },
    friendUsername: {
        fontSize: 12,
        color: '#64748b',
    },
    friendDetails: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 4,
    },
    friendDetailItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    friendDetailText: {
        fontSize: 11,
        color: '#9ca3af',
    },
    lastSeen: {
        fontSize: 11,
        color: '#9ca3af',
        fontWeight: '500',
    },
    messageButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(139, 92, 246, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.2)',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyStateText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6b7280',
        marginTop: 16,
        marginBottom: 4,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: '#9ca3af',
    },
    sectionHeader: {
        marginTop: 20,
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1e293b',
    },
    friendRequestCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderRadius: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 1,
        borderColor: 'rgba(139, 92, 246, 0.1)',
    },
    friendRequestContent: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
    },
    actionButtons: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 16,
        gap: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(139, 92, 246, 0.1)',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        gap: 8,
    },
    acceptButton: {
        backgroundColor: '#10b981',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    rejectButton: {
        backgroundColor: '#dc2626',
        shadowColor: '#dc2626',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    acceptButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButtonText: {
        color: '#ffffff',
        fontSize: 14,
        fontWeight: '600',
    },
    sentRequestCard: {
        position: 'relative',
        marginBottom: 12,
    },
    cancelButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(38, 220, 93, 0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
        gap: 4,
    },
    cancelButtonText: {
        color: 'rgb(22, 104, 46)' ,
        fontSize: 12,
        fontWeight: '600',
    },
});
