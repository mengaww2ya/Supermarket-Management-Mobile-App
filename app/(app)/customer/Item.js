import React, { useState, useEffect, useRef } from "react";
import {
  Pressable,
  Dimensions,
  Image,
  Text,
  ScrollView,
  View,
  SafeAreaView,
  Modal,
  Alert,
  TouchableOpacity,
  Animated,
  StatusBar,
  Share,
  ActivityIndicator,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from '../../../firebase/firebaseConfig';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import HomeHeader from "../../components/HomeHeader";
import { LinearGradient } from "expo-linear-gradient";

const { width, height } = Dimensions.get("window");

export default function Item() {
  const router = useRouter();
  const { productId } = useLocalSearchParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedTab, setSelectedTab] = useState('description');
  const [isFavorite, setIsFavorite] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
    extrapolate: 'clamp'
  });
  
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
    
    fetchProduct();
  }, [productId]);

    const fetchProduct = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, "Products", productId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...docSnap.data() };
        
        // Check if product is deleted
        if (productData.isDeleted) {
          setError("This product is no longer available");
          setTimeout(() => {
            router.back();
          }, 2000);
          return;
        }
        
        // Check if product is expired
        if (productData.expirationDate && productData.expirationDate.toDate) {
          const expiryDate = productData.expirationDate.toDate();
          const currentDate = new Date();
          
          if (expiryDate < currentDate) {
            setError("This product has expired and is no longer available");
            setTimeout(() => {
              router.back();
            }, 2000);
            return;
          }
        }
        
        // Check if product has stock
        if (productData.stockQuantity <= 0) {
          setError("This product is out of stock");
          setTimeout(() => {
            router.back();
          }, 2000);
          return;
        }
        
        setProduct(productData);
        setError(null);
      } else {
        setError("Product not found");
        setTimeout(() => {
          router.back();
        }, 2000);
      }
    } catch (err) {
      console.error("Error fetching product:", err);
      setError("Failed to load product. Please try again later.");
      setTimeout(() => {
        router.back();
      }, 2000);
    } finally {
      setLoading(false);
    }
  };

  const incrementQuantity = () => {
    if (product && quantity < product.stockQuantity) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  const handleLikePress = async (ratingValue) => {
    try {
      // Update product ratings in Firestore
      const docRef = doc(db, "Products", productId);
      await updateDoc(docRef, {
        totalRatings: increment(ratingValue),
        numberOfReviews: increment(1)
      });
      
      Alert.alert(
        "Rating Submitted",
        `Thank you for rating ${product.productName}!`,
        [{ text: "OK", onPress: () => setModalVisible(false) }]
      );
      
      // Refetch product to get updated ratings
    fetchProduct();
    } catch (error) {
      console.error("Error updating rating:", error);
      Alert.alert("Error", "Failed to submit rating");
    }
  };

  const handleShare = async () => {
    try {
      const result = await Share.share({
        message: `Check out ${product.productName} for ${product.discountPrice || product.price} Birr at SuperMart!`,
        url: product.image,
        title: `SuperMart: ${product.productName}`
      });
    } catch (error) {
      Alert.alert("Error", "Failed to share product");
    }
  };

  const handleAddToCart = () => {
    router.push({
      pathname: "/customer/addToCart",
      params: {
        productId: product.id,
        productName: product.productName,
        price: product.price,
        discountPrice: product.discountPrice,
        unitType: product.unitType,
        image: product.image,
        quantity: quantity
      },
    });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // Here you would typically save to user's favorites in Firestore
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <ActivityIndicator size="large" color="#4CAF50" />
      </SafeAreaView>
    );
  }

  if (error || !product) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F9FAFB' }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#EF4444' }}>{error || "Product Not Found"}</Text>
        <TouchableOpacity 
          style={{ 
            marginTop: 20, 
            backgroundColor: '#3B82F6', 
            paddingHorizontal: 20, 
            paddingVertical: 10, 
            borderRadius: 10 
          }}
          onPress={() => router.back()}
        >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const { 
    productName, 
    image, 
    categoryName, 
    price, 
    discountPrice, 
    description, 
    stockQuantity, 
    unitType, 
    brand, 
    status, 
    supplier, 
    ratings, 
    numberOfReviews 
  } = product;

  const discount = discountPrice ? Math.round(((price - discountPrice) / price) * 100) : 0;
  const averageRating = numberOfReviews > 0 ? (ratings / numberOfReviews).toFixed(1) : 0;

  const renderStars = (rating) => {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Ionicons
            key={star}
            name={star <= Math.round(rating) ? "star" : "star-outline"}
            size={16}
            color={star <= Math.round(rating) ? "#FFC107" : "#CBD5E0"}
            style={{ marginRight: 2 }}
          />
        ))}
        <Text style={{ marginLeft: 4, color: '#4B5563', fontSize: 14 }}>
          ({numberOfReviews || 0})
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" />
      
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 60,
          backgroundColor: 'white',
          zIndex: 99,
          opacity: headerOpacity,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#f0f0f0',
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text 
          style={{ 
            flex: 1, 
            marginLeft: 16, 
            fontSize: 16, 
            fontWeight: 'bold', 
            color: '#1F2937' 
          }}
          numberOfLines={1}
        >
          {productName}
        </Text>
        <TouchableOpacity onPress={toggleFavorite} style={{ marginRight: 16 }}>
          <Ionicons 
            name={isFavorite ? "heart" : "heart-outline"} 
            size={24} 
            color={isFavorite ? "#EF4444" : "#1F2937"} 
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare}>
          <Ionicons name="share-social-outline" size={24} color="#1F2937" />
        </TouchableOpacity>
      </Animated.View>
      
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        style={{ 
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }] 
        }}
      >
        {/* Back Button */}
        <TouchableOpacity 
          style={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 10,
            backgroundColor: 'rgba(255,255,255,0.8)',
            borderRadius: 20,
            width: 40,
            height: 40,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3.84,
            elevation: 5,
          }}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        
        {/* Action Buttons */}
        <View style={{ 
          position: 'absolute', 
          top: 16, 
          right: 16, 
          zIndex: 10,
          flexDirection: 'row',
        }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={toggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? "#EF4444" : "#1F2937"} 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 20,
              width: 40,
              height: 40,
              justifyContent: 'center',
              alignItems: 'center',
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onPress={handleShare}
          >
            <Ionicons name="share-social-outline" size={24} color="#1F2937" />
          </TouchableOpacity>
        </View>
        
        {/* Product Image */}
        <View style={{ width: '100%', height: 300, backgroundColor: '#fff' }}>
          <Image
            source={{ uri: image }}
            style={{ width: '100%', height: '100%', resizeMode: 'contain' }}
          />
          
          {discount > 0 && (
            <View style={{ 
              position: 'absolute', 
              top: 20, 
              left: 0,
              backgroundColor: '#EF4444',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderTopRightRadius: 8,
              borderBottomRightRadius: 8,
            }}>
              <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 14 }}>
                {discount}% OFF
              </Text>
            </View>
          )}
        </View>
        
        {/* Product Info */}
        <View style={{ padding: 16, backgroundColor: 'white' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 }}>
                {productName}
              </Text>
              <Text style={{ fontSize: 16, color: '#6B7280', marginBottom: 8 }}>
                {categoryName} • {brand}
              </Text>
              {renderStars(averageRating)}
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              {discountPrice ? (
                <>
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#EF4444' }}>
                    {discountPrice} Birr
                  </Text>
                  <Text style={{ 
                    fontSize: 16, 
                    color: '#9CA3AF', 
                    textDecorationLine: 'line-through' 
                  }}>
                    {price} Birr
                  </Text>
                </>
              ) : (
                <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#10B981' }}>
                  {price} Birr
                </Text>
              )}
              <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 2 }}>
                per {unitType}
              </Text>
            </View>
          </View>
          
          {/* Stock Status */}
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            marginTop: 16,
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: '#F3F4F6'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, color: '#4B5563' }}>
                Availability
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                <View 
                  style={{ 
                    width: 10, 
                    height: 10, 
                    borderRadius: 5, 
                    backgroundColor: stockQuantity > 0 ? '#10B981' : '#EF4444',
                    marginRight: 8
                  }} 
                />
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: '500',
                  color: stockQuantity > 0 ? '#10B981' : '#EF4444'
                }}>
                  {stockQuantity > 0 ? `In Stock (${stockQuantity} available)` : "Out of Stock"}
                </Text>
              </View>
            </View>
            
            {/* Quantity Selector */}
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              backgroundColor: '#F3F4F6',
              borderRadius: 8,
              padding: 4
            }}>
              <TouchableOpacity 
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14,
                  backgroundColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center' 
                }}
                onPress={decrementQuantity}
                disabled={quantity <= 1}
              >
                <Ionicons name="remove" size={18} color="#4B5563" />
              </TouchableOpacity>
              
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginHorizontal: 12, 
                color: '#1F2937',
                minWidth: 20,
                textAlign: 'center'
              }}>
                {quantity}
          </Text>

              <TouchableOpacity 
                style={{ 
                  width: 28, 
                  height: 28, 
                  borderRadius: 14,
                  backgroundColor: '#E5E7EB',
                  justifyContent: 'center',
                  alignItems: 'center' 
                }}
                onPress={incrementQuantity}
                disabled={quantity >= stockQuantity}
            >
                <Ionicons name="add" size={18} color="#4B5563" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        
        {/* Tabs */}
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: 'white',
          paddingHorizontal: 16,
          paddingBottom: 16,
          marginBottom: 8,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}>
          <TouchableOpacity 
            style={{ 
              paddingVertical: 8, 
              paddingHorizontal: 12,
              borderBottomWidth: 2,
              borderBottomColor: selectedTab === 'description' ? '#4CAF50' : 'transparent',
              marginRight: 16
            }}
            onPress={() => setSelectedTab('description')}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: selectedTab === 'description' ? '#4CAF50' : '#6B7280'
            }}>
              Description
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              paddingVertical: 8, 
              paddingHorizontal: 12,
              borderBottomWidth: 2,
              borderBottomColor: selectedTab === 'details' ? '#4CAF50' : 'transparent',
              marginRight: 16
            }}
            onPress={() => setSelectedTab('details')}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: selectedTab === 'details' ? '#4CAF50' : '#6B7280'
            }}>
              Details
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={{ 
              paddingVertical: 8, 
              paddingHorizontal: 12,
              borderBottomWidth: 2,
              borderBottomColor: selectedTab === 'reviews' ? '#4CAF50' : 'transparent'
            }}
            onPress={() => setSelectedTab('reviews')}
          >
            <Text style={{ 
              fontSize: 16, 
              fontWeight: '500', 
              color: selectedTab === 'reviews' ? '#4CAF50' : '#6B7280'
            }}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Content */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          marginBottom: 16,
          borderRadius: 16
        }}>
          {selectedTab === 'description' && (
            <View>
              <Text style={{ fontSize: 16, lineHeight: 24, color: '#4B5563' }}>
                {description || "No description available."}
              </Text>
            </View>
          )}
          
          {selectedTab === 'details' && (
            <View>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ width: 100 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Brand</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>
                  {brand || "N/A"}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ width: 100 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Supplier</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>
                  {supplier || "N/A"}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ width: 100 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Status</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>
                  {status || "N/A"}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <View style={{ width: 100 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Unit Type</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>
                  {unitType || "N/A"}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row' }}>
                <View style={{ width: 100 }}>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Stock</Text>
                </View>
                <Text style={{ fontSize: 14, color: '#1F2937', fontWeight: '500' }}>
                  {stockQuantity || "0"} available
                </Text>
              </View>
            </View>
          )}
          
          {selectedTab === 'reviews' && (
            <View>
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 36, fontWeight: 'bold', color: '#1F2937' }}>
                  {averageRating}
                </Text>
                {renderStars(averageRating)}
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
                  Based on {numberOfReviews || 0} reviews
                </Text>
              </View>
              
              <TouchableOpacity 
                style={{ 
                  backgroundColor: '#4CAF50', 
                  paddingVertical: 12,
                  borderRadius: 8,
                  alignItems: 'center',
                  marginTop: 8
                }}
                onPress={() => setModalVisible(true)}
              >
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  Rate This Product
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {/* Similar Products Placeholder */}
        <View style={{ 
          backgroundColor: 'white', 
          padding: 16, 
          marginBottom: 100,
          borderRadius: 16
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937', marginBottom: 16 }}>
            You Might Also Like
          </Text>
          
          <Text style={{ color: '#6B7280', fontSize: 14 }}>
            Coming soon - similar products based on your browsing history
          </Text>
        </View>
      </Animated.ScrollView>
      
      {/* Bottom Action Bar */}
      <View style={{ 
        position: 'absolute', 
        bottom: 0, 
        left: 0, 
        right: 0,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            Total Price
          </Text>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#1F2937' }}>
            {((discountPrice || price) * quantity).toFixed(2)} Birr
          </Text>
        </View>
        
        <TouchableOpacity 
          style={{ 
            backgroundColor: stockQuantity > 0 ? '#4CAF50' : '#9CA3AF',
            paddingVertical: 12,
            paddingHorizontal: 24,
            borderRadius: 8,
            flexDirection: 'row',
            alignItems: 'center'
          }}
          onPress={handleAddToCart}
          disabled={stockQuantity <= 0}
        >
          <Ionicons name="cart" size={20} color="white" style={{ marginRight: 8 }} />
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
            {stockQuantity > 0 ? "Add to Cart" : "Out of Stock"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Rating Modal */}
      <Modal animationType="fade" transparent={true} visible={modalVisible}>
        <View style={{ 
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center', 
          backgroundColor: 'rgba(0,0,0,0.5)' 
        }}>
          <View style={{ 
            backgroundColor: 'white', 
            borderRadius: 16,
            padding: 24,
            width: width * 0.8,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5,
          }}>
            <Text style={{ 
              fontSize: 20, 
              fontWeight: 'bold', 
              color: '#1F2937', 
              marginBottom: 16,
              textAlign: 'center' 
            }}>
              Rate {productName}
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              marginBottom: 24 
            }}>
              {[1, 2, 3, 4, 5].map((ratingValue) => (
                <TouchableOpacity
                  key={ratingValue}
                  style={{ 
                    alignItems: 'center', 
                    paddingHorizontal: 8 
                  }}
                  onPress={() => handleLikePress(ratingValue)}
                >
                  <Ionicons 
                    name="star" 
                    size={32} 
                    color="#FFC107" 
                    style={{ opacity: ratingValue <= 0 ? 0.3 : 1 }}
                  />
                  <Text style={{ 
                    marginTop: 4, 
                    fontSize: 12, 
                    color: '#4B5563',
                    fontWeight: '500'
                  }}>
                    {ratingValue}
                    </Text>
                </TouchableOpacity>
              ))}
            </View>
            
            <TouchableOpacity 
              style={{ 
                backgroundColor: '#F3F4F6', 
                paddingVertical: 12,
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => setModalVisible(false)}
            >
              <Text style={{ color: '#4B5563', fontWeight: '500', fontSize: 16 }}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}