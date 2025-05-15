import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
  Pressable
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome, Feather, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../../components/HomeHeader";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import * as Haptics from 'expo-haptics';

export default function DiscountedOrders() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const filterButtonRef = useRef(null);
  const [filterPosition, setFilterPosition] = useState({ top: 0, right: 0 });
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const modalY = useRef(new Animated.Value(Dimensions.get('window').height)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
    
    fetchOrders();
  }, []);

  useEffect(() => {
    filterAndSortOrders();
  }, [orders, searchQuery, filterStatus, sortBy]);

  useEffect(() => {
    if (filterModalVisible) {
      Animated.parallel([
        Animated.timing(modalY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalY, {
          toValue: Dimensions.get('window').height,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [filterModalVisible]);

  useEffect(() => {
    if (filterModalVisible) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    } else {
      modalScaleAnim.setValue(0.95);
      modalOpacity.setValue(0);
    }
  }, [filterModalVisible]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch orders with discounts applied
      const ordersSnapshot = await getDocs(
        query(
          collection(db, "orders"),
          where("hasDiscount", "==", true)
        )
      );
      
      const fetchedOrders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setOrders(fetchedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortOrders = () => {
    let result = [...orders];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(order =>
        order.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.id?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== "all") {
      result = result.filter(order => order.status === filterStatus);
    }

    // Apply sorting
    switch (sortBy) {
      case "dateDesc":
        result.sort((a, b) => b.orderDate?.toDate() - a.orderDate?.toDate());
        break;
      case "dateAsc":
        result.sort((a, b) => a.orderDate?.toDate() - b.orderDate?.toDate());
        break;
      case "amountDesc":
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case "amountAsc":
        result.sort((a, b) => a.totalAmount - b.totalAmount);
        break;
      case "discountDesc":
        result.sort((a, b) => b.discountAmount - a.discountAmount);
        break;
    }

    setFilteredOrders(result);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10B981";
      case "processing":
        return "#F59E0B";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const renderOrderCard = (order) => {
    const statusColor = getStatusColor(order.status);
    const scaleAnim = React.useRef(new Animated.Value(1)).current;
    
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
    
    return (
      <Animated.View
        key={order.id}
        style={{
          marginBottom: 16,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <TouchableOpacity
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            overflow: "hidden",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
          onPress={() => {
            setSelectedOrder(order);
            setModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
        >
          <View style={{ padding: 16 }}>
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center", 
              marginBottom: 8 
            }}>
              <View>
                <Text style={{ 
                  fontSize: 16, 
                  fontWeight: "bold", 
                  color: "#1F2937", 
                  marginBottom: 4 
                }}>
                  Order #{order.id.slice(-6)}
                </Text>
                <Text style={{ color: "#6B7280" }}>{order.customerName}</Text>
              </View>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: `${statusColor}20`,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: statusColor,
                  fontWeight: "600"
                }}>
                  {order.status}
                </Text>
              </View>
            </View>

            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between", 
              alignItems: "center",
              marginTop: 8
            }}>
              <View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>Order Total</Text>
                <Text style={{ fontSize: 15, fontWeight: "semibold", color: "#1F2937" }}>
                  {order.totalAmount?.toFixed(2)} Birr
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>Discount Applied</Text>
                <Text style={{ fontSize: 15, fontWeight: "semibold", color: "#6366F1" }}>
                  -{order.discountAmount?.toFixed(2)} Birr
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>Final Amount</Text>
                <Text style={{ fontSize: 15, fontWeight: "semibold", color: "#10B981" }}>
                  {(order.totalAmount - order.discountAmount)?.toFixed(2)} Birr
                </Text>
              </View>
            </View>

            <View style={{ 
              marginTop: 12, 
              paddingTop: 8, 
              borderTopWidth: 1, 
              borderTopColor: "#F3F4F6" 
            }}>
              <Text style={{ 
                fontSize: 12, 
                color: "#6B7280" 
              }}>
                {new Date(order.orderDate?.toDate()).toLocaleString()}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderDetailModal = () => {
    if (!selectedOrder) return null;

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
          <View style={{
            flex: 1,
            marginTop: 20,
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}>
            <View style={{
              padding: 16,
              borderBottomWidth: 1,
              borderColor: "#F3F4F6",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "bold",
                color: "#1F2937"
              }}>
                Order Details
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 16 }}>
              <View style={{ gap: 16 }}>
                <View>
                  <Text style={{ color: "#6B7280", marginBottom: 4 }}>Order ID</Text>
                  <Text style={{ fontSize: 18, fontWeight: "semibold", color: "#1F2937" }}>
                    #{selectedOrder.id}
                  </Text>
                </View>

                <View>
                  <Text style={{ color: "#6B7280", marginBottom: 4 }}>Customer</Text>
                  <Text style={{ fontSize: 18, fontWeight: "semibold", color: "#1F2937" }}>
                    {selectedOrder.customerName}
                  </Text>
                </View>

                <View>
                  <Text style={{ color: "#6B7280", marginBottom: 4 }}>Order Date</Text>
                  <Text style={{ color: "#1F2937" }}>
                    {new Date(selectedOrder.orderDate?.toDate()).toLocaleString()}
                  </Text>
                </View>

                <View>
                  <Text style={{ color: "#6B7280", marginBottom: 8 }}>Items</Text>
                  {selectedOrder.items?.map((item, index) => (
                    <View
                      key={index}
                      style={{ 
                        flexDirection: "row", 
                        justifyContent: "space-between", 
                        alignItems: "center", 
                        paddingVertical: 8,
                        borderBottomWidth: 1,
                        borderBottomColor: "#F3F4F6"
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontWeight: "500", color: "#1F2937" }}>{item.name}</Text>
                        <Text style={{ color: "#6B7280" }}>
                          Qty: {item.quantity} × {item.price} Birr
                        </Text>
                      </View>
                      <Text style={{ fontWeight: "500", color: "#1F2937" }}>
                        {(item.quantity * item.price).toFixed(2)} Birr
                      </Text>
                    </View>
                  ))}
                </View>

                <View style={{ paddingTop: 8 }}>
                  <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between",
                    marginBottom: 8
                  }}>
                    <Text style={{ color: "#6B7280" }}>Subtotal</Text>
                    <Text style={{ fontWeight: "500", color: "#1F2937" }}>
                      {selectedOrder.totalAmount?.toFixed(2)} Birr
                    </Text>
                  </View>
                  <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between",
                    marginBottom: 8
                  }}>
                    <Text style={{ color: "#6B7280" }}>Discount</Text>
                    <Text style={{ fontWeight: "500", color: "#6366F1" }}>
                      -{selectedOrder.discountAmount?.toFixed(2)} Birr
                    </Text>
                  </View>
                  <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between",
                    paddingTop: 8,
                    borderTopWidth: 1,
                    borderTopColor: "#F3F4F6"
                  }}>
                    <Text style={{ fontWeight: "600", color: "#1F2937" }}>Total</Text>
                    <Text style={{ fontWeight: "600", color: "#10B981" }}>
                      {(selectedOrder.totalAmount - selectedOrder.discountAmount)?.toFixed(2)} Birr
                    </Text>
                  </View>
                </View>

                {selectedOrder.discountDetails && (
                  <View>
                    <Text style={{ color: "#6B7280", marginBottom: 4 }}>Applied Discount</Text>
                    <View style={{ 
                      backgroundColor: "#EEF2FF", 
                      padding: 12, 
                      borderRadius: 8 
                    }}>
                      <Text style={{ 
                        fontWeight: "500", 
                        color: "#6366F1", 
                        marginBottom: 4
                      }}>
                        {selectedOrder.discountDetails.name}
                      </Text>
                      <Text style={{ color: "#4F46E5" }}>
                        {selectedOrder.discountDetails.description}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  const measureFilterButton = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setFilterPosition({
          top: pageY + height + 10,
          right: Dimensions.get('window').width - (pageX + width)
        });
      });
    }
  };

  const renderFilterModal = () => {
    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)"
        }}>
          <Animated.View style={{
            position: "absolute",
            top: filterPosition.top,
            right: 16,
            width: 320,
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            transform: [{ scale: modalScaleAnim }],
            opacity: modalOpacity,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
            maxHeight: "80%"
          }}>
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 16
            }}>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937" }}>
                Filter & Sort
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  setFilterModalVisible(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "#F3F4F6",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <Feather name="x" size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
                  Order Status
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {["all", "completed", "processing", "cancelled"].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: filterStatus === status ? "#6366F1" : "#F3F4F6",
                      }}
                      onPress={() => {
                        setFilterStatus(status);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        color: filterStatus === status ? "white" : "#6B7280",
                        fontWeight: "600",
                        textTransform: "capitalize"
                      }}>
                        {status === "all" ? "All Orders" : status}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ marginBottom: 20 }}>
                <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
                  Sort By
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {[
                    { value: "dateDesc", label: "Newest" },
                    { value: "dateAsc", label: "Oldest" },
                    { value: "amountDesc", label: "Highest Amount" },
                    { value: "amountAsc", label: "Lowest Amount" },
                    { value: "discountDesc", label: "Highest Discount" }
                  ].map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: sortBy === option.value ? "#6366F1" : "#F3F4F6",
                      }}
                      onPress={() => {
                        setSortBy(option.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        color: sortBy === option.value ? "white" : "#6B7280",
                        fontWeight: "600",
                      }}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center"
                }}
                onPress={() => {
                  setFilterStatus("all");
                  setSortBy("dateDesc");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={{ color: "#4B5563", fontWeight: "500" }}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#6366F1",
                  borderRadius: 8,
                  alignItems: "center"
                }}
                onPress={() => {
                  setFilterModalVisible(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={{ color: "white", fontWeight: "600" }}>Apply</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <HomeHeader title="Discounted Orders" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <HomeHeader title="Discounted Orders" />
      
      <Animated.View 
        style={{ 
          flex: 1, 
          opacity: fadeAnim 
        }}
      >
        {/* Search Bar and Filter Button */}
        <View style={{ 
          paddingHorizontal: 16, 
          paddingTop: 16, 
          paddingBottom: 12, 
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6"
        }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8
          }}>
            <View style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginRight: 8
            }}>
              <Feather name="search" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
              <TextInput
                style={{ 
                  flex: 1, 
                  padding: 10,
                  color: "#1F2937",
                  fontSize: 15
                }}
                placeholder="Search orders..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Feather name="x" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ) : null}
            </View>
            
            <TouchableOpacity 
              ref={filterButtonRef}
              style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: "#F3F4F6",
                paddingHorizontal: 14,
                paddingVertical: 10,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB"
              }}
              onPress={() => {
                measureFilterButton();
                setFilterModalVisible(true);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Feather name="sliders" size={16} color="#4B5563" />
              {(filterStatus !== "all" || sortBy !== "dateDesc") && (
                <View style={{
                  backgroundColor: "#6366F1",
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  marginLeft: 6,
                  position: 'absolute',
                  top: 8,
                  right: 8
                }} />
              )}
            </TouchableOpacity>
          </View>
          
          <View style={{ 
            flexDirection: "row", 
            alignItems: "center"
          }}>
            <Text style={{ color: "#6B7280", fontSize: 13 }}>
              {filteredOrders.length} {filteredOrders.length === 1 ? "order" : "orders"} found
            </Text>
            {filterStatus !== "all" && (
              <View style={{ 
                flexDirection: "row", 
                alignItems: "center",
                backgroundColor: "#EEF2FF",
                paddingHorizontal: 8, 
                paddingVertical: 4, 
                borderRadius: 16,
                marginLeft: 8
              }}>
                <Text style={{ color: "#6366F1", fontSize: 12, textTransform: "capitalize" }}>
                  {filterStatus}
                </Text>
                <TouchableOpacity 
                  onPress={() => setFilterStatus("all")}
                  style={{ marginLeft: 4 }}
                >
                  <Feather name="x" size={14} color="#6366F1" />
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Order List */}
        <ScrollView
          style={{ flex: 1, padding: 16 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={fetchOrders} />
          }
        >
          {filteredOrders.length === 0 ? (
            <View style={{ 
              flex: 1, 
              justifyContent: "center", 
              alignItems: "center", 
              paddingVertical: 40,
              backgroundColor: "white",
              borderRadius: 16,
              margin: 8,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 3,
            }}>
              <Feather name="inbox" size={48} color="#9CA3AF" />
              <Text style={{ color: "#6B7280", marginTop: 16, fontSize: 16 }}>No orders found</Text>
              <TouchableOpacity
                style={{
                  marginTop: 16,
                  backgroundColor: "#EEF2FF",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: 8
                }}
                onPress={() => {
                  setFilterStatus("all");
                  setSearchQuery("");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={{ color: "#6366F1", fontWeight: "500" }}>Clear Filters</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredOrders.map(renderOrderCard)
          )}
        </ScrollView>

        {renderDetailModal()}
        {renderFilterModal()}
      </Animated.View>
    </SafeAreaView>
  );
} 