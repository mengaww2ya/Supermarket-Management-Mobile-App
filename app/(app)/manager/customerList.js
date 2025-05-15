import React, { useState, useEffect, useRef } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
  StatusBar,
  Platform,
  ScrollView,
  RefreshControl
} from "react-native";
import { Feather, MaterialIcons, Ionicons, AntDesign, FontAwesome5, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import HomeHeader from "app/components/HomeHeader";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function CustomerList() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // State variables
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerOrders, setCustomerOrders] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState(null);
  
  // Pre-create animated values for list items
  const itemFades = useRef([]);

  const router = useRouter();

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || '?';
  };

  // Get random background color for avatar
  const getAvatarColor = (name) => {
    const colors = [
      '#F87171', // red
      '#FB923C', // orange
      '#FBBF24', // amber
      '#A3E635', // lime
      '#34D399', // emerald
      '#22D3EE', // cyan
      '#60A5FA', // blue
      '#A78BFA', // violet
      '#F472B6', // pink
    ];
    
    if (!name) return colors[0];
    
    // Use customer name to determine consistent color
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };

  // Fetch customers from Firestore
  const fetchCustomers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query users collection for customers
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "customer"));
      const querySnapshot = await getDocs(q);

      const customersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          status: data.status || "inactive",
          lastActive: data.updatedAt?.toDate() || new Date(),
          memberSince: data.createdAt?.toDate() || new Date(),
        };
      });

      // Initialize animated values for each item
      itemFades.current = customersList.map(() => new Animated.Value(0));

      setCustomers(customersList);
      setFilteredCustomers(customersList);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Initial fetch and animation
  useEffect(() => {
    fetchCustomers();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Animate list items when they change
  useEffect(() => {
    if (filteredCustomers.length > 0 && itemFades.current.length >= filteredCustomers.length) {
      // Create staggered animations for each item
      const animations = filteredCustomers.map((_, index) => {
        return Animated.timing(itemFades.current[index], {
          toValue: 1,
          duration: 500,
          delay: index * 50,
          useNativeDriver: true
        });
      });
      
      // Run all animations in parallel
      Animated.stagger(50, animations).start();
    }
  }, [filteredCustomers]);

  // Format date
  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchCustomers();
  };

  // Fetch customer orders when opening modal
  const fetchCustomerOrders = async (customerId) => {
    try {
      // Get the customer document to access orders
      const customerDocRef = doc(db, "users", customerId);
      const customerDoc = await getDoc(customerDocRef);
      
      if (customerDoc.exists()) {
        const customerData = customerDoc.data();
        
        // Check if orders exist
        if (customerData.orders) {
          // Transform orders object to array
          const ordersList = Object.entries(customerData.orders).map(([id, data]) => {
            return {
              id,
              ...data,
              createdAt: data.updatedAt?.toDate() || new Date(),
              status: data.status || "pending"
            };
          });
          
          setCustomerOrders(ordersList);
        } else {
          setCustomerOrders([]);
        }
      }
    } catch (err) {
      console.error('Error fetching customer orders:', err);
      setCustomerOrders([]);
    }
  };

  // Handle modal opening with haptic feedback
  const openModal = async (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);

    // Fetch customer orders
    await fetchCustomerOrders(customer.id);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
  };

  // Search and filter customers
  useEffect(() => {
    if (!customers.length) return;

    let result = [...customers];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          (item.firstName?.toLowerCase() || '').includes(searchLower) ||
          (item.lastName?.toLowerCase() || '').includes(searchLower) ||
          (item.fullName?.toLowerCase() || '').includes(searchLower) ||
          (item.email?.toLowerCase() || '').includes(searchLower) ||
          (item.phone?.toLowerCase() || '').includes(searchLower) ||
          (item.address?.toLowerCase() || '').includes(searchLower)
      );
    }

    // Apply status filter
    if (activeFilter !== "all") {
      result = result.filter(item => item.status === activeFilter);
    }

    setFilteredCustomers(result);
  }, [searchQuery, activeFilter, customers]);

  // Status badge color based on status
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return {
          bg: '#ECFDF5',
          text: '#10B981',
          label: 'Active'
        };
      case 'inactive':
        return {
          bg: '#FEF2F2',
          text: '#EF4444',
          label: 'Inactive'
        };
      case 'new':
        return {
          bg: '#EFF6FF',
          text: '#3B82F6',
          label: 'New'
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#6B7280',
          label: status || 'Unknown'
        };
    }
  };
  
  // Get order status color
  const getOrderStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#10B981'; // green
      case 'on_the_way':
        return '#3B82F6'; // blue
      case 'processing':
        return '#F59E0B'; // amber
      case 'cancelled':
        return '#EF4444'; // red
      case 'pending':
        return '#6B7280'; // gray
      default:
        return '#6B7280'; // gray
    }
  };

  // Render customer card
  const renderCustomerCard = ({ item, index }) => {
    // Use pre-created animated value
    const itemFade = itemFades.current[index] || new Animated.Value(1);
    const statusStyle = getStatusColor(item.status);
    const initials = getInitials(item.firstName, item.lastName);
    const avatarColor = getAvatarColor(item.firstName + item.lastName);

    return (
      <Animated.View
        style={{
          opacity: itemFade,
          transform: [
            {
              translateY: itemFade.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0]
              })
            }
          ]
        }}
      >
        <TouchableOpacity
          className="bg-white rounded-xl overflow-hidden shadow-sm mb-3"
          onPress={() => openModal(item)}
          activeOpacity={0.9}
        >
          <View className="p-4">
            <View className="flex-row">
              {item.profileImage ? (
                <Image
                  source={{ uri: item.profileImage }}
                  className="w-14 h-14 rounded-full mr-3"
                  style={{ backgroundColor: '#E5E7EB' }}
                />
              ) : (
                <View 
                  className="w-14 h-14 rounded-full mr-3 items-center justify-center" 
                  style={{ backgroundColor: avatarColor }}
                >
                  <Text className="text-white font-bold text-xl">
                    {initials}
                  </Text>
                </View>
              )}

              <View className="flex-1 justify-center">
                <View className="flex-row items-center justify-between">
                  <Text className="text-gray-800 font-bold text-base">
                    {item.fullName || `${item.firstName || ''} ${item.lastName || ''}`}
                  </Text>

                  <View
                    className="px-2 py-1 rounded-full"
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: statusStyle.text }}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>

                <View className="flex-row items-center mt-1">
                  <Feather name="mail" size={12} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs ml-1">{item.email || 'N/A'}</Text>
                </View>

                <View className="flex-row items-center mt-1">
                  <Feather name="phone" size={12} color="#9CA3AF" />
                  <Text className="text-gray-500 text-xs ml-1">{item.phone || 'N/A'}</Text>
                </View>
                
                {item.address && (
                  <View className="flex-row items-center mt-1">
                    <Feather name="map-pin" size={12} color="#9CA3AF" />
                    <Text className="text-gray-500 text-xs ml-1">{item.address}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render customer detail modal
  const renderCustomerModal = () => {
    if (!selectedCustomer) return null;
    
    const statusStyle = getStatusColor(selectedCustomer.status);
    const initials = getInitials(selectedCustomer.firstName, selectedCustomer.lastName);
    const avatarColor = getAvatarColor(selectedCustomer.firstName + selectedCustomer.lastName);
    
    return (
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 16
        }}>
          <Animated.View 
            style={{ 
              backgroundColor: 'white',
              borderRadius: 16,
              width: width * 0.85,
              maxHeight: height * 0.7,
              opacity: fadeAnim,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10
            }}
          >
            <View className="py-3 px-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-800">Customer Details</Text>
              <TouchableOpacity
                className="p-1 rounded-full bg-gray-100"
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView className="px-4 py-3">
              <View className="flex-row items-center mb-4">
                {selectedCustomer.profileImage ? (
                  <Image
                    source={{ uri: selectedCustomer.profileImage }}
                    className="w-16 h-16 rounded-full mr-4 border-2 border-indigo-500"
                    style={{ backgroundColor: '#E5E7EB' }}
                  />
                ) : (
                  <View 
                    className="w-16 h-16 rounded-full mr-4 items-center justify-center border-2 border-indigo-500" 
                    style={{ backgroundColor: avatarColor }}
                  >
                    <Text className="text-white font-bold text-xl">
                      {initials}
                    </Text>
                  </View>
                )}
                <View>
                  <Text className="text-xl font-bold text-gray-800">
                    {selectedCustomer.fullName || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`}
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full mt-1 self-start"
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <Text
                      className="text-xs font-medium"
                      style={{ color: statusStyle.text }}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Basic information */}
              <View className="bg-gray-50 rounded-xl p-4 mb-4">
                <Text className="text-base font-bold text-gray-800 mb-3">Contact Information</Text>
                
                <View className="flex-row items-center mb-3">
                  <View className="w-9 h-9 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Feather name="mail" size={16} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500">Email</Text>
                    <Text className="text-sm font-semibold text-gray-800">{selectedCustomer.email || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-3">
                  <View className="w-9 h-9 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Feather name="phone" size={16} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500">Phone</Text>
                    <Text className="text-sm font-semibold text-gray-800">{selectedCustomer.phone || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-3">
                  <View className="w-9 h-9 rounded-full bg-amber-100 items-center justify-center mr-3">
                    <Feather name="map-pin" size={16} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500">Address</Text>
                    <Text className="text-sm font-semibold text-gray-800">{selectedCustomer.address || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center">
                  <View className="w-9 h-9 rounded-full bg-purple-100 items-center justify-center mr-3">
                    <Feather name="calendar" size={16} color="#8B5CF6" />
                  </View>
                  <View>
                    <Text className="text-xs font-medium text-gray-500">Member Since</Text>
                    <Text className="text-sm font-semibold text-gray-800">{formatDate(selectedCustomer.memberSince)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Message Customer button */}
              <TouchableOpacity
                className="bg-indigo-500 py-3 rounded-lg flex-row justify-center items-center mb-2"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setModalVisible(false);
                  
                  // Pass the correct parameters expected by chatRoom component
                  const params = {
                    uid: selectedCustomer.uid || selectedCustomer.id,
                    recipientId: selectedCustomer.uid || selectedCustomer.id,
                    name: selectedCustomer.fullName || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`,
                    recipientName: selectedCustomer.fullName || `${selectedCustomer.firstName || ''} ${selectedCustomer.lastName || ''}`,
                    image: selectedCustomer.profileImage || '',
                    email: selectedCustomer.email || ''
                  };
                  
                  // Convert params to query string
                  const queryString = Object.entries(params)
                    .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                    .join('&');
                    
                  router.push(`/(app)/chatRoom?${queryString}`);
                }}
              >
                <MaterialIcons name="chat" size={18} color="white" />
                <Text className="ml-2 text-white font-bold">Message Customer</Text>
              </TouchableOpacity>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={{ 
            position: 'absolute', 
            top: 120, 
            right: 20,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setActiveFilter('all');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Feather name="users" size={14} color="#6B7280" />
              </View>
              <Text className={`font-medium ${activeFilter === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>All Customers</Text>
              {activeFilter === 'all' && <MaterialIcons name="check" size={20} color="#4F46E5" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setActiveFilter('active');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                <Feather name="user-check" size={14} color="#10B981" />
              </View>
              <Text className={`font-medium ${activeFilter === 'active' ? 'text-green-600' : 'text-gray-800'}`}>Active</Text>
              {activeFilter === 'active' && <MaterialIcons name="check" size={20} color="#10B981" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setActiveFilter('inactive');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-3">
                <Feather name="user-x" size={14} color="#EF4444" />
              </View>
              <Text className={`font-medium ${activeFilter === 'inactive' ? 'text-red-600' : 'text-gray-800'}`}>Inactive</Text>
              {activeFilter === 'inactive' && <MaterialIcons name="check" size={20} color="#EF4444" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <HomeHeader title="Customer List" showBackButton />

      {/* Search Bar with Filter Button */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search customers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity 
          className="bg-gray-100 p-3 rounded-lg"
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather 
            name="filter" 
            size={20} 
            color={activeFilter !== 'all' ? '#4F46E5' : '#6B7280'} 
          />
        </TouchableOpacity>
      </View>

      {/* Customer List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-2">Loading customers...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="text-red-500 text-lg font-medium mt-4 text-center">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-indigo-500 py-2 px-6 rounded-lg"
            onPress={fetchCustomers}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4F46E5']}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-10">
              <Feather name="users" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg mt-4">No customers found</Text>
              <Text className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</Text>
            </View>
          )}
          renderItem={renderCustomerCard}
        />
      )}

      {/* Customer Detail Modal */}
      {renderCustomerModal()}
      
      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
}
