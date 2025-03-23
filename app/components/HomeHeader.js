import { View, Text, Platform } from 'react-native';
import React from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from 'app/context/authContext';
import { auth } from '../../firebase/firebaseConfig';

import {
  Menu,
  MenuOptions,
  MenuTrigger,
  MenuOption,
} from 'react-native-popup-menu';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

const isIOS = Platform.OS === 'ios';

export default function HomeHeader({ title }) {
  const { user, Logout } = useAuth(auth);
  const { top } = useSafeAreaInsets();

  const handleProfile = () => {
    router.push('/customer/EditProfile');
  };

  const handleLogout = async () => {
    await Logout();
  };

  return (
    <View
      style={{ paddingTop: isIOS ? top : top + 10 }}
      className="flex-row justify-between px-5 bg-indigo-400 rounded-br-3xl shadow"
    >
      <Text className="font-medium text-white text-lg">{title}</Text>

      <Menu>
        <MenuTrigger>
          <Image
            style={{ height: hp(4.3), aspectRatio: 1, borderRadius: 100 }}
            source={{ uri: user?.profileUrl } || require('../../assets/images/PrifileDemo.png')}
            placeholder={{ blurhash }}
            transition={500}
          />
        </MenuTrigger>
        <MenuOptions className="bg-white rounded-lg shadow-md p-2">
          <MenuOption onSelect={handleProfile}>
            <View className="px-4 py-2 flex-row justify-between items-center">
              <Text style={{ fontSize: hp(1.7) }} className="font-semibold text-neutral-600">
                Profile
              </Text>
              <Feather name="user" size={hp(2.5)} color="#737373" />
            </View>
          </MenuOption>
          <MenuOption onSelect={handleLogout}>
            <View className="px-4 py-2 flex-row justify-between items-center">
              <Text style={{ fontSize: hp(1.7) }} className="font-semibold text-neutral-600">
                Logout
              </Text>
              <AntDesign name="logout" size={hp(2.5)} color="#737373" />
            </View>
          </MenuOption>
        </MenuOptions>
      </Menu>
    </View>
  );
}