
import { View, TextInput, TouchableOpacity, Alert, Keyboard } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import ChatRoomHeader from '../components/ChatRoomHeader';
import MessagesList from '../components/MessagesList';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Feather } from '@expo/vector-icons';
import CustomKeyboardAvoidingView from '../components/CustomKeyboardAvoidingView';
import { useAuth } from '../context/authContext';
import { getRoomId } from '../utills/common';
import { addDoc, collection, doc, onSnapshot, orderBy, query, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebaseConfig';

export default function ChatRoom  (){
  const router = useRouter();
  const item = useLocalSearchParams(); // Second user
  const { user } = useAuth(); // Current logged-in user
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const inputRef = useRef(null);
  const scrollViewRef = useRef(null);
  useEffect(() => {
    if (!user?.uid || !item?.uid) return; // Ensure valid user and item
    createRoomIfNotExists();
    let roomId = getRoomId(user?.uid, item?.uid);
    const docRef = doc(db, 'chatRoom', roomId);
    const messageRef = collection(docRef, 'messages');
    const q = query(messageRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const allMessages = snapshot.docs.map((doc) => doc.data());
        setMessages(allMessages);
    });

    // Auto-scroll on keyboard show
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', updateScrollView);

    return () => {
        unsubscribe(); // Clean up Firestore listener
        keyboardDidShowListener.remove(); // Remove keyboard listener
    };
}, [user?.uid, item?.uid]);
  useEffect(() => {
    updateScrollView();
  }, [messages]);

  const updateScrollView = () => {
    setTimeout(() => {
      scrollViewRef?.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const createRoomIfNotExists = async () => {
    let roomId = getRoomId(user?.uid, item?.uid);
    try {
      await setDoc(doc(db, 'chatRoom', roomId), {
        roomId,
        createdAt: Timestamp.fromDate(new Date()), // Fixed typo
      }, { merge: true });
      console.log('Room created or updated successfully');
    } catch (error) {
      console.error('Error creating/updating room:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!text.trim()) return;

    try {
      let roomId = getRoomId(user?.uid, item?.uid);
      const docRef = doc(db, 'chatRoom', roomId);
      const messageRef = collection(docRef, 'messages');
      setText(''); // Clear input field
      inputRef?.current?.clear();

      await addDoc(messageRef, {
        uid: user?.uid,
        text: text.trim(),
        profileUrl: user?.photoURL ,
        senderName: user?.fullName ,
        createdAt: Timestamp.fromDate(new Date()),
      });

      updateScrollView(); // Scroll after sending
    } catch (err) {
      Alert.alert('Message Error', err.message);
    }
  };

  return (
    <CustomKeyboardAvoidingView inChat={true}>
        <View className="flex-1 bg-white">
            <StatusBar style="dark" />
            <ChatRoomHeader user={item} router={router} />

            <View className="h-3 border-b border-neutral-300" />
            <View className="flex-1 justify-between bg-neutral-100 overflow-visible">
                <View className="flex-1">
                    <MessagesList scrollViewRef={scrollViewRef} messages={messages} currentUser={user} />
                </View>
                <View style={{ marginBottom: hp(1.7) }} className="pt-2">
                    <View className="flex-row mx-3 justify-between bg-white border p-2 border-neutral-300 rounded-full pl-5">
                        <TextInput
                            className="flex-1 mr-2"
                            style={{ fontSize: hp(2) }}
                            placeholder="Type message..."
                            onChangeText={setText}
                            value={text}
                            ref={inputRef}
                        />
                        <TouchableOpacity onPress={handleSendMessage} className="bg-neutral-200 p-2 mr-[1px] rounded-full">
                            <Feather name="send" size={hp(2.7)} color="#737373" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    </CustomKeyboardAvoidingView>
  );
};