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
import { collection, query, where, getDocs, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export default function DeletedProducts() {
  const router = useRouter();
  const [deletedProducts, setDeletedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const { height } = Dimensions.get('window');

  const fetchDeletedProducts = async () => {
    try {
      setLoading(true);
      const productsRef = collection(db, 'Products');
      const q = query(productsRef, where('isDeleted', '==', true));
      const querySnapshot = await getDocs(q);
      
      const products = [];
      querySnapshot.forEach((doc) => {
        const product = { id: doc.id, ...doc.data() };
        products.push(product);
      });

      // Sort by deletion date (newest first)
      products.sort((a, b) => {
        const dateA = a.deletedAt?.toDate() || new Date(0);
        const dateB = b.deletedAt?.toDate() || new Date(0);
        return dateB - dateA;
      });
      
      setDeletedProducts(products);

      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Vibration.vibrate(50);
      }
    } catch (error) {
      console.error('Error fetching deleted products:', error);
      Alert.alert('Error', 'Failed to fetch deleted products');
      setDeletedProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDeletedProducts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchDeletedProducts();
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

  const handlePermanentDelete = async () => {
    Alert.alert(
      "Permanently Delete Product",
      "Are you sure you want to permanently delete this product? This action cannot be undone.",
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
              
              // Permanently delete product from Firestore
              await deleteDoc(doc(db, 'Products', selectedProduct.id));
              
              // Update local state
              setDeletedProducts(deletedProducts.filter(p => p.id !== selectedProduct.id));
              
              // Close modal
              closeProductModal();
              
              // Show success message
              Alert.alert("Success", "Product has been permanently deleted");
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
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
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

        <Text className="text-xl font-bold text-gray-800">Deleted Products</Text>

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
          <Text className="text-gray-500 mt-4">Loading deleted products...</Text>
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
          {deletedProducts && deletedProducts.length > 0 ? (
            <View className="py-4">
              <Text className="text-gray-500 mb-4">
                {deletedProducts.length} deleted product{deletedProducts.length !== 1 ? 's' : ''}
              </Text>
              
              {deletedProducts.map((product) => (
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
                            Deleted
                          </Text>
                        </View>
                      </View>

                      <View className="flex-row items-center mb-1">
                        <Ionicons name="time-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-500 text-sm ml-2">
                          Deleted on: {formatDate(product.deletedAt?.toDate())}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="information-circle-outline" size={16} color="#6b7280" />
                        <Text className="text-gray-500 text-sm ml-2">
                          Reason: {product.deletedReason || "Unknown"}
                        </Text>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="trash-outline" size={48} color="#9ca3af" />
              <Text className="text-gray-800 mt-4 text-lg font-medium">No Deleted Products</Text>
              <Text className="text-gray-500 text-center mt-2">
                There are no deleted products to display.
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
                <Text className="text-xl font-bold text-gray-800">Deleted Product Details</Text>
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
                        Deleted
                      </Text>
                    </View>
                  </View>

                  {/* Deletion Information */}
                  <View className="bg-gray-50 p-4 rounded-xl mb-4">
                    <Text className="text-lg font-semibold text-gray-800 mb-3">Deletion Information</Text>
                    
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="time-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Deleted On</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {formatDate(selectedProduct.deletedAt?.toDate())}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="information-circle-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Reason</Text>
                    </View>
                    <Text className="text-gray-600 ml-7 mb-3">
                      {selectedProduct.deletedReason || "Unknown"}
                    </Text>

                    <View className="flex-row items-center mb-2">
                      <Ionicons name="person-outline" size={20} color="#4f46e5" />
                      <Text className="text-gray-800 font-medium ml-2">Deleted By</Text>
                    </View>
                    <Text className="text-gray-600 ml-7">
                      {selectedProduct.deletedBy || "Unknown"}
                    </Text>
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
                      onPress={handlePermanentDelete}
                      className="bg-red-100 py-3 px-4 rounded-xl flex-row items-center justify-center flex-1"
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      <Text className="text-red-600 font-medium ml-2">Delete Permanently</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

