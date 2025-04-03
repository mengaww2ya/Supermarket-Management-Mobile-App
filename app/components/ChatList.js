import React, { useEffect, useRef, useState } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, Animated, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import ChatItem from './ChatItem';
import { useRouter } from 'expo-router';
import { collection, query, orderBy, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function ChatList({ chatData, loading, error, onRefresh, onChatPress, currentUser }) {
    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(30)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 500,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);
    
    const handleRefresh = async () => {
        setRefreshing(true);
        await onRefresh();
        setRefreshing(false);
    };
    
    const renderItem = ({ item, index }) => {
        // Calculate staggered animation delay based on index
        const itemDelay = index * 80;

    return (
                    <ChatItem
                chat={item} 
                onPress={() => onChatPress(item)}
                currentUser={currentUser}
                index={index}
                animationDelay={itemDelay}
            />
        );
    };
    
    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4f46e5" />
                <Text style={styles.loadingText}>Loading conversations...</Text>
            </View>
        );
    }
    
    if (error) {
        return (
            <Animated.View 
                style={[
                    styles.errorContainer,
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY }]
                    }
                ]}
            >
                <Feather name="alert-circle" size={50} color="#ef4444" />
                <Text style={styles.errorTitle}>Oops!</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity 
                    style={styles.retryButton}
                    onPress={handleRefresh}
                >
                    <LinearGradient
                        colors={['#6366f1', '#4f46e5']}
                        style={styles.gradientButton}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Feather name="refresh-cw" size={16} color="white" style={styles.buttonIcon} />
                        <Text style={styles.buttonText}>Try Again</Text>
                    </LinearGradient>
                </TouchableOpacity>
            </Animated.View>
        );
    }
    
    const EmptyListComponent = () => (
        <Animated.View 
            style={[
                styles.emptyContainer,
                {
                    opacity: fadeAnim,
                    transform: [{ translateY }]
                }
            ]}
        >
            <LinearGradient
                colors={['#f3f4f6', '#e5e7eb']}
                style={styles.emptyImageContainer}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            >
                <Feather name="message-circle" size={80} color="#9ca3af" />
            </LinearGradient>
            <Text style={styles.emptyTitle}>No conversations yet</Text>
            <Text style={styles.emptyText}>
                Your messages will appear here. Start chatting with other users to see conversations.
            </Text>
        </Animated.View>
    );
    
    return (
        <FlatList
            data={chatData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            ListEmptyComponent={EmptyListComponent}
        />
    );
}

const styles = StyleSheet.create({
    listContainer: {
        flexGrow: 1,
        paddingHorizontal: 16,
        paddingTop: 8,
        paddingBottom: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 16,
        color: '#6b7280',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginTop: 12,
        marginBottom: 8,
    },
    errorText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        marginBottom: 24,
        maxWidth: wp(80),
    },
    retryButton: {
        borderRadius: 25,
        overflow: 'hidden',
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
    },
    buttonIcon: {
        marginRight: 8,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 60,
    },
    emptyImageContainer: {
        width: 150,
        height: 150,
        borderRadius: 75,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#111827',
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: wp(80),
    },
});

