import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
  Alert,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  StatusBar,
  Vibration,
  Platform,
  Modal,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, doc, updateDoc, query, where, orderBy, limit } from 'firebase/firestore';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, AntDesign } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

export default function LowStockAlerts() {
  const router = useRouter();
  
  // State variables
  const [lowStockItems, setLowStockItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [orderPlaced, setOrderPlaced] = useState({});
  const [selectedItem, setSelectedItem] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Animation references
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const searchBarWidth = useRef(new Animated.Value(Dimensions.get('window').width - 40)).current;
  const searchInputRef = useRef(null);
  const [searchFocused, setSearchFocused] = useState(false);
  
  // Card animations
  const pressAnimations = useRef({}).current;
  
  // Stat references
  const [stats, setStats] = useState({
    criticalCount: 0,
    lowCount: 0,
    totalCount: 0
  });
  
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
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    // Fetch low stock products
    fetchLowStockItems();
  }, []);
  
  useEffect(() => {
    // Apply filters when search or status changes
    filterItems();
  }, [searchQuery, selectedStatus, lowStockItems]);
  
  // Function to fetch low stock items
  const fetchLowStockItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const productsRef = collection(db, "Products");
      const querySnapshot = await getDocs(productsRef);
      
      const products = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      // Filter products with low stock
      const lowStock = products.filter(product => {
        const stock = parseInt(product.stockQuantity) || 0;
        const threshold = parseInt(product.stockThreshold) || 5;
        return stock <= threshold;
      });
      
      // Sort by stock level (lowest first)
      lowStock.sort((a, b) => {
        const stockA = parseInt(a.stockQuantity) || 0;
        const stockB = parseInt(b.stockQuantity) || 0;
        return stockA - stockB;
      });
      
      // Initialize press animations for each item
      lowStock.forEach(item => {
        if (!pressAnimations[item.id]) {
          pressAnimations[item.id] = new Animated.Value(1);
        }
      });
      
      // Calculate statistics
      const criticalCount = lowStock.filter(item => {
        const stock = parseInt(item.stockQuantity) || 0;
        return stock === 0;
      }).length;
      
      const lowCount = lowStock.length - criticalCount;
      
      setStats({
        criticalCount,
        lowCount,
        totalCount: lowStock.length
      });
      
      setLowStockItems(lowStock);
      provideFeedback('success');
    } catch (err) {
      console.error("Error fetching low stock items:", err);
      setError("Could not load low stock items. Please check your connection and try again.");
      provideFeedback('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  // Filter items based on search query and status
  const filterItems = () => {
    let filtered = [...lowStockItems];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(item => 
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedStatus !== 'All') {
      if (selectedStatus === 'Critical') {
        filtered = filtered.filter(item => parseInt(item.stockQuantity) === 0);
      } else if (selectedStatus === 'Low') {
        filtered = filtered.filter(item => parseInt(item.stockQuantity) > 0);
      } else if (selectedStatus === 'Ordered') {
        filtered = filtered.filter(item => orderPlaced[item.id]);
      } else if (selectedStatus === 'Not Ordered') {
        filtered = filtered.filter(item => !orderPlaced[item.id]);
      }
    }
    
    setFilteredItems(filtered);
  };
  
  // Refresh data
  const onRefresh = () => {
    setRefreshing(true);
    fetchLowStockItems();
  };
  
  // Provide haptic feedback based on action type
  const provideFeedback = (type) => {
    if (Platform.OS === 'ios') {
      try {
        if (type === 'success') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (type === 'error') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {
        // Fallback to basic vibration if Haptics module is not available
        Vibration.vibrate(type === 'error' ? 500 : 20);
      }
    } else {
      // Android vibration
      Vibration.vibrate(type === 'error' ? 500 : 20);
    }
  };
  
  // Card press animation
  const animatePress = (id) => {
    provideFeedback('light');
    Animated.sequence([
      Animated.timing(pressAnimations[id], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(pressAnimations[id], {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Toggle search focus
  const toggleSearch = () => {
    if (searchFocused) {
      // Reset search
      setSearchQuery("");
      setSearchFocused(false);
      searchInputRef.current?.blur();
      Animated.spring(searchBarWidth, {
        toValue: Dimensions.get('window').width - 40,
        friction: 8,
        useNativeDriver: false
      }).start();
    } else {
      // Focus search
      setSearchFocused(true);
      searchInputRef.current?.focus();
      Animated.spring(searchBarWidth, {
        toValue: Dimensions.get('window').width - 100,
        friction: 8,
        useNativeDriver: false
      }).start();
    }
  };
  
  // Mark item as ordered or handle stock
  const markAsOrdered = async (item) => {
    setActionLoading(true);
    try {
      // Toggle order status in local state
      const newOrderPlaced = { ...orderPlaced };
      newOrderPlaced[item.id] = !newOrderPlaced[item.id];
      setOrderPlaced(newOrderPlaced);
      
      // Animation and feedback
      animatePress(item.id);
      provideFeedback(newOrderPlaced[item.id] ? 'success' : 'light');
      
      // Update the item in Firestore if needed
      // This would be where you'd add logic to update the database
      // For now, we're just updating local state
      
      // Success message
      if (newOrderPlaced[item.id]) {
        Alert.alert(
          "Order Placed",
          `Order marked as placed for ${item.name}`,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Error updating order status:", error);
      Alert.alert("Error", "Failed to update order status: " + error.message);
      provideFeedback('error');
    } finally {
      setActionLoading(false);
    }
  };
  
  // Navigate to manage stock level for the selected item
  const navigateToManageStock = (item) => {
    router.push({
      pathname: "/stockManager/Manage_stock_levels",
      params: { productId: item.id }
    });
  };
  
  // Render an individual low stock item
  const renderLowStockItem = ({ item }) => {
    const stockQuantity = parseInt(item.stockQuantity) || 0;
    const stockThreshold = parseInt(item.stockThreshold) || 5;
    const isCritical = stockQuantity === 0;
    const isOrdered = orderPlaced[item.id];
    
    // Calculate percentage for progress bar
    const percentage = Math.min(100, (stockQuantity / stockThreshold) * 100);
    
    return (
      <TouchableOpacity 
        onPress={() => {
          setSelectedItem(item);
          setDetailsVisible(true);
          animatePress(item.id);
        }}
        activeOpacity={0.8}
      >
        <Animated.View 
          style={{
            transform: [
              { scale: pressAnimations[item.id] || 1 }
            ],
            opacity: fadeAnim,
            marginVertical: 6
          }}
          className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100"
        >
          <View className="flex-row p-1">
            {/* Product Image */}
            <View className="w-[80] h-[80] rounded-lg overflow-hidden justify-center items-center mr-2">
              {item.image ? (
                <Image 
                  source={{ uri: item.image }} 
                  className="w-full h-full"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-full h-full bg-gray-200 justify-center items-center">
                  <Ionicons name="cube-outline" size={24} color="#9ca3af" />
                </View>
              )}
            </View>
            
            {/* Product Details */}
            <View className="flex-1 pt-1 pr-1">
              <View className="flex-row justify-between items-start">
                <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                  {item.name}
                </Text>
                
                {isOrdered && (
                  <View className="bg-green-100 px-2 py-1 rounded-md">
                    <Text className="text-green-700 text-xs font-semibold">
                      ORDERED
                    </Text>
                  </View>
                )}
              </View>
              
              <Text className="text-gray-500 text-xs">
                Category: {item.category || "Uncategorized"}
              </Text>
              
              {/* Stock Level */}
              <View className="mt-2">
                <View className="flex-row justify-between items-center mb-1">
                  <Text className={`text-xs font-medium ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                    {isCritical ? "Out of Stock" : `${stockQuantity} units left`}
                  </Text>
                  <Text className="text-xs text-gray-500">
                    Threshold: {stockThreshold}
                  </Text>
                </View>
                
                {/* Progress Bar */}
                <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <View 
                    className={`h-full ${isCritical ? 'bg-red-500' : 'bg-amber-500'}`}
                    style={{ width: `${percentage}%` }}
                  />
                </View>
              </View>
              
              {/* Quick Action */}
              <View className="flex-row justify-end mt-2">
                <TouchableOpacity 
                  className={`px-3 py-1 rounded-lg mr-2 border ${isOrdered ? 'border-green-500 bg-green-50' : 'border-amber-500 bg-amber-50'}`}
                  onPress={() => markAsOrdered(item)}
                >
                  <Text className={`text-xs font-medium ${isOrdered ? 'text-green-600' : 'text-amber-600'}`}>
                    {isOrdered ? "Ordered" : "Mark Ordered"}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="px-3 py-1 rounded-lg bg-blue-50 border border-blue-500"
                  onPress={() => navigateToManageStock(item)}
                >
                  <Text className="text-xs font-medium text-blue-600">
                    Manage Stock
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    );
  };
  
  // Render empty list placeholder
  const renderEmptyList = () => (
    <View className="flex-1 justify-center items-center py-16">
      <Ionicons name="cube-outline" size={60} color="#d1d5db" />
      <Text className="text-gray-400 text-lg mt-4 font-medium">No low stock items found</Text>
      <Text className="text-gray-400 text-sm mt-1 max-w-[250px] text-center">
        {searchQuery || selectedStatus !== 'All' 
          ? "Try changing your search or filters" 
          : "All your inventory is above threshold levels!"}
      </Text>
      
      <TouchableOpacity 
        className="mt-6 bg-blue-500 px-4 py-2 rounded-lg"
        onPress={() => router.push("/stockManager/ProductList")}
      >
        <Text className="text-white font-medium">View All Products</Text>
      </TouchableOpacity>
    </View>
  );
  
  // Loading indicator
  if (loading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <StatusBar style="dark" />
        <View className="bg-white p-6 rounded-xl shadow-sm items-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-gray-600 font-medium mt-4">Loading inventory...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 pt-4 pb-2 flex-row justify-between items-center">
        <TouchableOpacity 
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">Low Stock Alerts</Text>
        
        <TouchableOpacity 
          onPress={() => router.push("/stockManager/ProductList")}
          className="w-10 h-10 rounded-full bg-blue-100 justify-center items-center"
        >
          <Ionicons name="list" size={20} color="#3b82f6" />
        </TouchableOpacity>
      </View>
      
      {/* Stats Cards */}
      <View className="px-4 py-3">
        <View className="flex-row space-x-3">
          {/* Critical Items */}
          <View className="flex-1 bg-red-50 p-3 rounded-xl border border-red-100">
            <View className="w-8 h-8 bg-red-100 rounded-full items-center justify-center mb-1">
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-red-600">{stats.criticalCount}</Text>
            <Text className="text-xs text-red-500 font-medium">Critical Stock</Text>
          </View>
          
          {/* Low Items */}
          <View className="flex-1 bg-amber-50 p-3 rounded-xl border border-amber-100">
            <View className="w-8 h-8 bg-amber-100 rounded-full items-center justify-center mb-1">
              <Ionicons name="warning" size={16} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-amber-600">{stats.lowCount}</Text>
            <Text className="text-xs text-amber-500 font-medium">Low Stock</Text>
          </View>
          
          {/* Total Items */}
          <View className="flex-1 bg-blue-50 p-3 rounded-xl border border-blue-100">
            <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mb-1">
              <Ionicons name="cube" size={16} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-blue-600">{stats.totalCount}</Text>
            <Text className="text-xs text-blue-500 font-medium">Total Alerts</Text>
          </View>
        </View>
      </View>
      
      {/* Search and Filter Bar */}
      <View className="px-4 pb-2">
        <View className="flex-row items-center justify-between">
          <Animated.View style={{ width: searchBarWidth }} className="flex-row items-center bg-white rounded-lg border border-gray-200 px-3 py-2">
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              ref={searchInputRef}
              className="flex-1 pl-2 text-gray-700"
              placeholder="Search products..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setSearchFocused(true)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </Animated.View>
          
          {searchFocused && (
            <TouchableOpacity 
              onPress={toggleSearch}
              className="pl-2"
            >
              <Text className="text-blue-500 font-medium">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Status Filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          className="flex-row pt-3"
        >
          {['All', 'Critical', 'Low', 'Ordered', 'Not Ordered'].map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => {
                setSelectedStatus(status);
                provideFeedback('light');
              }}
              className={`px-3 py-1.5 rounded-full mr-2 ${
                selectedStatus === status 
                  ? status === 'Critical' ? 'bg-red-500' : 
                    status === 'Low' ? 'bg-amber-500' : 
                    status === 'Ordered' ? 'bg-green-500' : 
                    status === 'Not Ordered' ? 'bg-blue-500' : 'bg-gray-700'
                  : 'bg-gray-200'
              }`}
            >
              <Text 
                className={`text-xs font-medium ${
                  selectedStatus === status 
                    ? 'text-white' 
                    : 'text-gray-700'
                }`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Product List */}
      {error ? (
        <View className="flex-1 justify-center items-center p-4">
          <Ionicons name="cloud-offline-outline" size={50} color="#ef4444" />
          <Text className="text-red-500 text-lg font-bold mt-4">Something went wrong</Text>
          <Text className="text-gray-500 text-center mt-2">{error}</Text>
          <TouchableOpacity 
            className="mt-6 bg-blue-500 px-4 py-2 rounded-lg"
            onPress={fetchLowStockItems}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          renderItem={renderLowStockItem}
          keyExtractor={item => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          ListEmptyComponent={renderEmptyList}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3b82f6', '#60a5fa']}
              tintColor="#3b82f6"
              title="Pull to refresh..."
              titleColor="#3b82f6"
            />
          }
        />
      )}
      
      {/* Item Detail Modal */}
      <Modal
        visible={detailsVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setDetailsVisible(false)}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setDetailsVisible(false)}
        >
          <Pressable 
            className="bg-white rounded-xl w-[90%] max-w-[400] overflow-hidden"
            onPress={e => e.stopPropagation()}
          >
            {selectedItem && (
              <View>
                {/* Modal Header */}
                <LinearGradient
                  colors={
                    parseInt(selectedItem.stockQuantity) === 0 
                      ? ['#ef4444', '#b91c1c'] 
                      : ['#f59e0b', '#d97706']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="px-4 py-4"
                >
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-white text-lg font-bold" numberOfLines={2}>
                        {selectedItem.name}
                      </Text>
                      <Text className="text-white/80 text-xs">
                        {selectedItem.category || "Uncategorized"}
                      </Text>
                    </View>
                    
                    <TouchableOpacity 
                      onPress={() => setDetailsVisible(false)}
                      className="w-8 h-8 rounded-full bg-white/20 justify-center items-center ml-2"
                    >
                      <Ionicons name="close" size={18} color="white" />
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
                
                {/* Item Image */}
                <View className="w-full h-[200] relative">
                  {selectedItem.image ? (
                    <Image 
                      source={{ uri: selectedItem.image }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-full h-full bg-gray-200 justify-center items-center">
                      <Ionicons name="cube-outline" size={50} color="#9ca3af" />
                    </View>
                  )}
                </View>
                
                {/* Item Details */}
                <View className="p-4">
                  {/* Stock Info */}
                  <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Stock Information</Text>
                    
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Current Stock:</Text>
                      <Text className={`font-semibold ${parseInt(selectedItem.stockQuantity) === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {selectedItem.stockQuantity} units
                      </Text>
                    </View>
                    
                    <View className="flex-row justify-between mb-1">
                      <Text className="text-gray-600">Threshold Level:</Text>
                      <Text className="font-semibold text-gray-700">{selectedItem.stockThreshold} units</Text>
                    </View>
                    
                    {/* Stock Status */}
                    <View className="mt-2 p-2 rounded-lg bg-red-50 border border-red-100">
                      <Text className={`text-center text-sm font-medium ${parseInt(selectedItem.stockQuantity) === 0 ? 'text-red-600' : 'text-amber-600'}`}>
                        {parseInt(selectedItem.stockQuantity) === 0 
                          ? "OUT OF STOCK - Immediate Reorder Required" 
                          : "LOW STOCK - Consider Reordering Soon"
                        }
                      </Text>
                    </View>
                  </View>
                  
                  {/* Price Info */}
                  <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <Text className="text-sm font-medium text-gray-700 mb-2">Price Information</Text>
                    
                    <View className="flex-row justify-between">
                      <Text className="text-gray-600">Unit Price:</Text>
                      <Text className="font-semibold text-gray-700">${selectedItem.price || "0.00"}</Text>
                    </View>
                    
                    {selectedItem.discountPrice && (
                      <View className="flex-row justify-between mt-1">
                        <Text className="text-gray-600">Discount Price:</Text>
                        <Text className="font-semibold text-green-600">${selectedItem.discountPrice}</Text>
                      </View>
                    )}
                  </View>
                  
                  {/* Action Buttons */}
                  <View className="flex-row space-x-3 mt-2">
                    <TouchableOpacity 
                      className={`flex-1 py-3 rounded-lg border flex-row justify-center items-center ${
                        orderPlaced[selectedItem.id] 
                          ? 'bg-green-100 border-green-500' 
                          : 'bg-amber-100 border-amber-500'
                      }`}
                      onPress={() => {
                        markAsOrdered(selectedItem);
                      }}
                    >
                      <Ionicons 
                        name={orderPlaced[selectedItem.id] ? "checkmark-circle" : "cart-outline"} 
                        size={18} 
                        color={orderPlaced[selectedItem.id] ? "#22c55e" : "#f59e0b"} 
                      />
                      <Text className={`font-medium ml-2 ${
                        orderPlaced[selectedItem.id] ? 'text-green-600' : 'text-amber-600'
                      }`}>
                        {orderPlaced[selectedItem.id] ? "Order Placed" : "Mark as Ordered"}
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      className="flex-1 py-3 rounded-lg bg-blue-500 flex-row justify-center items-center"
                      onPress={() => {
                        setDetailsVisible(false);
                        setTimeout(() => navigateToManageStock(selectedItem), 300);
                      }}
                    >
                      <Ionicons name="create-outline" size={18} color="white" />
                      <Text className="text-white font-medium ml-2">Manage Stock</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
