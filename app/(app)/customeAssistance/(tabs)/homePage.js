import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  FlatList,
  Animated,
  Dimensions,
  Pressable,
  Platform,
  Vibration,
  StatusBar,
  ImageBackground,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import HomeHeader from '../../../components/HomeHeader';

const { width, height } = Dimensions.get('window');

export default function CustomerAssistanceHome() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [recentChats, setRecentChats] = useState([]);
  const [supportAgents, setSupportAgents] = useState([]);
  const [popularTopics, setPopularTopics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [activeComplaintTab, setActiveComplaintTab] = useState('incoming');
  const [activeChatTab, setActiveChatTab] = useState('customers');
  
  // Quick Actions
  const [quickActions, setQuickActions] = useState([
    {
      id: '1',
      title: 'Live Chat',
      icon: 'chatbubble-ellipses',
      color: '#2563eb',
      action: 'chat'
    },
    {
      id: '2',
      title: 'Complaints',
      icon: 'warning',
      color: '#d97706',
      action: 'complaint'
    },
    {
      id: '3',
      title: 'FAQs',
      icon: 'help-buoy',
      color: '#16a34a',
      action: 'faq'
    },
    {
      id: '4',
      title: 'Contact',
      icon: 'call',
      color: '#8b5cf6',
      action: 'contact'
    }
  ]);
  
  // Complaints data
  const [complaints, setComplaints] = useState({
    incoming: [
      { id: '1', customer: 'John Doe', subject: 'Wrong item delivered', priority: 'high', time: '10 min ago', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
      { id: '2', customer: 'Sarah Miller', subject: 'App payment issue', priority: 'medium', time: '25 min ago', avatar: 'https://randomuser.me/api/portraits/women/55.jpg' },
      { id: '3', customer: 'Mike Chen', subject: 'Damaged product', priority: 'high', time: '1 hr ago', avatar: 'https://randomuser.me/api/portraits/men/44.jpg' },
    ],
    resolved: [
      { id: '4', customer: 'Emma Wilson', subject: 'Late delivery refund', priority: 'medium', time: 'Yesterday', resolvedBy: 'Sarah Johnson', avatar: 'https://randomuser.me/api/portraits/women/22.jpg' },
      { id: '5', customer: 'Alex Thompson', subject: 'Missing items', priority: 'low', time: '2 days ago', resolvedBy: 'Michael Chen', avatar: 'https://randomuser.me/api/portraits/men/67.jpg' },
    ],
    transferred: [
      { id: '6', customer: 'Lisa Kim', subject: 'Account security concern', priority: 'high', time: 'Yesterday', transferredTo: 'Technical Manager', avatar: 'https://randomuser.me/api/portraits/women/33.jpg' },
      { id: '7', customer: 'David Wright', subject: 'Pricing discrepancy', priority: 'medium', time: '3 days ago', transferredTo: 'Finance Manager', avatar: 'https://randomuser.me/api/portraits/men/22.jpg' },
    ]
  });
  
  // Contact methods
  const [contactMethods, setContactMethods] = useState([
    { id: '1', type: 'Phone', value: '+1 (800) 123-4567', icon: 'call', color: '#10b981', status: 'active' },
    { id: '2', type: 'Email', value: 'support@supermarket.com', icon: 'mail', color: '#3b82f6', status: 'active' },
    { id: '3', type: 'WhatsApp', value: '+1 (800) 987-6543', icon: 'logo-whatsapp', color: '#25d366', status: 'active' },
    { id: '4', type: 'Twitter', value: '@SupermarketHelp', icon: 'logo-twitter', color: '#1da1f2', status: 'inactive' },
  ]);
  
  // Employee chat data
  const [employeeChats, setEmployeeChats] = useState([
    { id: '1', name: 'James Wilson', role: 'Inventory Manager', lastMessage: 'I need help with the delivery system', time: '5 min ago', unread: 2, avatar: 'https://randomuser.me/api/portraits/men/42.jpg' },
    { id: '2', name: 'Maria Garcia', role: 'Cashier', lastMessage: 'When is the next staff meeting?', time: '2 hours ago', unread: 0, avatar: 'https://randomuser.me/api/portraits/women/28.jpg' },
  ]);
  
  // Performance metrics
  const [metrics, setMetrics] = useState({
    resolutionRate: 94,
    avgResponseTime: '2.5 min',
    customerSatisfaction: 4.8,
    activeTickets: 12
  });
  
  // Animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(30)).current;
  const searchBarWidth = useRef(new Animated.Value(width - 32)).current;
  
  // Tab indicator animation
  const tabIndicatorPosition = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
    
    fetchData();
  }, []);
  
  useEffect(() => {
    // Animate tab indicator
    Animated.spring(tabIndicatorPosition, {
      toValue: activeTab === 'dashboard' ? 0 
              : activeTab === 'chats' ? 1 
              : activeTab === 'complaints' ? 2 
              : activeTab === 'faq' ? 3
              : 4, // Now contact is the 5th tab (index 4)
      friction: 8,
      tension: 50,
      useNativeDriver: true,
    }).start();
  }, [activeTab]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Sample data - would be replaced with actual Firestore queries
      setSupportAgents([
        {
          id: '1',
          name: 'Sarah Johnson',
          role: 'Customer Support Lead',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          rating: 4.9,
          isOnline: true,
          responseTime: '~5 min'
        },
        {
          id: '2',
          name: 'Michael Chen',
          role: 'Product Specialist',
          avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
          rating: 4.7,
          isOnline: true,
          responseTime: '~10 min'
        },
        {
          id: '3',
          name: 'Aisha Patel',
          role: 'Technical Support',
          avatar: 'https://randomuser.me/api/portraits/women/66.jpg',
          rating: 4.8,
          isOnline: false,
          responseTime: '~30 min'
        },
      ]);
      
      setRecentChats([
        {
          id: '1',
          name: 'Sarah Johnson',
          avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
          lastMessage: 'Your order #12345 has been processed',
          time: '10:23 AM',
          unread: 2,
          isOnline: true,
        },
        {
          id: '2',
          name: 'Technical Support',
          avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
          lastMessage: 'Have you tried resetting your password?',
          time: 'Yesterday',
          unread: 0,
          isOnline: false,
        }
      ]);
      
      setPopularTopics([
        {
          id: '1',
          title: 'Return Policy',
          icon: 'refresh-circle',
          color: '#4f46e5',
          questions: 124
        },
        {
          id: '2',
          title: 'Shipping Info',
          icon: 'cube',
          color: '#0891b2',
          questions: 98
        },
        {
          id: '3',
          title: 'Payment Methods',
          icon: 'card',
          color: '#0ea5e9',
          questions: 76
        },
        {
          id: '4',
          title: 'Account Help',
          icon: 'person-circle',
          color: '#8b5cf6',
          questions: 63
        },
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
  };

  const handleComplaintTabChange = (tab) => {
    setActiveComplaintTab(tab);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
  };

  const handleChatTabChange = (tab) => {
    setActiveChatTab(tab);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(10);
      }
    } else {
      Vibration.vibrate(10);
    }
  };
  
  const navigateToChat = (id, isEmployee = false) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
    
    router.push({
      pathname: "/customeAssistance/ChatDetail",
      params: { id, isEmployee }
    });
  };
  
  const navigateToComplaint = (id) => {
    router.push({
      pathname: "/customeAssistance/handleCustomerComplient",
      params: { id }
    });
  };
  
  const navigateToSupport = () => {
    router.push("/customeAssistance/customerSuport");
  };
  
  const navigateToTopicDetail = (topicId, title) => {
    router.push({
      pathname: "/customeAssistance/TopicDetail",
      params: { topicId, title }
    });
  };

  const navigateToContactSettings = () => {
    router.push("/customeAssistance/manageContactMethods");
  };
  
  const handleQuickAction = (action) => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
    
    switch(action) {
      case 'chat':
        handleTabChange('chats');
        break;
      case 'complaint':
        handleTabChange('complaints');
        break;
      case 'faq':
        handleTabChange('faq');
        break;
      case 'contact':
        handleTabChange('contact');
        break;
      default:
        break;
    }
  };

  const handleResolveComplaint = (id) => {
    // Update complaints state by moving the complaint from incoming to resolved
    setComplaints(prev => {
      const complaint = prev.incoming.find(c => c.id === id);
      if (!complaint) return prev;
      
      const newIncoming = prev.incoming.filter(c => c.id !== id);
      const updatedComplaint = { ...complaint, resolvedBy: 'You', time: 'Just now' };
      
      return {
        ...prev,
        incoming: newIncoming,
        resolved: [updatedComplaint, ...prev.resolved]
      };
    });
    
    // Show success message
    Alert.alert('Success', 'Complaint marked as resolved');
  };

  const handleTransferComplaint = (id) => {
    // Update complaints state by moving the complaint from incoming to transferred
    setComplaints(prev => {
      const complaint = prev.incoming.find(c => c.id === id);
      if (!complaint) return prev;
      
      const newIncoming = prev.incoming.filter(c => c.id !== id);
      const updatedComplaint = { 
        ...complaint, 
        transferredTo: 'Department Manager', 
        time: 'Just now' 
      };
      
      return {
        ...prev,
        incoming: newIncoming,
        transferred: [updatedComplaint, ...prev.transferred]
      };
    });
    
    // Show success message
    Alert.alert('Transferred', 'Complaint transferred to manager');
  };

  const toggleContactMethodStatus = (id) => {
    setContactMethods(prev => 
      prev.map(method => 
        method.id === id 
          ? { ...method, status: method.status === 'active' ? 'inactive' : 'active' } 
          : method
      )
    );
  };
  
  const handleSearchFocus = () => {
    setIsSearchFocused(true);
    // Animate the search bar width
    Animated.timing(searchBarWidth, {
      toValue: width - 100,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  const handleSearchBlur = () => {
    if (!searchQuery) {
      setIsSearchFocused(false);
      // Animate the search bar width back
      Animated.timing(searchBarWidth, {
        toValue: width - 32,
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  };
  
  const clearSearch = () => {
    setSearchQuery('');
    setIsSearchFocused(false);
    // Animate the search bar width back
    Animated.timing(searchBarWidth, {
      toValue: width - 32,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };
  
  // Calculate header opacity based on scroll position
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // Calculate header scale based on scroll position
  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp',
  });
  
  const renderSupportAgentCard = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigateToChat(item.id)}
      className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm"
    >
      <View className="flex-row p-4">
        <View className="relative">
          <Image
            source={{ uri: item.avatar }}
            className="w-16 h-16 rounded-full"
          />
          {item.isOnline && (
            <View className="absolute right-0 bottom-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></View>
          )}
        </View>
        
        <View className="ml-4 flex-1 justify-center">
          <View className="flex-row justify-between items-center">
            <Text className="text-lg font-bold text-gray-800">{item.name}</Text>
            <View className="flex-row items-center">
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text className="text-gray-600 font-medium ml-1">{item.rating}</Text>
            </View>
          </View>
          
          <Text className="text-gray-500 text-sm mb-1">{item.role}</Text>
          
          <View className="flex-row items-center">
            <View className="flex-row items-center bg-blue-50 rounded-full px-2 py-1">
              <Ionicons name="time-outline" size={12} color="#3b82f6" />
              <Text className="text-blue-600 text-xs ml-1">{item.responseTime}</Text>
            </View>
            <Text className="text-gray-400 text-xs ml-2">{item.isOnline ? 'Online' : 'Offline'}</Text>
          </View>
        </View>
      </View>
      
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']}
        className="p-3 flex-row justify-between items-center"
      >
        <Text className="text-blue-700 text-sm font-medium">Chat now</Text>
        <Ionicons name="chatbubble-ellipses-outline" size={18} color="#3b82f6" />
      </LinearGradient>
    </TouchableOpacity>
  );
  
  const renderChatItem = ({ item }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigateToChat(item.id)}
      className="flex-row items-center bg-white p-4 rounded-xl mb-3 shadow-sm"
    >
      <View className="relative">
        <Image
          source={{ uri: item.avatar }}
          className="w-12 h-12 rounded-full"
        />
        {item.unread > 0 && (
          <View className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[18px] h-[18px] flex items-center justify-center">
            <Text className="text-white text-[10px] font-bold">{item.unread}</Text>
          </View>
        )}
      </View>
      
      <View className="ml-3 flex-1">
        <View className="flex-row justify-between">
          <Text className="font-semibold text-gray-800">{item.name}</Text>
          <Text className="text-xs text-gray-500">{item.time}</Text>
        </View>
        <Text className="text-gray-500 text-sm" numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );
  
  const renderTopicItem = ({ item, index }) => (
    <TouchableOpacity 
      activeOpacity={0.7}
      onPress={() => navigateToTopicDetail(item.id, item.title)}
      className="w-[48%] mb-4"
      style={{ marginRight: index % 2 === 0 ? '4%' : 0 }}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        className="p-4 rounded-xl border border-gray-100 h-36 justify-between"
      >
        <View className="w-10 h-10 rounded-full justify-center items-center mb-2" style={{ backgroundColor: item.color + '20' }}>
          <Ionicons name={item.icon} size={24} color={item.color} />
        </View>
        
        <View>
          <Text className="text-gray-800 font-bold text-base mb-1">{item.title}</Text>
          <View className="flex-row items-center">
            <Text className="text-gray-500 text-xs">{item.questions} questions</Text>
            <View className="flex-row items-center ml-auto">
              <Text className="text-xs font-medium mr-1" style={{ color: item.color }}>View</Text>
              <Ionicons name="chevron-forward" size={12} color={item.color} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
  
  // New function to navigate to manage FAQ page
  const navigateToManageFAQ = () => {
    router.push("/customeAssistance/manageFAQ");
  };

  // Add navigateToAddFAQ function
  const navigateToAddFAQ = () => {
    router.push("/customeAssistance/addFAQ");
  };
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <HomeHeader title="Customer Support" />
      
      <Animated.ScrollView
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <Animated.View 
          className="px-4 pt-4 pb-2"
          style={{ 
            opacity: fadeAnim,
            transform: [{ translateY: translateY }],
            zIndex: 20,
          }}
        >
          {/* Search Bar */}
          <View className="flex-row items-center">
            <Animated.View 
              className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3"
              style={{ width: searchBarWidth }}
            >
              <Ionicons name="search" size={20} color="#9ca3af" />
              <TextInput
                className="flex-1 ml-2 text-gray-700"
                placeholder="Search for help..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
              />
              {isSearchFocused && (
                <TouchableOpacity onPress={clearSearch}>
                  <Ionicons name="close-circle" size={20} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </Animated.View>
            
            {isSearchFocused && (
              <TouchableOpacity 
                className="ml-2 px-3 py-2"
                onPress={clearSearch}
              >
                <Text className="text-blue-600 font-medium">Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
        
        {/* Tab Navigation */}
        <View className="px-4 mb-4">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            className="mt-6"
            contentContainerStyle={{ paddingRight: 20 }}
          >
            <TouchableOpacity 
              className={`flex-row items-center mr-6 ${activeTab === 'dashboard' ? 'opacity-100' : 'opacity-60'}`}
              onPress={() => handleTabChange('dashboard')}
            >
              <Ionicons 
                name={activeTab === 'dashboard' ? "grid" : "grid-outline"} 
                size={18} 
                color={activeTab === 'dashboard' ? "#3b82f6" : "#64748b"}
                className="mr-1"
              />
              <Text className={`font-medium ${activeTab === 'dashboard' ? 'text-blue-500' : 'text-gray-500'}`}>
                Dashboard
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center mr-6 ${activeTab === 'chats' ? 'opacity-100' : 'opacity-60'}`}
              onPress={() => handleTabChange('chats')}
            >
              <Ionicons 
                name={activeTab === 'chats' ? "chatbubble-ellipses" : "chatbubble-ellipses-outline"} 
                size={18} 
                color={activeTab === 'chats' ? "#3b82f6" : "#64748b"}
                className="mr-1"
              />
              <Text className={`font-medium ${activeTab === 'chats' ? 'text-blue-500' : 'text-gray-500'}`}>
                Chats
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center mr-6 ${activeTab === 'complaints' ? 'opacity-100' : 'opacity-60'}`}
              onPress={() => handleTabChange('complaints')}
            >
              <Ionicons 
                name={activeTab === 'complaints' ? "warning" : "warning-outline"} 
                size={18} 
                color={activeTab === 'complaints' ? "#3b82f6" : "#64748b"}
                className="mr-1"
              />
              <Text className={`font-medium ${activeTab === 'complaints' ? 'text-blue-500' : 'text-gray-500'}`}>
                Complaints
              </Text>
            </TouchableOpacity>
            
            {/* New FAQ Tab */}
            <TouchableOpacity 
              className={`flex-row items-center mr-6 ${activeTab === 'faq' ? 'opacity-100' : 'opacity-60'}`}
              onPress={() => handleTabChange('faq')}
            >
              <Ionicons 
                name={activeTab === 'faq' ? "help-buoy" : "help-buoy-outline"} 
                size={18} 
                color={activeTab === 'faq' ? "#3b82f6" : "#64748b"}
                className="mr-1"
              />
              <Text className={`font-medium ${activeTab === 'faq' ? 'text-blue-500' : 'text-gray-500'}`}>
                FAQs
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className={`flex-row items-center mr-6 ${activeTab === 'contact' ? 'opacity-100' : 'opacity-60'}`}
              onPress={() => handleTabChange('contact')}
            >
              <Ionicons 
                name={activeTab === 'contact' ? "call" : "call-outline"} 
                size={18} 
                color={activeTab === 'contact' ? "#3b82f6" : "#64748b"}
                className="mr-1"
              />
              <Text className={`font-medium ${activeTab === 'contact' ? 'text-blue-500' : 'text-gray-500'}`}>
                Contact
              </Text>
            </TouchableOpacity>
          </ScrollView>
          
          {/* Animated Tab Indicator */}
          <Animated.View
            className="h-0.5 bg-blue-500 rounded-full mt-2"
            style={{
              width: 20,
              position: 'absolute',
              bottom: 0,
              transform: [{ 
                translateX: tabIndicatorPosition.interpolate({
                  inputRange: [0, 1, 2, 3, 4],
                  outputRange: [40, 140, 250, 350, 450],
                })
              }],
            }}
          />
        </View>
        
        {/* Main Content */}
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateY }],
          }}
        >
          {activeTab === 'dashboard' && (
            <View className="px-4 pt-2">
              {/* Performance Metrics */}
              <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <Text className="text-lg font-bold text-gray-800 mb-3">Performance Metrics</Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-4 pr-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-2">
                        <Ionicons name="checkmark-circle" size={20} color="#3b82f6" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Resolution Rate</Text>
                        <Text className="text-base font-bold text-gray-800">{metrics.resolutionRate}%</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 mb-4 pl-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-2">
                        <Ionicons name="time-outline" size={20} color="#10b981" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Avg Response</Text>
                        <Text className="text-base font-bold text-gray-800">{metrics.avgResponseTime}</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 pr-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-2">
                        <Ionicons name="star" size={20} color="#f59e0b" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Satisfaction</Text>
                        <Text className="text-base font-bold text-gray-800">{metrics.customerSatisfaction}/5</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 pl-2">
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-2">
                        <Ionicons name="document-text-outline" size={20} color="#ef4444" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Active Tickets</Text>
                        <Text className="text-base font-bold text-gray-800">{metrics.activeTickets}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Quick Actions */}
              <View className="mb-6">
                <Text className="text-lg font-bold text-gray-800 mb-4">Quick Actions</Text>
                <View className="flex-row flex-wrap">
                  {quickActions.map((action, index) => (
                    <TouchableOpacity 
                      key={action.id || index}
                      activeOpacity={0.7} 
                      onPress={() => handleQuickAction(action.action)}
                      className="bg-white rounded-xl p-4 mr-3 mb-3 items-center justify-center"
                      style={{ width: (width - 64) / 2, height: 110 }}
                    >
                      <View className="h-12 w-12 rounded-full justify-center items-center mb-3" style={{ backgroundColor: action.color + '20' }}>
                        <Ionicons name={action.icon} size={26} color={action.color} />
                      </View>
                      <Text className="text-gray-800 text-sm font-medium text-center">{action.title}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              
              {/* Recent Activity */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-gray-800">Recent Activity</Text>
                  <TouchableOpacity>
                    <Text className="text-blue-600 text-sm">View All</Text>
                  </TouchableOpacity>
                </View>
                
                <View className="bg-white rounded-xl p-4 shadow-sm">
                  {[
                    { type: 'chat', message: 'New chat from John Doe', time: '5 min ago', icon: 'chatbubble-ellipses', color: '#3b82f6' },
                    { type: 'complaint', message: 'Resolved complaint #1234', time: '30 min ago', icon: 'checkmark-circle', color: '#10b981' },
                    { type: 'transfer', message: 'Complaint #5678 transferred to manager', time: '1 hour ago', icon: 'arrow-forward-circle', color: '#f59e0b' },
                  ].map((activity, index) => (
                    <View 
                      key={index} 
                      className={`flex-row py-3 ${index < 2 ? 'border-b border-gray-100' : ''}`}
                    >
                      <View 
                        className="w-10 h-10 rounded-full items-center justify-center mr-3" 
                        style={{ backgroundColor: activity.color + '15' }}
                      >
                        <Ionicons name={activity.icon} size={20} color={activity.color} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 mb-1">{activity.message}</Text>
                        <Text className="text-xs text-gray-500">{activity.time}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Support Team Section */}
              <View className="mb-6">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-lg font-bold text-gray-800">Support Team</Text>
                  <TouchableOpacity>
                    <Text className="text-blue-600 text-sm">View All</Text>
                  </TouchableOpacity>
                </View>
                
                {supportAgents.slice(0, 2).map(agent => (
                  <TouchableOpacity 
                    key={agent.id}
                    activeOpacity={0.7}
                    onPress={() => navigateToChat(agent.id)}
                    className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm"
                  >
                    <View className="flex-row p-4">
                      <View className="relative">
                        <Image
                          source={{ uri: agent.avatar }}
                          className="w-14 h-14 rounded-full"
                        />
                        {agent.isOnline && (
                          <View className="absolute right-0 bottom-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></View>
                        )}
                      </View>
                      
                      <View className="ml-3 flex-1 justify-center">
                        <View className="flex-row justify-between items-center">
                          <Text className="text-base font-bold text-gray-800">{agent.name}</Text>
                          <View className="flex-row items-center">
                            <Ionicons name="star" size={14} color="#f59e0b" />
                            <Text className="text-gray-600 font-medium ml-1">{agent.rating}</Text>
                          </View>
                        </View>
                        
                        <Text className="text-gray-500 text-sm mb-1">{agent.role}</Text>
                        
                        <View className="flex-row items-center">
                          <View className="flex-row items-center bg-blue-50 rounded-full px-2 py-1">
                            <Ionicons name="time-outline" size={12} color="#3b82f6" />
                            <Text className="text-blue-600 text-xs ml-1">{agent.responseTime}</Text>
                          </View>
                          <Text className="text-gray-400 text-xs ml-2">{agent.isOnline ? 'Online' : 'Offline'}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          {activeTab === 'chats' && (
            <View className="px-4 pt-2">
              {/* Chats Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Chat Management</Text>
                <TouchableOpacity className="bg-blue-600 rounded-full p-2">
                  <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Chats Filter */}
              <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
                {['customers', 'employees', 'faq'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`flex-1 py-2.5 items-center rounded-xl ${activeChatTab === tab ? 'bg-white' : ''}`}
                    onPress={() => handleChatTabChange(tab)}
                    activeOpacity={0.8}
                  >
                    <Text className={activeChatTab === tab ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      {tab === 'faq' ? 'FAQ' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Chats List */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {activeChatTab === 'customers' && (
                  <>
                    {/* Online Support Agents */}
                    <View className="mb-4">
                      <Text className="text-sm font-semibold text-gray-500 mb-2">ONLINE AGENTS</Text>
                      <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false}
                        className="mb-2"
                      >
                        {supportAgents.filter(agent => agent.isOnline).map((agent) => (
                          <TouchableOpacity 
                            key={agent.id}
                            className="mr-4 items-center"
                            onPress={() => navigateToChat(agent.id)}
                          >
                            <View className="relative">
                              <Image
                                source={{ uri: agent.avatar }}
                                className="w-16 h-16 rounded-full"
                              />
                              <View className="absolute right-0 bottom-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></View>
                            </View>
                            <Text className="text-center text-sm font-medium mt-1 text-gray-800">{agent.name.split(' ')[0]}</Text>
                            <Text className="text-center text-xs text-gray-500">{agent.responseTime}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                    
                    <Text className="text-sm font-semibold text-gray-500 mb-2">RECENT CUSTOMER CHATS</Text>
                    {recentChats.length > 0 ? (
                      recentChats.map((chat) => (
                        <TouchableOpacity 
                          key={chat.id}
                          activeOpacity={0.7} 
                          onPress={() => navigateToChat(chat.id)}
                          className="bg-white rounded-xl p-4 mb-3 flex-row"
                        >
                          <View className="relative">
                            <Image
                              source={{ uri: chat.avatar }}
                              className="w-12 h-12 rounded-full"
                            />
                            {chat.isOnline && (
                              <View className="absolute right-0 bottom-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></View>
                            )}
                          </View>
                          
                          <View className="ml-3 flex-1 justify-center">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-gray-800 font-bold">{chat.name}</Text>
                              <Text className="text-gray-400 text-xs">{chat.time}</Text>
                            </View>
                            
                            <View className="flex-row justify-between items-center">
                              <Text numberOfLines={1} className="text-gray-500 text-sm flex-1 mr-2">{chat.lastMessage}</Text>
                              
                              {chat.unread > 0 && (
                                <View className="bg-blue-600 rounded-full h-5 min-w-5 px-1 justify-center items-center">
                                  <Text className="text-white text-xs font-bold">{chat.unread}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="items-center justify-center py-16 bg-white rounded-xl">
                        <Ionicons name="chatbubble-ellipses-outline" size={60} color="#d1d5db" />
                        <Text className="text-gray-400 mt-4 text-lg">No customer chats yet</Text>
                        <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
                          Customer conversations will appear here
                        </Text>
                      </View>
                    )}
                  </>
                )}
                
                {activeChatTab === 'employees' && (
                  <>
                    <Text className="text-sm font-semibold text-gray-500 mb-2">EMPLOYEE CHATS</Text>
                    {employeeChats.length > 0 ? (
                      employeeChats.map((chat) => (
                        <TouchableOpacity 
                          key={chat.id}
                          activeOpacity={0.7} 
                          onPress={() => navigateToChat(chat.id, true)}
                          className="bg-white rounded-xl p-4 mb-3 flex-row"
                        >
                          <View className="relative">
                            <Image
                              source={{ uri: chat.avatar }}
                              className="w-12 h-12 rounded-full"
                            />
                          </View>
                          
                          <View className="ml-3 flex-1 justify-center">
                            <View className="flex-row justify-between items-center">
                              <Text className="text-gray-800 font-bold">{chat.name}</Text>
                              <Text className="text-gray-400 text-xs">{chat.time}</Text>
                            </View>
                            
                            <Text className="text-gray-500 text-xs my-0.5">{chat.role}</Text>
                            
                            <View className="flex-row justify-between items-center">
                              <Text numberOfLines={1} className="text-gray-500 text-sm flex-1 mr-2">{chat.lastMessage}</Text>
                              
                              {chat.unread > 0 && (
                                <View className="bg-purple-600 rounded-full h-5 min-w-5 px-1 justify-center items-center">
                                  <Text className="text-white text-xs font-bold">{chat.unread}</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))
                    ) : (
                      <View className="items-center justify-center py-16 bg-white rounded-xl">
                        <Ionicons name="people-outline" size={60} color="#d1d5db" />
                        <Text className="text-gray-400 mt-4 text-lg">No employee chats</Text>
                        <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
                          Internal communications will appear here
                        </Text>
                      </View>
                    )}
                  </>
                )}
                
                {activeChatTab === 'faq' && (
                  <>
                    <Text className="text-sm font-semibold text-gray-500 mb-2">FREQUENTLY ASKED QUESTIONS</Text>
                    <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                      <Text className="text-base font-bold text-gray-800 mb-3">Manage FAQ Content</Text>
                      <Text className="text-gray-600 mb-4">
                        Create and edit frequently asked questions to help customers find answers quickly.
                      </Text>
                      
                      <View className="flex-row flex-wrap">
                        {popularTopics.map((topic, index) => (
                          <TouchableOpacity 
                            key={topic.id}
                            activeOpacity={0.7}
                            onPress={() => navigateToTopicDetail(topic.id, topic.title)}
                            className="w-[48%] mb-4"
                            style={{ marginRight: index % 2 === 0 ? '4%' : 0 }}
                          >
                            <View className="p-4 rounded-xl border border-gray-100 bg-gray-50 justify-between">
                              <View className="flex-row items-center mb-2">
                                <View className="w-8 h-8 rounded-full justify-center items-center mr-2" style={{ backgroundColor: topic.color + '20' }}>
                                  <Ionicons name={topic.icon} size={18} color={topic.color} />
                                </View>
                                <Text className="text-gray-800 font-bold flex-1">{topic.title}</Text>
                              </View>
                              
                              <View className="flex-row items-center justify-between">
                                <Text className="text-gray-500 text-xs">{topic.questions} questions</Text>
                                <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                              </View>
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                      
                      <TouchableOpacity 
                        className="mt-2 bg-blue-50 py-3 rounded-lg items-center"
                        activeOpacity={0.7}
                      >
                        <Text className="text-blue-600 font-medium">Add New FAQ Category</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </ScrollView>
            </View>
          )}
          
          {activeTab === 'faq' && (
            <View className="px-4 pt-2">
              {/* FAQ Header with Settings Icon */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Frequently Asked Questions</Text>
                <View className="flex-row">
                  <TouchableOpacity 
                    onPress={navigateToAddFAQ}
                    className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-2"
                  >
                    <Ionicons name="add" size={22} color="#3b82f6" />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={navigateToManageFAQ}
                    className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
                  >
                    <Ionicons name="settings-outline" size={20} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Popular Topics */}
              <Text className="text-base font-semibold text-gray-700 mb-3">Popular Topics</Text>
              <View className="flex-row flex-wrap">
                {popularTopics.map((item, index) => renderTopicItem({ item, index }))}
              </View>
              
              {/* Most Viewed Questions */}
              <Text className="text-base font-semibold text-gray-700 mt-2 mb-3">Most Viewed Questions</Text>
              <View className="bg-white rounded-xl p-4 shadow-sm mb-6">
                {popularTopics.slice(0, 3).map((topic, index) => (
                  <TouchableOpacity 
                    key={topic.id}
                    className={`py-3 ${index < 2 ? 'border-b border-gray-100' : ''}`}
                    onPress={() => navigateToTopicDetail(topic.id, topic.title)}
                  >
                    <View className="flex-row items-start">
                      <View className="w-6 h-6 rounded-full bg-blue-100 items-center justify-center mr-3 mt-0.5">
                        <Text className="text-xs font-bold text-blue-600">Q</Text>
                      </View>
                      <View className="flex-1">
                        <Text className="text-gray-800 font-medium">How do I {topic.title.toLowerCase()}?</Text>
                        <Text className="text-gray-500 text-sm mt-1" numberOfLines={2}>
                          Tap to view detailed answer about {topic.title.toLowerCase()}.
                        </Text>
                      </View>
                      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
                    </View>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity 
                  className="flex-row justify-center items-center pt-3 mt-2"
                  onPress={navigateToManageFAQ}
                >
                  <Text className="text-blue-600 font-medium">View All FAQs</Text>
                  <Ionicons name="arrow-forward" size={16} color="#3b82f6" style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
              
              {/* Add New FAQ Button */}
              <TouchableOpacity
                className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-between mb-8"
                onPress={navigateToAddFAQ}
              >
                <View className="flex-1 mr-3">
                  <Text className="text-blue-800 font-semibold mb-1">Can't find an answer?</Text>
                  <Text className="text-blue-600 text-sm">Create a new FAQ to help other customers</Text>
                </View>
                <View className="bg-blue-100 p-2 rounded-lg">
                  <Ionicons name="add-circle" size={24} color="#3b82f6" />
                </View>
              </TouchableOpacity>
            </View>
          )}
          
          {activeTab === 'complaints' && (
            <View className="px-4 pt-2">
              {/* Complaints Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Complaint Management</Text>
                <TouchableOpacity className="bg-blue-600 rounded-full p-2">
                  <Ionicons name="add" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Complaints Filter */}
              <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
                {['incoming', 'resolved', 'transferred'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    className={`flex-1 py-2.5 items-center rounded-xl ${activeComplaintTab === tab ? 'bg-white' : ''}`}
                    onPress={() => handleComplaintTabChange(tab)}
                    activeOpacity={0.8}
                  >
                    <Text className={activeComplaintTab === tab ? 'text-blue-600 font-medium' : 'text-gray-500'}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                      {tab === 'incoming' && complaints.incoming.length > 0 && (
                        <Text className="text-red-500"> ({complaints.incoming.length})</Text>
                      )}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              
              {/* Complaints List */}
              <ScrollView showsVerticalScrollIndicator={false}>
                {activeComplaintTab === 'incoming' && (
                  complaints.incoming.length > 0 ? (
                    complaints.incoming.map((complaint) => (
                      <View key={complaint.id} className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm">
                        <View className="p-4">
                          <View className="flex-row">
                            <Image 
                              source={{ uri: complaint.avatar }} 
                              className="w-14 h-14 rounded-full"
                            />
                            <View className="ml-3 flex-1">
                              <View className="flex-row justify-between">
                                <Text className="font-bold text-gray-800">{complaint.customer}</Text>
                                <View className={`px-2 py-0.5 rounded-full ${
                                  complaint.priority === 'high' ? 'bg-red-100' : 
                                  complaint.priority === 'medium' ? 'bg-yellow-100' : 'bg-green-100'
                                }`}>
                                  <Text className={`text-xs font-medium ${
                                    complaint.priority === 'high' ? 'text-red-600' : 
                                    complaint.priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                                  }`}>
                                    {complaint.priority.charAt(0).toUpperCase() + complaint.priority.slice(1)}
                                  </Text>
                                </View>
                              </View>
                              <Text className="text-gray-700 my-1">{complaint.subject}</Text>
                              <Text className="text-xs text-gray-500">{complaint.time}</Text>
                            </View>
                          </View>
                        </View>
                        
                        <View className="flex-row border-t border-gray-100">
                          <TouchableOpacity 
                            className="flex-1 py-3 items-center border-r border-gray-100"
                            onPress={() => navigateToComplaint(complaint.id)}
                          >
                            <Text className="text-blue-600 font-medium text-sm">View Details</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="flex-1 py-3 items-center border-r border-gray-100"
                            onPress={() => handleResolveComplaint(complaint.id)}
                          >
                            <Text className="text-green-600 font-medium text-sm">Resolve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity 
                            className="flex-1 py-3 items-center"
                            onPress={() => handleTransferComplaint(complaint.id)}
                          >
                            <Text className="text-amber-600 font-medium text-sm">Transfer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center justify-center py-16">
                      <Ionicons name="checkmark-circle" size={60} color="#d1d5db" />
                      <Text className="text-gray-400 mt-4 text-base">No incoming complaints</Text>
                      <Text className="text-gray-400 text-sm text-center mt-1 max-w-[250px]">
                        All complaints have been addressed
                      </Text>
                    </View>
                  )
                )}
                
                {activeComplaintTab === 'resolved' && (
                  complaints.resolved.length > 0 ? (
                    complaints.resolved.map((complaint) => (
                      <View key={complaint.id} className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm">
                        <View className="p-4">
                          <View className="flex-row">
                            <Image 
                              source={{ uri: complaint.avatar }} 
                              className="w-14 h-14 rounded-full"
                            />
                            <View className="ml-3 flex-1">
                              <View className="flex-row justify-between">
                                <Text className="font-bold text-gray-800">{complaint.customer}</Text>
                                <Ionicons name="checkmark-circle" size={18} color="#10b981" />
                              </View>
                              <Text className="text-gray-700 my-1">{complaint.subject}</Text>
                              <View className="flex-row justify-between">
                                <Text className="text-xs text-gray-500">Resolved {complaint.time}</Text>
                                <Text className="text-xs text-gray-500">By: {complaint.resolvedBy}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        
                        <View className="flex-row border-t border-gray-100">
                          <TouchableOpacity 
                            className="flex-1 py-3 items-center"
                            onPress={() => navigateToComplaint(complaint.id)}
                          >
                            <Text className="text-blue-600 font-medium text-sm">View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center justify-center py-16">
                      <Ionicons name="information-circle" size={60} color="#d1d5db" />
                      <Text className="text-gray-400 mt-4 text-base">No resolved complaints</Text>
                    </View>
                  )
                )}
                
                {activeComplaintTab === 'transferred' && (
                  complaints.transferred.length > 0 ? (
                    complaints.transferred.map((complaint) => (
                      <View key={complaint.id} className="bg-white rounded-xl overflow-hidden mb-3 shadow-sm">
                        <View className="p-4">
                          <View className="flex-row">
                            <Image 
                              source={{ uri: complaint.avatar }} 
                              className="w-14 h-14 rounded-full"
                            />
                            <View className="ml-3 flex-1">
                              <View className="flex-row justify-between">
                                <Text className="font-bold text-gray-800">{complaint.customer}</Text>
                                <Ionicons name="arrow-forward-circle" size={18} color="#f59e0b" />
                              </View>
                              <Text className="text-gray-700 my-1">{complaint.subject}</Text>
                              <View className="flex-row justify-between">
                                <Text className="text-xs text-gray-500">Transferred {complaint.time}</Text>
                                <Text className="text-xs text-gray-500">To: {complaint.transferredTo}</Text>
                              </View>
                            </View>
                          </View>
                        </View>
                        
                        <View className="flex-row border-t border-gray-100">
                          <TouchableOpacity 
                            className="flex-1 py-3 items-center"
                            onPress={() => navigateToComplaint(complaint.id)}
                          >
                            <Text className="text-blue-600 font-medium text-sm">View Details</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View className="items-center justify-center py-16">
                      <Ionicons name="information-circle" size={60} color="#d1d5db" />
                      <Text className="text-gray-400 mt-4 text-base">No transferred complaints</Text>
                    </View>
                  )
                )}
              </ScrollView>
            </View>
          )}
          
          {activeTab === 'contact' && (
            <View className="px-4 pt-2">
              {/* Contact Header */}
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-bold text-gray-800">Contact Methods</Text>
                <TouchableOpacity 
                  className="bg-blue-600 rounded-full p-2"
                  onPress={navigateToContactSettings}
                >
                  <Ionicons name="settings-outline" size={20} color="#fff" />
                </TouchableOpacity>
              </View>
              
              {/* Stats Overview */}
              <View className="bg-white rounded-xl p-4 mb-6 shadow-sm">
                <Text className="text-base font-bold text-gray-800 mb-3">Contact Overview</Text>
                <View className="flex-row flex-wrap">
                  <View className="w-1/2 mb-3 pr-2">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-2">
                        <Ionicons name="call" size={18} color="#3b82f6" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Phone Inquiries</Text>
                        <Text className="text-base font-bold text-gray-800">28 today</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 mb-3 pl-2">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center mr-2">
                        <Ionicons name="mail" size={18} color="#10b981" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Email Requests</Text>
                        <Text className="text-base font-bold text-gray-800">46 today</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 pr-2">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-purple-100 items-center justify-center mr-2">
                        <Ionicons name="chatbubble" size={18} color="#8b5cf6" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Avg. Response</Text>
                        <Text className="text-base font-bold text-gray-800">4.2 min</Text>
                      </View>
                    </View>
                  </View>
                  
                  <View className="w-1/2 pl-2">
                    <View className="flex-row items-center">
                      <View className="w-9 h-9 rounded-full bg-yellow-100 items-center justify-center mr-2">
                        <Ionicons name="star" size={18} color="#f59e0b" />
                      </View>
                      <View>
                        <Text className="text-xs text-gray-500">Satisfaction</Text>
                        <Text className="text-base font-bold text-gray-800">4.8/5</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Contact Methods */}
              <Text className="text-sm font-semibold text-gray-500 mb-2">CONTACT METHODS</Text>
              <View className="bg-white rounded-xl overflow-hidden mb-4 shadow-sm">
                {contactMethods.map((method, index) => (
                  <View 
                    key={method.id}
                    className={`p-4 ${index < contactMethods.length - 1 ? 'border-b border-gray-100' : ''}`}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center flex-1">
                        <View className="w-10 h-10 rounded-full items-center justify-center mr-3" style={{ backgroundColor: method.color + '15' }}>
                          <Ionicons name={method.icon} size={20} color={method.color} />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 font-semibold">{method.type}</Text>
                          <Text className="text-gray-500">{method.value}</Text>
                        </View>
                      </View>
                      
                      {/* Toggle Switch */}
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => toggleContactMethodStatus(method.id)}
                        className={`w-12 h-6 rounded-full ${method.status === 'active' ? 'bg-green-500' : 'bg-gray-300'} items-center flex-row px-0.5`}
                      >
                        <Animated.View 
                          className="w-5 h-5 rounded-full bg-white shadow-sm"
                          style={{ transform: [{ translateX: method.status === 'active' ? 24 : 0 }] }}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
              
              {/* Hours of Operation */}
              <Text className="text-sm font-semibold text-gray-500 mb-2">HOURS OF OPERATION</Text>
              <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-base font-bold text-gray-800">Customer Service Hours</Text>
                  <TouchableOpacity>
                    <Ionicons name="create-outline" size={20} color="#4b5563" />
                  </TouchableOpacity>
                </View>
                
                {[
                  { day: 'Monday - Friday', hours: '8:00 AM - 8:00 PM' },
                  { day: 'Saturday', hours: '9:00 AM - 6:00 PM' },
                  { day: 'Sunday', hours: '10:00 AM - 4:00 PM' },
                ].map((schedule, index) => (
                  <View 
                    key={index}
                    className={`flex-row justify-between py-2 ${index < 2 ? 'border-b border-gray-100' : ''}`}
                  >
                    <Text className="text-gray-700">{schedule.day}</Text>
                    <Text className="text-gray-700 font-medium">{schedule.hours}</Text>
                  </View>
                ))}
                
                <View className="mt-4 bg-blue-50 p-3 rounded-lg">
                  <View className="flex-row items-start">
                    <Ionicons name="information-circle" size={20} color="#3b82f6" className="mt-0.5" />
                    <Text className="text-blue-800 ml-2 text-sm flex-1">
                      Emergency support is available 24/7 for critical issues.
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Quick Contact Actions */}
              <View className="flex-row mb-6">
                <TouchableOpacity 
                  className="flex-1 mr-2 bg-blue-600 py-3 rounded-xl items-center justify-center flex-row"
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={20} color="#fff" />
                  <Text className="text-white font-medium ml-2">Call Center</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="flex-1 ml-2 bg-white border border-gray-200 py-3 rounded-xl items-center justify-center flex-row"
                  activeOpacity={0.8}
                >
                  <Ionicons name="analytics" size={20} color="#4b5563" />
                  <Text className="text-gray-700 font-medium ml-2">Reports</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
