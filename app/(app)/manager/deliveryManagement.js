import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Animated,
  TextInput,
  RefreshControl,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";
import { db } from "../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, updateDoc } from "firebase/firestore";

// Define AgentCard component outside the main component
const AgentCard = ({ item, index, onPress, fadeAnim }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        delay: index * 100,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true
      })
    ]).start();
  }, [index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "#10B981";
      case "busy":
        return "#F59E0B";
      case "unavailable":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "available":
        return "#ECFDF5";
      case "busy":
        return "#FEF3C7";
      case "unavailable":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  return (
    <Animated.View 
      className="mb-4"
      style={{
        opacity: fadeAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ]
      }}
    >
      <TouchableOpacity 
        className="bg-white rounded-xl shadow-sm overflow-hidden"
        style={{ 
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2
        }}
        onPress={() => onPress(item)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View className="flex-row p-4">
          <View className="mr-3">
            {item.photoURL ? (
              <Image 
                source={{ uri: item.photoURL }} 
                className="w-16 h-16 rounded-full"
              />
            ) : (
              <View 
                className="w-16 h-16 rounded-full justify-center items-center"
                style={{ backgroundColor: getStatusBgColor(item.status) }}
              >
                <FontAwesome5 
                  name="user-alt" 
                  size={24} 
                  color={getStatusColor(item.status)} 
                />
              </View>
            )}
            <View 
              className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-white"
              style={{ backgroundColor: getStatusColor(item.status) }}
            />
          </View>
          
          <View className="flex-1 justify-center">
            <Text className="text-lg font-bold text-gray-800">
                {item.firstName} {item.lastName}
            </Text>
            <Text className="text-gray-500">
              {item.completedOrders} deliveries completed
            </Text>
            <View className="flex-row items-center mt-1">
              <MaterialIcons name="star" size={16} color="#F59E0B" />
              <Text className="ml-1 text-gray-700 font-medium">
                {item.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          
          <View 
            className="justify-center px-3 py-1 rounded-full self-center"
            style={{ backgroundColor: getStatusBgColor(item.status) }}
          >
            <Text 
              className="font-medium capitalize"
              style={{ color: getStatusColor(item.status) }}
            >
              {item.status}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function DeliveryAgentManagement() {
  const router = useRouter();
  const [deliveryAgents, setDeliveryAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Fetch delivery agents from Firebase
  const fetchDeliveryAgents = async () => {
    try {
      setLoading(true);
      const q = query(
        collection(db, "users"),
        where("role", "==", "deliveryAgent")
      );

      const querySnapshot = await getDocs(q);
      const agents = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        agents.push({
          id: doc.id,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
          email: data.email || "",
          status: data.status || "unavailable",
          rating: data.rating || 0,
          completedOrders: data.completedOrders || 0,
          photoURL: data.photoURL || null,
          location: data.location || null,
          lastActive: data.lastActive?.toDate() || null,
        });
      });

      setDeliveryAgents(agents);
      setFilteredAgents(agents);
    } catch (error) {
      console.error("Error fetching delivery agents:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Animation effect
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchDeliveryAgents();
  }, []);

  // Handle search and filtering
  useEffect(() => {
    let results = deliveryAgents;
    
    // Apply status filter
    if (filterStatus !== "all") {
      results = results.filter(agent => agent.status === filterStatus);
    }
    
    // Apply search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        agent => 
          agent.firstName.toLowerCase().includes(query) || 
          agent.lastName.toLowerCase().includes(query)
      );
    }
    
    setFilteredAgents(results);
  }, [searchQuery, filterStatus, deliveryAgents]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDeliveryAgents();
  };

  const updateAgentStatus = async (agentId, newStatus) => {
    try {
      await updateDoc(doc(db, "users", agentId), {
        status: newStatus,
        lastUpdated: new Date()
      });

      // Update local state
      setDeliveryAgents(prev => 
        prev.map(agent => 
          agent.id === agentId ? {...agent, status: newStatus} : agent
        )
      );

      // If the selected agent is the one being updated, update the selected agent
      if (selectedAgent && selectedAgent.id === agentId) {
        setSelectedAgent(prev => ({...prev, status: newStatus}));
      }

      return true;
    } catch (error) {
      console.error("Error updating agent status:", error);
      return false;
    }
  };

  const handleAssignDelivery = (agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push({
      pathname: "/manager/deliveryOrders",
      params: {
        agentId: agent.id,
        AgentName: agent.firstName,
      }
    });
    setModalVisible(false);
  };

  const handleAgentPress = (agent) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedAgent(agent);
    setModalVisible(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "#10B981";
      case "busy":
        return "#F59E0B";
      case "unavailable":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusBgColor = (status) => {
    switch (status) {
      case "available":
        return "#ECFDF5";
      case "busy":
        return "#FEF3C7";
      case "unavailable":
        return "#FEE2E2";
      default:
        return "#F3F4F6";
    }
  };

  const formatDate = (date) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const EmptyListComponent = () => (
    <View className="flex-1 justify-center items-center py-10">
      <MaterialCommunityIcons 
        name="truck-delivery-outline" 
        size={60} 
        color="#D1D5DB" 
      />
      <Text className="text-gray-400 text-lg mt-4 mb-1">No delivery agents found</Text>
      <Text className="text-gray-400 text-center px-10">
        {searchQuery.trim() !== "" || filterStatus !== "all" 
          ? "Try changing your search or filters" 
          : "Add delivery agents to get started"}
      </Text>
    </View>
  );

  const renderAgentDetails = () => {
    if (!selectedAgent) return null;
    
    return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
        <View className="flex-1 justify-end bg-black/40">
          <LinearGradient
            colors={["#ffffff", "#f3f4f6"]}
            className="rounded-t-3xl p-5 pb-8"
            style={{ 
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -3 },
              shadowOpacity: 0.1,
              shadowRadius: 5,
              elevation: 5
            }}
          >
            {/* Header with close button */}
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-xl font-bold text-gray-800">
                Agent Details
              </Text>
              <TouchableOpacity 
                className="w-9 h-9 rounded-full bg-gray-100 justify-center items-center"
                onPress={() => setModalVisible(false)}
              >
                <MaterialIcons name="close" size={22} color="#4B5563" />
              </TouchableOpacity>
            </View>
            
            {/* Agent info */}
            <View className="flex-row mb-6">
              <View className="mr-4">
                {selectedAgent.photoURL ? (
                  <Image 
                    source={{ uri: selectedAgent.photoURL }} 
                    className="w-20 h-20 rounded-xl"
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-xl justify-center items-center"
                    style={{ backgroundColor: getStatusBgColor(selectedAgent.status) }}
                  >
                    <FontAwesome5 
                      name="user-alt" 
                      size={30} 
                      color={getStatusColor(selectedAgent.status)} 
                    />
                  </View>
                )}
              </View>
              
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-800">
                  {selectedAgent.firstName} {selectedAgent.lastName}
                </Text>
                
                <View className="flex-row items-center mt-1">
                  <MaterialIcons name="phone" size={16} color="#6B7280" />
                  <Text className="ml-2 text-gray-600">
                    {selectedAgent.phone}
                  </Text>
                </View>
                
                <View className="flex-row items-center mt-1">
                  <MaterialIcons name="email" size={16} color="#6B7280" />
                  <Text className="ml-2 text-gray-600">
                    {selectedAgent.email}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* Stats section */}
            <View className="flex-row justify-between bg-white p-4 rounded-xl shadow-sm mb-6">
              <View className="items-center">
                <Text className="text-lg font-bold text-gray-800">
                  {selectedAgent.completedOrders}
                </Text>
                <Text className="text-gray-500 text-xs">
                  Deliveries
                </Text>
              </View>
              
              <View className="items-center">
                <View className="flex-row items-center">
                  <Text className="text-lg font-bold text-gray-800 mr-1">
                    {selectedAgent.rating.toFixed(1)}
                  </Text>
                  <MaterialIcons name="star" size={18} color="#F59E0B" />
                </View>
                <Text className="text-gray-500 text-xs">
                  Rating
                </Text>
              </View>
              
              <View className="items-center">
                <Text 
                  className="text-lg font-bold capitalize"
                  style={{ color: getStatusColor(selectedAgent.status) }}
                >
                  {selectedAgent.status}
                </Text>
                <Text className="text-gray-500 text-xs">
                  Status
                </Text>
              </View>
            </View>
            
            {/* Last activity */}
            <View className="bg-white p-4 rounded-xl shadow-sm mb-6">
              <Text className="text-gray-800 font-medium mb-2">
                Last Active:
              </Text>
              <Text className="text-gray-600">
                {formatDate(selectedAgent.lastActive)}
              </Text>
            </View>
            
            {/* Action buttons */}
            <View className="flex-row space-x-3">
              <TouchableOpacity
                className="flex-1 bg-indigo-600 py-3 rounded-xl flex-row justify-center items-center"
                onPress={() => handleAssignDelivery(selectedAgent)}
              >
                <MaterialCommunityIcons name="truck-delivery-outline" size={20} color="white" />
                <Text className="text-white font-bold text-base ml-2">
                  Assign Delivery
                </Text>
              </TouchableOpacity>
              
              {selectedAgent.status !== "available" ? (
                <TouchableOpacity
                  className="flex-1 bg-emerald-500 py-3 rounded-xl flex-row justify-center items-center"
                  onPress={() => {
                    updateAgentStatus(selectedAgent.id, "available");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                >
                  <MaterialIcons name="check-circle-outline" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Set Available
              </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="flex-1 bg-amber-500 py-3 rounded-xl flex-row justify-center items-center"
                  onPress={() => {
                    updateAgentStatus(selectedAgent.id, "unavailable");
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }}
                >
                  <MaterialIcons name="block" size={20} color="white" />
                  <Text className="text-white font-bold text-base ml-2">
                    Set Unavailable
              </Text>
                </TouchableOpacity>
              )}
            </View>
          </LinearGradient>
        </View>
      </Modal>
    );
  };
  
  return (
    <View className="flex-1 bg-gray-50">
      <HomeHeader title="Delivery Management" />
      
      {/* Search and filter section */}
      <View className="px-4 pt-2 pb-4">
        <View className="flex-row items-center bg-white rounded-lg shadow-sm px-3 mb-4">
          <MaterialIcons name="search" size={22} color="#9CA3AF" />
          <TextInput
            className="flex-1 py-2 px-2 text-gray-800"
            placeholder="Search delivery agents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <MaterialIcons name="clear" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
        <View className="flex-row mb-2">
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 20 }}
          >
            {["all", "available", "busy", "unavailable"].map((status) => (
              <TouchableOpacity
                key={status}
                className={`px-4 py-2 rounded-full mr-2 ${
                  filterStatus === status 
                    ? "bg-blue-500" 
                    : "bg-white border border-gray-200"
                }`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setFilterStatus(status);
                }}
              >
                <Text
                  className={`font-medium capitalize ${
                    filterStatus === status ? "text-white" : "text-gray-700"
                  }`}
                >
                  {status === "all" ? "All Agents" : status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
            </View>
          </View>
      
      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text className="mt-4 text-gray-500">Loading delivery agents...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AgentCard 
              item={item} 
              index={index} 
              onPress={handleAgentPress}
              fadeAnim={fadeAnim}
            />
          )}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
          ListEmptyComponent={EmptyListComponent}
        />
      )}
      
      {renderAgentDetails()}
    </View>
  );
}
