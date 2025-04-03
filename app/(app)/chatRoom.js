import React, { useEffect, useRef, useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  Keyboard, 
  Text,
  Platform,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  FlatList,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Feather, Ionicons, MaterialIcons, AntDesign, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from 'react-native-responsive-screen';

import CustomKeyboardAvoidingView from '../components/CustomKeyboardAvoidingView';
import { useAuth } from '../context/authContext';
import { getRoomId } from '../utills/common';
import HomeHeader from '../components/HomeHeader';
import { blurhash } from '../utills/common';

import { 
  addDoc, 
  collection, 
  doc, 
  onSnapshot, 
  orderBy, 
  query, 
  serverTimestamp, 
  setDoc, 
  updateDoc, 
  Timestamp,
  getDoc,
  increment,
  where,
  writeBatch,
  getDocs
} from 'firebase/firestore';
import { db, storage } from '../../firebase/firebaseConfig';
import { getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';

const REACTION_EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏'];
const EMOJI_LIST = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃', '😉', '😊', 
  '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙', '🥲', '😋', '😛', '😜', 
  '😝', '🤑', '🤗', '🤭', '🤫', '🤔', '🤐', '🤨', '😐', '😑', '😶', '😶‍🌫️', 
  '😏', '😒', '🙄', '😬', '😮‍💨', '🤥', '😌', '😔', '😪', '🤤', '😴', '😷', 
  '🤒', '🤕', '🤢', '🤮', '🤧', '🥵', '🥶', '🥴', '😵', '😵‍💫', '🤯', '🤠', 
  '🥳', '🥸', '😎', '🤓', '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', 
  '😳', '🥺', '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', 
  '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈', '👿', '💀', 
  '☠️', '💩', '🤡', '👹', '👺', '👻', '👽', '👾', '🤖', '😺', '😸', '😹', 
  '😻', '😼', '😽', '🙀', '😿', '😾', '💋', '👋', '🤚', '🖐️', '✋', '🖖', 
  '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', 
  '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', 
  '🤝', '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', 
  '👃', '🧠', '🫀', '🫁', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💋', '🩸',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', 
  '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️', '💯', '💢', '💥', '💫', 
  '💦', '💨', '🕳️', '💣', '💬', '🗯️', '💭', '💤', '👋', '🎉', '🎊'
];

const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function ChatRoom() {
  const router = useRouter();
  const routeParams = useLocalSearchParams();
  const item = { ...routeParams }; // Convert to regular object
  const { userData } = useAuth(); // Current logged-in user
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(true);
  const [userTyping, setUserTyping] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [reactionMessage, setReactionMessage] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [fileUploading, setFileUploading] = useState(false);
  const [showReactions, setShowReactions] = useState(false);

  const inputRef = useRef(null);
  const flatListRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  // Get room ID from user IDs
  const roomId = getRoomId(userData?.uid, item?.uid);

  // Fetch user profile once
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!item?.uid) return;
      
      try {
        const userDoc = await getDoc(doc(db, 'users', item.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };
    
    if (!userProfile) {
      fetchUserProfile();
    }
  }, [item?.uid]);

  // Entrance animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Create/update chat room and listen for messages
  useEffect(() => {
    if (!userData?.uid || !item?.uid) return;
    
    console.log('[Chat Debug] Creating/setting up chat room between users:', {
      currentUser: userData.uid,
      otherUser: item.uid
    });
    
    // Listen for messages in the users collection
    const userMessagesQuery = query(
      collection(db, 'users', userData.uid, 'chats', item.uid, 'messages'),
      orderBy('createdAt', 'asc')
    );
    
    console.log(`[Chat Debug] Setting up message listener for user: ${userData.uid} and chat with: ${item.uid}`);
    
    // Listen for messages from this chat
    const unsubscribe = onSnapshot(
      userMessagesQuery, 
      // Success handler
      (snapshot) => {
        console.log(`[Chat Debug] Received ${snapshot.docs.length} messages`);
        let allMessages = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('[Chat Debug] Message data:', {
            id: doc.id,
            text: data.text,
            senderId: data.senderId,
            receiverId: data.receiverId,
            timestamp: data.createdAt?.toDate?.() || 'No timestamp'
          });
          return {
            id: doc.id,
            ...data
          };
        });
        
        // Sort messages by timestamp
        allMessages.sort((a, b) => {
          const timeA = a.createdAt?.toDate?.() || a.createdAt || new Date(0);
          const timeB = b.createdAt?.toDate?.() || b.createdAt || new Date(0);
          return timeA - timeB;
        });
        
        console.log('[Chat Debug] Final messages count after processing:', allMessages.length);
        setMessages(allMessages);
        setLoading(false);
        
        // Mark messages as read
        markMessagesAsRead(snapshot.docs);
      },
      // Error handler
      (error) => {
        console.error('[Chat Debug] Error in messages snapshot:', error);
        setLoading(false);
        setMessages([]);
      }
    );
    
    // Listen for typing status
    const typingRef = doc(db, 'users', userData.uid, 'chats', item.uid, 'typingStatus', 'status');
    const typingUnsubscribe = onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        setUserTyping(doc.data().isTyping || false);
      }
    });

    // Auto-scroll on keyboard show
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', scrollToBottom);

    return () => {
      unsubscribe();
      typingUnsubscribe();
      keyboardDidShowListener.remove();
      
      // Clear typing status when leaving
      setTypingStatus(false);
    };
  }, [userData?.uid, item?.uid]);
  
  // Mark messages as read
  const markMessagesAsRead = async (messageDocs) => {
    if (!userData?.uid || !item?.uid) return;
    
    try {
      const batch = writeBatch(db);
      let hasUnread = false;
      
      // Update each unread message
      messageDocs.forEach(doc => {
        const message = doc.data();
        if (message.receiverId === userData.uid && !message.read) {
          hasUnread = true;
          batch.update(doc.ref, { read: true });
        }
      });
      
      // If there were unread messages, update the chat metadata too
      if (hasUnread) {
        const chatMetaRef = doc(db, 'users', userData.uid, 'chats', item.uid);
        batch.update(chatMetaRef, {
          lastRead: serverTimestamp()
        });
        
        await batch.commit();
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Scroll to bottom when new messages come in
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  // Update typing status
  const setTypingStatus = async (isTyping) => {
    if (!userData?.uid || !item?.uid) return;
    
    try {
      const typingRef = doc(db, 'users', userData.uid, 'chats', item.uid, 'typingStatus', 'status');
      await setDoc(typingRef, {
        isTyping,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  // Handle text input changes
  const handleTextChange = (value) => {
    setText(value);
    
    // Show typing indicator
    setTypingStatus(true);
    
    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set timeout to stop typing indicator after 1.5 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false);
    }, 1500);
  };

  // Scroll the chat to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      if (flatListRef.current && messages.length > 0) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 100);
  };

  // Pick and send an image
  const handleImagePick = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
      });
      
      if (!result.canceled && result.assets[0].uri) {
        await sendImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
    }
  };

  // Upload and send image message
  const sendImage = async (uri) => {
    if (!uri || !userData?.uid || !item?.uid) return;
    
    setImageUploading(true);
    
    try {
      // Create roomId for storage path
      const roomId = getRoomId(userData.uid, item.uid);
      
      // Convert image to blob
      const response = await fetch(uri);
      const blob = await response.blob();
      
      // Create storage reference
      const storageRef = ref(storage, `chat_images/${roomId}/${Date.now()}.jpg`);
      
      // Upload image
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Monitor upload
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking could be implemented here
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[Chat Debug] Upload is ${progress}% done`);
        },
        (error) => {
          console.error('[Chat Debug] Image upload error:', error);
          Alert.alert('Error', 'Failed to upload image. Please try again.');
          setImageUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[Chat Debug] Image uploaded successfully, URL:', downloadURL);
          
          // Send message with image
          await sendMessage({
            type: 'image',
            imageUrl: downloadURL,
            text: 'Sent an image'
          });
          
          setImageUploading(false);
        }
      );
    } catch (error) {
      console.error('[Chat Debug] Error sending image:', error);
      Alert.alert('Error', 'Failed to send image. Please try again.');
      setImageUploading(false);
    }
  };

  // Pick and share a document
  const handleDocumentPick = async () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false
      });
      
      if (result.canceled === false && result.assets && result.assets.length > 0) {
        await sendFile(result.assets[0]);
      }
    } catch (error) {
      console.error('[Chat Debug] Error picking document:', error);
      Alert.alert('Error', 'Failed to select file. Please try again.');
    } finally {
      setShowAttachmentOptions(false);
    }
  };
  
  // Upload and send file message
  const sendFile = async (file) => {
    if (!file || !userData?.uid || !item?.uid) return;
    
    setFileUploading(true);
    
    try {
      // Create roomId for storage path
      const roomId = getRoomId(userData.uid, item.uid);
      
      // Create a blob from the file
      const response = await fetch(file.uri);
      const blob = await response.blob();
      
      // Get file extension
      const fileExt = file.name.split('.').pop().toLowerCase() || 'file';
      
      // Create storage reference
      const storageRef = ref(storage, `chat_files/${roomId}/${Date.now()}.${fileExt}`);
      
      // Upload file
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // Monitor upload
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`[Chat Debug] File upload is ${progress}% done`);
        },
        (error) => {
          console.error('[Chat Debug] File upload error:', error);
          Alert.alert('Error', 'Failed to upload file. Please try again.');
          setFileUploading(false);
        },
        async () => {
          // Upload completed successfully
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          console.log('[Chat Debug] File uploaded successfully, URL:', downloadURL);
          
          // File type detection
          let fileType = 'document';
          if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
            fileType = 'image';
          } else if (['mp4', 'mov', 'avi', 'webm'].includes(fileExt)) {
            fileType = 'video';
          } else if (['mp3', 'wav', 'm4a', 'ogg'].includes(fileExt)) {
            fileType = 'audio';
          } else if (['pdf'].includes(fileExt)) {
            fileType = 'pdf';
          }
          
          // Send message with file
          await sendMessage({
            type: fileType,
            fileUrl: downloadURL,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.mimeType,
            text: `Sent a ${fileType === 'document' ? 'file' : fileType}`
          });
          
          setFileUploading(false);
        }
      );
    } catch (error) {
      console.error('[Chat Debug] Error sending file:', error);
      Alert.alert('Error', 'Failed to send file. Please try again.');
      setFileUploading(false);
    }
  };

  // Add emoji to text input
  const handleEmojiSelect = (emoji) => {
    setText(prevText => prevText + emoji);
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Add reaction to a message
  const addReaction = async (messageId, reaction) => {
    if (!userData?.uid || !messageId) return;
    
    try {
      // Update reaction in sender's messages collection
      const messageRef = doc(db, 'users', userData.uid, 'chats', item.uid, 'messages', messageId);
      await updateDoc(messageRef, {
        [`reactions.${userData.uid}`]: reaction
      });
      
      // Also update in recipient's collection
      const recipientMessageRef = doc(db, 'users', item.uid, 'chats', userData.uid, 'messages', messageId);
      await updateDoc(recipientMessageRef, {
        [`reactions.${userData.uid}`]: reaction
      });
      
      setShowReactions(false);
      setReactionMessage(null);
      
      // Give haptic feedback for reaction
      if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      
      console.log('[Chat Debug] Added reaction to message:', messageId);
    } catch (error) {
      console.error('[Chat Debug] Error adding reaction:', error);
      Alert.alert('Error', 'Failed to add reaction. Please try again.');
    }
  };

  // Send a message
  const sendMessage = async (additionalData = {}) => {
    if ((!text.trim() && !additionalData.type) || !userData?.uid || !item?.uid) return;
    
    try {
      // Clear input and reset typing status
      const messageText = text.trim();
      setText('');
      inputRef?.current?.clear();
      setTypingStatus(false);
      
      // Prepare message data
      const messageData = {
        text: additionalData.type ? (additionalData.type === 'image' ? 'Sent an image' : '') : messageText,
        senderId: userData.uid,
        senderName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        senderPhoto: userData.photoURL || null,
        receiverId: item.uid,
        receiverName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`,
        receiverPhoto: item.photoURL || null,
        createdAt: serverTimestamp(),
        read: false,
        type: additionalData.type || 'text',
        ...additionalData
      };
      
      console.log('[Chat Debug] Message data being sent:', {
        text: messageData.text,
        type: messageData.type,
        senderId: messageData.senderId,
        receiverId: messageData.receiverId,
      });
      
      // Batch write to ensure consistency
      const batch = writeBatch(db);
      
      // 1. Add message to sender's collection
      const senderMessageRef = doc(collection(db, 'users', userData.uid, 'chats', item.uid, 'messages'));
      batch.set(senderMessageRef, messageData);
      
      // 2. Add message to recipient's collection
      const recipientMessageRef = doc(collection(db, 'users', item.uid, 'chats', userData.uid, 'messages'));
      batch.set(recipientMessageRef, messageData);
      
      // 3. Update sender's chat metadata
      const senderChatRef = doc(db, 'users', userData.uid, 'chats', item.uid);
      batch.set(senderChatRef, {
        participantId: item.uid,
        participantName: item.fullName || `${item.firstName || ''} ${item.lastName || ''}`,
        participantPhoto: item.photoURL || null,
        lastMessage: {
          text: additionalData.type === 'image' ? 'Sent an image' : 
                additionalData.type === 'document' ? 'Sent a file' : messageText,
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        lastRead: serverTimestamp()
      }, { merge: true });
      
      // 4. Update recipient's chat metadata
      const recipientChatRef = doc(db, 'users', item.uid, 'chats', userData.uid);
      batch.set(recipientChatRef, {
        participantId: userData.uid,
        participantName: userData.fullName || `${userData.firstName || ''} ${userData.lastName || ''}`,
        participantPhoto: userData.photoURL || null,
        lastMessage: {
          text: additionalData.type === 'image' ? 'Sent an image' : 
                additionalData.type === 'document' ? 'Sent a file' : messageText,
          senderId: userData.uid,
          timestamp: serverTimestamp()
        },
        updatedAt: serverTimestamp(),
        unreadCount: increment(1)
      }, { merge: true });
      
      // Commit all changes
      await batch.commit();
      console.log('[Chat Debug] Message and metadata added successfully');
      
      // Manually add the message to the local state for immediate feedback
      const createdAt = new Date();
      const newMessage = {
        id: senderMessageRef.id,
        ...messageData,
        createdAt: {
          toDate: () => createdAt
        }
      };
      setMessages(prevMessages => [...prevMessages, newMessage]);
      
      // Give haptic feedback
      if (Platform.OS === 'ios') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('[Chat Debug] Error sending message:', error);
      Alert.alert('Message Error', 'Failed to send message. Please try again.');
    }
  };

  // Render message item
  const renderMessage = ({ item, index }) => {
    const isCurrentUser = userData?.uid === item.senderId;
    const showAvatar = !isCurrentUser && (index === 0 || messages[index - 1]?.senderId !== item.senderId);
    const messageDate = item.createdAt?.toDate();
    const messageTime = messageDate ? messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
    
    // Format file size
    const formatFileSize = (bytes) => {
      if (!bytes) return '';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / 1048576).toFixed(1) + ' MB';
    };
    
    // Check for date change to show date separator
    const showDateSeparator = () => {
      if (index === 0) return true;
      
      const currentDate = item.createdAt?.toDate();
      const prevDate = messages[index - 1]?.createdAt?.toDate();
      
      if (!currentDate || !prevDate) return false;
      
      return (
        currentDate.getDate() !== prevDate.getDate() ||
        currentDate.getMonth() !== prevDate.getMonth() ||
        currentDate.getFullYear() !== prevDate.getFullYear()
      );
    };
    
    // Render file content based on type
    const renderFileContent = () => {
      switch (item.type) {
        case 'image':
          return (
            <TouchableOpacity 
              activeOpacity={0.9}
              onPress={() => {
                // Implement image preview
              }}
            >
              <Image
                source={{ uri: item.imageUrl || item.fileUrl }}
                style={{ width: wp(50), height: wp(50) * 0.75, borderRadius: 12 }}
                placeholder={blurhash}
                contentFit="cover"
                transition={300}
              />
            </TouchableOpacity>
          );
        case 'pdf':
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                // Open PDF viewer
              }}
              className="flex-row items-center p-2 bg-white rounded-xl border border-gray-200"
            >
              <View className="bg-red-50 p-2 rounded-lg">
                <FontAwesome5 name="file-pdf" size={24} color="#ef4444" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                  {item.fileName || 'PDF Document'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatFileSize(item.fileSize)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        case 'document':
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                // Open document
              }}
              className="flex-row items-center p-2 bg-white rounded-xl border border-gray-200"
            >
              <View className="bg-blue-50 p-2 rounded-lg">
                <FontAwesome5 name="file-alt" size={24} color="#3b82f6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                  {item.fileName || 'Document'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatFileSize(item.fileSize)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        case 'audio':
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                // Play audio
              }}
              className="flex-row items-center p-2 bg-white rounded-xl border border-gray-200"
            >
              <View className="bg-purple-50 p-2 rounded-lg">
                <FontAwesome5 name="file-audio" size={24} color="#8b5cf6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                  {item.fileName || 'Audio'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatFileSize(item.fileSize)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        case 'video':
          return (
            <TouchableOpacity 
              activeOpacity={0.8}
              onPress={() => {
                // Play video
              }}
              className="flex-row items-center p-2 bg-white rounded-xl border border-gray-200"
            >
              <View className="bg-green-50 p-2 rounded-lg">
                <FontAwesome5 name="file-video" size={24} color="#10b981" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-sm font-medium text-gray-800" numberOfLines={1}>
                  {item.fileName || 'Video'}
                </Text>
                <Text className="text-xs text-gray-500">
                  {formatFileSize(item.fileSize)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        default:
          return (
            <Text 
              className={`${isCurrentUser ? 'text-blue-800' : 'text-gray-800'} text-base`}
            >
              {item.text}
            </Text>
          );
    }
  };

  return (
    <>
        {showDateSeparator() && (
          <View className="items-center my-4">
            <Text className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
              {messageDate ? messageDate.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' }) : ''}
            </Text>
          </View>
        )}
        
        <View 
          className={`flex-row mb-3 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
        >
          {/* Other user's avatar */}
          {!isCurrentUser && showAvatar ? (
            <TouchableOpacity 
              className="mr-2 items-end self-end"
              onPress={() => {
                // Handle view profile action
              }}
            >
              <Image
                source={!item.senderPhoto ? DEFAULT_PROFILE_IMAGE : { uri: item.senderPhoto }}
                style={{ height: hp(4), width: hp(4), borderRadius: 100 }}
                placeholder={blurhash}
                className="bg-gray-200"
              />
                        </TouchableOpacity>
          ) : (
            !isCurrentUser && <View style={{ width: hp(4) + 8 }} />
          )}
          
          <View className="max-w-[75%]">
            {/* Long press to react to message */}
            <Pressable
              onLongPress={() => {
                if (Platform.OS === 'ios') {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                setReactionMessage(item);
                setShowReactions(true);
              }}
              delayLongPress={200}
            >
              {/* Message Bubble */}
              <View
                className={`p-3 px-4 rounded-2xl ${
                  isCurrentUser 
                    ? 'bg-blue-50 border border-blue-100 rounded-tr-none' 
                    : 'bg-gray-50 border border-gray-100 rounded-tl-none'
                }`}
              >
                {renderFileContent()}
                
                {/* Message Time */}
                <Text 
                  className={`text-xs mt-1 ${isCurrentUser ? 'text-blue-400' : 'text-gray-500'}`}
                >
                  {messageTime}
                </Text>
              </View>
            </Pressable>
            
            {/* Reactions display */}
            {item.reactions && Object.keys(item.reactions).length > 0 && (
              <View 
                className={`flex-row mt-1 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                {Object.entries(item.reactions).map(([uid, reaction]) => (
                  <View key={uid} className="bg-white rounded-full shadow-sm border border-gray-100 px-1.5 py-0.5 mr-1">
                    <Text>{reaction}</Text>
                    </View>
                ))}
                </View>
            )}
            </View>
        </View>
      </>
  );
};

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-100">
        <StatusBar style="dark" backgroundColor="#f3f4f6" translucent={true} />
        
        {/* Chat Header */}
        <View className="flex-row items-center border-b border-gray-200 px-4 py-2 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-2">
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          
          <Image
            source={
              !userProfile?.photoURL 
                ? DEFAULT_PROFILE_IMAGE 
                : { uri: userProfile.photoURL }
            }
            style={{ height: hp(5), width: hp(5), borderRadius: 100 }}
            placeholder={blurhash}
            className="bg-gray-200"
          />
          
          <View className="ml-3 flex-1">
            <Text className="font-semibold text-gray-900">
              {userProfile?.fullName || item?.fullName || 'Chat'}
            </Text>
            <Text className="text-xs text-gray-500">
              Loading messages...
            </Text>
          </View>
        </View>
        
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4f46e5" />
          <Text className="text-gray-600 mt-4 font-medium">Loading your conversation</Text>
          <Text className="text-gray-400 text-xs mt-2">Please wait while we fetch your messages</Text>
          <Text className="text-xs text-blue-500 mt-4">Creating required database indexes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-100">
      <StatusBar style="dark" backgroundColor="#f3f4f6" translucent={true} />
      
      {/* Chat Header */}
      <View className="flex-row items-center border-b border-gray-200 px-4 py-2 bg-white">
        <TouchableOpacity onPress={() => router.back()} className="mr-2">
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        
        <Image
          source={
            !userProfile?.photoURL 
              ? DEFAULT_PROFILE_IMAGE 
              : { uri: userProfile.photoURL }
          }
          style={{ height: hp(5), width: hp(5), borderRadius: 100 }}
          placeholder={blurhash}
          className="bg-gray-200"
        />
        
        <View className="ml-3 flex-1">
          <Text className="font-semibold text-gray-900">
            {userProfile?.fullName || item?.fullName || 'Chat'}
          </Text>
          <Text className="text-xs text-gray-500">
            {userTyping ? 'Typing...' : userProfile?.status || ''}
          </Text>
        </View>
        
        <TouchableOpacity className="ml-2 p-2">
          <Ionicons name="call" size={22} color="#4f46e5" />
        </TouchableOpacity>
      </View>
      
      {/* Messages Container */}
      <Animated.View 
        className="flex-1"
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        {messages.length === 0 ? (
          <View className="flex-1 justify-center items-center p-4">
            <MaterialIcons name="forum" size={60} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-lg">No messages yet</Text>
            <Text className="text-gray-400 text-sm text-center mt-2">
              Say hello to start the conversation!
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 8 }}
          />
        )}
      </Animated.View>
      
      {/* Input Area */}
      <View className="border-t border-gray-200 px-3 py-2 bg-white">
        <View className="flex-row items-center">
          <TouchableOpacity 
            className="p-2 mr-1"
            onPress={() => setShowAttachmentOptions(true)}
            disabled={imageUploading || fileUploading}
          >
            <Feather name="paperclip" size={22} color={imageUploading || fileUploading ? "#9ca3af" : "#4f46e5"} />
          </TouchableOpacity>
          
          <View className="flex-1 bg-gray-50 rounded-full px-3 py-1 mr-2 flex-row items-center border border-gray-200">
            <TextInput
              ref={inputRef}
              className="flex-1 py-1.5"
              placeholder="Type a message..."
              value={text}
              onChangeText={handleTextChange}
              multiline
              maxHeight={100}
            />
            
            <TouchableOpacity 
              className="p-1"
              onPress={() => setShowEmojiPicker(!showEmojiPicker)}
            >
              <Feather name={showEmojiPicker ? "keyboard" : "smile"} size={22} color="#4f46e5" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity
            className={`p-2 rounded-full ${text.trim() ? 'bg-blue-500' : 'bg-gray-200'}`}
            onPress={() => sendMessage()}
            disabled={!text.trim() || imageUploading || fileUploading}
          >
            <Feather name="send" size={20} color={text.trim() ? "white" : "#9ca3af"} />
          </TouchableOpacity>
        </View>
        
        {(imageUploading || fileUploading) && (
          <View className="flex-row items-center justify-center py-1">
            <ActivityIndicator size="small" color="#4f46e5" />
            <Text className="text-xs text-gray-600 ml-2">
              {imageUploading ? 'Uploading image...' : 'Uploading file...'}
            </Text>
          </View>
        )}
        
        {/* Custom Emoji Keyboard */}
        {showEmojiPicker && (
          <View className="h-48 bg-white border-t border-gray-200 pt-2">
            <ScrollView className="flex-1 px-2">
              <View className="flex-row flex-wrap justify-center">
                {EMOJI_LIST.map((emoji, index) => (
                  <TouchableOpacity 
                    key={index} 
                    className="p-2"
                    onPress={() => handleEmojiSelect(emoji)}
                  >
                    <Text style={{ fontSize: 24 }}>{emoji}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
      </View>
      
      {/* Attachment Options Modal */}
      <Modal
        visible={showAttachmentOptions}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowAttachmentOptions(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={() => setShowAttachmentOptions(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-6">
              <View className="w-12 h-1 bg-gray-300 rounded-full self-center mb-6" />
              
              <Text className="text-lg font-semibold text-gray-700 mb-4">Share Content</Text>
              
              <View className="flex-row flex-wrap justify-around">
                <TouchableOpacity 
                  className="items-center m-2 w-20"
                  onPress={handleImagePick}
                >
                  <View className="bg-blue-100 p-4 rounded-full mb-2">
                    <Feather name="image" size={24} color="#3b82f6" />
                  </View>
                  <Text className="text-sm text-gray-700">Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="items-center m-2 w-20"
                  onPress={handleDocumentPick}
                >
                  <View className="bg-purple-100 p-4 rounded-full mb-2">
                    <Feather name="file-text" size={24} color="#8b5cf6" />
                  </View>
                  <Text className="text-sm text-gray-700">Document</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="items-center m-2 w-20"
                  onPress={() => {
                    // Handle camera
                    setShowAttachmentOptions(false);
                  }}
                >
                  <View className="bg-green-100 p-4 rounded-full mb-2">
                    <Feather name="camera" size={24} color="#10b981" />
                  </View>
                  <Text className="text-sm text-gray-700">Camera</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  className="items-center m-2 w-20"
                  onPress={() => {
                    // Handle contact
                    setShowAttachmentOptions(false);
                  }}
                >
                  <View className="bg-yellow-100 p-4 rounded-full mb-2">
                    <Feather name="user" size={24} color="#f59e0b" />
                  </View>
                  <Text className="text-sm text-gray-700">Contact</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                className="bg-gray-100 py-3 rounded-full mt-6"
                onPress={() => setShowAttachmentOptions(false)}
              >
                <Text className="text-center text-gray-700 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
      
      {/* Emoji Reaction Picker */}
      <Modal
        visible={showReactions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowReactions(false);
          setReactionMessage(null);
        }}
      >
        <Pressable 
          className="flex-1 bg-black/30 justify-center items-center"
          onPress={() => {
            setShowReactions(false);
            setReactionMessage(null);
          }}
        >
          <Pressable className="bg-white py-4 px-6 rounded-xl">
            <Text className="text-center text-gray-700 mb-3">Add reaction</Text>
            <View className="flex-row justify-center">
              {REACTION_EMOJIS.map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    addReaction(reactionMessage?.id, emoji);
                    setShowReactions(false);
                  }}
                  className="p-2 mx-1"
                >
                  <Text className="text-2xl">{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}