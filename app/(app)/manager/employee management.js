import React, { useEffect, useRef, useState } from "react";
import { 
  SafeAreaView, 
  ScrollView, 
  View, 
  Text, 
  TouchableOpacity, 
  Animated, 
  Dimensions
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";

const { width } = Dimensions.get("window");

export default function EmployeeManagement() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [selectedTab, setSelectedTab] = useState("all");
  const [expandedCard, setExpandedCard] = useState(null);

  // Animation setup
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, []);

  const menuOptions = [
    {
      id: 1,
      title: "Delivery Agents",
      subtitle: "Manage & Assign Deliveries",
      icon: "truck-delivery",
      iconType: "MaterialCommunityIcons",
      navigate: "/manager/deliveryManagement",
      gradient: ["#4F46E5", "#6366F1"],
      count: 15,
      category: "field"
    },
    {
      id: 2,
      title: "Customer Support",
      subtitle: "Manage Support Team",
      icon: "account-supervisor",
      iconType: "MaterialCommunityIcons",
      navigate: "/manager/customerAssistance",
      gradient: ["#10B981", "#34D399"],
      count: 12,
      category: "support"
    },
    {
      id: 3,
      title: "Stock Managers",
      subtitle: "Inventory Management Team",
      icon: "package-variant-closed",
      iconType: "MaterialCommunityIcons",
      navigate: "/manager/inventoryManagement",
      gradient: ["#F59E0B", "#FBBF24"],
      count: 8,
      category: "warehouse"
    },
    {
      id: 6,
      title: "Managers",
      subtitle: "Department Leadership",
      icon: "badge-account",
      iconType: "MaterialCommunityIcons",
      navigate: "/",
      gradient: ["#2563EB", "#60A5FA"],
      count: 5,
      category: "management"
    },
    {
      id: 7,
      title: "Admin",
      subtitle: "System Administration",
      icon: "shield-account",
      iconType: "MaterialCommunityIcons",
      navigate: "/",
      gradient: ["#9333EA", "#A855F7"],
      count: 3,
      category: "management"
    },
  ];

  const filteredOptions = selectedTab === "all" 
    ? menuOptions 
    : menuOptions.filter(option => option.category === selectedTab);

  const renderIcon = (option) => {
    if (option.iconType === "MaterialCommunityIcons") {
      return <MaterialCommunityIcons name={option.icon} size={28} color="white" />;
    }
    return <Ionicons name={option.icon} size={28} color="white" />;
  };

  const handleCardPress = (id) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedCard(expandedCard === id ? null : id);
  };

  const handleNavigate = (route) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(route);
  };

  // Filter tabs for employee categories
  const categoryTabs = [
    { key: "all", label: "All Teams", icon: "apps" },
    { key: "warehouse", label: "Warehouse", icon: "warehouse" },
    { key: "field", label: "Field", icon: "delivery-dining" },
    { key: "support", label: "Support", icon: "headset" },
    { key: "management", label: "Management", icon: "supervisor-account" },
  ];

  // Updated card component with softer colors
  const EmployeeCard = ({ option, index }) => {
    const scaleAnim = useRef(new Animated.Value(0.95)).current;
    const translateYAnim = useRef(new Animated.Value(50)).current;
    const isExpanded = expandedCard === option.id;
    
    // Soften the gradient colors to reduce color disturbance
    const softerGradients = {
      "#4F46E5": ["#E0E7FF", "#818CF8"],
      "#10B981": ["#ECFDF5", "#6EE7B7"],
      "#F59E0B": ["#FEF3C7", "#FCD34D"],
      "#EF4444": ["#FEE2E2", "#FCA5A5"],
      "#8B5CF6": ["#EDE9FE", "#C4B5FD"],
      "#2563EB": ["#DBEAFE", "#93C5FD"],
      "#9333EA": ["#F3E8FF", "#C084FC"],
    };
    
    // Map the original gradient colors to softer ones
    const softerGradient = option.gradient.map(color => {
      const key = Object.keys(softerGradients).find(key => 
        color.startsWith(key) || color.toLowerCase() === key.toLowerCase()
      );
      return key ? softerGradients[key][1] : color;
    });
    
    useEffect(() => {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 400,
          delay: index * 100,
          useNativeDriver: true
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true
        })
      ]).start();
    }, []);

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

    // Get text color based on the category for consistency
    const getTextColor = () => {
      switch(option.category) {
        case "field": return "#4338CA";
        case "support": return "#047857";
        case "warehouse": return "#B45309";
        case "store": return "#B91C1C";
        case "management": return "#1E40AF";
        default: return "#374151";
      }
    };

    const textColor = getTextColor();

    return (
      <Animated.View 
        className="mb-6 rounded-2xl overflow-hidden shadow-sm w-full"
        style={[
          { 
            transform: [
              { scale: scaleAnim },
              { translateY: translateYAnim }
            ],
            height: isExpanded ? 270 : 140,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
            elevation: 2
          }
        ]}
      >
        <TouchableOpacity
          className="flex-1 rounded-2xl overflow-hidden"
          onPress={() => handleCardPress(option.id)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.9}
        >
          <View className="flex-1 p-5 bg-white" style={{ borderLeftWidth: 5, borderLeftColor: option.gradient[0] }}>
            <View className="flex-row items-center">
              <View className="justify-center items-center mr-5 rounded-2xl w-[60px] h-[60px]" style={{ backgroundColor: `${option.gradient[0]}15` }}>
                {renderIcon(option)}
              </View>
              
              <View className="flex-1">
                <Text className="text-xl font-bold mb-1.5" style={{ color: textColor }}>{option.title}</Text>
                <Text className="text-base text-gray-500">{option.subtitle}</Text>
              </View>

              <View className="ml-3 w-10 h-10 rounded-full justify-center items-center" style={{ backgroundColor: `${option.gradient[0]}20` }}>
                <Text className="text-base font-bold" style={{ color: textColor }}>{option.count}</Text>
              </View>
            </View>

            {isExpanded && (
              <Animated.View className="mt-7 pt-6 border-t border-gray-100">
                <View className="flex-row justify-between mb-6 px-2">
                  <View className="items-center">
                    <Text className="text-xl font-bold mb-1.5" style={{ color: textColor }}>8h</Text>
                    <Text className="text-sm text-gray-500">Avg. Hours</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xl font-bold mb-1.5" style={{ color: textColor }}>92%</Text>
                    <Text className="text-sm text-gray-500">Attendance</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-xl font-bold mb-1.5" style={{ color: textColor }}>4.8/5</Text>
                    <Text className="text-sm text-gray-500">Rating</Text>
                  </View>
                </View>

                <TouchableOpacity 
                  className="rounded-xl py-4 px-5 flex-row justify-center items-center mt-4"
                  style={{ backgroundColor: option.gradient[0] }}
                  onPress={() => handleNavigate(option.navigate)}
                >
                  <Text className="text-base font-bold text-white mr-2">Manage Team</Text>
                  <MaterialIcons name="arrow-forward" size={16} color="white" />
                </TouchableOpacity>
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <Animated.View className="flex-1" style={{ opacity: fadeAnim }}>
        {/* Replace title with HomeHeader */}
        <View className="px-6 pt-5 pb-4">
          <HomeHeader title="Employee Management" />
          
          <View className="rounded-3xl overflow-hidden shadow-sm mb-2 mt-4" style={{
            elevation: 2,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 4,
          }}>
            <LinearGradient
              colors={['#60A5FA', '#3B82F6']}
              start={[0, 0]}
              end={[1, 1]}
              className="rounded-3xl"
            >
              <View className="p-6 flex-row justify-between items-center">
                <View>
                  <Text className="text-xl font-semibold text-white opacity-90">Manage your workforce</Text>
                </View>
                <View className="bg-white bg-opacity-15 rounded-2xl p-4 items-center border border-white border-opacity-20">
                  <Text className="text-2xl font-bold text-white">{menuOptions.reduce((sum, option) => sum + option.count, 0)}</Text>
                  <Text className="text-sm text-white opacity-80 mt-1">Employees</Text>
                </View>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Enhanced Category Tabs with icons */}
        <View className="px-5 mb-4 mt-1">
          <Text className="text-base font-semibold text-gray-700 mb-3">Filter by team type:</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="max-h-[60px]"
            contentContainerClassName="pb-2"
          >
            {categoryTabs.map((tab) => (
            <TouchableOpacity
                key={tab.key}
                className={`flex-row items-center px-[18px] py-3 rounded-full mr-2 border ${
                  selectedTab === tab.key 
                    ? 'bg-blue-500 border-blue-500' 
                    : 'bg-white border-gray-200'
                }`}
              style={{
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: selectedTab === tab.key ? 0.1 : 0.05,
                  shadowRadius: selectedTab === tab.key ? 3 : 2,
                  elevation: selectedTab === tab.key ? 2 : 1,
                }}
                onPress={() => {
                  setSelectedTab(tab.key);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <MaterialIcons 
                  name={tab.icon} 
                  size={18} 
                  color={selectedTab === tab.key ? "white" : "#4B5563"} 
                  className="mr-2" 
                />
                <Text 
                  className={`text-[15px] font-semibold ${
                    selectedTab === tab.key ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {tab.label}
                </Text>
            </TouchableOpacity>
          ))}
          </ScrollView>
        </View>

        {/* Employee Cards */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          className="px-6 pb-10"
        >
          {filteredOptions.map((option, index) => (
            <EmployeeCard key={option.id} option={option} index={index} />
          ))}
          
          {/* Add extra space at the bottom */}
          <View className="h-10" />
      </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}
