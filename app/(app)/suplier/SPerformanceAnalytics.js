import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence, withDelay, Easing } from 'react-native-reanimated';
import HomeHeader from "../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Sample data for charts
const MONTHLY_SALES = [5200, 6100, 4800, 5700, 6800, 7200, 6500, 7500, 8200, 7800, 8500, 9200];
const MONTHLY_PROFIT = [1200, 1500, 1100, 1400, 1700, 1900, 1600, 2000, 2300, 2100, 2400, 2700];
const TOP_PRODUCTS = [
  { id: 1, name: 'Organic Milk', sales: 1230, growth: 8.5 },
  { id: 2, name: 'Whole Wheat Bread', sales: 980, growth: 12.3 },
  { id: 3, name: 'Fresh Eggs (Dozen)', sales: 850, growth: 5.7 },
  { id: 4, name: 'Premium Coffee', sales: 780, growth: -2.3 },
  { id: 5, name: 'Assorted Chocolates', sales: 650, growth: 9.8 },
];

// Period selector component
const PeriodSelector = ({ activePeriod, onChange }) => {
  const periods = ['Week', 'Month', 'Quarter', 'Year'];
  
  return (
    <View style={styles.periodSelector}>
      {periods.map((period) => (
        <TouchableOpacity
          key={period}
          style={[
            styles.periodButton,
            activePeriod === period && styles.activePeriodButton
          ]}
          onPress={() => onChange(period)}
        >
          <Text
            style={[
              styles.periodButtonText,
              activePeriod === period && styles.activePeriodButtonText
            ]}
          >
            {period}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Chart bar component with animation
const ChartBar = ({ value, maxValue, index, color, delay = 0 }) => {
  const percentage = (value / maxValue) * 100;
  const height = useSharedValue(0);
  
  useEffect(() => {
    height.value = withDelay(
      delay + (index * 50),
      withTiming(percentage, {
        duration: 800,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
  }, [value, maxValue]);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      height: `${height.value}%`,
    };
  });
  
  return (
    <View style={styles.chartBarContainer}>
      <View style={styles.chartBarWrapper}>
        <Animated.View
          style={[
            styles.chartBar,
            { backgroundColor: color },
            animatedStyle,
          ]}
        />
      </View>
      <Text style={styles.chartBarLabel}>{index + 1}</Text>
    </View>
  );
};

// Stat card component with animation
const StatCard = ({ title, value, subtitle, icon, color, delay = 0 }) => {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    scale.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
    
    opacity.value = withDelay(
      delay,
      withTiming(1, {
        duration: 600,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.statCard, animatedStyle]}>
      <View style={[styles.statIconContainer, { backgroundColor: `${color}20` }]}>
        {icon}
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statTitle}>{title}</Text>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statSubtitle}>{subtitle}</Text>
      </View>
    </Animated.View>
  );
};

// Product row component with animation
const ProductRow = ({ product, index }) => {
  const translateX = useSharedValue(50);
  const opacity = useSharedValue(0);
  
  useEffect(() => {
    translateX.value = withDelay(
      300 + (index * 100),
      withTiming(0, {
        duration: 500,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
    
    opacity.value = withDelay(
      300 + (index * 100),
      withTiming(1, {
        duration: 500,
        easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
      })
    );
  }, []);
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.productRow, animatedStyle]}>
      <View style={styles.productInfo}>
        <Text style={styles.productRank}>#{index + 1}</Text>
        <Text style={styles.productName}>{product.name}</Text>
      </View>
      <View style={styles.productMetrics}>
        <Text style={styles.productSales}>${product.sales}</Text>
        <View style={styles.productGrowthContainer}>
          <Text
            style={[
              styles.productGrowth,
              { color: product.growth >= 0 ? '#4CD964' : '#FF3B30' }
            ]}
          >
            {product.growth >= 0 ? '↑' : '↓'} {Math.abs(product.growth).toFixed(1)}%
          </Text>
        </View>
      </View>
    </Animated.View>
  );
};

export default function PerformanceAnalytics() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activePeriod, setActivePeriod] = useState('Month');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  const maxSalesValue = Math.max(...MONTHLY_SALES);
  const maxProfitValue = Math.max(...MONTHLY_PROFIT);
  
  // Dashboard summary metrics
  const metrics = [
    {
      title: 'Total Sales',
      value: `$${(MONTHLY_SALES.reduce((a, b) => a + b, 0) / 1000).toFixed(1)}k`,
      subtitle: '+15.3% from last period',
      icon: <MaterialIcons name="attach-money" size={24} color="#4CD964" />,
      color: '#4CD964',
      delay: 100,
    },
    {
      title: 'Orders',
      value: '385',
      subtitle: '+8.2% from last period',
      icon: <Ionicons name="cart" size={24} color="#5E7CE2" />,
      color: '#5E7CE2',
      delay: 200,
    },
    {
      title: 'Products',
      value: '48',
      subtitle: '12 new this month',
      icon: <Feather name="box" size={24} color="#FF9500" />,
      color: '#FF9500',
      delay: 300,
    },
    {
      title: 'Avg. Order',
      value: '$165',
      subtitle: '+5.8% from last period',
      icon: <FontAwesome5 name="chart-line" size={20} color="#AF52DE" />,
      color: '#AF52DE',
      delay: 400,
    },
  ];

  return (
    <View style={[styles.container]}>
      <StatusBar barStyle="light" />
      
      {/* Header */}
      <HomeHeader 
        title="Performance Analytics" 
        showBackButton={true} 
        onBackPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
       
      />
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5E7CE2" />
          <Text style={styles.loadingText}>Loading analytics data...</Text>
        </View>
      ) : (
      <ScrollView
          style={styles.scrollView}
        showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Stats Grid */}
          <View style={styles.metricsContainer}>
            {metrics.map((metric, index) => (
              <StatCard
                key={metric.title}
                title={metric.title}
                value={metric.value}
                subtitle={metric.subtitle}
                icon={metric.icon}
                color={metric.color}
                delay={metric.delay}
              />
            ))}
          </View>
          
          {/* Sales Chart */}
          <View style={styles.chartContainer}>
            <View style={styles.chartHeader}>
              <View>
                <Text style={styles.chartTitle}>Sales Performance</Text>
                <Text style={styles.chartSubtitle}>Monthly view</Text>
              </View>
              <PeriodSelector
                activePeriod={activePeriod}
                onChange={setActivePeriod}
              />
            </View>
            
            <View style={styles.chart}>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#5E7CE2' }]} />
                  <Text style={styles.legendText}>Sales</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendColor, { backgroundColor: '#FF9500' }]} />
                  <Text style={styles.legendText}>Profit</Text>
                </View>
              </View>
              
              <View style={styles.chartContent}>
                <View style={styles.chartGrid}>
                  <View style={styles.chartGridLine} />
                  <View style={styles.chartGridLine} />
                  <View style={styles.chartGridLine} />
                  <View style={styles.chartGridLine} />
                </View>
                
                <View style={styles.chartBars}>
                  {MONTHLY_SALES.map((value, index) => (
                    <View key={index} style={styles.chartBarGroup}>
                      <ChartBar
                        value={MONTHLY_SALES[index]}
                        maxValue={maxSalesValue}
                        index={index}
                        color="#5E7CE2"
                        delay={500}
                      />
                      <ChartBar
                        value={MONTHLY_PROFIT[index]}
                        maxValue={maxSalesValue}
                        index={index}
                        color="#FF9500"
                        delay={800}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </View>
          
          {/* Top Products */}
          <View style={styles.topProductsContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Products</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllButton}>See All</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.productsList}>
              {TOP_PRODUCTS.map((product, index) => (
                <ProductRow key={product.id} product={product} index={index} />
              ))}
            </View>
          </View>
          
          {/* Quick Actions */}
          <View style={styles.quickActionsContainer}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#E6F7FF' }]}>
                  <Feather name="download" size={20} color="#1890FF" />
                </View>
                <Text style={styles.quickActionText}>Export Report</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#FFF1F0' }]}>
                  <Feather name="share-2" size={20} color="#FF4D4F" />
                </View>
                <Text style={styles.quickActionText}>Share Insights</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.quickActionButton}>
                <View style={[styles.quickActionIcon, { backgroundColor: '#F6FFED' }]}>
                  <Feather name="bell" size={20} color="#52C41A" />
                </View>
                <Text style={styles.quickActionText}>Set Alerts</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  actionButton: {
    padding: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  metricsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 11,
    color: '#4CD964',
  },
  chartContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  chartSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    padding: 3,
  },
  periodButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  activePeriodButton: {
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  periodButtonText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activePeriodButtonText: {
    color: '#333',
  },
  chart: {
    marginTop: 10,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  chartContent: {
    height: 200,
    position: 'relative',
  },
  chartGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingTop: 10,
  },
  chartGridLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  chartBars: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingTop: 10,
  },
  chartBarGroup: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    flex: 1,
    justifyContent: 'center',
  },
  chartBarContainer: {
    width: 10,
    height: '100%',
    justifyContent: 'flex-end',
    marginHorizontal: 2,
  },
  chartBarWrapper: {
    width: '100%',
    height: '90%',
    justifyContent: 'flex-end',
  },
  chartBar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  chartBarLabel: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
  },
  topProductsContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 16,
    marginTop: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAllButton: {
    fontSize: 14,
    color: '#5E7CE2',
    fontWeight: '500',
  },
  productsList: {
    marginTop: 10,
  },
  productRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  productInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productRank: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#999',
    width: 30,
  },
  productName: {
    fontSize: 15,
    color: '#333',
  },
  productMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productSales: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginRight: 10,
  },
  productGrowthContainer: {
    width: 70,
    alignItems: 'flex-end',
  },
  productGrowth: {
    fontSize: 14,
    fontWeight: '500',
  },
  quickActionsContainer: {
    margin: 16,
    marginTop: 0,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  quickActionButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '30%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
});
