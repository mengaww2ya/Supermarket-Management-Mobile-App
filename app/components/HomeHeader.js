import { View, Text, Platform } from 'react-native';
import React from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from 'app/context/authContext';
import { auth } from '../../firebase/firebaseConfig'
import {
  Menu,
  MenuOptions,
  MenuTrigger,
} from 'react-native-popup-menu';
import MenuItem from './CustomMenuItems';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';
import { MenuProvider } from 'react-native-popup-menu';

const isIOS = Platform.OS === 'ios';

export default function HomeHeader({title}) {  
  const { user, Logout } = useAuth(auth);
  const { top } = useSafeAreaInsets();

  const handleProfile = () => {
    router.push('/customer/EditProfile')
  };

  const handleLogout = async () => {
    await Logout();
  }

  // Get user's display name or email as fallback
  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';

  return (
    <MenuProvider>
      <View
        style={{ 
          paddingTop: isIOS ? top : top + 10,
          position: 'relative'
        }}
        className="flex-row items-center justify-between px-5 py-4 bg-indigo-400 rounded-br-3xl shadow"
      >
        {/* Title aligned to the left */}
        <Text className="font-medium text-white text-lg">{title}</Text>

        {/* Profile Picture & Menu */}
        <View style={{
          position: 'absolute',
          top: isIOS ? top : top + 10,
          right: 15,
          zIndex: 1000
        }}>
          <Menu>
            <MenuTrigger>
              <Image
                style={{ 
                  height: hp(4.3), 
                  width: hp(4.3),
                  borderRadius: hp(2.15),
                  borderWidth: 2,
                  borderColor: 'white'
                }}
                source={{ uri: user?.profileUrl } || require('../../assets/images/PrifileDemo.png')}
                placeholder={{ blurhash }}
                transition={500}
              />
            </MenuTrigger>
            <MenuOptions
              customStyles={{
                optionsContainer: {
                  marginTop: 10,
                  alignSelf: 'flex-end',
                  borderRadius: 10,
                  backgroundColor: 'white',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 2,
                  },
                  shadowOpacity: 0.25,
                  shadowRadius: 3.84,
                  elevation: 5,
                  padding: 8,
                  minWidth: 180,
                  zIndex: 1001,
                },
                optionWrapper: {
                  padding: 12,
                  borderBottomWidth: 1,
                  borderBottomColor: '#f0f0f0',
                },
                optionTouchable: {
                  padding: 12,
                },
              }}
            >
              <MenuItem
                text={displayName}
                action={handleProfile}
                icon={<Feather name="user" size={hp(2.5)} color="#737373" />}
              />
              <MenuItem
                text="Logout"
                action={handleLogout}
                icon={<AntDesign name="logout" size={hp(2.5)} color="#737373" />}
              />
            </MenuOptions>
          </Menu>
        </View>
      </View>
    </MenuProvider>
  );
};

