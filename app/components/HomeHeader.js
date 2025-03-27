import { View, Text, Platform } from 'react-native';
import React from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from 'app/context/authContext';
import { Menu, MenuOptions, MenuTrigger, MenuOption } from 'react-native-popup-menu';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';
import { heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { MenuProvider } from 'react-native-popup-menu';
const isIOS = Platform.OS === 'ios';
const DEFAULT_PROFILE_IMAGE = require('../../assets/images/PrifileDemo.png');

export default function HomeHeader({ title }) {
  const { user, Logout } = useAuth();
  const { top } = useSafeAreaInsets();

  const handleProfile = () => router.push('/customer/EditProfile');
  const handleLogout = async () => await Logout();

  return (
    <View
      className="relative flex-row items-center justify-between px-5 bg-indigo-400 rounded-br-3xl shadow"
      style={{ paddingTop: isIOS ? top : top + 10 }}
    >
      {/* Title aligned to the left */}
      <Text className="font-medium text-white text-lg">{title}</Text>

      {/* Profile Picture & Menu aligned to the top-right */}
      <View style={{ position: 'absolute', top: isIOS ? top : top + 10, right: 15 }}>
        <MenuProvider>
          <Menu>
            <MenuTrigger>
              <Image
                className="h-10 w-10 rounded-full"
                source={user?.profileUrl ? { uri: user.profileUrl } : DEFAULT_PROFILE_IMAGE}
                placeholder={blurhash}
                transition={500}
              />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  padding: 5,
                  borderRadius: 10,
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                  elevation: 5,
                },
              }}
            >
              <MenuOption onSelect={handleProfile}>
                <View className="flex-row justify-between items-center p-3">
                  <Text className="font-semibold text-neutral-600 text-base">Profile</Text>
                  <Feather name="user" size={hp(2.5)} color="#737373" />
                </View>
              </MenuOption>
              <MenuOption onSelect={handleLogout}>
                <View className="flex-row justify-between items-center p-3">
                  <Text className="font-semibold text-neutral-600 text-base">Logout</Text>
                  <AntDesign name="logout" size={hp(2.5)} color="#737373" />
                </View>
              </MenuOption>
            </MenuOptions>
          </Menu>
        </MenuProvider>
      </View>
    </View>
  );
}