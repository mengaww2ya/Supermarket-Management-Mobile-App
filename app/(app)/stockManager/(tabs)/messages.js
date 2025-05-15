import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Image,
  SafeAreaView, ActivityIndicator, Alert, RefreshControl, SectionList, Animated
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { auth, db } from '../../../../firebase/firebaseConfig';
import {
  collection, query, where, getDocs, orderBy, onSnapshot,
  doc, getDoc, serverTimestamp, updateDoc, setDoc, limit
} from 'firebase/firestore';
import * as Haptics from 'expo-haptics';

export default function Messages() {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const currentUser = auth.currentUser;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    fetchRecentChats();
  }, []);

  const fetchRecentChats = async () => {
    try {
      setLoading(true);
      
      // Get chats from the user document directly
      const userChatsRef = collection(db, 'users', currentUser.uid, 'chats');
      const q = query(
        userChatsRef,
        orderBy('lastMessageTimestamp', 'desc'),
        limit(20)
      );

      const querySnapshot = await getDocs(q);
      const chatsData = [];

      for (const chatDoc of querySnapshot.docs) {
        const chatData = chatDoc.data();
        const otherUserId = chatDoc.id; // The doc ID is the other user's ID
        
        try {
          // Get other user's data
          const userDocRef = doc(db, 'users', otherUserId);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Process lastMessage if it's an object
            let lastMessageText = chatData.lastMessage;
            if (typeof lastMessageText === 'object' && lastMessageText !== null) {
              if (lastMessageText.text && typeof lastMessageText.text === 'string') {
                lastMessageText = lastMessageText.text;
              } else {
                lastMessageText = 'New message';
              }
            }
            
            chatsData.push({
              id: chatDoc.id, // Using other user's ID as chat ID
              ...chatData,
              lastMessage: lastMessageText,
              otherUser: {
                id: otherUserId,
                name: userData.name || userData.fullName || userData.email || 'User',
                photoURL: userData.photoURL || null,
                role: userData.role || 'Unknown',
                status: userData.status || null
              },
              lastMessageTimestamp: chatData.lastMessageTimestamp,
              unreadCount: chatData.unreadCount || 0
            });
          }
        } catch (userErr) {
          console.error("Error fetching user data for chat:", userErr);
        }
      }

      setChats(chatsData);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
      setError('Failed to load your conversations. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRecentChats();
  };

  const navigateToChat = (chat) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/chatRoom",
      params: { 
        uid: chat.otherUser.id,
        name: chat.otherUser.name
      }
    });
  };

  const navigateToSystemChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push("/stockManager/systemChat");
  };

  const getTimeGroup = (timestamp) => {
    if (!timestamp) return 'Older';
    
    const now = new Date();
    const messageDate = timestamp.toDate();
    const diffInHours = (now - messageDate) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return 'Today';
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else if (diffInHours < 168) { // 7 days
      return 'This Week';
    } else if (diffInHours < 720) { // 30 days
      return 'This Month';
    } else {
      return 'Older';
    }
  };

  const groupChatsByTime = () => {
    const groups = {
      'Today': [],
      'Yesterday': [],
      'This Week': [],
      'This Month': [],
      'Older': []
    };

    chats.forEach(chat => {
      const group = getTimeGroup(chat.lastMessageTimestamp);
      groups[group].push(chat);
    });

    // Convert to array format for SectionList
    return Object.entries(groups)
      .filter(([_, chats]) => chats.length > 0)
      .map(([title, data]) => ({
        title,
        data
      }));
  };

  const renderChatItem = ({ item, index }) => {
    const getInitials = (name) => {
      const nameParts = name.split(' ');
      if (nameParts.length > 1) {
        return `${nameParts[0].charAt(0)}${nameParts[1].charAt(0)}`;
      }
      return name.charAt(0);
    };

    const getRoleColor = (role) => {
      switch (role) {
        case 'admin':
          return '#dc3545';
        case 'manager':
          return '#fd7e14';
        case 'customer':
          return '#20c997';
        case 'stockManager':
          return '#6f42c1';
        case 'customerAssistance':
          return '#0dcaf0';
        case 'deliveryAgent':
          return '#4F46E5';
        case 'supplier':
          return '#f59e0b';
        default:
          return '#6c757d';
      }
    };

    const getRoleLabel = (role) => {
      switch (role) {
        case 'admin':
          return 'Admin';
        case 'manager':
          return 'Manager';
        case 'customer':
          return 'Customer';
        case 'stockManager':
          return 'Stock Manager';
        case 'customerAssistance':
          return 'Support';
        case 'deliveryAgent':
          return 'Delivery';
        case 'supplier':
          return 'Supplier';
        default:
          return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
      }
    };

    const formatTime = (timestamp) => {
      if (!timestamp) return '';
      
      try {
        const messageDate = timestamp.toDate();
        const now = new Date();
        
        // Same day - show time
        if (messageDate.toDateString() === now.toDateString()) {
          return messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        
        // Within last 7 days - show day of week
        const diffDays = Math.floor((now - messageDate) / (1000 * 60 * 60 * 24));
        if (diffDays < 7) {
          return messageDate.toLocaleDateString([], { weekday: 'short' });
        }
        
        // Older - show date
        return messageDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } catch (error) {
        console.error('Error formatting message time:', error);
        return '';
      }
    };

    // Animation for staggered entrance
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: Animated.add(translateY, new Animated.Value(-10 * index)) }]
    };

    return (
      <Animated.View style={animatedStyle}>
        <TouchableOpacity 
          style={styles.chatItem}
          onPress={() => navigateToChat(item)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            {item.otherUser.photoURL ? (
              <Image 
                source={{ uri: item.otherUser.photoURL }} 
                style={styles.avatar}
              />
            ) : (
              <View style={[styles.avatar, styles.noAvatar]}>
                <Text style={styles.avatarText}>
                  {getInitials(item.otherUser.name)}
                </Text>
              </View>
            )}
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>
                  {item.unreadCount}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.chatInfo}>
            <View style={styles.nameContainer}>
              <Text style={styles.userName} numberOfLines={1}>
                {item.otherUser.name}
              </Text>
              <View style={[
                styles.roleBadge,
                { backgroundColor: `${getRoleColor(item.otherUser.role)}20` }
              ]}>
                <Text style={[
                  styles.roleText,
                  { color: getRoleColor(item.otherUser.role) }
                ]}>
                  {getRoleLabel(item.otherUser.role)}
                </Text>
              </View>
            </View>
            
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage || 'No messages yet'}
            </Text>
            
            {item.lastMessageTimestamp && (
              <Text style={styles.timeText}>
                {formatTime(item.lastMessageTimestamp)}
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderSectionHeader = ({ section: { title } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyImageContainer}>
        <Feather name="message-circle" size={80} color="#ccc" />
      </View>
      <Text style={styles.emptyTitle}>No messages yet</Text>
      <Text style={styles.emptyText}>
        Start a conversation with other users to see your messages here
      </Text>
      <TouchableOpacity 
        style={styles.startChatButton}
        onPress={navigateToSystemChat}
      >
        <Text style={styles.startChatText}>Start a Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity 
          style={styles.newChatButton}
          onPress={navigateToSystemChat}
        >
          <Feather name="plus" size={24} color="#4F46E5" />
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={styles.loadingText}>Loading messages...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={40} color="#dc3545" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRecentChats}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <SectionList
          sections={groupChatsByTime()}
          renderItem={renderChatItem}
          renderSectionHeader={renderSectionHeader}
          keyExtractor={(item) => item.id}
          contentContainerStyle={chats.length === 0 ? 
            {flex: 1} : 
            {paddingVertical: 10}
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e1e1',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#f3f4f6',
  },
  noAvatar: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4b5563',
  },
  unreadBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chatInfo: {
    flex: 1,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
    marginRight: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#4F46E5',
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyImageContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  startChatButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4F46E5',
    borderRadius: 25,
  },
  startChatText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  sectionHeader: {
    backgroundColor: '#f9f9f9',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    textTransform: 'uppercase',
  },
}); 