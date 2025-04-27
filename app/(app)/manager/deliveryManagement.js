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
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5, Feather, AntDesign } from "@expo/vector-icons";
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
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);
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
          uid: data.uid || "",
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          fullName: data.fullName || "",
          gender: data.gender || "",
          dateOfBirth: data.dateOfBirth || "",
          nationalId: data.nationalId || "",
          phone: data.phone || "",
          email: data.email || "",
          address: data.address || "",
          status: data.status || "unavailable",
          rating: data.rating || 0,
          completedOrders: data.completedOrders || 0,
          photoURL: data.photoURL || null,
          location: data.location || null,
          lastActive: data.lastUpdated?.toDate() || null,
          currentOrderId: data.currentOrderId || null,
          emergencyContact: data.emergencyContact || null,
          employmentDetails: data.employmentDetails || null,
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

  // Reset showFullDetails when modal is closed
  useEffect(() => {
    if (!modalVisible) {
      setShowFullDetails(false);
    }
  }, [modalVisible]);

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

  // Render filter modal
  const renderFilterModal = () => {
    return (
      <Modal
        visible={filterModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <TouchableOpacity 
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <View style={{ 
            position: 'absolute', 
            top: 120, 
            right: 20,
            backgroundColor: 'white',
            borderRadius: 12,
            padding: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,
            elevation: 5
          }}>
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setFilterStatus('all');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center mr-3">
                <Feather name="users" size={14} color="#6B7280" />
              </View>
              <Text className={`font-medium ${filterStatus === 'all' ? 'text-blue-600' : 'text-gray-800'}`}>All Agents</Text>
              {filterStatus === 'all' && <MaterialIcons name="check" size={20} color="#4F46E5" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setFilterStatus('available');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-green-100 items-center justify-center mr-3">
                <Feather name="check-circle" size={14} color="#10B981" />
              </View>
              <Text className={`font-medium ${filterStatus === 'available' ? 'text-green-600' : 'text-gray-800'}`}>Available</Text>
              {filterStatus === 'available' && <MaterialIcons name="check" size={20} color="#10B981" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setFilterStatus('busy');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-amber-100 items-center justify-center mr-3">
                <Feather name="clock" size={14} color="#F59E0B" />
              </View>
              <Text className={`font-medium ${filterStatus === 'busy' ? 'text-amber-600' : 'text-gray-800'}`}>Busy</Text>
              {filterStatus === 'busy' && <MaterialIcons name="check" size={20} color="#F59E0B" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setFilterStatus('unavailable');
                setFilterModalVisible(false);
              }}
            >
              <View className="w-6 h-6 rounded-full bg-red-100 items-center justify-center mr-3">
                <Feather name="x-circle" size={14} color="#EF4444" />
              </View>
              <Text className={`font-medium ${filterStatus === 'unavailable' ? 'text-red-600' : 'text-gray-800'}`}>Unavailable</Text>
              {filterStatus === 'unavailable' && <MaterialIcons name="check" size={20} color="#EF4444" style={{ marginLeft: 8 }} />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Render agent details modal
  const renderAgentDetails = () => {
    if (!selectedAgent) return null;
    
    const statusStyle = {
      bg: getStatusBgColor(selectedAgent.status),
      text: getStatusColor(selectedAgent.status),
      label: selectedAgent.status.charAt(0).toUpperCase() + selectedAgent.status.slice(1)
    };
    
    return (
        <Modal
        visible={modalVisible}
          transparent={true}
        animationType="fade"
          onRequestClose={() => setModalVisible(false)}
        >
        <View style={{ 
          flex: 1, 
          backgroundColor: 'rgba(0,0,0,0.6)', 
          justifyContent: 'center', 
          alignItems: 'center',
          padding: 16
        }}>
          <Animated.View 
            style={{ 
              backgroundColor: 'white',
              borderRadius: 16,
              width: '92%',
              maxHeight: '85%',
              opacity: fadeAnim,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 8,
              elevation: 10
            }}
          >
            <View className="py-4 px-5 border-b border-gray-100 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-gray-800">Delivery Agent Details</Text>
              <TouchableOpacity 
                className="p-2 rounded-full bg-gray-100"
                onPress={() => setModalVisible(false)}
              >
                <AntDesign name="close" size={22} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              className="px-5 py-4" 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Profile Header */}
              <View className="flex-row items-center mb-5">
                {selectedAgent.photoURL ? (
                  <Image 
                    source={{ uri: selectedAgent.photoURL }} 
                    className="w-20 h-20 rounded-full mr-4 border-2 border-indigo-500"
                    style={{ backgroundColor: '#E5E7EB' }}
                  />
                ) : (
                  <View 
                    className="w-20 h-20 rounded-full mr-4 items-center justify-center border-2 border-indigo-500" 
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <FontAwesome5 
                      name="user-alt" 
                      size={28} 
                      color={statusStyle.text} 
                    />
                  </View>
                )}
                <View>
                  <Text className="text-2xl font-bold text-gray-800">
                    {selectedAgent.firstName} {selectedAgent.lastName}
                  </Text>
                  <View
                    className="px-3 py-1 rounded-full mt-1 self-start"
                    style={{ backgroundColor: statusStyle.bg }}
                  >
                    <Text
                      className="text-sm font-medium"
                      style={{ color: statusStyle.text }}
                    >
                      {statusStyle.label}
                    </Text>
                  </View>
                </View>
              </View>
              
              {/* Essential Information (Always Visible) */}
              <View className="bg-gray-50 rounded-xl p-5 mb-5">
                <Text className="text-lg font-bold text-gray-800 mb-4">Essential Information</Text>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Feather name="mail" size={18} color="#3B82F6" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Email</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedAgent.email || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row items-center mb-4">
                  <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                    <Feather name="phone" size={18} color="#10B981" />
                  </View>
                  <View>
                    <Text className="text-sm font-medium text-gray-500">Phone</Text>
                    <Text className="text-base font-semibold text-gray-800">{selectedAgent.phone || 'N/A'}</Text>
                  </View>
                </View>
                
                <View className="flex-row justify-between mb-4">
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                      <MaterialIcons name="delivery-dining" size={18} color="#8B5CF6" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-500">Completed Deliveries</Text>
                      <Text className="text-base font-semibold text-gray-800">{selectedAgent.completedOrders}</Text>
                    </View>
                  </View>
                  
                  <View className="flex-row items-center">
                    <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                      <MaterialIcons name="star" size={18} color="#F59E0B" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-500">Rating</Text>
                      <Text className="text-base font-semibold text-gray-800">{selectedAgent.rating.toFixed(1)}/5.0</Text>
                </View>
              </View>
            </View>
            
                {/* Current Order (if exists) */}
                {selectedAgent.currentOrderId && (
                  <View className="flex-row items-center mb-4">
                    <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                      <MaterialIcons name="local-shipping" size={18} color="#10B981" />
                    </View>
                    <View>
                      <Text className="text-sm font-medium text-gray-500">Current Order ID</Text>
                      <Text className="text-base font-semibold text-gray-800">{selectedAgent.currentOrderId}</Text>
                    </View>
                  </View>
                )}
                
                {/* Show More Button */}
                <TouchableOpacity
                  className="mt-2 bg-indigo-50 py-3 rounded-lg flex-row justify-center items-center"
                  onPress={() => setShowFullDetails(!showFullDetails)}
                >
                  <Text className="text-indigo-600 font-medium">
                    {showFullDetails ? "Show Less" : "Show More Details"}
                </Text>
                  <MaterialIcons 
                    name={showFullDetails ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                    size={20} 
                    color="#4F46E5" 
                    style={{ marginLeft: 5 }} 
                  />
                </TouchableOpacity>
              </View>
              
              {/* Additional Details (Only visible when showFullDetails is true) */}
              {showFullDetails && (
                <>
                  {/* Personal Information */}
                  <View className="bg-gray-50 rounded-xl p-5 mb-5">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Personal Information</Text>
                    
                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                        <Feather name="user" size={18} color="#6366F1" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">Full Name</Text>
                        <Text className="text-base font-semibold text-gray-800">
                          {selectedAgent.fullName || `${selectedAgent.firstName} ${selectedAgent.lastName}`}
                        </Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                        <Feather name="credit-card" size={18} color="#8B5CF6" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">National ID</Text>
                        <Text className="text-base font-semibold text-gray-800">{selectedAgent.nationalId || 'N/A'}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-pink-100 items-center justify-center mr-3">
                        <Feather name="calendar" size={18} color="#EC4899" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">Date of Birth</Text>
                        <Text className="text-base font-semibold text-gray-800">{selectedAgent.dateOfBirth || 'N/A'}</Text>
                      </View>
                    </View>
                    
                    <View className="flex-row items-center mb-4">
                      <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                        <Feather name="users" size={18} color="#3B82F6" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">Gender</Text>
                        <Text className="text-base font-semibold text-gray-800">
                          {selectedAgent.gender ? selectedAgent.gender.charAt(0).toUpperCase() + selectedAgent.gender.slice(1) : 'N/A'}
                        </Text>
                      </View>
                    </View>
                    
                <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-amber-100 items-center justify-center mr-3">
                        <Feather name="map-pin" size={18} color="#F59E0B" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">Address</Text>
                        <Text className="text-base font-semibold text-gray-800">{selectedAgent.address || 'N/A'}</Text>
                      </View>
                    </View>
                  </View>
                  
                  {/* Emergency Contact */}
                  {selectedAgent.emergencyContact && (
                    <View className="bg-gray-50 rounded-xl p-5 mb-5">
                      <Text className="text-lg font-bold text-gray-800 mb-4">Emergency Contact</Text>
                      
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                          <Feather name="user" size={18} color="#EF4444" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Name</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.emergencyContact?.name || 'N/A'}
                          </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                          <Feather name="phone" size={18} color="#EF4444" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Phone</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.emergencyContact?.phone || 'N/A'}
                  </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                          <Feather name="users" size={18} color="#EF4444" />
                </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Relationship</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.emergencyContact?.relationship || 'N/A'}
                </Text>
              </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Employment Details */}
                  {selectedAgent.employmentDetails && (
                    <View className="bg-gray-50 rounded-xl p-5 mb-5">
                      <Text className="text-lg font-bold text-gray-800 mb-4">Employment Details</Text>
                      
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="briefcase" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Department</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.employmentDetails?.department || 'N/A'}
                </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="award" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Position</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.employmentDetails?.position || 'Delivery Agent'}
                </Text>
              </View>
            </View>
            
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="calendar" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Joining Date</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.employmentDetails?.joiningDate || 'N/A'}
              </Text>
                        </View>
                      </View>
                      
                      <View className="flex-row items-center mb-4">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="credit-card" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Bank Account</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.employmentDetails?.bankAccount || 'N/A'}
              </Text>
                        </View>
            </View>
            
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                          <Feather name="dollar-sign" size={18} color="#3B82F6" />
                        </View>
                        <View>
                          <Text className="text-sm font-medium text-gray-500">Salary</Text>
                          <Text className="text-base font-semibold text-gray-800">
                            {selectedAgent.employmentDetails?.salary ? `${selectedAgent.employmentDetails.salary} Birr` : 'N/A'}
                </Text>
                        </View>
                      </View>
                    </View>
                  )}
                  
                  {/* Performance Stats */}
                  <View className="bg-gray-50 rounded-xl p-5 mb-5">
                    <Text className="text-lg font-bold text-gray-800 mb-4">Additional Performance</Text>
                    
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center mr-3">
                        <Feather name="clock" size={18} color="#6366F1" />
                      </View>
                      <View>
                        <Text className="text-sm font-medium text-gray-500">Last Active</Text>
                        <Text className="text-base font-semibold text-gray-800">{formatDate(selectedAgent.lastActive)}</Text>
                      </View>
                    </View>
                  </View>
                </>
              )}
              
              {/* Action Buttons */}
              <View className="flex-row justify-between space-x-6 mb-6">
                <TouchableOpacity
                  className="flex-1 bg-emerald-600 py-3 px-3 rounded-lg flex-row justify-center items-center"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    handleAssignDelivery(selectedAgent);
                  }}
                >
                  <MaterialIcons name="assignment" size={20} color="white" />
                  <Text className="ml-2 text-white font-bold text-base">Assign</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="flex-1 bg-indigo-500 py-3 px-3 rounded-lg flex-row justify-center items-center"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setModalVisible(false);
                    
                    // Pass params for chat
                    const params = {
                      uid: selectedAgent.id,
                      recipientId: selectedAgent.id,
                      name: `${selectedAgent.firstName} ${selectedAgent.lastName}`,
                      recipientName: `${selectedAgent.firstName} ${selectedAgent.lastName}`,
                      email: selectedAgent.email || ''
                    };
                    
                    // Convert params to query string
                    const queryString = Object.entries(params)
                      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
                      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
                      .join('&');
                      
                    router.push(`/(app)/chatRoom?${queryString}`);
                  }}
                >
                  <MaterialIcons name="chat" size={20} color="white" />
                  <Text className="ml-2 text-white font-bold text-base">Message</Text>
                </TouchableOpacity>
            </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };
  
  return (
    <View className="flex-1 bg-gray-50">
      <HomeHeader title="Delivery Management" />
      
      {/* Search and filter section */}
      <View className="flex-row items-center justify-between bg-white px-4 py-3 border-b border-gray-200">
        <View className="flex-row items-center flex-1 bg-gray-100 rounded-lg px-3 py-2 mr-2">
          <Feather name="search" size={20} color="#9CA3AF" />
          <TextInput
            className="flex-1 ml-2 text-gray-800"
            placeholder="Search delivery agents..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Feather name="x" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
        
              <TouchableOpacity
          className="bg-gray-100 p-3 rounded-lg"
          onPress={() => setFilterModalVisible(true)}
        >
          <Feather 
            name="filter" 
            size={20} 
            color={filterStatus !== 'all' ? '#4F46E5' : '#6B7280'} 
          />
              </TouchableOpacity>
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
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, paddingTop: 12 }}
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
      {renderFilterModal()}
    </View>
  );
}
