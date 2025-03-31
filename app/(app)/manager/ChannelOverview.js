import React, { useState, useRef, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Modal,
  StatusBar,
  Animated,
  Dimensions,
  TextInput,
  Image,
} from "react-native";
import { channels } from "../../global/data.js";
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";

const SCREEN_WIDTH = Dimensions.get('window').width;

// Status Tag Component
const StatusTag = ({ status }) => {
  let bgColor, textColor, icon;
  
  switch(status) {
    case 'Active':
      bgColor = '#dcfce7';
      textColor = '#16a34a';
      icon = <MaterialIcons name="check-circle" size={14} color="#16a34a" />;
      break;
    case 'Inactive':
      bgColor = '#fee2e2';
      textColor = '#dc2626';
      icon = <MaterialIcons name="cancel" size={14} color="#dc2626" />;
      break;
    case 'Under Maintenance':
      bgColor = '#fef3c7';
      textColor = '#d97706';
      icon = <MaterialIcons name="engineering" size={14} color="#d97706" />;
      break;
    default:
      bgColor = '#e5e7eb';
      textColor = '#6b7280';
      icon = <MaterialIcons name="help" size={14} color="#6b7280" />;
  }
  
  return (
    <View 
      className="flex-row items-center px-3 py-1 rounded-full"
      style={{ backgroundColor: bgColor }}
    >
      {icon}
      <Text className="text-xs font-semibold ml-1" style={{ color: textColor }}>
        {status}
      </Text>
    </View>
  );
};

