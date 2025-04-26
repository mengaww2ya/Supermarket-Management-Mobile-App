import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Animated
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../../components/HomeHeader";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where } from "firebase/firestore";
import * as Haptics from 'expo-haptics';

export default function ViewDiscounts() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState([]);
  const [filteredDiscounts, setFilteredDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("dateDesc");
  const [selectedDiscount, setSelectedDiscount] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [discountTypeModalVisible, setDiscountTypeModalVisible] = useState(false);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.9)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  const [filterPosition, setFilterPosition] = useState({ top: 0, right: 0 });

  // Get ref to filter button for positioning filter modal
  const filterButtonRef = useRef(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
    
    fetchDiscounts();
  }, []);

  useEffect(() => {
    filterAndSortDiscounts();
  }, [discounts, searchQuery, filterType, sortBy]);
  
  // Modal animations
  useEffect(() => {
    if (modalVisible || filterModalVisible || discountTypeModalVisible) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    } else {
      // Reset animations when modal is closed
      modalScaleAnim.setValue(0.9);
      modalOpacityAnim.setValue(0);
    }
  }, [modalVisible, filterModalVisible, discountTypeModalVisible]);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(db, "discounts"));
      const fetchedDiscounts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setDiscounts(fetchedDiscounts);
    } catch (error) {
      console.error("Error fetching discounts:", error);
      Alert.alert("Error", "Failed to load discounts");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterAndSortDiscounts = () => {
    let result = [...discounts];

    // Apply search filter
    if (searchQuery) {
      result = result.filter(discount =>
        discount.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        discount.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply type filter
    if (filterType !== "all") {
      result = result.filter(discount => discount.type === filterType);
    }

    // Apply sorting
    switch (sortBy) {
      case "dateDesc":
        result.sort((a, b) => b.createdAt.toDate() - a.createdAt.toDate());
        break;
      case "dateAsc":
        result.sort((a, b) => a.createdAt.toDate() - b.createdAt.toDate());
        break;
      case "valueDesc":
        result.sort((a, b) => parseFloat(b.discountValue) - parseFloat(a.discountValue));
        break;
      case "valueAsc":
        result.sort((a, b) => parseFloat(a.discountValue) - parseFloat(b.discountValue));
        break;
      case "nameAsc":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
    }

    setFilteredDiscounts(result);
  };

  const handleToggleStatus = async (discount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const discountRef = doc(db, "discounts", discount.id);
      await updateDoc(discountRef, {
        active: !discount.active
      });
      
      // Update local state
      setDiscounts(prevDiscounts =>
        prevDiscounts.map(d =>
          d.id === discount.id ? { ...d, active: !d.active } : d
        )
      );

      Alert.alert(
        "Success",
        `Discount ${discount.active ? "deactivated" : "activated"} successfully`
      );
    } catch (error) {
      console.error("Error updating discount status:", error);
      Alert.alert("Error", "Failed to update discount status");
    }
  };

  const handleDeleteDiscount = async (discount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Confirm Delete",
      `Are you sure you want to delete the discount "${discount.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "discounts", discount.id));
              setDiscounts(prevDiscounts =>
                prevDiscounts.filter(d => d.id !== discount.id)
              );
              Alert.alert("Success", "Discount deleted successfully");
            } catch (error) {
              console.error("Error deleting discount:", error);
              Alert.alert("Error", "Failed to delete discount");
            }
          }
        }
      ]
    );
  };

  const handleSelectDiscountType = (discountType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDiscountTypeModalVisible(false);
    
    // Navigate to CreateDiscount and pass the discount type as a parameter
    router.push({
      pathname: "/manager/discounts/CreateDiscount",
      params: { type: discountType }
    });
  };
  
  const measureFilterButton = () => {
    if (filterButtonRef.current) {
      filterButtonRef.current.measure((x, y, width, height, pageX, pageY) => {
        setFilterPosition({ top: pageY, right: pageX });
      });
    }
  };

  const renderDiscountCard = (discount) => {
    const getStatusColor = (active) => active ? "#10B981" : "#6B7280";
    const getTypeIcon = (type) => {
      switch (type) {
        case "customer":
          return { name: "users", color: "#6366F1" };
        case "category":
          return { name: "tags", color: "#10B981" };
        case "product":
          return { name: "cube", color: "#EF4444" };
        default:
          return { name: "percent", color: "#6366F1" };
      }
    };

    const typeIcon = getTypeIcon(discount.type);
    const scaleAnim = new Animated.Value(1);

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
        key={discount.id}
        style={{
          marginBottom: 16,
          transform: [{ scale: scaleAnim }]
        }}
      >
        <TouchableOpacity
          style={{
            borderRadius: 16,
            overflow: "hidden",
            backgroundColor: "white",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 3,
          }}
          onPress={() => {
            setSelectedDiscount(discount);
            setModalVisible(true);
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
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: `${typeIcon.color}20`,
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12
                }}>
                  <FontAwesome name={typeIcon.name} size={20} color={typeIcon.color} />
                </View>
                <Text style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#1F2937",
                }}>
                  {discount.name}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 100,
                backgroundColor: `${getStatusColor(discount.active)}20`,
              }}>
                <Text style={{
                  fontSize: 12,
                  color: getStatusColor(discount.active),
                  fontWeight: "600"
                }}>
                  {discount.active ? "Active" : "Inactive"}
                </Text>
              </View>
            </View>

            <Text style={{
              fontSize: 12,
              color: "#6B7280",
              marginBottom: 8,
            }} numberOfLines={2}>
              {discount.description}
            </Text>

            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center"
            }}>
              <View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>Discount Value</Text>
                <Text style={{ fontSize: 15, fontWeight: "semibold", color: "#1F2937" }}>
                  {discount.discountValue}{discount.discountType === "percentage" ? "%" : " Birr"}
                </Text>
              </View>
              <View>
                <Text style={{ fontSize: 11, color: "#6B7280" }}>Valid Until</Text>
                <Text style={{ fontSize: 14, color: "#1F2937" }}>
                  {new Date(discount.endDate.toDate()).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>

          <View style={{
            flexDirection: "row",
            borderTopWidth: 1,
            borderColor: "#F3F4F6"
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center"
              }}
              onPress={() => handleToggleStatus(discount)}
            >
              <FontAwesome
                name={discount.active ? "pause-circle" : "play-circle"}
                size={16}
                color="#6366F1"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#6366F1", fontWeight: "500" }}>
                {discount.active ? "Deactivate" : "Activate"}
              </Text>
            </TouchableOpacity>

            <View style={{ width: 1, backgroundColor: "#F3F4F6" }} />

            <TouchableOpacity
              style={{
                flex: 1,
                padding: 12,
                flexDirection: "row",
                justifyContent: "center",
                alignItems: "center"
              }}
              onPress={() => handleDeleteDiscount(discount)}
            >
              <FontAwesome
                name="trash"
                size={16}
                color="#EF4444"
                style={{ marginRight: 8 }}
              />
              <Text style={{ color: "#EF4444", fontWeight: "500" }}>Delete</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDiscounts();
  };

  const renderDetailModal = () => {
    if (!selectedDiscount) return null;

    const formatDate = (date) => {
      return date.toDate().toLocaleDateString('en-US', { 
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    const getDetailItem = (label, value) => (
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>{label}</Text>
        <Text style={{ fontSize: 16, color: "#1F2937" }}>{value}</Text>
      </View>
    );

    return (
      <Modal
        animationType="none"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "rgba(0,0,0,0.5)",
          padding: 16
        }}>
          <Animated.View style={{
            backgroundColor: "white",
            borderRadius: 24,
            width: "90%",
            maxHeight: "80%",
            padding: 20,
            transform: [{ scale: modalScaleAnim }],
            opacity: modalOpacityAnim,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 5 },
            shadowOpacity: 0.2,
            shadowRadius: 15,
            elevation: 10
          }}>
            <View style={{ 
              flexDirection: "row", 
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20
            }}>
              <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>
                Discount Details
              </Text>
              <TouchableOpacity 
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalVisible(false);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F3F4F6",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <FontAwesome name="close" size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 4 }}
            >
              {getDetailItem("Name", selectedDiscount.name)}
              {getDetailItem("Description", selectedDiscount.description)}
              {getDetailItem("Type", 
                selectedDiscount.type?.charAt(0).toUpperCase() + selectedDiscount.type?.slice(1) || "Unknown"
              )}
              {getDetailItem("Discount Value", 
                `${selectedDiscount.discountValue}${selectedDiscount.discountType === "percentage" ? "%" : " Birr"}`
              )}
              {getDetailItem("Created Date", formatDate(selectedDiscount.createdAt))}
              {getDetailItem("Valid From", formatDate(selectedDiscount.startDate))}
              {getDetailItem("Valid Until", formatDate(selectedDiscount.endDate))}
              {getDetailItem("Status", selectedDiscount.active ? "Active" : "Inactive")}
              
              {selectedDiscount.type === "category" && selectedDiscount.categoryId && 
                getDetailItem("Category", selectedDiscount.categoryName || selectedDiscount.categoryId)}
                
              {selectedDiscount.type === "product" && selectedDiscount.productId && 
                getDetailItem("Product", selectedDiscount.productName || selectedDiscount.productId)}

              <View style={{ height: 40 }} />
            </ScrollView>

            <View style={{ 
              flexDirection: "row", 
              marginTop: 16,
              borderTopWidth: 1,
              borderTopColor: "#F3F4F6",
              paddingTop: 16
            }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: selectedDiscount.active ? "#FEF2F2" : "#ECFDF5",
                  borderRadius: 12,
                  alignItems: "center",
                  marginRight: 8
                }}
                onPress={() => {
                  handleToggleStatus(selectedDiscount);
                  setModalVisible(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }}
              >
                <Text style={{ 
                  color: selectedDiscount.active ? "#EF4444" : "#10B981", 
                  fontWeight: "500" 
                }}>
                  {selectedDiscount.active ? "Deactivate" : "Activate"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#FEF2F2",
                  borderRadius: 12,
                  alignItems: "center",
                  marginLeft: 8
                }}
                onPress={() => {
                  handleDeleteDiscount(selectedDiscount);
                  setModalVisible(false);
                }}
              >
                <Text style={{ color: "#EF4444", fontWeight: "500" }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    );
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
            top: filterPosition.top + 44, // Position below the filter button
            right: 16,
            width: 320,
            backgroundColor: "white",
            borderRadius: 16,
            padding: 16,
            transform: [{ scale: modalScaleAnim }],
            opacity: modalOpacityAnim,
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
                  Filter by Type
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {["all", "customer", "category", "product"].map(type => (
                    <TouchableOpacity
                      key={type}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: filterType === type ? "#6366F1" : "#F3F4F6",
                      }}
                      onPress={() => {
                        setFilterType(type);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        color: filterType === type ? "white" : "#6B7280",
                        fontWeight: "600",
                      }}>
                        {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)}
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
                    { value: "valueDesc", label: "Highest Value" },
                    { value: "valueAsc", label: "Lowest Value" },
                    { value: "nameAsc", label: "Name (A-Z)" }
                  ].map(sort => (
                    <TouchableOpacity
                      key={sort.value}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 100,
                        backgroundColor: sortBy === sort.value ? "#6366F1" : "#F3F4F6",
                      }}
                      onPress={() => {
                        setSortBy(sort.value);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Text style={{
                        color: sortBy === sort.value ? "white" : "#6B7280",
                        fontWeight: "600",
                      }}>
                        {sort.label}
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
                  setFilterType("all");
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

  const renderDiscountTypeModal = () => {
    const discountTypes = [
      {
        type: "customer",
        title: "Customer Based",
        description: "Apply discount based on customer reward points",
        icon: "users",
        gradient: ["#4F46E5", "#6366F1"]
      },
      {
        type: "category",
        title: "Category Based",
        description: "Apply discount to specific categories",
        icon: "tags",
        gradient: ["#059669", "#10B981"]
      },
      {
        type: "product",
        title: "Product Based",
        description: "Apply discount to specific products",
        icon: "cube",
        gradient: ["#DC2626", "#EF4444"]
      }
    ];
    
    return (
      <Modal
        visible={discountTypeModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setDiscountTypeModalVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(15,23,42,0.4)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20
        }}>
          <Animated.View style={{
            width: "100%",
            backgroundColor: "white",
            borderRadius: 24,
            padding: 0,
            overflow: "hidden",
            transform: [{ scale: modalScaleAnim }],
            opacity: modalOpacityAnim,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 5,
          }}>
            <View style={{
              padding: 20,
              borderBottomWidth: 1,
              borderBottomColor: "#F3F4F6",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 8
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#1F2937"
              }}>
                Choose Discount Type
              </Text>
              <TouchableOpacity
                onPress={() => setDiscountTypeModalVisible(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: "#F9FAFB",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <Feather name="x" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <View style={{ paddingHorizontal: 20, paddingBottom: 24 }}>
              <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 16 }}>
                Select the type of discount you want to create
              </Text>
              
              <View style={{ gap: 16 }}>
                {discountTypes.map((item, index) => {
                  // Create a lighter version of the gradient for the card background
                  const lightColor = `${item.gradient[1]}15`;
                  
                  return (
                    <TouchableOpacity
                      key={item.type}
                      onPress={() => handleSelectDiscountType(item.type)}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: `${item.gradient[1]}20`,
                      }}
                      activeOpacity={0.7}
                    >
                      <View
                        style={{
                          padding: 20,
                          backgroundColor: lightColor
                        }}
                      >
                        <View style={{
                          flexDirection: "row",
                          alignItems: "center"
                        }}>
                          <View style={{
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            backgroundColor: `${item.gradient[1]}20`,
                            justifyContent: "center",
                            alignItems: "center",
                            marginRight: 16
                          }}>
                            <FontAwesome name={item.icon} size={22} color={item.gradient[1]} />
                          </View>
                          
                          <View style={{
                            flex: 1
                          }}>
                            <Text style={{
                              color: "#1F2937",
                              fontWeight: "600",
                              fontSize: 16,
                              marginBottom: 4
                            }}>
                              {item.title}
                            </Text>
                            <Text style={{
                              color: "#6B7280",
                              fontSize: 13
                            }}>
                              {item.description}
                            </Text>
                          </View>
                          
                          <View style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: "#F9FAFB",
                            justifyContent: "center",
                            alignItems: "center"
                          }}>
                            <Feather name="chevron-right" size={18} color={item.gradient[1]} />
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <TouchableOpacity
                onPress={() => setDiscountTypeModalVisible(false)}
                style={{
                  marginTop: 24,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 8,
                  backgroundColor: "#F3F4F6",
                  alignItems: "center"
                }}
              >
                <Text style={{ color: "#4B5563", fontWeight: "500" }}>
                  Cancel
                </Text>
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
        <HomeHeader title="View Discounts" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <HomeHeader title="View Discounts" />
      
      <Animated.View 
        style={{ 
          flex: 1, 
          opacity: fadeAnim,
          transform: [{ translateY: fadeAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [50, 0]
          })}] 
        }}
      >
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          paddingHorizontal: 16,
          paddingBottom: 16,
          gap: 8 
        }}>
          <View style={{
            flex: 1,
            height: 44,
            borderRadius: 8,
            backgroundColor: "white",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            borderWidth: 1,
            borderColor: "#E5E7EB"
          }}>
            <FontAwesome name="search" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
            <TextInput
              style={{ flex: 1, height: "100%", color: "#1F2937" }}
              placeholder="Search discounts..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <FontAwesome name="times-circle" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            ) : null}
          </View>
          
          <TouchableOpacity
            ref={filterButtonRef}
            style={{
              height: 44,
              width: 44,
              borderRadius: 8,
              backgroundColor: "white",
              justifyContent: "center",
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB"
            }}
            onPress={() => {
              measureFilterButton();
              setFilterModalVisible(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Feather name="filter" size={20} color="#6366F1" />
          </TouchableOpacity>
        </View>

        {loading && !refreshing ? (
          <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        ) : filteredDiscounts.length === 0 ? (
          <View style={{ 
            flex: 1, 
            justifyContent: "center", 
            alignItems: "center",
            paddingHorizontal: 24
          }}>
            <MaterialIcons name="discount" size={64} color="#D1D5DB" />
            <Text style={{ 
              fontSize: 18,
              fontWeight: "bold",
              color: "#6B7280",
              marginTop: 16,
              marginBottom: 8
            }}>
              No discounts found
            </Text>
            <Text style={{ 
              fontSize: 14,
              color: "#9CA3AF",
              textAlign: "center"
            }}>
              {searchQuery || filterType !== "all" 
                ? "Try changing your search criteria or filters"
                : "Start by creating a new discount"}
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ padding: 16 }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6366F1"]}
              />
            }
          >
            <Text style={{ 
              fontSize: 14, 
              color: "#6B7280", 
              marginBottom: 16 
            }}>
              {filteredDiscounts.length} {filteredDiscounts.length === 1 ? "discount" : "discounts"} found
            </Text>
            
            {filteredDiscounts.map(discount => renderDiscountCard(discount))}
            
            <View style={{ height: 80 }} />
          </ScrollView>
        )}

        <TouchableOpacity
          style={{
            position: "absolute",
            bottom: 24,
            right: 24,
            height: 60,
            width: 60,
            borderRadius: 30,
            backgroundColor: "#6366F1",
            justifyContent: "center",
            alignItems: "center",
            shadowColor: "#6366F1",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 5
          }}
          onPress={() => {
            setDiscountTypeModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <FontAwesome name="plus" size={24} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {renderDetailModal()}
      {renderFilterModal()}
      {renderDiscountTypeModal()}
    </SafeAreaView>
  );
} 