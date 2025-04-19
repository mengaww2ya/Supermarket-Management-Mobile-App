import React from 'react';
import {
    View,
    Text,
    ScrollView,
    Dimensions,
    RefreshControl,
} from 'react-native';
import { LineChart, BarChart } from "react-native-chart-kit";
import { MaterialCommunityIcons } from '@expo/vector-icons';

const SupplierAnalytics = ({
    orders,
    refreshing,
    onRefresh,
    getStatusColor,
    getStatusIcon
}) => {

    // Get analytics data from orders
    const getAnalyticsData = () => {
        // Order status statistics
        const statusCounts = {
            pending: 0,
            processing: 0,
            shipped: 0,
            delivered: 0,
            cancelled: 0
        };

        orders.forEach(order => {
            if (statusCounts.hasOwnProperty(order.status)) {
                statusCounts[order.status]++;
            }
        });

        // Monthly order data (last 6 months)
        const monthlyData = getMonthlyOrderData();

        // Top suppliers by order volume
        const supplierStats = getSupplierStats();

        return {
            statusCounts,
            monthlyData,
            supplierStats
        };
    };

    // Get monthly order data for the last 6 months
    const getMonthlyOrderData = () => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const now = new Date();
        const labels = [];
        const orderCounts = [];
        const orderValues = [];

        // Get last 6 months
        for (let i = 5; i >= 0; i--) {
            const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthYear = `${monthNames[month.getMonth()]}`;
            labels.push(monthYear);

            // Count orders for this month
            const monthOrders = orders.filter(order => {
                const orderDate = order.orderDate ? new Date(order.orderDate.toDate()) : null;
                return orderDate &&
                    orderDate.getMonth() === month.getMonth() &&
                    orderDate.getFullYear() === month.getFullYear();
            });

            orderCounts.push(monthOrders.length);

            // Sum order values
            const monthTotal = monthOrders.reduce((sum, order) => {
                return sum + (order.totalAmount || 0);
            }, 0);

            orderValues.push(monthTotal);
        }

        return {
            labels,
            orderCounts,
            orderValues
        };
    };

    // Get supplier statistics
    const getSupplierStats = () => {
        const supplierOrders = {};
        const supplierValues = {};

        orders.forEach(order => {
            if (order.supplier && order.supplier.id) {
                const supplierId = order.supplier.id;

                // Count orders per supplier
                if (!supplierOrders[supplierId]) {
                    supplierOrders[supplierId] = {
                        id: supplierId,
                        name: order.supplier.name || 'Unknown',
                        count: 0,
                        value: 0
                    };
                }

                supplierOrders[supplierId].count += 1;
                supplierOrders[supplierId].value += (order.totalAmount || 0);
            }
        });

        // Convert to array and sort by count
        const sortedSuppliers = Object.values(supplierOrders)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5); // Get top 5

        return sortedSuppliers;
    };

    // Render dashboard statistics
    const renderDashboardStats = () => {
        const analytics = getAnalyticsData();

        return (
            <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#111827' }}>
                    Order Summary
                </Text>

                <View style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    marginBottom: 24
                }}>
                    {Object.entries(analytics.statusCounts).map(([status, count]) => (
                        <View key={status} style={{
                            width: '48%',
                            backgroundColor: 'white',
                            borderRadius: 12,
                            padding: 16,
                            marginBottom: 12,
                            borderWidth: 1,
                            borderColor: '#E5E7EB',
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.05,
                            shadowRadius: 3,
                            elevation: 2,
                        }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Text style={{ fontSize: 14, color: '#6B7280', textTransform: 'capitalize' }}>
                                    {status}
                                </Text>
                                <View style={{
                                    width: 36,
                                    height: 36,
                                    borderRadius: 18,
                                    backgroundColor: getStatusColor(status).bg,
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                }}>
                                    {getStatusIcon(status, 18, getStatusColor(status).text)}
                                </View>
                            </View>
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 8 }}>
                                {count}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Monthly Order Trends */}
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#111827' }}>
                        Monthly Order Trends
                    </Text>

                    {orders.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <LineChart
                                data={{
                                    labels: analytics.monthlyData.labels,
                                    datasets: [
                                        {
                                            data: analytics.monthlyData.orderCounts
                                        }
                                    ]
                                }}
                                width={Dimensions.get("window").width * 0.9}
                                height={220}
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(79, 70, 229, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    propsForDots: {
                                        r: "6",
                                        strokeWidth: "2",
                                        stroke: "#4F46E5"
                                    }
                                }}
                                bezier
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                            />
                        </ScrollView>
                    ) : (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: '#6B7280', fontSize: 16 }}>No order data available</Text>
                        </View>
                    )}
                </View>

                {/* Order Value Trends */}
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#111827' }}>
                        Monthly Order Value
                    </Text>

                    {orders.length > 0 ? (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            <BarChart
                                data={{
                                    labels: analytics.monthlyData.labels,
                                    datasets: [
                                        {
                                            data: analytics.monthlyData.orderValues
                                        }
                                    ]
                                }}
                                width={Dimensions.get("window").width * 0.9}
                                height={220}
                                yAxisSuffix=""
                                chartConfig={{
                                    backgroundColor: "#ffffff",
                                    backgroundGradientFrom: "#ffffff",
                                    backgroundGradientTo: "#ffffff",
                                    decimalPlaces: 0,
                                    color: (opacity = 1) => `rgba(5, 150, 105, ${opacity})`,
                                    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
                                    style: {
                                        borderRadius: 16
                                    },
                                    barPercentage: 0.5,
                                }}
                                style={{
                                    marginVertical: 8,
                                    borderRadius: 16
                                }}
                                showValuesOnTopOfBars={true}
                                fromZero={true}
                                formatYLabel={(value) => `$${parseInt(value)}`}
                            />
                        </ScrollView>
                    ) : (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: '#6B7280', fontSize: 16 }}>No order data available</Text>
                        </View>
                    )}
                </View>

                {/* Top Suppliers */}
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 16,
                    padding: 20,
                    marginBottom: 24,
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.05,
                    shadowRadius: 3,
                    elevation: 2,
                }}>
                    <Text style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 16, color: '#111827' }}>
                        Top Suppliers
                    </Text>

                    {analytics.supplierStats.length > 0 ? (
                        <View>
                            {analytics.supplierStats.map((supplier, index) => (
                                <View key={supplier.id} style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    paddingVertical: 12,
                                    borderBottomWidth: index < analytics.supplierStats.length - 1 ? 1 : 0,
                                    borderBottomColor: '#E5E7EB'
                                }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{
                                            width: 24,
                                            fontSize: 14,
                                            fontWeight: 'bold',
                                            color: '#6B7280',
                                            textAlign: 'center'
                                        }}>
                                            {index + 1}
                                        </Text>
                                        <Text style={{ fontSize: 16, color: '#111827', marginLeft: 12 }}>
                                            {supplier.name}
                                        </Text>
                                    </View>
                                    <View style={{ flexDirection: 'row' }}>
                                        <View style={{ alignItems: 'flex-end', marginRight: 24 }}>
                                            <Text style={{ fontSize: 12, color: '#6B7280' }}>Orders</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                                {supplier.count}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={{ fontSize: 12, color: '#6B7280' }}>Value</Text>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827' }}>
                                                ${supplier.value.toFixed(2)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', padding: 20 }}>
                            <Text style={{ color: '#6B7280', fontSize: 16 }}>No supplier data available</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 100 }}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            {renderDashboardStats()}
        </ScrollView>
    );
};

export default SupplierAnalytics; 