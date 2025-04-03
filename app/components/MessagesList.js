import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, Animated, TouchableOpacity, Text } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import MessageItem from './MessageItem';
import { MaterialIcons } from '@expo/vector-icons';

export default function MessagesList({ messages, currentUser, ScrollViewRef, onScrollToBottom }) {
    // Ref for FlatList component
    const flatListRef = useRef(null);
    
    // Animation value for scroll button
    const scrollButtonOpacity = useRef(new Animated.Value(0)).current;
    const [showScrollButton, setShowScrollButton] = useState(false);
    
    // Scroll to bottom on new messages
    useEffect(() => {
        if (messages && messages.length > 0 && flatListRef.current) {
            setTimeout(() => {
                flatListRef.current.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);
    
    // Validate message data to prevent errors
    const validateMessages = (messageArray) => {
        if (!messageArray || !Array.isArray(messageArray)) return [];
        
        return messageArray.filter(msg => {
            return msg && (typeof msg === 'object' || typeof msg === 'string');
        });
    };
    
    // Handle scroll events
    const handleScroll = (event) => {
        const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
        const paddingToBottom = 20;
        const isCloseToBottom = layoutMeasurement.height + contentOffset.y >= 
            contentSize.height - paddingToBottom;
            
        if (isCloseToBottom && showScrollButton) {
            setShowScrollButton(false);
            Animated.timing(scrollButtonOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else if (!isCloseToBottom && !showScrollButton && messages.length > 8) {
            setShowScrollButton(true);
            Animated.timing(scrollButtonOpacity, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    };
    
    // Scroll to bottom function
    const scrollToBottom = () => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
        if (onScrollToBottom) {
            onScrollToBottom();
        }
    };
    
    // DateSeparator component for showing date between messages
    const DateSeparator = ({ date }) => {
        if (!date) return null;
        return (
            <View style={styles.dateSeparator}>
                <View style={styles.dateLine} />
                <Text style={styles.dateText}>{date}</Text>
                <View style={styles.dateLine} />
            </View>
        );
    };
    
    // Get formatted date for separator
    const getMessageDate = (timestamp) => {
        if (!timestamp) return null;
        
        try {
            let date;
            if (timestamp.toDate && typeof timestamp.toDate === 'function') {
                date = timestamp.toDate();
            } else if (timestamp instanceof Date) {
                date = timestamp;
            } else if (typeof timestamp === 'number') {
                date = new Date(timestamp);
            } else {
                return null;
            }
            
            const today = new Date();
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            
            if (date.toDateString() === today.toDateString()) {
                return "Today";
            } else if (date.toDateString() === yesterday.toDateString()) {
                return "Yesterday";
            } else {
                return date.toLocaleDateString(undefined, { 
                    month: 'short', 
                    day: 'numeric',
                    year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
                });
            }
        } catch (error) {
            console.log('Error formatting message date:', error);
            return null;
        }
    };
    
    // Process messages to add date separators
    const processedMessages = React.useMemo(() => {
        const validMessages = validateMessages(messages);
        if (validMessages.length === 0) return [];
        
        const result = [];
        let currentDate = null;
        
        validMessages.forEach((message, index) => {
            if (!message) return;
            
            const messageDate = message.timestamp ? getMessageDate(message.timestamp) : null;
            
            // Add date separator if date changed
            if (messageDate && messageDate !== currentDate) {
                currentDate = messageDate;
                result.push({
                    id: `date-${index}`,
                    type: 'date',
                    date: messageDate
                });
            }
            
            // Add the message with a generated ID if missing
            const uniqueId = message.id || `msg-${index}-${Date.now()}`;
            result.push({
                ...message,
                id: uniqueId,
                type: 'message'
            });
        });
        
        return result;
    }, [messages]);
    
    // Render item based on type
    const renderItem = ({ item, index }) => {
        if (!item) return null;
        
        if (item.type === 'date') {
            return <DateSeparator date={item.date} />;
        } else {
            return (
                <MessageItem 
                    message={item} 
                    currentUser={currentUser} 
                    index={index}
                />
            );
        }
    };
    
    // Handle keyExtractor to ensure unique keys
    const keyExtractor = (item, index) => {
        return item?.id || `msg-${index}-${Date.now()}`;
    };
    
    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={processedMessages}
                keyExtractor={keyExtractor}
                renderItem={renderItem}
            showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                removeClippedSubviews={true}
                initialNumToRender={15}
                maxToRenderPerBatch={10}
                windowSize={10}
            />
            
            {/* Scroll to bottom button */}
            <Animated.View 
                style={[
                    styles.scrollToBottomButton,
                    { opacity: scrollButtonOpacity }
                ]}
                pointerEvents={showScrollButton ? 'auto' : 'none'}
            >
                <TouchableOpacity
                    style={styles.scrollButton}
                    onPress={scrollToBottom}
                    activeOpacity={0.8}
                >
                    <MaterialIcons name="keyboard-arrow-down" size={24} color="#4f46e5" />
                </TouchableOpacity>
            </Animated.View>
                    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: 'relative',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingTop: 10,
        paddingBottom: 20,
    },
    dateSeparator: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dateLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#e5e7eb',
    },
    dateText: {
        fontSize: 12,
        color: '#6b7280',
        marginHorizontal: 8,
        fontWeight: '500',
    },
    scrollToBottomButton: {
        position: 'absolute',
        right: 10,
        bottom: 10,
        width: 36,
        height: 36,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollButton: {
        backgroundColor: 'white',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.5,
        elevation: 2,
    },
});