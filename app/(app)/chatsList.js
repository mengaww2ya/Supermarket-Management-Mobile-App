import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  FlatList,
  Animated,
  ActivityIndicator,
  StatusBar,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs, onSnapshot, orderBy, limit, getDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { useAuth } from '../context/authContext';
import { blurhash, getRoomId } from '../utills/common';
import ChatList from '../components/ChatList';
import HomeHeader from '../components/HomeHeader';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';

const DEFAULT_PROFILE_IMAGE = require('../../assets/images/profile_demo.png');

export default function ChatsList() {
  const { userData } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [usersWithChatHistory, setUsersWithChatHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [recentChats, setRecentChats] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Fetch all users for search
  useEffect(() => {
    if (!userData?.uid) return;

    const fetchUsers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('uid', '!=', userData.uid)
        );
        
        const querySnapshot = await getDocs(q);
        const usersList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setUsers(usersList);
        
        // Start animation
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
        
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
    trackOnlineUsers();
    fetchChatsAndUsers();
  }, [userData?.uid]);

  // Fetch users with chat history (both those who messaged you and those you messaged)
  const fetchChatsAndUsers = async () => {
    if (!userData?.uid) return;
    
    try {
      console.log("[Chat Debug] Starting fetchChatsAndUsers for user:", userData.uid);
      
      // Get rooms where current user is a participant
      // Note: Until the index is created, this may fail
      let roomsQuery;
      try {
        roomsQuery = query(
          collection(db, 'rooms'),
          where('participants', 'array-contains', userData.uid),
          orderBy('lastActivity', 'desc')
        );
      } catch (indexError) {
        console.log("[Chat Debug] Index error with ordered rooms query:", indexError);
        // Fallback query without orderBy which doesn't require the composite index
        roomsQuery = query(
          collection(db, 'rooms'),
          where('participants', 'array-contains', userData.uid)
        );
      }
      
      // Also get messages directly as fallback
      const messagesQuery = query(
        collection(db, 'messages'),
        where('senderId', '==', userData.uid)
      );
      
      const receivedMessagesQuery = query(
        collection(db, 'messages'),
        where('receiverId', '==', userData.uid)
      );
      
      // Setup real-time listener for rooms
      const roomsUnsubscribe = onSnapshot(roomsQuery, 
        // Success handler
        async (snapshot) => {
          console.log('[Chat Debug] Rooms snapshot received with', snapshot.docs.length, 'rooms');
          await processRooms(snapshot);
        },
        // Error handler
        async (error) => {
          console.error('[Chat Debug] Error in rooms snapshot:', error);
          console.log('[Chat Debug] Please visit this URL to create the required index:');
          console.log('https://console.firebase.google.com/v1/r/project/queens-1f687/firestore/indexes?create_composite=Ckpwcm9qZWN0cy9xdWVlbnMtMWY2ODcvZGF0YWJhc2VzLyhkZWZhdWx0KS9jb2xsZWN0aW9uR3JvdXBzL3Jvb21zL2luZGV4ZXMvXxABGhAKDHBhcnRpY2lwYW50cxgBGhAKDGxhc3RBY3Rpdml0eRACGgwKCF9fbmFtZV9fEAI');
          
          // Fallback to just checking messages
          const messagesSnapshot = await getDocs(messagesQuery);
          await processDirectMessages(messagesSnapshot, 'sent');
          
          const receivedSnapshot = await getDocs(receivedMessagesQuery);
          await processDirectMessages(receivedSnapshot, 'received');
          
          setLoading(false);
        }
      );
      
      // Fallback - listen for direct messages if needed
      const messagesUnsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
        console.log('[Chat Debug] Sent messages snapshot received with', snapshot.docs.length, 'messages');
        
        // Only process messages if we don't have any rooms yet
        if (usersWithChatHistory.length === 0) {
          try {
            const roomsSnapshot = await getDocs(roomsQuery);
            
            if (roomsSnapshot.empty) {
              await processDirectMessages(snapshot, 'sent');
            }
          } catch (error) {
            // If rooms query fails, process messages anyway
            await processDirectMessages(snapshot, 'sent');
          }
        }
      });
      
      const receivedMessagesUnsubscribe = onSnapshot(receivedMessagesQuery, async (snapshot) => {
        console.log('[Chat Debug] Received messages snapshot received with', snapshot.docs.length, 'messages');
        
        // Only process messages if we don't have any rooms yet
        if (usersWithChatHistory.length === 0) {
          try {
            const roomsSnapshot = await getDocs(roomsQuery);
            
            if (roomsSnapshot.empty) {
              await processDirectMessages(snapshot, 'received');
            }
          } catch (error) {
            // If rooms query fails, process messages anyway
            await processDirectMessages(snapshot, 'received');
          }
        }
      });
      
      return () => {
        roomsUnsubscribe();
        messagesUnsubscribe();
        receivedMessagesUnsubscribe();
      };
    } catch (error) {
      console.error('[Chat Debug] Error in fetchChatsAndUsers:', error);
      setLoading(false);
    }
  };
  
  // Process rooms data
  const processRooms = async (roomsSnapshot) => {
    console.log('[Chat Debug] Processing rooms...');
    
    if (roomsSnapshot.empty) {
      console.log('[Chat Debug] No rooms found');
      setUsersWithChatHistory([]);
      setFilteredUsers([]);
      setLoading(false);
      return;
    }
    
    const chatData = [];
    const userIds = new Set();
    
    // Process each room
    for (const roomDoc of roomsSnapshot.docs) {
      const room = roomDoc.data();
      console.log('[Chat Debug] Processing room:', room.roomId);
      
      // Ensure participants exists and is an array
      if (!room.participants || !Array.isArray(room.participants)) {
        console.log('[Chat Debug] No valid participants array in room:', room.roomId);
        continue;
      }
      
      const otherUserId = room.participants.find(id => id !== userData.uid);
      
      if (otherUserId) {
        console.log('[Chat Debug] Found other user in room:', otherUserId);
        userIds.add(otherUserId);
        
        // Count unread messages
        let unreadCount = 0;
        
        // Get the user info from room data if available
        const userInfo = room.participantInfo?.[otherUserId] || {};
        
        chatData.push({
          roomId: room.roomId,
          otherUserId: otherUserId,
          lastMessage: room.lastMessage || { text: 'No messages yet', senderId: userData.uid },
          lastMessageTime: room.lastActivity || room.updatedAt || room.createdAt,
          unreadCount: unreadCount,
          userName: userInfo.name,
          userPhoto: userInfo.photo
        });
      }
    }
    
    // Get user details for all users with chat history
    const usersWithHistory = [];
    
    for (const chatItem of chatData) {
      try {
        // If we already have user info in the room, use it
        if (chatItem.userName && chatItem.userPhoto !== undefined) {
          usersWithHistory.push({
            uid: chatItem.otherUserId,
            fullName: chatItem.userName,
            photoURL: chatItem.userPhoto,
            roomId: chatItem.roomId,
            lastMessage: chatItem.lastMessage,
            lastMessageTime: chatItem.lastMessageTime,
            unreadCount: chatItem.unreadCount
          });
          continue;
        }
        
        // Otherwise fetch from users collection
        const userDoc = await getDoc(doc(db, 'users', chatItem.otherUserId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('[Chat Debug] Found user data for:', userData.fullName || userData.email || chatItem.otherUserId);
          
          usersWithHistory.push({
            ...userData,
            roomId: chatItem.roomId,
            lastMessage: chatItem.lastMessage,
            lastMessageTime: chatItem.lastMessageTime,
            unreadCount: chatItem.unreadCount
          });
        } else {
          console.log('[Chat Debug] User document does not exist for ID:', chatItem.otherUserId);
        }
      } catch (error) {
        console.error(`[Chat Debug] Error fetching user ${chatItem.otherUserId}:`, error);
      }
    }
    
    console.log('[Chat Debug] Final users with history count:', usersWithHistory.length);
    
    // Sort by most recent message
    usersWithHistory.sort((a, b) => {
      // Safely handle potentially missing lastMessageTime
      const timeA = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate() : 
                   (a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(0));
      const timeB = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate() : 
                   (b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(0));
      return timeB - timeA;
    });
    
    setUsersWithChatHistory(usersWithHistory);
    
    // Only update filtered users if not in search mode
    if (!searching) {
      setFilteredUsers(usersWithHistory.length > 0 ? usersWithHistory : users.slice(0, 10));
    }
    
    setLoading(false);
  };
  
  // Process direct messages as fallback
  const processDirectMessages = async (messagesSnapshot, type) => {
    console.log(`[Chat Debug] Processing ${type} messages as fallback...`);
    
    if (messagesSnapshot.empty) {
      console.log(`[Chat Debug] No ${type} messages found`);
      return;
    }
    
    const chatData = [];
    const userIds = new Set();
    
    // Get unique other users from messages
    for (const messageDoc of messagesSnapshot.docs) {
      const message = messageDoc.data();
      const otherUserId = type === 'sent' ? message.receiverId : message.senderId;
      
      if (otherUserId && !userIds.has(otherUserId)) {
        userIds.add(otherUserId);
        const roomId = message.roomId || getRoomId(userData.uid, otherUserId);
        
        // Check if we already have this user in our chat data
        const existingChat = chatData.find(chat => chat.otherUserId === otherUserId);
        
        if (existingChat) {
          // Update if this message is newer
          const existingTime = existingChat.lastMessageTime?.toDate?.() || existingChat.lastMessageTime || new Date(0);
          const messageTime = message.createdAt?.toDate?.() || message.createdAt || new Date(0);
          
          if (messageTime > existingTime) {
            existingChat.lastMessage = {
              text: message.text || 'New message',
              senderId: message.senderId,
              type: message.type || 'text'
            };
            existingChat.lastMessageTime = message.createdAt;
          }
        } else {
          // Add new chat
          chatData.push({
            roomId: roomId,
            otherUserId: otherUserId,
            lastMessage: {
              text: message.text || 'New message',
              senderId: message.senderId,
              type: message.type || 'text'
            },
            lastMessageTime: message.createdAt,
            unreadCount: type === 'received' && !message.read ? 1 : 0,
            // Use user info from message if available
            userName: type === 'sent' ? message.receiverName : message.senderName,
            userPhoto: type === 'sent' ? message.receiverPhoto : message.senderPhoto
          });
        }
      }
    }
    
    // Process and add users to chat history
    const currentUsers = [...usersWithChatHistory];
    let usersAdded = false;
    
    for (const chatItem of chatData) {
      // Skip if we already have this user
      if (currentUsers.some(u => u.uid === chatItem.otherUserId)) {
        continue;
      }
      
      try {
        // Use info from message if available
        if (chatItem.userName) {
          currentUsers.push({
            uid: chatItem.otherUserId,
            fullName: chatItem.userName,
            photoURL: chatItem.userPhoto,
            roomId: chatItem.roomId,
            lastMessage: chatItem.lastMessage,
            lastMessageTime: chatItem.lastMessageTime,
            unreadCount: chatItem.unreadCount
          });
          usersAdded = true;
          continue;
        }
        
        // Otherwise fetch from users collection
        const userDoc = await getDoc(doc(db, 'users', chatItem.otherUserId));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          currentUsers.push({
            ...userData,
            roomId: chatItem.roomId,
            lastMessage: chatItem.lastMessage,
            lastMessageTime: chatItem.lastMessageTime,
            unreadCount: chatItem.unreadCount
          });
          usersAdded = true;
        }
      } catch (error) {
        console.error(`[Chat Debug] Error processing message user ${chatItem.otherUserId}:`, error);
      }
    }
    
    if (usersAdded) {
      // Sort by most recent message
      currentUsers.sort((a, b) => {
        const timeA = a.lastMessageTime?.toDate ? a.lastMessageTime.toDate() : 
                    (a.lastMessageTime instanceof Date ? a.lastMessageTime : new Date(0));
        const timeB = b.lastMessageTime?.toDate ? b.lastMessageTime.toDate() : 
                    (b.lastMessageTime instanceof Date ? b.lastMessageTime : new Date(0));
        return timeB - timeA;
      });
      
      setUsersWithChatHistory(currentUsers);
      
      // Only update filtered users if not in search mode
      if (!searching) {
        setFilteredUsers(currentUsers.length > 0 ? currentUsers : users.slice(0, 10));
      }
    }
  };

  // Listen for user online status
  const trackOnlineUsers = () => {
    const q = query(collection(db, 'userStatus'));
    
    return onSnapshot(q, (snapshot) => {
      const onlineUsersData = {};
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        onlineUsersData[doc.id] = data.online;
      });
      
      setOnlineUsers(onlineUsersData);
    });
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      // When search is cleared, show only users with chat history
      setSearching(false);
      setFilteredUsers(usersWithChatHistory);
    } else {
      // When searching, search through all users
      setSearching(true);
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.fullName?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        (user.firstName && user.firstName.toLowerCase().includes(query)) ||
        (user.lastName && user.lastName.toLowerCase().includes(query))
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, usersWithChatHistory, users]);

  const handleSearch = (text) => {
    setSearchQuery(text);
  };

  const renderUserItem = ({ item }) => {
    // Check if this user has chat history
    const hasChatHistory = usersWithChatHistory.some(u => u.uid === item.uid);
    
    // Get unread count if this user has chat history
    let unreadCount = 0;
    let lastMessage = null;
    let lastMessageTime = null;
    
    if (hasChatHistory) {
      const chatUser = usersWithChatHistory.find(u => u.uid === item.uid);
      if (chatUser) {
        unreadCount = chatUser.unreadCount || 0;
        lastMessage = chatUser.lastMessage;
        lastMessageTime = chatUser.lastMessageTime;
      }
    }
    
    return (
      <TouchableOpacity
        className="flex-row items-center p-3 mb-2 bg-white rounded-xl"
        style={{ elevation: 1 }}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          router.push({
            pathname: '/(app)/chatRoom',
            params: item
          });
        }}
      >
        <View className="relative">
          <Image
            source={!item?.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item.photoURL }}
            style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
            placeholder={blurhash}
            transition={300}
            className="bg-gray-200"
          />
          {onlineUsers[item.uid] && (
            <View className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </View>
        
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-800 text-base">
              {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`}
            </Text>
            {lastMessageTime && (
              <Text className="text-xs text-gray-500">
                {new Date(lastMessageTime.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </View>
          
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {lastMessage?.text || 
              (hasChatHistory ? 'No messages yet' : 
              `${item.role === 'customer' ? 'Customer' : item.role === 'admin' ? 'Admin' : item.role || 'User'}`)}
            </Text>
            
            {unreadCount > 0 && (
              <View className="bg-blue-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const EmptyListComponent = () => (
    <View className="flex-1 justify-center items-center mt-10">
      <Ionicons name="chatbubble-ellipses-outline" size={80} color="#d1d5db" />
      <Text className="text-gray-400 text-lg mt-4">
        {searching ? "No users found" : "No conversations yet"}
      </Text>
      <Text className="text-gray-400 text-sm text-center mt-2 max-w-[250px]">
        {searching 
          ? `No results matching "${searchQuery}"` 
          : "Search for users to start a conversation"}
      </Text>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <HomeHeader title="Messages" />
      
      <Animated.View 
        className="flex-1 px-4"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {/* Search Bar */}
        <View className="flex-row items-center bg-white rounded-xl px-3 py-2 mb-4 shadow-sm border border-gray-100">
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search users..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Feather name="x" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
          </View>
        ) : (
          <>
            {searching && (
              <View className="mb-3 px-2">
                <Text className="text-sm text-gray-500">
                  Showing all users matching "{searchQuery}"
                </Text>
              </View>
            )}
            
            <FlatList
              data={filteredUsers}
              keyExtractor={(item) => item.uid}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ 
                paddingBottom: 20,
                flexGrow: filteredUsers.length === 0 ? 1 : undefined
              }}
              ListEmptyComponent={EmptyListComponent}
            />
          </>
        )}
      </Animated.View>
    </SafeAreaView>
  );
} 