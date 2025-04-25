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
  Pressable,
  ScrollView
} from "react-native";
import { Feather, MaterialIcons, FontAwesome, Ionicons, AntDesign } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import HomeHeader from "app/components/HomeHeader";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function CustomerList() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [200, 70],
    extrapolate: 'clamp'
  });

  // State variables
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState("name");
  const [sortDirection, setSortDirection] = useState("asc");
  const [activeTab, setActiveTab] = useState("all");
  const [error, setError] = useState(null);

  const router = useRouter();

  // Random profile images for missing avatars
  const defaultAvatars = [
    "https://randomuser.me/api/portraits/men/32.jpg",
    "https://randomuser.me/api/portraits/women/44.jpg",
    "https://randomuser.me/api/portraits/men/45.jpg",
    "https://randomuser.me/api/portraits/women/68.jpg",
    "https://randomuser.me/api/portraits/men/22.jpg",
  ];

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
          avatar: data.photoURL || defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)],
          status: determineCustomerStatus(data),
          lastActive: data.lastActive?.toDate() || new Date(),
          totalSpent: data.totalSpent || 0,
          orderCount: data.orderCount || 0,
          loyaltyPoints: data.loyaltyPoints || 0,
          lastPurchase: data.lastPurchase?.toDate() || data.lastActive?.toDate() || new Date(),
          memberSince: data.createdAt?.toDate() || new Date()
        };
      });

      setCustomers(customersList);
      setFilteredCustomers(customersList);
    } catch (err) {
      console.error('Error fetching customers:', err);
      setError('Failed to fetch customers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Determine customer status based on activity and orders
  const determineCustomerStatus = (customer) => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));

    if (customer.createdAt?.toDate() >= sevenDaysAgo) {
      return 'new';
    }

    if (customer.lastActive?.toDate() >= thirtyDaysAgo) {
      return 'active';
    }

    return 'inactive';
  };

  // Initial fetch
  useEffect(() => {
    fetchCustomers();
  }, []);

  // Format date
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format currency
  const formatCurrency = (amount) => {
    return `$${amount.toFixed(2)}`;
  };

  // Handle modal opening with haptic feedback
  const openModal = (customer) => {
    setSelectedCustomer(customer);
    setModalVisible(true);

    // Haptic feedback
    if (Platform.OS === 'ios') {
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
          (item.email?.toLowerCase() || '').includes(searchLower) ||
          (item.phone?.toLowerCase() || '').includes(searchLower) ||
          ((item.firstName?.toLowerCase() + ' ' + item.lastName?.toLowerCase()) || '').includes(searchLower)
      );
    }

    // Apply tab filter
    if (activeTab !== "all") {
      result = result.filter(item => item.status === activeTab);
    }

    // Apply sorting
    result = result.sort((a, b) => {
      let comparison = 0;

      if (sortBy === "name") {
        comparison = (a.firstName || '').localeCompare(b.firstName || '');
      } else if (sortBy === "recent") {
        comparison = new Date(b.lastActive || 0) - new Date(a.lastActive || 0);
      } else if (sortBy === "spent") {
        comparison = (b.totalSpent || 0) - (a.totalSpent || 0);
      }

      return sortDirection === "asc" ? comparison : -comparison;
    });

    setFilteredCustomers(result);
  }, [searchQuery, sortBy, sortDirection, activeTab, customers]);

  // Animation on component mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

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
          label: 'Unknown'
        };
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <HomeHeader title="Customer List" showBackButton />

      {/* Animated Header Section */}
      <Animated.View
        style={{
          height: headerHeight,
          opacity: fadeAnim,
        }}
        className="px-4 pb-3 bg-white border-b border-gray-200"
      >
        {/* Statistics */}
        <View className="flex-row justify-between mb-3 pt-2">
          <View className="items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex-1 mx-1">
            <Text className="text-gray-500 text-xs mb-1">Total Customers</Text>
            <Text className="font-bold text-gray-800 text-lg">{customers.length}</Text>
          </View>

          <View className="items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex-1 mx-1">
            <Text className="text-gray-500 text-xs mb-1">Active</Text>
            <Text className="font-bold text-gray-800 text-lg">
              {customers.filter(c => c.status === 'active').length}
            </Text>
          </View>

          <View className="items-center bg-white p-2 rounded-lg shadow-sm border border-gray-100 flex-1 mx-1">
            <Text className="text-gray-500 text-xs mb-1">New</Text>
            <Text className="font-bold text-gray-800 text-lg">
              {customers.filter(c => c.status === 'new').length}
            </Text>
          </View>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2 mb-3">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search by name, email, phone..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filters */}
        <View className="flex-row justify-between mb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === 'all' ? 'bg-blue-100' : 'bg-gray-100'}`}
              onPress={() => setActiveTab('all')}
            >
              <Text className={`${activeTab === 'all' ? 'text-blue-600' : 'text-gray-500'} font-medium`}>
                All
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === 'active' ? 'bg-green-100' : 'bg-gray-100'}`}
              onPress={() => setActiveTab('active')}
            >
              <Text className={`${activeTab === 'active' ? 'text-green-600' : 'text-gray-500'} font-medium`}>
                Active
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === 'inactive' ? 'bg-red-100' : 'bg-gray-100'}`}
              onPress={() => setActiveTab('inactive')}
            >
              <Text className={`${activeTab === 'inactive' ? 'text-red-600' : 'text-gray-500'} font-medium`}>
                Inactive
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className={`px-4 py-2 rounded-full mr-2 ${activeTab === 'new' ? 'bg-blue-100' : 'bg-gray-100'}`}
              onPress={() => setActiveTab('new')}
            >
              <Text className={`${activeTab === 'new' ? 'text-blue-600' : 'text-gray-500'} font-medium`}>
                New
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* Sorting Options */}
        <View className="flex-row justify-end">
          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={() => {
              setSortBy("name");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            <Text className={`mr-1 text-sm ${sortBy === "name" ? "font-medium text-blue-600" : "text-gray-500"}`}>
              Name
            </Text>
            {sortBy === "name" && (
              <Feather
                name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
                size={16}
                color="#2563EB"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center mr-4"
            onPress={() => {
              setSortBy("recent");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            <Text className={`mr-1 text-sm ${sortBy === "recent" ? "font-medium text-blue-600" : "text-gray-500"}`}>
              Recent
            </Text>
            {sortBy === "recent" && (
              <Feather
                name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
                size={16}
                color="#2563EB"
              />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            className="flex-row items-center"
            onPress={() => {
              setSortBy("spent");
              setSortDirection(sortDirection === "asc" ? "desc" : "asc");
            }}
          >
            <Text className={`mr-1 text-sm ${sortBy === "spent" ? "font-medium text-blue-600" : "text-gray-500"}`}>
              Spent
            </Text>
            {sortBy === "spent" && (
              <Feather
                name={sortDirection === "asc" ? "chevron-up" : "chevron-down"}
                size={16}
                color="#2563EB"
              />
            )}
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Customer List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-2">Loading customers...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={filteredCustomers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          ListEmptyComponent={() => (
            <View className="flex-1 justify-center items-center py-10">
              <Feather name="users" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg mt-4">No customers found</Text>
              <Text className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</Text>
            </View>
          )}
          renderItem={({ item, index }) => {
            // Calculate animation delay based on index for staggered entrance
            const itemFade = new Animated.Value(0);

            Animated.timing(itemFade, {
              toValue: 1,
              duration: 500,
              delay: index * 50,
              useNativeDriver: true
            }).start();

            const statusStyle = getStatusColor(item.status);

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
                  className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 mb-3"
                  onPress={() => openModal(item)}
                  activeOpacity={0.9}
                >
                  <View className="p-3">
                    <View className="flex-row">
                      <Image
                        source={{ uri: item.avatar }}
                        className="w-16 h-16 rounded-full mr-3 border-2 border-white"
                        style={{ backgroundColor: '#E5E7EB' }}
                      />

                      <View className="flex-1 justify-center">
                        <View className="flex-row items-center justify-between">
                          <Text className="text-gray-800 font-bold text-lg">
                            {item.firstName} {item.lastName}
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

                        <Text className="text-gray-500">@{item.userName || item.email}</Text>

                        <View className="flex-row items-center mt-1">
                          <Feather name="mail" size={14} color="#9CA3AF" className="mr-1" />
                          <Text className="text-gray-500 text-sm">{item.email}</Text>
                        </View>

                        <View className="flex-row items-center mt-1">
                          <Feather name="phone" size={14} color="#9CA3AF" className="mr-1" />
                          <Text className="text-gray-500 text-sm">{item.phone}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
                      <View className="items-center">
                        <Text className="text-gray-500 text-xs mb-1">Total Spent</Text>
                        <Text className="font-semibold text-gray-800">{formatCurrency(item.totalSpent)}</Text>
                      </View>

                      <View className="items-center">
                        <Text className="text-gray-500 text-xs mb-1">Orders</Text>
                        <Text className="font-semibold text-gray-800">{item.orderCount}</Text>
                      </View>

                      <View className="items-center">
                        <Text className="text-gray-500 text-xs mb-1">Last Active</Text>
                        <Text className="font-semibold text-gray-800">{formatDate(item.lastActive)}</Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }}
        />
      )}

      {/* Customer Details Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black bg-opacity-50">
          <Animated.View
            className="bg-white rounded-t-3xl shadow-lg max-h-[85%]"
            style={{
              transform: [
                {
                  translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [300, 0]
                  })
                }
              ]
            }}
          >
            <ScrollView className="p-4">
              {selectedCustomer && (
                <>
                  {/* Close button */}
                  <TouchableOpacity
                    className="absolute right-4 top-4 z-10 bg-gray-200 p-2 rounded-full"
                    onPress={() => setModalVisible(false)}
                  >
                    <Feather name="x" size={20} color="#4B5563" />
                  </TouchableOpacity>

                  {/* Customer profile header */}
                  <View className="items-center pt-4 pb-6">
                    <Image
                      source={{ uri: selectedCustomer.avatar }}
                      className="w-24 h-24 rounded-full border-4 border-white shadow-md mb-3"
                    />

                    <Text className="text-2xl font-bold text-gray-800">
                      {selectedCustomer.firstName} {selectedCustomer.lastName}
                    </Text>

                    <Text className="text-gray-500 mb-2">@{selectedCustomer.userName}</Text>

                    <View
                      className="px-3 py-1 rounded-full mb-2"
                      style={{ backgroundColor: getStatusColor(selectedCustomer.status).bg }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: getStatusColor(selectedCustomer.status).text }}
                      >
                        {getStatusColor(selectedCustomer.status).label} Customer
                      </Text>
                    </View>

                    <Text className="text-gray-500 text-sm">
                      Member since {formatDate(selectedCustomer.memberSince)}
                    </Text>
                  </View>

                  {/* Statistics */}
                  <View className="flex-row justify-between bg-gray-50 rounded-xl p-3 mb-6">
                    <View className="items-center flex-1">
                      <Text className="text-gray-500 text-xs mb-1">Spent</Text>
                      <Text className="font-bold text-gray-800 text-lg">
                        {formatCurrency(selectedCustomer.totalSpent)}
                      </Text>
                    </View>

                    <View className="items-center flex-1">
                      <Text className="text-gray-500 text-xs mb-1">Orders</Text>
                      <Text className="font-bold text-gray-800 text-lg">{selectedCustomer.orderCount}</Text>
                    </View>

                    <View className="items-center flex-1">
                      <Text className="text-gray-500 text-xs mb-1">Points</Text>
                      <Text className="font-bold text-gray-800 text-lg">{selectedCustomer.loyaltyPoints}</Text>
                    </View>
                  </View>

                  {/* Contact information */}
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3">Contact Information</Text>

                    <View className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
                      <View className="flex-row items-center p-3">
                        <Feather name="phone" size={18} color="#4B5563" className="mr-3" />
                        <View className="flex-1">
                          <Text className="text-gray-500 text-xs">Phone</Text>
                          <Text className="text-gray-800">{selectedCustomer.phone}</Text>
                        </View>
                        <TouchableOpacity
                          className="bg-blue-50 p-2 rounded-full"
                          onPress={() => alert(`Calling ${selectedCustomer.phone}`)}
                        >
                          <Feather name="phone-outgoing" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-center p-3">
                        <Feather name="mail" size={18} color="#4B5563" className="mr-3" />
                        <View className="flex-1">
                          <Text className="text-gray-500 text-xs">Email</Text>
                          <Text className="text-gray-800">{selectedCustomer.email}</Text>
                        </View>
                        <TouchableOpacity
                          className="bg-blue-50 p-2 rounded-full"
                          onPress={() => alert(`Sending email to ${selectedCustomer.email}`)}
                        >
                          <Feather name="send" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>

                      <View className="flex-row items-center p-3">
                        <Feather name="map-pin" size={18} color="#4B5563" className="mr-3" />
                        <View className="flex-1">
                          <Text className="text-gray-500 text-xs">Address</Text>
                          <Text className="text-gray-800">{selectedCustomer.address}</Text>
                        </View>
                        <TouchableOpacity
                          className="bg-blue-50 p-2 rounded-full"
                          onPress={() => alert(`Opening map to ${selectedCustomer.address}`)}
                        >
                          <Feather name="map" size={18} color="#3B82F6" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Customer activity */}
                  <View className="mb-6">
                    <Text className="text-lg font-bold text-gray-800 mb-3">Recent Activity</Text>

                    <View className="bg-white rounded-lg border border-gray-200 p-3">
                      <View className="flex-row items-center mb-3">
                        <View className="w-8 h-8 rounded-full bg-green-100 items-center justify-center mr-2">
                          <Feather name="shopping-bag" size={16} color="#10B981" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 font-medium">Last Purchase</Text>
                          <Text className="text-gray-500 text-sm">{formatDate(selectedCustomer.lastPurchase)}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-3">
                        <View className="w-8 h-8 rounded-full bg-blue-100 items-center justify-center mr-2">
                          <Feather name="clock" size={16} color="#3B82F6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 font-medium">Last Active</Text>
                          <Text className="text-gray-500 text-sm">{formatDate(selectedCustomer.lastActive)}</Text>
                        </View>
                      </View>

                      <View className="flex-row items-center">
                        <View className="w-8 h-8 rounded-full bg-purple-100 items-center justify-center mr-2">
                          <Feather name="gift" size={16} color="#8B5CF6" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-gray-800 font-medium">Loyalty Program</Text>
                          <Text className="text-gray-500 text-sm">
                            {selectedCustomer.loyaltyPoints} points ({Math.floor(selectedCustomer.loyaltyPoints / 100)} rewards available)
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Action buttons */}
                  <View className="flex-row justify-between mb-6">
                    <TouchableOpacity
                      className="bg-blue-500 rounded-lg py-3 flex-1 items-center mr-2"
                      onPress={() => {
                        setModalVisible(false);
                        alert("Edit customer profile");
                      }}
                    >
                      <Text className="text-white font-bold">Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-red-500 rounded-lg py-3 flex-1 items-center ml-2"
                      onPress={() => {
                        setModalVisible(false);
                        alert("Customer deactivated");
                      }}
                    >
                      <Text className="text-white font-bold">Deactivate</Text>
                    </TouchableOpacity>
                  </View>

                  <View className="flex-row justify-between mb-6">
                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg py-3 flex-grow items-center mx-1"
                      onPress={() => alert("View orders")}
                    >
                      <Feather name="shopping-bag" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-medium mt-1">Orders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg py-3 flex-grow items-center mx-1"
                      onPress={() => alert("Send message")}
                    >
                      <Feather name="message-circle" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-medium mt-1">Message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      className="bg-gray-100 rounded-lg py-3 flex-grow items-center mx-1"
                      onPress={() => alert("Send notification")}
                    >
                      <Feather name="bell" size={20} color="#4B5563" />
                      <Text className="text-gray-700 font-medium mt-1">Notify</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      {/* Floating Action Button */}
      <TouchableOpacity
        className="absolute right-6 bottom-6 bg-blue-600 w-14 h-14 rounded-full items-center justify-center shadow-lg"
        onPress={() => alert("Add new customer")}
      >
        <Feather name="plus" size={24} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}
