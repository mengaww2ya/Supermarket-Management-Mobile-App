import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, 
  ActivityIndicator, Image, Alert, TextInput, Animated,
  Platform, RefreshControl
} from 'react-native';
import { Feather, Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth, db } from '../../../../firebase/firebaseConfig';
import { collection, query, where, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';

const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/profile_demo.png');

export default function MessagesScreen() {
  const [recentChats, setRecentChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredChats, setFilteredChats] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearchBar, setShowSearchBar] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const searchBarTranslateY = useRef(new Animated.Value(-60)).current;
  const currentUser = auth.currentUser;
  const insets = useSafeAreaInsets();

  // Animation on component mount
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

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredChats(recentChats);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = recentChats.filter(chat => {
        const name = chat.otherUser?.name?.toLowerCase() || '';
        const message = typeof chat.lastMessage === 'string' 
          ? chat.lastMessage.toLowerCase() 
          : '';
        return name.includes(query) || message.includes(query);
      });
      setFilteredChats(filtered);
    }
  }, [searchQuery, recentChats]);

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
          console.log("Error fetching user data for chat:", userErr);
        }
      }

      setRecentChats(chatsData);
      setFilteredChats(chatsData);
    } catch (err) {
      console.error('Error fetching recent chats:', err);
      setError('Failed to load your conversations. Pull down to try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleSearchBar = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback for when Haptics is not available
      }
    }
    
    setShowSearchBar(!showSearchBar);
    
    Animated.spring(searchBarTranslateY, {
      toValue: showSearchBar ? -60 : 0,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const openChat = (chatId, otherUser) => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback for when Haptics is not available
      }
    }
    
    router.push({
      pathname: '/chatRoom',
      params: { 
        uid: otherUser.id,
        name: otherUser.name
      }
    });
  };

  const formatMessageTime = (timestamp) => {
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
      console.log('Error formatting message time:', error);
      return '';
    }
  };

  const navigateToSystemChat = () => {
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback for when Haptics is not available
      }
    }
    
    router.push('/deliveryAgent/systemChat');
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchRecentChats();
  };

  const renderChatItem = ({ item, index }) => {
    if (!item || !item.otherUser) return null;
    
    const unreadCount = item.unreadCount || 0;
    
    // Safely extract otherUser
    const otherUser = {
      id: item.otherUser?.id || 'unknown',
      name: item.otherUser?.name || 'Unknown User',
      photoURL: item.otherUser?.photoURL || null,
      status: item.otherUser?.status || null
    };
    
    // Animation delay based on index
    const animationDelay = index * 100;
    
    // Create animated styles for staggered entrance
    const animatedStyle = {
      opacity: fadeAnim,
      transform: [{ translateY: Animated.add(translateY, new Animated.Value(-10 * index)) }]
    };
    
    // Safely convert lastMessage to a string
    const getLastMessage = () => {
      if (!item.lastMessage) return 'Start a conversation...';
      
      if (typeof item.lastMessage === 'string') {
        return item.lastMessage;
      }
      
      if (typeof item.lastMessage === 'object') {
        if (item.lastMessage.text && typeof item.lastMessage.text === 'string') {
          return item.lastMessage.text;
        }
        return 'New message';
      }
      
      return 'Start a conversation...';
    };
    
    return (
      <Animated.View style={[styles.chatItemContainer, animatedStyle]}>
        <TouchableOpacity
          style={styles.chatItem}
          onPress={() => openChat(item.id, otherUser)}
          activeOpacity={0.8}
        >
          <View style={styles.avatarContainer}>
            {otherUser.photoURL ? (
              <Image source={{ uri: otherUser.photoURL }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={['#6366f1', '#8b5cf6']}
                style={styles.avatar}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.avatarText}>
                  {otherUser.name ? otherUser.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </LinearGradient>
            )}
            {otherUser.status === 'online' && (
              <View style={styles.onlineIndicator} />
            )}
          </View>
          
          <View style={styles.chatDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, unreadCount > 0 && styles.unreadName]} numberOfLines={1}>
                {otherUser.name}
              </Text>
              <Text style={[styles.timeStamp, unreadCount > 0 && styles.unreadTime]}>
                {item.lastMessageTimestamp ? formatMessageTime(item.lastMessageTimestamp) : ''}
              </Text>
            </View>
            
            <View style={styles.messageRow}>
              <Text 
                style={[styles.lastMessage, unreadCount > 0 && styles.unreadMessage]} 
                numberOfLines={1}
              >
                {getLastMessage()}
              </Text>
              
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadCount}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={['#f3f4f6', '#e5e7eb']}
        style={styles.emptyImageContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Feather name="message-circle" size={80} color="#9ca3af" />
      </LinearGradient>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyText}>
        Use the 'All Users' button above to browse and message anyone in your organization.
      </Text>
      <TouchableOpacity 
        style={styles.emptyButton}
        onPress={navigateToSystemChat}
      >
        <LinearGradient
          colors={['#6366f1', '#4f46e5']}
          style={styles.gradientButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="users" size={16} color="white" style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Browse All Users</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );

  // Get all chats without filtering by tab
  const displayedChats = filteredChats;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      
      {/* Custom Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        
        <View style={styles.headerButtonsContainer}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={toggleSearchBar}
            activeOpacity={0.7}
          >
            <Feather name="search" size={22} color="#374151" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.allUsersButton}
            onPress={navigateToSystemChat}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                borderRadius: 20,
                paddingVertical: 8,
                paddingHorizontal: 12,
              }}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Feather name="users" size={18} color="white" />
              <Text style={styles.allUsersText}>All Users</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Animated Search Bar */}
      <Animated.View 
        style={[
          styles.searchBarContainer,
          { transform: [{ translateY: searchBarTranslateY }] }
        ]}
      >
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conversations..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoFocus={true}
          />
          <TouchableOpacity onPress={toggleSearchBar}>
            <Feather name="x" size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text style={styles.loadingText}>Loading conversations...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Feather name="alert-circle" size={32} color="#ef4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={fetchRecentChats}
          >
            <LinearGradient
              colors={['#6366f1', '#4f46e5']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Text style={styles.retryText}>Retry</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={displayedChats}
          renderItem={renderChatItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={displayedChats.length === 0 ? {flex: 1} : {paddingBottom: 20}}
          ListEmptyComponent={EmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#4f46e5"
              colors={['#4f46e5']}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
      
      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab}
        onPress={navigateToSystemChat}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#6366f1', '#4f46e5']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Feather name="edit-2" size={24} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#f3f4f6',
  },
  allUsersButton: {
    height: 36,
    borderRadius: 20,
    overflow: 'hidden',
  },
  allUsersText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  chatItemContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 16,
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    overflow: 'hidden',
  },
  chatItem: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 14,
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: 'white',
    bottom: 0,
    right: 0,
  },
  chatDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    flex: 1,
  },
  unreadName: {
    fontWeight: '700',
    color: '#111827',
  },
  timeStamp: {
    fontSize: 12,
    color: '#9ca3af',
    marginLeft: 10,
  },
  unreadTime: {
    color: '#6366f1',
    fontWeight: '600',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
    marginRight: 8,
  },
  unreadMessage: {
    color: '#4b5563',
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: '#4f46e5',
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCount: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  gradientButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
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
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  emptyButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center', 
    alignItems: 'center',
  },
}); 