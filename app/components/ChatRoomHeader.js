import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { Stack } from 'expo-router'
import Entypo from '@expo/vector-icons/Entypo';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { blurhash } from '../utills/common';

export default function ChatRoomHeader({user,router}) {
  return (
<View className=' justify-between  flex-row  bg-indigo-200 rounded-br-3xl shadow' >        
                  <View className="flex-row ">
                      <TouchableOpacity onPress={()=>router.back()}>
                          <Entypo name="chevron-left" size={hp(4)} color="#737373" />
                      </TouchableOpacity>
                      <View className="flex-row ">
                          <Image
                              source={user?.photoURL||require('../../assets/images/PrifileDemo.png')}
                              style={{ height: hp(4.5), aspectRatio: 1, borderRadius: 100 }}
                              placeholder={blurhash}
                              transition={500}
                          />
                      </View>
                      <Text style={{fontSize:hp(2.5)}} className="text-neutral-700 font-medium"> {user?.fullName}</Text>
                  </View>
            
             
                  <View className="flex-row  justify-between gap-5"  >
                      <Ionicons name="call" size={hp(2.8)} color={'#737373'} />
                      <Ionicons name="videocam" size={hp(2.8) } color={'#737373'}/>

                  </View>

       

    </View>  
  )
}