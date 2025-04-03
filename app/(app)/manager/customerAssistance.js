import React, { useRef, useEffect } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View, 
  Animated, 
  Dimensions, 
  StatusBar,
  Image 
} from "react-native";
import { useRouter } from "expo-router";
import { 
  MaterialIcons, 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5 
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";

const { width } = Dimensions.get('window');

// Menu Card component for each option
const MenuCard = ({ option, index, animationDelay }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        delay: animationDelay + (index * 100),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 700,
        delay: animationDelay + (index * 100),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        delay: animationDelay + (index * 100),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle press animation
  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Icons for each option
  const getIcon = () => {
    switch(option.title) {
      case "Review Operations":
        return <MaterialIcons name="dashboard" size={28} color="#4338CA" />;
      case "Handling Escalated Issues":
        return <MaterialIcons name="priority-high" size={28} color="#E11D48" />;
      case "Customer Service Performance":
        return <MaterialIcons name="bar-chart" size={28} color="#0891B2" />;
      case "Manage Channels":
        return <MaterialCommunityIcons name="comment-multiple-outline" size={28} color="#047857" />;
      default:
        return <Ionicons name="people" size={28} color="#6366F1" />;
    }
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ],
        width: width > 700 ? '48%' : '100%',
        marginBottom: 16,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          option.onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          className="rounded-2xl p-5 shadow-sm"
          style={{
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#f1f5f9',
          }}
        >
          <View className="flex-row items-center mb-3">
            <View className="bg-indigo-50 p-3 rounded-full mr-4">
              {getIcon()}
            </View>
            <Text className="text-xl font-bold text-gray-800 flex-1">
              {option.title}
            </Text>
          </View>
          
          <Text className="text-gray-600 mb-3 text-base">
            {option.subtitle}
          </Text>
          
          <View className="flex-row items-center justify-end mt-2">
            <Text className="text-indigo-600 font-medium mr-1">Access</Text>
            <MaterialIcons name="arrow-forward" size={18} color="#4F46E5" />
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function McustomerAssistance() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const titleScaleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(titleScaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const menuOptions = [
    {
      title: "Review Operations",
      subtitle: "Monitor and optimize customer support operations in real-time",
      navigate: "/manager/monitorCustomerAssistance",
      icon: "dashboard",
      color: "#4338CA",
      onPress: () => router.push("/manager/monitorCustomerAssistance"),
    },
    {
      title: "Handling Escalated Issues",
      subtitle: "Resolve complex customer issues that require manager attention",
      navigate: "/manager/HandlingEscalatedIssues",
      icon: "priority-high",
      color: "#E11D48",
      onPress: () => router.push("/manager/HandlingEscalatedIssues"),
    },
    {
      title: "Customer Service Performance",
      subtitle: "Track metrics and evaluate customer service team effectiveness",
      navigate: "/manager/customerServicePerformance",
      icon: "bar-chart",
      color: "#0891B2",
      onPress: () => router.push("/manager/customerServicePerformance"),
    },
    {
      title: "Manage Channels",
      subtitle: "Configure and optimize customer communication channels",
      navigate: "/manager/ManageChannels",
      icon: "comment-multiple-outline",
      color: "#047857",
      onPress: () => router.push("/manager/ManageChannels"),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <HomeHeader title="Customer Assistance" />
      
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Section */}
        <Animated.View 
          className="mb-6"
          style={{ 
            opacity: fadeAnim,
            transform: [{ scale: titleScaleAnim }] 
          }}
        >
          <LinearGradient
            colors={['#4F46E5', '#6366F1']}
            start={[0, 0]}
            end={[1, 0]}
            className="rounded-2xl p-5 shadow-lg mb-2"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-white text-2xl font-bold mb-2">
                  Customer Assistance Management
                </Text>
                <Text className="text-indigo-100 text-base">
                  Monitor, support and optimize customer experiences
                </Text>
              </View>
              <View className="bg-white/20 p-3 rounded-full">
                <Ionicons name="people" size={30} color="white" />
              </View>
            </View>
            
            <View className="mt-4 flex-row">
              <View className="bg-white/20 py-1 px-3 rounded-full mr-2">
                <Text className="text-white font-medium">Support Queries</Text>
              </View>
              <View className="bg-white/20 py-1 px-3 rounded-full">
                <Text className="text-white font-medium">Satisfaction</Text>
              </View>
            </View>
          </LinearGradient>
          
          {/* Stats Section */}
          <View className="flex-row justify-between">
            <View className="bg-white rounded-xl p-3 shadow-sm flex-1 mr-2 border border-gray-100">
              <Text className="text-gray-500 text-xs">Active Cases</Text>
              <Text className="text-lg font-bold text-gray-800">24</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm flex-1 mr-2 border border-gray-100">
              <Text className="text-gray-500 text-xs">Resolved Today</Text>
              <Text className="text-lg font-bold text-gray-800">37</Text>
            </View>
            <View className="bg-white rounded-xl p-3 shadow-sm flex-1 border border-gray-100">
              <Text className="text-gray-500 text-xs">Satisfaction</Text>
              <Text className="text-lg font-bold text-green-600">92%</Text>
            </View>
          </View>
        </Animated.View>
        
        {/* Menu Options */}
        <Text className="text-lg font-bold text-gray-800 mb-4 pl-1">
          Management Tools
        </Text>
        
        <View className="flex-row flex-wrap justify-between">
          {menuOptions.map((option, index) => (
            <MenuCard 
              key={index} 
              option={option} 
              index={index} 
              animationDelay={300}
            />
          ))}
        </View>
        
        {/* Recent Activity Section */}
        <Animated.View 
          style={{ opacity: fadeAnim }}
          className="mt-4"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-lg font-bold text-gray-800 pl-1">
              Recent Activity
            </Text>
            <TouchableOpacity>
              <Text className="text-indigo-600 font-medium">View All</Text>
            </TouchableOpacity>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-green-100 p-2 rounded-full mr-3">
                <MaterialIcons name="check-circle" size={20} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">Issue #2384 Resolved</Text>
                <Text className="text-gray-500 text-sm">Product return processed successfully</Text>
              </View>
              <Text className="text-gray-400 text-xs">2h ago</Text>
            </View>
          </View>
          
          <View className="bg-white rounded-xl p-4 shadow-sm mb-4 border border-gray-100">
            <View className="flex-row items-center">
              <View className="bg-amber-100 p-2 rounded-full mr-3">
                <MaterialIcons name="priority-high" size={20} color="#F59E0B" />
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 font-medium">New Escalated Issue</Text>
                <Text className="text-gray-500 text-sm">Customer #1058 payment dispute</Text>
              </View>
              <Text className="text-gray-400 text-xs">4h ago</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
