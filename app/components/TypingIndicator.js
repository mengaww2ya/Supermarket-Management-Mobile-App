import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Text } from 'react-native';

export default function TypingIndicator({ isTyping, username }) {
    // Create three animated values for the dots
    const dot1Opacity = useRef(new Animated.Value(0)).current;
    const dot2Opacity = useRef(new Animated.Value(0)).current;
    const dot3Opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (isTyping) {
            // Start the animation sequence
            animateDots();
        } else {
            // Reset the animations if not typing
            dot1Opacity.setValue(0);
            dot2Opacity.setValue(0);
            dot3Opacity.setValue(0);
        }
    }, [isTyping]);

    const animateDots = () => {
        // Reset values
        dot1Opacity.setValue(0);
        dot2Opacity.setValue(0);
        dot3Opacity.setValue(0);

        // Create the sequence of animations
        Animated.sequence([
            // First dot
            Animated.timing(dot1Opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            // Second dot
            Animated.timing(dot2Opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            // Third dot
            Animated.timing(dot3Opacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
            }),
            // Pause between animations
            Animated.delay(300),
        ]).start(() => {
            // Loop the animation
            if (isTyping) {
                animateDots();
            }
        });
    };

    if (!isTyping) return null;

    return (
        <View style={styles.container}>
            <View style={styles.bubble}>
                <Text style={styles.typingText}>
                    {username ? `${username} is typing` : 'Someone is typing'}
                </Text>
                <View style={styles.dotsContainer}>
                    <Animated.View style={[styles.dot, { opacity: dot1Opacity }]} />
                    <Animated.View style={[styles.dot, { opacity: dot2Opacity }]} />
                    <Animated.View style={[styles.dot, { opacity: dot3Opacity }]} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 12,
        marginBottom: 8,
    },
    bubble: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignSelf: 'flex-start',
        maxWidth: '80%',
    },
    typingText: {
        fontSize: 12,
        color: '#6b7280',
        marginRight: 4,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dot: {
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: '#6b7280',
        marginLeft: 2,
    },
}); 