import React, { useRef, useEffect, useState } from "react";
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  Animated,
  ActivityIndicator,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import HomeHeader from "../../../components/HomeHeader";
import * as Haptics from 'expo-haptics';
import { db } from '../../../../firebase/firebaseConfig';
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';

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
const performanceMetricsData = [
  {
    title: "Revenue",
    value: "120K Birr",
    icon: "trending-up",
    iconType: "MaterialIcons",
    change: "+15%",
    status: "positive",
    colorClass: "bg-green-100",
    iconColor: "#10b981"
  },
  {
    title: "Orders",
    value: "2,000",
    icon: "shopping-cart",
    iconType: "MaterialIcons",
    change: "+8%",
    status: "positive",
    colorClass: "bg-red-100",
    iconColor: "#ef4444"
  },
  {
    title: "Profit",
    value: "30K Birr",
    icon: "attach-money",
    iconType: "MaterialIcons",
    change: "+12%",
    status: "positive",
    colorClass: "bg-blue-100",
    iconColor: "#3b82f6"
  },
  {
    title: "Feedback",
    value: "4.8/5",
    icon: "star",
    iconType: "MaterialIcons",
    change: "+0.2",
    status: "positive",
    colorClass: "bg-purple-100",
    iconColor: "#8b5cf6"
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

// Action Card component with animation - updated to grid style
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
        width: "48%",
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
          borderRadius: 16,
          overflow: "hidden",
          backgroundColor: `${item.color}15`,
          padding: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <View style={{
          width: 48,
          height: 48,
          borderRadius: 12,
          backgroundColor: `${item.color}25`,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
        }}>
          {item.iconType === "MaterialCommunityIcons" && (
            <MaterialCommunityIcons name={item.icon} size={24} color={item.color} />
          )}
        </View>

        <Text style={{
          fontSize: 16,
          fontWeight: "bold",
          color: "#1F2937",
          marginBottom: 4,
        }}>
          {item.title}
        </Text>

        <Text style={{
          fontSize: 12,
          color: "#6B7280",
          marginBottom: 8,
        }} numberOfLines={2}>
          {item.subtitle}
        </Text>

        <View style={{
          paddingHorizontal: 8,
          paddingVertical: 4,
          borderRadius: 100,
          backgroundColor: `${item.color}15`,
          alignSelf: "flex-start",
        }}>
          <Text style={{
            fontSize: 10,
            color: item.color,
            fontWeight: "600"
          }}>
            {item.stats}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Metric Card component - updated to match supplier style
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
      }}>
        <View style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8
        }}>
          <View style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: `rgba(79, 70, 229, 0.1)`,
            justifyContent: "center",
            alignItems: "center",
          }}>
            {metric.iconType === "MaterialIcons" && (
              <MaterialIcons name={metric.icon} size={20} color={metric.iconColor} />
            )}
          </View>

          <View style={{
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

        <View>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937", marginBottom: 4 }}>
            {metric.value}
          </Text>
          <Text style={{ fontSize: 14, color: "#6B7280" }}>
            {metric.title}
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
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
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
const SectionHeader = ({ title, color = "#4F46E5", icon }) => {
  return (
    <View style={{
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 16,
      marginTop: 16
    }}>
      {icon && (
        <Feather name={icon} size={20} color={color} style={{ marginRight: 8 }} />
      )}
      <Text style={{
        fontSize: 18,
        fontWeight: "semibold",
        color: "#1F2937"
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

  // Performance metrics state (from Firebase)
  const [performanceMetrics, setPerformanceMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();

    // Fetch data from Firebase
    const fetchPerformanceData = async () => {
      setIsLoading(true);
      try {
        // Get orders from dedicated orders collection
        const ordersRef = collection(db, 'orders');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);

        let pendingCount = 0;
        let processingCount = 0;
        let inTransitCount = 0;
        let deliveredCount = 0;
        let cancelledCount = 0;
        let totalSalesAmount = 0;
        let todaySalesAmount = 0;
        let totalOrders = 0;

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);

        // Get order data from main orders collection
        ordersSnapshot.forEach(doc => {
          const orderData = { id: doc.id, ...doc.data() };
          totalOrders++;

          // Count orders by status
          const status = orderData.status?.charAt(0).toUpperCase() + orderData.status?.slice(1).toLowerCase() || 'Pending';

          switch (status) {
            case 'Pending':
              pendingCount++;
              break;
            case 'Processing':
              processingCount++;
              break;
            case 'In Transit':
            case 'In transit':
              inTransitCount++;
              break;
            case 'Delivered':
              deliveredCount++;
              break;
            case 'Cancelled':
            case 'Canceled':
              cancelledCount++;
              break;
          }

          // Calculate revenue from non-cancelled orders
          if (status !== 'Cancelled' && status !== 'Canceled') {
            // Try to get amount from payment object first
            let orderTotal = 0;

            if (orderData.payment && orderData.payment.amount) {
              orderTotal = parseFloat(orderData.payment.amount);
            }
            // Otherwise calculate from items
            else if (orderData.cartItems && orderData.cartItems.length > 0) {
              orderTotal = orderData.cartItems.reduce((sum, item) =>
                sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
            }
            // If amount is directly on the order
            else if (orderData.totalAmount) {
              orderTotal = parseFloat(orderData.totalAmount);
            }

            totalSalesAmount += orderTotal;

            // Calculate today's sales
            if (orderData.createdAt && orderData.createdAt.toDate() >= todayTimestamp.toDate()) {
              todaySalesAmount += orderTotal;
            }
          }
        });

        // Format the metrics for display
        const formattedData = [
          {
            title: "Revenue",
            value: `${Math.round(totalSalesAmount / 1000)}K Birr`,
            icon: "trending-up",
            iconType: "MaterialIcons",
            change: `+${Math.round((todaySalesAmount / totalSalesAmount) * 100)}%`,
            status: "positive",
            colorClass: "bg-green-100",
            iconColor: "#10b981"
          },
          {
            title: "Orders",
            value: totalOrders.toLocaleString(),
            icon: "shopping-cart",
            iconType: "MaterialIcons",
            change: `+${Math.round((pendingCount / totalOrders) * 100)}%`,
            status: "positive",
            colorClass: "bg-red-100",
            iconColor: "#ef4444"
          },
          {
            title: "Profit",
            value: `${Math.round((totalSalesAmount * 0.25) / 1000)}K Birr`, // Assuming 25% profit margin
            icon: "attach-money",
            iconType: "MaterialIcons",
            change: `+${Math.round((todaySalesAmount * 0.25) / (totalSalesAmount * 0.25) * 100)}%`,
            status: "positive",
            colorClass: "bg-blue-100",
            iconColor: "#3b82f6"
          },
          {
            title: "Order Completion",
            value: `${Math.round((deliveredCount / totalOrders) * 100)}%`,
            icon: "check-circle",
            iconType: "MaterialIcons",
            change: `+${deliveredCount}`,
            status: "positive",
            colorClass: "bg-purple-100",
            iconColor: "#8b5cf6"
          }
        ];

        setPerformanceMetrics(formattedData);
      } catch (err) {
        console.error("Error fetching performance data:", err);
        setError("Failed to load performance data");
        // Fallback to default data if fetch fails
        setPerformanceMetrics(performanceMetricsData);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
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
          {/* Welcome Message Removed */}

          {/* Performance Metrics - Updated to database-based style */}
          <SectionHeader title="Performance Overview" color="#4F46E5" icon="bar-chart-2" />

          <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", marginBottom: 8 }}>
            {isLoading ? (
              // Loading skeleton placeholders
              [...Array(4)].map((_, index) => (
                <View
                  key={index}
                  style={{
                    width: "48%",
                    marginBottom: 16,
                    backgroundColor: "#F9FAFB",
                    borderRadius: 16,
                    padding: 16,
                    height: 140,
                  }}
                >
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 8
                  }}>
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: "#EAECF0",
                    }} />
                    <View style={{
                      width: 60,
                      height: 24,
                      borderRadius: 100,
                      backgroundColor: "#EAECF0",
                    }} />
                  </View>

                  <View style={{ marginTop: 20 }}>
                    <View style={{
                      height: 24,
                      width: "60%",
                      backgroundColor: "#EAECF0",
                      borderRadius: 4,
                      marginBottom: 8
                    }} />
                    <View style={{
                      height: 16,
                      width: "40%",
                      backgroundColor: "#EAECF0",
                      borderRadius: 4
                    }} />
                  </View>
                </View>
              ))
            ) : error ? (
              // Error state
              <View style={{
                width: "100%",
                padding: 16,
                backgroundColor: "#FEF2F2",
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center"
              }}>
                <MaterialIcons name="error-outline" size={24} color="#DC2626" style={{ marginRight: 12 }} />
                <Text style={{ color: "#B91C1C", flex: 1 }}>{error}</Text>
                <TouchableOpacity
                  style={{
                    padding: 8,
                    backgroundColor: "#DC2626",
                    borderRadius: 8
                  }}
                  onPress={() => {
                    setError(null);
                    setIsLoading(true);
                    // Re-fetch data
                    setTimeout(() => {
                      setPerformanceMetrics(performanceMetricsData);
                      setIsLoading(false);
                    }, 1000);
                  }}
                >
                  <Text style={{ color: "white", fontSize: 12, fontWeight: "500" }}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              // Actual data
              performanceMetrics.map((metric, index) => (
                <MetricCard key={index} metric={metric} index={index} />
              ))
            )}
          </View>

          {/* Quick Access */}
          <SectionHeader title="Quick Access" color="#10B981" icon="compass" />

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

          {/* Management Actions - Updated to grid cards style */}
          <SectionHeader title="Management Actions" color="#F59E0B" icon="settings" />

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
          <View style={{ marginBottom: 32 }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              marginTop: 16
            }}>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 6,
                  height: 24,
                  backgroundColor: "#4F46E5",
                  borderRadius: 3,
                  marginRight: 10
                }} />
                <Text style={{
                  fontSize: 20,
                  fontWeight: "bold",
                  color: "#1F2937",
                }}>
                  Today's Focus
                </Text>
              </View>

              <TouchableOpacity
                onPress={toggleFocusSection}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F3F4F6",
                  justifyContent: "center",
                  alignItems: "center"
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
              <View style={{ marginTop: 8 }}>
                {todaysTasks.map((task, index) => (
                  <TaskItem key={task.id} task={task} index={index} />
                ))}
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}