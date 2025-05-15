import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Animated,
  Modal,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { FontAwesome, MaterialIcons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../../components/HomeHeader";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, query, where, doc, writeBatch } from "firebase/firestore";
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get("window");

export default function DiscountDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeDiscounts: 0,
    inactiveDiscounts: 0
  });
  const [discountTypeModalVisible, setDiscountTypeModalVisible] = useState(false);
  const [discountManagementModalVisible, setDiscountManagementModalVisible] = useState(false);
  const [discountSelectionModalVisible, setDiscountSelectionModalVisible] = useState(false);
  const [managementOption, setManagementOption] = useState(null); // 'edit', 'delete', 'activate', 'deactivate'
  const [discountsData, setDiscountsData] = useState([]);
  const [selectedDiscountIds, setSelectedDiscountIds] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const modalScaleAnim = useRef(new Animated.Value(0.95)).current;
  const modalOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animation references for metric cards
  const metricScaleAnims = useRef([
    new Animated.Value(0.95),
    new Animated.Value(0.95),
    new Animated.Value(0.95),
    new Animated.Value(0.95)
  ]).current;
  
  const metricOpacityAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  // Animation references for action cards
  const actionScaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1)
  ]).current;
  
  const actionOpacityAnims = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0)
  ]).current;
  
  const actionTranslateYAnims = useRef([
    new Animated.Value(50),
    new Animated.Value(50),
    new Animated.Value(50),
    new Animated.Value(50)
  ]).current;

  useEffect(() => {
    // Main fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
    
    // Start animations for metric cards
    metricScaleAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(anim, {
          toValue: 1,
          duration: 500,
          delay: index * 150,
          useNativeDriver: true
        }),
        Animated.timing(metricOpacityAnims[index], {
          toValue: 1,
          duration: 600,
          delay: index * 150,
          useNativeDriver: true
        })
      ]).start();
    });
    
    // Start animations for action cards
    actionScaleAnims.forEach((anim, index) => {
      Animated.parallel([
        Animated.timing(actionOpacityAnims[index], {
          toValue: 1,
          duration: 500,
          delay: index * 100,
          useNativeDriver: true
        }),
        Animated.timing(actionTranslateYAnims[index], {
          toValue: 0,
          duration: 600,
          delay: index * 100,
          useNativeDriver: true
        })
      ]).start();
    });
    
    fetchDiscountStats();
  }, []);
  
  // Animation for modal entry/exit
  useEffect(() => {
    if (discountTypeModalVisible || discountManagementModalVisible || discountSelectionModalVisible) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 0.95,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [discountTypeModalVisible, discountManagementModalVisible, discountSelectionModalVisible]);

  const fetchDiscountStats = async () => {
    try {
      const discountsSnapshot = await getDocs(collection(db, "discounts"));
      const discounts = discountsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      setStats({
        activeDiscounts: discounts.filter(d => d.active).length,
        inactiveDiscounts: discounts.filter(d => !d.active).length
      });
      
      // Store all discounts data for management
      setDiscountsData(discounts);
    } catch (error) {
      console.error("Error fetching discount stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleActionPressIn = (index) => {
    Animated.spring(actionScaleAnims[index], {
      toValue: 0.97,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handleActionPressOut = (index) => {
    Animated.spring(actionScaleAnims[index], {
      toValue: 1,
      friction: 5,
      tension: 100,
      useNativeDriver: true
    }).start();
  };

  const handleActionPress = (card, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (card.title === "Create New Discount") {
      setDiscountTypeModalVisible(true);
    } else if (card.title === "Manage Current Discounts") {
      setDiscountManagementModalVisible(true);
      // Reset selections
      setSelectedDiscountIds([]);
      setManagementOption(null);
    } else {
      router.push(card.route);
    }
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

  const handleManagementOptionSelect = (option) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setManagementOption(option);
    setDiscountManagementModalVisible(false);
    
    // Show discount selection modal with appropriate discounts based on the option
    let filteredDiscounts = [...discountsData];
    
    // Filter discounts based on selected option
    if (option === 'activate') {
      filteredDiscounts = discountsData.filter(d => !d.active);
    } else if (option === 'deactivate') {
      filteredDiscounts = discountsData.filter(d => d.active);
    }
    
    // If no discounts match the criteria
    if (filteredDiscounts.length === 0) {
      Alert.alert(
        "No Discounts Available", 
        option === 'activate' 
          ? "There are no inactive discounts to activate."
          : option === 'deactivate'
          ? "There are no active discounts to deactivate."
          : "No discounts available for this action."
      );
      return;
    }
    
    // Show selection modal
    setDiscountSelectionModalVisible(true);
  };

  const handleToggleDiscountSelection = (discountId) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedDiscountIds(prev => {
      if (prev.includes(discountId)) {
        return prev.filter(id => id !== discountId);
      } else {
        return [...prev, discountId];
      }
    });
  };
  
  const handleSelectAllDiscounts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // If all are selected, unselect all. Otherwise, select all.
    const availableDiscounts = discountsData.filter(d => 
      managementOption === 'activate' ? !d.active : 
      managementOption === 'deactivate' ? d.active : true
    );
    
    const allIds = availableDiscounts.map(d => d.id);
    
    if (selectedDiscountIds.length === allIds.length) {
      setSelectedDiscountIds([]);
    } else {
      setSelectedDiscountIds(allIds);
    }
  };
  
  const handleApplyAction = async () => {
    if (selectedDiscountIds.length === 0) {
      Alert.alert("No Selection", "Please select at least one discount to continue");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setDiscountSelectionModalVisible(false);
    
    try {
      setLoading(true);
      
      const batch = writeBatch(db);
      
      // Apply appropriate action to all selected discounts
      for (const discountId of selectedDiscountIds) {
        const discountRef = doc(db, "discounts", discountId);
        
        if (managementOption === 'delete') {
          batch.delete(discountRef);
        } else if (managementOption === 'activate') {
          batch.update(discountRef, { active: true });
        } else if (managementOption === 'deactivate') {
          batch.update(discountRef, { active: false });
        } else if (managementOption === 'edit' && selectedDiscountIds.length === 1) {
          // For edit, we only allow one discount at a time
          // We'll navigate to edit screen instead of batch update
          router.push({
            pathname: "/manager/discounts/EditDiscount",
            params: { discountId }
          });
          setLoading(false);
          return;
        }
      }
      
      await batch.commit();
      
      // Show success message
      const successMessage = 
        managementOption === 'delete' 
          ? `Successfully deleted ${selectedDiscountIds.length} discount(s)` 
          : managementOption === 'activate'
          ? `Successfully activated ${selectedDiscountIds.length} discount(s)`
          : `Successfully deactivated ${selectedDiscountIds.length} discount(s)`;
          
      Alert.alert("Success", successMessage);
      
      // Refresh data
      fetchDiscountStats();
    } catch (error) {
      console.error("Error performing discount action:", error);
      Alert.alert("Error", "Failed to perform the action. Please try again.");
    } finally {
      setLoading(false);
      setSelectedDiscountIds([]);
    }
  };

  const managementCards = [
    {
      title: "Create New Discount",
      description: "Set up new promotional discounts",
      icon: "plus-circle",
      iconType: "Feather",
      color: "#6366F1",
      route: "/manager/discounts/CreateDiscount",
      gradient: ["#4F46E5", "#6366F1"]
    },
    {
      title: "Manage Current Discounts",
      description: "Edit, delete, or change status",
      icon: "pencil",
      iconType: "MaterialCommunityIcons",
      color: "#10B981",
      route: null, // Will be handled in action press
      gradient: ["#059669", "#10B981"]
    },
    {
      title: "View All Discounts",
      description: "Manage existing discounts",
      icon: "clipboard-list",
      iconType: "MaterialCommunityIcons",
      color: "#8B5CF6",
      route: "/manager/discounts/ViewDiscounts",
      gradient: ["#7C3AED", "#8B5CF6"]
    },
    {
      title: "Discounted Orders",
      description: "View orders with applied discounts",
      icon: "shopping",
      iconType: "MaterialCommunityIcons",
      color: "#F59E0B",
      route: "/manager/discounts/DiscountedOrders",
      gradient: ["#D97706", "#F59E0B"]
    }
  ];

  const renderMetricCard = (metric, index) => {
    return (
      <Animated.View
        key={`metric-${index}`}
        style={{
          width: "48%",
          marginBottom: 16,
          transform: [{ scale: metricScaleAnims[index] }],
          opacity: metricOpacityAnims[index]
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
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: `${metric.color}15`,
            justifyContent: "center",
            alignItems: "center",
            marginBottom: 8
          }}>
            {metric.iconType === "MaterialCommunityIcons" && (
              <MaterialCommunityIcons name={metric.icon} size={20} color={metric.color} />
            )}
            {metric.iconType === "FontAwesome" && (
              <FontAwesome name={metric.icon} size={20} color={metric.color} />
            )}
          </View>

          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            {metric.title}
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "bold", color: "#1F2937" }}>
            {metric.value}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderActionCard = (item, index) => {
    return (
      <Animated.View
        key={`action-${index}`}
        style={{
          width: "48%",
          marginBottom: 16,
          transform: [
            { scale: actionScaleAnims[index] },
            { translateY: actionTranslateYAnims[index] }
          ],
          opacity: actionOpacityAnims[index]
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
          onPress={() => handleActionPress(item, index)}
          onPressIn={() => handleActionPressIn(index)}
          onPressOut={() => handleActionPressOut(index)}
          activeOpacity={0.9}
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
            {item.iconType === "Feather" && (
              <Feather name={item.icon} size={24} color={item.color} />
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
          }} numberOfLines={2}>
            {item.description}
          </Text>
        </TouchableOpacity>
      </Animated.View>
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
                  const lightGradient = [
                    `${item.gradient[0]}10`, // 10% opacity
                    `${item.gradient[1]}15`  // 15% opacity
                  ];
                  
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
                      <LinearGradient
                        colors={lightGradient}
                        style={{
                          padding: 20,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
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
                      </LinearGradient>
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

  const renderDiscountManagementModal = () => {
    const managementOptions = [
      {
        type: "edit",
        title: "Edit Discount",
        description: "Modify an existing discount",
        icon: "pencil",
        gradient: ["#4F46E5", "#6366F1"]
      },
      {
        type: "delete",
        title: "Delete Discount",
        description: "Remove discounts permanently",
        icon: "trash",
        gradient: ["#DC2626", "#EF4444"]
      },
      {
        type: "activate",
        title: "Activate Discount",
        description: "Enable inactive discounts",
        icon: "toggle-right",
        gradient: ["#059669", "#10B981"]
      },
      {
        type: "deactivate",
        title: "Deactivate Discount",
        description: "Disable active discounts temporarily",
        icon: "toggle-left",
        gradient: ["#F59E0B", "#FBBF24"]
      }
    ];
    
    return (
      <Modal
        visible={discountManagementModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setDiscountManagementModalVisible(false)}
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
                Manage Discounts
              </Text>
              <TouchableOpacity
                onPress={() => setDiscountManagementModalVisible(false)}
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
                Select an action to perform on discounts
              </Text>
              
              <View style={{ gap: 16 }}>
                {managementOptions.map((item, index) => {
                  // Create a lighter version of the gradient for the card background
                  const lightGradient = [
                    `${item.gradient[0]}10`, // 10% opacity
                    `${item.gradient[1]}15`  // 15% opacity
                  ];
                  
                  return (
                    <TouchableOpacity
                      key={item.type}
                      onPress={() => handleManagementOptionSelect(item.type)}
                      style={{
                        borderRadius: 16,
                        overflow: "hidden",
                        backgroundColor: "#FFFFFF",
                        borderWidth: 1,
                        borderColor: `${item.gradient[1]}20`,
                      }}
                      activeOpacity={0.7}
                    >
                      <LinearGradient
                        colors={lightGradient}
                        style={{
                          padding: 20,
                        }}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
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
                            <Feather name={item.icon} size={22} color={item.gradient[1]} />
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
                      </LinearGradient>
                    </TouchableOpacity>
                  );
                })}
              </View>
              
              <TouchableOpacity
                onPress={() => setDiscountManagementModalVisible(false)}
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
  
  const renderDiscountSelectionModal = () => {
    // Filter discounts based on the selected option
    const filteredDiscounts = discountsData.filter(discount => {
      if (managementOption === 'activate') {
        return !discount.active;
      } else if (managementOption === 'deactivate') {
        return discount.active;
      }
      return true;
    });
    
    const allSelected = filteredDiscounts.length > 0 && 
      selectedDiscountIds.length === filteredDiscounts.length;
    
    // Title based on management option
    const modalTitle = 
      managementOption === 'edit' ? "Select Discount to Edit" :
      managementOption === 'delete' ? "Select Discounts to Delete" :
      managementOption === 'activate' ? "Select Discounts to Activate" :
      "Select Discounts to Deactivate";
    
    // Button text based on management option
    const actionButtonText = 
      managementOption === 'edit' ? "Edit Discount" :
      managementOption === 'delete' ? "Delete Selected" :
      managementOption === 'activate' ? "Activate Selected" :
      "Deactivate Selected";
    
    return (
      <Modal
        visible={discountSelectionModalVisible}
        animationType="none"
        transparent={true}
        onRequestClose={() => setDiscountSelectionModalVisible(false)}
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
            maxHeight: "80%",
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
              alignItems: "center"
            }}>
              <Text style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#1F2937"
              }}>
                {modalTitle}
              </Text>
              <TouchableOpacity
                onPress={() => setDiscountSelectionModalVisible(false)}
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
            
            {/* Show select all option only for non-edit actions */}
            {managementOption !== 'edit' && (
              <View style={{ 
                flexDirection: "row", 
                justifyContent: "space-between",
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6",
                alignItems: "center"
              }}>
                <Text style={{ color: "#6B7280" }}>
                  {selectedDiscountIds.length} {selectedDiscountIds.length === 1 ? 'discount' : 'discounts'} selected
                </Text>
                <TouchableOpacity
                  onPress={handleSelectAllDiscounts}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 6,
                    backgroundColor: "#F3F4F6"
                  }}
                >
                  <Text style={{ color: "#4B5563", fontWeight: "500" }}>
                    {allSelected ? "Unselect All" : "Select All"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            
            {/* Show guidance text for edit action */}
            {managementOption === 'edit' && (
              <View style={{ 
                paddingHorizontal: 20,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F3F4F6"
              }}>
                <Text style={{ color: "#6B7280", textAlign: "center" }}>
                  Tap on a discount to edit its details
                </Text>
              </View>
            )}
            
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 16, gap: 12 }}>
                {filteredDiscounts.length > 0 ? (
                  filteredDiscounts.map(discount => {
                    // For edit mode, we use a different UI and different press handler
                    if (managementOption === 'edit') {
                      return (
                        <TouchableOpacity
                          key={discount.id}
                          onPress={() => {
                            setDiscountSelectionModalVisible(false);
                            router.push({
                              pathname: "/manager/discounts/EditDiscount",
                              params: { discountId: discount.id }
                            });
                          }}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            padding: 14,
                            backgroundColor: "white",
                            borderRadius: 12,
                            borderWidth: 1,
                            borderColor: "#E5E7EB"
                          }}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={{ 
                              fontWeight: "600", 
                              fontSize: 16, 
                              color: "#1F2937"
                            }}>
                              {discount.name}
                            </Text>
                            <Text style={{ 
                              fontSize: 14, 
                              color: "#6B7280"
                            }}>
                              {discount.discountType === "percentage" 
                                ? `${discount.discountValue}% off` 
                                : `${discount.discountValue} Birr off`}
                            </Text>
                            <View style={{ flexDirection: "row", marginTop: 4 }}>
                              <View style={{
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                backgroundColor: discount.active ? "#ECFDF5" : "#FEF2F2",
                                borderRadius: 4,
                                marginRight: 8
                              }}>
                                <Text style={{
                                  fontSize: 12,
                                  color: discount.active ? "#10B981" : "#EF4444"
                                }}>
                                  {discount.active ? "Active" : "Inactive"}
                                </Text>
                              </View>
                              <Text style={{ fontSize: 12, color: "#6B7280" }}>
                                {discount.type} based
                              </Text>
                            </View>
                          </View>
                          
                          <View style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "#F3F4F6",
                            justifyContent: "center",
                            alignItems: "center"
                          }}>
                            <Feather name="edit-2" size={16} color="#6366F1" />
                          </View>
                        </TouchableOpacity>
                      );
                    }
                    
                    // For non-edit modes, we use the checkboxes UI
                    return (
                      <TouchableOpacity
                        key={discount.id}
                        onPress={() => handleToggleDiscountSelection(discount.id)}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          padding: 12,
                          backgroundColor: selectedDiscountIds.includes(discount.id) ? "#EEF2FF" : "white",
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: selectedDiscountIds.includes(discount.id) ? "#C7D2FE" : "#E5E7EB"
                        }}
                      >
                        <View style={{
                          width: 24,
                          height: 24,
                          borderRadius: 6,
                          borderWidth: 2,
                          borderColor: selectedDiscountIds.includes(discount.id) ? "#6366F1" : "#D1D5DB",
                          marginRight: 12,
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          {selectedDiscountIds.includes(discount.id) && (
                            <Feather name="check" size={16} color="#6366F1" />
                          )}
                        </View>
                        
                        <View style={{ flex: 1 }}>
                          <Text style={{ 
                            fontWeight: "600", 
                            fontSize: 16, 
                            color: selectedDiscountIds.includes(discount.id) ? "#4F46E5" : "#1F2937"
                          }}>
                            {discount.name}
                          </Text>
                          <Text style={{ 
                            fontSize: 14, 
                            color: selectedDiscountIds.includes(discount.id) ? "#6366F1" : "#6B7280"
                          }}>
                            {discount.discountType === "percentage" 
                              ? `${discount.discountValue}% off` 
                              : `${discount.discountValue} Birr off`}
                          </Text>
                          <View style={{ flexDirection: "row", marginTop: 4 }}>
                            <View style={{
                              paddingHorizontal: 6,
                              paddingVertical: 2,
                              backgroundColor: discount.active ? "#ECFDF5" : "#FEF2F2",
                              borderRadius: 4,
                              marginRight: 8
                            }}>
                              <Text style={{
                                fontSize: 12,
                                color: discount.active ? "#10B981" : "#EF4444"
                              }}>
                                {discount.active ? "Active" : "Inactive"}
                              </Text>
                            </View>
                            <Text style={{ fontSize: 12, color: "#6B7280" }}>
                              {discount.type} based
                            </Text>
                          </View>
                        </View>
                        
                        <View style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: "#F3F4F6",
                          justifyContent: "center",
                          alignItems: "center"
                        }}>
                          <Feather 
                            name={selectedDiscountIds.includes(discount.id) ? "check-circle" : "circle"} 
                            size={16} 
                            color={selectedDiscountIds.includes(discount.id) ? "#6366F1" : "#9CA3AF"} 
                          />
                        </View>
                      </TouchableOpacity>
                    );
                  })
                ) : (
                  <View style={{ padding: 40, alignItems: "center" }}>
                    <Feather name="alert-circle" size={48} color="#D1D5DB" />
                    <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 16, textAlign: "center" }}>
                      No discounts available for this action
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>
            
            <View style={{ 
              padding: 16, 
              borderTopWidth: 1, 
              borderTopColor: "#F3F4F6",
              flexDirection: "row",
              gap: 12
            }}>
              <TouchableOpacity
                onPress={() => setDiscountSelectionModalVisible(false)}
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center"
                }}
              >
                <Text style={{ color: "#4B5563", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              
              {/* Only show action button for non-edit options */}
              {managementOption !== 'edit' && (
                <TouchableOpacity
                  onPress={handleApplyAction}
                  style={{
                    flex: 1,
                    paddingVertical: 12,
                    backgroundColor: selectedDiscountIds.length > 0 ? "#6366F1" : "#A5B4FC",
                    borderRadius: 8,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row"
                  }}
                  disabled={selectedDiscountIds.length === 0}
                >
                  <Text style={{ 
                    color: "white", 
                    fontWeight: "600",
                    marginRight: selectedDiscountIds.length > 0 ? 8 : 0
                  }}>
                    {actionButtonText}
                  </Text>
                  {selectedDiscountIds.length > 0 && (
                    <View style={{
                      backgroundColor: "white",
                      borderRadius: 100,
                      paddingHorizontal: 8,
                      paddingVertical: 2
                    }}>
                      <Text style={{ color: "#6366F1", fontWeight: "600", fontSize: 12 }}>
                        {selectedDiscountIds.length}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        </View>
      </Modal>
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
          fontWeight: "600",
          color: "#1F2937"
        }}>
          {title}
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <HomeHeader title="Discount Dashboard" />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  // Prepare metrics data
  const metricsData = [
    {
      title: "Active Discounts",
      value: stats.activeDiscounts.toString(),
      icon: "tag-multiple",
      iconType: "MaterialCommunityIcons",
      color: "#6366F1"
    },
    {
      title: "Inactive Discounts",
      value: stats.inactiveDiscounts.toString(),
      icon: "tag-off",
      iconType: "MaterialCommunityIcons",
      color: "#EF4444"
    }
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <HomeHeader title="Discount Dashboard" />
      
      <ScrollView 
        style={{ 
          flex: 1, 
          paddingHorizontal: 20,
          marginTop: 15 
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim }}>
          {/* Stats Overview */}
          <SectionHeader title="Discount Overview" color="#6366F1" icon="trending-up" />
          
          <View style={{ 
            flexDirection: "row", 
            flexWrap: "wrap", 
            justifyContent: "space-between"
          }}>
            {metricsData.map((metric, index) => renderMetricCard(metric, index))}
          </View>

          {/* Management Actions */}
          <SectionHeader title="Management Actions" color="#10B981" icon="settings" />
          
          <View style={{ 
            flexDirection: "row", 
            flexWrap: "wrap", 
            justifyContent: "space-between"
          }}>
            {managementCards.map((card, index) => renderActionCard(card, index))}
          </View>
        </Animated.View>
      </ScrollView>
      
      {renderDiscountTypeModal()}
      {renderDiscountManagementModal()}
      {renderDiscountSelectionModal()}
    </SafeAreaView>
  );
} 