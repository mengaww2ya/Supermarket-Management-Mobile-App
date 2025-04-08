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
  Linking,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
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
} from 'firebase/firestore';

// USSD launcher function using Linking API
const launchUSSDRequest = async (ussdCode) => {
  try {
    // Format USSD code based on platform
    let formattedCode = ussdCode;
    
    // For Android, we need to use the tel: protocol with no spaces and encode properly
    if (Platform.OS === 'android') {
      // Remove any spaces in the USSD code
      formattedCode = ussdCode.replace(/\s+/g, '');
      // Ensure the # is properly encoded in the URL
      formattedCode = `tel:${formattedCode.replace(/#/g, encodeURIComponent('#'))}`;
    } 
    // For iOS, we need a more direct approach 
    else if (Platform.OS === 'ios') {
      // Replace * with %2A and # with %23 (URL encoded)
      formattedCode = ussdCode.replace(/\*/g, '%2A').replace(/#/g, '%23');
      formattedCode = `tel:${formattedCode}`;
    }
    
    console.log('Launching USSD code:', formattedCode);
    
    // Launch the USSD code
    const supported = await Linking.canOpenURL(formattedCode);
    if (supported) {
      await Linking.openURL(formattedCode);
      return true;
    } else {
      console.error('Cannot open USSD code');
      return false;
    }
  } catch (error) {
    console.error('Error launching USSD:', error);
    return false;
  }
};

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

  const [paymentMethod, setPaymentMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [pin, setPin] = useState('');
  const [showPinEntry, setShowPinEntry] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [cartItems, setCartItems] = useState([]);
  const [merchantInfo, setMerchantInfo] = useState({
    cbeAccount: '1000262088425', // Merchant CBE account
    telebirrNumber: '0963760376', // Merchant Telebirr number
  });

  // Payment options with the required information for each
  const paymentOptions = [
    { 
      id: 'cbe', 
      name: 'CBE Birr', 
      icon: 'bank',
      accountRequired: true,
      ussdFormat: (account, amount) => `*847*1*2*${account}*1*${amount}#`,
      alternativeFormat: (account, amount) => `*847#`,
      instructions: 'You will receive a CBE Birr prompt to enter your PIN to complete payment.'
    },
    { 
      id: 'telebirr', 
      name: 'Telebirr', 
      icon: 'cellphone',
      accountRequired: true,
      ussdFormat: (account, amount) => `*127*${account}*${amount}#`,
      alternativeFormat: (account, amount) => `*127#`,
      instructions: 'You will receive a Telebirr prompt to enter your PIN to complete payment.'
    }
  ];

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
      const cartCollection = collection(db, `users/${currentUser.uid}/cart`);
      const cartSnapshot = await getDocs(cartCollection);
      
      if (cartSnapshot.empty) return;
      
      const deletePromises = cartSnapshot.docs.map(item => {
        const cartDoc = doc(db, `users/${currentUser.uid}/cart`, item.id);
        return deleteDoc(cartDoc);
      });
      
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const handlePaymentMethodSelect = (method) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPaymentMethod(method);
    setPin('');
  };

  const initiateUSSDPayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);
    
    try {
      const selectedOption = paymentOptions.find(option => option.id === paymentMethod);
      let merchantAccount = '';
      
      // Get the appropriate merchant account based on payment method
      if (paymentMethod === 'cbe') {
        merchantAccount = merchantInfo.cbeAccount;
      } else if (paymentMethod === 'telebirr') {
        merchantAccount = merchantInfo.telebirrNumber;
      }
      
      // Format the amount as needed (remove decimal places if required)
      const amount = Math.round(parseFloat(totalPrice)).toString();
        
        Alert.alert(
        'Payment Confirmation',
        `You are about to pay ${parseFloat(totalPrice).toFixed(2)} Birr using ${selectedOption.name}.\n\n${selectedOption.instructions}`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => {
              setIsProcessing(false);
            }
          },
          {
            text: 'Continue',
            onPress: async () => {
              // Try with regular format first
              const ussdCode = selectedOption.ussdFormat(merchantAccount, amount);
              
              console.log('Launching USSD:', ussdCode);
              
              // Try to launch the USSD request
              let launched = await launchUSSDRequest(ussdCode);
              
              if (!launched) {
                // If the first attempt fails, try with the alternative format
                const alternativeCode = selectedOption.alternativeFormat(merchantAccount, amount);
                console.log('Trying alternative USSD code:', alternativeCode);
                launched = await launchUSSDRequest(alternativeCode);
              }
              
              if (launched) {
                // Show instructions for manual payment completion
                Alert.alert(
                  'Complete Payment Manually',
                  `Due to system limitations, please complete these steps manually:\n\n1. In the USSD menu, select payment/transfer option\n2. Enter the merchant number: ${merchantAccount}\n3. Enter amount: ${amount} Birr\n4. Enter your PIN when prompted\n\nOnce you've completed these steps, come back to the app.`,
                  [
                    {
                      text: 'I\'ll complete it manually',
                      onPress: () => {
                        setIsProcessing(false);
                        setShowPinEntry(true);
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => setIsProcessing(false)
                    }
                  ]
                );
              } else {
                // If both USSD launch attempts failed
                Alert.alert(
                  'Payment System Unavailable',
                  `The payment system appears to be in maintenance mode or unavailable. Would you like to:\n\n1. Try again later\n2. Try a different payment method\n3. Continue with manual payment`,
                  [
                    {
                      text: 'Try Again',
                      onPress: () => {
                        setIsProcessing(false);
                        initiateUSSDPayment();
                      }
                    },
                    {
                      text: 'Manual Payment',
                      onPress: () => {
                        Alert.alert(
                          'Manual Payment Instructions',
                          `To pay manually:\n\n1. Open your phone dialer\n2. Dial *${paymentMethod === 'cbe' ? '847' : '127'}#\n3. Select payment/transfer option\n4. Enter merchant number: ${merchantAccount}\n5. Enter amount: ${amount} Birr\n6. Enter your PIN\n\nOnce done, return here to confirm.`,
                          [
                            {
                              text: 'I\'ve completed payment',
              onPress: () => {
                                setIsProcessing(false);
                                setShowPinEntry(true);
                              }
                            },
                            {
                              text: 'Cancel',
                              style: 'cancel',
                              onPress: () => setIsProcessing(false)
                            }
                          ]
                        );
                      }
                    },
                    {
                      text: 'Cancel',
                      style: 'cancel',
                      onPress: () => setIsProcessing(false)
                    }
                  ]
                );
              }
              }
            }
          ]
        );
      
    } catch (error) {
      console.error('Payment initiation error:', error);
      setIsProcessing(false);
      Alert.alert('Error', 'Failed to initiate payment. Please try again.');
    }
  };

  const handlePinSubmit = () => {
    if (pin.length !== 4) {
      Alert.alert('Error', 'Please enter a valid 4-digit PIN');
      return;
    }
    
    setIsProcessing(true);
    
    // Simulate PIN verification and payment processing
    setTimeout(() => {
    setIsProcessing(false);
      handlePaymentSuccess(paymentMethod);
    }, 2000);
  };

  const handlePaymentSuccess = async (paymentProvider) => {
    setPaymentStatus('success');
    
    const orderRef = `OD-${Date.now()}`;
    
    try {
      if (!currentUser) {
        throw new Error("User is not logged in");
      }
      
      if (!cartItems.length) {
        throw new Error("No items in cart");
      }
      
      const orderData = {
        orderRef,
        userId: currentUser.uid,
        deliveryDetails: {
          address: placeName,
          location,
          notes: locationNote || '',
        },
        items: cartItems.map(item => ({
          ...item,
          status: 'ordered'
        })),
        payment: {
          method: 'ussd',
          provider: paymentProvider,
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
      };

      await addDoc(collection(db, 'orders'), orderData);
      await clearCart();
      
      Alert.alert(
        'Payment Successful',
        'Your order has been placed successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('(tabs)', { screen: 'home' });
            }
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating order:', error);
      handlePaymentFailure('Error creating order');
    }
  };
  
  const handlePaymentFailure = (message) => {
    setIsProcessing(false);
    setPaymentStatus('failed');
    Alert.alert('Payment Failed', message);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
      </View>

      <ScrollView style={styles.content}>
        {!showPinEntry ? (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Payment Method</Text>
              {paymentOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.paymentOption,
                    paymentMethod === option.id && styles.selectedOption
                  ]}
                  onPress={() => handlePaymentMethodSelect(option.id)}
                >
                  <MaterialCommunityIcons 
                    name={option.icon} 
                    size={24} 
                    color={paymentMethod === option.id ? '#fff' : '#000'} 
                  />
                  <Text style={[
                    styles.optionText,
                    paymentMethod === option.id && styles.selectedOptionText
                  ]}>
                    {option.name}
                  </Text>
                </TouchableOpacity>
              ))}
        </View>

            <View style={styles.summarySection}>
              <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {(parseFloat(totalPrice) - parseFloat(deliveryFee)).toFixed(2)} Birr
                </Text>
          </View>
          <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
            <Text style={styles.summaryValue}>{parseFloat(deliveryFee).toFixed(2)} Birr</Text>
          </View>
          <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{parseFloat(totalPrice).toFixed(2)} Birr</Text>
          </View>
        </View>
          </>
        ) : (
          <View style={styles.pinContainer}>
            <Text style={styles.pinTitle}>Enter PIN</Text>
            <Text style={styles.pinDescription}>
              Please enter the 4-digit PIN you received from your payment provider to confirm this transaction.
            </Text>
            
            <TextInput
              style={styles.pinInput}
              placeholder="Enter PIN"
              keyboardType="numeric"
              maxLength={4}
              secureTextEntry
              value={pin}
              onChangeText={setPin}
              autoFocus
            />
            
            <View style={styles.pinNote}>
              <MaterialIcons name="security" size={18} color="#666" />
              <Text style={styles.pinNoteText}>
                Your PIN is secure and will not be stored by the app.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {!showPinEntry ? (
        <TouchableOpacity
            style={[styles.payButton, (isProcessing || !paymentMethod) && styles.disabledButton]}
            onPress={initiateUSSDPayment}
            disabled={isProcessing || !paymentMethod}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Pay Now</Text>
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.payButton, (isProcessing || pin.length !== 4) && styles.disabledButton]}
            onPress={handlePinSubmit}
            disabled={isProcessing || pin.length !== 4}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.payButtonText}>Confirm Payment</Text>
            )}
        </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 8,
  },
  selectedOption: {
    backgroundColor: '#007AFF',
  },
  optionText: {
    marginLeft: 16,
    fontSize: 16,
  },
  selectedOptionText: {
    color: '#fff',
  },
  summarySection: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  payButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  pinContainer: {
    padding: 16,
    alignItems: 'center',
  },
  pinTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  pinDescription: {
    fontSize: 16,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 16,
    fontSize: 22,
    textAlign: 'center',
    width: '100%',
    marginBottom: 24,
    letterSpacing: 8,
  },
  pinNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  pinNoteText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default PaymentScreen;
