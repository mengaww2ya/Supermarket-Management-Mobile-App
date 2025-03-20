import { View, FlatList } from 'react-native';
import React, { useEffect, useState } from 'react';
import ChatItem from './ChatItem';
import { useRouter } from 'expo-router';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { collection, query, orderBy, getDocs, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function ChatList  ({ users, currentUser }) {
    const router = useRouter();
    const [sortedUsers, setSortedUsers] = useState([]);

    useEffect(() => {
        const fetchLastMessages = async () => {
            const userWithLastMessage = await Promise.all(
                users.map(async (user) => {
                    const roomId = `${currentUser.uid}_${user.uid}`;
                    const messageRef = collection(db, 'chatRoom', roomId, 'messages');
                    const q = query(messageRef, orderBy('createdAt', 'desc'));
                    const querySnapshot = await getDocs(q);
                    const lastMessage = querySnapshot.docs.length > 0 ? querySnapshot.docs[0].data() : null;

                    return { ...user, lastMessage };
                })
            );
            // Sort users by most recent message
            userWithLastMessage.sort((a, b) => (b.lastMessage?.createdAt || 0) - (a.lastMessage?.createdAt || 0));
            setSortedUsers(userWithLastMessage);
        };

        if (users.length > 0) {
            fetchLastMessages();
        }
    }, [users]);

    return (
        <View className="flex-1">
            <FlatList
                data={sortedUsers}
                contentContainerStyle={{ paddingVertical: 25 }}
                keyExtractor={(item) => item?.uid || item?.id} // Use unique user ID
                showsVerticalScrollIndicator={false}
                renderItem={({ item, index }) => (
                    <ChatItem
                        noBorder={index + 1 === sortedUsers.length} 
                        item={item}
                        router={router}
                        currentUser={currentUser} // Pass currentUser properly
                    />
                )}
            />
        </View>
    );
};

