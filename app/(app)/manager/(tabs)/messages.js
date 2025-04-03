import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator 
} from 'react-native';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';

import { useAuth } from '../../../context/authContext';
import { blurhash } from '../../../utills/common';
import HomeHeader from '../../../components/HomeHeader';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit 
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebaseConfig';

const DEFAULT_PROFILE_IMAGE = require('../../../../assets/images/PrifileDemo.png');

export default function MessagesTab() {
  const router = useRouter();
  const { userData } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentChats, setRecentChats] = useState([]);

  useEffect(() => {
    if (!userData?.uid) return;
    fetchRecentChats();
  }, [userData?.uid]);

  const fetchRecentChats = async () => {
    if (!userData?.uid) return;
    
    try {
      setLoading(true);
      
      // Get recent chats for this user
      const chatsQuery = query(
        collection(db, 'users', userData.uid, 'chats'),
        orderBy('updatedAt', 'desc'),
        limit(20)
      );
      
      const querySnapshot = await getDocs(chatsQuery);
      
      // Map chat data and fetch user information
      const chatsData = [];
      
      for (const doc of querySnapshot.docs) {
        const chatData = doc.data();
        
        // Add to list
        chatsData.push({
          id: doc.id,
          participantId: chatData.participantId,
          participantName: chatData.participantName,
          participantPhoto: chatData.participantPhoto,
          participantRole: chatData.participantRole,
          lastMessage: chatData.lastMessage,
          updatedAt: chatData.updatedAt,
          unreadCount: chatData.unreadCount || 0
        });
      }
      
      setRecentChats(chatsData);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    } finally {
      setLoading(false);
    }
  };

  const openSystemChat = () => {
    router.push('/manager/systemChat');
  };

  const openChat = (participant) => {
    router.push({
      pathname: '/(app)/chatRoom',
      params: {
        uid: participant.participantId,
        fullName: participant.participantName,
        photoURL: participant.participantPhoto,
        role: participant.participantRole
      }
    });
  };

  const renderChatItem = ({ item }) => {
    const timeFormatted = item.lastMessage?.timestamp?.toDate
      ? formatMessageTime(item.lastMessage.timestamp.toDate())
      : '';
    
    // Get role color
    const getRoleColor = (role) => {
      switch(role) {
        case 'admin': return '#ef4444';
        case 'manager': return '#8b5cf6';
        case 'supplier': return '#f59e0b';
        case 'customer': return '#10b981';
        case 'customerAssistance': return '#6366f1';
        default: return '#6b7280';
      }
    };

    return (
      <TouchableOpacity
        className="mb-3 p-3 bg-white rounded-xl border border-gray-100"
        onPress={() => openChat(item)}
      >
        <View className="flex-row items-center">
          <View className="relative">
            <Image
              source={!item.participantPhoto ? DEFAULT_PROFILE_IMAGE : { uri: item.participantPhoto }}
              style={{ height: hp(7), width: hp(7), borderRadius: 16 }}
              placeholder={blurhash}
              className="bg-gray-100"
              contentFit="cover"
            />
            <View
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: getRoleColor(item.participantRole) }}
            />
          </View>
          
          <View className="ml-3 flex-1">
            <View className="flex-row justify-between items-center">
              <Text className="font-bold text-gray-800" numberOfLines={1}>
                {item.participantName}
              </Text>
              <Text className="text-xs text-gray-500">
                {timeFormatted}
              </Text>
            </View>
            
            <Text className="text-gray-500 mt-1" numberOfLines={1}>
              {item.lastMessage?.senderId === userData.uid ? 'You: ' : ''}
              {item.lastMessage?.text || 'No messages yet'}
            </Text>
          </View>
          
          {item.unreadCount > 0 && (
            <View className="bg-blue-500 h-6 min-w-[24px] rounded-full items-center justify-center ml-2">
              <Text className="text-white text-xs font-bold">
                {item.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const formatMessageTime = (date) => {
    if (!date) return '';
    
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
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      {/* Custom Header with more visible navigation */}
      <View className="bg-white px-4 py-3 flex-row items-center justify-between border-b border-gray-200">
        <Text className="text-xl font-bold text-gray-800">Messages</Text>
        
        <TouchableOpacity 
          className="bg-blue-500 px-3 py-2 rounded-lg flex-row items-center"
          onPress={openSystemChat}
        >
          <Feather name="users" size={18} color="white" />
          <Text className="text-white font-medium ml-1">All Users</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-600 mt-4">Loading conversations...</Text>
        </View>
      ) : recentChats.length === 0 ? (
        <View className="flex-1 justify-center items-center p-6">
          <View className="bg-gray-50 p-8 rounded-full mb-4">
            <MaterialCommunityIcons name="message-text-outline" size={60} color="#d1d5db" />
          </View>
          <Text className="text-gray-700 text-lg font-semibold mb-2 text-center">
            No Messages Yet
          </Text>
          <Text className="text-gray-500 text-base text-center mb-8">
            Use the "All Users" button above to browse and message anyone in your organization.
          </Text>
          <TouchableOpacity
            className="bg-blue-500 py-3 px-6 rounded-full shadow-md flex-row items-center"
            onPress={openSystemChat}
          >
            <Feather name="users" size={18} color="white" />
            <Text className="text-white font-semibold ml-2">Browse All Users</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={recentChats}
          keyExtractor={(item) => item.id}
          renderItem={renderChatItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onRefresh={fetchRecentChats}
          refreshing={loading}
        />
      )}
    </SafeAreaView>
  );
} 