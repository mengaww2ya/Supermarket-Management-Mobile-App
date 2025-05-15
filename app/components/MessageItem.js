import React from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo } from 'react';

export default function MessageItem({ message, currentUser, index, animationDuration = 300 }) {
    const isCurrentUser = currentUser?.uid === message?.uid;
    
    // Create animated value for entrance animation
    const opacityAnim = useMemo(() => new Animated.Value(0), []);
    const translateYAnim = useMemo(() => new Animated.Value(20), []);
    
    // Start animation when component mounts
    React.useEffect(() => {
        const delay = index * 50; // Staggered animation based on message index
        
        Animated.parallel([
            Animated.timing(opacityAnim, {
                toValue: 1,
                duration: animationDuration,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateYAnim, {
                toValue: 0,
                duration: animationDuration,
                delay,
                useNativeDriver: true,
            })
        ]).start();
    }, []);

    // Get hours and minutes for timestamp display
    const getMessageTime = (timestamp) => {
        if (!timestamp || !timestamp.toDate) return '';
        try {
            const date = timestamp.toDate();
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (error) {
            console.log('Error formatting timestamp:', error);
            return '';
        }
    };

    // Extract message text safely
    const getMessageText = () => {
        if (!message) return '';
        
        // Check if message is a string
        if (typeof message.text === 'string') {
            return message.text;
        }
        
        // Check if message is an object
        if (typeof message === 'object') {
            if (message.text && typeof message.text === 'object') {
                // If message.text is an object, try to convert it to string
                return JSON.stringify(message.text);
            }
            
            // Try to find text content in any format
            const possibleTextFields = ['text', 'content', 'message', 'body'];
            for (const field of possibleTextFields) {
                if (message[field] && typeof message[field] === 'string') {
                    return message[field];
                }
            }
        }
        
        // Fallback to empty string
        return '';
    };

    return (
        <Animated.View 
            style={[
                styles.container,
                { 
                    alignSelf: isCurrentUser ? 'flex-end' : 'flex-start',
                    opacity: opacityAnim,
                    transform: [{ translateY: translateYAnim }]
                }
            ]}
        >
            {isCurrentUser ? (
                <LinearGradient
                    colors={['#6366f1', '#4f46e5']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.messageContainer, styles.userMessage]}
                >
                    <Text style={styles.messageTextUser}>
                        {getMessageText()}
                    </Text>
                    {message?.timestamp && (
                        <Text style={styles.timestampUser}>
                            {getMessageTime(message.timestamp)}
                        </Text>
                    )}
                </LinearGradient>
            ) : (
                <View style={[styles.messageContainer, styles.otherMessage]}>
                    <Text style={styles.messageTextOther}>
                        {getMessageText()}
                    </Text>
                    {message?.timestamp && (
                        <Text style={styles.timestampOther}>
                            {getMessageTime(message.timestamp)}
                        </Text>
                    )}
                </View>
            )}
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: 4,
        maxWidth: wp(80),
    },
    messageContainer: {
        borderRadius: 20,
        padding: 12,
        paddingBottom: 8,
        minWidth: wp(15),
    },
    userMessage: {
        borderBottomRightRadius: 4,
    },
    otherMessage: {
        backgroundColor: 'white',
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 1,
        elevation: 1,
    },
    messageTextUser: {
        color: 'white',
        fontSize: hp(1.9),
        marginBottom: 4,
    },
    messageTextOther: {
        color: '#374151',
        fontSize: hp(1.9),
        marginBottom: 4,
    },
    timestampUser: {
        fontSize: hp(1.4),
        color: 'rgba(255, 255, 255, 0.8)',
        alignSelf: 'flex-end',
    },
    timestampOther: {
        fontSize: hp(1.4),
        color: '#9ca3af',
        alignSelf: 'flex-end',
    }
});
