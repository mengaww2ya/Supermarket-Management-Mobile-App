import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform,
  Vibration,
  Image,
  Modal,
  Pressable,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { db } from '../../../firebase/firebaseConfig';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function ExpireNotifications() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showAutoDeleteAlert, setShowAutoDeleteAlert] = useState(false);
  const [autoDeletedProducts, setAutoDeletedProducts] = useState([]);

  // Add this line to get screen dimensions
  const { height } = Dimensions.get('window');

  const fetchExpiringProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, "Products");
      const q = query(productsRef, where('status', '!=', 'Deleted'));
      const snapshot = await getDocs(q);
      
      const currentDate = new Date();
      const threeMonthsFromNow = new Date();
      threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
      
      const expiringProducts = [];
      const expiredProducts = [];
      
      snapshot.docs.forEach(doc => {
        const product = {
          id: doc.id,
          ...doc.data()
        };
        
        // Check if product has expiration date
        if (product.expirationDate) {
          const expiryDate = new Date(product.expirationDate);
          
          // Check if product is expired
          if (expiryDate < currentDate) {
            expiredProducts.push(product);
          }
          // Check if product is approaching expiry (within 3 months)
          else if (expiryDate <= threeMonthsFromNow) {
            // Calculate days until expiry
            const daysUntilExpiry = Math.ceil((expiryDate - currentDate) / (1000 * 60 * 60 * 24));
            expiringProducts.push({
              ...product,
              daysUntilExpiry
            });
          }
        }
      });
      
      // Sort products by expiration date (closest to expiry first)
      const sortByExpiry = (a, b) => {
        const dateA = new Date(a.expirationDate);
        const dateB = new Date(b.expirationDate);
        return dateA - dateB;
      };
      
      const sortedExpiringProducts = expiringProducts.sort(sortByExpiry);
      console.log('Expiring products:', sortedExpiringProducts); // Debug log
      setProducts(sortedExpiringProducts);
      
      // If there are expired products, mark them as deleted
      if (expiredProducts.length > 0) {
        const autoDeletedProducts = [];
        
        for (const product of expiredProducts) {
          try {
            const productRef = doc(db, "Products", product.id);
            await updateDoc(productRef, {
              isDeleted: true,
              deletedAt: Timestamp.now(),
              deletedReason: "Auto-deleted due to expiration",
              deletedBy: "System"
            });
            autoDeletedProducts.push(product);
          } catch (error) {
            console.error(`Error marking product ${product.id} as deleted:`, error);
          }
        }
        
        if (autoDeletedProducts.length > 0) {
          setAutoDeletedProducts(autoDeletedProducts);
          setShowAutoDeleteAlert(true);
        }
      }
      
    } catch (error) {
      console.error("Error fetching expiring products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchExpiringProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchExpiringProducts();
  };

  const handleProductPress = (product) => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else {
      Vibration.vibrate(30);
    }
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const closeProductModal = () => {
    setShowProductModal(false);
    setTimeout(() => {
      setSelectedProduct(null);
    }, 300);
  };

  const handleEditProduct = () => {
    closeProductModal();
    router.push({
      pathname: "/stockManager/addProduct",
      params: {
        editMode: "true",
        id: selectedProduct.id
      }
    });
  };

  const handleDeleteProduct = async () => {
    Alert.alert(
      "Delete Product",
      "Are you sure you want to delete this product? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (Platform.OS === 'ios') {
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              } else {
                Vibration.vibrate(100);
              }
              
              // Mark as deleted in Firestore
              await updateDoc(doc(db, 'Products', selectedProduct.id), {
                isDeleted: true,
                deletedAt: Timestamp.now(),
                deletedReason: 'Manual deletion by stock manager',
                deletedBy: 'Stock Manager'
              });
              
              // Update local state
              setProducts(products.filter(p => p.id !== selectedProduct.id));
              
              // Close modal
              closeProductModal();
              
              // Show success message
              Alert.alert("Success", "Product has been deleted successfully");
            } catch (error) {
              console.error("Error deleting product:", error);
              Alert.alert("Error", "Failed to delete product. Please try again.");
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const handleViewDeletedProducts = () => {
    router.push("/stockManager/deleted");
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar style="dark" />
      
      {/* Header */}
      <View className="px-4 py-4 bg-white border-b border-gray-200 flex-row justify-between items-center">
        <TouchableOpacity
          onPress={() => router.back()}
          className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
        >
          <Ionicons name="arrow-back" size={20} color="#4b5563" />
        </TouchableOpacity>

        <Text className="text-xl font-bold text-gray-800">Expiration Notifications</Text>

        <TouchableOpacity
          onPress={onRefresh}
          className="w-10 h-10 rounded-full bg-gray-100 justify-center items-center"
        >
          <Ionicons name="refresh" size={20} color="#4b5563" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-500 mt-4">Loading expiring products...</Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1 px-4"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
        >
          {products && products.length > 0 ? (
            <View className="py-4">
              <Text className="text-gray-500 mb-4">
                {products.length} product{products.length !== 1 ? 's' : ''} approaching expiration
              </Text>
              
              {products.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => handleProductPress(product)}
                  className="bg-white rounded-xl p-4 mb-4 shadow-sm"
                >
                  <View className="flex-row">
                    {product.image ? (
                      <Image 
                        source={{ uri: product.image }} 
                        className="w-20 h-20 rounded-lg mr-3"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-lg mr-3 bg-gray-200 items-center justify-center">
                        <Ionicons name="image-outline" size={24} color="#9ca3af" />
                      </View>
                    )}
                    
                    <View className="flex-1">
                      <View className="flex-row justify-between items-start mb-1">
                        <Text className="text-lg font-semibold text-gray-800 flex-1 mr-2">
                          {product.productName}
                        </Text>
                        <View className="bg-red-100 px-3 py-1 rounded-full">
                          <Text className="text-red-600 text-xs font-medium">
                            {product.daysUntilExpiry} days left
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-1">
                        <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-500 text-sm ml-2">
                          Expires: {formatDate(product.expirationDate)}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="cube-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-500 text-sm ml-2">
                          Stock: {product.stockQuantity} {product.unitType}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="checkmark-circle-outline" size={48} color="#10b981" />
              <Text className="text-gray-800 mt-4 text-lg font-medium">All Clear!</Text>
              <Text className="text-gray-500 text-center mt-2">
                No products are approaching expiration within the next three months.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Product Detail Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showProductModal}
        onRequestClose={closeProductModal}
        statusBarTranslucent={true}
      >
        <View className="flex-1 bg-black/50 justify-center items-center">
          <Pressable 
            className="absolute inset-0"
            onPress={closeProductModal}
          />
          <Animated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            className="bg-white w-[90%] rounded-2xl overflow-hidden"
            style={{ 
              maxHeight: height * 0.8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 10,
            }}
          >
            <View className="px-4 py-4 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-xl font-bold text-gray-800">Product Details</Text>
                <TouchableOpacity 
                  onPress={closeProductModal}
                  className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="#4b5563" />
                </TouchableOpacity>
              </View>
            </View>

            {selectedProduct && (
              <ScrollView 
                showsVerticalScrollIndicator={true}
                bounces={false}
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                <View className="p-4">
                  <View className="items-center mb-4">
                    {selectedProduct.image ? (
                      <Image 
                        source={{ uri: selectedProduct.image }} 
                        className="w-40 h-40 rounded-lg"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-40 h-40 rounded-lg bg-gray-200 items-center justify-center">
                        <Ionicons name="image-outline" size={40} color="#9ca3af" />
                      </View>
                    )}
                  </View>

                  <View className="mb-4">
                    <Text className="text-2xl font-bold text-gray-800 mb-1">
                      {selectedProduct.productName}
                    </Text>
                    <View className="bg-red-100 px-3 py-1 rounded-full self-start">
                      <Text className="text-red-600 text-sm font-medium">
                        {selectedProduct.daysUntilExpiry} days until expiration
                      </Text>
                    </View>
                  </View>

                  {/* Basic Information */}
                  <View className="bg-gray-50 p-4 rounded-xl mb-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">Basic Information</Text>
                    
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Description</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {selectedProduct.description || "No description provided"}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="pricetag-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Price</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {formatCurrency(selectedProduct.price)}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="cube-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Stock</Text>
                    </View>
                    <Text className="text-gray-600 ml-7">
                      {selectedProduct.stockQuantity} {selectedProduct.unitType}
                    </Text>
                  </View>

                  {/* Dates Information */}
                  <View className="bg-gray-50 p-4 rounded-xl mb-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">Dates Information</Text>
                    
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Production Date</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {formatDate(selectedProduct.productionDate)}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Expiration Date</Text>
                    </View>
                    <Text className="text-gray-600 ml-7">
                      {formatDate(selectedProduct.expirationDate)}
                    </Text>
                  </View>

                  {/* Additional Information */}
                  <View className="bg-gray-50 p-4 rounded-xl mb-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">Additional Information</Text>
                    
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="business-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Brand</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {selectedProduct.brand || "Not specified"}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="people-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Supplier</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {selectedProduct.supplier || "Not specified"}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="time-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Date Added</Text>
                    </View>
                    <Text className="text-gray-600 ml-7">
                      {formatDate(selectedProduct.dateAdded)}
                    </Text>
                  </View>

                  {/* Discount Information */}
                  {selectedProduct.hasDiscount && (
                    <View className="bg-gray-50 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold text-gray-800 mb-3">Discount Information</Text>
                      
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="pricetag-outline" size={20} color="#4f46e5" />
                        <Text className="text-gray-800 font-medium ml-2">Discount Price</Text>
                      </View>
                      <Text className="text-gray-600 ml-7 mb-3">
                        {formatCurrency(selectedProduct.discountPrice)}
                      </Text>

                      <View className="flex-row items-center mb-2">
                        <Ionicons name="calendar-outline" size={20} color="#4f46e5" />
                        <Text className="text-gray-800 font-medium ml-2">Discount Period</Text>
                      </View>
                      <Text className="text-gray-600 ml-7">
                        {formatDate(selectedProduct.discountStartDate)} - {formatDate(selectedProduct.discountEndDate)}
                      </Text>
                    </View>
                  )}

                  {/* Special Offer Information */}
                  {selectedProduct.hasSpecialOffer && selectedProduct.specialOfferDetails && (
                    <View className="bg-gray-50 p-4 rounded-xl mb-4">
                      <Text className="text-lg font-semibold text-gray-800 mb-3">Special Offer</Text>
                      
                      <View className="flex-row items-center mb-2">
                        <Ionicons name="gift-outline" size={20} color="#4f46e5" />
                        <Text className="text-gray-800 font-medium ml-2">Special Offer Details</Text>
                      </View>
                      <Text className="text-gray-600 ml-7 mb-3">
                        Buy {selectedProduct.specialOfferDetails.quantity} items and get {selectedProduct.specialOfferDetails.discountPercentage}% discount
                      </Text>
                    </View>
                  )}

                  <View className="flex-row justify-between mt-4 mb-4">
                    <TouchableOpacity
                      onPress={handleEditProduct}
                      className="bg-indigo-100 py-3 px-4 rounded-xl flex-row items-center justify-center flex-1 mr-2"
                    >
                      <Ionicons name="create-outline" size={20} color="#4f46e5" />
                      <Text className="text-indigo-600 font-medium ml-2">Edit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      onPress={handleDeleteProduct}
                      className="bg-red-100 py-3 px-4 rounded-xl flex-row items-center justify-center flex-1 ml-2"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text className="text-red-600 font-medium ml-2">Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>

      {/* Auto-Delete Alert Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showAutoDeleteAlert}
        onRequestClose={() => setShowAutoDeleteAlert(false)}
        statusBarTranslucent={true}
      >
        <Pressable 
          className="flex-1 bg-black/50 justify-center items-center"
          onPress={() => setShowAutoDeleteAlert(false)}
        >
          <Animated.View 
            entering={FadeIn.duration(300)}
            exiting={FadeOut.duration(300)}
            className="bg-white w-[90%] rounded-2xl overflow-hidden"
          >
            <View className="p-4">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-bold text-gray-800">Products Automatically Deleted</Text>
                <TouchableOpacity onPress={() => setShowAutoDeleteAlert(false)}>
                  <Ionicons name="close" size={24} color="#4b5563" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="text-gray-600 mb-2">
                  The following products have expired and have been automatically removed from the customer view:
                </Text>
                
                {autoDeletedProducts.map((product) => (
                  <View key={product.id} className="bg-gray-50 p-3 rounded-lg mb-2">
                    <Text className="font-medium text-gray-800">{product.productName}</Text>
                    <Text className="text-gray-500 text-sm">
                      Expired on: {formatDate(product.expirationDate)}
                    </Text>
                  </View>
                ))}
              </View>

              <View className="flex-row justify-between mt-4">
                <TouchableOpacity
                  onPress={() => setShowAutoDeleteAlert(false)}
                  className="bg-gray-100 py-3 px-4 rounded-xl flex-row items-center justify-center flex-1 mr-2"
                >
                  <Text className="text-gray-600 font-medium">Close</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleViewDeletedProducts}
                  className="bg-indigo-100 py-3 px-4 rounded-xl flex-row items-center justify-center flex-1 ml-2"
                >
                  <Ionicons name="trash-outline" size={20} color="#4f46e5" />
                  <Text className="text-indigo-600 font-medium ml-2">View Deleted Products</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
