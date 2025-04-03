import React, { useRef, useEffect } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import HomeHeader from "../../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get("window");

// Management Action Items
const actionItems = [
  {
    title: "Employee Management",
    subtitle: "Manage staff & assignments",
    icon: "account-group",
    iconType: "MaterialCommunityIcons",
    color: "#5B6AD8",
    route: "/manager/employee management",
    gradient: ["#F5F7FF", "#EDF0FF"],
    stats: "50 Employees"
  },
  {
    title: "Customer Management",
    subtitle: "View & respond to customers",
    icon: "account-multiple",
    iconType: "MaterialCommunityIcons",
    color: "#25B894",
    route: "/manager/customerManagement",
    gradient: ["#F2FCFA", "#E8F7F4"],
    stats: "5,000 Customers"
  },
  {
    title: "Inventory Management",
    subtitle: "Stock & product monitoring",
    icon: "package-variant-closed",
    iconType: "MaterialCommunityIcons",
    color: "#F59E0B",
    route: "/manager/inventoryManagement",
    gradient: ["#FFF9ED", "#FEF5E7"],
    stats: "1,000 Products"
  },
  {
    title: "Order Management",
    subtitle: "Track & process orders",
    icon: "shopping",
    iconType: "MaterialCommunityIcons",
    color: "#E26698",
    route: "/manager/orderManagement",
    gradient: ["#FEF5F9", "#FCE8F0"],
    stats: "55 Active Orders"
  },
  {
    title: "Promotions & Discounts",
    subtitle: "Manage sales & offers",
    icon: "tag",
    iconType: "MaterialCommunityIcons",
    color: "#7E5AF1",
    route: "/manager/promotionDiscount",
    gradient: ["#F7F4FE", "#F2ECFD"],
    stats: "20 Active Promos"
  },
  {
    title: "Supplier Management",
    subtitle: "Manage vendor relationships",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    color: "#4290EB",
    route: "/manager/suplierManagement",
    gradient: ["#F4F9FF", "#ECF4FC"],
    stats: "20 Suppliers"
  },
  {
    title: "Sales & Revenue",
    subtitle: "Financial performance",
    icon: "chart-line",
    iconType: "MaterialCommunityIcons",
    color: "#3AAEDC",
    route: "/manager/saleRevenueManagement",
    gradient: ["#F0FBFF", "#E6F7FC"],
    stats: "$120K Revenue"
  },
  {
    title: "Alerts & Notifications",
    subtitle: "View important alerts",
    icon: "bell",
    iconType: "MaterialCommunityIcons",
    color: "#EF4444",
    route: "/manager/alertNotificationManagement",
    gradient: ["#FEF2F2", "#FCE9E9"],
    stats: "33 Alerts"
  },
];

// Performance Metrics
const performanceMetrics = [
  {
    title: "Revenue",
    value: "$120K",
    icon: "trending-up",
    iconType: "MaterialIcons",
    change: "+15%",
    status: "positive"
  },
  {
    title: "Orders",
    value: "2,000",
    icon: "shopping-cart",
    iconType: "MaterialIcons",
    change: "+8%",
    status: "positive"
  },
  {
    title: "Profit",
    value: "$30K",
    icon: "attach-money",
    iconType: "MaterialIcons",
    change: "+12%",
    status: "positive"
  },
  {
    title: "Feedback",
    value: "4.8/5",
    icon: "star",
    iconType: "MaterialIcons",
    change: "+0.2",
    status: "positive"
  }
];

// Key Management Areas
const quickLinks = [
  {
    title: "Customer Service",
    icon: "support-agent",
    iconType: "MaterialIcons",
    route: "/manager/customerAssistance",
    color: "#10B981"
  },
  {
    title: "Delivery",
    icon: "local-shipping",
    iconType: "MaterialIcons",
    route: "/manager/deliveryManagement",
    color: "#3B82F6"
  },
  {
    title: "Issues",
    icon: "error",
    iconType: "MaterialIcons",
    route: "/manager/HandlingEscalatedIssues",
    color: "#F59E0B"
  },
  {
    title: "Channels",
    icon: "store",
    iconType: "MaterialIcons",
    route: "/manager/ManageChannels",
    color: "#8B5CF6"
  }
];

