import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, ScrollView, Dimensions, Image, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring, withTiming, useAnimatedScrollHandler, interpolate, Extrapolate } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import HomeHeader from "../../../components/HomeHeader";
import { StatusBar } from "expo-status-bar";
const { width } = Dimensions.get('window');

// Unified color palette
const colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#3B82F6",
  secondary: "#00BCD4",
  secondaryDark: "#0097A7",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  success: "#10B981",
  warning: "#F59E0B",
  error: "#EF4444",
  info: "#3B82F6",
  cardGradient1: "#F8FAFC",
  cardGradient2: "#F1F5F9",
};

const menuItems = [
  {
    title: "Add Employee",
    subtitle: "Add new employee to the system",
    icon: "person-add-alt-1",
    iconType: "MaterialIcons",
    route: "admine/addEmployee",
    gradient: [colors.primary, colors.primaryLight]
  },
  {
    title: "Add Supplier",
    subtitle: "Add & create supplier accounts",
    icon: "truck",
    iconType: "FontAwesome5",
    route: "admine/addSuplier",
    gradient: [colors.primary, colors.primaryLight]
  },
  {
    title: "View Employees",
    subtitle: "Display all employees",
    icon: "account-group",
    iconType: "MaterialCommunityIcons",
    route: "admine/employeeList",
    gradient: [colors.primary, colors.primaryLight]
  },
  {
    title: "View Customers",
    subtitle: "Display all customers",
    icon: "account-multiple",
    iconType: "MaterialCommunityIcons",
    route: "/admine/customersList",
    gradient: [colors.primary, colors.primaryLight]
  },
  {
    title: "View Suppliers",
    subtitle: "Display all suppliers",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    route: "/admine/suppliersList",
    gradient: [colors.primary, colors.primaryLight]
  }
];

const stats = [
  {
    title: "Total Employees",
    value: "24",
    icon: "people",
    iconType: "MaterialIcons",
    change: "+12%",
    iconBg: "#E0E7FF"
  },
  {
    title: "Total Customers",
    value: "156",
    icon: "account-multiple",
    iconType: "MaterialCommunityIcons",
    change: "+8%",
    iconBg: "#DBEAFE"
  },
  {
    title: "Total Suppliers",
    value: "12",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    change: "+5%",
    iconBg: "#E0F2FE"
  },
  {
    title: "Total Orders",
    value: "89",
    icon: "shopping-cart",
    iconType: "MaterialIcons",
    change: "+15%",
    iconBg: "#EFF6FF"
  }
];

