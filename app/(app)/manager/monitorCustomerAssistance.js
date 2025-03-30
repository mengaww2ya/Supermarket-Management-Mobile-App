import React, { useState, useEffect, useRef } from "react";
import { 
  SafeAreaView, 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  ScrollView, 
  Alert,
  Animated,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  RefreshControl
} from "react-native";
import { customerQueries, customerAssistants } from "../../global/data";
import { 
  MaterialIcons, 
  Ionicons,
  FontAwesome5, 
  MaterialCommunityIcons
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";

const { width } = Dimensions.get('window');

// Agent Card Component
const AgentCard = ({ item, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Define colors based on status
  const getStatusColor = (status) => {
    switch(status) {
      case "available": return "#10B981";
      case "busy": return "#F59E0B";
      case "offline": return "#6B7280";
      default: return "#6B7280";
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case "available": return "#ECFDF5";
      case "busy": return "#FEF3C7";
      case "offline": return "#F3F4F6";
      default: return "#F3F4F6";
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
        marginRight: 12,
      }}
    >
      <TouchableOpacity
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(item);
        }}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={[getStatusBgColor(item.status), '#ffffff']}
          className="p-4 rounded-xl"
          style={{
            width: 160,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
            elevation: 2,
            borderWidth: 1,
            borderColor: getStatusBgColor(item.status),
          }}
        >
          <View className="items-center">
            <View className="mb-2 bg-white p-2 rounded-full">
              <FontAwesome5 name="user-alt" size={24} color={getStatusColor(item.status)} />
            </View>
            <Text className="text-base font-bold text-gray-800">
              {item.firstName} {item.lastName}
            </Text>
            <View 
              className="mt-2 px-3 py-1 rounded-full"
              style={{ backgroundColor: getStatusBgColor(item.status) }}
            >
              <Text 
                className="text-xs font-medium capitalize"
                style={{ color: getStatusColor(item.status) }}
              >
                {item.status}
              </Text>
            </View>
            <Text className="text-gray-500 text-xs mt-2">
              {item.activeQueries} active queries
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Query Card Component
const QueryCard = ({ item, index, onEscalate, onAssign, onResolve }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 70,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 70,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Handle press animation
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  // Define colors and icons based on status
  const getStatusColor = (status) => {
    switch(status) {
      case "pending": return "#F59E0B";
      case "resolved": return "#10B981";
      case "escalated": return "#EF4444";
      default: return "#6B7280";
    }
  };

  const getStatusBgColor = (status) => {
    switch(status) {
      case "pending": return "#FEF3C7";
      case "resolved": return "#ECFDF5";
      case "escalated": return "#FEE2E2";
      default: return "#F3F4F6";
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case "pending": 
        return <MaterialIcons name="pending-actions" size={16} color="#F59E0B" />;
      case "resolved": 
        return <MaterialIcons name="check-circle" size={16} color="#10B981" />;
      case "escalated": 
        return <MaterialIcons name="priority-high" size={16} color="#EF4444" />;
      default: 
        return <MaterialIcons name="help" size={16} color="#6B7280" />;
    }
  };

  // Calculate time ago
  const getTimeAgo = () => {
    // This would be more sophisticated with actual timestamps
    return item.timeAgo || "3h ago";
  };

  return (
    <Animated.View
      className="mb-4"
      style={{
        opacity: opacityAnim,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ],
      }}
    >
      <TouchableOpacity
        className="bg-white rounded-xl overflow-hidden"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <View className="p-4">
          <View className="flex-row justify-between items-center mb-2">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-gray-800">
                Query #{item.id}
              </Text>
              <View 
                className="ml-3 px-3 py-1 rounded-full flex-row items-center"
                style={{ backgroundColor: getStatusBgColor(item.status) }}
              >
                {getStatusIcon(item.status)}
                <Text 
                  className="text-xs font-medium capitalize ml-1"
                  style={{ color: getStatusColor(item.status) }}
                >
                  {item.status}
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs">
              {getTimeAgo()}
            </Text>
          </View>
          
          <View className="mb-3">
            <Text className="text-gray-900 font-medium">
              {item.customer}
            </Text>
            <Text className="text-gray-700 mt-1">
              {item.issue}
            </Text>
          </View>
          
          <View className="flex-row items-center mt-1 mb-2">
            <MaterialCommunityIcons 
              name="clock-outline" 
              size={14} 
              color="#6B7280" 
            />
            <Text className="text-gray-500 text-xs ml-1">
              {item.queue || "In queue for 45 minutes"}
            </Text>
          </View>
          
          {item.assignedTo && (
            <View className="mb-3 flex-row items-center">
              <Text className="text-gray-600 text-sm">
                Assigned to:
              </Text>
              <Text className="text-gray-800 text-sm font-medium ml-1">
                {item.assignedTo}
              </Text>
            </View>
          )}
          
          <View className="flex-row mt-2">
            {item.status === "pending" && (
              <>
                <TouchableOpacity
                  className="bg-indigo-600 py-2 px-3 rounded-lg items-center flex-row mr-2 flex-1"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onAssign(item.id);
                  }}
                >
                  <MaterialIcons name="person-add" size={16} color="white" />
                  <Text className="text-white font-semibold text-sm ml-1">Assign</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  className="bg-red-500 py-2 px-3 rounded-lg items-center flex-row flex-1"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onEscalate(item.id);
                  }}
                >
                  <MaterialIcons name="arrow-upward" size={16} color="white" />
                  <Text className="text-white font-semibold text-sm ml-1">Escalate</Text>
                </TouchableOpacity>
              </>
            )}
            
            {item.status === "escalated" && (
              <TouchableOpacity
                className="bg-gray-200 py-2 px-3 rounded-lg items-center flex-row flex-1"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert("Escalated", "This issue has already been escalated to senior management.");
                }}
              >
                <MaterialIcons name="priority-high" size={16} color="#4B5563" />
                <Text className="text-gray-700 font-semibold text-sm ml-1">View Details</Text>
              </TouchableOpacity>
            )}
            
            {item.status !== "resolved" && (
              <TouchableOpacity
                className={`${item.status === "pending" ? "bg-green-500 ml-2" : "bg-green-500"} py-2 px-3 rounded-lg items-center flex-row ${item.status === "escalated" ? "ml-2 flex-1" : "flex-1"}`}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
                  onResolve(item.id);
                }}
              >
                <MaterialIcons name="check" size={16} color="white" />
                <Text className="text-white font-semibold text-sm ml-1">Resolve</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Stat Card component
