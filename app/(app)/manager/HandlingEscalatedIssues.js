import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  Animated,
  SafeAreaView,
  ScrollView,
  StatusBar,
  RefreshControl,
  Image,
  ActivityIndicator,
  TextInput,
  Modal
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";
import { escalatedIssues } from "../../global/data";

// Issue Card Component
const IssueCard = ({ item, index, onResolve, onRespond, onViewDetails }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Add pulse animation for high priority issues
    if (item.priority === "high") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.03,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
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

  // Priority color management
  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#EF4444";
      case "medium":
        return "#F59E0B";
      case "low":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getPriorityBgColor = (priority) => {
    switch (priority) {
      case "high":
        return "#FEE2E2";
      case "medium":
        return "#FEF3C7";
      case "low":
        return "#ECFDF5";
      default:
        return "#F3F4F6";
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case "high":
        return <MaterialIcons name="priority-high" size={16} color="#EF4444" />;
      case "medium":
        return <MaterialIcons name="warning" size={16} color="#F59E0B" />;
      case "low":
        return <MaterialIcons name="info" size={16} color="#10B981" />;
      default:
        return <MaterialIcons name="help" size={16} color="#6B7280" />;
    }
  };

  // Get escalation time
  const getTimeAgo = () => {
    return item.timeAgo || "2 days ago";
  };

  return (
    <Animated.View
      className="mb-4"
      style={{
        opacity: opacityAnim,
        transform: [
          { scale: item.priority === "high" ? pulseAnim : scaleAnim },
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
          elevation: 3,
          borderLeftWidth: 4,
          borderLeftColor: getPriorityColor(item.priority),
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
        onPress={() => onViewDetails(item)}
      >
        <View className="p-4">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-3">
            <View className="flex-row items-center">
              <View
                className="px-3 py-1 rounded-full flex-row items-center"
                style={{ backgroundColor: getPriorityBgColor(item.priority) }}
              >
                {getPriorityIcon(item.priority)}
                <Text
                  className="text-xs font-bold capitalize ml-1"
                  style={{ color: getPriorityColor(item.priority) }}
                >
                  {item.priority} Priority
                </Text>
              </View>
            </View>
            <Text className="text-gray-400 text-xs">{getTimeAgo()}</Text>
          </View>

          {/* Issue Title */}
          <Text className="text-lg font-bold text-gray-800 mb-2">
            {item.issue}
          </Text>

          {/* Customer Info */}
          <View className="flex-row items-center mb-2">
            <FontAwesome5 name="user" size={12} color="#6B7280" />
            <Text className="text-gray-600 ml-2">
              Customer: <Text className="font-medium">{item.customer}</Text>
            </Text>
          </View>

          {/* Escalated By */}
          <View className="flex-row items-center mb-3">
            <MaterialIcons name="arrow-upward" size={12} color="#6B7280" />
            <Text className="text-gray-600 ml-2">
              Escalated by: <Text className="font-medium">{item.escalatedBy}</Text>
            </Text>
          </View>

          {/* Description */}
          {item.description && (
            <View className="bg-gray-50 p-3 rounded-lg mb-3">
              <Text className="text-gray-700">{item.description}</Text>
            </View>
          )}

          {/* Additional visual cue for swiping/interactivity */}
          <View className="absolute top-2 right-2 opacity-50">
            <MaterialIcons name="touch-app" size={16} color="#6B7280" />
          </View>

          {/* Add message preview if available */}
          {item.messages && item.messages.length > 0 && (
            <View className="bg-gray-50 p-3 rounded-lg mb-3 border-l-2 border-indigo-300">
              <Text className="text-gray-500 text-xs mb-1">Latest message:</Text>
              <Text className="text-gray-700" numberOfLines={2}>
                {item.messages[item.messages.length - 1].text}
              </Text>
            </View>
          )}

          {/* Action Buttons */}
          <View className="flex-row mt-2">
            <TouchableOpacity
              className="bg-indigo-600 py-2 px-3 rounded-lg items-center flex-row mr-2 flex-1"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRespond(item);
              }}
            >
              <MaterialIcons name="chat" size={16} color="white" />
              <Text className="text-white font-semibold text-sm ml-1">Respond</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="bg-green-500 py-2 px-3 rounded-lg items-center flex-row flex-1"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Success);
                onResolve(item.id);
              }}
            >
              <MaterialIcons name="check" size={16} color="white" />
              <Text className="text-white font-semibold text-sm ml-1">Resolve</Text>
            </TouchableOpacity>
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

// Message History Item Component
const MessageItem = ({ message, isCustomer }) => {
  return (
    <View 
      className={`p-3 rounded-lg mb-2 max-w-[85%] ${
        isCustomer 
          ? "bg-gray-100 self-start" 
          : "bg-indigo-100 self-end"
      }`}
    >
      <Text 
        className={`text-sm ${
          isCustomer ? "text-gray-800" : "text-indigo-800"
        }`}
      >
        {message.text}
      </Text>
      <Text 
        className={`text-xs mt-1 ${
          isCustomer ? "text-gray-500" : "text-indigo-500"
        }`}
      >
        {message.time} • {message.sender}
      </Text>
    </View>
  );
};

