import React, { useState, useRef, useEffect } from "react";
import {
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { db } from "../../../firebase/firebaseConfig";
import { doc, setDoc, collection, addDoc, getDoc, getDocs, updateDoc, increment } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import HomeHeader from "../../components/HomeHeader";

const { width, height } = Dimensions.get("window");
const CARD_WIDTH = width * 0.9;

export default function AddToCart() {
  const {
    productId,
    productName = "Unknown Product",
    price = "0",
    discountPrice = "0",
    unitType = "unit",
    image,
    quantity: initialQuantity = "1",
  } = useLocalSearchParams();

  const router = useRouter();
  const parsedPrice = parseFloat(discountPrice > 0 ? discountPrice : price) || 0;
  const originalPrice = parseFloat(price) || 0;
  const [quantity, setQuantity] = useState(parseInt(initialQuantity) || 1);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fetchingStock, setFetchingStock] = useState(true);
  const [note, setNote] = useState("");
  const [inputVisible, setInputVisible] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [animation] = useState(new Animated.Value(0));
  const [addingToCart, setAddingToCart] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    // Fetch product stock quantity
    fetchProductStock();
  }, []);

  const fetchProductStock = async () => {
    try {
      setFetchingStock(true);
      if (!productId) {
        console.error("No product ID provided");
        setFetchingStock(false);
        return;
      }
      
      const productRef = doc(db, "Products", productId);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = productSnap.data();
        setStockQuantity(productData.stockQuantity || 0);
      } else {
        console.error("Product not found");
      }
      
      setFetchingStock(false);
    } catch (error) {
      console.error("Error fetching product stock:", error);
      setFetchingStock(false);
    }
  };

  const increaseAmount = () => {
    if (quantity < stockQuantity) {
      const newQuantity = quantity + 1;
      setQuantity(newQuantity);
      
      // Animate the quantity change
      Animated.sequence([
        Animated.timing(animation, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Alert.alert(
        "Maximum Quantity Reached",
        `Sorry, you can only order up to ${stockQuantity} ${unitType}(s) of this product.`
      );
    }
  };

  const decreaseAmount = () => {
    if (quantity > 1) {
      const newQuantity = quantity - 1;
      setQuantity(newQuantity);
      
      // Animate the quantity change
      Animated.sequence([
        Animated.timing(animation, {
          toValue: -1,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(animation, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  };
  
  const handleDirectInput = () => {
    setInputValue(quantity.toString());
    setInputVisible(true);
  };

  const confirmQuantityInput = () => {
    const parsedInput = parseInt(inputValue);
    
    if (isNaN(parsedInput) || parsedInput < 1) {
      Alert.alert("Invalid Quantity", "Please enter a valid number greater than 0.");
      return;
    }
    
    if (parsedInput > stockQuantity) {
      Alert.alert(
        "Quantity Exceeds Stock",
        `Sorry, you can only order up to ${stockQuantity} ${unitType}(s) of this product.`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Set to Maximum",
            onPress: () => {
              setQuantity(stockQuantity);
              setInputVisible(false);
            }
          }
        ]
      );
      return;
    }
    
    setQuantity(parsedInput);
    setInputVisible(false);
  };

  const totalPrice = parsedPrice * quantity;
  const hasDiscount = discountPrice && discountPrice !== "0" && parseFloat(discountPrice) < parseFloat(price);
  const discountPercentage = hasDiscount 
    ? Math.round(((parseFloat(price) - parseFloat(discountPrice)) / parseFloat(price)) * 100) 
    : 0;

  const updateProductStock = async () => {
    try {
      const productRef = doc(db, "Products", productId);
      
      // Decrement the stock quantity by the ordered quantity
      await updateDoc(productRef, {
        stockQuantity: increment(-quantity)
      });
      
      console.log(`Stock updated: decreased by ${quantity}`);
    } catch (error) {
      console.error("Error updating stock:", error);
      // The item is still added to cart, even if stock update fails
      // This could be handled differently based on business requirements
    }
  };

  const addToCart = async () => {
    if (!currentUser) {
      Alert.alert("Error", "You need to be logged in to add items to cart.");
      return;
    }
    
    if (quantity > stockQuantity) {
      Alert.alert(
        "Not Enough Stock",
        `Sorry, only ${stockQuantity} ${unitType}(s) available in stock.`
      );
      return;
    }

    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      setLoading(true);
      setAddingToCart(true);
      
      // Create a timestamp for ordering
      const timestamp = new Date().getTime();

      // Create cart item for the current user
      const cartItemData = {
        productId,
        productName,
        price: originalPrice,
        discountPrice: hasDiscount ? parseFloat(discountPrice) : null,
        quantity,
        totalPrice,
        image,
        unitType,
        note: note.trim() || null,
        size: selectedSize || null,
        addedAt: timestamp,
        status: 'active'
      };

      // Add to user's cart subcollection
      // Users/{userId}/cart/{cartItemId}
      const userRef = doc(db, "users", currentUser.uid);
      const userCartRef = collection(userRef, "cart");
      
      // Check if the product is already in the cart
      // If it is, we might want to update the quantity instead of adding a new item
      const existingCartRef = collection(db, "users", currentUser.uid, "cart");
      const existingCartSnap = await getDocs(existingCartRef);
      
      let existingItem = null;
      existingCartSnap.forEach(doc => {
        const data = doc.data();
        if (data.productId === productId) {
          existingItem = { id: doc.id, ...data };
        }
      });
      
      if (existingItem) {
        // Update existing cart item
        const existingCartItemRef = doc(db, "users", currentUser.uid, "cart", existingItem.id);
        await updateDoc(existingCartItemRef, {
          quantity: increment(quantity),
          totalPrice: (existingItem.quantity + quantity) * parsedPrice,
          updatedAt: timestamp
        });
      } else {
        // Add new cart item
        await addDoc(userCartRef, cartItemData);
      }
      
      // Update the product stock in the database
      await updateProductStock();

      setLoading(false);
      
      Alert.alert(
        "Added to Cart", 
        `${quantity} ${unitType}(s) of ${productName} added to cart!`,
        [
          {
            text: "Continue Shopping",
            onPress: () => {
              setAddingToCart(false);
              router.back();
            },
            style: "cancel"
          },
          {
            text: "View Cart",
            onPress: () => {
              setAddingToCart(false);
              // Navigate to cart
              router.push("/customer/(tabs)/cart");
            }
          }
        ]
      );
    } catch (error) {
      setLoading(false);
      setAddingToCart(false);
      console.error("❌ Error adding to cart: ", error);
      Alert.alert("Error", `Could not add product to cart: ${error.message}`);
    }
  };

  // Animation style for quantity
  const animatedStyle = {
    transform: [
      {
        translateY: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [10, 0, -10],
        }),
      },
      {
        scale: animation.interpolate({
          inputRange: [-1, 0, 1],
          outputRange: [0.9, 1, 0.9],
        }),
      },
    ],
    opacity: animation.interpolate({
      inputRange: [-1, 0, 1],
      outputRange: [0.8, 1, 0.8],
    }),
  };

  if (fetchingStock) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar barStyle="dark-content" />
        <HomeHeader title="Add to Cart" />
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={{ marginTop: 16, color: '#4B5563' }}>Checking product availability...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar barStyle="dark-content" />
      <HomeHeader title="Add to Cart" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={{ 
            padding: 16,
            paddingBottom: 40,
          }} 
          showsVerticalScrollIndicator={false}
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            {/* Product Image */}
            <View style={{ 
              width: '100%', 
              height: 220, 
              borderRadius: 12, 
              overflow: 'hidden',
              backgroundColor: '#F3F4F6',
              marginBottom: 16,
              alignItems: 'center',
              justifyContent: 'center'
            }}>
          {image ? (
            <Image
                  style={{ width: "100%", height: "100%", resizeMode: "contain" }}
              source={{ uri: image }}
            />
          ) : (
                <View style={{ alignItems: 'center' }}>
                  <Ionicons name="image-outline" size={48} color="#9CA3AF" />
                  <Text style={{ color: '#9CA3AF', marginTop: 8 }}>No Image Available</Text>
                </View>
              )}
              
              {hasDiscount && (
                <View style={{ 
                  position: 'absolute',
                  top: 12,
                  left: 0,
                  backgroundColor: '#EF4444',
                  paddingHorizontal: 10,
                  paddingVertical: 5,
                  borderTopRightRadius: 8,
                  borderBottomRightRadius: 8,
                }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>
                    SAVE {discountPercentage}%
                  </Text>
                </View>
          )}
        </View>

            {/* Product Details */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ 
                fontSize: 22, 
                fontWeight: 'bold', 
                color: '#1F2937',
                marginBottom: 4
              }}>
                {productName}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                {hasDiscount ? (
                  <>
                    <Text style={{ 
                      fontSize: 18, 
                      fontWeight: 'bold', 
                      color: '#EF4444',
                      marginRight: 8
                    }}>
                      {parsedPrice.toFixed(2)} Birr
                    </Text>
                    <Text style={{ 
                      fontSize: 14, 
                      color: '#6B7280', 
                      textDecorationLine: 'line-through'
                    }}>
                      {originalPrice.toFixed(2)} Birr
                    </Text>
                  </>
                ) : (
                  <Text style={{ 
                    fontSize: 18, 
                    fontWeight: 'bold', 
                    color: '#10B981'
                  }}>
                    {parsedPrice.toFixed(2)} Birr
                  </Text>
                )}
                <Text style={{ marginLeft: 4, color: '#6B7280' }}>
                  per {unitType}
                </Text>
              </View>
              
              {/* Stock availability indicator */}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8 }}>
                <View style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: 4, 
                  backgroundColor: stockQuantity > 10 ? '#10B981' : stockQuantity > 0 ? '#F59E0B' : '#EF4444',
                  marginRight: 8
                }} />
                <Text style={{ 
                  fontSize: 14, 
                  color: stockQuantity > 10 ? '#10B981' : stockQuantity > 0 ? '#F59E0B' : '#EF4444',
                }}>
                  {stockQuantity > 10 
                    ? 'In Stock' 
                    : stockQuantity > 0 
                      ? `Limited Stock (${stockQuantity} left)` 
                      : 'Out of Stock'}
                </Text>
              </View>
            </View>
            
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              paddingVertical: 16,
              borderTopWidth: 1,
              borderBottomWidth: 1,
              borderColor: '#F3F4F6',
              marginBottom: 24,
            }}>
              <Text style={{ fontSize: 16, fontWeight: '500', color: '#4B5563' }}>
                Quantity
              </Text>
              
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: '#F9FAFB',
                borderRadius: 8,
                overflow: 'hidden'
              }}>
                <TouchableOpacity 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6'
                  }}
                  onPress={decreaseAmount}
                  disabled={quantity <= 1 || stockQuantity <= 0}
                >
                  <Ionicons name="remove" size={20} color={quantity <= 1 ? '#D1D5DB' : '#4B5563'} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                  onPress={handleDirectInput}
                  disabled={stockQuantity <= 0}
                >
                  <Animated.View style={[{ paddingHorizontal: 16 }, animatedStyle]}>
                    <Text style={{ 
                      fontSize: 16, 
                      fontWeight: 'bold', 
                      color: '#1F2937',
                      minWidth: 30,
                      textAlign: 'center'
                    }}>
                      {quantity}
                    </Text>
                  </Animated.View>
          </TouchableOpacity>

                <TouchableOpacity 
                  style={{ 
                    width: 40, 
                    height: 40, 
                    justifyContent: 'center',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6'
                  }}
                  onPress={increaseAmount}
                  disabled={quantity >= stockQuantity || stockQuantity <= 0}
                >
                  <Ionicons name="add" size={20} color={quantity >= stockQuantity ? '#D1D5DB' : '#4B5563'} />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Special Instructions */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ 
                fontSize: 16,
                fontWeight: '500',
                color: '#4B5563',
                marginBottom: 8
              }}>
                Special Instructions (Optional)
              </Text>
          <TextInput
                style={{ 
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  height: 100,
                  textAlignVertical: 'top',
                  color: '#1F2937',
                  backgroundColor: '#F9FAFB'
                }}
                placeholder="Add notes about your order..."
                placeholderTextColor="#9CA3AF"
                multiline
                value={note}
                onChangeText={setNote}
              />
            </View>
          </Animated.View>
          
          {/* Order Summary Card */}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: '#1F2937',
              marginBottom: 16
            }}>
              Order Summary
            </Text>
            
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between',
              marginBottom: 8
            }}>
              <Text style={{ fontSize: 14, color: '#6B7280' }}>
                {productName} ({quantity} {unitType}{quantity > 1 ? 's' : ''})
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#1F2937' }}>
                {(parsedPrice * quantity).toFixed(2)} Birr
              </Text>
            </View>
            
            {hasDiscount && (
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                marginBottom: 8
              }}>
                <Text style={{ fontSize: 14, color: '#EF4444' }}>
                  Discount ({discountPercentage}%)
                </Text>
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#EF4444' }}>
                  -{((originalPrice - parsedPrice) * quantity).toFixed(2)} Birr
                </Text>
              </View>
            )}
            
            <View style={{ 
              borderTopWidth: 1, 
              borderColor: '#F3F4F6', 
              paddingTop: 12,
              marginTop: 4
            }}>
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#1F2937' }}>
                  Total
                </Text>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#10B981' }}>
                  {totalPrice.toFixed(2)} Birr
                </Text>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Fixed Add to Cart Button */}
      <View style={{ 
        padding: 16, 
        backgroundColor: '#F9FAFB', 
        borderTopWidth: 1, 
        borderColor: '#E5E7EB',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 5,
      }}>
        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity 
            style={{ 
              backgroundColor: stockQuantity > 0 ? '#4CAF50' : '#9CA3AF',
              paddingVertical: 16,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
              shadowColor: stockQuantity > 0 ? '#4CAF50' : '#9CA3AF',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 4.65,
              elevation: 8,
            }}
            onPress={addToCart}
            disabled={loading || addingToCart || stockQuantity <= 0}
          >
            {loading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Ionicons name="cart" size={20} color="white" style={{ marginRight: 8 }} />
                <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 16 }}>
                  {stockQuantity > 0 ? `Add to Cart • ${totalPrice.toFixed(2)} Birr` : "Out of Stock"}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </Animated.View>
        </View>

      {/* Quantity Input Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={inputVisible}
        onRequestClose={() => setInputVisible(false)}
      >
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
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 4.65,
            elevation: 8,
          }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: 'bold', 
              color: '#1F2937', 
              marginBottom: 16,
              textAlign: 'center' 
            }}>
              Enter Quantity
            </Text>

            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              marginBottom: 8 
            }}>
              <TextInput
                style={{ 
                  flex: 1,
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  textAlign: 'center',
                  color: '#1F2937'
                }}
                keyboardType="number-pad"
                value={inputValue}
                onChangeText={setInputValue}
                autoFocus={true}
              />
            </View>
            
            <Text style={{ 
              fontSize: 14, 
              color: '#6B7280', 
              marginBottom: 16,
              textAlign: 'center' 
            }}>
              Maximum available: {stockQuantity} {unitType}{stockQuantity !== 1 ? 's' : ''}
        </Text>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#F3F4F6', 
                  borderRadius: 8, 
                  padding: 12, 
                  flex: 1,
                  marginRight: 8 
                }}
                onPress={() => setInputVisible(false)}
              >
                <Text style={{ 
                  color: '#4B5563', 
                  fontWeight: '500', 
                  textAlign: 'center' 
                }}>
                  Cancel
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{ 
                  backgroundColor: '#4CAF50', 
                  borderRadius: 8, 
                  padding: 12, 
                  flex: 1,
                  marginLeft: 8 
                }}
                onPress={confirmQuantityInput}
              >
                <Text style={{ 
                  color: 'white', 
                  fontWeight: '500', 
                  textAlign: 'center' 
                }}>
                  Confirm
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