export default function AdminHomePage() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const [loading, setLoading] = useState(false);
  const scrollY = useSharedValue(0);

  const scaleIconAnimations = useSharedValue(0.5);
  const opacityIconAnimations = useSharedValue(0);

  useEffect(() => {
    scaleIconAnimations.value = withTiming(1, { duration: 300 });
    opacityIconAnimations.value = withTiming(1, { duration: 300 });
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const onPressIn = () => {
    scale.value = withSpring(0.96);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const iconAnimationStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scaleIconAnimations.value }],
      opacity: opacityIconAnimations.value,
    };
  });

  if (loading) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={colors.primary} />
        <Text className="text-gray-600 font-medium mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={{ marginBottom: 8 }}>
        <HomeHeader title="Admin Dashboard" />
      </View>

      {/* Date and Welcome Banner */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ 
          marginHorizontal: 16,
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '600', marginBottom: 4 }}>Welcome Back, Admin</Text>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>Today, {new Date().toLocaleDateString()}</Text>
          </View>
          
          <Animated.View style={iconAnimationStyle}>
            <MaterialIcons name="dashboard-customize" size={36} color="white" />
          </Animated.View>
        </View>
      </LinearGradient>

      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        style={{ flex: 1, paddingHorizontal: 16 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Stats Section */}
        <Animated.View 
          entering={FadeInDown.delay(200).duration(700)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>System Overview</Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: 'rgba(37,99,235,0.1)', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 12,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600', marginRight: 4 }}>This Month</Text>
              <MaterialIcons name="keyboard-arrow-down" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap justify-between">
            {stats.map((stat, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInRight.delay(300 + index * 100).duration(700)}
                style={{
                  width: '48%',
                  marginBottom: 16,
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: 'rgba(0,0,0,0.05)',
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 5,
                  elevation: 1
                }}
              >
                <Pressable 
                  onPressIn={() => {
                    scaleIconAnimations.value = withSpring(1.1);
                  }}
                  onPressOut={() => {
                    scaleIconAnimations.value = withSpring(1);
                  }}
                  style={{ flex: 1 }}
                >
                  <View className="flex-row justify-between items-start">
                    <Animated.View style={[
                      { 
                        width: 44, 
                        height: 44, 
                        borderRadius: 12, 
                        backgroundColor: stat.iconBg,
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      },
                      iconAnimationStyle
                    ]}>
                      {stat.iconType === "MaterialIcons" && (
                        <MaterialIcons name={stat.icon} size={22} color={colors.primary} />
                      )}
                      {stat.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={stat.icon} size={22} color={colors.primary} />
                      )}
                    </Animated.View>
                    <View style={{ 
                      backgroundColor: 'rgba(16,185,129,0.1)', 
                      paddingHorizontal: 8, 
                      paddingVertical: 4, 
                      borderRadius: 12 
                    }}>
                      <Text style={{ color: colors.success, fontSize: 12, fontWeight: '600' }}>{stat.change}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 26, fontWeight: 'bold', color: colors.text, marginTop: 12 }}>{stat.value}</Text>
                  <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 4, fontWeight: '500' }}>{stat.title}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View 
          entering={FadeInDown.delay(500).duration(700)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Quick Actions</Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: 'rgba(37,99,235,0.1)', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 12 
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>All Actions</Text>
            </TouchableOpacity>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {menuItems.map((item, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInRight.delay(600 + index * 100).duration(700)}
                style={{ width: '48%', marginBottom: 16 }}
              >
                <TouchableOpacity
                  onPress={() => router.push(item.route)}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  activeOpacity={0.9}
                  style={[animatedStyle, { 
                    backgroundColor: index % 2 === 0 ? 'rgba(243,244,246,0.8)' : 'rgba(249,250,251,0.8)',
                    borderRadius: 20,
                    padding: 20,
                    height: 160,
                    justifyContent: 'space-between',
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 3,
                  }]}
                >
                  <View className="flex-row justify-between items-start">
                    <Animated.View style={[{ 
                      width: 48, 
                      height: 48, 
                      backgroundColor: 'rgba(37,99,235,0.12)', 
                      borderRadius: 16,
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }, iconAnimationStyle]}>
                      {item.iconType === "MaterialIcons" && (
                        <MaterialIcons name={item.icon} size={24} color={colors.primary} />
                      )}
                      {item.iconType === "FontAwesome5" && (
                        <FontAwesome5 name={item.icon} size={22} color={colors.primary} />
                      )}
                      {item.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={item.icon} size={24} color={colors.primary} />
                      )}
                    </Animated.View>
                    <View style={{
                      backgroundColor: 'rgba(37,99,235,0.08)',
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <MaterialIcons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                  </View>
                  
                  <View>
                    <Text style={{ color: colors.text, fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
                    <Text style={{ color: colors.textLight, fontSize: 13, marginTop: 4 }}>{item.subtitle}</Text>
                    
                    <View style={{
                      height: 3,
                      width: 40,
                      backgroundColor: colors.primary,
                      marginTop: 10,
                      borderRadius: 2
                    }} />
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Recent Activity */}
        <Animated.View 
          entering={FadeInDown.delay(800).duration(700)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 20,
            marginBottom: 24,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 2
          }}
        >
          <View className="flex-row justify-between items-center mb-5">
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: colors.text }}>Recent Activity</Text>
            <TouchableOpacity 
              style={{ 
                backgroundColor: 'rgba(37,99,235,0.1)', 
                paddingHorizontal: 16, 
                paddingVertical: 8, 
                borderRadius: 12 
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '600' }}>View All</Text>
            </TouchableOpacity>
          </View>
          
          {[1, 2, 3].map((_, index) => (
            <Animated.View 
              key={index} 
              entering={FadeInDown.delay(900 + index * 100).duration(700)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: 16,
                backgroundColor: 'rgba(241,245,249,0.7)',
                borderRadius: 16,
                marginBottom: 12
              }}
            >
              <TouchableOpacity 
                style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}
                onPressIn={() => {
                  scaleIconAnimations.value = withSpring(1.1);
                }}
                onPressOut={() => {
                  scaleIconAnimations.value = withSpring(1);
                }}
                activeOpacity={0.7}
              >
                <Animated.View style={[{ 
                  width: 40, 
                  height: 40, 
                  borderRadius: 12, 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: index === 0 ? 'rgba(37,99,235,0.1)' : index === 1 ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)'
                }, iconAnimationStyle]}>
                  <MaterialIcons 
                    name={index === 0 ? "person-add" : index === 1 ? "shopping-bag" : "inventory"} 
                    size={20} 
                    color={index === 0 ? colors.primary : index === 1 ? colors.success : colors.warning} 
                  />
                </Animated.View>
                <View style={{ marginLeft: 12, flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '500' }}>
                    {index === 0 ? "New employee added" : index === 1 ? "Order #45612 processed" : "Inventory updated"}
                  </Text>
                  <Text style={{ color: colors.textLight, fontSize: 12 }}>
                    {index === 0 ? "2 hours ago" : index === 1 ? "Yesterday, 6:30 PM" : "Yesterday, 10:15 AM"}
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={24} color="#9CA3AF" />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </Animated.View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