const StatCard = ({ title, value, icon, color, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: 200 + (index * 100),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 700,
        delay: 200 + (index * 100),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View 
      className="flex-1 mx-1" 
      style={{ 
        opacity: opacityAnim,
        transform: [{ scale: scaleAnim }]
      }}
    >
      <LinearGradient
        colors={['#ffffff', '#f8fafc']}
        className="rounded-xl p-3 shadow-sm"
        style={{
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View className="flex-row items-center justify-between mb-1">
          <Text className="text-gray-500 text-xs">{title}</Text>
          <View className="p-1 rounded-full" style={{ backgroundColor: `${color}20` }}>
            {icon}
          </View>
        </View>
        <Text className="text-lg font-bold" style={{ color }}>{value}</Text>
      </LinearGradient>
    </Animated.View>
  );
};

export default function MonitorCustomerAssistance() {
  const [queries, setQueries] = useState(customerQueries);
  const [agents, setAgents] = useState(customerAssistants);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Stats for dashboard
  const stats = {
    pending: queries.filter(q => q.status === "pending").length,
    resolved: queries.filter(q => q.status === "resolved").length,
    escalated: queries.filter(q => q.status === "escalated").length,
    total: queries.length
  };
  
  // Response time average (would be calculated from actual data)
  const averageResponseTime = "18 min";
  
  // Filter queries based on status
  const filteredQueries = filterStatus === "all" 
    ? queries 
    : queries.filter(q => q.status === filterStatus);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  // Simulate refresh
  const onRefresh = () => {
    setRefreshing(true);
    // Simulate a network request
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  };

  const escalateIssue = (queryId) => {
    Alert.alert(
      "Confirm Escalation", 
      "Are you sure you want to escalate this issue to senior management?", 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Escalate",
          style: "destructive",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            setQueries((prevQueries) =>
              prevQueries.map((q) => (q.id === queryId ? { ...q, status: "escalated" } : q))
            );
          },
        },
      ]
    );
  };
  
  const assignIssue = (queryId) => {
    Alert.alert(
      "Assign Issue", 
      "Select an agent to handle this query:", 
      agents
        .filter(agent => agent.status === "available")
        .map(agent => ({
          text: `${agent.firstName} ${agent.lastName}`,
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setQueries((prevQueries) =>
              prevQueries.map((q) => (
                q.id === queryId 
                  ? { ...q, assignedTo: `${agent.firstName} ${agent.lastName}` } 
                  : q
              ))
            );
          }
        }))
        .concat([{ text: "Cancel", style: "cancel" }])
    );
  };
  
  const resolveIssue = (queryId) => {
    Alert.alert(
      "Resolve Issue", 
      "Mark this issue as resolved?", 
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Resolve",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setQueries((prevQueries) =>
              prevQueries.map((q) => (q.id === queryId ? { ...q, status: "resolved" } : q))
            );
          },
        },
      ]
    );
  };
  
  const handleAgentPress = (agent) => {
    Alert.alert(
      `${agent.firstName} ${agent.lastName}`,
      `Status: ${agent.status}\nActive queries: ${agent.activeQueries}`,
      [
        {
          text: "Change Status",
          onPress: () => {
            const statuses = ["available", "busy", "offline"];
            const currentIndex = statuses.indexOf(agent.status);
            const nextStatus = statuses[(currentIndex + 1) % statuses.length];
            
            setAgents(prev => 
              prev.map(a => 
                a.id === agent.id ? { ...a, status: nextStatus } : a
              )
            );
          }
        },
        { text: "Close", style: "cancel" }
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <HomeHeader title="Customer Support Monitoring" />
      
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4F46E5"]}
              tintColor="#4F46E5"
            />
          }
        >
          {/* Dashboard Stats */}
          <View className="mb-6">
            <View className="flex-row mb-3">
              <StatCard
                title="Pending"
                value={stats.pending}
                icon={<MaterialIcons name="pending-actions" size={16} color="#F59E0B" />}
                color="#F59E0B"
                index={0}
              />
              <StatCard
                title="Resolved"
                value={stats.resolved}
                icon={<MaterialIcons name="check-circle" size={16} color="#10B981" />}
                color="#10B981"
                index={1}
              />
              <StatCard
                title="Escalated"
                value={stats.escalated}
                icon={<MaterialIcons name="priority-high" size={16} color="#EF4444" />}
                color="#EF4444"
                index={2}
              />
            </View>
            
            <View className="flex-row">
              <StatCard
                title="Total Queries"
                value={stats.total}
                icon={<MaterialIcons name="chat" size={16} color="#6366F1" />}
                color="#6366F1"
                index={3}
              />
              <StatCard
                title="Avg. Response"
                value={averageResponseTime}
                icon={<MaterialIcons name="timer" size={16} color="#8B5CF6" />}
                color="#8B5CF6"
                index={4}
              />
            </View>
          </View>
          
          {/* Customer Assistance Agents */}
          <View className="mb-6">
            <View className="flex-row justify-between items-center mb-3">
              <Text className="text-lg font-bold text-gray-800">
                Support Agents
              </Text>
              <TouchableOpacity className="flex-row items-center">
                <Text className="text-indigo-600 font-medium mr-1">View All</Text>
                <MaterialIcons name="arrow-forward" size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={agents}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              renderItem={({ item, index }) => (
                <AgentCard 
                  item={item} 
                  index={index}
                  onPress={handleAgentPress}
                />
              )}
            />
          </View>
          
          {/* Filter Tabs */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Customer Queries
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-2"
            >
              {["all", "pending", "resolved", "escalated"].map((status) => (
                <TouchableOpacity
                  key={status}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    filterStatus === status 
                      ? "bg-indigo-600" 
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
                    {status === "all" ? "All Queries" : status}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          
          {/* Customer Queries */}
          <View>
            {loading ? (
              <View className="justify-center items-center py-8">
                <ActivityIndicator size="large" color="#4F46E5" />
                <Text className="text-gray-500 mt-2">Loading queries...</Text>
              </View>
            ) : filteredQueries.length > 0 ? (
              filteredQueries.map((item, index) => (
                <QueryCard 
                  key={item.id} 
                  item={item} 
                  index={index}
                  onEscalate={escalateIssue}
                  onAssign={assignIssue}
                  onResolve={resolveIssue}
                />
              ))
            ) : (
              <View className="justify-center items-center py-8">
                <MaterialIcons name="search-off" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No {filterStatus !== "all" ? filterStatus : ""} queries found</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
