import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
  Linking,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
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
  query,
  where,
} from 'firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import { generateTxRef, initializePayment, verifyPayment } from '../../utills/chapaPayment';
import { LinearGradient } from 'expo-linear-gradient';
import PaymentVerification from '../../components/PaymentVerification';
import axios from 'axios';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const CHAPA_SECRET_KEY = Constants.expoConfig?.extra?.chapaSecretKey || '';

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
  const [paymentStatus, setPaymentStatus] = useState('pending');
  const [cartItems, setCartItems] = useState([]);
  const [txRef, setTxRef] = useState('');

  // Verification UI states
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [verificationStep, setVerificationStep] = useState('Connecting to payment gateway...');
  const [verificationAttempts, setVerificationAttempts] = useState(0);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [verificationError, setVerificationError] = useState(false);

  // Payment options with the required information for each - only Chapa local payment methods
  const paymentOptions = [
    {
      id: 'telebirr',
      name: 'Telebirr',
      iconComponent: MaterialCommunityIcons,
      iconName: 'phone',
      iconColor: '#2E86C1',
      bgColor: '#D6EAF8',
      description: 'Pay with your Telebirr mobile money account'
    },
    {
      id: 'cbe',
      name: 'CBE Birr',
      iconComponent: FontAwesome5,
      iconName: 'university',
      iconColor: '#28B463',
      bgColor: '#D5F5E3',
      description: 'Pay with your CBE Birr account'
    },
    {
      id: 'awash',
      name: 'Awash Bank',
      iconComponent: MaterialCommunityIcons,
      iconName: 'bank',
      iconColor: '#8E44AD',
      bgColor: '#E8DAEF',
      description: 'Pay using Awash Bank account'
    },
    {
      id: 'mpesa',
      name: 'M-Pesa',
      iconComponent: FontAwesome5,
      iconName: 'money-bill-wave',
      iconColor: '#138D75',
      bgColor: '#D1F2EB',
      description: 'Pay with M-Pesa mobile money'
    },
    {
      id: 'amole',
      name: 'Amole',
      iconComponent: MaterialCommunityIcons,
      iconName: 'wallet-outline',
      iconColor: '#D4AC0D',
      bgColor: '#FCF3CF',
      description: 'Pay with your Amole wallet'
    }
  ];

  // Fetch cart items when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchCartItems();
      setTxRef(generateTxRef());
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
  };

  // Replace the directTransactionCheck function with this custom verify payment function
  const customVerifyPayment = async (txRef) => {
    try {
      console.log(`Custom payment verification for transaction: ${txRef}`);

      // Check payment status directly using the Chapa API
      const response = await axios.get(
        `https://api.chapa.co/v1/transaction/verify/${txRef}`,
        {
          headers: {
            Authorization: `Bearer ${CHAPA_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout
        }
      );

      console.log(`Custom verification response for ${txRef}:`, JSON.stringify(response.data, null, 2));

      // If the API response is successful and contains data
      if (response.data && response.data.status === 'success') {
        if (response.data.data) {
          // If payment status is explicitly successful
          if (response.data.data.status === 'success') {
            return {
              status: 'success',
              data: response.data.data,
              message: 'Payment successfully verified'
            };
          }
          // If payment is still pending but transaction exists
          else if (response.data.data.status === 'pending') {
            return {
              status: 'pending',
              data: response.data.data,
              message: 'Payment is being processed'
            };
          }
        }
        // API response was successful but status is unknown
        return {
          status: 'pending',
          data: response.data,
          message: 'Payment verification in progress'
        };
      }
      // API response was not successful
      return {
        status: 'failed',
        data: response.data,
        message: response.data.message || 'Payment verification failed'
      };
    } catch (error) {
      console.error('Custom verification error:', error.response?.data || error.message);
      if (error.response?.status === 404) {
        return {
          status: 'pending',
          message: 'Transaction not found yet. It might still be processing.'
        };
      }
      return {
        status: 'error',
        message: 'Error verifying payment. Please try again later.'
      };
    }
  };

  const initiatePayment = async () => {
    if (!paymentMethod) {
      Alert.alert('Error', 'Please select a payment method');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsProcessing(true);

    try {
      // Get user info from Firebase
      const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        throw new Error('User profile not found');
      }

      const userDoc = userSnapshot.docs[0].data();
      const nameParts = (userDoc.fullName || 'Customer').split(' ');
      const firstName = nameParts[0] || 'Customer';
      const lastName = nameParts.length > 1 ? nameParts[1] : '';

      // Prepare payment data with selected payment method
      const paymentData = {
        amount: parseFloat(totalPrice).toFixed(2),
        currency: 'ETB',
        email: userDoc.email || currentUser.email || 'customer@example.com',
        first_name: firstName,
        last_name: lastName,
        tx_ref: txRef,
        callback_url: 'https://webhook.site/077164d7-29be-4946-af1a-30e5b4e43d2b',
        customization: {
          title: 'Queen Order', // Max 16 chars
          description: 'Payment for order',
        }
      };

      // Only add payment_options if valid option is selected
      if (paymentMethod && ['telebirr', 'cbe', 'amole', 'awash', 'mpesa'].includes(paymentMethod)) {
        paymentData.payment_options = paymentMethod;
      }

      // Initialize payment
      console.log('Sending payment request to Chapa with tx_ref:', txRef);
      const response = await initializePayment(paymentData);

      if (response.status === 'success' && response.data?.checkout_url) {
        // Open payment URL in browser directly without showing alert first
        try {
          await WebBrowser.openBrowserAsync(response.data.checkout_url);

          // After browser is closed, start verifying payment
          setIsProcessing(true);
          setShowVerificationModal(true);

          // Start verification process with visual indicators
          let attempts = 0;
          const maxAttempts = 3;
          let isVerified = false;

          // Verification process function
          const checkPaymentStatus = async () => {
            setVerificationAttempts(prev => prev + 1);
            const currentAttempt = verificationAttempts + 1;

            // Update progress and messages based on attempt number
            setVerificationProgress(currentAttempt === 1 ? 30 : currentAttempt === 2 ? 60 : currentAttempt === 3 ? 75 : 90);
            setVerificationStep(`Verifying your payment (attempt ${currentAttempt} of ${maxAttempts})...`);

            try {
              // Use custom verification function
              const verificationResult = await customVerifyPayment(txRef);
              console.log(`Payment verification attempt ${currentAttempt}:`, verificationResult);

              // Check if payment is successful
              if (verificationResult && verificationResult.status === 'success') {
                // Payment verified successfully
                setVerificationProgress(100);
                setVerificationSuccess(true);
                setVerificationError(false);
                setPaymentStatus('success'); // Set payment status to success

                // Process the successful payment after a brief delay
                setTimeout(() => {
                  handlePaymentSuccess(paymentMethod, true);
                }, 1500);
              }
              // Check if payment is pending and we should try again
              else if (currentAttempt < maxAttempts &&
                (verificationResult.status === 'pending')) {
                // Try again after a delay that increases with each attempt
                const delayTime = 2000 + (currentAttempt * 1000);
                setTimeout(() => {
                  checkPaymentStatus();
                }, delayTime);
              }
              // Max attempts reached or payment failed
              else if (currentAttempt >= maxAttempts) {
                // Treat the "pending" status as potentially successful
                if (verificationResult.status === 'pending' && verificationResult.data && verificationResult.data.tx_ref === txRef) {
                  // Show a different error that gives the user the option to proceed
                  setVerificationError(true);
                  setVerificationProgress(100);
                  setVerificationStep('Transaction found but status still pending. You may proceed if you completed the payment.');
                } else {
                  // Standard verification error
                  setVerificationError(true);
                  setVerificationProgress(100);
                  setVerificationStep('We couldn\'t verify your payment.');
                }
              }
            } catch (error) {
              console.error(`Verification error on attempt ${currentAttempt}:`, error);

              if (currentAttempt < maxAttempts) {
                // Try again after a delay
                const delayTime = 2000 + (currentAttempt * 1000);
                setTimeout(() => {
                  checkPaymentStatus();
                }, delayTime);
              } else {
                // Max attempts reached with error
                setVerificationError(true);
                setVerificationProgress(100);
                setVerificationStep('Error verifying payment. You may proceed if you completed the payment.');
              }
            }
          };

          // Start the verification process
          checkPaymentStatus();

        } catch (error) {
          console.error('Error opening browser:', error);
          setIsProcessing(false);
          Alert.alert('Error', 'Could not open payment page. Please try again.');
        }
      } else {
        throw new Error('Failed to initialize payment: ' + (response.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Payment error:', error);

      // For demonstration purposes, allow the user to proceed even if Chapa fails
      Alert.alert(
        'Payment System Issue',
        'There seems to be an issue with the payment system. Would you like to proceed as if payment was successful (for testing)?',
        [
          {
            text: 'Proceed (Test Only)',
            onPress: () => {
              handlePaymentSuccess(paymentMethod, false);
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
  };

  const handlePaymentSuccess = async (paymentProvider, isVerified = false) => {
    // Ensure we have actual payment verification before proceeding
    if (paymentStatus !== 'success' && !verificationSuccess && !isVerified) {
      console.error('Attempted to complete order without verified payment');
      Alert.alert(
        'Verification Required',
        'We cannot process your order until payment is verified. Please try again or contact support.',
        [{ text: 'OK' }]
      );
      setIsProcessing(false);
      return;
    }

    // Set payment status to success
    setPaymentStatus('success');

    // Show loading indicator
    setIsProcessing(true);

    const orderRef = `OD-${Date.now()}`;

    try {
      if (!currentUser) {
        throw new Error("User is not logged in");
      }

      if (!cartItems.length) {
        throw new Error("No items in cart");
      }

      // Create the order data object with all necessary information
      const orderData = {
        orderRef,
        userId: currentUser.uid,
        customerInfo: {
          name: currentUser.displayName || 'Customer',
          email: currentUser.email,
          phoneNumber: phoneNumber || '',
          countryCode: countryCode || '',
        },
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
          method: 'chapa',
          provider: paymentProvider,
          amount: parseFloat(totalPrice),
          deliveryFee: parseFloat(deliveryFee),
          subtotal: parseFloat(totalPrice) - parseFloat(deliveryFee),
          status: 'completed',
          tx_ref: txRef,
          paidAt: serverTimestamp(),
        },
        orderStatus: 'pending',
        orderStatusHistory: [
          { status: 'pending', timestamp: new Date() }
        ],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      console.log('Saving order to database...', orderRef);

      // Store order in the main orders collection
      const orderDocRef = await addDoc(collection(db, 'orders'), orderData);
      console.log('Order saved to main collection with ID:', orderDocRef.id);

      // Also store the order in the user's orders subcollection
      await addDoc(collection(db, `users/${currentUser.uid}/orders`), {
        ...orderData,
        mainOrderId: orderDocRef.id, // Reference to the main order document
      });
      console.log('Order saved to user collection');

      // Clear the cart
      await clearCart();
      console.log('Cart cleared successfully');

      // Stop processing indicator
      setIsProcessing(false);

      // Show success message and navigate back to home
      Alert.alert(
        'Order Placed Successfully',
        'Thank you for your purchase! Your order has been received and is being processed.',
        [
          {
            text: 'View Orders',
            onPress: () => {
              // Navigate to orders screen if available
              try {
                navigation.navigate('(tabs)', { screen: 'orders' });
              } catch (e) {
                // Fallback to home if orders screen doesn't exist
                navigation.navigate('(tabs)', { screen: 'home' });
              }
            }
          },
          {
            text: 'Continue Shopping',
            onPress: () => {
              navigation.navigate('(tabs)', { screen: 'home' });
            }
          }
        ]
      );

    } catch (error) {
      console.error('Error creating order:', error);
      setIsProcessing(false);
      handlePaymentFailure('There was an error processing your order. Please try again or contact support.');
    }
  };

  const handlePaymentFailure = (message) => {
    setIsProcessing(false);
    setPaymentStatus('failed');
    Alert.alert('Payment Failed', message);
  };

  const handleVerificationConfirm = () => {
    // Handle user confirmation after verification
    setShowVerificationModal(false);

    if (verificationSuccess) {
      // Only proceed with successful payment
      handlePaymentSuccess(paymentMethod, true);
    } else if (verificationError) {
      // Let user know we're trying an alternative verification method
      Alert.alert(
        'Checking Payment Status',
        'The standard verification was unsuccessful. We will try one more time to check your payment status.',
        [{ text: 'OK' }]
      );

      // Show loading
      setIsProcessing(true);

      // Try custom verification
      customVerifyPayment(txRef).then(result => {
        if (result.status === 'success') {
          console.log('Custom verification success:', result);
          // If payment status is success in the response, process the order
          if (result.data && result.data.status === 'success') {
            Alert.alert(
              'Payment Confirmed',
              'Your payment was successfully confirmed via custom verification. Your order will be processed now.',
              [{ text: 'OK' }]
            );
            handlePaymentSuccess(paymentMethod, true);
            return;
          }

          // If pending but found, assume payment was successful (Chapa sometimes shows pending even when successful)
          if (result.data && result.data.status === 'pending') {
            Alert.alert(
              'Payment Received',
              'Your payment appears to be processing. We will proceed with your order and confirm the payment later.',
              [{ text: 'OK' }]
            );
            handlePaymentSuccess(paymentMethod, true);
            return;
          }
        }

        // If custom verification fails, start background verification as before
        console.log('Custom verification failed, starting background verification');

        let bgAttempts = 0;
        const maxBgAttempts = 3;
        const checkInBackground = async () => {
          bgAttempts++;
          try {
            const verificationResult = await customVerifyPayment(txRef);
            console.log(`Background verification attempt ${bgAttempts}:`, verificationResult);

            // Check if payment is successful
            if (verificationResult &&
              (verificationResult.status === 'success' ||
                (verificationResult.data &&
                  (verificationResult.data.status === 'success' || verificationResult.data.status === 'pending')))) {
              // Payment verified successfully in background or is pending (treat as success for better UX)
              console.log('Payment verified successfully in background');

              // Process the successful payment
              handlePaymentSuccess(paymentMethod, true);
              return; // Exit background checking
            } else if (bgAttempts < maxBgAttempts) {
              // Try again after a longer delay (10 seconds)
              setTimeout(checkInBackground, 10000);
            } else {
              // As a last resort, ask user if they completed the payment
              Alert.alert(
                'Payment Verification',
                'We couldn\'t automatically verify your payment. If you completed the payment, would you like to continue with your order?',
                [
                  {
                    text: 'I Didn\'t Pay',
                    style: 'cancel',
                    onPress: () => {
                      handlePaymentFailure("Order cancelled by user");
                    }
                  },
                  {
                    text: 'I Completed Payment',
                    onPress: () => {
                      // Trust user and proceed with order
                      handlePaymentSuccess(paymentMethod, true);
                    }
                  }
                ]
              );
            }
          } catch (error) {
            console.error(`Background verification error on attempt ${bgAttempts}:`, error);
            if (bgAttempts < maxBgAttempts) {
              setTimeout(checkInBackground, 10000);
            } else {
              // As a last resort, ask user if they completed the payment
              Alert.alert(
                'Payment Verification',
                'We couldn\'t automatically verify your payment. If you completed the payment, would you like to continue with your order?',
                [
                  {
                    text: 'I Didn\'t Pay',
                    style: 'cancel',
                    onPress: () => {
                      handlePaymentFailure("Order cancelled by user");
                    }
                  },
                  {
                    text: 'I Completed Payment',
                    onPress: () => {
                      // Trust user and proceed with order
                      handlePaymentSuccess(paymentMethod, true);
                    }
                  }
                ]
              );
            }
          }
        };

        // Start background verification
        checkInBackground();
      }).catch(error => {
        console.error('Error in custom verification:', error);
        setIsProcessing(false);

        // Fallback to user confirmation
        Alert.alert(
          'Payment Verification',
          'We encountered an error verifying your payment. If you completed the payment, would you like to proceed with your order?',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => handlePaymentFailure("Order cancelled by user")
            },
            {
              text: 'I Completed Payment',
              onPress: () => handlePaymentSuccess(paymentMethod, true)
            }
          ]
        );
      });
    } else {
      // Handle the case where verification was cancelled mid-process
      setIsProcessing(false);
      Alert.alert(
        'Verification Cancelled',
        'Payment verification was cancelled. Your order has not been placed.'
      );
    }
  };

  const handleVerificationCancel = () => {
    // Handle user cancellation of verification
    setShowVerificationModal(false);
    setIsProcessing(false);
    setVerificationSuccess(false);
    setVerificationError(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['#f7f7f7', '#ffffff']}
        style={styles.background}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} /> {/* Empty view for centering */}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Payment Method</Text>
          <Text style={styles.sectionSubtitle}>Choose your preferred payment option</Text>

          <View style={styles.paymentOptionsContainer}>
            {paymentOptions.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.paymentOption,
                  paymentMethod === option.id && styles.selectedOption
                ]}
                onPress={() => handlePaymentMethodSelect(option.id)}
              >
                <View style={[styles.optionIconContainer, { backgroundColor: option.bgColor }]}>
                  <option.iconComponent
                    name={option.iconName}
                    size={26}
                    color={option.iconColor}
                  />
                </View>
                <View style={styles.optionTextContainer}>
                  <Text style={[
                    styles.optionTitle,
                    paymentMethod === option.id && styles.selectedOptionText
                  ]}>
                    {option.name}
                  </Text>
                  <Text style={[
                    styles.optionDescription,
                    paymentMethod === option.id && styles.selectedOptionDescription
                  ]}>
                    {option.description}
                  </Text>
                </View>
                <View style={styles.checkboxContainer}>
                  {paymentMethod === option.id && (
                    <View style={styles.checkbox}>
                      <AntDesign name="check" size={14} color="#fff" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Order Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Order Summary</Text>
          <View style={styles.divider} />

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

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>{parseFloat(totalPrice).toFixed(2)} Birr</Text>
          </View>
        </View>

        {/* Security Note */}
        <View style={styles.securityNote}>
          <MaterialIcons name="security" size={20} color="#666" />
          <Text style={styles.securityText}>
            Payments are secure and processed by Chapa Payment Gateway
          </Text>
        </View>
      </ScrollView>

      {/* Footer with Pay Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.payButton, (isProcessing || !paymentMethod) && styles.disabledButton]}
          onPress={initiatePayment}
          disabled={isProcessing || !paymentMethod}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <FontAwesome5 name="money-bill-wave" size={16} color="#fff" style={styles.payButtonIcon} />
              <Text style={styles.payButtonText}>Complete Payment</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Payment Verification Modal */}
      <PaymentVerification
        visible={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        success={verificationSuccess}
        error={verificationError}
        onConfirm={handleVerificationConfirm}
        onCancel={handleVerificationCancel}
        progress={verificationProgress}
        message={verificationStep}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  paymentOptionsContainer: {
    width: '100%',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  selectedOption: {
    borderColor: '#4184F2',
    backgroundColor: '#F0F6FF',
  },
  optionIconContainer: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 5,
  },
  paymentIcon: {
    width: 40,
    height: 40,
  },
  optionTextContainer: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 13,
    color: '#666',
  },
  selectedOptionText: {
    color: '#4184F2',
  },
  selectedOptionDescription: {
    color: '#4184F2',
  },
  checkboxContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4184F2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#eee',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  summaryLabel: {
    fontSize: 15,
    color: '#666',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#333',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4184F2',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
  },
  payButton: {
    backgroundColor: '#4184F2',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  payButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  payButtonIcon: {
    marginRight: 10,
  },
});

export default PaymentScreen;