// Channel Card Component with Animation
const ChannelCard = ({ channel, index, onPress }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const getChannelIcon = (channelName) => {
    const name = channelName.toLowerCase();
    if (name.includes('phone')) return <MaterialIcons name="phone" size={24} color="#4338ca" />;
    if (name.includes('email')) return <MaterialIcons name="email" size={24} color="#0891b2" />;
    if (name.includes('chat')) return <MaterialIcons name="chat" size={24} color="#7e22ce" />;
    if (name.includes('whatsapp')) return <FontAwesome5 name="whatsapp" size={24} color="#16a34a" />;
    if (name.includes('social')) return <MaterialIcons name="public" size={24} color="#db2777" />;
    return <MaterialIcons name="device-hub" size={24} color="#6366f1" />;
  };
  
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  return (
    <Animated.View 
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        width: (SCREEN_WIDTH - 40) / 2 - 6,
      }}
    >
      <TouchableOpacity
        className="bg-white p-4 rounded-xl mb-3 shadow-sm border border-gray-100"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(channel);
        }}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start">
          <View className="w-10 h-10 rounded-full bg-indigo-50 items-center justify-center">
            {getChannelIcon(channel.name)}
          </View>
          <StatusTag status={channel.status} />
        </View>
        
        <Text className="text-lg font-bold mt-3 text-gray-800">{channel.name}</Text>
        
        <View className="flex-row items-center mt-2">
          <MaterialIcons name="access-time" size={14} color="#6b7280" />
          <Text className="text-xs text-gray-500 ml-1">
            {channel.lastActivity}
          </Text>
        </View>
        
        <View className="h-1.5 bg-gray-100 rounded-full mt-3">
          <View 
            className="h-1.5 rounded-full" 
            style={{ 
              width: channel.status === 'Active' ? '85%' : 
                     channel.status === 'Inactive' ? '20%' : '50%',
              backgroundColor: channel.status === 'Active' ? '#16a34a' : 
                              channel.status === 'Inactive' ? '#dc2626' : '#d97706'
            }} 
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function ChannelOverview() {
  const [channelList, setChannelList] = useState(channels);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const router = useRouter();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  
  // For analytics display in detail modal
  const channelStats = {
    active: channelList.filter(c => c.status === "Active").length,
    inactive: channelList.filter(c => c.status === "Inactive").length,
    maintenance: channelList.filter(c => c.status === "Under Maintenance").length,
    total: channelList.length
  };
  
  // Animation on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true
    }).start();
  }, []);
  
  // Animation for modal
  useEffect(() => {
    if (modalVisible) {
      Animated.spring(modalScaleAnim, {
        toValue: 1,
        friction: 8,
        useNativeDriver: true
      }).start();
    } else {
      modalScaleAnim.setValue(0.9);
    }
  }, [modalVisible]);

  // Filter channels based on search and status filter
  const filteredChannels = channelList.filter(channel => {
    const matchesSearch = channel.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === "All" || channel.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const openDetailsModal = (channel) => {
    setSelectedChannel(channel);
    setModalVisible(true);
  };

  const updateChannelStatus = (status) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setChannelList((prevChannels) =>
      prevChannels.map((channel) =>
        channel.id === selectedChannel.id ? { ...channel, status } : channel
      )
    );
    setSelectedChannel({ ...selectedChannel, status });
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      <Animated.View 
        className="flex-1" 
        style={{ opacity: fadeAnim }}
      >
        <View className="px-4 py-3 flex-row items-center justify-between">
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#64748b" />
          </TouchableOpacity>
          
          <Text className="text-xl font-bold text-gray-800">Channel Overview</Text>
          
          <View className="w-10 h-10" />
        </View>
        
        {/* Search bar */}
        <View className="px-4 mb-3">
          <View className="flex-row items-center bg-white rounded-full px-4 py-2 shadow-sm border border-gray-200">
            <MaterialIcons name="search" size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-2 text-gray-700"
              placeholder="Search channels..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <MaterialIcons name="close" size={20} color="#6b7280" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Status filters */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          className="px-4 mb-4"
          contentContainerStyle={{ paddingRight: 16 }}
        >
          {["All", "Active", "Inactive", "Under Maintenance"].map((status, index) => (
            <TouchableOpacity
              key={status}
              className={`px-4 py-2 rounded-full mr-2 ${
                filterStatus === status 
                  ? "bg-indigo-600 shadow-sm" 
                  : "bg-white border border-gray-200"
              }`}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterStatus(status);
              }}
            >
              <Text
                className={`font-medium ${
                  filterStatus === status ? "text-white" : "text-gray-700"
                }`}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Statistics cards */}
        <View className="px-4 mb-4">
          <View className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
            <Text className="font-bold text-gray-800 mb-2">Channel Status</Text>
            <View className="flex-row justify-between">
              <View className="items-center">
                <Text className="text-green-600 text-lg font-bold">{channelStats.active}</Text>
                <Text className="text-xs text-gray-500">Active</Text>
              </View>
              <View className="items-center">
                <Text className="text-red-600 text-lg font-bold">{channelStats.inactive}</Text>
                <Text className="text-xs text-gray-500">Inactive</Text>
              </View>
              <View className="items-center">
                <Text className="text-amber-600 text-lg font-bold">{channelStats.maintenance}</Text>
                <Text className="text-xs text-gray-500">Maintenance</Text>
              </View>
              <View className="items-center">
                <Text className="text-indigo-600 text-lg font-bold">{channelStats.total}</Text>
                <Text className="text-xs text-gray-500">Total</Text>
              </View>
            </View>
          </View>
        </View>
        
        {/* Channel cards */}
        <ScrollView 
          className="px-4" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}
        >
          {filteredChannels.length > 0 ? (
            <View className="flex-row flex-wrap justify-between">
              {filteredChannels.map((channel, index) => (
                <ChannelCard
                  key={channel.id}
                  channel={channel}
                  index={index}
                  onPress={openDetailsModal}
                />
              ))}
            </View>
          ) : (
            <View className="justify-center items-center py-12">
              <MaterialIcons name="search-off" size={64} color="#d1d5db" />
              <Text className="text-gray-500 text-lg font-medium mt-2">No channels found</Text>
              <Text className="text-gray-400 text-center mt-1">
                Try adjusting your search or filter criteria
              </Text>
              <TouchableOpacity 
                className="mt-4 bg-indigo-100 px-4 py-2 rounded-full"
                onPress={() => {
                  setSearchQuery("");
                  setFilterStatus("All");
                }}
              >
                <Text className="text-indigo-600 font-medium">Clear Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </Animated.View>

      {/* Enhanced Modal */}
      <Modal transparent visible={modalVisible} animationType="fade">
        <View className="flex-1 bg-black/50 justify-center items-center">
          <Animated.View 
            className="bg-white rounded-2xl w-[90%] overflow-hidden"
            style={{ 
              transform: [{ scale: modalScaleAnim }],
              maxHeight: '80%',
            }}
          >
            {selectedChannel && (
              <>
                {/* Modal Header */}
                <View className="bg-indigo-600 p-5">
                  <View className="flex-row justify-between items-start">
                    <View className="flex-1">
                      <Text className="text-white text-xl font-bold">{selectedChannel.name}</Text>
                      <View className="flex-row items-center mt-1">
                        <MaterialIcons name="access-time" size={14} color="rgba(255,255,255,0.8)" />
                        <Text className="text-white/80 text-xs ml-1">
                          Last activity: {selectedChannel.lastActivity}
                        </Text>
                      </View>
                    </View>
                    <StatusTag status={selectedChannel.status} />
                  </View>
                </View>
                
                {/* Modal Content */}
                <View className="p-5">
                  <Text className="text-gray-800 font-semibold mb-1">Channel Details</Text>
                  
                  <View className="bg-gray-50 p-3 rounded-lg mb-4">
                    <View className="flex-row mb-2">
                      <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center">
                        <MaterialIcons name="info" size={18} color="#4f46e5" />
                      </View>
                      <View className="ml-2 flex-1">
                        <Text className="text-gray-600 text-xs">Channel ID</Text>
                        <Text className="text-gray-800 font-medium">{selectedChannel.id}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row mb-2">
                      <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center">
                        <MaterialIcons name="bar-chart" size={18} color="#4f46e5" />
                      </View>
                      <View className="ml-2 flex-1">
                        <Text className="text-gray-600 text-xs">Analytics</Text>
                        <Text className="text-gray-800 font-medium">450 Interactions / Week</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row">
                      <View className="w-8 h-8 bg-indigo-100 rounded-full items-center justify-center">
                        <MaterialIcons name="people" size={18} color="#4f46e5" />
                      </View>
                      <View className="ml-2 flex-1">
                        <Text className="text-gray-600 text-xs">Assigned Staff</Text>
                        <Text className="text-gray-800 font-medium">5 Customer Assistants</Text>
                      </View>
                    </View>
                  </View>
                  
                  <Text className="text-gray-800 font-semibold mb-2">Update Status</Text>
                  
                  <View className="flex-row flex-wrap justify-between mb-4">
                    <TouchableOpacity
                      className={`px-4 py-3 rounded-lg flex-row items-center ${selectedChannel.status === "Active" ? "bg-green-100 border border-green-200" : "bg-white border border-gray-200"}`}
                      style={{ width: '32%' }}
                      onPress={() => updateChannelStatus("Active")}
                    >
                      <MaterialIcons 
                        name="check-circle" 
                        size={18} 
                        color={selectedChannel.status === "Active" ? "#16a34a" : "#9ca3af"} 
                      />
                      <Text 
                        className={`text-xs font-medium ml-1 ${selectedChannel.status === "Active" ? "text-green-700" : "text-gray-700"}`}
                      >
                        Active
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className={`px-4 py-3 rounded-lg flex-row items-center ${selectedChannel.status === "Inactive" ? "bg-red-100 border border-red-200" : "bg-white border border-gray-200"}`}
                      style={{ width: '32%' }}
                      onPress={() => updateChannelStatus("Inactive")}
                    >
                      <MaterialIcons 
                        name="cancel" 
                        size={18} 
                        color={selectedChannel.status === "Inactive" ? "#dc2626" : "#9ca3af"} 
                      />
                      <Text 
                        className={`text-xs font-medium ml-1 ${selectedChannel.status === "Inactive" ? "text-red-700" : "text-gray-700"}`}
                      >
                        Inactive
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      className={`px-4 py-3 rounded-lg flex-row items-center ${selectedChannel.status === "Under Maintenance" ? "bg-amber-100 border border-amber-200" : "bg-white border border-gray-200"}`}
                      style={{ width: '32%' }}
                      onPress={() => updateChannelStatus("Under Maintenance")}
                    >
                      <MaterialIcons 
                        name="engineering" 
                        size={18} 
                        color={selectedChannel.status === "Under Maintenance" ? "#d97706" : "#9ca3af"} 
                      />
                      <Text 
                        className={`text-xs font-medium ml-1 ${selectedChannel.status === "Under Maintenance" ? "text-amber-700" : "text-gray-700"}`}
                        numberOfLines={1}
                      >
                        Maintenance
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                {/* Modal Footer */}
                <View className="p-4 border-t border-gray-200 flex-row">
                  <TouchableOpacity
                    className="flex-1 bg-gray-200 py-3 rounded-lg mr-2 items-center flex-row justify-center"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setModalVisible(false);
                    }}
                  >
                    <MaterialIcons name="close" size={18} color="#4b5563" />
                    <Text className="ml-1 font-medium text-gray-700">Close</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    className="flex-1 bg-indigo-600 py-3 rounded-lg items-center flex-row justify-center"
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push(`/manager/ChannelDetails?id=${selectedChannel.id}`);
                      setModalVisible(false);
                    }}
                  >
                    <MaterialIcons name="tune" size={18} color="white" />
                    <Text className="ml-1 font-medium text-white">View More</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
