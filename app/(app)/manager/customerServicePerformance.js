import React, { useState, useEffect, useRef } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  StatusBar,
  SafeAreaView,
  Animated,
  Platform,
  TextInput
} from "react-native";
import { PieChart, LineChart, BarChart } from "react-native-chart-kit";
import {
  customerSatisfactionData,
  escalatedIssues,
  responseTimes,
} from "../../global/data";
import { MaterialIcons, FontAwesome5, Ionicons, MaterialCommunityIcons, AntDesign } from "@expo/vector-icons";
import * as Haptics from 'expo-haptics';
import { useRouter } from "expo-router";
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(78, 98, 215, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.5,
  useShadowColorFromDataset: false,
  decimalPlaces: 0,
  labelColor: () => `rgba(59, 70, 150, 0.9)`,
};

export default function CustomerServicePerformance() {
  const [averageSatisfactionScore, setAverageSatisfactionScore] = useState(0);
  const [averageNetPromoterScore, setAverageNetPromoterScore] = useState(0);
  const [averageCustomerEffortScore, setAverageCustomerEffortScore] = useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);
  const [timeRange, setTimeRange] = useState("week"); // week, month, quarter, year
  const [activeTab, setActiveTab] = useState("overview"); // overview, details, trends
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Time frame and animations
  useEffect(() => {
    // Calculate metrics
    if (customerSatisfactionData.length > 0) {
      const totalSatisfaction = customerSatisfactionData.reduce(
        (sum, data) => sum + data.rating,
        0
      );
      setAverageSatisfactionScore(
        (totalSatisfaction / customerSatisfactionData.length).toFixed(1)
      );

      // Filter only Net Promoter Score data
      const npsData = customerSatisfactionData.filter(data => 
        data.satisfactionType === "Net Promoter Score"
      );
      
      if (npsData.length > 0) {
        const totalPromoterScore = npsData.reduce(
          (sum, data) => sum + data.rating,
          0
        );
        setAverageNetPromoterScore(
          (totalPromoterScore / npsData.length).toFixed(1)
        );
      }

      // Filter only Customer Effort Score data
      const cesData = customerSatisfactionData.filter(data => 
        data.satisfactionType === "Customer Effort Score"
      );
      
      if (cesData.length > 0) {
        const totalEffortScore = cesData.reduce(
          (sum, data) => sum + data.rating,
          0
        );
        setAverageCustomerEffortScore(
          (totalEffortScore / cesData.length).toFixed(1)
        );
      }
    }

    if (responseTimes.length > 0) {
      const totalResponseTime = responseTimes.reduce(
        (sum, time) => sum + time.responseTime,
        0
      );
      setAverageResponseTime(
        (totalResponseTime / responseTimes.length).toFixed(1)
      );
    }

    // Start animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Animate tab change
  useEffect(() => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [activeTab, timeRange]);

  // Calculate metrics for prioritized issues
  const priorityCounts = {
    high: escalatedIssues.filter((issue) => issue.priority === "high").length,
    medium: escalatedIssues.filter((issue) => issue.priority === "medium").length,
    low: escalatedIssues.filter((issue) => issue.priority === "low").length,
  };

  const totalIssues = escalatedIssues.length;

  // Enhanced pie data for the chart
  const pieData = [
    {
      name: "High Priority",
      population: priorityCounts.high,
      color: "#ef4444",
      legendFontColor: "#334155",
      legendFontSize: 13,
    },
    {
      name: "Medium Priority",
      population: priorityCounts.medium,
      color: "#f59e0b",
      legendFontColor: "#334155",
      legendFontSize: 13,
    },
    {
      name: "Low Priority",
      population: priorityCounts.low,
      color: "#10b981",
      legendFontColor: "#334155",
      legendFontSize: 13,
    },
  ];

  // Sample data for line chart trends
  const responseTimeTrends = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [10, 8, 12, 9, 7, 5, 8],
        color: (opacity = 1) => `rgba(78, 152, 237, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Response Time (minutes)"]
  };

  // Sample data for satisfaction trends
  const satisfactionTrends = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [4.2, 4.5, 4.3, 4.6, 4.8, 4.7, 4.9],
        color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Satisfaction Score"]
  };

  // Sample data for escalation trends
  const escalationTrends = {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    datasets: [
      {
        data: [5, 3, 7, 4, 2, 1, 3],
        color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Escalated Issues"]
  };
  
  // Sample data for bar chart by channel
  const channelPerformance = {
    labels: ["Phone", "Email", "Chat", "WhatsApp", "Social"],
    datasets: [
      {
        data: [4.8, 4.2, 4.5, 4.7, 3.9],
      }
    ]
  };

  // Metric Card Component
  const MetricCard = ({ title, value, icon, color, trend, subtitle }) => {
    return (
      <Animated.View
        className="bg-white rounded-xl shadow-sm mb-3 overflow-hidden border border-gray-100"
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <LinearGradient
          colors={['#ffffff', '#f8fafc']}
          className="p-4"
        >
          <View className="flex-row justify-between items-center">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${color}15` }}>
                {icon}
              </View>
              <View className="ml-3">
                <Text className="text-sm text-gray-500">{title}</Text>
                <View className="flex-row items-baseline">
                  <Text className="text-xl font-bold text-gray-800">{value}</Text>
                  {subtitle && (
                    <Text className="text-xs text-gray-500 ml-1">{subtitle}</Text>
                  )}
                </View>
              </View>
            </View>
            
            {trend && (
              <View className="flex-row items-center">
                {trend > 0 ? (
                  <>
                    <AntDesign name="arrowup" size={12} color="#10b981" />
                    <Text className="text-xs text-green-600 ml-1">+{trend}%</Text>
                  </>
                ) : (
                  <>
                    <AntDesign name="arrowdown" size={12} color="#ef4444" />
                    <Text className="text-xs text-red-600 ml-1">{trend}%</Text>
                  </>
                )}
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  // Time Filter Component
  const TimeFilter = () => {
    return (
      <View className="flex-row mb-4 bg-gray-100 p-1 rounded-full">
        {["week", "month", "quarter", "year"].map((period) => (
          <TouchableOpacity
            key={period}
            className={`flex-1 py-2 px-3 rounded-full ${
              timeRange === period ? "bg-white shadow-sm" : ""
            }`}
            style={{
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: timeRange === period ? 1 : 0,
            }}
            onPress={() => setTimeRange(period)}
          >
            <Text
              className={`text-center text-xs font-medium ${
                timeRange === period ? "text-indigo-600" : "text-gray-500"
              }`}
            >
              {period.charAt(0).toUpperCase() + period.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Tab Navigation Component
  const TabNavigation = () => {
    return (
      <View className="flex-row mb-4 border-b border-gray-200">
        {[
          { id: "overview", label: "Overview", icon: "pie-chart" },
          { id: "details", label: "Details", icon: "bar-chart" },
          { id: "trends", label: "Trends", icon: "trending-up" },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.id}
            className={`flex-1 py-3 px-2 ${
              activeTab === tab.id ? "border-b-2 border-indigo-600" : ""
            }`}
            onPress={() => setActiveTab(tab.id)}
          >
            <View className="flex-row justify-center items-center">
              <MaterialIcons
                name={tab.icon}
                size={16}
                color={activeTab === tab.id ? "#4f46e5" : "#9ca3af"}
              />
              <Text
                className={`ml-1 text-sm font-medium ${
                  activeTab === tab.id ? "text-indigo-600" : "text-gray-500"
                }`}
              >
                {tab.label}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // Render Overview Tab
  const renderOverviewTab = () => {
    return (
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View className="flex-row flex-wrap justify-between">
          <View className="w-[48%]">
            <MetricCard
              title="Customer Satisfaction"
              value={averageSatisfactionScore}
              subtitle="/ 5.0"
              icon={<MaterialIcons name="sentiment-very-satisfied" size={20} color="#4f46e5" />}
              color="#4f46e5"
              trend={7.2}
            />
          </View>
          
          <View className="w-[48%]">
            <MetricCard
              title="Net Promoter Score"
              value={averageNetPromoterScore}
              subtitle="/ 10.0"
              icon={<MaterialIcons name="thumb-up" size={20} color="#0ea5e9" />}
              color="#0ea5e9"
              trend={4.3}
            />
          </View>
          
          <View className="w-[48%]">
            <MetricCard
              title="Customer Effort"
              value={averageCustomerEffortScore}
              subtitle="/ 5.0"
              icon={<MaterialIcons name="speed" size={20} color="#8b5cf6" />}
              color="#8b5cf6"
              trend={-2.1}
            />
          </View>
          
          <View className="w-[48%]">
            <MetricCard
              title="Response Time"
              value={averageResponseTime}
              subtitle="min"
              icon={<MaterialIcons name="timer" size={20} color="#f59e0b" />}
              color="#f59e0b"
              trend={-5.4}
            />
          </View>
        </View>
        
        <View className="bg-white rounded-xl shadow-sm mt-3 mb-6 p-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 mb-3">Escalated Issues Breakdown</Text>
          <PieChart
            data={pieData}
            width={SCREEN_WIDTH - 50}
            height={180}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            center={[10, 0]}
            absolute
            hasLegend={true}
          />
          
          <View className="flex-row justify-between mt-3 pt-3 border-t border-gray-100">
            <View className="items-center">
              <Text className="text-sm text-gray-500">Total Issues</Text>
              <Text className="text-xl font-bold text-gray-800">{totalIssues}</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Resolution Rate</Text>
              <Text className="text-xl font-bold text-green-600">72%</Text>
            </View>
            <View className="items-center">
              <Text className="text-sm text-gray-500">Avg. Time</Text>
              <Text className="text-xl font-bold text-orange-500">4.2 hrs</Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  // Render Details Tab
  const renderDetailsTab = () => {
    return (
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 p-4 border-b border-gray-100">Satisfaction by Channel</Text>
          <BarChart
            data={channelPerformance}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(106, 90, 205, ${opacity})`,
              barPercentage: 0.7,
            }}
            style={{
              marginVertical: 10,
              borderRadius: 10,
            }}
            fromZero
            showValuesOnTopOfBars
          />
        </View>
        
        <View className="bg-white rounded-xl shadow-sm mb-4 p-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 mb-3">Top Performance Indicators</Text>
          
          {[
            { label: "First Response Time", value: "2.3 min", change: "-12%", status: "good" },
            { label: "Resolution Rate", value: "94%", change: "+5%", status: "good" },
            { label: "One Touch Resolution", value: "68%", change: "+2%", status: "good" },
            { label: "Avg. Handle Time", value: "4.8 min", change: "+1%", status: "neutral" },
            { label: "Customer Retention", value: "86%", change: "-3%", status: "bad" },
          ].map((indicator, index) => (
            <View key={index} className="flex-row justify-between items-center py-3 border-b border-gray-100">
              <Text className="text-gray-700">{indicator.label}</Text>
              <View className="flex-row items-center">
                <Text className="font-bold text-gray-800 mr-2">{indicator.value}</Text>
                <View 
                  className="flex-row items-center px-2 py-1 rounded-full" 
                  style={{ 
                    backgroundColor: indicator.status === "good" ? "#dcfce7" : 
                                    indicator.status === "bad" ? "#fee2e2" : "#f3f4f6" 
                  }}
                >
                  {indicator.status === "good" ? (
                    <AntDesign name="arrowup" size={10} color="#16a34a" />
                  ) : indicator.status === "bad" ? (
                    <AntDesign name="arrowdown" size={10} color="#dc2626" />
                  ) : (
                    <AntDesign name="minus" size={10} color="#6b7280" />
                  )}
                  <Text 
                    className="text-xs ml-1"
                    style={{ 
                      color: indicator.status === "good" ? "#16a34a" : 
                            indicator.status === "bad" ? "#dc2626" : "#6b7280" 
                    }}
                  >
                    {indicator.change}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </Animated.View>
    );
  };

  // Render Trends Tab
  const renderTrendsTab = () => {
    return (
      <Animated.View 
        style={{ 
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }]
        }}
      >
        <View className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 p-4 border-b border-gray-100">Customer Satisfaction Trend</Text>
          <LineChart
            data={satisfactionTrends}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#fff"
              }
            }}
            bezier
            style={{
              marginVertical: 10,
              borderRadius: 10,
            }}
          />
        </View>
        
        <View className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 p-4 border-b border-gray-100">Response Time Trend</Text>
          <LineChart
            data={responseTimeTrends}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#fff"
              }
            }}
            bezier
            style={{
              marginVertical: 10,
              borderRadius: 10,
            }}
          />
        </View>
        
        <View className="bg-white rounded-xl shadow-sm mb-4 border border-gray-100">
          <Text className="text-base font-bold text-gray-800 p-4 border-b border-gray-100">Escalated Issues Trend</Text>
          <LineChart
            data={escalationTrends}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={{
              ...chartConfig,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              propsForDots: {
                r: "5",
                strokeWidth: "2",
                stroke: "#fff"
              }
            }}
            bezier
            style={{
              marginVertical: 10,
              borderRadius: 10,
            }}
          />
        </View>
      </Animated.View>
    );
  };

  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f8fafc" />
      
      {/* Header */}
      <View className="px-4 py-3 flex-row items-center justify-between">
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <MaterialIcons name="arrow-back" size={24} color="#64748b" />
        </TouchableOpacity>
        
        <Text className="text-xl font-bold text-gray-800">Performance Metrics</Text>
        
        <TouchableOpacity 
          className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            // Download or share report
          }}
        >
          <MaterialIcons name="file-download" size={22} color="#64748b" />
        </TouchableOpacity>
      </View>
      
      <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
        {/* Tab Navigation */}
        <TabNavigation />
        
        {/* Time Range Filter */}
        <TimeFilter />
        
        {/* Content based on active tab */}
        {activeTab === "overview" && renderOverviewTab()}
        {activeTab === "details" && renderDetailsTab()}
        {activeTab === "trends" && renderTrendsTab()}
        
        {/* Quick Actions */}
        <View className="flex-row flex-wrap justify-between mb-8">
          <TouchableOpacity 
            className="w-[48%] bg-indigo-50 rounded-xl py-3 px-4 mb-3 flex-row items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/manager/customerList");
            }}
          >
            <MaterialIcons name="people" size={22} color="#4f46e5" />
            <Text className="text-indigo-700 font-medium ml-2">Customer List</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-[48%] bg-green-50 rounded-xl py-3 px-4 mb-3 flex-row items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push("/manager/HandlingEscalatedIssues");
            }}
          >
            <MaterialIcons name="priority-high" size={22} color="#10b981" />
            <Text className="text-green-700 font-medium ml-2">Issues</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-[48%] bg-amber-50 rounded-xl py-3 px-4 mb-3 flex-row items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Export to PDF
            }}
          >
            <MaterialIcons name="picture-as-pdf" size={22} color="#f59e0b" />
            <Text className="text-amber-700 font-medium ml-2">Export PDF</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            className="w-[48%] bg-red-50 rounded-xl py-3 px-4 mb-3 flex-row items-center"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              // Share report
            }}
          >
            <MaterialIcons name="share" size={22} color="#ef4444" />
            <Text className="text-red-700 font-medium ml-2">Share Report</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
