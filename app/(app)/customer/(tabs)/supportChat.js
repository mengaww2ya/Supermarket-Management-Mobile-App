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
  Keyboard
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Feather, Ionicons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

import { useAuth } from '../../../context/authContext';
import { blurhash } from '../../../utills/common';
import { getRoomId } from '../../../utills/common';

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
  writeBatch
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';

const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/PrifileDemo.png');

export default function CustomerSupportChat() {
  const { userData } = useAuth();
  const router = useRouter();
  const [supportAgents, setSupportAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChat, setActiveChat] = useState(null);
  const [lastMessages, setLastMessages] = useState({});
  const [unreadCounts, setUnreadCounts] = useState({});
  const [newSupportRequest, setNewSupportRequest] = useState(false);
  const [supportTopic, setSupportTopic] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  // Fetch support agents on load
  useEffect(() => {
    if (!userData?.uid) return;

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

    // Fetch customer support agents
    const fetchSupportAgents = async () => {
      try {
        const q = query(
          collection(db, 'users'),
          where('role', 'in', ['admin', 'customerSupport'])
        );
        
        const querySnapshot = await getDocs(q);
        const agentsList = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        setSupportAgents(agentsList);
        setFilteredAgents(agentsList);
        
        // Check for existing chats
        fetchExistingChats(agentsList);
        
      } catch (error) {
        console.error('Error fetching support agents:', error);
        setLoading(false);
      }
    };

    fetchSupportAgents();
  }, [userData?.uid]);

  // Fetch existing chat rooms
  const fetchExistingChats = async (agentsList) => {
    if (!userData?.uid || !agentsList?.length) return;
    
    try {
      // Look for chats in the user's chats collection
      const userChatsQuery = query(
        collection(db, 'users', userData.uid, 'chats')
      );
      
      const chatSnapshot = await getDocs(userChatsQuery);
      if (chatSnapshot.empty) {
        console.log('No existing chats found');
        setLoading(false);
        return;
      }
      
      // Process chat data
      const messages = {};
      const unread = {};
      let hasActiveChat = false;
      
      for (const chatDoc of chatSnapshot.docs) {
        const chatData = chatDoc.data();
        const agentId = chatDoc.id;
        
        // Find the agent for this chat
        const agent = agentsList.find(a => a.uid === agentId);
        if (agent) {
          // Store last message
          if (chatData.lastMessage) {
            messages[agentId] = chatData.lastMessage;
          }
          
          // Store unread count
          unread[agentId] = chatData.unreadCount || 0;
          
          // Check if this is an active chat
          if (!hasActiveChat && chatData.status !== 'resolved') {
            setActiveChat(agent);
            hasActiveChat = true;
          }
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

  // Send a new support request
  const sendSupportRequest = async () => {
    if (!userData?.uid || !supportTopic.trim() || !supportMessage.trim()) {
      Alert.alert('Missing Information', 'Please provide both a topic and message.');
      return;
    }
    
    setLoading(true);
    
    try {
      // Find an available support agent (for simplicity, we'll choose the first one)
      const agent = supportAgents[0];
      if (!agent) {
        Alert.alert('No Support Agents', 'There are no support agents available at the moment.');
        setLoading(false);
        return;
      }
      
      // Create a new chat directly in users collection
      const roomId = getRoomId(userData.uid, agent.uid);
      
      // Prepare message data
      const messageData = {
        text: supportMessage.trim(),
        senderId: userData.uid,
        senderName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        senderPhoto: userData.photoURL || null,
        receiverId: agent.uid,
        receiverName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        receiverPhoto: agent.photoURL || null,
        createdAt: serverTimestamp(),
        read: false,
        type: 'text',
        topic: supportTopic.trim()
      };
      
      // Batch write to ensure consistency
      const batch = writeBatch(db);
      
      // 1. Add message to sender's collection
      const senderMessageRef = doc(collection(db, 'users', userData.uid, 'chats', agent.uid, 'messages'));
      batch.set(senderMessageRef, messageData);
      
      // 2. Add message to recipient's collection
      const recipientMessageRef = doc(collection(db, 'users', agent.uid, 'chats', userData.uid, 'messages'));
      batch.set(recipientMessageRef, messageData);
      
      // 3. Update sender's chat metadata
      const senderChatRef = doc(db, 'users', userData.uid, 'chats', agent.uid);
      batch.set(senderChatRef, {
        participantId: agent.uid,
        participantName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        participantPhoto: agent.photoURL || null,
        topic: supportTopic.trim(),
        lastMessage: {
          text: supportMessage.trim(),
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        lastRead: serverTimestamp(),
        status: 'active'
      }, { merge: true });
      
      // 4. Update recipient's chat metadata
      const recipientChatRef = doc(db, 'users', agent.uid, 'chats', userData.uid);
      batch.set(recipientChatRef, {
        participantId: userData.uid,
        participantName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        participantPhoto: userData.photoURL || null,
        topic: supportTopic.trim(),
        lastMessage: {
          text: supportMessage.trim(),
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        unreadCount: 1,
        status: 'active'
      }, { merge: true });
      
      // Commit all changes
      await batch.commit();
      
      // Set active chat
      setActiveChat(agent);
      
      // Close the new request modal and reset fields
      setNewSupportRequest(false);
      setSupportTopic('');
      setSupportMessage('');
      
      // Give haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Request Sent', 'Your support request has been sent. A customer support agent will respond shortly.');
      
      setLoading(false);
    } catch (error) {
      console.error('Error sending support request:', error);
      Alert.alert('Error', 'Failed to send support request. Please try again.');
      setLoading(false);
    }
  };

  // Open chat with agent
  const openChat = (agent) => {
    router.push({
      pathname: '/(app)/chatRoom',
      params: agent
    });
  };

  // Render support agent item
  const renderAgentItem = ({ item }) => {
    // Check if this agent has a chat with the user
    const hasChat = lastMessages[item.uid] !== undefined;
    const lastMessage = lastMessages[item.uid];
    const unreadCount = unreadCounts[item.uid] || 0;
    
    return (
      <TouchableOpacity
        className="flex-row items-center bg-white p-4 rounded-xl mb-2 shadow-sm"
        onPress={() => openChat(item)}
      >
        <Image
          source={!item.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item.photoURL }}
          style={{ height: hp(7), width: hp(7), borderRadius: 100 }}
          placeholder={blurhash}
          className="bg-gray-200"
        />
        
        <View className="ml-3 flex-1">
          <View className="flex-row justify-between">
            <Text className="font-semibold text-gray-800">
              {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`}
            </Text>
            
            {hasChat && (
              <Text className="text-xs text-gray-500">
                {lastMessage?.timestamp?.toDate
                  ? lastMessage.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : ''}
              </Text>
            )}
          </View>
          
          <Text className="text-xs text-gray-500 mt-0.5">
            {item.role === 'admin' ? 'Administrator' : 'Customer Support'}
          </Text>
          
          <View className="flex-row justify-between items-center mt-1">
            <Text className="text-gray-500 text-sm" numberOfLines={1}>
              {lastMessage 
                ? (lastMessage.senderId === userData.uid ? 'You: ' : '') + lastMessage.text 
                : (item.email || 'Support Agent')}
            </Text>
            
            {/* Unread count */}
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

  // Render when there are no chats
  const renderEmptyState = () => (
    <View className="flex-1 justify-center items-center p-4">
      <MaterialIcons name="support-agent" size={70} color="#d1d5db" />
      <Text className="text-gray-500 mt-4 text-lg font-medium">No Active Support Chats</Text>
      <Text className="text-gray-400 text-center mt-2 mb-6">
        Need help? Start a new conversation with our support team.
      </Text>
      <TouchableOpacity
        className="bg-blue-500 py-3 px-6 rounded-full"
        onPress={() => setNewSupportRequest(true)}
      >
        <Text className="text-white font-semibold">New Support Request</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <View className="bg-white py-4 px-4 border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Customer Support</Text>
        <Text className="text-sm text-gray-500">
          Get help from our support team
        </Text>
      </View>
      
      {/* Main Content */}
      <Animated.View
        className="flex-1 p-4"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {loading ? (
          <View className="flex-1 justify-center items-center">
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text className="text-gray-500 mt-4">Loading support...</Text>
          </View>
        ) : activeChat ? (
          <>
            {/* Support agent card for current chat */}
            <TouchableOpacity
              className="flex-row items-center bg-white p-4 rounded-xl mb-4 shadow-sm"
              onPress={() => openChat(activeChat)}
            >
              <Image
                source={!activeChat.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: activeChat.photoURL }}
                style={{ height: hp(8), width: hp(8), borderRadius: 100 }}
                placeholder={blurhash}
                className="bg-gray-200"
              />
              
              <View className="ml-4 flex-1">
                <Text className="text-lg font-bold text-gray-800">
                  {activeChat.fullName || `${activeChat.firstName || ''} ${activeChat.lastName || ''}`}
                </Text>
                <Text className="text-blue-600 font-medium">
                  {activeChat.role === 'admin' ? 'Administrator' : 'Customer Support'}
                </Text>
                <Text className="text-green-600 text-xs mt-1">
                  Active Support Session
                </Text>
                <TouchableOpacity
                  className="bg-blue-500 rounded-full px-4 py-2 mt-3"
                  onPress={() => openChat(activeChat)}
                >
                  <Text className="text-white text-center">Continue Chat</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
            
            <Text className="font-semibold text-gray-700 mb-2 mt-4">Other Support Staff</Text>
            <FlatList
              data={filteredAgents.filter(agent => agent.uid !== activeChat.uid)}
              keyExtractor={(item) => item.uid}
              renderItem={renderAgentItem}
              ListEmptyComponent={
                <Text className="text-gray-500 text-center p-4">No other support agents available</Text>
              }
            />
          </>
        ) : (
          <>
            {/* Show empty state if no active chats */}
            {renderEmptyState()}
          </>
        )}
      </Animated.View>
      
      {/* FAB for new support request */}
      {!newSupportRequest && activeChat && (
        <TouchableOpacity
          className="absolute right-6 bottom-6 bg-blue-500 w-14 h-14 rounded-full justify-center items-center shadow-lg"
          onPress={() => setNewSupportRequest(true)}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* New Support Request Modal */}
      <Modal
        visible={newSupportRequest}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setNewSupportRequest(false)}
      >
        <Pressable 
          className="flex-1 bg-black/30"
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View className="flex-1 justify-end">
            <Pressable className="bg-white rounded-t-xl p-5" onPress={e => e.stopPropagation()}>
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
              
              <Text className="text-xl font-bold text-gray-800 mb-6">New Support Request</Text>
              
              <Text className="text-gray-700 font-medium mb-2">Topic</Text>
              <TextInput
                className="bg-gray-100 p-3 rounded-xl mb-4 text-gray-800"
                placeholder="What do you need help with?"
                value={supportTopic}
                onChangeText={setSupportTopic}
              />
              
              <Text className="text-gray-700 font-medium mb-2">Message</Text>
              <TextInput
                className="bg-gray-100 p-3 rounded-xl mb-6 text-gray-800 min-h-[100px]"
                placeholder="Describe your issue..."
                value={supportMessage}
                onChangeText={setSupportMessage}
                multiline
                textAlignVertical="top"
              />
              
              <TouchableOpacity
                className="bg-blue-500 py-3 rounded-xl mb-3"
                onPress={sendSupportRequest}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text className="text-white font-bold text-center">Send Request</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                className="py-3"
                onPress={() => setNewSupportRequest(false)}
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