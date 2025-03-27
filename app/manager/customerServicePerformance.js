import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { PieChart } from "react-native-chart-kit";
import {
  customerSatisfactionData,
  escalatedIssues,
  responseTimes,
} from "../global/data";

export default function CustomerServicePerformance() {
  const [averageSatisfactionScore, setAverageSatisfactionScore] = useState(0);
  const [averageNetPromoterScore, setAverageNetPromoterScore] = useState(0);
  const [averageCustomerEffortScore, setAverageCustomerEffortScore] =
    useState(0);
  const [averageResponseTime, setAverageResponseTime] = useState(0);

  useEffect(() => {
    if (customerSatisfactionData.length > 0) {
      const totalSatisfaction = customerSatisfactionData.reduce(
        (sum, data) => sum + data.satisfactionScore,
        0
      );
      setAverageSatisfactionScore(
        (totalSatisfaction / customerSatisfactionData.length).toFixed(2)
      );

      const totalPromoterScore = customerSatisfactionData.reduce(
        (sum, data) => sum + data.netPromoterScore,
        0
      );
      setAverageNetPromoterScore(
        (totalPromoterScore / customerSatisfactionData.length).toFixed(2)
      );

      const totalEffortScore = customerSatisfactionData.reduce(
        (sum, data) => sum + data.customerEffortScore,
        0
      );
      setAverageCustomerEffortScore(
        (totalEffortScore / customerSatisfactionData.length).toFixed(2)
      );
    }

    if (responseTimes.length > 0) {
      const totalResponseTime = responseTimes.reduce(
        (sum, time) => sum + time.minutes,
        0
      );
      setAverageResponseTime(
        (totalResponseTime / responseTimes.length).toFixed(2)
      );
    }
  }, []);

  const priorityCounts = {
    high: escalatedIssues.filter((issue) => issue.priority === "high").length,
    medium: escalatedIssues.filter((issue) => issue.priority === "medium")
      .length,
    low: escalatedIssues.filter((issue) => issue.priority === "low").length,
  };

  const totalIssues = escalatedIssues.length;

  const pieData = [
    {
      name: "High Priority",
      population: priorityCounts.high,
      color: "#e74c3c",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Medium Priority",
      population: priorityCounts.medium,
      color: "#f1c40f",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Low Priority",
      population: priorityCounts.low,
      color: "#2ecc71",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Customer Service Performance</Text>
      <View style={styles.metricsContainer}>
        <View style={styles.metricBox}>
          <Text style={styles.metricTitle}>Customer Satisfaction Score</Text>
          <Text style={styles.metricValue}>{averageSatisfactionScore}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricTitle}>Net Promoter Score</Text>
          <Text style={styles.metricValue}>{averageNetPromoterScore}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricTitle}>Customer Effort Score</Text>
          <Text style={styles.metricValue}>{averageCustomerEffortScore}</Text>
        </View>
        <View style={styles.metricBox}>
          <Text style={styles.metricTitle}>Average Response Time</Text>
          <Text style={styles.metricValue}>{averageResponseTime} min</Text>
        </View>
      </View>
      <Text style={styles.subHeader}>Escalated Issues Breakdown</Text>
      <PieChart
        data={pieData}
        width={300}
        height={200}
        chartConfig={{
          backgroundColor: "#fff",
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="15"
        absolute
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: "center",
    padding: 20,
    backgroundColor: "#f8f8f8",
  },
  header: { fontSize: 24, fontWeight: "bold", marginBottom: 15 },
  metricsContainer: { width: "100%", marginBottom: 20 },
  metricBox: {
    backgroundColor: "#fff",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
    alignItems: "center",
    elevation: 2,
  },
  metricTitle: { fontSize: 16, fontWeight: "bold", color: "#333" },
  metricValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2980b9",
    marginTop: 5,
  },
  subHeader: { fontSize: 20, fontWeight: "bold", marginVertical: 15 },
});
