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
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

/**
 * Interactive Payment Verification Modal for Supplier Payments
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
 * @param {string} props.tipMessage Tip message to display
 */
const SupplierPaymentVerification = ({
    visible = false,
    onClose = () => { },
    success = false,
    error = false,
    onConfirm = () => { },
    onCancel = () => { },
    progress = 0,
    message = 'Verifying payment...',
    tipMessage
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
            // Trigger haptic feedback on success
            if (Haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
        }
    }, [success]);

    // If error, trigger haptic feedback
    useEffect(() => {
        if (error) {
            // Trigger haptic feedback on error
            if (Haptics) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            }
        }
    }, [error]);

    return (
        <Modal
            animationType="fade"
            transparent={true}
            visible={visible}
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modalContainer}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.title}>Payment Verification</Text>
                    </View>

                    {/* Status */}
                    <View style={styles.statusContainer}>
                        {success ? (
                            <View style={[styles.statusIcon, styles.successIcon]}>
                                <Ionicons name="checkmark" size={30} color="white" />
                            </View>
                        ) : error ? (
                            <View style={[styles.statusIcon, styles.errorIcon]}>
                                <Ionicons name="alert" size={30} color="white" />
                            </View>
                        ) : (
                            <View style={styles.loadingContainer}>
                                <ActivityIndicator size="large" color="#4F46E5" />
                            </View>
                        )}

                        <Text style={styles.statusText}>
                            {success ? 'Payment Verified!' : error ? 'Verification Issue' : 'Verifying Payment...'}
                        </Text>

                        <Text style={styles.messageText}>{message}</Text>

                        {!success && !error && tipMessage && (
                            <View style={styles.tipContainer}>
                                <MaterialIcons name="info-outline" size={16} color="#6B7280" />
                                <Text style={styles.tipText}>{tipMessage}</Text>
                            </View>
                        )}
                    </View>

                    {/* Progress bar */}
                    {!success && !error && (
                        <View style={styles.progressContainer}>
                            <View style={styles.progressBackground}>
                                <View style={[styles.progressFill, { width: `${animatedProgress}%` }]} />
                            </View>
                            <Text style={styles.progressText}>{`${animatedProgress}%`}</Text>
                        </View>
                    )}

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {error ? (
                            <>
                                <TouchableOpacity style={styles.buttonSecondary} onPress={onCancel}>
                                    <Text style={styles.buttonSecondaryText}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.buttonPrimary} onPress={onConfirm}>
                                    <Text style={styles.buttonPrimaryText}>I Made Payment</Text>
                                </TouchableOpacity>
                            </>
                        ) : success ? (
                            <TouchableOpacity style={styles.buttonPrimary} onPress={onConfirm}>
                                <Text style={styles.buttonPrimaryText}>Continue</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity style={styles.buttonSecondary} onPress={onCancel}>
                                <Text style={styles.buttonSecondaryText}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                    </View>
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
    header: {
        marginBottom: 16,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111827',
        textAlign: 'center',
    },
    statusContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    statusIcon: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    successIcon: {
        backgroundColor: '#10B981',
    },
    errorIcon: {
        backgroundColor: '#EF4444',
    },
    loadingContainer: {
        marginBottom: 16,
    },
    statusText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 8,
    },
    messageText: {
        fontSize: 14,
        color: '#4B5563',
        textAlign: 'center',
    },
    tipContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginTop: 16,
    },
    tipText: {
        fontSize: 13,
        color: '#6B7280',
        marginLeft: 8,
    },
    progressContainer: {
        marginBottom: 24,
    },
    progressBackground: {
        height: 8,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#4F46E5',
        borderRadius: 4,
    },
    progressText: {
        textAlign: 'center',
        marginTop: 8,
        fontSize: 14,
        color: '#6B7280',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    buttonPrimary: {
        backgroundColor: '#4F46E5',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginLeft: 8,
    },
    buttonSecondary: {
        backgroundColor: '#F3F4F6',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        marginRight: 8,
    },
    buttonPrimaryText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonSecondaryText: {
        color: '#4B5563',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default SupplierPaymentVerification; 