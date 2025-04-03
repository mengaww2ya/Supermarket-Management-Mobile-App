import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  Alert,
  Keyboard,
  ScrollView,
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Feather, Ionicons, MaterialIcons, AntDesign, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuth } from '../../context/authContext';
import { blurhash, getRoomId } from '../../utills/common';
import HomeHeader from '../../components/HomeHeader';

import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  getDoc,
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';

const DEFAULT_PROFILE_IMAGE = require('../../../assets/images/PrifileDemo.png');
const { width, height } = Dimensions.get('window');

export default function ManagerSystemChat() {
  const { userData } = useAuth();
  const router = useRouter();
  
  // User-related states
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeRole, setActiveRole] = useState('all');
  
  // Message-related states
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newMessage, setNewMessage] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [selectedUserForMessage, setSelectedUserForMessage] = useState(null);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  // Additional animation states
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const cardAnimations = useRef({}).current;
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRoleColor, setSelectedRoleColor] = useState('#4f46e5');
  
  // Filter modal state
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Role badge color function
  const getRoleBadgeColor = (role) => {
    switch(role) {
      case 'admin': return { bg: 'bg-red-100', text: 'text-red-800', gradient: ['#ffedea', '#ffcdc7'], icon: 'shield-crown' };
      case 'manager': return { bg: 'bg-purple-100', text: 'text-purple-800', gradient: ['#f3e8ff', '#e0c6ff'], icon: 'briefcase' };
      case 'supplier': return { bg: 'bg-amber-100', text: 'text-amber-800', gradient: ['#fef3c7', '#fde68a'], icon: 'truck-delivery' };
      case 'customer': return { bg: 'bg-green-100', text: 'text-green-800', gradient: ['#dcfce7', '#bbf7d0'], icon: 'account' };
      case 'customerAssistance': return { bg: 'bg-indigo-100', text: 'text-indigo-800', gradient: ['#e0e7ff', '#c7d2fe'], icon: 'headset' };
      case 'all': return { bg: 'bg-blue-100', text: 'text-blue-800', gradient: ['#dbeafe', '#bfdbfe'], icon: 'apps' };
      default: return { bg: 'bg-gray-100', text: 'text-gray-800', gradient: ['#f9fafb', '#f3f4f6'], icon: 'account' };
    }
  };

  // Fetch users on load
  useEffect(() => {
    if (!userData?.uid || userData?.role !== 'manager' && userData?.role !== 'admin') {
      Alert.alert('Access Denied', 'You do not have permission to access this feature.');
      router.back();
      return;
    }

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    fetchUsers();
  }, [userData?.uid]);

  // Search filter
  useEffect(() => {
    if (searchQuery.trim() === '') {
      if (activeRole === 'all') {
        setFilteredUsers(users);
      } else {
        setFilteredUsers(users.filter(user => user.role === activeRole));
      }
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = users.filter(user => {
        const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
        const matchesName = fullName.includes(query);
        const matchesEmail = (user.email || '').toLowerCase().includes(query);
        const matchesRole = activeRole === 'all' || user.role === activeRole;
        
        return (matchesName || matchesEmail) && matchesRole;
      });
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users, activeRole]);

  // Fetch all users
  const fetchUsers = async () => {
    if (!userData?.uid) return;
    
    try {
      setLoading(true);
      
      // Get all users except the current manager
      const usersQuery = query(
        collection(db, 'users'),
        where('uid', '!=', userData.uid)
      );
      
      const querySnapshot = await getDocs(usersQuery);
      const usersList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        uid: doc.id // Ensure uid exists for all users
      }));
      
      // Sort by online status (if available) and then by name
      usersList.sort((a, b) => {
        // Sort by online status first
        if (a.isOnline && !b.isOnline) return -1;
        if (!a.isOnline && b.isOnline) return 1;
        
        // Then by role
        const roleOrder = { 'admin': 1, 'manager': 2, 'supplier': 3, 'customer': 4, 'customerAssistance': 5 };
        const roleA = roleOrder[a.role] || 999;
        const roleB = roleOrder[b.role] || 999;
        if (roleA !== roleB) return roleA - roleB;
        
        // Then by name
        const nameA = `${a.firstName || ''} ${a.lastName || ''}`.toLowerCase();
        const nameB = `${b.firstName || ''} ${b.lastName || ''}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
      
      // Filter out employee role since we're removing that category
      const filteredList = usersList.filter(user => user.role !== 'employee');
      
      setUsers(filteredList);
      setFilteredUsers(filteredList);
      fetchExistingChats(filteredList);
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
      setLoading(false);
    }
  };

  // Fetch existing chat data
  const fetchExistingChats = async (usersList) => {
    if (!userData?.uid || !usersList?.length) return;
    
    try {
      // Look for chats in the manager's chats collection
      const userChatsQuery = query(
        collection(db, 'users', userData.uid, 'chats')
      );
      
      const chatSnapshot = await getDocs(userChatsQuery);
      
      // Process chat data
      const messages = {};
      const unread = {};
      
      for (const chatDoc of chatSnapshot.docs) {
        const chatData = chatDoc.data();
        const userId = chatDoc.id;
        
        // Find the user for this chat
        const user = usersList.find(u => u.uid === userId);
        if (user) {
          // Store last message
          if (chatData.lastMessage) {
            messages[userId] = chatData.lastMessage;
          }
          
          // Store unread count
          unread[userId] = chatData.unreadCount || 0;
        }
      }
      
      setLastMessages(messages);
      setUnreadCounts(unread);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching existing chats:', error);
      setLoading(false);
    }
  };

  // Send a new message
  const sendNewMessage = async () => {
    if (!userData?.uid || !selectedUserForMessage?.uid || !messageText.trim()) {
      Alert.alert('Missing Information', 'Please select a user and enter a message.');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create chat data
      const roomId = getRoomId(userData.uid, selectedUserForMessage.uid);
      
      // Prepare message data
      const messageData = {
        text: messageText.trim(),
        senderId: userData.uid,
        senderName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        senderPhoto: userData.photoURL || null,
        senderRole: userData.role || 'manager',
        receiverId: selectedUserForMessage.uid,
        receiverName: selectedUserForMessage.fullName || 
                     `${selectedUserForMessage.firstName || ''} ${selectedUserForMessage.lastName || ''}`,
        receiverPhoto: selectedUserForMessage.photoURL || null,
        receiverRole: selectedUserForMessage.role || 'user',
        createdAt: serverTimestamp(),
        read: false,
        type: 'text',
        systemMessage: false
      };
      
      // Batch write for consistency
      const batch = writeBatch(db);
      
      // 1. Add message to sender's collection
      const senderMessageRef = doc(collection(db, 'users', userData.uid, 'chats', 
                                selectedUserForMessage.uid, 'messages'));
      batch.set(senderMessageRef, messageData);
      
      // 2. Add message to recipient's collection
      const recipientMessageRef = doc(collection(db, 'users', selectedUserForMessage.uid, 
                                    'chats', userData.uid, 'messages'));
      batch.set(recipientMessageRef, messageData);
      
      // 3. Update sender's chat metadata
      const senderChatRef = doc(db, 'users', userData.uid, 'chats', selectedUserForMessage.uid);
      batch.set(senderChatRef, {
        participantId: selectedUserForMessage.uid,
        participantName: selectedUserForMessage.fullName || 
                        `${selectedUserForMessage.firstName || ''} ${selectedUserForMessage.lastName || ''}`,
        participantPhoto: selectedUserForMessage.photoURL || null,
        participantRole: selectedUserForMessage.role || 'user',
        lastMessage: {
          text: messageText.trim(),
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        lastRead: serverTimestamp()
      }, { merge: true });
      
      // 4. Update recipient's chat metadata
      const recipientChatRef = doc(db, 'users', selectedUserForMessage.uid, 'chats', userData.uid);
      batch.set(recipientChatRef, {
        participantId: userData.uid,
        participantName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        participantPhoto: userData.photoURL || null,
        participantRole: userData.role || 'manager',
        lastMessage: {
          text: messageText.trim(),
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        unreadCount: (unreadCounts[selectedUserForMessage.uid] || 0) + 1
      }, { merge: true });
      
      // Commit all changes
      await batch.commit();
      
      // Update local state
      const newLastMessages = { ...lastMessages };
      newLastMessages[selectedUserForMessage.uid] = {
        text: messageText.trim(),
        senderId: userData.uid,
        timestamp: { toDate: () => new Date() }
      };
      setLastMessages(newLastMessages);
      
      // Reset state
      setMessageText('');
      setNewMessage(false);
      setSelectedUserForMessage(null);
      
      // Give haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Message Sent', 'Your message has been sent successfully.');
      
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Open chat with user
  const openChat = (user) => {
    router.push({
      pathname: '/(app)/chatRoom',
      params: user
    });
  };

  // Set active role filter
  const handleRoleFilter = (role) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setActiveRole(role);
    setShowFilterModal(false);
  };

  // Compose new message
  const composeNewMessage = (user) => {
    setSelectedUserForMessage(user);
    setNewMessage(true);
  };

  // Enhanced render user item with animations
  const renderUserItem = ({ item, index }) => {
    // Initialize animation for this item if not exists
    if (!cardAnimations[item.uid]) {
      cardAnimations[item.uid] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(50)
      };
      
      // Staggered entrance animation
      Animated.sequence([
        Animated.delay(index * 50),
        Animated.parallel([
          Animated.timing(cardAnimations[item.uid].opacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true
          }),
          Animated.timing(cardAnimations[item.uid].translateY, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          })
        ])
      ]).start();
    }
    
    // Handle press animation
    const handlePressIn = () => {
      Animated.spring(cardAnimations[item.uid].scale, {
        toValue: 0.97,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
      
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    };
    
    const handlePressOut = () => {
      Animated.spring(cardAnimations[item.uid].scale, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true
      }).start();
    };
    
    // Check if this user has a chat with the manager
    const hasChat = lastMessages[item.uid] !== undefined;
    const lastMessage = lastMessages[item.uid];
    const unreadCount = unreadCounts[item.uid] || 0;
    
    // Format role for display
    const getRoleDisplay = (role) => {
      switch(role) {
        case 'admin': return 'Administrator';
        case 'manager': return 'Manager';
        case 'supplier': return 'Supplier';
        case 'customer': return 'Customer';
        case 'customerAssistance': return 'Customer Assistance';
        default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : 'User';
      }
    };
    
    const roleData = getRoleBadgeColor(item.role);
    
    // Format time
    const formatMessageTime = (timestamp) => {
      if (!timestamp?.toDate) return '';
      
      const date = timestamp.toDate();
      const now = new Date();
      const diff = (now - date) / 1000; // seconds
      
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      if (diff < 604800) { // 7 days
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return days[date.getDay()];
      }
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };
    
    return (
      <Animated.View
        style={{
          opacity: cardAnimations[item.uid].opacity,
          transform: [
            { translateY: cardAnimations[item.uid].translateY },
            { scale: cardAnimations[item.uid].scale }
          ]
        }}
      >
        <Pressable
          className="mb-3 rounded-xl overflow-hidden"
          onPress={() => openChat(item)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <LinearGradient
            colors={['#ffffff', '#f9fafb']}
            className="p-3 rounded-xl border border-gray-100 shadow-sm"
          >
            <View className="flex-row">
              {/* Avatar with online indicator */}
              <View className="relative">
                <Image
                  source={!item.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item.photoURL }}
                  style={{ height: hp(8), width: hp(8), borderRadius: 20 }}
                  placeholder={blurhash}
                  className="bg-gray-100"
                  contentFit="cover"
                  transition={300}
                />
                
                {/* Role icon badge */}
                <View className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-sm">
                  <LinearGradient
                    colors={roleData.gradient}
                    className="p-1 rounded-full"
                  >
                    <MaterialCommunityIcons name={roleData.icon} size={14} color={roleData.text.replace('text-', '').replace('-800', '')} />
                  </LinearGradient>
                </View>
                
                {/* Online status */}
                {item.isOnline && (
                  <View className="absolute top-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white" />
                )}
              </View>
              
              {/* User info */}
              <View className="ml-3 flex-1 justify-center">
                <View className="flex-row justify-between items-center">
                  <Text className="font-bold text-gray-800 text-base" numberOfLines={1}>
                    {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`}
                  </Text>
                  
                  {hasChat && lastMessage?.timestamp && (
                    <Text className="text-xs text-gray-500">
                      {formatMessageTime(lastMessage.timestamp)}
                    </Text>
                  )}
                </View>
                
                <View className="flex-row items-center mt-0.5">
                  <LinearGradient
                    colors={roleData.gradient}
                    className="px-2 py-1 rounded-full"
                  >
                    <Text className={`text-xs font-medium ${roleData.text}`}>
                      {getRoleDisplay(item.role)}
                    </Text>
                  </LinearGradient>
                  
                  {item.companyName && (
                    <Text className="text-xs text-gray-500 ml-2" numberOfLines={1}>
                      {item.companyName}
                    </Text>
                  )}
                </View>
                
                {/* Message preview */}
                <View className="flex-row justify-between items-center mt-1">
                  <Text className="text-gray-500 text-sm flex-1" numberOfLines={1}>
                    {hasChat 
                      ? (lastMessage.senderId === userData.uid ? 'You: ' : '') + lastMessage.text 
                      : (item.email || '')}
                  </Text>
                  
                  {/* Action buttons */}
                  <View className="flex-row">
                    {/* Unread count */}
                    {unreadCount > 0 && (
                      <View className="bg-blue-500 rounded-full h-6 min-w-[24px] items-center justify-center mr-2">
                        <Text className="text-white text-xs font-bold">{unreadCount}</Text>
                      </View>
                    )}
                    
                    <TouchableOpacity
                      className="bg-blue-50 p-1.5 rounded-full"
                      onPress={() => composeNewMessage(item)}
                    >
                      <Feather name="edit" size={16} color="#4f46e5" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  // Enhanced empty state
  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center p-6">
      <View className="bg-gray-50 p-8 rounded-full mb-4">
        <MaterialIcons name="people-outline" size={80} color="#d1d5db" />
      </View>
      <Text className="text-gray-700 text-lg font-semibold mb-2 text-center">
        No Users Found
      </Text>
      <Text className="text-gray-500 text-base text-center mb-8">
        {searchQuery.trim() !== '' 
          ? 'No users match your search criteria. Try a different search term.' 
          : 'There are no users available for chat at the moment.'}
      </Text>
      <TouchableOpacity
        className="bg-blue-500 py-3 px-6 rounded-full shadow-md"
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }
          fetchUsers();
        }}
      >
        <Text className="text-white font-semibold">Refresh</Text>
      </TouchableOpacity>
    </View>
  );

  // Enhanced search bar component with filter button
  const SearchBar = () => (
    <View className="px-4 py-3 bg-white border-b border-gray-100">
      <View className="flex-row items-center bg-gray-100 px-4 py-3 rounded-xl">
        <Feather name="search" size={20} color="#9ca3af" />
        <TextInput
          className="flex-1 ml-2 text-gray-800"
          placeholder="Search users by name, email or role..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholderTextColor="#9ca3af"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => {
              setSearchQuery('');
              if (Platform.OS === 'ios') {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
            }}
            className="bg-gray-200 rounded-full p-1 mr-2"
          >
            <Feather name="x" size={16} color="#4b5563" />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => {
            setShowFilterModal(true);
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
          className={`p-1 rounded-full ${activeRole !== 'all' ? 'bg-blue-500' : 'bg-gray-300'}`}
        >
          <Feather 
            name="filter" 
            size={18} 
            color={activeRole !== 'all' ? "#ffffff" : "#4b5563"} 
          />
        </TouchableOpacity>
      </View>
      {activeRole !== 'all' && (
        <View className="mt-2 flex-row items-center">
          <Text className="text-xs text-gray-500 mr-2">
            Filtered by:
          </Text>
          <View className="flex-row">
            <Pressable 
              className={`flex-row items-center mr-2 px-2 py-1 rounded-full ${getRoleBadgeColor(activeRole).bg}`}
            >
              <Text className={`text-xs font-medium ${getRoleBadgeColor(activeRole).text}`}>
                {activeRole === 'customerAssistance' ? 'Support' : 
                 activeRole.charAt(0).toUpperCase() + activeRole.slice(1)}
              </Text>
              <TouchableOpacity
                onPress={() => handleRoleFilter('all')}
                className="ml-1"
              >
                <Feather name="x" size={12} color="#4b5563" />
              </TouchableOpacity>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );

  // Filter modal for role selection
  const FilterModal = () => (
    <Modal
      visible={showFilterModal}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <Pressable 
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} 
        onPress={() => setShowFilterModal(false)}
      >
        <Pressable 
          className="bg-white mx-4 my-auto rounded-xl overflow-hidden"
          onPress={(e) => e.stopPropagation()}
        >
          <View className="border-b border-gray-200 p-4">
            <Text className="text-lg font-semibold text-gray-800 text-center">
              Filter by Role
            </Text>
          </View>
          
          <View className="p-4">
            {[
              { id: 'all', title: 'All Users', icon: 'users' },
              { id: 'admin', title: 'Administrators', icon: 'shield' },
              { id: 'manager', title: 'Managers', icon: 'briefcase' },
              { id: 'customerAssistance', title: 'Support Staff', icon: 'headphones' },
              { id: 'supplier', title: 'Suppliers', icon: 'truck' },
              { id: 'customer', title: 'Customers', icon: 'user' }
            ].map(item => (
              <TouchableOpacity 
                key={item.id}
                className={`flex-row items-center p-3 rounded-lg mb-2 ${activeRole === item.id ? 'bg-blue-50 border border-blue-200' : ''}`}
                onPress={() => handleRoleFilter(item.id)}
              >
                <View className={`p-2 rounded-full ${getRoleBadgeColor(item.id).bg}`}>
                  <Feather name={item.icon} size={16} color={activeRole === item.id ? '#4f46e5' : '#6b7280'} />
                </View>
                <Text className={`ml-3 font-medium ${activeRole === item.id ? 'text-blue-700' : 'text-gray-700'}`}>
                  {item.title}
                </Text>
                <Text className="ml-auto text-xs text-gray-500">
                  {item.id === 'all' 
                    ? users.length 
                    : users.filter(u => u.role === item.id).length}
                </Text>
                {activeRole === item.id && (
                  <Feather name="check" size={18} color="#4f46e5" className="ml-2" />
                )}
              </TouchableOpacity>
            ))}
          </View>
          
          <View className="p-4 border-t border-gray-200">
            <TouchableOpacity
              className="bg-gray-100 py-3 rounded-lg"
              onPress={() => setShowFilterModal(false)}
            >
              <Text className="text-center font-medium text-gray-700">Close</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Custom Header with more visible navigation */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <TouchableOpacity 
          className="bg-gray-100 p-2 rounded-lg flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={22} color="#374151" />
          <Text className="text-gray-700 font-medium ml-1">Back</Text>
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">Messaging</Text>
        
        <TouchableOpacity 
          className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
          onPress={() => router.push('/manager/(tabs)/messages')}
        >
          <Feather name="message-circle" size={18} color="white" />
          <Text className="text-white font-medium ml-1">Messages</Text>
        </TouchableOpacity>
      </View>
      
      {/* Search Bar */}
      <SearchBar />
      
      {/* Filter Modal */}
      <FilterModal />
      
      {/* Main Content */}
      <Animated.View
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-gray-500 mt-4">Loading users...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => `user_${item.uid || item.id}`}
            renderItem={renderUserItem}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={renderEmptyList}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}
      </Animated.View>
      
      {/* FAB for new message */}
      <Animated.View
        style={{
          position: 'absolute',
          right: 20,
          bottom: 20,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <TouchableOpacity
          className="bg-gradient-to-r from-blue-500 to-indigo-600 w-16 h-16 rounded-full justify-center items-center shadow-lg"
          onPress={() => {
            setNewMessage(true);
            // Pulse animation
            Animated.sequence([
              Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 100,
                useNativeDriver: true
              }),
              Animated.timing(scaleAnim, {
                toValue: 0.95,
                duration: 100,
                useNativeDriver: true
              })
            ]).start();
            
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
          }}
        >
          <Feather name="edit-2" size={26} color="white" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* New Message Modal with enhanced design */}
      <Modal
        visible={newMessage}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setNewMessage(false);
          setSelectedUserForMessage(null);
          setMessageText('');
        }}
      >
        <Pressable 
          className="flex-1 bg-black/30"
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View className="flex-1 justify-end">
            <Pressable 
              className="bg-white rounded-t-3xl p-5 shadow-lg"
              onPress={e => e.stopPropagation()}
              style={{
                shadowColor: "#000",
                shadowOffset: {
                  width: 0,
                  height: -3,
                },
                shadowOpacity: 0.1,
                shadowRadius: 5.00,
                elevation: 10
              }}
            >
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
              
              <Text className="text-2xl font-bold text-gray-800 mb-2">New Message</Text>
              <Text className="text-gray-500 mb-6">Connect with anyone in your organization</Text>
              
              {selectedUserForMessage ? (
                <Animated.View 
                  className="mb-6"
                  entering={selectedUserForMessage ? Animated.FadeInDown : undefined}
                >
                  <Text className="text-gray-700 font-medium mb-2">Recipient</Text>
                  <View className="flex-row items-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <Image
                      source={!selectedUserForMessage.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: selectedUserForMessage.photoURL }}
                      style={{ height: hp(7), width: hp(7), borderRadius: 16 }}
                      placeholder={blurhash}
                      className="bg-gray-200"
                      contentFit="cover"
                    />
                    <View className="ml-3 flex-1">
                      <Text className="font-bold text-gray-800">
                        {selectedUserForMessage.fullName || 
                        `${selectedUserForMessage.firstName || ''} ${selectedUserForMessage.lastName || ''}`}
                      </Text>
                      <Text className="text-gray-500">
                        {selectedUserForMessage.role ? 
                          selectedUserForMessage.role.charAt(0).toUpperCase() + selectedUserForMessage.role.slice(1) : 
                          'User'
                        }
                        {selectedUserForMessage.email ? ` • ${selectedUserForMessage.email}` : ''}
                      </Text>
                    </View>
                    <TouchableOpacity 
                      className="bg-gray-200 p-2 rounded-full" 
                      onPress={() => {
                        setSelectedUserForMessage(null);
                        if (Platform.OS === 'ios') {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <AntDesign name="close" size={20} color="#6b7280" />
                    </TouchableOpacity>
                  </View>
                </Animated.View>
              ) : (
                <View className="mb-6">
                  <Text className="text-gray-700 font-medium mb-2">Recipient</Text>
                  <TouchableOpacity 
                    className="flex-row items-center bg-blue-50 p-4 rounded-xl border border-blue-100"
                    onPress={() => {
                      setNewMessage(false);
                      if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }
                    }}
                  >
                    <View className="bg-blue-100 p-3 rounded-xl mr-3">
                      <Feather name="user" size={22} color="#3b82f6" />
                    </View>
                    <Text className="text-blue-700 font-medium">Select a user from the list</Text>
                    <Feather name="chevron-right" size={20} color="#3b82f6" className="ml-auto" />
                  </TouchableOpacity>
                </View>
              )}
              
              <Text className="text-gray-700 font-medium mb-2">Message</Text>
              <View className="bg-gray-50 rounded-xl border border-gray-100 p-1 mb-6">
                <TextInput
                  className="p-3 text-gray-800 min-h-[120px] rounded-lg"
                  placeholder="Type your message here..."
                  value={messageText}
                  onChangeText={setMessageText}
                  multiline
                  textAlignVertical="top"
                  placeholderTextColor="#9ca3af"
                />
                
                {/* Quick templates */}
                {!messageText && (
                  <View className="p-2">
                    <Text className="text-xs text-gray-500 mb-2">Quick templates:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                      <TouchableOpacity 
                        className="bg-gray-200 py-1 px-3 rounded-full mr-2"
                        onPress={() => {
                          setMessageText("Hello! I wanted to check in about...");
                          if (Platform.OS === 'ios') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <Text className="text-gray-700">👋 Hello</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-gray-200 py-1 px-3 rounded-full mr-2"
                        onPress={() => {
                          setMessageText("Could we schedule a quick meeting to discuss...");
                          if (Platform.OS === 'ios') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <Text className="text-gray-700">📅 Meeting request</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        className="bg-gray-200 py-1 px-3 rounded-full mr-2"
                        onPress={() => {
                          setMessageText("Thank you for your assistance with...");
                          if (Platform.OS === 'ios') {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          }
                        }}
                      >
                        <Text className="text-gray-700">🙏 Thank you</Text>
                      </TouchableOpacity>
                    </ScrollView>
                  </View>
                )}
              </View>
              
              <TouchableOpacity
                className={`py-4 rounded-xl mb-3 ${
                  selectedUserForMessage && messageText.trim() 
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600' 
                  : 'bg-gray-300'
                }`}
                onPress={() => {
                  if (selectedUserForMessage && messageText.trim()) {
                    if (Platform.OS === 'ios') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    sendNewMessage();
                  } else {
                    if (Platform.OS === 'ios') {
                      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    }
                    if (!selectedUserForMessage) {
                      Alert.alert('Missing Recipient', 'Please select a user to send your message to.');
                    } else if (!messageText.trim()) {
                      Alert.alert('Empty Message', 'Please enter a message to send.');
                    }
                  }
                }}
                disabled={!selectedUserForMessage || !messageText.trim() || loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-center">Send Message</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="py-3"
                onPress={() => {
                  setNewMessage(false);
                  setSelectedUserForMessage(null);
                  setMessageText('');
                  if (Platform.OS === 'ios') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
              >
                <Text className="text-gray-500 font-medium text-center">Cancel</Text>
              </TouchableOpacity>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
} 