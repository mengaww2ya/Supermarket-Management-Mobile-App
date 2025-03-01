import { View, Text, TouchableOpacity } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context'

const employeeDetail = () => {
  return (
    <SafeAreaView className='flex-1 justify-center items-center  '>
          <View className='gap-2 '>
            <Text className='text-gray-600 text-2xl font-bold'>
                       Employee Detail
                  </Text>  
              <Text className='text-gray-700 font-bold m-2'>
                  Name:
                  <Text className='text-gray-600'>
                      {" "} John duo
                  </Text>
              </Text>
                <Text className='text-gray-700 font-bold m-2'>
                  Phone Number:
                  <Text className='text-gray-600'>
                      {" "} 4674560569
                  </Text>
              </Text>
               <Text className='text-gray-700 font-bold m-2'>
                  Employee Role:
                  <Text className='text-gray-600'>
                      {" "} stock_manager
                  </Text>
              </Text>
               
              <Text className='text-gray-700 font-bold m-2 text-lg'>
                  Emergency Contact:
              </Text>
              <Text className='text-gray-700 font-bold m-2'>
                  Contact Name:
                  <Text className='text-gray-600'>
                      {" "} John duo
                  </Text>
              </Text>
               <Text className='text-gray-700 font-bold m-2'>
                  Contact Phone:
                  <Text className='text-gray-600'>
                      {" "}58976796
                  </Text>
              </Text>
              <View className='justify-between gap-3 flex-row'>
                  <TouchableOpacity className='bg-pink-400 px-5  py-2 rounded-md'>
                      <Text className='text-center font-bold '>
                          update
                      </Text>
        
                  </TouchableOpacity>
                   <TouchableOpacity className='bg-red-500 px-5 py-2 rounded-md'>
                      <Text className='text-center font-bold '>
                          Delete
                      </Text>
        
                  </TouchableOpacity>
                   <TouchableOpacity className='bg-gray-500 px-5 py-2 rounded-md'>
                      <Text className='text-center font-bold '>
                          exit
                      </Text>
        
                  </TouchableOpacity>
                  
              </View>
          </View>
    </SafeAreaView>
  )
}

export default employeeDetail