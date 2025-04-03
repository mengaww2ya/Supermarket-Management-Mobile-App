import React, { useRef } from 'react';
import { View, TouchableOpacity, Text, Dimensions, Platform, Animated } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  // Tab indicator animation
  const tabIndicatorAnim = useRef(new Animated.Value(0)).current;
  
  // Scale animations for each tab
  const scaleAnim = useRef({
    home: new Animated.Value(1),
    chat: new Animated.Value(1),
    support: new Animated.Value(1)
  }).current;
  
  // Animation for the tab indicator
  const animateTabIndicator = (index) => {
    Animated.spring(tabIndicatorAnim, {
      toValue: index,
      useNativeDriver: true,
      friction: 8,
      tension: 50
    }).start();
  };
  
  // Animation for tab press
  const handleTabPress = (tab) => {
    // Reset all tabs to normal scale
    Animated.parallel([
      Animated.spring(scaleAnim.home, { toValue: 1, useNativeDriver: true }),
      Animated.spring(scaleAnim.chat, { toValue: 1, useNativeDriver: true }),
      Animated.spring(scaleAnim.support, { toValue: 1, useNativeDriver: true })
    ]).start();
    
    // Animate the pressed tab
    Animated.sequence([
      Animated.timing(scaleAnim[tab], {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.spring(scaleAnim[tab], {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true
      })
    ]).start();
  };
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: Platform.OS === 'ios' ? 80 + insets.bottom : 60,
          borderTopWidth: 0,
          elevation: 0,
          backgroundColor: 'white',
          borderTopLeftRadius: 0,
          borderTopRightRadius: 0,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="homePage"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => {
            if (focused) animateTabIndicator(0);
            return (
              <Animated.View style={{ transform: [{ scale: scaleAnim.home }] }}>
                <TouchableOpacity 
                  className="items-center justify-center h-[60px] flex-1"
                  onPress={() => handleTabPress('home')}
                  activeOpacity={0.7}
                >
                  <View className="items-center justify-center">
                    <Ionicons
                      name={focused ? "home" : "home-outline"}
                      size={24}
                      color={focused ? "#3b82f6" : "#64748b"}
                    />
                    {focused && <Text className="text-[10px] font-medium text-blue-500 mt-[2px]">Home</Text>}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          },
        }}
      />
      
      <Tabs.Screen
        name="dummy1"
        options={{
          title: 'Chats',
          tabBarIcon: ({ focused }) => {
            if (focused) animateTabIndicator(1);
            return (
              <Animated.View style={{ transform: [{ scale: scaleAnim.chat }] }}>
                <TouchableOpacity 
                  className="items-center justify-center h-[60px] flex-1"
                  onPress={() => handleTabPress('chat')}
                  activeOpacity={0.7}
                >
                  <View className="items-center justify-center">
                    <Ionicons
                      name={focused ? "chatbubbles" : "chatbubbles-outline"}
                      size={24}
                      color={focused ? "#3b82f6" : "#64748b"}
                    />
                    {focused && <Text className="text-[10px] font-medium text-blue-500 mt-[2px]">Chats</Text>}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          }
        }}
      />
      
      <Tabs.Screen
        name="dummy2"
        options={{
          title: 'Support',
          tabBarIcon: ({ focused }) => {
            if (focused) animateTabIndicator(2);
            return (
              <Animated.View style={{ transform: [{ scale: scaleAnim.support }] }}>
                <TouchableOpacity 
                  className="items-center justify-center h-[60px] flex-1"
                  onPress={() => handleTabPress('support')}
                  activeOpacity={0.7}
                >
                  <View className="items-center justify-center">
                    <Ionicons
                      name={focused ? "headset" : "headset-outline"}
                      size={24}
                      color={focused ? "#3b82f6" : "#64748b"}
                    />
                    {focused && <Text className="text-[10px] font-medium text-blue-500 mt-[2px]">Support</Text>}
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          },
        }}
      />
      
      {/* Animated Tab Indicator */}
      <Animated.View
        className="absolute w-[20px] h-[3px] rounded-[1.5px] bg-blue-500 self-center"
        style={{
          bottom: Platform.OS === 'ios' ? insets.bottom + 10 : 10,
          transform: [
            {
              translateX: tabIndicatorAnim.interpolate({
                inputRange: [0, 1, 2],
                outputRange: [0, 0, 0], // Center point of each tab (no translation needed)
              }),
            },
          ],
          left: tabIndicatorAnim.interpolate({
            inputRange: [0, 1, 2],
            outputRange: [width / 6 - 10, width / 2 - 10, (width * 5) / 6 - 10],
          }),
        }}
      />
    </Tabs>
  );
}
