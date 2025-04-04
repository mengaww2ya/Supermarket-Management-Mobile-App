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
  ImageBackground,
  ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { Feather, Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

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
  writeBatch,
  limit
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';

const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/PrifileDemo.png');
// Use existing assets as fallbacks instead of requiring non-existent files
// const SUPPORT_BACKGROUND = require('../../../../assets/images/support-bg.jpg');
// const SUPPORT_ANIMATION = require('../../../../assets/animations/support-animation.json');

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
  const [customTopic, setCustomTopic] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [tempSupportData, setTempSupportData] = useState({});
  const [resolvedChats, setResolvedChats] = useState([]);
  // New state variables for enhanced UI
  const [selectedCategory, setSelectedCategory] = useState('active');
  const [issueCategoryStats, setIssueCategoryStats] = useState({
    active: 0,
    resolved: 0
  });
  const [commonIssues, setCommonIssues] = useState([
    { id: 1, title: 'Order Issue', description: 'Problems with your recent orders' },
    { id: 2, title: 'Product Question', description: 'Questions about product details or availability' },
    { id: 3, title: 'Delivery Problem', description: 'Issues with delivery timing or service' },
    { id: 4, title: 'Payment Issue', description: 'Problems with payment methods or charges' },
    { id: 5, title: 'Account Help', description: 'Help with your account settings or access' },
    { id: 6, title: 'Feedback', description: 'Share your experience or suggestions' },
    { id: 7, title: 'Other', description: 'Any other questions or concerns' }
  ]);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [messageInputHeight, setMessageInputHeight] = useState(120);
  const [modalStep, setModalStep] = useState(1);
  const [animation] = useState(new Animated.Value(0));
  
  // Custom alert states
  const [customAlert, setCustomAlert] = useState({
    visible: false,
    title: '',
    message: '',
    type: 'info', // 'info', 'success', 'error', 'warning'
    buttons: []
  });
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const modalSlideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const alertAnim = useRef(new Animated.Value(0)).current;

  // Animate between modal steps
  useEffect(() => {
    if (newSupportRequest) {
      // Reset to first step when opening modal
      setModalStep(1);
      
      // Start animations
      Animated.parallel([
        Animated.spring(modalSlideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Reset animations when closing
      modalSlideAnim.setValue(300);
      scaleAnim.setValue(0.95);
    }
  }, [newSupportRequest]);

  // Animation for transitioning between steps
  useEffect(() => {
    Animated.timing(animation, {
      toValue: modalStep - 1,
      duration: 300,
      useNativeDriver: false
    }).start();
  }, [modalStep]);

  // Custom alert animation
  useEffect(() => {
    if (customAlert.visible) {
      Animated.sequence([
        Animated.timing(alertAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
        Animated.spring(alertAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      alertAnim.setValue(0);
    }
  }, [customAlert.visible]);

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
    fetchResolvedIssues();
  }, [userData?.uid]);
  
  // Fetch customer support agents
  const fetchSupportAgents = async () => {
    try {
      setLoading(true);
      
      // First, fetch all active chats for this user from their chats collection
      const activeChatsQuery = query(
        collection(db, 'users', userData.uid, 'chats'),
        where('status', '==', 'active')
      );
      
      const activeChatsSnapshot = await getDocs(activeChatsQuery);
      
      if (!activeChatsSnapshot.empty) {
        // User has active issues, show only those agents
        console.log('[Support Debug] User has active issues, showing only assigned agents');
        
        // Get agent IDs from active chats
        const assignedAgentIds = activeChatsSnapshot.docs.map(doc => doc.id);
        
        // Get the details of agents handling these active chats
        const agentPromises = assignedAgentIds.map(agentId => 
          getDoc(doc(db, 'users', agentId))
        );
        
        const agentSnapshots = await Promise.all(agentPromises);
        const assignedAgents = agentSnapshots
          .filter(snapshot => snapshot.exists())
          .map(snapshot => ({
            ...snapshot.data(),
            id: snapshot.id,
            uid: snapshot.id
          }));
        
        // Set all support agents
        setSupportAgents(assignedAgents);
        setFilteredAgents(assignedAgents);
        
        // If there's an assigned agent, set it as active
        if (assignedAgents.length > 0) {
          setActiveChat(assignedAgents[0]);
        }
        
        // Fetch existing chats
        fetchExistingChats(assignedAgents);
        setLoading(false);
        return;
      }
      
      // If no active issues, then show available customer assistance agents
      // Look specifically for users with role 'customerAssistance' as defined in the EMPLOYEE_ROLES
      const q = query(
        collection(db, 'users'),
        where('role', '==', 'customerAssistance')
      );
      
      const querySnapshot = await getDocs(q);
      const agentsList = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        uid: doc.id
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
          id: doc.id,
          uid: doc.id
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
      
      setLoading(false);
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
      
      const currentActiveIssues = new Set(); // Track active issues
      
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
          
          // Check if this is an active chat and track the issue
          if (chatData.status === 'active' && chatData.issueId) {
            currentActiveIssues.add(chatData.issueId);
            
            if (!hasActiveChat) {
              setActiveChat(agent);
              hasActiveChat = true;
            }
          }
        }
      }
      
      // Filter out agents that shouldn't be available for new issues
      if (currentActiveIssues.size > 0 && tempSupportData.topic && tempSupportData.message) {
        // We have a new issue and existing issues - make sure we don't assign same agent
        const availableForNewIssue = agentsList.filter(agent => {
          // Check if this agent is already handling an active issue
          const isHandlingActiveIssue = chatSnapshot.docs
            .filter(doc => doc.id === agent.uid)
            .some(doc => doc.data().status === 'active');
            
          return !isHandlingActiveIssue;
        });
        
        setFilteredAgents(availableForNewIssue);
      }
      
      setLastMessages(messages);
      setUnreadCounts(unread);
      setLoading(false);
      
      // If no active chats were found, show the + button
      if (!hasActiveChat) {
        setActiveChat(null);
      }
      
    } catch (error) {
      console.error('Error fetching existing chats:', error);
      setLoading(false);
    }
  };

  // Fetch resolved support issues
  const fetchResolvedIssues = async () => {
    if (!userData?.uid) return;
    
    try {
      // Get active issues count directly from user's chats subcollection
      const userChatsRef = collection(db, 'users', userData.uid, 'chats');
      const activeChatsQuery = query(
        userChatsRef,
        where('status', '==', 'active')
      );
      
      const activeSnapshot = await getDocs(activeChatsQuery);
      const activeCount = activeSnapshot.size;
      
      // Get resolved issues from user's chats subcollection
      const resolvedChatsQuery = query(
        userChatsRef,
        where('status', '==', 'resolved')
      );
      
      const resolvedSnapshot = await getDocs(resolvedChatsQuery);
      const resolvedIssues = resolvedSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          issueId: data.issueId || doc.id,
          assignedAgentId: doc.id,
          assignedAgentName: data.participantName,
          topic: data.topic || 'Support Issue',
          status: 'resolved',
          resolvedAt: data.resolvedAt,
          updatedAt: data.updatedAt,
          customerId: userData.uid
        };
      });
      
      console.log(`[Support Debug] Found ${resolvedIssues.length} resolved issues`);
      setResolvedChats(resolvedIssues);
      
      // Update category stats
      setIssueCategoryStats({
        active: activeCount,
        resolved: resolvedIssues.length
      });
    } catch (error) {
      console.error('Error fetching resolved issues:', error);
    }
  };

  // Show custom alert
  const showAlert = (title, message, type = 'info', buttons = [{ text: 'OK', onPress: () => hideAlert() }]) => {
    setCustomAlert({
      visible: true,
      title,
      message,
      type,
      buttons
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };
  
  // Hide custom alert
  const hideAlert = () => {
    setCustomAlert(prev => ({ ...prev, visible: false }));
  };

  // Function to mark issue as resolved
  const markIssueAsResolved = async () => {
    if (!userData?.uid || !activeChat) return;
    
    try {
      setLoading(true);
      
      // We'll work directly with the user's chats collection
      // First, get the chat document for the active chat
      const userChatRef = doc(db, 'users', userData.uid, 'chats', activeChat.uid);
      const userChatDoc = await getDoc(userChatRef);
      
      if (!userChatDoc.exists()) {
        showAlert(
          'Error', 
          'Chat not found. Please try again.',
          'error'
        );
        setLoading(false);
        return;
      }
      
      const chatData = userChatDoc.data();
      const issueId = chatData.issueId || `issue_${Date.now()}`;
      
      // Update chat status in user's chats collection
      await updateDoc(userChatRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Update chat status in agent's chats collection
      const agentChatRef = doc(db, 'users', activeChat.uid, 'chats', userData.uid);
      await updateDoc(agentChatRef, {
        status: 'resolved',
        resolvedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      // Send a system message to notify both parties
      const systemMessage = {
        text: 'This support issue has been marked as resolved by the customer.',
        senderId: 'system',
        senderName: 'System',
        receiverId: activeChat.uid,
        receiverName: activeChat.fullName || `${activeChat.firstName || ''} ${activeChat.lastName || ''}`,
        type: 'system',
        createdAt: serverTimestamp(),
        read: false
      };
      
      // Add to both chat collections
      await addDoc(collection(db, 'users', userData.uid, 'chats', activeChat.uid, 'messages'), systemMessage);
      await addDoc(collection(db, 'users', activeChat.uid, 'chats', userData.uid, 'messages'), systemMessage);
      
      // Refresh data
      setActiveChat(null);
      fetchSupportAgents();
      fetchResolvedIssues();
      
      showAlert(
        'Issue Resolved', 
        'Your support issue has been marked as resolved. You can now start a new support request if needed.',
        'success',
        [{ text: 'OK', onPress: () => hideAlert() }]
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error resolving issue:', error);
      showAlert(
        'Error', 
        'Failed to mark issue as resolved. Please try again.',
        'error'
      );
      setLoading(false);
    }
  };

  // Send a new support request
  const sendSupportRequest = () => {
    handleSendRequest();
  };
  
  // Complete the support request with a selected agent
  const completeSupportRequest = async (agent) => {
    if (!userData?.uid || !tempSupportData.topic || !tempSupportData.message) {
      showAlert(
        'Error', 
        'Missing support request data. Please try again.',
        'error'
      );
      return;
    }
    
    setLoading(true);
    
    try {      
      // Create a new chat directly in users collection
      const roomId = getRoomId(userData.uid, agent.uid);
      
      // Format the topic and message properly for display in chat
      const formattedInitialMessage = `**Topic: ${tempSupportData.topic}**\n\n${tempSupportData.message}`;
      
      // Prepare message data - this will be the customer's first message
      const messageData = {
        text: formattedInitialMessage,
        senderId: userData.uid,
        senderName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        senderPhoto: userData.photoURL || null,
        receiverId: agent.uid,
        receiverName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        receiverPhoto: agent.photoURL || null,
        createdAt: serverTimestamp(),
        read: false,
        type: 'text',
        topic: tempSupportData.topic,
        issueId: tempSupportData.issueId // Include the unique issue ID
      };
      
      // Add a system message to identify the support category (visible to both)
      const systemMessage = {
        text: `New support conversation started - Category: ${tempSupportData.topic}`,
        senderId: 'system',
        senderName: 'System',
        receiverId: agent.uid,
        receiverName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        createdAt: serverTimestamp(),
        read: false,
        type: 'system'
      };
      
      // Batch write to ensure consistency
      const batch = writeBatch(db);
      
      // 1. Add system message first (appears at top of conversation)
      const senderSystemRef = doc(collection(db, 'users', userData.uid, 'chats', agent.uid, 'messages'));
      batch.set(senderSystemRef, systemMessage);
      
      const recipientSystemRef = doc(collection(db, 'users', agent.uid, 'chats', userData.uid, 'messages'));
      batch.set(recipientSystemRef, systemMessage);
      
      // 2. Add customer's message to sender's collection
      const senderMessageRef = doc(collection(db, 'users', userData.uid, 'chats', agent.uid, 'messages'));
      batch.set(senderMessageRef, messageData);
      
      // 3. Add customer's message to recipient's collection
      const recipientMessageRef = doc(collection(db, 'users', agent.uid, 'chats', userData.uid, 'messages'));
      batch.set(recipientMessageRef, messageData);
      
      // 4. Update sender's chat metadata
      const senderChatRef = doc(db, 'users', userData.uid, 'chats', agent.uid);
      batch.set(senderChatRef, {
        participantId: agent.uid,
        participantName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
        participantPhoto: agent.photoURL || null,
        topic: tempSupportData.topic,
        issueId: tempSupportData.issueId, // Include issue ID in metadata
        lastMessage: {
          text: formattedInitialMessage,
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        lastRead: serverTimestamp(),
        status: 'active',
        assignedAgent: agent.uid, // Track the assigned agent
        canTransfer: false, // Prevent transfer by default
        roomId: roomId,
        created: serverTimestamp() // Add creation time
      }, { merge: true });
      
      // 5. Update recipient's chat metadata
      const recipientChatRef = doc(db, 'users', agent.uid, 'chats', userData.uid);
      batch.set(recipientChatRef, {
        participantId: userData.uid,
        participantName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        participantPhoto: userData.photoURL || null,
        topic: tempSupportData.topic,
        issueId: tempSupportData.issueId, // Include issue ID in metadata
        lastMessage: {
          text: formattedInitialMessage,
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        unreadCount: 1,
        status: 'active',
        assignedAgent: agent.uid, // Track the assigned agent
        canTransfer: false, // Prevent transfer by default
        roomId: roomId,
        created: serverTimestamp() // Add creation time
      }, { merge: true });
      
      // Commit all changes
      await batch.commit();
      
      // Set active chat
      setActiveChat(agent);
      
      // Update the list to remove other agents from this issue
      if (supportAgents.length > 0) {
        setFilteredAgents([]);
      }
      
      // Reset temp data
      setTempSupportData({});
      setSupportTopic('');
      setSupportMessage('');
      
      // Give haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      showAlert(
        'Support Agent Assigned', 
        `Your support request has been assigned exclusively to ${agent.fullName || 'the selected agent'}. Only this agent will handle your issue.`,
        'success',
        [{ 
          text: 'Chat Now', 
          onPress: () => {
            hideAlert();
            // Open the chat immediately after sending the message
            router.push({
              pathname: '/(app)/chatRoom',
              params: {
                id: agent.id,
                uid: agent.uid,
                fullName: agent.fullName || `${agent.firstName || ''} ${agent.lastName || ''}`,
                photoURL: agent.photoURL,
                role: agent.role,
                topic: tempSupportData.topic
              }
            });
          }
        }]
      );
      
      setLoading(false);
    } catch (error) {
      console.error('Error sending support request:', error);
      showAlert(
        'Error', 
        'Failed to send support request. Please try again.',
        'error'
      );
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
        className={`flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-md border border-gray-100 ${hasPendingRequest ? 'border-blue-300 border-2' : ''}`}
        style={{
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.2,
          shadowRadius: 3,
        }}
        onPress={() => {
          if (hasPendingRequest) {
            // If we have a pending request, complete it with this agent
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            completeSupportRequest(item);
          } else {
            // Otherwise just open the chat
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            openChat(item);
          }
        }}
      >
        <View className="relative">
          <Image
            source={!item.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item.photoURL }}
            style={{ height: hp(7), width: hp(7), borderRadius: 100 }}
            placeholder={blurhash}
            className="bg-gray-200"
          />
          <View className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border border-white ${item.online ? 'bg-green-500' : 'bg-gray-400'}`} />
        </View>
        
        <View className="ml-4 flex-1">
          <View className="flex-row justify-between items-center">
            <Text className="font-semibold text-gray-800 text-base">
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
          
          <View className="flex-row items-center mt-0.5">
            <MaterialIcons name="support-agent" size={14} color="#6366f1" />
            <Text className="text-xs text-indigo-600 ml-1 font-medium">
              {item.role === 'customerAssistance' ? 'Customer Assistance' : 
               item.role === 'admin' ? 'Administrator' : 
               item.role === 'manager' ? 'Manager' : 'Support Staff'}
            </Text>
            {item.supportStatus && (
              <View className="bg-blue-50 rounded-full px-2 py-0.5 ml-2">
                <Text className="text-blue-700 text-xs">{item.supportStatus}</Text>
              </View>
            )}
          </View>
          
          <View className="flex-row justify-between items-center mt-2">
            {hasPendingRequest ? (
              <View className="flex-row items-center">
                <MaterialIcons name="arrow-forward" size={14} color="#4f46e5" />
                <Text className="text-indigo-600 text-sm font-medium ml-1">
                  Tap to send your request
                </Text>
              </View>
            ) : (
              <Text className="text-gray-600 text-sm" numberOfLines={1}>
                {lastMessage 
                  ? (lastMessage.senderId === userData.uid ? 'You: ' : '') + lastMessage.text 
                  : (item.expertise || 'Ready to help you')}
              </Text>
            )}
            
            {/* Unread count */}
            {unreadCount > 0 && !hasPendingRequest && (
              <View className="bg-indigo-500 rounded-full px-2 py-0.5 min-w-[20px] items-center">
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
    // <ImageBackground 
    //   source={SUPPORT_BACKGROUND} 
    //   className="flex-1 justify-center items-center p-4"
    //   imageStyle={{ opacity: 0.15 }}
    // >
    <View className="flex-1 justify-center items-center p-4 bg-indigo-50">
      <View className="items-center">
        {/* <LottieView
          source={SUPPORT_ANIMATION}
          style={{ width: 180, height: 180 }}
          autoPlay
          loop
        /> */}
        <MaterialIcons name="support-agent" size={80} color="#4f46e5" />
        <Text className="text-gray-800 mt-4 text-2xl font-bold text-center">
          Need Help?
        </Text>
        <Text className="text-gray-600 text-center mt-2 mb-6 px-4">
          Our dedicated support team is here for you. Each support issue will be handled by a personal agent.
        </Text>
        <LinearGradient
          colors={['#4f46e5', '#6366f1']}
          start={[0, 0]}
          end={[1, 0]}
          className="rounded-full shadow-md"
        >
          <TouchableOpacity
            className="py-3 px-8 flex-row items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setNewSupportRequest(true);
            }}
          >
            <FontAwesome5 name="headset" size={16} color="white" />
            <Text className="text-white font-bold ml-2">Start Support Chat</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
      
      {/* Recent issues preview if any */}
      {resolvedChats.length > 0 && (
        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity
            className="bg-white/80 rounded-lg px-4 py-2 shadow-sm"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Add scroll to history section here
            }}
          >
            <Text className="text-gray-700">
              {resolvedChats.length} Recently Resolved Issues
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
    // </ImageBackground>
  );

  // Render empty list of agents
  const renderEmptyAgentsList = () => (
    <View className="flex-1 justify-center items-center p-6 bg-gray-50 rounded-xl">
      <MaterialCommunityIcons name="account-search-outline" size={60} color="#d1d5db" />
      <Text className="text-gray-700 mt-4 text-lg font-semibold text-center">
        No Support Agents Available
      </Text>
      <Text className="text-gray-500 mt-2 mb-6 text-center">
        We couldn't find any available support agents right now. Please try again in a few moments.
      </Text>
      <TouchableOpacity 
        className="bg-indigo-500 py-3 px-6 rounded-lg flex-row items-center"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          fetchSupportAgents();
        }}
      >
        <Ionicons name="refresh" size={18} color="white" />
        <Text className="text-white font-semibold ml-2">Refresh</Text>
      </TouchableOpacity>
      
      {/* Development/testing only - create test agents */}
      {__DEV__ && (
        <TouchableOpacity 
          className="mt-4 bg-gray-700 py-2 px-4 rounded-lg"
          onPress={createTestSupportAgents}
        >
          <Text className="text-white">Create Test Agents (Dev Only)</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Check for agent assignments - fixed to use user's chats collection
  const checkAgentAssignments = async () => {
    if (!userData?.uid) return;
    
    try {
      // Get all active support chats for this user
      const activeChatsQuery = query(
        collection(db, 'users', userData.uid, 'chats'),
        where('status', '==', 'active')
      );
      
      const activeChatsSnapshot = await getDocs(activeChatsQuery);
      if (!activeChatsSnapshot.empty) {
        // Get all agents that are already assigned to this user's issues
        const assignedAgentIds = activeChatsSnapshot.docs.map(doc => doc.id);
        
        // Filter out agents that are already handling other issues for this user
        const availableAgents = supportAgents.filter(agent => 
          !assignedAgentIds.includes(agent.uid) || 
          (activeChat && agent.uid === activeChat.uid)
        );
        
        setFilteredAgents(availableAgents);
        
        if (availableAgents.length === 0 && supportAgents.length > 0) {
          // All agents are already assigned to this user's other issues
          Alert.alert(
            'Agents Already Assigned',
            'All available support agents are already handling your other support issues. Please continue with your existing conversations.'
          );
        }
      }
    } catch (error) {
      console.error('Error checking agent assignments:', error);
    }
  };

  // Pre-fill the form with a common issue
  const selectCommonIssue = (issue) => {
    setSelectedIssue(issue);
    setSupportTopic(issue.title);
    if (issue.title === 'Other') {
      setCustomTopic('');
    }
    setDropdownVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  // Reset the issue form
  const resetIssueForm = () => {
    setSupportTopic('');
    setCustomTopic('');
    setSupportMessage('');
    setSelectedIssue(null);
    setModalStep(1);
  };
  
  // Go to next step in the modal
  const goToNextStep = () => {
    if (modalStep < 2) {
      // Validate current step
      if (modalStep === 1 && (!supportTopic || (supportTopic === 'Other' && !customTopic))) {
        showAlert(
          'Missing Topic', 
          'Please select or enter a topic for your support request.',
          'warning'
        );
        return;
      }
      
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setModalStep(modalStep + 1);
    } else {
      // Final step - send the request
      handleSendRequest();
    }
  };
  
  // Go to previous step in the modal
  const goToPreviousStep = () => {
    if (modalStep > 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setModalStep(modalStep - 1);
    } else {
      // First step - close modal
      setNewSupportRequest(false);
    }
  };
  
  // Handle sending the support request
  const handleSendRequest = () => {
    // Determine the final topic (selected or custom)
    const finalTopic = supportTopic === 'Other' ? customTopic : supportTopic;
    
    if (!finalTopic || !supportMessage) {
      showAlert(
        'Missing Information', 
        'Please provide both a topic and message for your support request.',
        'warning'
      );
      return;
    }
    
    // Update tempSupportData with the final topic
    const requestData = {
      topic: finalTopic.trim(),
      message: supportMessage.trim(),
      issueId: `issue_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    };
    
    // Close the modal
    setNewSupportRequest(false);
    
    // Store the data
    setTempSupportData(requestData);
    
    // If no agents were loaded or found, fetch them
    if (supportAgents.length === 0) {
      fetchSupportAgents();
    }
    
    // Show a success message and guidance
    showAlert(
      'Request Created', 
      'Please select a support agent to handle your request. Once assigned, your issue will be handled exclusively by this agent.',
      'success',
      [{ text: 'Select Agent', onPress: () => hideAlert() }]
    );
  };
  
  // Toggle dropdown visibility
  const toggleDropdown = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDropdownVisible(!dropdownVisible);
  };
  
  // Render the topic dropdown
  const renderTopicDropdown = () => (
    <View className="mb-4">
      <View className="flex-row items-center mb-2">
        <MaterialIcons name="label" size={18} color="#4f46e5" />
        <Text className="text-gray-700 font-medium ml-2">Select Issue Type</Text>
      </View>
      
      <TouchableOpacity 
        className="bg-gray-100 p-4 rounded-xl mb-2 flex-row justify-between items-center border border-gray-200"
        onPress={toggleDropdown}
      >
        <Text className={supportTopic ? "text-gray-800" : "text-gray-400"}>
          {supportTopic || "Select a topic..."}
        </Text>
        <Ionicons 
          name={dropdownVisible ? "chevron-up" : "chevron-down"} 
          size={20} 
          color="#6b7280" 
        />
      </TouchableOpacity>
      
      {dropdownVisible && (
        <View className="bg-white rounded-xl border border-gray-200 shadow-lg mb-2 overflow-hidden">
          <ScrollView className="max-h-40" showsVerticalScrollIndicator={false}>
            {commonIssues.map((issue) => (
              <TouchableOpacity
                key={issue.id}
                className={`p-3 border-b border-gray-100 flex-row items-center ${
                  supportTopic === issue.title ? "bg-indigo-50" : ""
                }`}
                onPress={() => selectCommonIssue(issue)}
              >
                <View className="w-5 h-5 rounded-full border-2 border-indigo-500 mr-3 items-center justify-center">
                  {supportTopic === issue.title && (
                    <View className="w-3 h-3 rounded-full bg-indigo-500" />
                  )}
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 font-medium">{issue.title}</Text>
                  <Text className="text-gray-500 text-xs">{issue.description}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {supportTopic === 'Other' && (
        <TextInput
          className="bg-gray-100 p-4 rounded-xl mb-1 text-gray-800 mt-2 border border-gray-200"
          placeholder="Enter your custom topic..."
          value={customTopic}
          onChangeText={setCustomTopic}
          placeholderTextColor="#9ca3af"
        />
      )}
    </View>
  );
  
  // Render message preview
  const renderMessagePreview = () => {
    const finalTopic = supportTopic === 'Other' ? customTopic : supportTopic;
    
    return (
      <View className="bg-indigo-50 p-3 rounded-lg mb-4 border border-indigo-100">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <Ionicons name="chatbox" size={18} color="#4f46e5" />
            <Text className="text-indigo-600 font-medium ml-2">Message Preview</Text>
          </View>
          {modalStep === 2 && (
            <TouchableOpacity 
              className="bg-indigo-100 p-1 px-2 rounded-full"
              onPress={() => setModalStep(1)}
            >
              <Text className="text-indigo-700 text-xs">Edit Topic</Text>
            </TouchableOpacity>
          )}
        </View>
        <View className="bg-white p-3 rounded-md mt-2 shadow-sm">
          <Text className="text-indigo-700 font-medium">Topic: {finalTopic || "[Your topic]"}</Text>
          {modalStep === 2 && (
            <Text className="text-gray-700 mt-2" numberOfLines={3}>
              {supportMessage || "[Your detailed message will appear here]"}
            </Text>
          )}
        </View>
      </View>
    );
  };

  // Render category selector tabs
  const renderCategoryTabs = () => (
    <View className="flex-row justify-center mb-4 bg-gray-100 rounded-full p-1">
      <TouchableOpacity 
        className={`py-2 px-4 rounded-full flex-row items-center ${selectedCategory === 'active' ? 'bg-indigo-600' : 'bg-transparent'}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedCategory('active');
        }}
      >
        <MaterialIcons name="support" size={16} color={selectedCategory === 'active' ? 'white' : '#6b7280'} />
        <Text className={`ml-1 font-medium ${selectedCategory === 'active' ? 'text-white' : 'text-gray-600'}`}>
          Active <Text className="font-bold">{issueCategoryStats.active}</Text>
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        className={`py-2 px-4 rounded-full flex-row items-center ${selectedCategory === 'resolved' ? 'bg-indigo-600' : 'bg-transparent'}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedCategory('resolved');
        }}
      >
        <MaterialIcons name="check-circle" size={16} color={selectedCategory === 'resolved' ? 'white' : '#6b7280'} />
        <Text className={`ml-1 font-medium ${selectedCategory === 'resolved' ? 'text-white' : 'text-gray-600'}`}>
          Resolved <Text className="font-bold">{issueCategoryStats.resolved}</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Render common issues in the modal
  const renderCommonIssues = () => (
    <View className="mb-4">
      <Text className="text-sm text-gray-500 mb-2">Select an issue category:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="pb-1">
        {commonIssues.map(issue => (
          <TouchableOpacity
            key={issue.id}
            className={`mr-3 p-3 rounded-lg ${selectedIssue?.id === issue.id ? 'bg-indigo-100 border border-indigo-300' : 'bg-gray-100'}`}
            style={{ width: 150 }}
            onPress={() => selectCommonIssue(issue)}
          >
            <Text className={`font-medium ${selectedIssue?.id === issue.id ? 'text-indigo-700' : 'text-gray-700'}`} numberOfLines={1}>
              {issue.title}
            </Text>
            <Text className="text-xs text-gray-500 mt-1" numberOfLines={2}>
              {issue.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  // Render a resolved chat item
  const renderResolvedChatItem = ({ item }) => {
    const resolvedDate = item.resolvedAt?.toDate?.() || 
                          new Date(item.resolvedAt?.seconds * 1000) || 
                          new Date();
    
    return (
      <View className="bg-white rounded-lg p-4 mb-3 border border-gray-100 shadow-sm">
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <MaterialIcons name="check-circle" size={16} color="#10b981" />
            <Text className="font-medium text-gray-800 ml-1">{item.topic || 'Support Issue'}</Text>
          </View>
          <View className="bg-green-100 px-2 py-0.5 rounded-full">
            <Text className="text-green-700 text-xs font-medium">Resolved</Text>
          </View>
        </View>
        
        <View className="flex-row items-center mt-2">
          <Image
            source={DEFAULT_PROFILE_IMAGE}
            style={{ height: 20, width: 20, borderRadius: 10 }}
            className="bg-gray-200"
          />
          <Text className="text-gray-600 text-xs ml-1">
            {item.assignedAgentName || 'Support Agent'}
          </Text>
        </View>
        
        <View className="flex-row items-center mt-2">
          <Ionicons name="time-outline" size={14} color="#6b7280" />
          <Text className="text-gray-500 text-xs ml-1">
            {resolvedDate.toLocaleDateString()} at {resolvedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  // Render active support agent card
  const renderActiveAgentCard = () => (
    <View className="mb-4">
      <LinearGradient
        colors={['#4338ca', '#6366f1']}
        start={[0, 0]}
        end={[1, 0]}
        className="rounded-xl overflow-hidden shadow-lg"
      >
        <TouchableOpacity
          className="p-4"
          onPress={() => openChat(activeChat)}
        >
          <View className="flex-row">
            <Image
              source={!activeChat.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: activeChat.photoURL }}
              style={{ height: hp(10), width: hp(10), borderRadius: 100 }}
              placeholder={blurhash}
              className="bg-gray-200 border-2 border-white"
            />
              
            <View className="ml-4 flex-1 justify-center">
              <Text className="text-white text-lg font-bold">
                {activeChat.fullName || `${activeChat.firstName || ''} ${activeChat.lastName || ''}`}
              </Text>
              <View className="flex-row items-center mt-1">
                <MaterialIcons name="support-agent" size={16} color="rgba(255,255,255,0.8)" />
                <Text className="text-white/80 font-medium ml-1">
                  {activeChat.role === 'customerAssistance' ? 'Customer Assistance' : 
                   activeChat.role === 'admin' ? 'Administrator' : 
                   activeChat.role === 'manager' ? 'Manager' : 'Support Staff'}
                </Text>
              </View>
              <View className="bg-white/20 rounded-full px-3 py-1 mt-2 self-start">
                <Text className="text-white text-xs font-medium">
                  Active Support Session
                </Text>
              </View>
            </View>
          </View>
            
          <View className="flex-row mt-4">
            <TouchableOpacity
              className="bg-white rounded-full px-4 py-2.5 mr-3 flex-1 flex-row items-center justify-center shadow-sm"
              style={{
                shadowColor: 'rgba(0,0,0,0.3)',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
              }}
              onPress={() => openChat(activeChat)}
            >
              <Ionicons name="chatbubble" size={16} color="#4f46e5" />
              <Text className="text-indigo-600 font-bold ml-2">Continue Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-green-500 rounded-full px-4 py-2.5 flex-1 flex-row items-center justify-center shadow-sm"
              style={{
                shadowColor: 'rgba(0,0,0,0.3)',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1.5,
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                markIssueAsResolved();
              }}
            >
              <MaterialIcons name="check-circle" size={16} color="white" />
              <Text className="text-white font-bold ml-2">Resolve Issue</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </LinearGradient>
      
      {!tempSupportData.topic && !tempSupportData.message && (
        <View className="bg-amber-50 p-4 rounded-lg mt-4 border border-amber-200">
          <View className="flex-row items-center">
            <Ionicons name="information-circle" size={20} color="#d97706" />
            <Text className="font-medium text-amber-800 ml-2">
              Active Support Session
            </Text>
          </View>
          <Text className="text-amber-700 text-sm mt-2">
            Please continue your conversation with the assigned agent. 
            To start a new issue, mark your current issue as resolved first.
          </Text>
        </View>
      )}
    </View>
  );

  // Render the custom alert modal
  const renderCustomAlert = () => {
    // Define alert theme based on type
    const alertTheme = {
      info: {
        bg: 'bg-indigo-100',
        text: 'text-indigo-800',
        icon: <Ionicons name="information-circle" size={28} color="#4f46e5" />,
        iconBg: 'bg-indigo-200'
      },
      success: {
        bg: 'bg-green-100',
        text: 'text-green-800',
        icon: <Ionicons name="checkmark-circle" size={28} color="#10b981" />,
        iconBg: 'bg-green-200'
      },
      warning: {
        bg: 'bg-amber-100',
        text: 'text-amber-800',
        icon: <Ionicons name="warning" size={28} color="#f59e0b" />,
        iconBg: 'bg-amber-200'
      },
      error: {
        bg: 'bg-red-100',
        text: 'text-red-800',
        icon: <Ionicons name="close-circle" size={28} color="#ef4444" />,
        iconBg: 'bg-red-200'
      }
    };
    
    const theme = alertTheme[customAlert.type] || alertTheme.info;

    return (
      <Modal
        visible={customAlert.visible}
        transparent={true}
        animationType="none"
        onRequestClose={() => hideAlert()}
      >
        <View className="flex-1 bg-black/40 justify-center items-center px-6">
          <Animated.View 
            className={`w-full rounded-xl overflow-hidden ${theme.bg} shadow-lg`}
            style={{
              transform: [
                { scale: alertAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.9, 1]
                }) }
              ],
              opacity: alertAnim
            }}
          >
            <View className="px-5 pt-5 pb-4">
              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 rounded-full ${theme.iconBg} items-center justify-center mr-3`}>
                  {theme.icon}
                </View>
                <Text className={`text-lg font-bold ${theme.text}`}>{customAlert.title}</Text>
              </View>
              
              <Text className="text-gray-700 mb-4">{customAlert.message}</Text>
              
              <View className={customAlert.buttons.length > 1 ? "flex-row justify-end" : "items-center"}>
                {customAlert.buttons.map((button, index) => (
                  <TouchableOpacity
                    key={index}
                    className={`py-2 px-4 rounded-lg ${
                      index === customAlert.buttons.length - 1 
                        ? 'bg-indigo-600' 
                        : 'bg-gray-200 mr-2'
                    }`}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      button.onPress && button.onPress();
                    }}
                  >
                    <Text 
                      className={index === customAlert.buttons.length - 1 
                        ? 'text-white font-semibold' 
                        : 'text-gray-700 font-medium'
                      }
                    >
                      {button.text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" backgroundColor="#f9fafb" />
      
      {/* Header */}
      <LinearGradient
        colors={['#f9fafb', '#f3f4f6']}
        className="py-4 px-4 border-b border-gray-200"
      >
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xl font-bold text-gray-800">Customer Support</Text>
            <Text className="text-sm text-gray-500">
              Get personal assistance from our team
            </Text>
          </View>
          <TouchableOpacity
            className="bg-indigo-100 p-2 rounded-full"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              fetchSupportAgents();
              fetchResolvedIssues();
            }}
          >
            <Ionicons name="refresh" size={20} color="#4f46e5" />
          </TouchableOpacity>
        </View>
      </LinearGradient>
      
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
            <Text className="text-gray-500 mt-4">Connecting to support...</Text>
          </View>
        ) : activeChat ? (
          <>
            {/* Support agent card for current chat */}
            {renderActiveAgentCard()}
            
            {tempSupportData.topic && tempSupportData.message ? (
              <View className="bg-indigo-50 p-4 rounded-lg mb-4 border border-indigo-100">
                <View className="flex-row items-center justify-between">
                  <Text className="font-semibold text-indigo-800 text-base">Your Support Request</Text>
                  <TouchableOpacity 
                    className="bg-indigo-100 p-1 rounded-full"
                    onPress={() => setTempSupportData({})}
                  >
                    <Ionicons name="close" size={16} color="#4f46e5" />
                  </TouchableOpacity>
                </View>
                <Text className="text-indigo-600 text-sm mb-3 mt-1">Please select a support agent below to handle your request</Text>
                <View className="bg-white p-3 rounded-md mb-2 shadow-sm">
                  <Text className="text-xs text-gray-500 mb-1">Topic</Text>
                  <Text className="text-gray-800 font-medium">{tempSupportData.topic}</Text>
                </View>
                <View className="bg-white p-3 rounded-md shadow-sm">
                  <Text className="text-xs text-gray-500 mb-1">Message</Text>
                  <Text className="text-gray-800" numberOfLines={2}>{tempSupportData.message}</Text>
                </View>
              </View>
            ) : null}
            
            {/* Show other agents only if there's a new support request */}
            {tempSupportData.topic && tempSupportData.message && (
              <>
                <View className="flex-row items-center mb-3 mt-2">
                  <View className="flex-1 h-0.5 bg-gray-200" />
                  <Text className="mx-4 font-semibold text-gray-700">
                    Choose a Support Agent
                  </Text>
                  <View className="flex-1 h-0.5 bg-gray-200" />
                </View>
                
                <FlatList
                  data={filteredAgents.filter(agent => agent.uid !== activeChat.uid)}
                  keyExtractor={(item) => item.uid}
                  renderItem={renderAgentItem}
                  ListEmptyComponent={renderEmptyAgentsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </>
            )}
          </>
        ) : (
          <>
            {tempSupportData.topic && tempSupportData.message ? (
              <>
                <View className="bg-indigo-50 p-4 rounded-xl mb-4 border border-indigo-100 shadow-sm">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-semibold text-indigo-800 text-base">Your Support Request</Text>
                    <TouchableOpacity 
                      className="bg-indigo-100 p-1 rounded-full"
                      onPress={() => setTempSupportData({})}
                    >
                      <Ionicons name="close" size={16} color="#4f46e5" />
                    </TouchableOpacity>
                  </View>
                  <Text className="text-indigo-600 text-sm mb-3 mt-1">Please select a support agent below to handle your request</Text>
                  <View className="bg-white p-3 rounded-md mb-2 shadow-sm">
                    <Text className="text-xs text-gray-500 mb-1">Topic</Text>
                    <Text className="text-gray-800 font-medium">{tempSupportData.topic}</Text>
                  </View>
                  <View className="bg-white p-3 rounded-md shadow-sm">
                    <Text className="text-xs text-gray-500 mb-1">Message</Text>
                    <Text className="text-gray-800" numberOfLines={2}>{tempSupportData.message}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-3">
                  <View className="flex-1 h-0.5 bg-gray-200" />
                  <Text className="mx-4 font-semibold text-gray-700">
                    Choose a Support Agent
                  </Text>
                  <View className="flex-1 h-0.5 bg-gray-200" />
                </View>
                
                <FlatList
                  data={filteredAgents}
                  keyExtractor={(item) => item.uid}
                  renderItem={renderAgentItem}
                  ListEmptyComponent={renderEmptyAgentsList}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 20 }}
                />
              </>
            ) : (
              <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 }}
              >
                {/* Category tabs */}
                {renderCategoryTabs()}
                
                {selectedCategory === 'active' ? (
                  /* Show empty state if no active chats */
                  renderEmptyState()
                ) : (
                  /* Show resolved issues */
                  <View className="flex-1">
                    {resolvedChats.length > 0 ? (
                      <FlatList
                        data={resolvedChats}
                        keyExtractor={(item) => item.issueId}
                        renderItem={renderResolvedChatItem}
                        ListHeaderComponent={() => (
                          <Text className="text-lg font-semibold text-gray-800 mb-3">Past Support Issues</Text>
                        )}
                        scrollEnabled={false}
                        contentContainerStyle={{ paddingBottom: 40 }}
                      />
                    ) : (
                      <View className="flex-1 justify-center items-center p-10">
                        <MaterialIcons name="history" size={60} color="#d1d5db" />
                        <Text className="text-gray-700 text-lg font-medium mt-4 text-center">No Resolved Issues</Text>
                        <Text className="text-gray-500 text-center mt-2">
                          You don't have any past support issues yet.
                        </Text>
                      </View>
                    )}
                  </View>
                )}
              </ScrollView>
            )}
          </>
        )}
      </Animated.View>
      
      {/* FAB for new support request - only show if no active issues */}
      {!newSupportRequest && !tempSupportData.topic && !activeChat && (
        <TouchableOpacity
          className="absolute right-6 bottom-6 bg-indigo-600 w-14 h-14 rounded-full justify-center items-center shadow-lg"
          style={{
            shadowColor: '#4338ca',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.3,
            shadowRadius: 5,
            elevation: 5
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setNewSupportRequest(true);
          }}
        >
          <Feather name="plus" size={24} color="white" />
        </TouchableOpacity>
      )}
      
      {/* New Support Request Modal */}
      <Modal
        visible={newSupportRequest}
        transparent={true}
        animationType="none"
        onRequestClose={() => setNewSupportRequest(false)}
      >
        <Pressable 
          className="flex-1 bg-black/30"
          onPress={() => {
            Keyboard.dismiss();
          }}
        >
          <View className="flex-1 justify-end">
            <Animated.View 
              className="bg-white rounded-t-2xl"
              style={{
                transform: [
                  { translateY: modalSlideAnim },
                  { scale: scaleAnim }
                ],
              }}
            >
              <View className="p-5">
                <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-4" />
                
                {/* Progress indicator */}
                <View className="w-full h-1 bg-gray-200 rounded-full mb-5">
                  <Animated.View 
                    className="h-1 bg-indigo-500 rounded-full"
                    style={{
                      width: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['50%', '100%']
                      })
                    }}
                  />
                </View>
                
                {/* Header */}
                <View className="flex-row justify-between items-center mb-4">
                  <View>
                    <Text className="text-2xl font-bold text-gray-800">
                      {modalStep === 1 ? "Select Topic" : "Describe Issue"}
                    </Text>
                    <Text className="text-sm text-gray-500">
                      {modalStep === 1 
                        ? "Choose a topic for your support request" 
                        : "Provide details about your issue"}
                    </Text>
                  </View>
                  <View className="bg-indigo-100 w-8 h-8 rounded-full items-center justify-center">
                    <Text className="text-indigo-700 font-bold">{modalStep}/2</Text>
                  </View>
                </View>
                
                {/* Step 1: Topic Selection */}
                {modalStep === 1 && (
                  <>
                    {renderTopicDropdown()}
                    {supportTopic && renderMessagePreview()}
                  </>
                )}
                
                {/* Step 2: Message Input */}
                {modalStep === 2 && (
                  <>
                    <View className="mb-6">
                      <View className="flex-row items-center mb-2">
                        <MaterialIcons name="message" size={18} color="#4f46e5" />
                        <Text className="text-gray-700 font-medium ml-2">Message</Text>
                        <Text className="text-xs text-indigo-600 ml-2">(your first message to agent)</Text>
                      </View>
                      <TextInput
                        className="bg-gray-100 p-4 rounded-xl mb-1 text-gray-800"
                        placeholder="Describe your issue in detail..."
                        value={supportMessage}
                        onChangeText={setSupportMessage}
                        multiline
                        textAlignVertical="top"
                        style={{ minHeight: messageInputHeight }}
                        onContentSizeChange={(e) => {
                          const height = Math.max(120, Math.min(200, e.nativeEvent.contentSize.height));
                          setMessageInputHeight(height);
                        }}
                        placeholderTextColor="#9ca3af"
                      />
                      <Text className="text-xs text-gray-500 ml-2">
                        Please provide as much detail as possible to help us assist you better
                      </Text>
                    </View>
                    
                    {renderMessagePreview()}
                    
                    <View className="bg-indigo-50 p-3 rounded-lg mb-4 border border-indigo-100">
                      <View className="flex-row items-center">
                        <Ionicons name="information-circle" size={18} color="#4f46e5" />
                        <Text className="text-indigo-600 font-medium ml-2">Next Steps</Text>
                      </View>
                      <Text className="text-indigo-600 text-sm mt-2">
                        After submitting, you'll be able to select a support agent who will help you resolve your issue.
                      </Text>
                    </View>
                  </>
                )}
                
                {/* Navigation Buttons */}
                <View className="flex-row mb-3">
                  <TouchableOpacity
                    className="bg-gray-200 py-3.5 rounded-xl flex-1 mr-2 flex-row justify-center items-center"
                    onPress={goToPreviousStep}
                  >
                    <Text className="text-gray-700 font-medium">
                      {modalStep === 1 ? "Cancel" : "Back"}
                    </Text>
                  </TouchableOpacity>
                  
                  <LinearGradient
                    colors={['#4f46e5', '#6366f1']}
                    className="rounded-xl flex-1"
                    start={[0, 0]}
                    end={[1, 0]}
                  >
                    <TouchableOpacity
                      className="py-3.5 rounded-xl flex-row justify-center items-center"
                      onPress={goToNextStep}
                      disabled={loading}
                    >
                      {loading ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <MaterialIcons 
                            name={modalStep === 1 ? "arrow-forward" : "send"} 
                            size={20} 
                            color="white" 
                          />
                          <Text className="text-white font-bold text-center ml-2">
                            {modalStep === 1 ? "Continue" : "Submit Request"}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </LinearGradient>
                </View>
              </View>
            </Animated.View>
          </View>
        </Pressable>
      </Modal>
      
      {/* Render custom alert */}
      {renderCustomAlert()}
    </SafeAreaView>
  );
} 