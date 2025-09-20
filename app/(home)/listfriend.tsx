import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

type Friend = {
    id: number;
    username: string;
    displayName: string;
    avatar?: string;
    isOnline: boolean;
    lastSeen?: string;
    mutualFriends?: number;
    location?: string;
};

const mockFriends: Friend[] = [
    {
        id: 1,
        username: 'alice_vo',
        displayName: 'Alice Võ',
        avatar: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg',
        isOnline: true,
        lastSeen: '2 phút trước',
        mutualFriends: 12,
        location: 'TP.HCM'
    },
    {
        id: 2,
        username: 'bob_nguyen',
        displayName: 'Bob Nguyễn',
        avatar: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg',
        isOnline: false,
        lastSeen: '1 giờ trước',
        mutualFriends: 8,
        location: 'Hà Nội'
    },
    {
        id: 3,
        username: 'charlie_tran',
        displayName: 'Charlie Trần',
        avatar: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg',
        isOnline: true,
        lastSeen: 'Đang hoạt động',
        mutualFriends: 15,
        location: 'Đà Nẵng'
    },
    {
        id: 4,
        username: 'diana_le',
        displayName: 'Diana Lê',
        avatar: 'https://jbagy.me/wp-content/uploads/2025/03/anh-avatar-vo-tri-meo-1.jpg',
        isOnline: false,
        lastSeen: '3 giờ trước',
        mutualFriends: 6,
        location: 'Cần Thơ'
    },
];

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
                        <Text style={styles.friendDetailText}>{friend.location}</Text>
                    </View>
                    <View style={styles.friendDetailItem}>
                        <Ionicons name="people-outline" size={12} color="#9ca3af" />
                        <Text style={styles.friendDetailText}>{friend.mutualFriends} bạn chung</Text>
                    </View>
                </View>

                <Text style={styles.lastSeen}>
                    {friend.isOnline ? 'Đang hoạt động' : friend.lastSeen}
                </Text>
            </View>

            <TouchableOpacity style={styles.messageButton}>
                <Ionicons name="chatbubble-outline" size={16} color="#8b5cf6" />
            </TouchableOpacity>
        </TouchableOpacity>
    );
};

export default function ListFriendScreen() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [filterOnline, setFilterOnline] = useState(false);

    const filteredFriends = mockFriends.filter(friend => {
        const matchesSearch = friend.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            friend.username.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = !filterOnline || friend.isOnline;
        return matchesSearch && matchesFilter;
    });

    const onlineCount = mockFriends.filter(friend => friend.isOnline).length;

    return (
        <View style={styles.container}>

            {/* Search and Filter */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Ionicons name="search-outline" size={16} color="#9ca3af" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm kiếm bạn bè..."
                        placeholderTextColor="#9ca3af"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                </View>

                <TouchableOpacity
                    style={[styles.filterButton, filterOnline && styles.filterButtonActive]}
                    onPress={() => setFilterOnline(!filterOnline)}
                >
                    <Ionicons name="radio-button-on" size={16} color={filterOnline ? "#8b5cf6" : "#9ca3af"} />
                    <Text style={[styles.filterText, filterOnline && styles.filterTextActive]}>
                        Chỉ online
                    </Text>
                </TouchableOpacity>
            </View>

            {/* Friends List */}
            <ScrollView style={styles.friendsList} showsVerticalScrollIndicator={false}>
                {filteredFriends.map((friend) => (
                    <FriendCard key={friend.id} friend={friend} />
                ))}

                {filteredFriends.length === 0 && (
                    <View style={styles.emptyState}>
                        <Ionicons name="people-outline" size={48} color="#d1d5db" />
                        <Text style={styles.emptyStateText}>Không tìm thấy bạn bè</Text>
                        <Text style={styles.emptyStateSubtext}>Thử thay đổi từ khóa tìm kiếm</Text>
                    </View>
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
});