// Action Card component with animation
const ActionCard = ({ item, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 600,
        delay: index * 100,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(item.route);
  };

  return (
    <Animated.View 
      style={{
        width: "100%",
        marginBottom: 16,
        transform: [
          { scale: scaleAnim },
          { translateY: translateYAnim }
        ],
        opacity: opacityAnim
      }}
    >
      <TouchableOpacity
        style={{
          borderRadius: 20,
          overflow: "hidden",
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          backgroundColor: 'white',
          height: 120,
        }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <LinearGradient
          colors={item.gradient}
          start={[0, 0]}
          end={[1, 1]}
          style={{
            flex: 1,
            padding: 18,
            flexDirection: "row",
            alignItems: "center",
  }}
      >
          <View style={{
            width: 70,
            height: 70,
            borderRadius: 20,
            backgroundColor: `${item.color}15`,
            alignItems: "center",
            justifyContent: "center",
            borderWidth: 1,
            borderColor: `${item.color}20`,
            marginRight: 18,
          }}>
            {item.iconType === "MaterialCommunityIcons" && (
              <MaterialCommunityIcons name={item.icon} size={36} color={item.color} />
            )}
          </View>
          
          <View style={{ flex: 1 }}>
            <Text style={{ 
              fontSize: 18, 
              fontWeight: "bold", 
              color: "#1F2937", 
              marginBottom: 6,
            }}>
              {item.title}
              </Text>

            <Text style={{ 
              fontSize: 14, 
              color: "#6B7280",
              marginBottom: 8,
            }} numberOfLines={2}>
              {item.subtitle}
              </Text>
            
            <View style={{
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: 100,
              backgroundColor: `${item.color}10`,
              alignSelf: "flex-start",
              borderWidth: 1,
              borderColor: `${item.color}20`,
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: item.color,
                fontWeight: "600" 
              }}>
                {item.stats}
              </Text>
            </View>
          </View>

          <View style={{
            alignItems: "center",
            paddingLeft: 20,
          }}>
            <MaterialIcons 
              name="arrow-forward-ios" 
              size={20} 
              color="#9CA3AF"
              />
            </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Metric Card component with animation
const MetricCard = ({ metric, index }) => {
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        delay: index * 150,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  return (
    <Animated.View 
      style={{
        width: "48%",
        marginBottom: 16,
        transform: [{ scale: scaleAnim }],
        opacity: opacityAnim
      }}
    >
      <View style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        height: 130
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          backgroundColor: `rgba(79, 70, 229, 0.1)`,
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 12
        }}>
          {metric.iconType === "MaterialIcons" && (
            <MaterialIcons name={metric.icon} size={20} color="#4F46E5" />
          )}
        </View>
        
        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937", marginBottom: 4 }}>
            {metric.value}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            {metric.title}
          </Text>
        </View>
        
        <View style={{
          position: "absolute",
          top: 16,
          right: 16,
          backgroundColor: metric.status === "positive" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 100
        }}>
          <Text style={{
            fontSize: 12,
            color: metric.status === "positive" ? "#10B981" : "#EF4444",
            fontWeight: "600"
          }}>
            {metric.change}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

// Quick Access Button component
const QuickAccessButton = ({ link, index, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacityAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 100,
      useNativeDriver: true
    }).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
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

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress(link.route);
  };

  return (
    <Animated.View style={{
      opacity: opacityAnim,
      transform: [{ scale: scaleAnim }],
      width: "48%",
      marginBottom: 16
    }}>
      <TouchableOpacity
        style={{
          backgroundColor: "white",
          borderRadius: 16,
          padding: 16,
          alignItems: "center",
          flexDirection: "row",
          elevation: 3,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={{
          width: 50,
          height: 50,
          borderRadius: 12,
          backgroundColor: `${link.color}20`,
          justifyContent: "center",
          alignItems: "center",
          marginRight: 12
        }}>
          {link.iconType === "MaterialIcons" && (
            <MaterialIcons name={link.icon} size={28} color={link.color} />
          )}
            </View>
        <Text style={{ 
          flex: 1,
          fontSize: 15, 
          fontWeight: "600", 
          color: "#374151" 
        }}>
          {link.title}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Task Item component
const TaskItem = ({ task, index }) => {
  const [completed, setCompleted] = React.useState(false);
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const translateXAnim = useRef(new Animated.Value(-20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true
      }),
      Animated.timing(translateXAnim, {
        toValue: 0,
        duration: 400,
        delay: index * 150,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate the task when marked complete
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    setCompleted(!completed);
  };

  return (
    <Animated.View
      style={{
        opacity: opacityAnim,
        transform: [
          { translateX: translateXAnim },
          { scale: scaleAnim }
        ],
        backgroundColor: completed ? "rgba(243, 244, 246, 0.9)" : "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
        elevation: 1,
        borderWidth: 1,
        borderColor: completed ? "#D1D5DB" : "#E5E7EB",
      }}
    >
            <TouchableOpacity
        onPress={handleToggleComplete}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: completed ? "#10B981" : "#9CA3AF",
          marginRight: 16,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: completed ? "#10B981" : "transparent"
        }}
      >
        {completed && (
          <MaterialIcons name="check" size={16} color="white" />
        )}
            </TouchableOpacity>
      
      <Text 
        style={{ 
          flex: 1, 
          fontSize: 16, 
          fontWeight: "500", 
          color: completed ? "#9CA3AF" : "#374151",
          textDecorationLine: completed ? 'line-through' : 'none',
        }}
      >
        {task.text}
                </Text>
      
      <View style={{
        backgroundColor: task.priority === "high" ? "#FEE2E2" : 
                         task.priority === "medium" ? "#FEF3C7" : "#DBEAFE",
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 100,
      }}>
        <Text style={{
          fontSize: 12,
          fontWeight: "600",
          color: task.priority === "high" ? "#EF4444" : 
                 task.priority === "medium" ? "#F59E0B" : "#3B82F6",
        }}>
          {task.priority}
              </Text>
      </View>
    </Animated.View>
  );
};

// Section Header component
const SectionHeader = ({ title, color = "#4F46E5" }) => {
  return (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "center", 
      marginBottom: 16,
      marginTop: 16
    }}>
      <View style={{
        width: 6,
        height: 24,
        backgroundColor: color,
        borderRadius: 3,
        marginRight: 10
      }} />
      <Text style={{ 
        fontSize: 20, 
        fontWeight: "bold", 
        color: "#1F2937",
        flex: 1
      }}>
        {title}
                </Text>
    </View>
  );
};

export default function ManagerHomePage() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [focusExpanded, setFocusExpanded] = React.useState(true);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, []);

  const handleNavigation = (route) => {
    router.push(route);
  };

  const todaysTasks = [
    { text: "Review low stock inventory items", priority: "high", id: 1 },
    { text: "Approve weekly staff schedules", priority: "medium", id: 2 },
    { text: "Respond to 3 customer escalations", priority: "high", id: 3 },
    { text: "Review weekly sales report", priority: "low", id: 4 },
  ];

  const toggleFocusSection = () => {
    setFocusExpanded(!focusExpanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <HomeHeader title="Manager Dashboard" />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{
          flex: 1,
          paddingHorizontal: 20,
          marginTop: 15
        }}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Welcome Message */}
          <View style={{ marginBottom: 20 }}>
            <Text style={{ 
              color: "#4F46E5", 
              fontSize: 18, 
              fontWeight: "600",
            }}>
              Welcome back, Manager
            </Text>
            <Text style={{ 
              color: "#6B7280", 
              fontSize: 14, 
              marginTop: 4,
            }}>
              Tuesday, 2 April 2024
            </Text>
          </View>
          
          {/* Performance Metrics */}
          <SectionHeader title="Performance Overview" color="#4F46E5" />
          
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {performanceMetrics.map((metric, index) => (
              <MetricCard key={index} metric={metric} index={index} />
            ))}
          </View>
          
          {/* Quick Access */}
          <SectionHeader title="Quick Access" color="#10B981" />
          
          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
            {quickLinks.map((link, index) => (
              <QuickAccessButton 
                key={index} 
                link={link} 
                index={index} 
                onPress={handleNavigation}
              />
            ))}
          </View>
          
          {/* Management Actions */}
          <SectionHeader title="Management Actions" color="#F59E0B" />
          
          <View style={{ 
            flexDirection: "row", 
            flexWrap: "wrap", 
            justifyContent: "space-between",
            marginTop: 8,
            marginBottom: 16
          }}>
            {actionItems.map((item, index) => (
              <ActionCard 
                key={index} 
                item={item} 
                index={index} 
                onPress={handleNavigation}
              />
            ))}
            </View>

          {/* Today's Focus */}
          <View style={{
            flexDirection: "row", 
            alignItems: "center", 
            marginBottom: 16,
            marginTop: 16
          }}>
            <View style={{
              width: 6,
              height: 24,
              backgroundColor: "#4B5563",
              borderRadius: 3,
              marginRight: 10
            }} />
            <Text style={{ 
              fontSize: 20, 
              fontWeight: "bold", 
              color: "#1F2937",
              flex: 1
            }}>
              Today's Focus
            </Text>
            <TouchableOpacity
              onPress={toggleFocusSection}
              style={{
                padding: 8,
                borderRadius: 20,
                backgroundColor: "#F3F4F6"
              }}
            >
              <MaterialIcons 
                name={focusExpanded ? "expand-less" : "expand-more"} 
                size={24} 
                color="#6B7280" 
              />
            </TouchableOpacity>
          </View>
          
          {focusExpanded && (
            <View style={{
              backgroundColor: "white",
              borderRadius: 20,
              marginBottom: 30,
              overflow: "hidden",
              elevation: 2,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 8,
              borderWidth: 1,
              borderColor: "#F3F4F6"
            }}>
              <View style={{ padding: 20 }}>
                <View style={{ 
                  flexDirection: "row", 
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16
                }}>
                  <Text style={{ 
                    fontSize: 16, 
                    fontWeight: "600",
                    color: "#4B5563" 
                  }}>
                    Your priority tasks for today
              </Text>

            <TouchableOpacity
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      backgroundColor: "#F9FAFB",
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 100,
                      borderWidth: 1,
                      borderColor: "#E5E7EB"
                    }}
                  >
                    <MaterialIcons name="add" size={18} color="#4B5563" />
                    <Text style={{ 
                      marginLeft: 4, 
                      fontSize: 14, 
                      fontWeight: "500",
                      color: "#4B5563"
                    }}>
                      Add Task
                    </Text>
            </TouchableOpacity>
          </View>
                
                {todaysTasks.map((task, index) => (
                  <TaskItem key={task.id} task={task} index={index} />
                ))}
            </View>

            <TouchableOpacity
                style={{
                  padding: 16,
                  borderTopWidth: 1,
                  borderTopColor: "#F3F4F6",
                  alignItems: "center",
                  flexDirection: "row",
                  justifyContent: "center"
                }}
              >
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: "600", 
                  color: "#6B7280",
                }}>
                  View All Tasks
                </Text>
                <MaterialIcons name="arrow-forward" size={16} color="#6B7280" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}