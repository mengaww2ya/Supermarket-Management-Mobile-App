import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  RefreshControl,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { 
  Ionicons, 
  MaterialCommunityIcons, 
  FontAwesome5, 
  AntDesign, 
  Feather, 
  MaterialIcons,
  Octicons,
  Entypo
} from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withSpring, 
  Easing,
  FadeInDown,
  FadeInRight,
  FadeIn,
  interpolate,
  Extrapolate,
  useAnimatedScrollHandler
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";

const { width, height } = Dimensions.get("window");

// Management option card component
const ManagementCard = ({ title, description, icon, iconBgColor, onPress, index }) => {
  const scale = useSharedValue(1);
  const cardOpacity = useSharedValue(1);
  
  const handlePressIn = () => {
    'worklet';
    scale.value = withTiming(0.97, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handlePressOut = () => {
    'worklet';
    scale.value = withTiming(1, { duration: 300 });
  };
  
  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: cardOpacity.value,
    };
  });

  return (
    <Animated.View 
      entering={FadeInDown.delay(50 * index).duration(400)}
      style={[styles.managementCard, cardStyle]}
    >
      <TouchableOpacity
        activeOpacity={0.95}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.managementCardTouchable}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBgColor }]}>
          {icon}
        </View>
        
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </View>
        
        <View style={styles.arrowContainer}>
          <Ionicons name="chevron-forward" size={20} color="#a3a3a3" />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Stat card component
const StatCard = ({ title, value, icon, color, index }) => {
  return (
    <Animated.View 
      entering={FadeInDown.delay(100 * index).duration(400)}
      style={[styles.statCard]}
    >
      <LinearGradient
        colors={[`${color}10`, `${color}30`]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statGradient}
      />
      
      <View style={[styles.statIconContainer, { backgroundColor: `${color}30` }]}>
        {icon}
      </View>
      
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </Animated.View>
  );
};

export default function InventoryManagement() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  
  const scrollY = useSharedValue(0);
  
  // Scroll handler for animations
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  
  // Animated styles for header shadow
  const headerStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: interpolate(
        scrollY.value,
        [0, 50],
        [0, 0.2],
        Extrapolate.CLAMP
      ),
    };
  });
  
  // Handle refresh
  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1500);
  }, []);
  
  // Inventory stats data
  const stats = [
    {
      title: "Total Products",
      value: "324",
      icon: <MaterialCommunityIcons name="package-variant" size={22} color="#3b82f6" />,
      color: "#3b82f6"
    },
    {
      title: "Categories",
      value: "12",
      icon: <Ionicons name="grid-outline" size={22} color="#8b5cf6" />,
      color: "#8b5cf6"
    },
    {
      title: "Low Stock",
      value: "24",
      icon: <Feather name="alert-triangle" size={22} color="#f97316" />,
      color: "#f97316"
    },
    {
      title: "Out of Stock",
      value: "8",
      icon: <MaterialIcons name="inventory" size={22} color="#ef4444" />,
      color: "#ef4444"
    },
  ];
  
  // Management options data
  const managementOptions = [
    {
      title: "Add New Product",
      description: "Create and publish new product listings",
      icon: <AntDesign name="plus" size={22} color="#fff" />,
      iconBgColor: "#3b82f6",
      action: () => console.log("Add new product")
    },
    {
      title: "View Products",
      description: "Browse and search your product catalog",
      icon: <MaterialCommunityIcons name="eye-outline" size={22} color="#fff" />,
      iconBgColor: "#8b5cf6",
      action: () => console.log("View products")
    },
    {
      title: "Update Products",
      description: "Edit existing product details and information",
      icon: <Feather name="edit-2" size={22} color="#fff" />,
      iconBgColor: "#10b981",
      action: () => console.log("Update products")
    },
    {
      title: "Add Category",
      description: "Create new product categories",
      icon: <AntDesign name="addfolder" size={22} color="#fff" />,
      iconBgColor: "#f97316",
      action: () => console.log("Add category")
    },
    {
      title: "View Categories",
      description: "Browse and search product categories",
      icon: <MaterialIcons name="category" size={22} color="#fff" />,
      iconBgColor: "#f43f5e",
      action: () => console.log("View categories")
    },
    {
      title: "Update Categories",
      description: "Edit existing category details",
      icon: <Feather name="edit-3" size={22} color="#fff" />,
      iconBgColor: "#0ea5e9",
      action: () => console.log("Update categories")
    },
    {
      title: "Inventory Alerts",
      description: "Configure stock level notifications",
      icon: <Octicons name="bell" size={22} color="#fff" />,
      iconBgColor: "#6366f1",
      action: () => console.log("Inventory alerts")
    },
    {
      title: "Inventory Reports",
      description: "Generate stock and sales reports",
      icon: <Feather name="bar-chart-2" size={22} color="#fff" />,
      iconBgColor: "#14b8a6",
      action: () => console.log("Inventory reports")
    },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <Animated.View style={headerStyle}>
        <HomeHeader 
          title="Inventory Management" 
          showBackButton={true} 
          onBackPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        />
      </Animated.View>
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3b82f6"
            colors={["#3b82f6", "#10b981"]}
          />
        }
      >
        {/* Inventory Summary */}
        <Animated.View 
          entering={FadeInDown.duration(500)}
          style={styles.summaryContainer}
        >
          <LinearGradient
            colors={['#f0f4fd', '#e6eeff']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryGradient}
          >
            <View style={styles.summaryContent}>
              <View style={styles.summaryTextContainer}>
                <Text style={[styles.summaryTitle, { color: '#333' }]}>Inventory Overview</Text>
                <Text style={[styles.summarySubtitle, { color: '#666' }]}>Manage your product inventory</Text>
              </View>
              <View style={styles.summaryIconContainer}>
                <MaterialCommunityIcons name="clipboard-text-outline" size={70} color="rgba(59, 130, 246, 0.15)" />
              </View>
            </View>
          </LinearGradient>
        </Animated.View>
        
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <StatCard 
              key={stat.title}
              title={stat.title}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              index={index}
            />
          ))}
        </View>
        
        <View style={styles.managementOptionsContainer}>
          {managementOptions.map((option, index) => (
            <ManagementCard
              key={option.title}
              title={option.title}
              description={option.description}
              icon={option.icon}
              iconBgColor={option.iconBgColor}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                option.action();
              }}
              index={index}
            />
          ))}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9fc",
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  summaryContainer: {
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#a3a3c2',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  summaryGradient: {
    padding: 20,
  },
  summaryContent: {
    flexDirection: 'row',
  },
  summaryTextContainer: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  summarySubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  summaryIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 10,
  },
  sectionHeader: {
    marginTop: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 240, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  statGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  managementOptionsContainer: {
    marginBottom: 20,
  },
  managementCard: {
    width: '100%',
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 240, 1)',
  },
  managementCardTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  arrowContainer: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
});
