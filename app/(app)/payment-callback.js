import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { verifyPayment } from '../utills/chapaPayment';
import { getAuth } from 'firebase/auth';
import { db } from '../../firebase/firebaseConfig';
import { collection, addDoc, getDocs, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PaymentCallback() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Verifying your payment...');
  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Extract tx_ref from URL parameters
  const txRef = params.tx_ref;

  useEffect(() => {
    async function verifyTransaction() {
      if (!txRef) {
        setStatus('error');
        setMessage('Missing transaction reference');
        setLoading(false);
        return;
      }

      try {
        // Verify the payment
        const result = await verifyPayment(txRef);

        if (result.status === 'success') {
          // Get user's cart items
          const cartCollection = collection(db, `users/${currentUser.uid}/cart`);
          const cartSnapshot = await getDocs(cartCollection);
          const cartItems = cartSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

          // Get order details
          const ordersRef = collection(db, 'orders');
          const orderQuery = query(ordersRef, where('payment.tx_ref', '==', txRef));
          const orderSnapshot = await getDocs(orderQuery);

          // If order doesn't exist yet, create it
          if (orderSnapshot.empty) {
            // Create order in Firestore
            const orderRef = `OD-${Date.now()}`;
            
            // Get delivery details from the most recent order
            const recentOrdersQuery = query(
              collection(db, 'orders'), 
              where('userId', '==', currentUser.uid)
            );
            const recentOrdersSnapshot = await getDocs(recentOrdersQuery);
            let deliveryDetails = {};
            
            if (!recentOrdersSnapshot.empty) {
              // Sort orders by createdAt timestamp, descending
              const sortedOrders = recentOrdersSnapshot.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                  return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
                });
              
              if (sortedOrders.length > 0 && sortedOrders[0].deliveryDetails) {
                deliveryDetails = sortedOrders[0].deliveryDetails;
              }
            }
            
            const orderData = {
              orderRef,
              userId: currentUser.uid,
              deliveryDetails,
              items: cartItems.map(item => ({
                ...item,
                status: 'ordered'
              })),
              payment: {
                method: 'chapa',
                provider: 'chapa',
                amount: result.data.amount,
                tx_ref: txRef,
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
            
            // Clear cart
            const deletePromises = cartSnapshot.docs.map(item => {
              const cartDoc = doc(db, `users/${currentUser.uid}/cart`, item.id);
              return deleteDoc(cartDoc);
            });
            
            await Promise.all(deletePromises);
          }
          
          setStatus('success');
          setMessage('Payment successful! Your order has been placed.');
        } else {
          setStatus('error');
          setMessage('Payment verification failed. Please contact support.');
        }
      } catch (error) {
        console.error('Payment verification error:', error);
        setStatus('error');
        setMessage('An error occurred while verifying your payment.');
      } finally {
        setLoading(false);
      }
    }

    verifyTransaction();
  }, [txRef, currentUser]);

  const handleContinue = () => {
    router.navigate('(tabs)');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.navigate('(tabs)')} style={styles.backButton}>
          <Ionicons name="home" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Result</Text>
      </View>
      
      <View style={styles.content}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Verifying payment...</Text>
          </View>
        ) : (
          <View style={styles.resultContainer}>
            <View style={[
              styles.statusIconContainer, 
              status === 'success' ? styles.successIcon : styles.errorIcon
            ]}>
              <Ionicons 
                name={status === 'success' ? 'checkmark-circle' : 'close-circle'} 
                size={60} 
                color="#fff" 
              />
            </View>
            
            <Text style={styles.statusTitle}>
              {status === 'success' ? 'Payment Successful' : 'Payment Failed'}
            </Text>
            
            <Text style={styles.statusMessage}>{message}</Text>
            
            <TouchableOpacity 
              style={styles.continueButton}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>
                {status === 'success' ? 'Continue Shopping' : 'Try Again'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    fontSize: 16,
    color: '#666',
  },
  resultContainer: {
    alignItems: 'center',
    width: '100%',
  },
  statusIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successIcon: {
    backgroundColor: '#4CD964',
  },
  errorIcon: {
    backgroundColor: '#FF3B30',
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  statusMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
  },
  continueButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  continueButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 