export default function HandleEscalatedIssues() {
  const [issues, setIssues] = useState(escalatedIssues);
  const [refreshing, setRefreshing] = useState(false);
  const [filterPriority, setFilterPriority] = useState("all");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  // Add state for detail modal
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  // Stats calculation
  const stats = {
    high: issues.filter(issue => issue.priority === "high").length,
    medium: issues.filter(issue => issue.priority === "medium").length,
    low: issues.filter(issue => issue.priority === "low").length,
    total: issues.length
  };

  // Add sample messages to issues if they don't have any
  useEffect(() => {
    // This would normally be part of the data, but adding for demo purposes
    setIssues(prev => prev.map(issue => ({
      ...issue,
      description: issue.description || "Customer reported issues with their recent order. The delivery was delayed and some items were missing. This requires immediate attention from management.",
      timeAgo: issue.timeAgo || "2 days ago",
      messages: issue.messages || [
        {
          id: 1,
          sender: "Customer",
          text: "I ordered 10 items but only received 8. Also, the delivery was 2 hours late!",
          time: "2 days ago",
          isCustomer: true
        },
        {
          id: 2,
          sender: "Customer Service Agent",
          text: "I apologize for the inconvenience. I'll check what happened with your order right away.",
          time: "2 days ago",
          isCustomer: false
        },
        {
          id: 3,
          sender: "Customer",
          text: "This is unacceptable! I've been a loyal customer for years. I demand a refund!",
          time: "2 days ago",
          isCustomer: true
        },
        {
          id: 4,
          sender: "Customer Service Agent",
          text: "I understand your frustration. I'm escalating this to our management team for immediate attention.",
          time: "2 days ago",
          isCustomer: false
        }
      ]
    })));
  }, []);

  // Filter issues by priority
  const filteredIssues = filterPriority === "all"
    ? issues
    : issues.filter(issue => issue.priority === filterPriority);

  const handleResolve = (issueId) => {
    Alert.alert(
      "Confirm Resolution",
      "Are you sure you want to mark this issue as resolved?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes",
          style: "default",
          onPress: () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setIssues((prevIssues) =>
              prevIssues.filter((issue) => issue.id !== issueId)
            );
            // Close modal if open
            if (detailModalVisible && selectedIssue && selectedIssue.id === issueId) {
              setDetailModalVisible(false);
            }
            Alert.alert("Success", "Issue has been resolved successfully.");
          },
        },
      ]
    );
  };

  const handleRespond = (issue) => {
    setSelectedIssue(issue);
    setDetailModalVisible(true);
  };

  const handleViewDetails = (issue) => {
    setSelectedIssue(issue);
    setDetailModalVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedIssue) return;
    
    // Create new message
    const newMessage = {
      id: Date.now(),
      sender: "Manager",
      text: messageInput.trim(),
      time: "Just now",
      isCustomer: false
    };
    
    // Add message to issue
    const updatedIssues = issues.map(issue => 
      issue.id === selectedIssue.id
        ? { ...issue, messages: [...issue.messages, newMessage] }
        : issue
    );
    
    setIssues(updatedIssues);
    setSelectedIssue({...selectedIssue, messages: [...selectedIssue.messages, newMessage]});
    setMessageInput('');
    
    // Provide feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Render the detailed modal view
  const renderDetailModal = () => {
    if (!selectedIssue) return null;
    
    return (
      <Modal
        isVisible={detailModalVisible}
        onBackdropPress={() => setDetailModalVisible(false)}
        onSwipeComplete={() => setDetailModalVisible(false)}
        swipeDirection="down"
        propagateSwipe
        style={{ margin: 0, justifyContent: 'flex-end' }}
        backdropTransitionOutTiming={0}
        avoidKeyboard
      >
        <View className="bg-white rounded-t-3xl h-5/6">
          {/* Handle for swiping down */}
          <View className="w-full items-center py-2">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>
          
          {/* Header */}
          <View className="p-4 border-b border-gray-200 flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: getPriorityColor(selectedIssue.priority) }}
              />
              <Text className="text-lg font-bold text-gray-800">
                {selectedIssue.issue}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <MaterialIcons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          
          {/* Issue details */}
          <View className="p-4 border-b border-gray-200">
            <View className="flex-row justify-between mb-2">
              <View className="flex-row items-center">
                <FontAwesome5 name="user" size={14} color="#6B7280" />
                <Text className="text-gray-700 ml-2">
                  {selectedIssue.customer}
                </Text>
              </View>
              <View
                className="px-3 py-1 rounded-full flex-row items-center"
                style={{ backgroundColor: getPriorityBgColor(selectedIssue.priority) }}
              >
                {getPriorityIcon(selectedIssue.priority)}
                <Text
                  className="text-xs font-bold capitalize ml-1"
                  style={{ color: getPriorityColor(selectedIssue.priority) }}
                >
                  {selectedIssue.priority} Priority
                </Text>
              </View>
            </View>
            
            <View className="flex-row items-center mb-3">
              <MaterialIcons name="arrow-upward" size={14} color="#6B7280" />
              <Text className="text-gray-600 ml-2">
                Escalated by: <Text className="font-medium">{selectedIssue.escalatedBy}</Text>
              </Text>
            </View>
            
            <View className="bg-gray-50 p-3 rounded-lg">
              <Text className="text-gray-700">{selectedIssue.description}</Text>
            </View>
          </View>
          
          {/* Message history */}
          <ScrollView 
            className="p-4 flex-1"
            contentContainerStyle={{ paddingBottom: 16 }}
          >
            <Text className="text-gray-700 font-bold mb-3">
              Message History
            </Text>
            
            <View className="flex-1">
              {selectedIssue.messages && selectedIssue.messages.map(message => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  isCustomer={message.isCustomer} 
                />
              ))}
            </View>
          </ScrollView>
          
          {/* Message input */}
          <View className="p-4 border-t border-gray-200 flex-row">
            <TextInput
              className="flex-1 bg-gray-100 rounded-full px-4 py-2 mr-2"
              placeholder="Type your response..."
              value={messageInput}
              onChangeText={setMessageInput}
              multiline
            />
            <TouchableOpacity
              className={`w-10 h-10 rounded-full justify-center items-center ${
                messageInput.trim() ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
              onPress={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <MaterialIcons 
                name="send" 
                size={18} 
                color={messageInput.trim() ? "white" : "#9CA3AF"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* Action buttons */}
          <View className="p-4 flex-row border-t border-gray-200">
            <TouchableOpacity
              className="flex-1 bg-gray-200 py-3 rounded-lg items-center flex-row justify-center mr-2"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                Alert.alert("Call Customer", "Initiating call to customer...");
              }}
            >
              <MaterialIcons name="call" size={18} color="#4B5563" />
              <Text className="text-gray-700 font-semibold ml-1">Call</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              className="flex-1 bg-green-500 py-3 rounded-lg items-center flex-row justify-center"
              onPress={() => handleResolve(selectedIssue.id)}
            >
              <MaterialIcons name="check" size={18} color="white" />
              <Text className="text-white font-semibold ml-1">Resolve Issue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />
      <HomeHeader title="Escalated Issues" />
      
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
          {/* Stats cards */}
          <View className="mb-6">
            <View className="flex-row mb-3">
              <StatCard
                title="High Priority"
                value={stats.high}
                icon={<MaterialIcons name="priority-high" size={16} color="#EF4444" />}
                color="#EF4444"
                index={0}
              />
              <StatCard
                title="Medium Priority"
                value={stats.medium}
                icon={<MaterialIcons name="warning" size={16} color="#F59E0B" />}
                color="#F59E0B"
                index={1}
              />
              <StatCard
                title="Low Priority"
                value={stats.low}
                icon={<MaterialIcons name="info" size={16} color="#10B981" />}
                color="#10B981"
                index={2}
              />
            </View>
          </View>

          {/* Priority filter tabs */}
          <View className="mb-4">
            <Text className="text-lg font-bold text-gray-800 mb-3">
              Filter by Priority
            </Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              className="mb-2"
            >
              {["all", "high", "medium", "low"].map((priority) => (
                <TouchableOpacity
                  key={priority}
                  className={`px-4 py-2 rounded-full mr-2 ${
                    filterPriority === priority 
                      ? "bg-indigo-600" 
                      : "bg-white border border-gray-200"
                  }`}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFilterPriority(priority);
                  }}
                >
                  <Text
                    className={`font-medium capitalize ${
                      filterPriority === priority ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {priority === "all" ? "All Issues" : `${priority} Priority`}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* Issues list */}
          <View>
            {filteredIssues.length > 0 ? (
              filteredIssues.map((item, index) => (
                <IssueCard
                  key={item.id}
                  item={item}
                  index={index}
                  onResolve={handleResolve}
                  onRespond={handleRespond}
                  onViewDetails={handleViewDetails}
                />
              ))
            ) : (
              <View className="justify-center items-center py-8">
                <MaterialIcons name="done-all" size={64} color="#D1D5DB" />
                <Text className="text-gray-500 text-lg font-medium mt-2">No escalated issues</Text>
                <Text className="text-gray-400 text-center mt-1">
                  {filterPriority !== "all" 
                    ? `No ${filterPriority} priority issues found` 
                    : "All issues have been resolved"}
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </Animated.View>
      
      {/* Detail Modal */}
      {renderDetailModal()}
    </SafeAreaView>
  );
}
