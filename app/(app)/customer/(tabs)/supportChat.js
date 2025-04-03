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
  const [tempSupportData, setTempSupportData] = useState({});
  
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

    fetchSupportAgents();
  }, [userData?.uid]);

  // Fetch customer support agents
  const fetchSupportAgents = async () => {
    try {
      setLoading(true);
      
      // Look specifically for users with role 'customerAssistance' as defined in the EMPLOYEE_ROLES
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'customerAssistance')
      );
      
      const querySnapshot = await getDocs(q);
      const agentsList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      }));

      console.log('[Support Debug] Found', agentsList.length, 'customer assistance agents');
      
      if (agentsList.length === 0) {
        console.log('[Support Debug] No customer assistance agents found, trying broader search');
        
        // If no customer assistance agents found, try a broader search
        const backupQuery = query(
          collection(db, 'users'),
          where('role', 'in', ['admin', 'manager'])
        );
        
        const backupSnapshot = await getDocs(backupQuery);
        const backupAgents = backupSnapshot.docs.map(doc => ({
          ...doc.data(),
          id: doc.id
        }));
        
        if (backupAgents.length > 0) {
          console.log('[Support Debug] Found', backupAgents.length, 'backup support agents');
          setSupportAgents(backupAgents);
          setFilteredAgents(backupAgents);
          fetchExistingChats(backupAgents);
        } else {
          setLoading(false);
        }
        return;
      }
      
      // Filter out agents who are offline if they have a support status
      const availableAgents = agentsList.filter(agent => 
        !agent.supportStatus || agent.supportStatus !== 'offline'
      );
      
      if (availableAgents.length === 0) {
        console.log('[Support Debug] No available agents found. Using all agents regardless of status.');
        // If no available agents were found, use any agents regardless of status
        setSupportAgents(agentsList);
        setFilteredAgents(agentsList);
      } else {
        console.log('[Support Debug] Found', availableAgents.length, 'available support agents');
        setSupportAgents(availableAgents);
        setFilteredAgents(availableAgents);
      }
      
      // Check for existing chats
      fetchExistingChats(availableAgents.length > 0 ? availableAgents : agentsList);
      
    } catch (error) {
      console.error('Error fetching support agents:', error);
      setLoading(false);
    }
  };

  // Debug function to create test support agents
  const createTestSupportAgents = async () => {
    if (!userData?.uid) return;
    
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Create 3 test support agents with the exact role 'customerAssistance' matching EMPLOYEE_ROLES
      const testAgents = [
        {
          uid: 'support-agent-1',
          firstName: 'John',
          lastName: 'Support',
          fullName: 'John Support',
          email: 'john.support@example.com',
          role: 'customerAssistance',
          photoURL: null,
          createdAt: serverTimestamp()
        },
        {
          uid: 'support-agent-2',
          firstName: 'Mary',
          lastName: 'Helper',
          fullName: 'Mary Helper',
          email: 'mary.helper@example.com',
          role: 'customerAssistance',
          photoURL: null,
          createdAt: serverTimestamp()
        },
        {
          uid: 'support-agent-3',
          firstName: 'Support',
          lastName: 'Manager',
          fullName: 'Support Manager',
          email: 'support.manager@example.com',
          role: 'customerAssistance',
          photoURL: null,
          createdAt: serverTimestamp()
        }
      ];
      
      // Add test agents to the database
      testAgents.forEach(agent => {
        const agentRef = doc(db, 'users', agent.uid);
        batch.set(agentRef, agent);
      });
      
      await batch.commit();
      Alert.alert('Success', 'Test customer assistance agents created. Pull down to refresh the list.');
      
      // Refresh the agent list
      fetchSupportAgents();
    } catch (error) {
      console.error('Error creating test support agents:', error);
      Alert.alert('Error', 'Failed to create test support agents.');
    } finally {
      setLoading(false);
    }
  };

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
    
    // Close the modal and show the agent list
    setNewSupportRequest(false);
    
    // Store the topic and message for later use
    setTempSupportData({
      topic: supportTopic.trim(),
      message: supportMessage.trim()
    });
    
    // If no agents were loaded or found, fetch them
    if (supportAgents.length === 0) {
      fetchSupportAgents();
    }
    
    // Show a brief help message
    Alert.alert(
      'Select a Support Agent', 
      'Please select one of our available support agents below to handle your request.',
      [{ text: 'OK', onPress: () => {} }]
    );
  };
  
  // Complete the support request with a selected agent
  const completeSupportRequest = async (agent) => {
    if (!userData?.uid || !tempSupportData.topic || !tempSupportData.message) {
      Alert.alert('Error', 'Missing support request data. Please try again.');
      return;
    }
    
    setLoading(true);
    
    try {      
      // Create a new chat directly in users collection
      const roomId = getRoomId(userData.uid, agent.uid);
      
      // Prepare message data
      const messageData = {
        text: tempSupportData.message,
        senderId: userData.uid,
        senderName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        senderPhoto: userData.photoURL || null,
        receiverId: agent.uid,
        receiverName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        receiverPhoto: agent.photoURL || null,
        createdAt: serverTimestamp(),
        read: false,
        type: 'text',
        topic: tempSupportData.topic
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
        topic: tempSupportData.topic,
        lastMessage: {
          text: tempSupportData.message,
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
        topic: tempSupportData.topic,
        lastMessage: {
          text: tempSupportData.message,
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
      
      // Reset temp data
      setTempSupportData({});
      setSupportTopic('');
      setSupportMessage('');
      
      // Give haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      Alert.alert('Request Sent', `Your support request has been sent to ${agent.fullName || 'the selected agent'}. They will respond shortly.`);
      
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
    const hasPendingRequest = tempSupportData.topic && tempSupportData.message;
    
    return (
      <TouchableOpacity
        className={`flex-row items-center bg-white p-4 rounded-xl mb-2 shadow-sm ${hasPendingRequest ? 'border-2 border-blue-200' : ''}`}
        onPress={() => {
          if (hasPendingRequest) {
            // If we have a pending request, complete it with this agent
            completeSupportRequest(item);
          } else {
            // Otherwise just open the chat
            openChat(item);
          }
        }}
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
            {item.role === 'customerAssistance' ? 'Customer Assistance' : 
             item.role === 'admin' ? 'Administrator' : 
             item.role === 'manager' ? 'Manager' : 'Support Staff'}
          </Text>
          
          <View className="flex-row justify-between items-center mt-1">
            {hasPendingRequest ? (
              <Text className="text-blue-600 text-sm font-medium">
                Tap to send your request to this agent
              </Text>
            ) : (
              <Text className="text-gray-500 text-sm" numberOfLines={1}>
                {lastMessage 
                  ? (lastMessage.senderId === userData.uid ? 'You: ' : '') + lastMessage.text 
                  : (item.email || 'Support Agent')}
              </Text>
            )}
            
            {/* Unread count */}
            {unreadCount > 0 && !hasPendingRequest && (
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

  // Render empty list of agents
  const renderEmptyAgentsList = () => (
    <View className="flex-1 justify-center items-center p-4">
      <MaterialIcons name="support-agent" size={50} color="#d1d5db" />
      <Text className="text-gray-500 mt-3 text-center">
        No support agents available right now. Please try again later.
      </Text>
      <TouchableOpacity 
        className="mt-4 bg-blue-500 py-2 px-4 rounded-lg"
        onPress={fetchSupportAgents}
      >
        <Text className="text-white">Refresh</Text>
      </TouchableOpacity>
      
      {/* Development/testing only - create test agents */}
      {__DEV__ && (
        <TouchableOpacity 
          className="mt-2 bg-gray-500 py-2 px-4 rounded-lg"
          onPress={createTestSupportAgents}
        >
          <Text className="text-white">Create Test Agents (Dev Only)</Text>
        </TouchableOpacity>
      )}
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
                  {activeChat.role === 'customerAssistance' ? 'Customer Assistance' : 
                   activeChat.role === 'admin' ? 'Administrator' : 
                   activeChat.role === 'manager' ? 'Manager' : 'Support Staff'}
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
            
            {tempSupportData.topic && tempSupportData.message ? (
              <View className="bg-blue-50 p-3 rounded-lg mb-4">
                <Text className="font-semibold text-blue-800 mb-1">Your Support Request</Text>
                <Text className="text-blue-600 text-sm mb-3">Please select a support agent below to handle your request</Text>
                <View className="bg-white p-2 rounded-md mb-2">
                  <Text className="text-xs text-gray-500">Topic</Text>
                  <Text className="text-gray-800">{tempSupportData.topic}</Text>
                </View>
                <View className="bg-white p-2 rounded-md">
                  <Text className="text-xs text-gray-500">Message</Text>
                  <Text className="text-gray-800" numberOfLines={2}>{tempSupportData.message}</Text>
                </View>
                <TouchableOpacity 
                  className="mt-3 items-center"
                  onPress={() => setTempSupportData({})}
                >
                  <Text className="text-blue-600">Cancel Request</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            
            <Text className="font-semibold text-gray-700 mb-2 mt-4">
              {tempSupportData.topic && tempSupportData.message ? 'Choose a Support Agent' : 'Other Support Staff'}
            </Text>
            <FlatList
              data={filteredAgents.filter(agent => agent.uid !== activeChat.uid)}
              keyExtractor={(item) => item.uid}
              renderItem={renderAgentItem}
              ListEmptyComponent={renderEmptyAgentsList}
            />
          </>
        ) : (
          <>
            {tempSupportData.topic && tempSupportData.message ? (
              <>
                <View className="bg-blue-50 p-3 rounded-lg mb-4">
                  <Text className="font-semibold text-blue-800 mb-1">Your Support Request</Text>
                  <Text className="text-blue-600 text-sm mb-3">Please select a support agent below to handle your request</Text>
                  <View className="bg-white p-2 rounded-md mb-2">
                    <Text className="text-xs text-gray-500">Topic</Text>
                    <Text className="text-gray-800">{tempSupportData.topic}</Text>
                  </View>
                  <View className="bg-white p-2 rounded-md">
                    <Text className="text-xs text-gray-500">Message</Text>
                    <Text className="text-gray-800" numberOfLines={2}>{tempSupportData.message}</Text>
                  </View>
                  <TouchableOpacity 
                    className="mt-3 items-center"
                    onPress={() => setTempSupportData({})}
                  >
                    <Text className="text-blue-600">Cancel Request</Text>
                  </TouchableOpacity>
                </View>
                
                <Text className="font-semibold text-gray-700 mb-2">Choose a Support Agent</Text>
                <FlatList
                  data={filteredAgents}
                  keyExtractor={(item) => item.uid}
                  renderItem={renderAgentItem}
                  ListEmptyComponent={renderEmptyAgentsList}
                />
              </>
            ) : (
              <>
                {/* Show empty state if no active chats */}
                {renderEmptyState()}
              </>
            )}
          </>
        )}
      </Animated.View>
      
      {/* FAB for new support request */}
      {!newSupportRequest && !tempSupportData.topic && activeChat && (
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
                  <Text className="text-white font-bold text-center">Continue to Select Agent</Text>
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