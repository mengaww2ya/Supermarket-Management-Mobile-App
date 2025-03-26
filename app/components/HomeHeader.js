import { View, Text, Platform, Modal, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from 'app/context/authContext';
import { auth } from '../../firebase/firebaseConfig';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

const isIOS = Platform.OS === 'ios';
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function HomeHeader({ title }) {
  const { user, Logout } = useAuth(auth);
  const { top } = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleProfile = () => {
    setModalVisible(false);
    router.push('/customer/EditProfile');
  };

  const handleLogout = async () => {
    setModalVisible(false);
    await Logout();
  };

  return (
    <>
      <View
        style={{ paddingTop: isIOS ? top : top + 10 }}
        className="flex-row justify-between px-5 bg-indigo-400 rounded-br-3xl shadow"
      >
        <Text className="font-medium text-white text-lg">{title}</Text>

        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Image
            style={{ height: hp(4.3), aspectRatio: 1, borderRadius: 100 }}
            source={imageError || !user?.profileUrl ? DEFAULT_PROFILE_IMAGE : { uri: user?.profileUrl }}
            placeholder={blurhash}
            transition={500}
            onError={() => setImageError(true)}
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 justify-end">
          <View className="bg-white rounded-t-3xl p-4">
            <View className="items-center mb-4">
              <Image
                style={{ height: hp(6), aspectRatio: 1, borderRadius: 100 }}
                source={imageError || !user?.profileUrl ? DEFAULT_PROFILE_IMAGE : { uri: user?.profileUrl }}
                placeholder={blurhash}
                transition={500}
                onError={() => setImageError(true)}
              />
              <Text className="text-lg font-semibold mt-2">{user?.fullName}</Text>
              <Text className="text-gray-500">{user?.email}</Text>
            </View>

            <TouchableOpacity 
              onPress={handleProfile}
              className="flex-row items-center p-4 border-b border-gray-200"
            >
              <Feather name="user" size={24} color="#737373" />
              <Text className="ml-3 text-lg">Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={handleLogout}
              className="flex-row items-center p-4"
            >
              <AntDesign name="logout" size={24} color="#737373" />
              <Text className="ml-3 text-lg">Logout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}