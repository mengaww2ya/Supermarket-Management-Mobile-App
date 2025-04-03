import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { blurhash, getRoomId } from '../utills/common';
import { collection, doc, onSnapshot, orderBy, query, where, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function ChatItem({ item, router, noBorder, currentUser }) {
    const [lastMessage, setLastMessage] = useState(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid || !item?.uid) return;

        const roomId = getRoomId(currentUser.uid, item.uid);
        
        // Try using the messages collection first (new structure)
        try {
            const messagesQuery = query(
                collection(db, 'messages'),
                where('roomId', '==', roomId),
                orderBy('createdAt', 'desc'),
                limit(1)
            );

            const unsubscribe = onSnapshot(messagesQuery, 
                // Success handler
                (snapshot) => {
                    if (!snapshot.empty) {
                        setLastMessage(snapshot.docs[0].data());
                    } else {
                        // If no messages in the new structure, try the old structure
                        checkOldStructure();
                    }
                },
                // Error handler - likely missing index
                (error) => {
                    console.log('[Chat Debug] Error in messages query, checking old structure:', error);
                    checkOldStructure();
                }
            );
            
            return () => unsubscribe();
        } catch (error) {
            console.log('[Chat Debug] Error setting up query, checking old structure:', error);
            checkOldStructure();
        }
        
        // Fallback to check the old chat structure
        function checkOldStructure() {
            try {
        const docRef = doc(db, "chatRoom", roomId);
        const messageRef = collection(docRef, "messages");
        const q = query(messageRef, orderBy('createdAt', 'desc'));

                const oldUnsubscribe = onSnapshot(q, (snapshot) => {
            const allMessages = snapshot.docs.map(doc => doc.data());
            setLastMessage(allMessages[0] || null);
        });

                return oldUnsubscribe;
            } catch (oldError) {
                console.error('[Chat Debug] Error checking old structure:', oldError);
                return () => {};
            }
        }
    }, [currentUser?.uid, item?.uid]);

    const openChatroom = () => {
        router.push({
            pathname: '/(app)/chatRoom',
            params: item,
        });
    };

    const renderTime = () => {
        if (!lastMessage?.createdAt) return "";
        const date = new Date(lastMessage.createdAt.toDate());
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const renderLastMessage = () => {
        if (lastMessage === undefined) {
            return <Text style={{ fontSize: hp(1.6) }} className='font-medium text-neutral-500'>Loading...</Text>;
        }
        if (!lastMessage) {
            return <Text style={{ fontSize: hp(1.6) }} className='font-medium text-neutral-500'>Say hi.</Text>;
        }
        return (
            <Text style={{ fontSize: hp(1.6) }} className='font-medium text-neutral-500'>
                {currentUser?.uid === lastMessage?.uid || currentUser?.uid === lastMessage?.senderId ? 
                    `You: ${lastMessage.text}` : lastMessage.text}
            </Text>
        );
    };

    return (
        <TouchableOpacity onPress={openChatroom} className={`flex-row justify-between mx-4 items-center gap-3 pb-2 ${noBorder ? '' : ' border-b-neutral-200'}`}>
            <Image
                source={imageError || !item?.photoURL ? DEFAULT_PROFILE_IMAGE : { uri: item?.photoURL }}
                style={{ height: hp(6), width: hp(6), borderRadius: 100 }}
                placeholder={blurhash}
                transition={500}
                resizeMode='cover'
                onError={() => setImageError(true)}
            />
            <View className='flex-1 gap-1'>
                <View className='flex-row justify-between'>
                    <Text style={{ fontSize: hp(1.8) }} className='font-semibold text-neutral-800'>{item?.fullName}</Text>
                    <Text style={{ fontSize: hp(1.6) }} className='font-medium text-neutral-500'>
                        {renderTime()}
                    </Text>
                </View>
                {renderLastMessage()}
            </View>
        </TouchableOpacity>
    );
}