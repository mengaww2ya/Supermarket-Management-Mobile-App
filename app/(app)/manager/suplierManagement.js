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
  ScrollView,
  RefreshControl,
  Platform
} from "react-native";
import { Feather, MaterialIcons, Ionicons, AntDesign, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import HomeHeader from "app/components/HomeHeader";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, getDoc } from "firebase/firestore";

const { width, height } = Dimensions.get("window");

export default function SupplierManagement() {
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollY = useRef(new Animated.Value(0)).current;

  // State variables
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [categoryFilterModalVisible, setCategoryFilterModalVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  
  // Pre-create animated values for list items
  const itemFades = useRef([]);

  const router = useRouter();

  // Get initials for avatar
  const getInitials = (firstName, lastName) => {
    const firstInitial = firstName && firstName.length > 0 ? firstName.charAt(0).toUpperCase() : '';
    const lastInitial = lastName && lastName.length > 0 ? lastName.charAt(0).toUpperCase() : '';
    return firstInitial + lastInitial || 'S';
  };

  // Get random background color for avatar
  const getAvatarColor = (name) => {
    const colors = [
      '#34D399', // emerald
      '#3B82F6', // blue
      '#F59E0B', // amber
      '#8B5CF6', // violet
      '#EC4899', // pink
      '#06B6D4', // cyan
      '#F97316', // orange
      '#14B8A6', // teal
      '#6366F1', // indigo
    ];
    
    if (!name) return colors[0];
    
    // Use supplier name to determine consistent color
    let sum = 0;
    for (let i = 0; i < name.length; i++) {
      sum += name.charCodeAt(i);
    }
    
    return colors[sum % colors.length];
  };

  // Fetch suppliers from Firestore
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query users collection for suppliers
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("role", "==", "supplier"));
      const querySnapshot = await getDocs(q);

      const suppliersList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        
        return {
          id: doc.id,
          ...data,
          status: data.status || "active",
          lastActive: data.updatedAt?.toDate() || new Date(),
          joinDate: data.createdAt?.toDate() || new Date()
        };
      });

      // Initialize animated values for each item
      itemFades.current = suppliersList.map(() => new Animated.Value(0));

      setSuppliers(suppliersList);
      setFilteredSuppliers(suppliersList);
      
      // Fetch product categories
      fetchCategories();
    } catch (err) {
      console.error('Error fetching suppliers:', err);
      setError('Failed to fetch suppliers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Fetch product categories
  const fetchCategories = async () => {
    try {
      const categoriesRef = collection(db, "supplier_category");
      const categorySnapshot = await getDocs(categoriesRef);
      const categoriesList = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setCategories(categoriesList);
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  // Fetch supplier products by category for filtering
  const fetchSupplierProductsByCategory = async (categoryId) => {
    try {
      setLoading(true);
      
      if (!categoryId) {
        setSelectedCategory(null);
        setFilteredSuppliers(suppliers);
        setLoading(false);
        return;
      }
      
      // Get products from the category that have supplierId
      const productsRef = collection(db, "supplier_category", categoryId, "products");
      const productsSnapshot = await getDocs(productsRef);
      
      // Extract unique supplier IDs from products
      const supplierIds = new Set();
      productsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.supplierId) {
          supplierIds.add(data.supplierId);
        }
      });
      
      // Filter suppliers by those IDs
      const filteredByCategory = suppliers.filter(supplier => 
        supplierIds.has(supplier.id)
      );
      
      setFilteredSuppliers(filteredByCategory);
      setSelectedCategory(categoryId);
    } catch (err) {
      console.error("Error fetching supplier products by category:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch supplier stats when a supplier is selected
  const fetchSupplierStats = async (supplierId) => {
    try {
      // Update the supplier object to show loading state
      setSelectedSupplier(prev => ({
        ...prev,
        loadingStats: true
      }));
      
      // Fetch product count
      let productCount = 0;
      const categoriesSnapshot = await getDocs(collection(db, "supplier_category"));
      
      // For each category, check products with this supplier's ID
      const categoryPromises = categoriesSnapshot.docs.map(async (categoryDoc) => {
        const productsRef = collection(db, "supplier_category", categoryDoc.id, "products");
        const q = query(productsRef, where("supplierId", "==", supplierId));
        const productsSnapshot = await getDocs(q);
        return productsSnapshot.size;
      });
      
      // Wait for all queries to finish and sum the results
      const results = await Promise.all(categoryPromises);
      productCount = results.reduce((sum, count) => sum + count, 0);
      
      // Fetch order count
      const ordersRef = collection(db, "orders");
      const ordersQuery = query(ordersRef, where("supplierId", "==", supplierId));
      const ordersSnapshot = await getDocs(ordersQuery);
      const orderCount = ordersSnapshot.size;
      
      // Update the supplier object with real data
      setSelectedSupplier(prev => ({
        ...prev,
        products: productCount,
        totalOrders: orderCount,
        loadingStats: false
      }));
      
    } catch (error) {
      console.error("Error fetching supplier stats:", error);
      setSelectedSupplier(prev => ({
        ...prev,
        loadingStats: false
      }));
    }
  };

  // Initial fetch and animation
  useEffect(() => {
    fetchSuppliers();
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);
  
  // Animate list items when they change
  useEffect(() => {
    if (filteredSuppliers.length > 0 && itemFades.current.length >= filteredSuppliers.length) {
      // Create staggered animations for each item
      const animations = filteredSuppliers.map((_, index) => {
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
  }, [filteredSuppliers]);

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
    fetchSuppliers();
  };

  // Handle modal opening with haptic feedback
  const openModal = (supplier) => {
    setSelectedSupplier(supplier);
    setModalVisible(true);
    
    // Fetch real stats for this supplier
    fetchSupplierStats(supplier.id);

    // Haptic feedback
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {
        // Fallback if haptics not available
      }
    }
  };

  // Search and filter suppliers
  useEffect(() => {
    if (!suppliers.length) return;

    let result = [...suppliers];

    // Apply search filter
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      result = result.filter(
        item =>
          (item.firstName?.toLowerCase() || '').includes(searchLower) ||
          (item.lastName?.toLowerCase() || '').includes(searchLower) ||
          (item.fullName?.toLowerCase() || '').includes(searchLower) ||
          (item.companyName?.toLowerCase() || '').includes(searchLower) ||
          (item.email?.toLowerCase() || '').includes(searchLower) ||
          (item.phone?.toLowerCase() || '').includes(searchLower)
      );
    }

    // If there's a category filter applied, respect it
    if (selectedCategory) {
      // Result is already filtered by category from fetchSupplierProductsByCategory
      // This is just to show correct numbers when search is also applied
      return;
    }

    setFilteredSuppliers(result);
  }, [searchQuery, suppliers, selectedCategory]);

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
      case 'pending':
        return {
          bg: '#FEF3C7',
          text: '#F59E0B',
          label: 'Pending'
        };
      case 'certified':
        return {
          bg: '#EFF6FF',
          text: '#3B82F6',
          label: 'Certified'
        };
      default:
        return {
          bg: '#F3F4F6',
          text: '#6B7280',
          label: status || 'Unknown'
        };
    }
  };

  // Render supplier card
  const renderSupplierCard = ({ item, index }) => {
    // Use pre-created animated value
    const itemFade = itemFades.current[index] || new Animated.Value(1);
    const statusStyle = getStatusColor(item.status);
    const initials = getInitials(item.firstName, item.lastName);
    const avatarColor = getAvatarColor(item.firstName + item.lastName);
    const companyName = item.companyName || `${item.firstName || ''} ${item.lastName || ''} Trading`;

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
            <View className="flex-row items-center">
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
                    {companyName}
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

                <Text className="text-gray-500 text-xs mt-1">
                  {item.productType || 'General Supplier'}
                </Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };
  
  // Render supplier detail modal
  const renderSupplierModal = () => {
    if (!selectedSupplier) return null;
    
    const statusStyle = getStatusColor(selectedSupplier.status);
    const initials = getInitials(selectedSupplier.firstName, selectedSupplier.lastName);
    const avatarColor = getAvatarColor(selectedSupplier.firstName + selectedSupplier.lastName);
    const companyName = selectedSupplier.companyName || `${selectedSupplier.firstName || ''} ${selectedSupplier.lastName || ''} Trading`;
    
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
              width: width * 0.9,
              maxHeight: height * 0.8,
              opacity: fadeAnim,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10
            }}
          >
            <View className="py-3 px-4 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">Supplier Details</Text>
              <TouchableOpacity
                className="p-1 rounded-full bg-gray-100"
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              className="px-4 py-3"
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Profile Header */}
              <View className="flex-row items-center mb-5">
                {selectedSupplier.profileImage ? (
                  <Image
                    source={{ uri: selectedSupplier.profileImage }}
                    className="w-20 h-20 rounded-full mr-4 border-2 border-indigo-500"
                    style={{ backgroundColor: '#E5E7EB' }}
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-full mr-4 items-center justify-center border-2 border-indigo-500" 
                    style={{ backgroundColor: avatarColor }}
                  >
                    <Text className="text-white font-bold text-2xl">
                      {initials}
                    </Text>
                  </View>
                )}
                <View className="flex-1">
                  <Text className="text-2xl font-bold text-gray-800">
                    {companyName}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <View
                      className="px-3 py-1 rounded-full self-start mr-2"
                      style={{ backgroundColor: statusStyle.bg }}
                    >
                      <Text
                        className="text-sm font-medium"
                        style={{ color: statusStyle.text }}
                      >
                        {statusStyle.label}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-sm">
                      {selectedSupplier.productType ? `${selectedSupplier.productType}` : 'General Supplier'}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Company Information */}
              <View className="bg-gray-50 rounded-xl p-4 mb-5">
                <Text className="text-lg font-bold text-gray-800 mb-4">Company Information</Text>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500">Company Name</Text>
                  <Text className="text-base font-semibold text-gray-800">{selectedSupplier.companyName || 'N/A'}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500">Year Established</Text>
                  <Text className="text-base font-semibold text-gray-800">{selectedSupplier.yearEstablished || 'N/A'}</Text>
                </View>
                
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-500">Tax ID / Registration</Text>
                  <Text className="text-base font-semibold text-gray-800">{selectedSupplier.taxId || 'N/A'}</Text>
                </View>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                    <Feather name="tag" size={18} color="#F59E0B" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Product Type</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedSupplier.productType || 'General Products'}</Text>
                  </View>
                </View>
                
                    <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                    <Feather name="calendar" size={18} color="#8B5CF6" />
                    </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Registered Since</Text>
                    <Text className="text-base font-semibold text-gray-800">{formatDate(selectedSupplier.createdAt?.toDate() || selectedSupplier.joinDate)}</Text>
                  </View>
                </View>
              </View>
              
              {/* Contact information */}
              <View className="bg-gray-50 rounded-xl p-4 mb-5">
                <Text className="text-lg font-bold text-gray-800 mb-4">Contact Information</Text>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Feather name="mail" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Email</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedSupplier.email || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Feather name="phone" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Phone</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedSupplier.phone || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <Feather name="globe" size={18} color="#EF4444" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-gray-500">Website</Text>
                    <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                      {selectedSupplier.website || 'N/A'}
                    </Text>
                  </View>
                </View>
                
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Feather name="map-pin" size={18} color="#6366F1" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Address</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedSupplier.address || 'N/A'}</Text>
                  </View>
                </View>
              </View>
              
              {/* Supplier Statistics */}
              <View className="bg-gray-50 rounded-xl p-4 mb-5">
                <Text className="text-lg font-bold text-gray-800 mb-4">Supplier Statistics</Text>
                
                {selectedSupplier.loadingStats ? (
                  <View className="py-4 items-center">
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text className="text-sm text-gray-500 mt-2">Loading statistics...</Text>
                  </View>
                ) : (
                <View className="flex-row justify-between">
                    <View className="bg-white rounded-lg p-4 shadow-sm flex-1 mr-2 items-center">
                      <Text className="text-sm font-medium text-gray-500">Products</Text>
                      <Text className="text-xl font-bold text-indigo-600 mt-2">{selectedSupplier.products || 0}</Text>
                  </View>
                  
                    <View className="bg-white rounded-lg p-4 shadow-sm flex-1 ml-2 items-center">
                      <Text className="text-sm font-medium text-gray-500">Total Orders</Text>
                      <Text className="text-xl font-bold text-green-600 mt-2">{selectedSupplier.totalOrders || 0}</Text>
                    </View>
                  </View>
                )}
              </View>
              
              {/* Action Buttons */}
              <View className="flex-row justify-between mb-2">
                <TouchableOpacity
                  className="bg-indigo-500 py-4 rounded-lg flex-row justify-center items-center flex-1 mr-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setModalVisible(false);
                    router.push(`/(app)/manager/supplierProducts?id=${selectedSupplier.id}`);
                  }}
                >
                  <FontAwesome name="cube" size={18} color="white" />
                  <Text className="ml-2 text-white font-bold text-base">View Products</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-green-500 py-4 rounded-lg flex-row justify-center items-center flex-1 ml-2"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setModalVisible(false);
                    
                    // Pass parameters to chatRoom
                    const params = {
                      uid: selectedSupplier.id,
                      recipientId: selectedSupplier.id,
                      name: selectedSupplier.companyName || `${selectedSupplier.firstName || ''} ${selectedSupplier.lastName || ''}`,
                      recipientName: selectedSupplier.companyName || `${selectedSupplier.firstName || ''} ${selectedSupplier.lastName || ''}`,
                      image: selectedSupplier.profileImage || '',
                      email: selectedSupplier.email || ''
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
                  <Text className="ml-2 text-white font-bold text-base">Contact</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  // Render category filter modal
  const renderCategoryFilterModal = () => {
    return (
      <Modal
        visible={categoryFilterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCategoryFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setCategoryFilterModalVisible(false)}
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
            elevation: 5,
            maxWidth: width * 0.7,
            maxHeight: height * 0.7
          }}>
            <View className="border-b border-gray-100 pb-2 mb-2">
              <Text className="text-base font-bold text-gray-800 px-2">
                Filter by Category
              </Text>
            </View>
            
            <ScrollView style={{ maxHeight: height * 0.5 }}>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                  fetchSupplierProductsByCategory(null);
                  setCategoryFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                  <Feather name="grid" size={14} color="#6B7280" />
              </View>
                <Text className={`font-medium ${!selectedCategory ? 'text-blue-600' : 'text-gray-800'}`}>
                  All Categories
                </Text>
                {!selectedCategory && <MaterialIcons name="check" size={20} color="#4F46E5" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
              {categories.map(category => (
            <TouchableOpacity
                  key={category.id}
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                    fetchSupplierProductsByCategory(category.id);
                    setCategoryFilterModalVisible(false);
              }}
            >
                  <View className="w-6 h-6 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Feather name="tag" size={14} color="#4F46E5" />
              </View>
                  <Text className={`font-medium ${selectedCategory === category.id ? 'text-indigo-600' : 'text-gray-800'}`}>
                    {category.name}
                  </Text>
                  {selectedCategory === category.id && (
                    <MaterialIcons name="check" size={20} color="#4F46E5" style={{ marginLeft: 8 }} />
                  )}
            </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      <HomeHeader title="Supplier Management" showBackButton />

      {/* Search Bar with Filter Button */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search suppliers..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        {/* Category Filter Button */}
        <TouchableOpacity 
          className="bg-gray-100 p-3 rounded-lg"
          onPress={() => setCategoryFilterModalVisible(true)}
        >
          <Feather 
            name="filter" 
            size={20} 
            color={selectedCategory ? '#4F46E5' : '#6B7280'} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Active Filters Display */}
      {selectedCategory && (
        <View className="px-4 py-2 bg-white border-b border-gray-200 flex-row flex-wrap items-center">
          <Text className="text-xs text-gray-500 mr-2">Filtered by:</Text>
          
          {selectedCategory && (
            <View className="bg-indigo-50 px-2 py-1 rounded-full mr-2 mb-1 flex-row items-center">
              <Text className="text-xs text-indigo-600 mr-1">
                {categories.find(c => c.id === selectedCategory)?.name || 'Category'}
              </Text>
              <TouchableOpacity onPress={() => fetchSupplierProductsByCategory(null)}>
                <Feather name="x" size={12} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          )}
          
          <TouchableOpacity 
            onPress={() => fetchSupplierProductsByCategory(null)}
            className="mb-1"
          >
            <Text className="text-xs text-gray-500">Clear all</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Supplier List */}
      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="text-gray-500 mt-2">Loading suppliers...</Text>
        </View>
      ) : error ? (
        <View className="flex-1 justify-center items-center p-4">
          <MaterialIcons name="error-outline" size={64} color="#EF4444" />
          <Text className="text-red-500 text-lg font-medium mt-4 text-center">{error}</Text>
          <TouchableOpacity
            className="mt-4 bg-indigo-500 py-2 px-6 rounded-lg"
            onPress={fetchSuppliers}
          >
            <Text className="text-white font-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredSuppliers}
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
              <FontAwesome name="industry" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 text-lg mt-4">No suppliers found</Text>
              <Text className="text-gray-400 text-sm mt-2">Try adjusting your search or filters</Text>
            </View>
          )}
          renderItem={renderSupplierCard}
          ListHeaderComponent={() => (
            <View className="flex-row justify-between mb-4">
              <View className="bg-white rounded-xl p-3 shadow-sm flex-1 mr-2 items-center">
                <Text className="text-xs font-medium text-gray-500">Total Suppliers</Text>
                <Text className="text-xl font-bold text-indigo-600 mt-1">{suppliers.length}</Text>
              </View>
              
              <View className="bg-white rounded-xl p-3 shadow-sm flex-1 ml-2 items-center">
                <Text className="text-xs font-medium text-gray-500">Active</Text>
                <Text className="text-xl font-bold text-green-600 mt-1">
                  {suppliers.filter(s => s.status === 'active').length}
                </Text>
              </View>
            </View>
          )}
        />
      )}

      {/* Add Supplier FAB */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: 20,
          right: 20,
          backgroundColor: '#4F46E5',
          width: 58,
          height: 58,
          borderRadius: 29,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: "#4F46E5",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 5
        }}
        onPress={() => router.push('/(app)/admine/addSuplier')}
      >
        <AntDesign name="plus" size={24} color="white" />
      </TouchableOpacity>

      {/* Supplier Detail Modal */}
      {renderSupplierModal()}
      
      {/* Category Filter Modal */}
      {renderCategoryFilterModal()}
    </SafeAreaView>
  );
}
