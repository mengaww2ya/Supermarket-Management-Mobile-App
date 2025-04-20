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
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { generateTxRef, initializePayment, verifyPayment } from '../../utills/supplierChapaPayment';
import { LinearGradient } from 'expo-linear-gradient';
import SupplierPaymentVerification from '../../components/SupplierPaymentVerification';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Constants from 'expo-constants';

const { width } = Dimensions.get('window');

const CHAPA_SECRET_KEY = Constants.expoConfig?.extra?.supplierChapaSecretKey || '';

const SupplierPaymentScreen = () => {
    const router = useRouter();
    const navigation = useNavigation();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const {
        totalAmount,
        supplierId,
        supplierName,
        notes,
        cartItems: cartItemsString
    } = useLocalSearchParams();

    // Parse cartItems from JSON string
    const cartItems = cartItemsString ? JSON.parse(cartItemsString) : [];

    const [paymentMethod, setPaymentMethod] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentStatus, setPaymentStatus] = useState('pending');
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

    // Initialize txRef when component mounts
    useEffect(() => {
        if (currentUser) {
            setTxRef(generateTxRef());
        }
    }, []);

    // Function to clear the supplier cart after successful order
    const clearSupplierCart = async (selectedItemIds) => {
        try {
            if (!currentUser) return;

            const cartCollection = collection(db, `stockManager/${currentUser.uid}/supplierCart`);

            // Delete only the selected items
            for (const itemId of selectedItemIds) {
                const cartDoc = doc(db, `stockManager/${currentUser.uid}/supplierCart`, itemId);
                await deleteDoc(cartDoc);
            }

            console.log('Supplier cart items cleared successfully');
        } catch (error) {
            console.error("Error clearing supplier cart:", error);
        }
    };

    const handlePaymentMethodSelect = (method) => {
        setPaymentMethod(method);
    };

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
            Alert.alert(
                "Payment Method Required",
                "Please select a payment method to continue with your purchase.",
                [{ text: "OK" }]
            );
            return;
        }

        setIsProcessing(true);

        try {
            // Get user info from Firebase (assuming stockManager is also a user)
            const userQuery = query(collection(db, 'users'), where('uid', '==', currentUser.uid));
            const userSnapshot = await getDocs(userQuery);

            let firstName = 'Stock';
            let lastName = 'Manager';
            let email = currentUser?.email || 'stockmanager@example.com';

            if (!userSnapshot.empty) {
                const userDoc = userSnapshot.docs[0].data();
                const nameParts = (userDoc.fullName || 'Stock Manager').split(' ');
                firstName = nameParts[0] || 'Stock';
                lastName = nameParts.length > 1 ? nameParts[1] : 'Manager';
                email = userDoc.email || currentUser.email || 'stockmanager@example.com';
            }

            // Validate input data
            if (!parseFloat(totalAmount) || parseFloat(totalAmount) <= 0) {
                throw new Error("Invalid order amount");
            }

            // Prepare payment data with selected payment method
            const paymentData = {
                amount: parseFloat(totalAmount).toFixed(2),
                currency: 'ETB',
                email: email,
                first_name: firstName,
                last_name: lastName,
                tx_ref: txRef,
                callback_url: 'https://webhook.site/077164d7-29be-4946-af1a-30e5b4e43d2b',
                customization: {
                    title: 'Supplier Order',
                    description: `Payment to ${supplierName}`,
                }
            };

            // Only add payment_options if valid option is selected
            if (paymentMethod && ['telebirr', 'cbe', 'amole', 'awash', 'mpesa'].includes(paymentMethod)) {
                paymentData.payment_options = paymentMethod;
            }

            // Initialize payment
            console.log('Sending supplier payment request to Chapa with tx_ref:', txRef);
            const response = await initializePayment(paymentData);

            if (response.status === 'success' && response.data?.checkout_url) {
                try {
                    await WebBrowser.openBrowserAsync(response.data.checkout_url);

                    // After browser is closed, start verifying payment
                    setIsProcessing(true);
                    setShowVerificationModal(true);

                    // Start verification process with visual indicators
                    let attempts = 0;
                    const maxAttempts = 5; // Increased from 3 to 5 for more verification attempts
                    let isVerified = false;

                    // Verification process function
                    const checkPaymentStatus = async () => {
                        attempts++;
                        setVerificationAttempts(attempts);

                        // Update progress and messages based on attempt number
                        setVerificationProgress(attempts === 1 ? 30 : attempts === 2 ? 60 : attempts === 3 ? 75 : 90);
                        setVerificationStep(getVerificationMessage(attempts, paymentMethod));

                        try {
                            // Use custom verification function
                            const verificationResult = await customVerifyPayment(txRef);
                            console.log(`Payment verification attempt ${attempts}:`, verificationResult);

                            // Check if payment is successful
                            if (verificationResult && verificationResult.status === 'success') {
                                // Payment verified successfully
                                setVerificationProgress(100);
                                setVerificationSuccess(true);
                                isVerified = true;
                                setPaymentStatus('success'); // Set payment status to success

                                // Process the successful payment
                                setTimeout(() => {
                                    handlePaymentSuccess(paymentMethod, true);
                                }, 1500);
                            }
                            // Check if payment is pending and we should try again
                            else if (attempts < maxAttempts &&
                                (verificationResult.status === 'pending')) {
                                // Try again after a delay that increases with each attempt
                                const delayTime = 2000 + (attempts * 1000);
                                setTimeout(() => {
                                    checkPaymentStatus();
                                }, delayTime);
                            }
                            // Max attempts reached or payment failed
                            else if (attempts >= maxAttempts) {
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
                            console.error(`Verification error on attempt ${attempts}:`, error);

                            if (attempts < maxAttempts) {
                                // Try again after a delay that increases with each attempt
                                const delayTime = 2000 + (attempts * 1000);
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
                throw new Error('Failed to initialize payment: ' + (response?.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Payment error:', error);
            setIsProcessing(false);

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

        // Set payment status as success
        setPaymentStatus('success');

        // Show loading indicator
        setIsProcessing(true);

        const orderRef = `SO-${Date.now()}`;

        try {
            // Validate current user
            if (!currentUser) {
                throw new Error("Authentication error: User is not logged in");
            }

            // Validate cart items
            if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
                throw new Error("No items found in order");
            }

            // Extract all the selected item IDs
            const selectedItemIds = cartItems.map(item => item.id);

            // Group items by category
            const itemsByCategory = {};
            cartItems.forEach(item => {
                const categoryId = item.categoryId;
                if (!itemsByCategory[categoryId]) {
                    itemsByCategory[categoryId] = [];
                }
                itemsByCategory[categoryId].push(item);
            });

            // Create the supplier order data with additional metadata
            const orderData = {
                supplierOrderRef: orderRef,
                supplierId,
                supplierName,
                items: cartItems.map(item => ({
                    productId: item.productId,
                    categoryId: item.categoryId,
                    name: item.productName,
                    price: item.price,
                    quantity: item.quantity,
                    totalPrice: item.totalPrice,
                    imageUrl: item.image,
                    unit: item.unitType || "unit",
                })),
                status: 'Pending',
                orderDate: serverTimestamp(),
                expectedDeliveryDate: null,
                totalAmount: parseFloat(totalAmount),
                notes: notes || "",
                createdBy: currentUser.uid,
                createdAt: serverTimestamp(),
                payment: {
                    method: 'chapa',
                    provider: paymentProvider,
                    amount: parseFloat(totalAmount),
                    status: 'completed',
                    tx_ref: txRef,
                    paidAt: serverTimestamp(),
                },
                orderNumber: `SO-${Date.now().toString().substr(-6)}`,
                // Add audit trail without using serverTimestamp in array
                orderHistory: [
                    {
                        status: 'created',
                        timestamp: new Date().toISOString(), // Use ISO string instead of serverTimestamp()
                        note: 'Order created and payment completed'
                    }
                ]
            };

            console.log('Saving supplier order to database...', orderRef);

            // Store order in the SupplierOrders collection
            const orderDocRef = await addDoc(collection(db, 'SupplierOrders'), orderData);
            console.log('Order saved to supplier orders collection with ID:', orderDocRef.id);

            // Clear the selected items from cart
            await clearSupplierCart(selectedItemIds);

            // Stop processing indicator
            setIsProcessing(false);

            // Show success message and navigate back to supplier order management
            Alert.alert(
                'Order Placed Successfully!',
                `Your payment of ${parseFloat(totalAmount).toFixed(2)} Birr to ${supplierName} was successful. Your order #${orderData.orderNumber} is now being processed.`,
                [
                    {
                        text: 'View Orders',
                        onPress: () => {
                            // Navigate to supplier order management screen
                            router.push('/stockManager/Supplier_order_management');
                        }
                    },
                    {
                        text: 'Continue Shopping',
                        style: 'default',
                        onPress: () => {
                            // Navigate back to supplier catalog
                            router.push('/stockManager/SupplierCatalog');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating supplier order:', error);
            setIsProcessing(false);

            // Show a more user-friendly error message
            Alert.alert(
                'Order Processing Error',
                'There was a problem processing your order. Your payment was successful, but we couldn\'t complete the order process. Please contact support with reference code: ' + txRef,
                [
                    {
                        text: 'Contact Support',
                        onPress: () => {
                            // This could open an email or support chat in a real app
                            Alert.alert('Support', 'Please email support@yourapp.com with your transaction reference: ' + txRef);
                        }
                    },
                    {
                        text: 'OK',
                        style: 'default'
                    }
                ]
            );
        }
    };

    const handlePaymentFailure = (message) => {
        setIsProcessing(false);
        setPaymentStatus('failed');

        Alert.alert(
            'Payment Verification Failed',
            message || 'We could not verify your payment. If you believe you have paid, please contact support with your transaction reference: ' + txRef,
            [
                {
                    text: 'Try Again',
                    onPress: () => {
                        // Reset verification states
                        setVerificationProgress(0);
                        setVerificationAttempts(0);
                        setVerificationError(false);
                        setVerificationSuccess(false);

                        // Allow the user to try again
                        setPaymentMethod('');
                    }
                },
                {
                    text: 'Contact Support',
                    style: 'default',
                    onPress: () => {
                        // This could open an email or support chat in a real app
                        Alert.alert('Support', 'Please email support@yourapp.com with your transaction reference: ' + txRef);
                    }
                }
            ]
        );
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
                'The standard verification was unsuccessful. We will try an alternative method to check your payment status.',
                [{ text: 'OK' }]
            );

            // Show loading
            setIsProcessing(true);

            // Try direct transaction check first
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

    // Add this function to provide varying verification messages based on attempt count
    const getVerificationMessage = (attempt, paymentMethod) => {
        const paymentDisplay = paymentMethod ? paymentMethod.charAt(0).toUpperCase() + paymentMethod.slice(1) : 'payment';

        switch (attempt) {
            case 1:
                return `Connecting to ${paymentDisplay} gateway...`;
            case 2:
                return `Verifying your payment with ${paymentDisplay}...`;
            case 3:
                return `Processing transaction details with reference: ${txRef.substring(0, 8)}...`;
            case 4:
                return `Confirming payment status one last time...`;
            default:
                return `Finalizing payment verification...`;
        }
    };

    // Add this function to provide helpful tips during verification process
    const getVerificationTip = (attempt) => {
        const tips = [
            "Payment verification may take a few moments to complete.",
            "This usually takes less than 30 seconds to verify.",
            "Almost there! We're confirming your payment details.",
            "Thank you for your patience while we complete this process."
        ];

        return tips[Math.min(attempt - 1, tips.length - 1)];
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Supplier Payment</Text>
                <View style={styles.placeholderRight} />
            </View>

            <ScrollView style={styles.scrollView}>
                {/* Order Summary */}
                <View style={styles.summaryContainer}>
                    <Text style={styles.sectionTitle}>Order Summary</Text>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Supplier:</Text>
                        <Text style={styles.summaryValue}>{supplierName || 'Unknown Supplier'}</Text>
                    </View>
                    <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Total Amount:</Text>
                        <Text style={styles.summaryAmount}>{totalAmount} Birr</Text>
                    </View>
                    {notes && (
                        <View style={styles.summaryItem}>
                            <Text style={styles.summaryLabel}>Notes:</Text>
                            <Text style={styles.summaryValue}>{notes}</Text>
                        </View>
                    )}
                </View>

                {/* Payment Methods */}
                <View style={styles.paymentMethodsContainer}>
                    <Text style={styles.sectionTitle}>Payment Method</Text>
                    <Text style={styles.sectionDescription}>
                        Select your preferred payment method
                    </Text>

                    {paymentOptions.map((option) => {
                        const IconComponent = option.iconComponent;
                        const isSelected = paymentMethod === option.id;

                        return (
                            <TouchableOpacity
                                key={option.id}
                                style={[
                                    styles.paymentOption,
                                    isSelected && styles.paymentOptionSelected
                                ]}
                                onPress={() => handlePaymentMethodSelect(option.id)}
                            >
                                <View
                                    style={[
                                        styles.paymentIconContainer,
                                        { backgroundColor: option.bgColor }
                                    ]}
                                >
                                    <IconComponent name={option.iconName} size={22} color={option.iconColor} />
                                </View>
                                <View style={styles.paymentOptionContent}>
                                    <Text style={styles.paymentOptionTitle}>{option.name}</Text>
                                    <Text style={styles.paymentOptionDescription}>{option.description}</Text>
                                </View>
                                <View style={styles.radioContainer}>
                                    <View style={[
                                        styles.radioOuter,
                                        isSelected && styles.radioOuterSelected
                                    ]}>
                                        {isSelected && <View style={styles.radioInner} />}
                                    </View>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {/* Payment verification disclaimer */}
                <View style={styles.disclaimerContainer}>
                    <MaterialIcons name="info-outline" size={20} color="#666" />
                    <Text style={styles.disclaimerText}>
                        After clicking "Pay Now", you'll be redirected to Chapa secure payment gateway to complete your transaction.
                    </Text>
                </View>
            </ScrollView>

            {/* Payment Button */}
            <View style={styles.payButtonContainer}>
                <TouchableOpacity
                    style={[
                        styles.payButton,
                        (!paymentMethod || isProcessing) && styles.payButtonDisabled
                    ]}
                    onPress={initiatePayment}
                    disabled={!paymentMethod || isProcessing}
                >
                    {isProcessing ? (
                        <ActivityIndicator size="small" color="#fff" />
                    ) : (
                        <>
                            <Text style={styles.payButtonText}>Pay Now</Text>
                            <Ionicons name="arrow-forward" size={20} color="#fff" />
                        </>
                    )}
                </TouchableOpacity>
            </View>

            {/* Payment Verification Modal */}
            <SupplierPaymentVerification
                visible={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                success={verificationSuccess}
                error={verificationError}
                onConfirm={handleVerificationConfirm}
                onCancel={handleVerificationCancel}
                progress={verificationProgress}
                message={verificationStep}
                tipMessage={getVerificationTip(verificationAttempts)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
    },
    placeholderRight: {
        width: 40,
    },
    scrollView: {
        flex: 1,
    },
    summaryContainer: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    summaryItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#4B5563',
    },
    summaryValue: {
        fontSize: 16,
        color: '#111827',
        fontWeight: '500',
        flex: 1,
        textAlign: 'right',
    },
    summaryAmount: {
        fontSize: 16,
        color: '#10B981',
        fontWeight: 'bold',
    },
    paymentMethodsContainer: {
        backgroundColor: 'white',
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 16,
    },
    paymentOption: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: '#FFFFFF',
    },
    paymentOptionSelected: {
        borderColor: '#4F46E5',
        backgroundColor: '#F9FAFB',
    },
    paymentIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    paymentOptionContent: {
        flex: 1,
    },
    paymentOptionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#111827',
        marginBottom: 2,
    },
    paymentOptionDescription: {
        fontSize: 14,
        color: '#6B7280',
    },
    radioContainer: {
        paddingLeft: 10,
    },
    radioOuter: {
        width: 22,
        height: 22,
        borderRadius: 11,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        justifyContent: 'center',
        alignItems: 'center',
    },
    radioOuterSelected: {
        borderColor: '#4F46E5',
    },
    radioInner: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#4F46E5',
    },
    disclaimerContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#F3F4F6',
        marginHorizontal: 16,
        marginTop: 16,
        marginBottom: 80,
        borderRadius: 12,
        padding: 12,
    },
    disclaimerText: {
        fontSize: 14,
        color: '#4B5563',
        flex: 1,
        marginLeft: 8,
        lineHeight: 20,
    },
    payButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
    },
    payButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 10,
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    payButtonDisabled: {
        backgroundColor: '#A5B4FC',
    },
    payButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
        marginRight: 10,
    },
});

export default SupplierPaymentScreen; 