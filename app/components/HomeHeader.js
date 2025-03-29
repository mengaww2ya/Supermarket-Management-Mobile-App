import { View, Text, TouchableOpacity, Modal } from 'react-native';
import React, { useState } from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from 'app/context/authContext';
// import { auth } from '../../firebase/firebaseConfig';
import { Feather } from '@expo/vector-icons';
import AntDesign from '@expo/vector-icons/AntDesign';
import { router } from 'expo-router';

export default function HomeHeader({ title }) {  
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const handleProfile = () => {
    setShowMenu(false);
    router.push('/common/EditProfile');
  };

  const handleLogout = async () => {
    try {
      await signOut();
      setShowMenu(false);
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const ProfileImgPlaceholder = require('../../assets/images/PrifileDemo.png');

  return (
    <View className="bg-indigo-600 rounded-br-3xl shadow">
      <View className="flex-row items-center justify-between px-5 py-4">
        {/* Title */}
        <Text className="font-medium text-white text-lg w-full text-center">{title}</Text>

        {/* Profile Picture & Menu */}
        <View style={{
          position: 'absolute',
          right: 15,
        }}>
          <TouchableOpacity 
            onPress={() => setShowMenu(true)}
            className="active:opacity-80"
          >
            <Image
              style={{ 
                height: hp(4.3), 
                width: hp(4.3),
                borderRadius: hp(2.15),
                borderWidth: 2,
                borderColor: 'white'
              }}
              source={{ uri: user?.profileUrl } || ProfileImgPlaceholder}
              placeholder={blurhash}
              transition={500}
            />
          </TouchableOpacity>

          {/* Menu Modal */}
          <Modal
            visible={showMenu}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setShowMenu(false)}
          >
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
              activeOpacity={1}
              onPress={() => setShowMenu(false)}
            >
              <View style={{
                position: 'absolute',
                top: hp(8),
                right: 15,
                backgroundColor: 'white',
                borderRadius: 15,
                padding: 15,
                minWidth: 200,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 5,
                elevation: 8,
              }}>
                {/* User Info Section */}
                <View className="flex-row items-center pb-4 border-b border-gray-200 mb-2">
                  <Image
                    style={{ 
                      height: hp(4.5), 
                      width: hp(4.5),
                      borderRadius: hp(2.25),
                      borderWidth: 2,
                      borderColor: '#4F46E5'
                    }}
                    source={{ uri: user?.profileUrl } || ProfileImgPlaceholder}
                    placeholder={blurhash}
                    transition={500}
                  />
                  <View className="ml-3">
                    <Text className="font-bold text-lg text-gray-800">{displayName}</Text>
                    <Text className="text-sm text-gray-500">{user?.email}</Text>
                  </View>
                </View>

                {/* Menu Items */}
                <TouchableOpacity 
                  className="flex-row items-center py-3 px-2 rounded-lg active:bg-gray-100"
                  onPress={handleProfile}
                >
                  <View className="w-8 h-8 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Feather name="user" size={hp(2.2)} color="#4F46E5" />
                  </View>
                  <Text className="font-semibold text-gray-700">Profile</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  className="flex-row items-center py-3 px-2 rounded-lg active:bg-gray-100"
                  onPress={handleLogout}
                >
                  <View className="w-8 h-8 rounded-full bg-red-100 items-center justify-center mr-3">
                    <AntDesign name="logout" size={hp(2.2)} color="#EF4444" />
                  </View>
                  <Text className="font-semibold text-gray-700">Logout</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </View>
  );
}
