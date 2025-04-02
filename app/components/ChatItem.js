import { View, Text, TouchableOpacity } from 'react-native';
import React, { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { blurhash, getRoomId } from '../utills/common';
import { collection, doc, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function ChatItem({ item, router, noBorder, currentUser }) {
    const [lastMessage, setLastMessage] = useState(null);
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        if (!currentUser?.uid || !item?.uid) return;

        const roomId = getRoomId(currentUser.uid, item.uid);
        const docRef = doc(db, "chatRoom", roomId);
        const messageRef = collection(docRef, "messages");
        const q = query(messageRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const allMessages = snapshot.docs.map(doc => doc.data());
            setLastMessage(allMessages[0] || null);
        });

        return () => unsubscribe(); // Cleanup to prevent memory leaks
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
                {currentUser?.uid === lastMessage?.uid ? `You: ${lastMessage.text}` : lastMessage.text}
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