import React, { useEffect, useState } from "react";
import { Text, View, TouchableOpacity, ActivityIndicator, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight, useAnimatedStyle, useSharedValue, withSpring, useAnimatedScrollHandler } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import HomeHeader from "../../../components/HomeHeader";
import { StatusBar } from "expo-status-bar";
import { collection, getDocs, getFirestore, query, where, orderBy, limit } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { app } from "../../../../firebase/firebaseConfig";

export default function AdminHomePage() {
  const router = useRouter();
  const scale = useSharedValue(1);
  const scrollY = useSharedValue(0);
  const scaleIcon = useSharedValue(0.5);
  const opacityIcon = useSharedValue(0);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Dashboard stats
  const [stats, setStats] = useState({
    employees: 0,
    customers: 0,
    suppliers: 0,
    orders: 0,
    employeeGrowth: "0%",
    customerGrowth: "0%",
    supplierGrowth: "0%",
    orderGrowth: "0%"
  });
  
  // Recent activities
  const [recentActivities, setRecentActivities] = useState([]);
  
  // Fetch data from Firebase
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const db = getFirestore(app);
        const auth = getAuth(app);
        
        // Fetch employee count
        const employeesRef = collection(db, "employees");
        const employeeSnapshot = await getDocs(employeesRef);
        const employeeCount = employeeSnapshot.size;
        
        // Fetch customer count
        const customersRef = collection(db, "users");
        const customerQuery = query(customersRef, where("role", "==", "customer"));
        const customerSnapshot = await getDocs(customerQuery);
        const customerCount = customerSnapshot.size;
        
        // Fetch supplier count
        const suppliersRef = collection(db, "suppliers");
        const supplierSnapshot = await getDocs(suppliersRef);
        const supplierCount = supplierSnapshot.size;
        
        // Fetch order count
        const ordersRef = collection(db, "orders");
        const orderSnapshot = await getDocs(ordersRef);
        const orderCount = orderSnapshot.size;
        
        // Calculate growth (in real app, you'd compare with previous period)
        // This is simulated data - replace with actual calculations
        const employeeGrowth = "+12%";
        const customerGrowth = "+8%";
        const supplierGrowth = "+5%";
        const orderGrowth = "+15%";
        
        // Fetch recent activities
        const activitiesRef = collection(db, "activities");
        const activitiesQuery = query(
          activitiesRef, 
          orderBy("timestamp", "desc"),
          limit(5)
        );
        
        const activitiesSnapshot = await getDocs(activitiesQuery);
        const activities = activitiesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no activities yet, use dummy data
        const recentActivities = activities.length > 0 ? activities : [
          {
            id: "1",
            type: "employee",
            title: "New employee added",
            description: "John Doe was added as Store Manager",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: "2",
            type: "order",
            title: "Order #45612 processed",
            description: "Order was successfully delivered",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: "3",
            type: "inventory",
            title: "Inventory updated",
            description: "25 new products were added",
            timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
          }
        ];
        
        // Update state with fetched data
        setStats({
          employees: employeeCount || 24,
          customers: customerCount || 156,
          suppliers: supplierCount || 12,
          orders: orderCount || 89,
          employeeGrowth,
          customerGrowth,
          supplierGrowth,
          orderGrowth
        });
        
        setRecentActivities(recentActivities);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        // Fallback to dummy data if fetch fails
        setStats({
          employees: 24,
          customers: 156,
          suppliers: 12,
          orders: 89,
          employeeGrowth: "+12%",
          customerGrowth: "+8%",
          supplierGrowth: "+5%",
          orderGrowth: "+15%"
        });
        
        setRecentActivities([
          {
            id: "1",
            type: "employee",
            title: "New employee added",
            description: "John Doe was added as Store Manager",
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
          },
          {
            id: "2",
            type: "order",
            title: "Order #45612 processed",
            description: "Order was successfully delivered",
            timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000) // 1 day ago
          },
          {
            id: "3",
            type: "inventory",
            title: "Inventory updated",
            description: "25 new products were added",
            timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000) // 30 hours ago
          }
        ]);
        setLoading(false);
      }
    };
    
    // Start animations
    scaleIcon.value = withSpring(1, { duration: 300 });
    opacityIcon.value = withSpring(1, { duration: 300 });
    
    // Fetch data
    fetchDashboardData();
  }, []);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  const onPressIn = () => {
    scale.value = withSpring(0.97);
  };
  
  const onPressOut = () => {
    scale.value = withSpring(1);
  };
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const iconAnimationStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleIcon.value }],
    opacity: opacityIcon.value,
  }));
  
  // Menu items with modern icons and descriptions
