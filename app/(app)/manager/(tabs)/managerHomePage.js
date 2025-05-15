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
    route: "/manager/discounts/DiscountDashboard",
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
        // Get today's date at midnight for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayTimestamp = Timestamp.fromDate(today);
        
        // Initialize counters
        let totalOrders = 0;
        let pendingCount = 0;
        let processingCount = 0;
        let inTransitCount = 0;
        let deliveredCount = 0;
        let cancelledCount = 0;
        let totalSalesAmount = 0;
        let todaySalesAmount = 0;
        
        // Get orders from customer_order collection
        const ordersRef = collection(db, 'customer_order');
        const ordersQuery = query(ordersRef, orderBy('createdAt', 'desc'));
        const ordersSnapshot = await getDocs(ordersQuery);

        // Process each order
        ordersSnapshot.forEach(doc => {
          const orderData = { id: doc.id, ...doc.data() };
          totalOrders++;
          
          // Normalize status
          const status = orderData.status || orderData.orderStatus || 'Pending';
          const normalizedStatus = status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();

          // Count orders by status
          switch (normalizedStatus) {
            case 'Pending':
              pendingCount++;
              break;
            case 'Processing':
              processingCount++;
              break;
            case 'In Transit':
            case 'On the way':
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
          if (normalizedStatus !== 'Cancelled' && normalizedStatus !== 'Canceled') {
            let orderTotal = 0;

            // Calculate order total
            if (orderData.payment?.amount) {
              orderTotal = parseFloat(orderData.payment.amount);
            } else if (orderData.payment?.subtotal) {
              const subtotal = parseFloat(orderData.payment.subtotal) || 0;
              const deliveryFee = parseFloat(orderData.payment.deliveryFee) || 0;
              orderTotal = subtotal + deliveryFee;
            } else if (orderData.items?.length > 0) {
              orderTotal = orderData.items.reduce((sum, item) => 
                sum + (parseFloat(item.price) * (item.quantity || 1)), 0);
            } else if (orderData.totalAmount) {
              orderTotal = parseFloat(orderData.totalAmount);
            }

            totalSalesAmount += orderTotal;

            // Add to today's sales if order is from today
            if (orderData.createdAt?.toDate() >= todayTimestamp.toDate()) {
              todaySalesAmount += orderTotal;
            }
          }
        });

        // Format metrics as an array matching the expected structure
        const formattedMetrics = [
          {
            title: "Revenue",
            value: `${totalSalesAmount.toFixed(2)} Birr`,
            icon: "trending-up",
            iconType: "MaterialIcons",
            change: "+15%",
            status: "positive",
            colorClass: "bg-green-100",
            iconColor: "#10b981"
          },
          {
            title: "Orders",
            value: totalOrders.toString(),
            icon: "shopping-cart",
            iconType: "MaterialIcons",
            change: `${pendingCount} Pending`,
            status: "positive",
            colorClass: "bg-red-100",
            iconColor: "#ef4444"
          },
          {
            title: "Today's Sales",
            value: `${todaySalesAmount.toFixed(2)} Birr`,
            icon: "attach-money",
            iconType: "MaterialIcons",
            change: "+12%",
            status: "positive",
            colorClass: "bg-blue-100",
            iconColor: "#3b82f6"
          },
          {
            title: "Delivered",
            value: deliveredCount.toString(),
            icon: "local-shipping",
            iconType: "MaterialIcons",
            change: `${((deliveredCount/totalOrders) * 100).toFixed(1)}%`,
            status: "positive",
            colorClass: "bg-purple-100",
            iconColor: "#8b5cf6"
          }
        ];

        // Update performance metrics state with the formatted array
        setPerformanceMetrics(formattedMetrics);
        
      } catch (error) {
        console.error('Error fetching performance data:', error);
        setError('Failed to load performance data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPerformanceData();
  }, []);

  const handleNavigation = (route) => {
    router.push(route);
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
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}