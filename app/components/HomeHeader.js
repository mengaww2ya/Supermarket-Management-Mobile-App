import { View, Text, TouchableOpacity, Modal, Animated, Dimensions, Platform, Vibration, StyleSheet, StatusBar as RNStatusBar } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { Image } from 'expo-image';
import { blurhash } from '../utills/common';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAuth } from 'app/context/authContext';
import { Feather, Ionicons, MaterialIcons, FontAwesome5, AntDesign, Entypo, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');

export default function HomeHeader({ title, showBackButton = false, onBackPress, rightIcon }) {  
  const { user, signOut } = useAuth();
  const [showMenu, setShowMenu] = useState(false);
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-10)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const menuScaleAnim = useRef(new Animated.Value(0)).current;
  const menuFadeAnim = useRef(new Animated.Value(0)).current;
  const profileImageAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  
  // Animation for decorative elements
  const bubbleAnim1 = useRef(new Animated.Value(1)).current;
  const bubbleAnim2 = useRef(new Animated.Value(1)).current;
  const bubbleAnim3 = useRef(new Animated.Value(1)).current;
  const particleAnim1 = useRef(new Animated.Value(0)).current;
  const particleAnim2 = useRef(new Animated.Value(0)).current;
  const particleAnim3 = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  
  // Add title animation
  const titleAnim = useRef(new Animated.Value(0)).current;
  const underlineWidth = useRef(new Animated.Value(0)).current;
  
  // Start animations on component mount
  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(underlineWidth, {
        toValue: 1,
        duration: 800,
        delay: 300,
        useNativeDriver: false,
      })
    ]).start();
    
    // Start bubble animations
    animateBubbles();
    // Start particle animations
    animateParticles();
    // Start glow animation
    animateGlow();
  }, []);
  
  // Animate decorative bubbles
  const animateBubbles = () => {
    // Create a looping animation for the bubbles
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(bubbleAnim1, {
            toValue: 1.15,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim2, {
            toValue: 0.85,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim3, {
            toValue: 1.1,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(bubbleAnim1, {
            toValue: 0.9,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim2, {
            toValue: 1.1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(bubbleAnim3, {
            toValue: 0.95,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 10000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  };
  
  // Animate floating particles
  const animateParticles = () => {
    // Reset positions
    particleAnim1.setValue(0);
    particleAnim2.setValue(0);
    particleAnim3.setValue(0);
    
    // Create staggered animations for particles
    Animated.stagger(300, [
      Animated.timing(particleAnim1, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      }),
      Animated.timing(particleAnim2, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(particleAnim3, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Repeat animation
      animateParticles();
    });
  };
  
  // Animate glow effect
  const animateGlow = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };
  
  // Handle profile button press
  const handleProfilePress = () => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(20);
      }
    } else {
      Vibration.vibrate(20);
    }
    
    // Animate profile image
    Animated.sequence([
      Animated.timing(profileImageAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(profileImageAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      })
    ]).start();
    
    // Show menu
    setShowMenu(true);
    
    // Animate menu entrance
    Animated.parallel([
      Animated.timing(menuScaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(menuFadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
  };
  
  // Handle closing the menu
  const handleCloseMenu = () => {
    // Animate menu exit
    Animated.parallel([
      Animated.timing(menuScaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(menuFadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start(() => {
      setShowMenu(false);
    });
  };
  
  // Handle profile navigation
  const handleProfile = () => {
    handleCloseMenu();
    router.push('/common/EditProfile');
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      // Provide haptic feedback
      if (Platform.OS === 'ios') {
        try {
          const Haptics = require('expo-haptics');
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        } catch (e) {
          Vibration.vibrate(100);
        }
      } else {
        Vibration.vibrate(100);
      }
      
      await signOut();
      handleCloseMenu();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  // Handle back button press
  const handleBack = () => {
    // Provide haptic feedback
    if (Platform.OS === 'ios') {
      try {
        const Haptics = require('expo-haptics');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        Vibration.vibrate(15);
      }
    } else {
      Vibration.vibrate(15);
    }
    
    if (onBackPress) {
      onBackPress();
    } else {
      router.back();
    }
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'User';
  const ProfileImgPlaceholder = require('../../assets/images/PrifileDemo.png');

  // Interpolate rotation for the rotating bubble
  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <>
      <StatusBar style="light" />
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [
            { translateY },
            { scale: scaleAnim }
          ],
        }}
      >
        <LinearGradient
          colors={['#4338CA', '#6366F1', '#7C3AED']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0.8 }}
          className="rounded-b-3xl shadow-xl"
          style={{
            shadowColor: "#4F46E5",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
            overflow: 'hidden',
            paddingTop: insets.top > 0 ? insets.top : 14,
            paddingBottom: 20,
          }}
        >
          {/* Decorative Bubbles */}
          <Animated.View 
            className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10"
            style={{
              transform: [{ scale: bubbleAnim1 }]
            }}
          />
          <Animated.View 
            className="absolute bottom-4 left-8 w-16 h-16 rounded-full bg-white/10"
            style={{
              transform: [{ scale: bubbleAnim2 }]
            }}
          />
          <Animated.View 
            className="absolute top-12 right-20 w-8 h-8 rounded-full bg-white/20"
            style={{
              transform: [{ scale: bubbleAnim3 }]
            }}
          />
          
          {/* Floating particles */}
          <Animated.View 
            className="absolute w-3 h-3 rounded-full bg-white/40"
            style={{
              top: 15,
              left: width * 0.2,
              opacity: particleAnim1.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0]
              }),
              transform: [
                { 
                  translateY: particleAnim1.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -30]
                  })
                },
                { 
                  translateX: particleAnim1.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 10, -10, 0]
                  })
                },
                { scale: particleAnim1.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0.7, 1, 1, 0.7]
                  })
                }
              ]
            }}
          />
          <Animated.View 
            className="absolute w-2 h-2 rounded-full bg-white/30"
            style={{
              top: 25,
              right: width * 0.3,
              opacity: particleAnim2.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0]
              }),
              transform: [
                { 
                  translateY: particleAnim2.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -25]
                  })
                },
                { 
                  translateX: particleAnim2.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, -10, 10, 0]
                  })
                },
                { scale: particleAnim2.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0.8, 1, 1, 0.8]
                  })
                }
              ]
            }}
          />
          <Animated.View 
            className="absolute w-2.5 h-2.5 rounded-full bg-white/50"
            style={{
              bottom: 20,
              left: width * 0.4,
              opacity: particleAnim3.interpolate({
                inputRange: [0, 0.2, 0.8, 1],
                outputRange: [0, 1, 1, 0]
              }),
              transform: [
                { 
                  translateY: particleAnim3.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, -20]
                  })
                },
                { 
                  translateX: particleAnim3.interpolate({
                    inputRange: [0, 0.3, 0.7, 1],
                    outputRange: [0, 8, -8, 0]
                  })
                },
                { scale: particleAnim3.interpolate({
                    inputRange: [0, 0.2, 0.8, 1],
                    outputRange: [0.8, 1, 1, 0.8]
                  })
                }
              ]
            }}
          />
          
          {/* Rotating geometric shape */}
          <Animated.View 
            style={{
          position: 'absolute',
              top: 30,
              left: 20,
              width: 18,
              height: 18,
              backgroundColor: 'rgba(255,255,255,0.12)',
              borderRadius: 4,
              transform: [
                { rotate: spin },
                { scale: bubbleAnim2 }
              ]
            }}
          />
          
          <View className="flex-row items-center justify-between px-5 pt-2">
            {/* Left: Back Button or Empty Space */}
            <View style={{ width: hp(4.5) }}>
              {showBackButton && (
                <TouchableOpacity 
                  onPress={handleBack}
                  className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                  activeOpacity={0.85}
                  style={styles.glassmorphism}
                >
                  <BlurView intensity={30} tint="light" className="absolute inset-0" />
                  <View className="bg-white/10 absolute inset-0" />
                  <Ionicons name="arrow-back" size={22} color="#ffffff" />
                </TouchableOpacity>
              )}
            </View>
              
            {/* Center: Title with animated underline */}
            <Animated.View className="items-center"
              style={{
                opacity: titleAnim,
                transform: [
                  { 
                    translateY: titleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [5, 0]
                    })
                  }
                ]
              }}
            >
              <Text className="font-bold text-white text-xl text-center tracking-wide" 
                style={{ 
                  textShadowColor: 'rgba(0,0,0,0.2)', 
                  textShadowOffset: { width: 0, height: 2 }, 
                  textShadowRadius: 3 
                }}
              >
                {title}
              </Text>
              <Animated.View 
                className="bg-white/40 h-[3px] rounded-full mt-1"
                style={{
                  width: underlineWidth.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 40]
                  })
                }}
              />
            </Animated.View>
            
            {/* Right: Profile Picture or Custom Icon */}
            <Animated.View 
              style={{
                transform: [{ scale: profileImageAnim }],
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 5,
              }}
            >
              {rightIcon ? (
                <TouchableOpacity
                  onPress={rightIcon.onPress}
                  className="w-10 h-10 rounded-full items-center justify-center overflow-hidden"
                  activeOpacity={0.85}
                  style={styles.glassmorphism}
                >
                  <BlurView intensity={30} tint="light" className="absolute inset-0" />
                  <View className="bg-white/10 absolute inset-0" />
                  <Ionicons name={rightIcon.name} size={22} color="#ffffff" />
                </TouchableOpacity>
              ) : (
          <TouchableOpacity 
                  onPress={handleProfilePress}
                  activeOpacity={0.85}
                >
                  <Animated.View 
                    className="relative"
                    style={{
                      shadowColor: "#ffffff",
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.2, 0.5]
                      }),
                      shadowRadius: glowAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [3, 6]
                      }),
                    }}
          >
            <Image
              style={{ 
                        height: hp(4.8), 
                        width: hp(4.8),
                        borderRadius: hp(2.4),
                borderWidth: 2,
                borderColor: 'white'
              }}
              source={{ uri: user?.profileUrl } || ProfileImgPlaceholder}
              placeholder={blurhash}
              transition={500}
                      contentFit="cover"
            />
                    {/* Online indicator */}
                    <View className="absolute -right-1 -bottom-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-[1.5px] border-white" />
                  </Animated.View>
          </TouchableOpacity>
              )}
            </Animated.View>
          </View>
          
          {/* Navigation Breadcrumb - Optional, only show for deeper paths */}
          {pathname && pathname.split('/').length > 2 && (
            <View className="overflow-hidden mx-4 mt-3 rounded-lg" style={styles.glassmorphism}>
              <BlurView intensity={20} tint="light" className="absolute inset-0" />
              <View className="bg-white/5 absolute inset-0" />
              <View className="flex-row items-center px-3 py-1.5">
                <Feather name="home" size={12} color="rgba(255,255,255,0.8)" />
                <Entypo name="chevron-right" size={12} color="rgba(255,255,255,0.6)" style={{ marginHorizontal: 2 }} />
                <Text className="text-white/80 text-xs">{pathname.split('/')[1]}</Text>
                <Entypo name="chevron-right" size={12} color="rgba(255,255,255,0.6)" style={{ marginHorizontal: 2 }} />
                <Text className="text-white text-xs font-medium">{title}</Text>
              </View>
            </View>
          )}
        </LinearGradient>
      </Animated.View>

          {/* Menu Modal */}
          <Modal
            visible={showMenu}
            transparent={true}
        animationType="none"
        onRequestClose={handleCloseMenu}
          >
            <TouchableOpacity 
              style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
              activeOpacity={1}
          onPress={handleCloseMenu}
            >
          <Animated.View 
            style={{
                position: 'absolute',
                top: hp(8),
                right: 15,
              opacity: menuFadeAnim,
              transform: [
                { scale: menuScaleAnim },
                { translateY: menuFadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-20, 0]
                })}
              ],
                backgroundColor: 'white',
              borderRadius: 24,
              padding: 0,
              minWidth: 240,
              shadowColor: '#4F46E5',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.25,
              shadowRadius: 15,
              elevation: 10,
              overflow: 'hidden'
            }}
          >
            {/* User Info Section with Gradient Header */}
            <LinearGradient
              colors={['#4F46E5', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              className="px-4 pt-4 pb-5"
            >
              {/* Decorative elements in header */}
              <View className="absolute top-2 right-2 w-12 h-12 rounded-full bg-white/5" />
              <View className="absolute bottom-3 left-12 w-8 h-8 rounded-full bg-white/5" />
              <View className="absolute -bottom-4 right-16 w-16 h-16 rounded-full bg-white/5" />
              
              <View className="flex-row items-center">
                <View className="relative">
                  <Image
                    style={{ 
                      height: hp(6.5), 
                      width: hp(6.5),
                      borderRadius: hp(3.25),
                      borderWidth: 3,
                      borderColor: 'white'
                    }}
                    source={{ uri: user?.profileUrl } || ProfileImgPlaceholder}
                    placeholder={blurhash}
                    transition={500}
                    contentFit="cover"
                  />
                  <View className="absolute -right-1 -bottom-1 w-4 h-4 rounded-full bg-emerald-400 border-2 border-white" />
                </View>
                  <View className="ml-3">
                  <Text className="font-bold text-lg text-white">{displayName}</Text>
                  <Text className="text-sm text-white/80">{user?.email}</Text>
                </View>
              </View>
            </LinearGradient>

            <View className="px-1 py-2">
              {/* Menu Item: View Profile */}
                <TouchableOpacity 
                className="flex-row items-center py-3.5 px-4 mx-1 rounded-xl active:bg-gray-100"
                  onPress={handleProfile}
                >
                <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                    <Feather name="user" size={hp(2.2)} color="#4F46E5" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Profile</Text>
                  <Text className="text-xs text-gray-500">View and edit your profile</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* Menu Item: Settings */}
              <TouchableOpacity 
                className="flex-row items-center py-3.5 px-4 mx-1 rounded-xl active:bg-gray-100"
                onPress={() => {
                  handleCloseMenu();
                  // Navigate to settings if available
                }}
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                  <Ionicons name="settings-outline" size={hp(2.2)} color="#0EA5E9" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Settings</Text>
                  <Text className="text-xs text-gray-500">App preferences</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* Menu Item: Notifications */}
              <TouchableOpacity 
                className="flex-row items-center py-3.5 px-4 mx-1 rounded-xl active:bg-gray-100"
                onPress={() => {
                  handleCloseMenu();
                  // Navigate to notifications if available
                }}
              >
                <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3 relative">
                  <Ionicons name="notifications-outline" size={hp(2.2)} color="#D97706" />
                  <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 border border-white items-center justify-center">
                    <Text className="text-[8px] text-white font-bold">3</Text>
                  </View>
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Notifications</Text>
                  <Text className="text-xs text-gray-500">3 unread messages</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
              </TouchableOpacity>
              
              {/* Menu Divider */}
              <View className="h-[1px] bg-gray-200 mx-4 my-1" />
              
              {/* Menu Item: Help Center */}
              <TouchableOpacity 
                className="flex-row items-center py-3.5 px-4 mx-1 rounded-xl active:bg-gray-100"
                onPress={() => {
                  handleCloseMenu();
                  // Navigate to help center if available
                }}
              >
                <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                  <MaterialIcons name="help-outline" size={hp(2.2)} color="#7C3AED" />
                </View>
                <View className="flex-1">
                  <Text className="font-semibold text-gray-800">Help Center</Text>
                  <Text className="text-xs text-gray-500">Support and FAQ</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#9CA3AF" />
                </TouchableOpacity>

              {/* Menu Item: Logout */}
                <TouchableOpacity 
                className="flex-row items-center py-3.5 px-4 mx-1 mt-1 mb-1 rounded-xl bg-red-50 active:bg-red-100"
                  onPress={handleLogout}
                >
                <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                    <AntDesign name="logout" size={hp(2.2)} color="#EF4444" />
                  </View>
                <View className="flex-1">
                  <Text className="font-semibold text-red-500">Logout</Text>
                  <Text className="text-xs text-red-400">Sign out of your account</Text>
                </View>
                </TouchableOpacity>
              </View>
          </Animated.View>
            </TouchableOpacity>
          </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  glassmorphism: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  }
});
