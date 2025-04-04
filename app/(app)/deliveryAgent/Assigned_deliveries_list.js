import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Alert
} from 'react-native';
import { Ionicons, Feather, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import HomeHeader from '../../components/HomeHeader';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { db } from "../../../firebase/firebaseConfig";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { useAuth } from "../../context/authContext";

const { width, height } = Dimensions.get('window');

export default function AssignedDeliveriesList() {
  // Animation refs
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  // Add headerOpacity animation
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.9],
    extrapolate: 'clamp',
  });
  
  // State variables
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveries, setDeliveries] = useState([]);
  const [filteredDeliveries, setFilteredDeliveries] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Get authentication context
  const { user } = useAuth();
  
  // Animation for search bar
  const searchBarAnim = useRef(new Animated.Value(0)).current;
  
  // Fetch assigned deliveries from user's tasks collection
  const fetchDeliveries = useCallback(async () => {
    if (!user || !user.uid) {
      setError("You must be logged in to view assigned deliveries");
      setLoading(false);
      setIsRefreshing(false);
      return;
    }

    try {
      setLoading(true);
      console.log("Fetching assigned deliveries for:", user.uid);
      
      // Get tasks from user's collection that are in Pending or Assigned status
      // Modified query to avoid composite index requirement
      const tasksRef = collection(db, `users/${user.uid}/tasks`);
      
      // First, fetch all tasks - simpler query that doesn't require a composite index
      const basicQuery = query(tasksRef);
      const querySnapshot = await getDocs(basicQuery);
      
      if (querySnapshot.empty) {
        console.log("No tasks found at all");
        setDeliveries([]);
        setFilteredDeliveries([]);
        setLoading(false);
        setIsRefreshing(false);
        return;
      }
      
      // Filter tasks in JavaScript instead of using where clause with orderBy
      // This avoids the need for a composite index
      const assignedDeliveries = querySnapshot.docs
        .map(doc => {
          const data = doc.data();
          
          // Only include tasks with Pending or Assigned status
          if (!data.status || !['Pending', 'Assigned'].includes(data.status)) {
            return null;
          }
          
          // Format the task data to match the UI expectations
          return {
            id: doc.id,
            rawData: data, // Store the original data for reference
            customer: {
              name: data.customerName || 'Customer',
              photo: data.customerPhoto || 'https://randomuser.me/api/portraits/lego/1.jpg',
              phone: data.customerPhone || 'No phone provided',
              address: data.deliveryAddress || 'No address provided'
            },
            orderDetails: {
              orderNumber: data.orderRef || data.orderId || doc.id.substring(0, 8),
              items: data.items?.length || 0,
              total: `${data.totalAmount || '0'} Birr`,
              paymentMethod: data.paymentMethod || 'Unknown',
              isPaid: data.isPaid || false
            },
            delivery: {
              status: data.status || 'Assigned',
              assignedTime: data.createdAt ? new Date(data.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Unknown',
              estimatedArrival: data.estimatedArrival || 'N/A',
              distance: data.distance || 'Unknown',
              route: {
                startPoint: data.pickup || 'Supermarket',
                endPoint: data.deliveryAddress || 'Destination'
              }
            },
            priority: data.priority || 'medium',
            createdAt: data.createdAt // Keep the timestamp for sorting
          };
        })
        .filter(task => task !== null) // Remove null entries
        .sort((a, b) => {
          // Sort by createdAt timestamp, newest first
          if (!a.createdAt || !b.createdAt) return 0;
          return b.createdAt.seconds - a.createdAt.seconds;
        });
      
      console.log(`Found ${assignedDeliveries.length} assigned or pending deliveries`);
      setDeliveries(assignedDeliveries);
      setFilteredDeliveries(assignedDeliveries);
      
    } catch (error) {
      console.error("Error fetching assigned deliveries:", error);
      setError("Failed to load your assigned deliveries. Please try again.");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchDeliveries();
  }, [fetchDeliveries]);
  
  // Initialize animations on mount
  useEffect(() => {
    // Start entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  // Update filtered deliveries when search query or filter changes
  useEffect(() => {
    // Protect against undefined deliveries
    let results = deliveries || [];
    
    // Apply search filter
    if (searchQuery) {
      results = results.filter(item => 
        item.customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.orderDetails.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.customer.address.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (activeFilter !== 'all') {
      results = results.filter(item => {
        if (activeFilter === 'in-progress') return item.delivery.status === 'In Progress';
        if (activeFilter === 'new-orders') return item.delivery.status === 'Assigned' || item.delivery.status === 'Pending';
        return true;
      });
    }
    
    setFilteredDeliveries(results);
  }, [searchQuery, activeFilter, deliveries]);

  // Refresh data
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDeliveries();
  };

  // Show/hide search bar animation
  const toggleSearch = () => {
    if (showSearch) {
      // Hide search bar
      Animated.timing(searchBarAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSearch(false));
      
      setSearchQuery('');
    } else {
      // Show search bar
      setShowSearch(true);
      Animated.timing(searchBarAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback silently
      }
    }
  };

  // Handle filter selection
  const handleFilterSelect = (filter) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Fallback silently
      }
    }
    
    setActiveFilter(filter);
  };

  // Handle delivery selection
  const handleDeliverySelect = (delivery) => {
    setSelectedDelivery(delivery);
    
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback silently
      }
    }
  };

  // Start a delivery
  const handleStartDelivery = async (delivery) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback silently
      }
    }
    
    try {
      if (!user || !user.uid) {
        Alert.alert("Error", "You must be logged in to start a delivery");
        return;
      }
      
      // Update the task in Firestore
      const taskRef = doc(db, `users/${user.uid}/tasks`, delivery.id);
      await updateDoc(taskRef, {
        status: 'In Progress',
        startedAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });
      
      // Update local state
      const updatedDeliveries = deliveries.map(item => {
        if (item.id === delivery.id) {
          return {
            ...item,
            delivery: {
              ...item.delivery,
              status: 'In Progress'
            }
          };
        }
        return item;
      });
      
      setDeliveries(updatedDeliveries);
      
      // Close detail view if open
      if (selectedDelivery?.id === delivery.id) {
        setSelectedDelivery(null);
      }
      
      // Navigate to in-progress orders screen
      router.push("/deliveryAgent/Inprogress_Orders");
      
    } catch (error) {
      console.error("Error starting delivery:", error);
      Alert.alert("Error", "Failed to start delivery. Please try again.");
    }
  };

  // Close detail view
  const closeDetail = () => {
    setSelectedDelivery(null);
  };

  // Format priority indicator
  const getPriorityColor = (priority) => {
    switch(priority) {
      case 'high': return '#f87171';
      case 'medium': return '#fbbf24';
      case 'low': return '#60a5fa';
      default: return '#9ca3af';
    }
  };

  // Format payment status
  const getPaymentStatusColor = (isPaid) => {
    return isPaid ? '#10b981' : '#f97316';
  };
  
  const getPaymentStatusText = (isPaid) => {
    return isPaid ? 'Paid' : 'COD';
  };

  // Format status color
  const getStatusColor = (status) => {
    switch(status) {
      case 'Assigned': return '#6366f1';
      case 'Pending': return '#f97316';
      case 'In Progress': return '#0ea5e9';
      case 'Delayed': return '#ef4444';
      default: return '#64748b';
    }
  };

  // Render delivery item
  const renderDeliveryItem = ({ item, index }) => (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
        marginBottom: 16
      }}
    >
      <TouchableOpacity
        style={{
          backgroundColor: 'white',
          borderRadius: 16,
          padding: 16,
          shadowColor: '#0f172a',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 10,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          margin: 1
        }}
        onPress={() => handleDeliverySelect(item)}
        activeOpacity={0.7}
      >
        {/* Priority indicator */}
        <View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: 8,
            height: '100%',
            backgroundColor: getPriorityColor(item.priority),
            borderTopLeftRadius: 16,
            borderBottomLeftRadius: 16
          }}
        />
        
        {/* Header */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', color: '#0f172a', fontSize: 15 }}>
              {item.orderDetails.orderNumber}
            </Text>
            
            <View
              style={{
                backgroundColor: getStatusColor(item.delivery.status),
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 12,
                marginLeft: 8
              }}
            >
              <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
                {item.delivery.status}
              </Text>
            </View>
          </View>
          
          <View
            style={{
              backgroundColor: getPaymentStatusColor(item.orderDetails.isPaid),
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 12
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: '600' }}>
              {getPaymentStatusText(item.orderDetails.isPaid)}
            </Text>
          </View>
        </View>
        
        {/* Customer info */}
        <View style={{ flexDirection: 'row', marginBottom: 12 }}>
          <Image
            source={{ uri: item.customer.photo }}
            style={{
              width: 45,
              height: 45,
              borderRadius: 25,
              marginRight: 12
            }}
          />
          
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: '600', color: '#334155', fontSize: 16 }}>
              {item.customer.name}
            </Text>
            
            <Text style={{ color: '#64748b', fontSize: 14, marginTop: 4 }} numberOfLines={1}>
              {item.customer.address}
            </Text>
          </View>
        </View>
        
        {/* Details */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#f8fafc', 
          borderRadius: 12, 
          padding: 12,
          marginBottom: 16,
          justifyContent: 'space-between'
        }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Distance</Text>
            <Text style={{ fontWeight: '600', color: '#334155' }}>{item.delivery.distance}</Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 8 }} />
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Items</Text>
            <Text style={{ fontWeight: '600', color: '#334155' }}>{item.orderDetails.items}</Text>
          </View>
          
          <View style={{ width: 1, backgroundColor: '#e2e8f0', marginHorizontal: 8 }} />
          
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#64748b', fontSize: 12, marginBottom: 4 }}>Total</Text>
            <Text style={{ fontWeight: '600', color: '#334155' }}>{item.orderDetails.total}</Text>
          </View>
        </View>
        
        {/* Action button */}
        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            borderRadius: 12,
            padding: 14,
            alignItems: 'center'
          }}
          onPress={() => handleStartDelivery(item)}
        >
          <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Start Delivery</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={{ 
      flex: 1, 
      justifyContent: 'center', 
      alignItems: 'center', 
      paddingTop: 60,
      paddingHorizontal: 20
    }}>
      {/* Replace image with icon */}
      <View style={{ 
        width: 120, 
        height: 120, 
        borderRadius: 60,
        backgroundColor: '#f1f5f9',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16
      }}>
        <Feather name="package" size={60} color="#94a3b8" />
      </View>
      
      <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#334155', marginBottom: 8 }}>
        No Deliveries Found
      </Text>
      <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 20 }}>
        {activeFilter !== 'all' 
          ? `No ${activeFilter === 'in-progress' ? 'in-progress' : 'new'} deliveries found.` 
          : 'You don\'t have any assigned deliveries at the moment.'
        }
      </Text>
      {/* Show refresh button if there was an error */}
      {error && (
        <TouchableOpacity
          style={{
            backgroundColor: '#3b82f6',
            paddingVertical: 12,
            paddingHorizontal: 20,
            borderRadius: 8
          }}
          onPress={fetchDeliveries}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Refresh</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Begin component return
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#f8fafc' }} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <HomeHeader title="Assigned Deliveries" showBackButton />
      
      {/* Search and Filters */}
      <Animated.View 
        style={{ 
          opacity: headerOpacity,
          paddingHorizontal: 16,
          paddingBottom: 8,
          backgroundColor: '#f8fafc'
        }}
        className="z-10"
      >
        {/* Search Bar */}
        {showSearch ? (
          <Animated.View
            style={{
              transform: [
                {
                  translateY: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-20, 0],
                  }),
                },
                {
                  scale: searchBarAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.9, 1],
                  }),
                },
              ],
              opacity: searchBarAnim,
              marginBottom: 12,
            }}
          >
            <View className="flex-row items-center bg-white rounded-xl px-4 py-2 border border-gray-100 shadow-sm">
              <Feather name="search" size={20} color="#9CA3AF" />
              <TextInput
                className="flex-1 ml-2 text-gray-800 text-base py-2"
                placeholder="Search by name, order #, address..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Feather name="x" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        ) : null}
        
        {/* Filter Pills */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="mb-2"
        >
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'all' ? 'bg-indigo-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterSelect('all')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'all' ? 'text-white' : 'text-gray-700'}`}
            >
              All
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'in-progress' ? 'bg-blue-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterSelect('in-progress')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'in-progress' ? 'text-white' : 'text-gray-700'}`}
            >
              In Progress
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            className={`mr-2 px-4 py-2 rounded-full ${activeFilter === 'new-orders' ? 'bg-purple-600' : 'bg-white border border-gray-200'}`}
            onPress={() => handleFilterSelect('new-orders')}
          >
            <Text 
              className={`font-medium ${activeFilter === 'new-orders' ? 'text-white' : 'text-gray-700'}`}
            >
              New Orders
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
      
      {/* Action Buttons Floating */}
      <View className="absolute right-4 z-20" style={{ top: 140 }}>
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-full shadow-lg mb-2"
          onPress={toggleSearch}
          style={{
            elevation: 3,
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }}
        >
          <Feather name={showSearch ? "x" : "search"} size={20} color="white" />
        </TouchableOpacity>
        
        <TouchableOpacity
          className="bg-indigo-600 p-3 rounded-full shadow-lg"
          onPress={() => {
            // Sort functionality
            if (Platform.OS === 'ios') {
              try {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              } catch (e) {
                // Fallback
              }
            }
          }}
          style={{
            elevation: 3,
            shadowColor: '#4F46E5',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 3,
          }}
        >
          <Feather name="sliders" size={20} color="white" />
        </TouchableOpacity>
      </View>
      
      {/* Delivery List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-4 text-base">Loading deliveries...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredDeliveries || []}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: true }
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor="#4F46E5"
              colors={['#4F46E5']}
            />
          }
          ListEmptyComponent={renderEmptyState}
          renderItem={renderDeliveryItem}
        />
      )}
    </SafeAreaView>
  );
}
