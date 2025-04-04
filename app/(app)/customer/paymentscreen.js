import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { db } from '../../../firebase/firebaseConfig';
import { getAuth } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';

// Remove Firebase/Chapa integration for now

const PaymentScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const { 
    totalPrice, 
    deliveryFee, 
    location: locationString, 
    placeName, 
    phoneNumber, 
    countryCode, 
    locationNote 
  } = useLocalSearchParams();

  // Parse location from JSON string
  const location = locationString ? JSON.parse(locationString) : null;

  const [paymentMethod, setPaymentMethod] = useState('chapa');
  const [isProcessing, setIsProcessing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('pending'); // pending, processing, success, failed
  const [cartItems, setCartItems] = useState([]);
  const [chapaOptions, setChapaOptions] = useState([
    { id: 'telebirr', name: 'Telebirr', icon: 'cellphone', selected: true },
    { id: 'cbe', name: 'CBE', icon: 'bank', selected: false },
    { id: 'awash', name: 'Awash Bank', icon: 'bank', selected: false },
    { id: 'amole', name: 'Amole', icon: 'wallet', selected: false },
    { id: 'hellocash', name: 'HelloCash', icon: 'cash', selected: false },
  ]);

  // Fetch cart items when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchCartItems();
    }
  }, []);

  // Function to fetch the user's cart items
  const fetchCartItems = async () => {
    try {
      const cartCollection = collection(db, `users/${currentUser.uid}/cart`);
      const cartSnapshot = await getDocs(cartCollection);
      const items = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCartItems(items);
    } catch (error) {
      console.error("Error fetching cart items: ", error);
    }
  };

  // Function to clear the cart after successful order
  const clearCart = async () => {
    try {
      console.log("Starting cart clearing process");
      const cartCollection = collection(db, `users/${currentUser.uid}/cart`);
      const cartSnapshot = await getDocs(cartCollection);
      
      if (cartSnapshot.empty) {
        console.log("Cart is already empty");
        return;
      }
      
      // Delete each cart item
      const deletePromises = cartSnapshot.docs.map(item => {
        const cartDoc = doc(db, `users/${currentUser.uid}/cart`, item.id);
        console.log(`Deleting cart item: ${item.id}`);
        return deleteDoc(cartDoc);
      });
      
      await Promise.all(deletePromises);
      console.log(`Cart cleared successfully - removed ${cartSnapshot.size} items`);
    } catch (error) {
      console.error("Error clearing cart:", error);
      // Don't throw the error - we still want the order to be considered successful
      // even if there's an issue clearing the cart
    }
  };

  // Removed deep linking effect and related functions

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleChapaOptionSelect = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setChapaOptions(chapaOptions.map(option => ({
      ...option,
      selected: option.id === id
    })));
  };

  const validateInputs = () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'Please enter your first name');
      return false;
    }
    
    if (!lastName.trim()) {
      Alert.alert('Error', 'Please enter your last name');
      return false;
    }
    
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return false;
    }
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }
    
    return true;
  };

  const generateTransactionReference = () => {
    // Generate a unique transaction reference with prefix TX and current timestamp
    return `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  };

  const handleChapaPayment = async () => {
    if (!validateInputs()) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    setPaymentStatus('processing');
    
    const selectedOption = chapaOptions.find(option => option.selected);
    const txRef = generateTransactionReference();
    setTransactionId(txRef);
    
    try {
      // Temporarily bypass actual Chapa integration
      setTimeout(() => {
        setIsProcessing(false);
        
        Alert.alert(
          'Confirm Payment',
          `Would you like to proceed with a ${selectedOption.name} payment of ${parseFloat(totalPrice).toFixed(2)} Birr?`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
                setPaymentStatus('pending');
              }
            },
            {
              text: 'Confirm',
              onPress: () => {
                // Simulate successful payment
                handlePaymentSuccess(txRef, 'chapa', selectedOption.id);
              }
            }
          ]
        );
      }, 1500); // Short delay to simulate processing
      
    } catch (error) {
      console.error('Payment error:', error);
      handlePaymentFailure('Error processing payment request');
    }
  };
  
  const handlePaymentSuccess = async (txRef, paymentMethod, paymentProvider = null) => {
    setIsProcessing(false);
    setPaymentStatus('success');
    
    // Generate a simulated order reference
    const orderRef = `OD-${Date.now()}`;
    
    try {
      if (!currentUser) {
        throw new Error("User is not logged in");
      }
      
      // Verify we have cart items
      if (!cartItems.length) {
        throw new Error("No items in cart");
      }
      
      // Create order object
      const orderData = {
        orderRef,
        userId: currentUser.uid,
        customerDetails: {
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          phoneNumber: `+${countryCode}${phoneNumber}`,
        },
        deliveryDetails: {
          address: placeName,
          location,
          notes: locationNote || '',
        },
        items: cartItems.map(item => ({
          ...item,
          status: 'ordered' // Mark items as ordered instead of removing them
        })),
        payment: {
          method: paymentMethod,
          provider: paymentProvider,
          transactionId: txRef,
          amount: parseFloat(totalPrice),
          deliveryFee: parseFloat(deliveryFee),
          subtotal: parseFloat(totalPrice) - parseFloat(deliveryFee),
          status: 'completed',
          paidAt: serverTimestamp(),
        },
        orderStatus: 'pending',
        orderStatusHistory: [
          { status: 'pending', timestamp: new Date() }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        events: [
          { 
            type: 'order_created',
            timestamp: new Date(),
            details: { paymentMethod }
          }
        ]
      };
      
      console.log(`[ORDER PROCESS] Creating order ${orderRef} with ${cartItems.length} items`);
      console.log(`[ORDER PROCESS] User ID: ${currentUser.uid}`);
      
      // Create the user document first if it doesn't exist to ensure proper permissions
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Attempt to save order with retry mechanism
      let orderDoc = null;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (!orderDoc && attempt < maxAttempts) {
        attempt++;
        try {
          console.log(`[ORDER PROCESS] Attempt ${attempt} to save order to user's collection`);
          
          // Create orders subcollection reference
          const userOrdersRef = collection(db, `users/${currentUser.uid}/orders`);
          orderDoc = await addDoc(userOrdersRef, orderData);
          
          console.log(`[ORDER PROCESS] Order saved successfully in user's collection with ID: ${orderDoc.id}`);
        } catch (saveError) {
          console.error(`[ORDER PROCESS] Attempt ${attempt} failed:`, saveError);
          
          if (attempt >= maxAttempts) {
            throw saveError; // Re-throw if all attempts failed
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt-1)));
        }
      }
      
      if (!orderDoc) {
        throw new Error("Failed to save order after multiple attempts");
      }
      
      // Mark cart items as ordered instead of deleting them
      const cartItemsToUpdate = cartItems.map(async (item) => {
        try {
          const cartItemRef = doc(db, `users/${currentUser.uid}/cart`, item.id);
          return updateDoc(cartItemRef, { 
            status: 'ordered',
            orderId: orderDoc.id // Reference to the order
          });
        } catch (error) {
          console.error(`[ORDER PROCESS] Error updating cart item ${item.id}:`, error);
          // Continue with other updates even if one fails
          return Promise.resolve();
        }
      });
      
      await Promise.all(cartItemsToUpdate);
      console.log(`[ORDER PROCESS] Cart items marked as ordered - updated ${cartItems.length} items`);
      
      // Show success message
      Alert.alert(
        'Payment Successful',
        `Your payment has been processed successfully. Your order #${orderRef} is now being prepared for delivery.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home or order tracking page
              navigation.navigate('(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error("[ORDER PROCESS] Error saving order:", error);
      Alert.alert(
        'Error',
        'Your payment was processed but we encountered an error saving your order. Please contact customer support.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('(tabs)');
            },
          },
        ]
      );
    }
  };
  
  const handlePaymentFailure = (message) => {
    setIsProcessing(false);
    setPaymentStatus('failed');
    Alert.alert(
      'Payment Failed',
      message || 'There was an error processing your payment. Please try again later.',
      [{ text: 'OK' }]
    );
  };

  const handleCashOnDelivery = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    
    // Generate an order reference
    const orderRef = `OD-${Date.now()}`;
    
    try {
      if (!currentUser) {
        throw new Error("User is not logged in");
      }
      
      // Verify we have cart items
      if (!cartItems.length) {
        throw new Error("No items in cart");
      }
      
      // Create order object
      const orderData = {
        orderRef,
        userId: currentUser.uid,
        customerDetails: {
          firstName: firstName || '',
          lastName: lastName || '',
          email: email || '',
          phoneNumber: `+${countryCode}${phoneNumber}`,
        },
        deliveryDetails: {
          address: placeName,
          location,
          notes: locationNote || '',
        },
        items: cartItems.map(item => ({
          ...item,
          status: 'ordered' // Mark items as ordered instead of removing them
        })),
        payment: {
          method: 'cashOnDelivery',
          amount: parseFloat(totalPrice),
          deliveryFee: parseFloat(deliveryFee),
          subtotal: parseFloat(totalPrice) - parseFloat(deliveryFee),
          status: 'pending',
        },
        orderStatus: 'pending',
        orderStatusHistory: [
          { status: 'pending', timestamp: new Date() }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        events: [
          { 
            type: 'order_created',
            timestamp: new Date(),
            details: { paymentMethod: 'cashOnDelivery' }
          }
        ]
      };
      
      console.log(`[ORDER PROCESS] Creating COD order ${orderRef} with ${cartItems.length} items`);
      console.log(`[ORDER PROCESS] User ID: ${currentUser.uid}`);
      
      // Create the user document first if it doesn't exist to ensure proper permissions
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Attempt to save order with retry mechanism
      let orderDoc = null;
      let attempt = 0;
      const maxAttempts = 3;
      
      while (!orderDoc && attempt < maxAttempts) {
        attempt++;
        try {
          console.log(`[ORDER PROCESS] Attempt ${attempt} to save COD order to user's collection`);
          
          // Create orders subcollection reference
          const userOrdersRef = collection(db, `users/${currentUser.uid}/orders`);
          orderDoc = await addDoc(userOrdersRef, orderData);
          
          console.log(`[ORDER PROCESS] COD order saved successfully in user's collection with ID: ${orderDoc.id}`);
        } catch (saveError) {
          console.error(`[ORDER PROCESS] Attempt ${attempt} failed:`, saveError);
          
          if (attempt >= maxAttempts) {
            throw saveError; // Re-throw if all attempts failed
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt-1)));
        }
      }
      
      if (!orderDoc) {
        throw new Error("Failed to save COD order after multiple attempts");
      }
      
      // Mark cart items as ordered instead of deleting them
      const cartItemsToUpdate = cartItems.map(async (item) => {
        try {
          const cartItemRef = doc(db, `users/${currentUser.uid}/cart`, item.id);
          return updateDoc(cartItemRef, { 
            status: 'ordered',
            orderId: orderDoc.id // Reference to the order
          });
        } catch (error) {
          console.error(`[ORDER PROCESS] Error updating COD cart item ${item.id}:`, error);
          // Continue with other updates even if one fails
          return Promise.resolve();
        }
      });
      
      await Promise.all(cartItemsToUpdate);
      console.log(`[ORDER PROCESS] COD cart items marked as ordered - updated ${cartItems.length} items`);
      
      setIsProcessing(false);
      
      Alert.alert(
        'Order Placed Successfully',
        `Your order #${orderRef} has been placed successfully and will be delivered soon. You will pay on delivery.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate to home page
              navigation.navigate('(tabs)');
            },
          },
        ]
      );
    } catch (error) {
      console.error('[ORDER PROCESS] COD order error:', error);
      setIsProcessing(false);
      Alert.alert(
        'Order Failed',
        'There was an error placing your order. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleConfirmPayment = () => {
    if (paymentMethod === 'cashOnDelivery') {
      handleCashOnDelivery();
    } else {
      handleChapaPayment();
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Payment</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.deliveryInfo}>
          <Text style={styles.sectionTitle}>Delivery Information</Text>
          <View style={styles.infoRow}>
            <MaterialIcons name="location-on" size={20} color="#FF5252" />
            <Text style={styles.infoText} numberOfLines={2}>
              {placeName || 'No address selected'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialIcons name="phone" size={20} color="#FF5252" />
            <Text style={styles.infoText}>
              {`+${countryCode} ${phoneNumber}` || 'No phone provided'}
            </Text>
          </View>
          {locationNote ? (
            <View style={styles.infoRow}>
              <MaterialIcons name="note" size={20} color="#FF5252" />
              <Text style={styles.infoText}>{locationNote}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.paymentMethods}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          
          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'chapa' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('chapa')}
          >
            <View style={styles.paymentLogoContainer}>
              <Text style={styles.chapaLogo}>Chapa</Text>
            </View>
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Digital Payment</Text>
              <Text style={styles.paymentOptionDescription}>
                Pay securely using Telebirr, CBE, Amole, etc.
              </Text>
            </View>
            {paymentMethod === 'chapa' && (
              <MaterialIcons name="check-circle" size={24} color="#FF5252" />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.paymentOption,
              paymentMethod === 'cashOnDelivery' && styles.selectedPayment,
            ]}
            onPress={() => setPaymentMethod('cashOnDelivery')}
          >
            <MaterialIcons name="payments" size={24} color="#333" />
            <View style={styles.paymentOptionContent}>
              <Text style={styles.paymentOptionTitle}>Cash on Delivery</Text>
              <Text style={styles.paymentOptionDescription}>
                Pay when you receive your order
              </Text>
            </View>
            {paymentMethod === 'cashOnDelivery' && (
              <MaterialIcons name="check-circle" size={24} color="#FF5252" />
            )}
          </TouchableOpacity>
          
          {paymentMethod === 'chapa' && (
            <View style={styles.chapaOptions}>
              <Text style={styles.chapaOptionsTitle}>Select Payment Provider</Text>
              
              {chapaOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.chapaOption,
                    option.selected && styles.chapaOptionSelected,
                  ]}
                  onPress={() => handleChapaOptionSelect(option.id)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={24} 
                    color={option.selected ? "#FF5252" : "#555"} 
                  />
                  <Text 
                    style={[
                      styles.chapaOptionText,
                      option.selected && styles.chapaOptionTextSelected,
                    ]}
                  >
                    {option.name}
                  </Text>
                  {option.selected && (
                    <MaterialIcons name="check-circle" size={20} color="#FF5252" style={styles.chapaCheckmark} />
                  )}
                </TouchableOpacity>
              ))}
              
              <View style={styles.paymentFormContainer}>
                <Text style={styles.formSectionTitle}>Customer Details</Text>
                
                <TextInput
                  style={styles.input}
                  placeholder="First Name"
                  value={firstName}
                  onChangeText={setFirstName}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Last Name"
                  value={lastName}
                  onChangeText={setLastName}
                />
                
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>
          )}
        </View>

        <View style={styles.orderSummary}>
          <Text style={styles.sectionTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Items Total:</Text>
            <Text style={styles.summaryValue}>{(parseFloat(totalPrice) - parseFloat(deliveryFee)).toFixed(2)} Birr</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery Fee:</Text>
            <Text style={styles.summaryValue}>{parseFloat(deliveryFee).toFixed(2)} Birr</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{parseFloat(totalPrice).toFixed(2)} Birr</Text>
          </View>
        </View>

        {paymentMethod === 'chapa' && (
          <View style={styles.securePaymentInfo}>
            <MaterialIcons name="security" size={20} color="#4CAF50" />
            <Text style={styles.securePaymentText}>
              Payments are securely processed by Chapa, Ethiopia's trusted payment platform.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleConfirmPayment}
          disabled={isProcessing}
          activeOpacity={0.8}
          style={{ width: '100%' }}
        >
          <LinearGradient
            colors={paymentMethod === 'chapa' ? ['#0066CC', '#3399FF'] : ['#FF5252', '#FF7B7B']}
            start={[0, 0]}
            end={[1, 0]}
            style={styles.confirmButton}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>
                  {paymentMethod === 'chapa' ? 'Pay Now' : 'Confirm Order'}
                </Text>
                <MaterialIcons 
                  name={paymentMethod === 'chapa' ? "account-balance-wallet" : "delivery-dining"} 
                  size={22} 
                  color="#fff" 
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginLeft: 15,
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  deliveryInfo: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 10,
    flex: 1,
  },
  paymentMethods: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    marginBottom: 10,
  },
  selectedPayment: {
    borderWidth: 2,
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  paymentLogoContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chapaLogo: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0066CC',
  },
  paymentOptionContent: {
    flex: 1,
    marginLeft: 10,
  },
  paymentOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  paymentOptionDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  chapaOptions: {
    marginTop: 15,
    padding: 15,
    backgroundColor: '#F7F9FC',
    borderRadius: 10,
  },
  chapaOptionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  chapaOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chapaOptionSelected: {
    borderColor: '#FF5252',
    backgroundColor: '#FFF5F5',
  },
  chapaOptionText: {
    fontSize: 14,
    marginLeft: 10,
    color: '#333',
    flex: 1,
  },
  chapaOptionTextSelected: {
    fontWeight: '600',
    color: '#FF5252',
  },
  chapaCheckmark: {
    marginLeft: 'auto',
  },
  paymentFormContainer: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 14,
  },
  securePaymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF7EA',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  securePaymentText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12,
    color: '#444',
  },
  orderSummary: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
  },
  totalRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF5252',
  },
  footer: {
    padding: 20,
    paddingBottom: 30,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    elevation: 3,
  },
  confirmButton: {
    flexDirection: 'row',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 18,
    marginRight: 8,
  },
});

export default PaymentScreen;
