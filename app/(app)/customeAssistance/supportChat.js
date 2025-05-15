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
  Platform,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  getDoc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../../firebase/firebaseConfig';
import { useAuth } from '../../context/authContext';
import { blurhash, getRoomId } from '../../utills/common';
import HomeHeader from '../../components/HomeHeader';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';

const DEFAULT_PROFILE_IMAGE = require('../../../assets/images/profile_demo.png');

// Predefined support responses
const QUICK_RESPONSES = [
  { id: 1, text: "Hello! How can I help you today?" },
  { id: 2, text: "I'm looking into your issue right now." },
  { id: 3, text: "Could you please provide more details?" },
  { id: 4, text: "Thank you for your patience." },
  { id: 5, text: "I'll transfer this to our specialized team." },
  { id: 6, text: "Is there anything else I can help with?" }
];

// Support agent statuses
const AGENT_STATUSES = [
  { id: 'online', label: 'Online', color: '#10b981' },
  { id: 'busy', label: 'Busy', color: '#f59e0b' },
  { id: 'offline', label: 'Offline', color: '#6b7280' }
];

export default function SupportChat() {
  const { userData } = useAuth();
  const router = useRouter();
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [pendingChats, setPendingChats] = useState([]);
  const [resolvedChats, setResolvedChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [agentStatus, setAgentStatus] = useState('online');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTab, setSelectedTab] = useState('active');
  const [userDetailModal, setUserDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Fetch customer data
  useEffect(() => {
    if (!userData?.uid) return;

    // Update agent status on load
    updateAgentStatus(agentStatus);

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

    // Fetch all customers
    const fetchCustomers = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', '==', 'customer')
        );
        
        const querySnapshot = await getDocs(q);
        const customersList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setCustomers(customersList);
        setFilteredCustomers(customersList);
        
        // Fetch chat rooms for these customers
        fetchChatRooms(customersList);
        
      } catch (error) {
        console.error('Error fetching customers:', error);
      }
    };

    fetchCustomers();
  }, [userData?.uid]);

  // Fetch chat rooms and categorize them
  const fetchChatRooms = async (customersList) => {
    if (!userData?.uid || !customersList?.length) return;
    
    try {
      // Look for chats in the agent's chats collection
      const userChatsQuery = query(
        collection(db, 'users', userData.uid, 'chats')
      );
      
      const unsubscribe = onSnapshot(userChatsQuery, (snapshot) => {
        const active = [];
        const pending = [];
        const resolved = [];
        const messages = {};
        const unread = {};
        
        snapshot.docs.forEach(doc => {
          const chatData = doc.data();
          const customerId = doc.id;
          
          // Get the customer for this chat
          const customer = customersList.find(c => c.uid === customerId);
          
          if (customer) {
            // Store last message
            if (chatData.lastMessage) {
              messages[customer.uid] = chatData.lastMessage;
            }
            
            // Store unread count
            unread[customer.uid] = chatData.unreadCount || 0;
            
            const chatInfo = {
              ...customer,
              roomId: getRoomId(userData.uid, customerId),
              lastMessageTime: chatData.updatedAt,
              lastMessage: chatData.lastMessage
            };
            
            // Categorize based on status
            if (chatData.status === 'resolved') {
              resolved.push(chatInfo);
            } else if (chatData.status === 'pending') {
              pending.push(chatInfo);
            } else {
              active.push(chatInfo);
            }
          }
        });
        
        // Sort by last message time
        const sortByTime = (a, b) => {
          const timeA = a.lastMessageTime?.toDate?.() || a.lastMessageTime || new Date(0);
          const timeB = b.lastMessageTime?.toDate?.() || b.lastMessageTime || new Date(0);
          return timeB - timeA;
        };
        
        setActiveChats(active.sort(sortByTime));
        setPendingChats(pending.sort(sortByTime));
        setResolvedChats(resolved.sort(sortByTime));
        setLastMessages(messages);
        setUnreadCounts(unread);
        setLoading(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Error fetching chat rooms:', error);
      setLoading(false);
    }
  };

  // Update agent status
  const updateAgentStatus = async (status) => {
    if (!userData?.uid) return;
    
    try {
      const userRef = doc(db, 'users', userData.uid);
      await updateDoc(userRef, {
        supportStatus: status,
        lastStatusUpdate: serverTimestamp()
      });
      
      setAgentStatus(status);
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = customers.filter(customer => 
        customer.fullName?.toLowerCase().includes(query) ||
        customer.email?.toLowerCase().includes(query) ||
        customer.phone?.includes(query)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  // Start a new chat with a customer
  const startChat = async (customer) => {
    if (!userData?.uid || !customer?.uid) return;
    
    try {
      // Create or ensure chat documentation exists in both users' collections
      const roomId = getRoomId(userData.uid, customer.uid);
      
      // Check if chat already exists in agent's collection
      const chatRef = doc(db, 'users', userData.uid, 'chats', customer.uid);
      const chatDoc = await getDoc(chatRef);
      
      if (!chatDoc.exists()) {
        // Create new chat metadata for both users
        const timestamp = serverTimestamp();
        
        // Create for agent
        await setDoc(chatRef, {
          participantId: customer.uid,
          participantName: customer.fullName || `${customer.firstName || ''} ${customer.lastName || ''}`,
          participantPhoto: customer.photoURL || null,
          updatedAt: timestamp,
          status: 'active',
          unreadCount: 0
        });
        
        // Create for customer
        const customerChatRef = doc(db, 'users', customer.uid, 'chats', userData.uid);
        await setDoc(customerChatRef, {
          participantId: userData.uid,
          participantName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
          participantPhoto: userData.photoURL || null,
          updatedAt: timestamp,
          status: 'active',
          unreadCount: 0
        });
      } else if (chatDoc.data().status === 'resolved') {
        // Reactivate resolved chat on both sides
        await updateDoc(chatRef, {
          status: 'active',
          reopenedAt: serverTimestamp()
        });
        
        const customerChatRef = doc(db, 'users', customer.uid, 'chats', userData.uid);
        await updateDoc(customerChatRef, {
          status: 'active',
          reopenedAt: serverTimestamp()
        });
      }
      
      // Navigate to chat room
      router.push({
        pathname: '/(app)/chatRoom',
        params: customer
      });
    } catch (error) {
      console.error('Error starting chat:', error);
    }
  };

  // Update chat status
  const updateChatStatus = async (customer, status) => {
    if (!customer?.uid) return;
    
    try {
      // Update status in both collections
      const agentChatRef = doc(db, 'users', userData.uid, 'chats', customer.uid);
      await updateDoc(agentChatRef, {
        status: status,
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: userData.uid
      });
      
      const customerChatRef = doc(db, 'users', customer.uid, 'chats', userData.uid);
      await updateDoc(customerChatRef, {
        status: status,
        statusUpdatedAt: serverTimestamp(),
        statusUpdatedBy: userData.uid
      });
      
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error(`Error updating chat to ${status}:`, error);
    }
  };

  // View user details
  const viewUserDetails = (user) => {
    setSelectedUser(user);
    setUserDetailModal(true);
  };

  // Render customer item
  const renderCustomerItem = ({ item }) => {
    const hasActiveChat = activeChats.some(chat => chat.uid === item.uid);
    const hasPendingChat = pendingChats.some(chat => chat.uid === item.uid);
    const hasResolvedChat = resolvedChats.some(chat => chat.uid === item.uid);
    const hasChat = hasActiveChat || hasPendingChat || hasResolvedChat;
    
    // Get chat status for UI
    let statusColor = '#6b7280';
    let statusLabel = 'No Chat';
    
    if (hasActiveChat) {
      statusColor = '#10b981';
      statusLabel = 'Active';
    } else if (hasPendingChat) {
      statusColor = '#f59e0b';
      statusLabel = 'Pending';
    } else if (hasResolvedChat) {
      statusColor = '#6b7280';
      statusLabel = 'Resolved';
    }
    
    // Get last message if exists
    const lastMessage = lastMessages[item.uid];
    const unreadCount = unreadCounts[item.uid] || 0;
    
    return (
      <TouchableOpacity
        className="flex-row items-center p-3 mb-2 bg-white rounded-xl shadow-sm"
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          startChat(item);
        }}
        onLongPress={() => viewUserDetails(item)}
        delayLongPress={300}
      >
        {/* Profile Image */}
        <Image
          source={!item?.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item.photoURL }}
          style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
          placeholder={blurhash}
          transition={300}
          className="bg-gray-200"
        />
        
        {/* Middle Content */}
        <View className="flex-1 ml-3">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-800 text-base">
              {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`}
            </Text>
            
            {/* Status indicator */}
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-1"
                style={{ backgroundColor: statusColor }}
              />
              <Text className="text-xs text-gray-500">{statusLabel}</Text>
            </View>
          </View>
          
          {/* Last message or contact info */}
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {lastMessage 
                ? (lastMessage.senderId === userData.uid ? 'You: ' : '') + lastMessage.text 
                : (item.email || item.phone || 'Customer')}
            </Text>
            
            {/* Unread count */}
            {unreadCount > 0 && (
              <View className="bg-blue-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
                <Text className="text-white text-xs font-bold">{unreadCount}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Action buttons */}
        <View className="ml-2">
          <TouchableOpacity 
            className="p-2"
            onPress={() => viewUserDetails(item)}
          >
            <Ionicons name="information-circle-outline" size={22} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Get current tab data
  const getCurrentTabData = () => {
    switch (selectedTab) {
      case 'active':
        return activeChats;
      case 'pending':
        return pendingChats;
      case 'resolved':
        return resolvedChats;
      case 'all':
        return filteredCustomers;
      default:
        return activeChats;
    }
  };

  // Render empty list state
  const EmptyListComponent = () => {
    let message = "No customers found";
    let subMessage = "There are no customers matching your search";
    
    switch (selectedTab) {
      case 'active':
        message = "No active chats";
        subMessage = "You don't have any ongoing conversations";
        break;
      case 'pending':
        message = "No pending chats";
        subMessage = "You don't have any pending conversations";
        break;
      case 'resolved':
        message = "No resolved chats";
        subMessage = "You haven't resolved any conversations yet";
        break;
    }
    
    return (
      <View className="flex-1 justify-center items-center mt-10">
        <Ionicons name="chatbubble-ellipses-outline" size={80} color="#d1d5db" />
        <Text className="text-gray-400 text-lg mt-4">{message}</Text>
        <Text className="text-gray-400 text-sm text-center mt-2 max-w-[250px]">
          {searchQuery ? `No results matching "${searchQuery}"` : subMessage}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      <HomeHeader title="Customer Support" />
      
      {/* Agent Status Bar */}
      <View className="flex-row justify-between items-center px-4 py-2 bg-white border-b border-gray-200">
        <View className="flex-row items-center">
          <Text className="text-gray-700 mr-2">Status:</Text>
          <TouchableOpacity 
            className="flex-row items-center"
            onPress={() => setShowStatusModal(true)}
          >
            <View 
              className="w-2.5 h-2.5 rounded-full mr-1.5"
              style={{ backgroundColor: AGENT_STATUSES.find(s => s.id === agentStatus)?.color }}
            />
            <Text className="text-gray-800 font-medium">
              {AGENT_STATUSES.find(s => s.id === agentStatus)?.label}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#374151" />
          </TouchableOpacity>
        </View>
        
        <View className="flex-row items-center">
          <View className="bg-blue-50 px-2 py-1 rounded-lg flex-row items-center mr-2">
            <Ionicons name="chatbubble" size={14} color="#3b82f6" />
            <Text className="text-blue-600 text-xs font-medium ml-1">
              {activeChats.length} Active
            </Text>
          </View>
          
          <View className="bg-amber-50 px-2 py-1 rounded-lg flex-row items-center">
            <Ionicons name="time" size={14} color="#f59e0b" />
            <Text className="text-amber-600 text-xs font-medium ml-1">
              {pendingChats.length} Pending
            </Text>
          </View>
        </View>
      </View>
      
      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {/* Tabs */}
        <View className="flex-row px-4 py-2">
          {[
            { id: 'active', label: 'Active', icon: 'chatbubble' },
            { id: 'pending', label: 'Pending', icon: 'time' },
            { id: 'resolved', label: 'Resolved', icon: 'checkmark-circle' },
            { id: 'all', label: 'All Customers', icon: 'people' }
          ].map(tab => (
            <TouchableOpacity
              key={tab.id}
              className={`flex-1 items-center py-2 ${
                selectedTab === tab.id 
                  ? 'border-b-2 border-blue-600' 
                  : 'border-b border-gray-200'
              }`}
              onPress={() => setSelectedTab(tab.id)}
            >
              <View className="flex-row items-center">
                <Ionicons 
                  name={tab.icon} 
                  size={16} 
                  color={selectedTab === tab.id ? '#2563eb' : '#6b7280'} 
                />
                <Text 
                  className={`ml-1 text-xs font-medium ${
                    selectedTab === tab.id ? 'text-blue-600' : 'text-gray-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
        
        {/* Search Bar */}
        <View className="flex-row items-center bg-white mx-4 rounded-xl px-3 py-2 mb-3 shadow-sm border border-gray-100">
          <Feather name="search" size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder={`Search ${selectedTab === 'all' ? 'customers' : 'chats'}...`}
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
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
          <FlatList
            data={getCurrentTabData()}
            keyExtractor={(item) => item.uid}
            renderItem={renderCustomerItem}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              paddingHorizontal: 16,
              paddingBottom: 20,
              flexGrow: getCurrentTabData().length === 0 ? 1 : undefined
            }}
            ListEmptyComponent={EmptyListComponent}
          />
        )}
      </Animated.View>
      
      {/* Status Selection Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/30 justify-center items-center"
          activeOpacity={1}
          onPress={() => setShowStatusModal(false)}
        >
          <View className="bg-white rounded-xl w-72 overflow-hidden">
            <View className="border-b border-gray-200 p-4">
              <Text className="text-lg font-semibold text-gray-800">Set Your Status</Text>
            </View>
            
            {AGENT_STATUSES.map(status => (
              <TouchableOpacity
                key={status.id}
                className="flex-row items-center p-4 border-b border-gray-100"
                onPress={() => {
                  updateAgentStatus(status.id);
                  setShowStatusModal(false);
                }}
              >
                <View 
                  className="w-3 h-3 rounded-full mr-3"
                  style={{ backgroundColor: status.color }}
                />
                <Text className="text-gray-800">{status.label}</Text>
                
                {agentStatus === status.id && (
                  <Ionicons name="checkmark" size={20} color="#4f46e5" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* User Details Modal */}
      <Modal
        visible={userDetailModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setUserDetailModal(false)}
      >
        <View className="flex-1 bg-black/30 justify-end">
          <View className="bg-white rounded-t-xl max-h-[80%]">
            <View className="w-12 h-1 bg-gray-300 rounded-full self-center my-2" />
            
            {selectedUser && (
              <ScrollView className="p-4">
                {/* Header */}
                <View className="flex-row items-center border-b border-gray-200 pb-4">
                  <Image
                    source={!selectedUser?.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: selectedUser.photoURL }}
                    style={{ height: hp(8), width: hp(8), borderRadius: 100 }}
                    placeholder={blurhash}
                    className="bg-gray-200"
                  />
                  
                  <View className="ml-4">
                    <Text className="text-xl font-bold text-gray-800">
                      {selectedUser.fullName || `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`}
                    </Text>
                    <Text className="text-gray-500">
                      {selectedUser.email || 'No email available'}
                    </Text>
                    {selectedUser.phone && (
                      <Text className="text-gray-500">{selectedUser.phone}</Text>
                    )}
                  </View>
                </View>
                
                {/* Customer Details */}
                <View className="py-4">
                  <Text className="text-lg font-semibold text-gray-800 mb-2">Customer Details</Text>
                  
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Customer ID</Text>
                    <Text className="text-gray-800">{selectedUser.uid}</Text>
                  </View>
                  
                  {selectedUser.address && (
                    <View className="bg-gray-50 rounded-lg p-3 mb-3">
                      <Text className="text-xs text-gray-500 mb-1">Address</Text>
                      <Text className="text-gray-800">{selectedUser.address}</Text>
                    </View>
                  )}
                  
                  <View className="bg-gray-50 rounded-lg p-3 mb-3">
                    <Text className="text-xs text-gray-500 mb-1">Registered</Text>
                    <Text className="text-gray-800">
                      {selectedUser.createdAt?.toDate().toLocaleDateString() || 'Unknown'}
                    </Text>
                  </View>
                </View>
                
                {/* Quick Responses */}
                <View className="py-4 border-t border-gray-200">
                  <Text className="text-lg font-semibold text-gray-800 mb-2">Quick Responses</Text>
                  
                  {QUICK_RESPONSES.slice(0, 3).map(response => (
                    <TouchableOpacity
                      key={response.id}
                      className="bg-blue-50 rounded-lg p-3 mb-2 flex-row items-center"
                      onPress={async () => {
                        // Close modal and navigate to chat
                        setUserDetailModal(false);
                        
                        // Get chat room - wait a bit for modal to close
                        setTimeout(() => {
                          startChat(selectedUser);
                        }, 300);
                      }}
                    >
                      <Text className="text-blue-700 flex-1" numberOfLines={1}>
                        {response.text}
                      </Text>
                      <Ionicons name="send" size={16} color="#2563eb" />
                    </TouchableOpacity>
                  ))}
                </View>
                
                {/* Actions */}
                <View className="flex-row justify-between py-4 border-t border-gray-200">
                  <TouchableOpacity
                    className="flex-1 mr-2 bg-blue-600 p-3 rounded-lg items-center"
                    onPress={() => {
                      setUserDetailModal(false);
                      startChat(selectedUser);
                    }}
                  >
                    <Text className="text-white font-medium">Start Chat</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 ml-2 bg-gray-200 p-3 rounded-lg items-center"
                    onPress={() => setUserDetailModal(false)}
                  >
                    <Text className="text-gray-800 font-medium">Close</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 