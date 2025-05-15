import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

/**
 * Interactive Payment Verification Modal
 * 
 * @param {object} props Component props
 * @param {boolean} props.visible Whether the modal is visible
 * @param {function} props.onClose Callback when modal is dismissed
 * @param {boolean} props.success Whether verification was successful
 * @param {boolean} props.error Whether verification encountered an error
 * @param {function} props.onConfirm Callback when user confirms payment
 * @param {function} props.onCancel Callback when user cancels
 * @param {number} props.progress Verification progress (0-100)
 * @param {string} props.message Current verification step message
 */
const PaymentVerification = ({
  visible = false,
  onClose = () => {},
  success = false,
  error = false,
  onConfirm = () => {},
  onCancel = () => {},
  progress = 0,
  message = 'Verifying payment...',
}) => {
  // Determine what UI state to show based on props
  const isVerifying = !success && !error && visible;
  const hasResult = (success || error) && visible;

  // Animate the progress bar
  const [animatedProgress, setAnimatedProgress] = useState(0);
  
  useEffect(() => {
    if (isVerifying) {
      // Animate progress smoothly
      const timer = setTimeout(() => {
        if (animatedProgress < progress) {
          setAnimatedProgress(prev => Math.min(prev + 2, progress));
        }
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [isVerifying, progress, animatedProgress]);

  // If success, allow 100% progress
  useEffect(() => {
    if (success) {
      setAnimatedProgress(100);
    }
  }, [success]);

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Verification in Progress */}
          {isVerifying && (
            <View style={styles.content}>
              <ActivityIndicator size="large" color="#4184F2" style={styles.spinner} />
              <Text style={styles.title}>Verifying Payment</Text>
              <Text style={styles.message}>{message}</Text>
              
              <View style={styles.progressContainer}>
                <View style={[styles.progressBar, { width: `${animatedProgress}%` }]} />
              </View>
              
              <Text style={styles.timeEstimate}>
                This may take a few moments...
              </Text>
            </View>
          )}

          {/* Success State */}
          {success && (
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.successIcon]}>
                <Ionicons name="checkmark" size={50} color="#fff" />
              </View>
              <Text style={styles.title}>Payment Successful!</Text>
              <Text style={styles.message}>
                Your payment has been verified and your order is being processed.
              </Text>
              <TouchableOpacity 
                style={styles.button} 
                onPress={onConfirm}
              >
                <Text style={styles.buttonText}>Continue</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Error State */}
          {error && (
            <View style={styles.content}>
              <View style={[styles.iconContainer, styles.errorIcon]}>
                <Ionicons name="alert-circle" size={50} color="#fff" />
              </View>
              <Text style={styles.title}>Verification Issue</Text>
              <Text style={styles.message}>
                We couldn't verify your payment status automatically.
              </Text>
              
              <View style={styles.buttonGroup}>
                <TouchableOpacity 
                  style={[styles.button, styles.secondaryButton]} 
                  onPress={onCancel}
                >
                  <Text style={styles.secondaryButtonText}>I Didn't Pay</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.button} 
                  onPress={onConfirm}
                >
                  <Text style={styles.buttonText}>I Completed Payment</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    width: '100%',
    alignItems: 'center',
  },
  spinner: {
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
    color: '#333',
  },
  message: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
    lineHeight: 22,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4184F2',
    borderRadius: 4,
  },
  timeEstimate: {
    fontSize: 14,
    color: '#888',
    marginTop: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  successIcon: {
    backgroundColor: '#4CD964',
  },
  errorIcon: {
    backgroundColor: '#FF3B30',
  },
  button: {
    backgroundColor: '#4184F2',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 10,
  },
  secondaryButton: {
    backgroundColor: '#F2F2F7',
    marginRight: 10,
    flex: 0.45,
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PaymentVerification; 