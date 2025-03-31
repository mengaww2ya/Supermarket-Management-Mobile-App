import React, { useEffect, useRef } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  Text, 
  TouchableOpacity, 
  View,
  StatusBar,
  Image,
  Animated,
  Dimensions
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons, FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';

export default function ManageChannels() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const screenWidth = Dimensions.get('window').width;

  // Animation on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Create animated cards with staggered delay
  const AnimatedCard = ({ index, title, description, icon, onPress, color, span = 1 }) => {
    const itemAnim = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(50)).current;
    
    useEffect(() => {
      Animated.parallel([
        Animated.timing(itemAnim, {
          toValue: 1,
          duration: 500,
          delay: 100 + (index * 100),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 600,
          delay: 100 + (index * 100),
          useNativeDriver: true,
        }),
      ]).start();
    }, []);

    // Calculate width based on span (1 or 2 columns)
    const cardWidth = span === 1 
      ? (screenWidth - 48) / 2 - 8 
      : screenWidth - 48;

    return (
      <Animated.View style={{ 
        opacity: itemAnim, 
        transform: [{ translateY }, { scale: itemAnim }],
        width: cardWidth,
      }}>
        <TouchableOpacity
          className={`p-5 rounded-2xl shadow-lg mb-4 overflow-hidden`}
          style={{
            backgroundColor: '#ffffff',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
            borderWidth: 1,
            borderColor: '#f1f5f9',
            height: span === 1 ? 160 : 140,
          }}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onPress();
          }}
          activeOpacity={0.9}
        >
          <View className="flex-row items-center mb-3">
            <View className={`w-10 h-10 rounded-full items-center justify-center`} style={{ backgroundColor: `${color}20` }}>
              {icon}
            </View>
            <Text className="text-lg font-bold ml-3" style={{ color: '#1e293b' }}>{title}</Text>
          </View>
          
          <Text className="text-gray-600 mb-3" numberOfLines={span === 1 ? 2 : 1}>{description}</Text>
          
          <View className="absolute bottom-3 right-3">
            <View className={`px-3 py-1 rounded-full flex-row items-center`} style={{ backgroundColor: `${color}10` }}>
              <Text className="text-xs font-medium mr-1" style={{ color }}>{span === 1 ? 'Explore' : 'Manage'}</Text>
              <MaterialIcons name="arrow-forward" size={14} color={color} />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Channel statistics and activity overview
  const ChannelStats = () => {
    return (
      <View className="bg-indigo-50 p-4 rounded-2xl mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-indigo-900 font-bold">Channel Activity</Text>
          <TouchableOpacity 
            className="bg-indigo-100 px-3 py-1 rounded-full"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Would show detailed stats in a real app
            }}
          >
            <Text className="text-indigo-700 text-xs font-medium">View Details</Text>
          </TouchableOpacity>
        </View>
        
        <View className="flex-row justify-between">
          <View className="items-center">
            <Text className="text-indigo-800 text-lg font-bold">24</Text>
            <Text className="text-indigo-700 text-xs">Active Channels</Text>
          </View>
          <View className="items-center">
            <Text className="text-indigo-800 text-lg font-bold">128</Text>
            <Text className="text-indigo-700 text-xs">Daily Messages</Text>
          </View>
          <View className="items-center">
            <Text className="text-indigo-800 text-lg font-bold">94%</Text>
            <Text className="text-indigo-700 text-xs">Response Rate</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <Animated.View style={{ 
        flex: 1, 
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }}>
        <ScrollView 
          contentContainerStyle={{ flexGrow: 1 }} 
          className="p-4"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6 mt-2">
            <View>
              <Text className="text-2xl font-bold text-gray-800">Channel Manager</Text>
              <Text className="text-gray-500">Manage all communication channels</Text>
            </View>
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
            >
              <MaterialIcons name="arrow-back" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* Statistics Overview */}
          <ChannelStats />

          {/* Main Content */}
          <View className="flex-row flex-wrap justify-between">
            <AnimatedCard 
              index={0}
              title="Overview"
              description="View all communication channels and their status"
              icon={<Ionicons name="stats-chart" size={20} color="#4f46e5" />}
              color="#4f46e5"
              onPress={() => router.push("/manager/ChannelOverview")}
            />
            
            <AnimatedCard 
              index={1}
              title="Manage"
              description="Add, edit, or remove communication channels"
              icon={<MaterialIcons name="edit" size={20} color="#06b6d4" />}
              color="#06b6d4"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to manage channels screen
              }}
            />
            
            <AnimatedCard 
              index={2}
              title="Assignment"
              description="Assign customer assistants to appropriate communication channels for effective support"
              icon={<FontAwesome5 name="user-friends" size={18} color="#8b5cf6" />}
              color="#8b5cf6"
              span={2}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to assignment screen
              }}
            />
            
            <AnimatedCard 
              index={3}
              title="Analytics"
              description="Track channel performance and engagement metrics"
              icon={<MaterialIcons name="insights" size={20} color="#ec4899" />}
              color="#ec4899"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to analytics screen
              }}
            />
            
            <AnimatedCard 
              index={4}
              title="Settings"
              description="Configure notification preferences and integrations"
              icon={<Ionicons name="settings-sharp" size={20} color="#14b8a6" />}
              color="#14b8a6"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to settings screen
              }}
            />

            <AnimatedCard 
              index={5}
              title="Automations"
              description="Set up automated responses and routing rules for all channels"
              icon={<MaterialIcons name="auto-fix-high" size={20} color="#f59e0b" />}
              color="#f59e0b"
              span={2}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Navigate to automations screen
              }}
            />
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