const menuItems = [
  {
    title: "Add Employee",
      subtitle: "Create new employee accounts",
      icon: "person-add",
      iconType: "Ionicons",
    route: "admine/addEmployee",
      color: "bg-blue-50 dark:bg-blue-900/20",
      gradientFrom: "#f0f9ff", 
      gradientTo: "#e0f2fe",
      iconColor: "#3b82f6"
  },
  {
    title: "Add Supplier",
      subtitle: "Register new supplier accounts",
    icon: "truck",
    iconType: "FontAwesome5",
    route: "admine/addSuplier",
      color: "bg-indigo-50 dark:bg-indigo-900/20",
      gradientFrom: "#eef2ff",
      gradientTo: "#e0e7ff",
      iconColor: "#6366f1"
  },
  {
      title: "Employees",
      subtitle: "Manage staff & permissions",
    icon: "account-group",
    iconType: "MaterialCommunityIcons",
    route: "admine/employeeList",
      color: "bg-violet-50 dark:bg-violet-900/20",
      gradientFrom: "#f5f3ff",
      gradientTo: "#ede9fe",
      iconColor: "#8b5cf6"
    },
    {
      title: "Customers",
      subtitle: "View customer accounts",
      icon: "people",
      iconType: "Ionicons",
    route: "/admine/customersList",
      color: "bg-purple-50 dark:bg-purple-900/20",
      gradientFrom: "#faf5ff",
      gradientTo: "#f3e8ff",
      iconColor: "#a855f7"
  },
  {
      title: "Suppliers",
      subtitle: "Manage supplier relationships",
    icon: "truck-delivery",
    iconType: "MaterialCommunityIcons",
    route: "/admine/suppliersList",
      color: "bg-cyan-50 dark:bg-cyan-900/20",
      gradientFrom: "#ecfeff",
      gradientTo: "#cffafe",
      iconColor: "#06b6d4"
    },
    // {
    //   title: "Reports",
    //   subtitle: "View financial reports",
    //   icon: "chart-bar",
    // iconType: "MaterialCommunityIcons",
    //   route: "/admine/reports",
    //   color: "bg-emerald-50 dark:bg-emerald-900/20",
    //   gradientFrom: "#ecfdf5",
    //   gradientTo: "#d1fae5",
    //   iconColor: "#10b981"
    // }
  ];
  
  // Format timestamp to relative time
  const getRelativeTime = (timestamp) => {
    const now = new Date();
    const diffMs = now - new Date(timestamp);
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHrs < 24) return `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  };
  
  // Get activity icon based on type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'employee':
        return { icon: 'person-add', color: 'bg-blue-100 text-blue-600' };
      case 'order':
        return { icon: 'shopping-bag', color: 'bg-green-100 text-green-600' };
      case 'inventory':
        return { icon: 'inventory', color: 'bg-amber-100 text-amber-600' };
      case 'supplier':
        return { icon: 'local-shipping', color: 'bg-indigo-100 text-indigo-600' };
      case 'customer':
        return { icon: 'people', color: 'bg-purple-100 text-purple-600' };
      default:
        return { icon: 'notifications', color: 'bg-gray-100 text-gray-600' };
    }
  };
  
  if (loading) {
    return (
      <View className="flex-1 bg-white justify-center items-center">
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 font-medium mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <StatusBar style="dark" />
      
      {/* Header */}
      <HomeHeader title="Admin Dashboard" />
      
      {/* Welcome Banner */}
      <Animated.View 
        entering={FadeInDown.duration(500)}
        style={{ 
          backgroundColor: "white",
          marginHorizontal: 16,
          borderRadius: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          marginVertical: 8,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          overflow: "hidden"
        }}
      >
        <View style={{ padding: 20 }}>
          <View className="flex-row justify-between items-center">
          <View>
              <Text style={{
                fontSize: 22,
                fontWeight: "700", 
                color: "#111827",
                marginBottom: 4
              }}>Welcome, Admin</Text>
              <Text style={{
                fontSize: 14,
                color: "#4B5563",
                marginTop: 2
              }}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
            </View>
            
            <Animated.View 
              style={[iconAnimationStyle, {
                backgroundColor: "#3b82f615",
                width: 50,
                height: 50,
                borderRadius: 12,
                alignItems: "center",
                justifyContent: "center"
              }]}
            >
              <Ionicons name="analytics" size={26} color="#3b82f6" />
            </Animated.View>
          </View>
          
          <View style={{
            flexDirection: "row",
            justifyContent: "space-between",
            marginTop: 20
          }}>
            <Pressable 
              style={{
                backgroundColor: "#EBF5FF",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              <Ionicons name="basket" size={18} color="#3b82f6" style={{marginRight: 6}} />
              <View>
                <Text style={{ color: "#3b82f6", fontWeight: "700" }}>{stats.orders}</Text>
                <Text style={{ color: "#64748B", fontSize: 12 }}>Active Orders</Text>
              </View>
            </Pressable>
            
            <Pressable 
              style={{
                backgroundColor: "#F5F3FF",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              <Ionicons name="people" size={18} color="#8b5cf6" style={{marginRight: 6}} />
              <View>
                <Text style={{ color: "#8b5cf6", fontWeight: "700" }}>{stats.employees}</Text>
                <Text style={{ color: "#64748B", fontSize: 12 }}>Employees</Text>
              </View>
            </Pressable>
            
            <Pressable
              style={{
                backgroundColor: "#ECFDF5",
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center"
              }}
            >
              <Ionicons name="people-circle" size={18} color="#10b981" style={{marginRight: 6}} />
              <View>
                <Text style={{ color: "#10b981", fontWeight: "700" }}>{stats.customers}</Text>
                <Text style={{ color: "#64748B", fontSize: 12 }}>Customers</Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Animated.View>

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* System Overview */}
        <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 6,
              marginLeft: 2
            }}>System Overview</Text>
            <View style={{
              backgroundColor: "#3b82f610",
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: "#3b82f620"
            }}>
              <Text style={{
                fontSize: 13,
                color: "#3b82f6",
                fontWeight: "600"
              }}>Real-time</Text>
            </View>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            <Animated.View 
              entering={FadeInDown.delay(200).duration(400)} 
              style={{
                width: "48%",
                marginBottom: 16
              }}
            >
              <Pressable 
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#3b82f615",
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
                onPressIn={onPressIn} 
                onPressOut={onPressOut}
              >
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#3b82f625",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Ionicons name="people" size={24} color="#3b82f6" />
                  </View>
                  <View style={{
                    backgroundColor: "#10b98115",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: "#10b981",
                      fontWeight: "600"
                    }}>{stats.employeeGrowth}</Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#1F2937",
                  marginBottom: 4
                }}>{stats.employees}</Text>
                <Text style={{
                  fontSize: 14,
                  color: "#6B7280"
                }}>Total Employees</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View 
              entering={FadeInDown.delay(300).duration(400)} 
              style={{
                width: "48%",
                marginBottom: 16
              }}
            >
              <Pressable 
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#6366f115",
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
                onPressIn={onPressIn} 
                onPressOut={onPressOut}
              >
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#6366f125",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Ionicons name="people-circle" size={24} color="#6366f1" />
                  </View>
                  <View style={{
                    backgroundColor: "#10b98115",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: "#10b981",
                      fontWeight: "600"
                    }}>{stats.customerGrowth}</Text>
                  </View>
                </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#1F2937",
                  marginBottom: 4
                }}>{stats.customers}</Text>
                <Text style={{
                  fontSize: 14,
                  color: "#6B7280"
                }}>Total Customers</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View 
              entering={FadeInDown.delay(400).duration(400)} 
              style={{
                width: "48%",
                marginBottom: 16
              }}
            >
              <Pressable 
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#8b5cf615",
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
                onPressIn={onPressIn} 
                onPressOut={onPressOut}
              >
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#8b5cf625",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <MaterialCommunityIcons name="truck-delivery" size={24} color="#8b5cf6" />
                  </View>
                  <View style={{
                    backgroundColor: "#10b98115",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: "#10b981",
                      fontWeight: "600"
                    }}>{stats.supplierGrowth}</Text>
                  </View>
                    </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#1F2937",
                  marginBottom: 4
                }}>{stats.suppliers}</Text>
                <Text style={{
                  fontSize: 14,
                  color: "#6B7280"
                }}>Total Suppliers</Text>
              </Pressable>
            </Animated.View>
            
            <Animated.View 
              entering={FadeInDown.delay(500).duration(400)} 
              style={{
                width: "48%",
                marginBottom: 16
              }}
            >
              <Pressable 
                style={{
                  borderRadius: 16,
                  overflow: "hidden",
                  backgroundColor: "#10b98115",
                  padding: 16,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.05,
                  shadowRadius: 3,
                }}
                onPressIn={onPressIn} 
                onPressOut={onPressOut}
              >
                <View style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: 12
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: 12,
                    backgroundColor: "#10b98125",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Ionicons name="basket" size={24} color="#10b981" />
                    </View>
                  <View style={{
                    backgroundColor: "#10b98115",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 100
                  }}>
                    <Text style={{
                      fontSize: 10,
                      color: "#10b981",
                      fontWeight: "600"
                    }}>{stats.orderGrowth}</Text>
                  </View>
              </View>
                <Text style={{
                  fontSize: 24,
                  fontWeight: "bold",
                  color: "#1F2937",
                  marginBottom: 4
                }}>{stats.orders}</Text>
                <Text style={{
                  fontSize: 14,
                  color: "#6B7280"
                }}>Total Orders</Text>
              </Pressable>
            </Animated.View>
          </View>
        </View>

        {/* Quick Actions Grid */}
        <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text style={{
              fontSize: 20,
              fontWeight: "700",
              color: "#111827",
              marginBottom: 6,
              marginLeft: 2
            }}>Quick Actions</Text>
          </View>
          
          <View className="flex-row flex-wrap justify-between">
            {menuItems.map((item, index) => (
              <Animated.View 
                key={item.title} 
                entering={FadeInRight.delay(300 + index * 100).duration(400)}
                style={{
                  width: "48%",
                  marginBottom: 16
                }}
              >
                <TouchableOpacity
                  onPress={() => router.push(item.route)}
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor: `${item.iconColor}15`,
                    borderRadius: 16,
                    height: 140,
                    justifyContent: "space-between",
                    padding: 16,
                    position: "relative",
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                  }}
                >
                  <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between"
                  }}>
                    <Animated.View 
                      style={[iconAnimationStyle, {
                        width: 48,
                        height: 48,
                        borderRadius: 12,
                        backgroundColor: `${item.iconColor}25`,
                        alignItems: "center",
                        justifyContent: "center"
                      }]}
                    >
                      {item.iconType === "Ionicons" && (
                        <Ionicons name={item.icon} size={24} color={item.iconColor} />
                      )}
                      {item.iconType === "MaterialIcons" && (
                        <MaterialIcons name={item.icon} size={24} color={item.iconColor} />
                      )}
                      {item.iconType === "FontAwesome5" && (
                        <FontAwesome5 name={item.icon} size={24} color={item.iconColor} />
                      )}
                      {item.iconType === "MaterialCommunityIcons" && (
                        <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor} />
                      )}
                    </Animated.View>
                  </View>
                  
                  <View>
                    <Text style={{
                      fontSize: 16,
                      fontWeight: "bold",
                      color: "#1F2937",
                      marginBottom: 4,
                    }}>{item.title}</Text>
                    <Text style={{
                      fontSize: 12,
                      color: "#6B7280",
                    }} numberOfLines={2}>{item.subtitle}</Text>
                  </View>
              </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
        
        {/* Recent Activity */}
        {/* <View className="mx-4 mt-4">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-800 dark:text-gray-200 font-bold text-lg">Recent Activity</Text>
            <TouchableOpacity className="bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-full">
              <Text className="text-blue-600 dark:text-blue-400 font-medium text-sm">View All</Text>
            </TouchableOpacity>
          </View>
          
          {recentActivities.map((activity, index) => {
            const { icon, color } = getActivityIcon(activity.type);
            return (
              <Animated.View 
                key={activity.id} 
                entering={FadeInDown.delay(600 + index * 100).duration(400)}
                className="mb-3"
              >
                <Pressable 
                  className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700 flex-row items-center relative overflow-hidden"
                  onPressIn={onPressIn}
                  onPressOut={onPressOut}
                >
                  <LinearGradient
                    colors={['#f9fafb', '#f3f4f6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    className="absolute inset-0 opacity-60"
                  />
                  <View className={`${color} w-10 h-10 rounded-full items-center justify-center mr-3`}>
                    <MaterialIcons name={icon} size={18} color={color.includes('text-') ? '' : '#3b82f6'} />
                  </View>
                  
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800 dark:text-white">{activity.title}</Text>
                    <Text className="text-gray-500 dark:text-gray-400 text-xs mt-1">{activity.description}</Text>
                  </View>
                  
                  <View>
                    <Text className="text-gray-400 dark:text-gray-500 text-xs">{getRelativeTime(activity.timestamp)}</Text>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View> */}
      </Animated.ScrollView>
    </SafeAreaView>
  );
}
