import React, { useEffect, useState } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  RefreshControl,
  Pressable,
} from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons, Feather } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  withSequence,
  withDelay,
  interpolateColor,
  interpolate,
  FadeInDown,
  FadeInRight,
  Extrapolate
} from 'react-native-reanimated';
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../../components/HomeHeader";

const { width, height } = Dimensions.get("window");
const NOTIFICATION_COUNT = 3;

// Custom interactive card component
const InteractiveCard = ({ onPress, colors, icon, title, description, index, notificationCount }) => {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const translateY = useSharedValue(0);
  const iconScale = useSharedValue(1);
  const cardOpacity = useSharedValue(0.95);

  const handlePressIn = () => {
    'worklet';
    scale.value = withTiming(0.97, { duration: 200 });
    iconScale.value = withTiming(1.15, { duration: 300 });
    cardOpacity.value = withTiming(1, { duration: 200 });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withTiming(1, { duration: 300 });
    iconScale.value = withTiming(1, { duration: 200 });
    cardOpacity.value = withTiming(0.95, { duration: 300 });

    // Add a little bounce effect
    rotate.value = withSequence(
      withTiming(-0.01, { duration: 100 }),
      withTiming(0.01, { duration: 100 }),
      withTiming(0, { duration: 100 })
    );
  };

  // Staggered animation on mount
  useEffect(() => {
    translateY.value = 50;
    translateY.value = withDelay(
      100 * index,
      withTiming(0, {
        duration: 600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1)
      })
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotate.value}rad` },
        { translateY: translateY.value }
      ],
      opacity: cardOpacity.value
    };
  });

  const iconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: iconScale.value }]
    };
  });

  return (
    <Animated.View style={[styles.cardContainer, cardStyle]}>
      <TouchableOpacity
        activeOpacity={0.98}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Animated.View style={[styles.cardIcon, iconStyle]}>
              {icon}
            </Animated.View>

            <View style={styles.cardTextContent}>
              <View style={styles.cardTitleContainer}>
                <Text style={styles.cardTitle}>{title}</Text>
                {notificationCount > 0 && (
                  <View style={styles.notificationBadge}>
                    <Text style={styles.notificationText}>{notificationCount}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.cardDescription}>{description}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Animated chart component for the header
const AnimatedChart = () => {
  const barHeights = [
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
    useSharedValue(0),
  ];

  useEffect(() => {
    const heights = [60, 85, 45, 70, 90];

    heights.forEach((height, index) => {
      barHeights[index].value = withDelay(
        200 + (index * 100),
        withTiming(height, {
          duration: 1000,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1)
        })
      );
    });
  }, []);

  return (
    <View style={styles.chartContainer}>
      {barHeights.map((height, index) => {
        const barStyle = useAnimatedStyle(() => {
          return {
            height: height.value,
          };
        });

        return (
          <View key={index} style={styles.chartBarWrapper}>
            <Animated.View
              style={[
                styles.chartBar,
                barStyle,
                { backgroundColor: index % 2 === 0 ? '#5E7CE2' : '#26A96C' }
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

export default function SupplierHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  // Animation values
  const headerAnimation = useSharedValue(0);
  const cardsAnimation = useSharedValue(0);
  const gradientPosition = useSharedValue(0);
  const scaleIcon = useSharedValue(0.5);
  const opacityIcon = useSharedValue(0);

  // Add dummy stats
  const [stats, setStats] = useState({
    products: 23,
    orders: 12,
    deliveries: 8,
    revenue: 12450,
    productGrowth: "+5%",
    orderGrowth: "+12%",
    deliveryGrowth: "+8%",
    revenueGrowth: "+16.2%"
  });

  useEffect(() => {
    // Animate elements on mount
    headerAnimation.value = withTiming(1, {
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    cardsAnimation.value = withTiming(1, {
      duration: 1000,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1)
    });

    // Start animated gradient
    startGradientAnimation();

    // Animate icons
    scaleIcon.value = withSpring(1, { duration: 300 });
    opacityIcon.value = withSpring(1, { duration: 300 });
  }, []);

  // Function to trigger the gradient animation
  const startGradientAnimation = () => {
    gradientPosition.value = withSequence(
      withTiming(1, { duration: 8000 }),
      withTiming(0, { duration: 8000 })
    );

    // Loop the animation
    setTimeout(() => {
      startGradientAnimation();
    }, 16000);
  };

  // Animated background gradient
  const gradientStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      gradientPosition.value,
      [0, 0.5, 1],
      [
        'rgba(249, 249, 252, 1)',
        'rgba(245, 247, 255, 1)',
        'rgba(249, 249, 252, 1)'
      ]
    );

    return {
      backgroundColor
    };
  });

  // Animated styles
  const headerAnimStyle = useAnimatedStyle(() => {
    return {
      opacity: headerAnimation.value,
      transform: [{
        translateY: interpolate(
          headerAnimation.value,
          [0, 1],
          [-30, 0],
          Extrapolate.CLAMP
        )
      }]
    };
  });

  const navigateTo = (path) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push(`/suplier/${path}`);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Simulate data refresh
    setTimeout(() => {
      setRefreshing(false);

      // Trigger a small animation to indicate refresh completed
      headerAnimation.value = withSequence(
        withTiming(0.8, { duration: 200 }),
        withTiming(1, { duration: 400 })
      );
    }, 1500);
  }, []);

  // Card data with notification counts
  const cards = [
    {
      title: "Product Management",
      description: "Add and view your products",
      icon: <MaterialCommunityIcons name="package-variant-closed" size={24} color="#3b82f6" />,
      colors: ['#f0f4fd', '#e6eeff'],
      path: 'manageProduct',
      notifications: 2
    },
    {
      title: "Manage Orders",
      description: "Process and track customer orders",
      icon: <Ionicons name="receipt-outline" size={24} color="#f43f5e" />,
      colors: ['#fff1f2', '#ffe4e6'],
      path: 'manageOrder',
      notifications: 5
    },
    {
      title: "Deliveries",
      description: "Schedule and track deliveries",
      icon: <FontAwesome5 name="truck" size={22} color="#10b981" />,
      colors: ['#ecfdf5', '#d1fae5'],
      path: 'manageDelivery',
      notifications: 0
    },
    {
      title: "Analytics",
      description: "View reports and insights",
      icon: <MaterialIcons name="analytics" size={24} color="#8b5cf6" />,
      colors: ['#f5f3ff', '#ede9fe'],
      path: 'SPerformanceAnalytics',
      notifications: 0
    }
  ];

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="light" />

      {/* Animated Background */}
      <Animated.View style={[styles.background, gradientStyle]} />

      {/* Header */}
      <HomeHeader
        title="Supplier Dashboard"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#5E7CE2"
            colors={["#5E7CE2", "#26A96C"]}
          />
        }
      >
        {/* Welcome Banner */}
        <Animated.View
          entering={FadeInDown.duration(500)}
          style={[styles.welcomeBanner, headerAnimStyle]}
        >
          <View style={styles.welcomeContent}>
            <View style={styles.welcomeHeader}>
              <View>
                <Text style={styles.welcomeTitle}>Welcome Back, Supplier</Text>
                <Text style={styles.welcomeDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
              </View>

              <Animated.View style={[styles.welcomeIcon, {
                transform: [{ scale: scaleIcon.value }],
                opacity: opacityIcon.value
              }]}>
                <MaterialIcons name="analytics" size={24} color="#3b82f6" />
              </Animated.View>
            </View>

            <View style={styles.quickStatsRow}>
              <Pressable style={styles.quickStat}>
                <Ionicons name="basket" size={18} color="#3b82f6" style={{ marginRight: 6 }} />
                <View>
                  <Text style={styles.quickStatValue}>{stats.orders}</Text>
                  <Text style={styles.quickStatLabel}>Active Orders</Text>
                </View>
              </Pressable>

              <Pressable style={[styles.quickStat, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                <MaterialCommunityIcons name="package-variant" size={18} color="#8b5cf6" style={{ marginRight: 6 }} />
                <View>
                  <Text style={[styles.quickStatValue, { color: '#8b5cf6' }]}>{stats.products}</Text>
                  <Text style={styles.quickStatLabel}>Products</Text>
                </View>
              </Pressable>

              <Pressable style={[styles.quickStat, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <FontAwesome5 name="truck" size={16} color="#10b981" style={{ marginRight: 6 }} />
                <View>
                  <Text style={[styles.quickStatValue, { color: '#10b981' }]}>{stats.deliveries}</Text>
                  <Text style={styles.quickStatLabel}>Deliveries</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* System Overview */}
        <View style={styles.overviewSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Business Overview</Text>
            <View style={styles.realTimeBadge}>
              <Text style={styles.realTimeText}>Real-time</Text>
            </View>
          </View>

          <View style={styles.statsGrid}>
            {/* Products Stat */}
            <Animated.View entering={FadeInDown.delay(200).duration(400)} style={styles.statCard}>
              <LinearGradient
                colors={['#f0f9ff', '#e0f2fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
              <View style={styles.statCardHeader}>
                <View style={[styles.statCardIcon, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                  <MaterialCommunityIcons name="package-variant" size={20} color="#3b82f6" />
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthText}>{stats.productGrowth}</Text>
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.products}</Text>
              <Text style={styles.statCardLabel}>Total Products</Text>
            </Animated.View>

            {/* Orders Stat */}
            <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.statCard}>
              <LinearGradient
                colors={['#eef2ff', '#e0e7ff']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
              <View style={styles.statCardHeader}>
                <View style={[styles.statCardIcon, { backgroundColor: 'rgba(99, 102, 241, 0.1)' }]}>
                  <Ionicons name="receipt-outline" size={20} color="#6366f1" />
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthText}>{stats.orderGrowth}</Text>
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.orders}</Text>
              <Text style={styles.statCardLabel}>Active Orders</Text>
            </Animated.View>

            {/* Deliveries Stat */}
            <Animated.View entering={FadeInDown.delay(400).duration(400)} style={styles.statCard}>
              <LinearGradient
                colors={['#f5f3ff', '#ede9fe']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
              <View style={styles.statCardHeader}>
                <View style={[styles.statCardIcon, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}>
                  <FontAwesome5 name="truck" size={18} color="#8b5cf6" />
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthText}>{stats.deliveryGrowth}</Text>
                </View>
              </View>
              <Text style={styles.statCardValue}>{stats.deliveries}</Text>
              <Text style={styles.statCardLabel}>Deliveries</Text>
            </Animated.View>

            {/* Revenue Stat */}
            <Animated.View entering={FadeInDown.delay(500).duration(400)} style={styles.statCard}>
              <LinearGradient
                colors={['#ecfdf5', '#d1fae5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientBackground}
              />
              <View style={styles.statCardHeader}>
                <View style={[styles.statCardIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                  <Ionicons name="cash-outline" size={20} color="#10b981" />
                </View>
                <View style={styles.growthBadge}>
                  <Text style={styles.growthText}>{stats.revenueGrowth}</Text>
                </View>
              </View>
              <Text style={styles.statCardValue}>${stats.revenue}</Text>
              <Text style={styles.statCardLabel}>Revenue</Text>
            </Animated.View>
          </View>
        </View>

        {/* Management Console */}
        <View style={styles.managementSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Management Console</Text>
          </View>

          <View style={styles.menuGrid}>
            {cards.map((card, index) => (
              <Animated.View
                key={index}
                entering={FadeInRight.delay(300 + index * 100).duration(400)}
                style={styles.menuCard}
              >
                <TouchableOpacity
                  onPress={() => navigateTo(card.path)}
                  activeOpacity={0.8}
                  style={styles.menuCardTouchable}
                >
                  <LinearGradient
                    colors={card.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.menuCardGradient}
                  />

                  <View style={styles.menuCardHeader}>
                    <Animated.View
                      style={[
                        styles.menuCardIcon,
                        useAnimatedStyle(() => ({
                          transform: [{
                            scale: interpolate(
                              headerAnimation.value,
                              [0, 1],
                              [0.5, 1],
                              Extrapolate.CLAMP
                            )
                          }],
                        }))
                      ]}
                    >
                      {card.icon}
                    </Animated.View>

                    <View style={styles.menuCardChevron}>
                      <Ionicons name="chevron-forward" size={16} color="#6b7280" />
                    </View>
                  </View>

                  <View style={styles.menuCardContent}>
                    <View style={styles.menuCardTitleContainer}>
                      <Text style={styles.menuCardTitle}>{card.title}</Text>
                      {card.notifications > 0 && (
                        <View style={styles.menuCardBadge}>
                          <Text style={styles.menuCardBadgeText}>{card.notifications}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.menuCardDescription}>{card.description}</Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9fc",
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: '100%',
    backgroundColor: '#f9f9fc',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  greeting: {
    fontSize: 14,
    color: "#777",
    fontWeight: '500',
  },
  supplierName: {
    fontSize: 22,
    fontWeight: "700",
    color: "#333",
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 245, 250, 0.8)',
  },
  notificationContainer: {
    position: 'relative',
  },
  headerBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FF5454',
    borderRadius: 10,
    height: 18,
    minWidth: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },

  // Welcome Banner Styles
  welcomeBanner: {
    marginHorizontal: 16,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 240, 1)',
  },
  welcomeContent: {
    padding: 16,
  },
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  welcomeDate: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  welcomeIcon: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    padding: 12,
    borderRadius: 24,
  },
  quickStatsRow: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  quickStat: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    flex: 0.31,
  },
  quickStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#666',
  },

  // Overview Styles
  overviewSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  realTimeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  realTimeText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#3b82f6',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 240, 1)',
    position: 'relative',
    overflow: 'hidden',
  },
  gradientBackground: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.6,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  growthBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  growthText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#10b981',
  },
  statCardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statCardLabel: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },

  // Management Console Styles
  managementSection: {
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  menuCard: {
    width: '48%',
    marginBottom: 16,
  },
  menuCardTouchable: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    height: 140,
    borderWidth: 1,
    borderColor: 'rgba(240, 240, 240, 1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
  },
  menuCardGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    opacity: 0.7,
  },
  menuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  menuCardIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  menuCardChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuCardContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    position: 'absolute',
    bottom: 0,
  },
  menuCardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  menuCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  menuCardBadge: {
    backgroundColor: 'white',
    borderRadius: 10,
    height: 20,
    minWidth: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  menuCardBadgeText: {
    color: '#FF5454',
    fontSize: 12,
    fontWeight: 'bold',
  },
  menuCardDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
});
