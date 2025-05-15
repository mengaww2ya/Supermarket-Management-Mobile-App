import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  Switch,
  Picker,
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, addDoc, query, where } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

export default function CreateDiscount() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [discountType, setDiscountType] = useState(params.type || "customer");
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateType, setDateType] = useState(null);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [productSelectionModalVisible, setProductSelectionModalVisible] = useState(false);
  const [categorySelectionModalVisible, setCategorySelectionModalVisible] = useState(false);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);
  const [selectionConfirmed, setSelectionConfirmed] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    discountValue: "",
    discountType: "percentage", // percentage or fixed
    startDate: new Date(),
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 1)),
    minimumPurchase: "",
    maxItemsPerCustomer: "",
    maxRedemptions: "",
    minRewardPoints: "",
    maxRewardPoints: "",
    termsAndConditions: "",
    active: true
  });
  
  // Track field validation errors
  const [fieldErrors, setFieldErrors] = useState({
    name: false,
    discountValue: false,
    startDate: false,
    endDate: false,
    minRewardPoints: false,
    maxRewardPoints: false,
    selectedCategory: false,
    selectedItems: false
  });

  useEffect(() => {
    if (!discountType || !["customer", "category", "product"].includes(discountType)) {
      setDiscountType("customer");
    }
    
    fetchCategoriesAndProducts();
  }, []);

  useEffect(() => {
    // Reset selected items when discount type changes
    setSelectedItems([]);
    setSelectedCategory(null);
    setSelectionConfirmed(false);
  }, [discountType]);

  useEffect(() => {
    // Filter products based on category and search query
    if (selectedCategory && discountType === "product") {
      let filtered = products.filter(product => 
        product.categoryId === selectedCategory || selectedCategory === "all"
      );
      
      // Further filter by search query if one exists
      if (productSearchQuery.trim() !== "") {
        const query = productSearchQuery.toLowerCase().trim();
        filtered = filtered.filter(product => 
          product.name.toLowerCase().includes(query) || 
          (product.brand && product.brand.toLowerCase().includes(query)) ||
          (product.categoryName && product.categoryName.toLowerCase().includes(query))
        );
      }
      
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts(products);
    }
  }, [selectedCategory, products, discountType, productSearchQuery]);

  const fetchCategoriesAndProducts = async () => {
    try {
      // Fetch categories
      const categorySnapshot = await getDocs(collection(db, "AddCategory"));
      const categoryData = categorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        categoryName: doc.data().categoryName || "Unnamed Category"
      }));
      setCategories([{ id: "all", categoryName: "All Categories" }, ...categoryData]);

      // Fetch products from the Products collection
      const productSnapshot = await getDocs(collection(db, "Products"));
      const productData = productSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.productName || "Unnamed Product",
          categoryId: data.categoryId || null,
          categoryName: data.categoryName || "Uncategorized",
          price: data.price || "0",
          discountPrice: data.discountPrice || null,
          stock: data.stockQuantity || "0",
          image: data.image || null,
          brand: data.brand || "",
          status: data.status || "Active"
        };
      });
      
      // Filter out deleted products
      const activeProducts = productData.filter(product => product.status !== "Deleted");
      setProducts(activeProducts);
      setFilteredProducts(activeProducts);
    } catch (error) {
      console.error("Error fetching data:", error);
      Alert.alert("Error", "Failed to load categories and products");
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        [dateType]: selectedDate
      }));
    }
  };

  const showDatePickerModal = (type) => {
    setDateType(type);
    setShowDatePicker(true);
  };

  const validateForm = () => {
    // Reset all field errors
    const newFieldErrors = {
      name: false,
      discountValue: false,
      startDate: false,
      endDate: false,
      minRewardPoints: false,
      maxRewardPoints: false,
      selectedCategory: false,
      selectedItems: false
    };
    
    // Validate form fields and set specific field errors
    if (!formData.name.trim()) {
      newFieldErrors.name = true;
      setFieldErrors(newFieldErrors);
      return "Discount name is required";
    }
    
    if (!formData.discountValue.trim()) {
      newFieldErrors.discountValue = true;
      setFieldErrors(newFieldErrors);
      return "Discount value is required";
    }
    
    if (isNaN(parseFloat(formData.discountValue))) {
      newFieldErrors.discountValue = true;
      setFieldErrors(newFieldErrors);
      return "Discount value must be a number";
    }
    
    if (formData.discountType === "percentage" && parseFloat(formData.discountValue) > 100) {
      newFieldErrors.discountValue = true;
      setFieldErrors(newFieldErrors);
      return "Percentage discount cannot exceed 100%";
    }
    
    if (formData.startDate >= formData.endDate) {
      newFieldErrors.startDate = true;
      newFieldErrors.endDate = true;
      setFieldErrors(newFieldErrors);
      return "End date must be after start date";
    }
    
    // Ensure discount type is valid
    if (!discountType || !["customer", "category", "product"].includes(discountType)) {
      setFieldErrors(newFieldErrors);
      return "Please select a valid discount type";
    }
    
    // Type-specific validations
    if (discountType === "customer") {
      if (!formData.minRewardPoints.trim()) {
        newFieldErrors.minRewardPoints = true;
        setFieldErrors(newFieldErrors);
        return "Minimum reward points is required";
      }
      
      if (isNaN(parseInt(formData.minRewardPoints))) {
        newFieldErrors.minRewardPoints = true;
        setFieldErrors(newFieldErrors);
        return "Minimum reward points must be a number";
      }
      
      if (formData.maxRewardPoints.trim() && isNaN(parseInt(formData.maxRewardPoints))) {
        newFieldErrors.maxRewardPoints = true;
        setFieldErrors(newFieldErrors);
        return "Maximum reward points must be a number";
      }
      
      if (formData.minRewardPoints && formData.maxRewardPoints && 
          parseInt(formData.minRewardPoints) >= parseInt(formData.maxRewardPoints)) {
        newFieldErrors.minRewardPoints = true;
        newFieldErrors.maxRewardPoints = true;
        setFieldErrors(newFieldErrors);
        return "Maximum reward points must be greater than minimum reward points";
      }
      
      if (!selectionConfirmed && selectedItems.length > 0) {
        newFieldErrors.selectedItems = true;
        setFieldErrors(newFieldErrors);
        return "Please confirm your category selections";
      }
    }
    
    if (discountType === "category" && selectedItems.length === 0) {
      newFieldErrors.selectedItems = true;
      setFieldErrors(newFieldErrors);
      return "Select at least one category";
    }
    
    if (discountType === "product") {
      if (!selectedCategory) {
        newFieldErrors.selectedCategory = true;
        setFieldErrors(newFieldErrors);
        return "Select a category first";
      }
      
      if (selectedItems.length === 0) {
        newFieldErrors.selectedItems = true;
        setFieldErrors(newFieldErrors);
        return "Select at least one product";
      }
    }
    
    if (formData.maxItemsPerCustomer && isNaN(parseInt(formData.maxItemsPerCustomer))) {
      setFieldErrors(newFieldErrors);
      return "Maximum items per customer must be a number";
    }
    
    // No errors found, reset field errors and return null
    setFieldErrors(newFieldErrors);
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      // Provide haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show detailed error alert with actionable suggestions
      Alert.alert(
        "Form Validation Error",
        error,
        [
          { 
            text: "Fix Issue", 
            style: "default",
            onPress: () => {
              // Provide haptic feedback on button press
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }
          }
        ],
        { cancelable: true }
      );
      return;
    }

    // Provide success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setConfirmationModalVisible(true);
  };
  
  const processSubmit = async () => {
    setConfirmationModalVisible(false);
    setLoading(true);
    
    try {
      const discountData = {
        ...formData,
        type: discountType,
        selectedItems: selectionConfirmed ? selectedItems : [],
        selectedCategory: discountType === "product" ? selectedCategory : null,
        createdAt: new Date(),
        discountValue: parseFloat(formData.discountValue),
        minRewardPoints: formData.minRewardPoints ? parseInt(formData.minRewardPoints) : null,
        maxRewardPoints: formData.maxRewardPoints ? parseInt(formData.maxRewardPoints) : null,
        maxItemsPerCustomer: formData.maxItemsPerCustomer ? parseInt(formData.maxItemsPerCustomer) : null,
        totalRedemptions: 0,
        totalSavings: 0,
        status: "active"
      };

      await addDoc(collection(db, "discounts"), discountData);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success",
        "Discount created successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error creating discount:", error);
      Alert.alert("Error", "Failed to create discount");
    } finally {
      setLoading(false);
    }
  };

  const confirmCategorySelection = () => {
    if (selectedItems.length === 0) {
      Alert.alert("Error", "Please select at least one category");
      return;
    }
    
    setSelectionConfirmed(true);
    setCategorySelectionModalVisible(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const renderDiscountTypeSelection = () => (
    <View style={{ marginBottom: 24 }}>
      <Text style={{ fontSize: 16, fontWeight: "600", marginBottom: 12, color: "#1F2937" }}>
        Discount Type
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { value: "customer", label: "Customer Based" },
          { value: "category", label: "Category Based" },
          { value: "product", label: "Product Based" }
        ].map(type => (
          <TouchableOpacity
            key={type.value}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 100,
              backgroundColor: discountType === type.value ? "#6366F1" : "#F3F4F6",
            }}
            onPress={() => setDiscountType(type.value)}
          >
            <Text style={{
              color: discountType === type.value ? "white" : "#6B7280",
              fontWeight: "600",
            }}>
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCustomerDiscountForm = () => (
    <View style={{ 
      gap: 16, 
      marginBottom: 24,
      backgroundColor: "white", 
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    }}>
      {/* Point Threshold Fields */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Reward Point Requirements
        </Text>
        <View style={{ 
          backgroundColor: "#F9FAFB", 
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <View style={{ flexDirection: "row", gap: 12, marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                Minimum Points
              </Text>
              <TextInput
                style={{ 
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: fieldErrors.minRewardPoints ? "#EF4444" : "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: "#1F2937"
                }}
                value={formData.minRewardPoints}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, minRewardPoints: text }));
                  if (fieldErrors.minRewardPoints) {
                    setFieldErrors(prev => ({ ...prev, minRewardPoints: false }));
                  }
                }}
                placeholder="Required"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              {fieldErrors.minRewardPoints && (
                <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 2 }}>
                  Valid minimum required
                </Text>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                Maximum Points
              </Text>
              <TextInput
                style={{ 
                  backgroundColor: "white",
                  borderWidth: 1,
                  borderColor: fieldErrors.maxRewardPoints ? "#EF4444" : "#E5E7EB",
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 15,
                  color: "#1F2937"
                }}
                value={formData.maxRewardPoints}
                onChangeText={(text) => {
                  setFormData(prev => ({ ...prev, maxRewardPoints: text }));
                  if (fieldErrors.maxRewardPoints) {
                    setFieldErrors(prev => ({ ...prev, maxRewardPoints: false }));
                  }
                }}
                placeholder="Optional"
                keyboardType="numeric"
                placeholderTextColor="#9CA3AF"
              />
              {fieldErrors.maxRewardPoints && (
                <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 2 }}>
                  Valid maximum required
                </Text>
              )}
            </View>
          </View>
          
          <Text style={{ fontSize: 12, color: "#6B7280" }}>
            Customers with reward points between these values will be eligible for this discount.
            If no maximum is set, there will be no upper limit.
          </Text>
        </View>
      </View>

      {/* Usage Restriction */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Usage Restriction
        </Text>
        <View style={{ 
          backgroundColor: "#F9FAFB", 
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
            Maximum Items Per Customer
          </Text>
          <TextInput
            style={{ 
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 15,
              color: "#1F2937"
            }}
            value={formData.maxItemsPerCustomer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, maxItemsPerCustomer: text }))}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            Limits how many discounted items a customer can purchase in a single order
          </Text>
        </View>
      </View>

      {/* Category Selection */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Applicable Categories (Optional)
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            backgroundColor: selectionConfirmed ? "#ECFDF5" : "#F9FAFB",
            borderWidth: 1,
            borderColor: selectionConfirmed ? "#A7F3D0" : selectedItems.length > 0 ? "#C7D2FE" : "#E5E7EB",
            borderRadius: 12,
          }}
          onPress={() => {
            setCategorySelectionModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: selectionConfirmed ? "#D1FAE5" : selectedItems.length > 0 ? "#EEF2FF" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12
            }}>
              <FontAwesome 
                name={selectionConfirmed ? "check-circle" : "tags"} 
                size={18} 
                color={selectionConfirmed ? "#10B981" : selectedItems.length > 0 ? "#6366F1" : "#9CA3AF"} 
              />
            </View>
            <View>
              <Text style={{ 
                fontSize: 16, 
                color: selectionConfirmed ? "#065F46" : "#1F2937", 
                fontWeight: "500" 
              }}>
                {selectionConfirmed 
                  ? "Categories Confirmed" 
                  : selectedItems.length > 0 
                    ? `${selectedItems.length} categories selected` 
                    : "Select Product Categories"
                }
              </Text>
              {selectedItems.length > 0 && (
                <Text style={{ 
                  fontSize: 13, 
                  color: selectionConfirmed ? "#059669" : "#6B7280" 
                }}>
                  {selectionConfirmed 
                    ? "Only selected categories will be discounted" 
                    : selectedItems.map(id => {
                        const category = categories.find(c => c.id === id);
                        return category?.categoryName;
                      }).slice(0, 2).join(", ") + (selectedItems.length > 2 ? ` and ${selectedItems.length - 2} more` : "")
                  }
                </Text>
              )}
            </View>
          </View>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={selectionConfirmed ? "#10B981" : "#9CA3AF"} 
          />
        </TouchableOpacity>
        
        {selectedItems.length > 0 && !selectionConfirmed && (
          <Text style={{ 
            fontSize: 13, 
            color: "#F59E0B", 
            marginTop: 6,
            marginLeft: 4 
          }}>
            Please confirm your selection on the categories screen
          </Text>
        )}
        
        {selectedItems.length === 0 && (
          <Text style={{ 
            fontSize: 13, 
            color: "#6B7280", 
            marginTop: 6,
            marginLeft: 4 
          }}>
            If no categories are selected, the discount will apply to all products
          </Text>
        )}
      </View>
    </View>
  );

  const renderCategoryDiscountForm = () => (
    <View style={{ 
      gap: 16, 
      marginBottom: 24,
      backgroundColor: "white", 
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    }}>
      {/* Category Selection */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Product Categories
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: selectedItems.length > 0 ? "#C7D2FE" : "#E5E7EB",
            borderRadius: 12,
          }}
          onPress={() => {
            setCategorySelectionModalVisible(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: selectedItems.length > 0 ? "#EEF2FF" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12
            }}>
              <FontAwesome 
                name="tags" 
                size={18} 
                color={selectedItems.length > 0 ? "#6366F1" : "#9CA3AF"} 
              />
            </View>
            <View>
              <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "500" }}>
                {selectedItems.length > 0 
                  ? `${selectedItems.length} categories selected` 
                  : "Select categories"}
              </Text>
              {selectedItems.length > 0 && (
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  {selectedItems.map(id => {
                    const category = categories.find(c => c.id === id);
                    return category?.categoryName;
                  }).slice(0, 2).join(", ")}
                  {selectedItems.length > 2 ? ` and ${selectedItems.length - 2} more` : ""}
                </Text>
              )}
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {selectedItems.length === 0 && (
          <Text style={{ 
            fontSize: 13, 
            color: "#EF4444", 
            marginTop: 6,
            marginLeft: 4
          }}>
            At least one category is required
          </Text>
        )}
      </View>
      
      {/* Usage Restriction */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Usage Restriction
        </Text>
        <View style={{ 
          backgroundColor: "#F9FAFB", 
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
            Maximum Items Per Customer
          </Text>
          <TextInput
            style={{ 
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 15,
              color: "#1F2937"
            }}
            value={formData.maxItemsPerCustomer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, maxItemsPerCustomer: text }))}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            Limits how many discounted items a customer can purchase in a single order
          </Text>
        </View>
      </View>
    </View>
  );

  const renderProductDiscountForm = () => (
    <View style={{ 
      gap: 16, 
      marginBottom: 24,
      backgroundColor: "white", 
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    }}>
      {/* Category Selection */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Product Category
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            backgroundColor: selectedCategory ? "#F9FAFB" : "#F3F4F6",
            borderWidth: 1,
            borderColor: fieldErrors.selectedItems ? "#EF4444" : (selectedItems.length > 0 ? "#C7D2FE" : "#E5E7EB"),
            borderRadius: 12,
            opacity: selectedCategory ? 1 : 0.6,
          }}
          onPress={() => {
            if (selectedCategory) {
              setProductSelectionModalVisible(true);
              if (fieldErrors.selectedItems) {
                setFieldErrors(prev => ({ ...prev, selectedItems: false }));
              }
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
              Alert.alert("Select Category", "Please select a category first");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          }}
          disabled={!selectedCategory}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: selectedCategory ? "#EEF2FF" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12
            }}>
              <FontAwesome 
                name="tags" 
                size={18} 
                color={selectedCategory ? "#6366F1" : "#9CA3AF"} 
              />
            </View>
            <View>
              <Text style={{ fontSize: 16, color: "#1F2937", fontWeight: "500" }}>
                {selectedCategory 
                  ? categories.find(c => c.id === selectedCategory)?.categoryName 
                  : "Select a Category"}
              </Text>
              <Text style={{ fontSize: 13, color: "#6B7280" }}>
                {selectedCategory 
                  ? `${filteredProducts.length} products available` 
                  : "Required to proceed"}
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="#9CA3AF" />
        </TouchableOpacity>
        {fieldErrors.selectedCategory && (
          <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
            Please select a product category
          </Text>
        )}
      </View>

      {/* Product Selection */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Products
        </Text>
        <TouchableOpacity
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            padding: 12,
            backgroundColor: selectedCategory ? "#F9FAFB" : "#F3F4F6",
            borderWidth: 1,
            borderColor: selectedItems.length > 0 ? "#C7D2FE" : "#E5E7EB",
            borderRadius: 12,
            opacity: selectedCategory ? 1 : 0.6,
          }}
          onPress={() => {
            if (selectedCategory) {
              setProductSelectionModalVisible(true);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } else {
              Alert.alert("Select Category", "Please select a category first");
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
          }}
          disabled={!selectedCategory}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              backgroundColor: selectedItems.length > 0 ? "#EEF2FF" : "#F3F4F6",
              justifyContent: "center",
              alignItems: "center",
              marginRight: 12
            }}>
              <FontAwesome 
                name="cubes" 
                size={18} 
                color={selectedItems.length > 0 ? "#6366F1" : "#9CA3AF"} 
              />
            </View>
            <View>
              <Text style={{ 
                fontSize: 13, 
                color: selectedCategory ? "#1F2937" : "#9CA3AF", 
                fontWeight: "500" 
              }}>
                {selectedItems.length > 0 
                  ? `${selectedItems.length} products selected` 
                  : selectedCategory ? "Select Products" : "Select category first"}
              </Text>
              {selectedItems.length > 0 && (
                <View style={{ 
                  marginTop: 6,
                  paddingTop: 6, 
                  borderTopWidth: 1, 
                  borderTopColor: "#F3F4F6" 
                }}>
                  {selectedItems.slice(0, 2).map(id => {
                    const product = products.find(p => p.id === id);
                    return (
                      <View key={id} style={{ 
                        flexDirection: "row", 
                        alignItems: "center",
                        marginBottom: 4
                      }}>
                        <View style={{
                          width: 6,
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#6366F1",
                          marginRight: 6
                        }} />
                        <Text style={{ fontSize: 12, color: "#4B5563" }} numberOfLines={1}>
                          {product?.name || "Selected product"}
                          {product?.price ? ` - ${product?.price} Birr` : ""}
                        </Text>
                      </View>
                    );
                  })}
                  {selectedItems.length > 2 && (
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                      +{selectedItems.length - 2} more products
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
          <Feather 
            name="chevron-right" 
            size={20} 
            color={selectedCategory ? "#9CA3AF" : "#D1D5DB"} 
          />
        </TouchableOpacity>
        {fieldErrors.selectedItems && (
          <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
            Please select at least one product
          </Text>
        )}
      </View>

      {/* Usage Restriction */}
      <View>
        <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
          Usage Restriction
        </Text>
        <View style={{ 
          backgroundColor: "#F9FAFB", 
          borderRadius: 12,
          padding: 16,
          borderWidth: 1,
          borderColor: "#E5E7EB"
        }}>
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
            Maximum Items Per Customer
          </Text>
          <TextInput
            style={{ 
              backgroundColor: "white",
              borderWidth: 1,
              borderColor: "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 15,
              color: "#1F2937"
            }}
            value={formData.maxItemsPerCustomer}
            onChangeText={(text) => setFormData(prev => ({ ...prev, maxItemsPerCustomer: text }))}
            placeholder="Leave empty for unlimited"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
            Limits how many discounted items a customer can purchase in a single order
          </Text>
        </View>
      </View>
    </View>
  );

  const renderCategoryModal = () => (
    <Modal
      visible={modalVisible}
      animationType="none"
      transparent={true}
      onRequestClose={() => setModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16
      }}>
        <Animated.View style={{
          width: "90%",
          maxHeight: "70%",
          backgroundColor: "white",
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          transform: [{ scale: new Animated.Value(1) }]
        }}>
          <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937" }}>
              Select Category
            </Text>
            <TouchableOpacity 
              onPress={() => setModalVisible(false)}
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

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                onPress={() => {
                  setSelectedCategory(category.id);
                  setSelectedItems([]);
                  setModalVisible(false);
                  
                  // Filter products based on the selected category
                  if (discountType === "product") {
                    const filtered = products.filter(product => 
                      product.categoryId === category.id || category.id === "all"
                    );
                    setFilteredProducts(filtered);
                  }
                  
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: selectedCategory === category.id ? "#EEF2FF" : "white",
                  borderRadius: 12,
                  marginBottom: 8,
                  borderWidth: 1,
                  borderColor: selectedCategory === category.id ? "#C7D2FE" : "#E5E7EB"
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: selectedCategory === category.id ? "#C7D2FE" : "#F3F4F6",
                  justifyContent: "center",
                  alignItems: "center",
                  marginRight: 12
                }}>
                  <FontAwesome 
                    name="tag" 
                    size={16} 
                    color={selectedCategory === category.id ? "#6366F1" : "#9CA3AF"} 
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ 
                    fontWeight: "600", 
                    color: selectedCategory === category.id ? "#4F46E5" : "#1F2937",
                    fontSize: 16
                  }}>
                    {category.categoryName}
                  </Text>
                  {category.description && (
                    <Text style={{ 
                      color: selectedCategory === category.id ? "#6366F1" : "#6B7280",
                      fontSize: 14
                    }}>
                      {category.description}
                    </Text>
                  )}
                </View>
                <View style={{
                  width: 24,
                  height: 24,
                  borderRadius: 12,
                  borderWidth: 2,
                  borderColor: selectedCategory === category.id ? "#6366F1" : "#D1D5DB",
                  justifyContent: "center",
                  alignItems: "center"
                }}>
                  {selectedCategory === category.id && (
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: "#6366F1"
                    }} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderCategorySelectionModal = () => (
    <Modal
      visible={categorySelectionModalVisible}
      animationType="none"
      transparent={true}
      onRequestClose={() => setCategorySelectionModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16
      }}>
        <Animated.View style={{
          width: "90%",
          maxHeight: "80%",
          backgroundColor: "white",
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          transform: [{ scale: new Animated.Value(1) }]
        }}>
          <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937" }}>
              Select Categories
            </Text>
            <TouchableOpacity 
              onPress={() => setCategorySelectionModalVisible(false)}
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

          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            flexDirection: "row", 
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Text style={{ color: "#6B7280" }}>
              {selectedItems.length} {selectedItems.length === 1 ? 'category' : 'categories'} selected
            </Text>
            {selectedItems.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedItems([]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6"
                }}
              >
                <Text style={{ color: "#4B5563", fontWeight: "500" }}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
            <View style={{ padding: 16 }}>
              {categories.length === 0 ? (
                <View style={{ 
                  padding: 24, 
                  alignItems: "center", 
                  justifyContent: "center"
                }}>
                  <ActivityIndicator size="large" color="#6366F1" />
                  <Text style={{ color: "#6B7280", marginTop: 16 }}>
                    Loading categories...
                  </Text>
                </View>
              ) : (
                categories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedItems(prev => {
                        const isSelected = prev.includes(category.id);
                        if (isSelected) {
                          return prev.filter(id => id !== category.id);
                        } else {
                          return [...prev, category.id];
                        }
                      });
                    }}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      padding: 12,
                      backgroundColor: selectedItems.includes(category.id) ? "#EEF2FF" : "white",
                      borderRadius: 12,
                      marginBottom: 8,
                      borderWidth: 1,
                      borderColor: selectedItems.includes(category.id) ? "#C7D2FE" : "#E5E7EB"
                    }}
                  >
                    <View style={{
                      width: 40,
                      height: 40,
                      borderRadius: 8,
                      backgroundColor: selectedItems.includes(category.id) ? "#C7D2FE" : "#F3F4F6",
                      justifyContent: "center",
                      alignItems: "center",
                      marginRight: 12
                    }}>
                      <FontAwesome 
                        name="tag" 
                        size={16} 
                        color={selectedItems.includes(category.id) ? "#6366F1" : "#9CA3AF"} 
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ 
                        fontWeight: "600", 
                        color: selectedItems.includes(category.id) ? "#4F46E5" : "#1F2937",
                        fontSize: 16
                      }}>
                        {category.categoryName}
                      </Text>
                      {category.description && (
                        <Text style={{ 
                          color: selectedItems.includes(category.id) ? "#6366F1" : "#6B7280",
                          fontSize: 14
                        }}>
                          {category.description}
                        </Text>
                      )}
                    </View>
                    <View style={{
                      width: 24,
                      height: 24,
                      borderRadius: 4,
                      borderWidth: 2,
                      borderColor: selectedItems.includes(category.id) ? "#6366F1" : "#D1D5DB",
                      justifyContent: "center",
                      alignItems: "center"
                    }}>
                      {selectedItems.includes(category.id) && (
                        <Feather name="check" size={16} color="#6366F1" />
                      )}
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </View>
          </ScrollView>
          
          {/* Confirmation footer */}
          <View style={{ 
            padding: 16, 
            borderTopWidth: 1, 
            borderTopColor: "#F3F4F6",
            flexDirection: "row",
            gap: 12
          }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: "#F3F4F6",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center"
              }}
              onPress={() => setCategorySelectionModalVisible(false)}
            >
              <Text style={{ color: "#4B5563", fontWeight: "600" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                backgroundColor: selectedItems.length > 0 ? "#6366F1" : "#A5B4FC",
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center"
              }}
              onPress={confirmCategorySelection}
              disabled={selectedItems.length === 0}
            >
              <Text style={{ color: "white", fontWeight: "600" }}>
                Confirm Selection{selectedItems.length > 0 ? ` (${selectedItems.length})` : ''}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderProductSelectionModal = () => (
    <Modal
      visible={productSelectionModalVisible}
      animationType="none"
      transparent={true}
      onRequestClose={() => setProductSelectionModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 16
      }}>
        <Animated.View style={{
          width: "90%",
          maxHeight: "80%",
          backgroundColor: "white",
          borderRadius: 16,
          overflow: "hidden",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 12,
          elevation: 8,
          transform: [{ scale: new Animated.Value(1) }]
        }}>
          <View style={{
            padding: 16,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <View>
              <Text style={{ fontSize: 18, fontWeight: "600", color: "#1F2937" }}>
                Select Products
              </Text>
              <Text style={{ fontSize: 14, color: "#6B7280" }}>
                {selectedCategory ? 
                  categories.find(c => c.id === selectedCategory)?.categoryName || "Selected Category" 
                  : "All Products"}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setProductSelectionModalVisible(false)}
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

          <View style={{ 
            paddingHorizontal: 16, 
            paddingVertical: 8,
            borderBottomWidth: 1,
            borderBottomColor: "#F3F4F6",
            flexDirection: "row", 
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <Text style={{ color: "#6B7280" }}>
              {selectedItems.length} {selectedItems.length === 1 ? 'product' : 'products'} selected
            </Text>
            {selectedItems.length > 0 && (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedItems([]);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 12,
                  backgroundColor: "#F3F4F6"
                }}
              >
                <Text style={{ color: "#4B5563", fontWeight: "500" }}>Clear</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Search input */}
          <View style={{ 
            padding: 16, 
            borderBottomWidth: 1, 
            borderBottomColor: "#F3F4F6" 
          }}>
            <View style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#F3F4F6",
              borderRadius: 8,
              paddingHorizontal: 12
            }}>
              <FontAwesome name="search" size={16} color="#9CA3AF" />
              <TextInput
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  paddingHorizontal: 8,
                  color: "#1F2937",
                  fontSize: 14
                }}
                placeholder="Search products..."
                placeholderTextColor="#9CA3AF"
                value={productSearchQuery}
                onChangeText={setProductSearchQuery}
              />
              {productSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setProductSearchQuery("")}>
                  <FontAwesome name="times-circle" size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
            {filteredProducts.length === 0 ? (
              <View style={{ 
                padding: 24, 
                alignItems: "center", 
                justifyContent: "center"
              }}>
                <FontAwesome name="box" size={48} color="#D1D5DB" />
                <Text style={{ 
                  marginTop: 16, 
                  fontSize: 16, 
                  fontWeight: "600", 
                  color: "#6B7280" 
                }}>
                  No products found
                </Text>
                <Text style={{ 
                  marginTop: 8,
                  fontSize: 14,
                  color: "#9CA3AF",
                  textAlign: "center"
                }}>
                  {productSearchQuery.trim() !== "" ? 
                    "No products match your search query. Try a different search term." : 
                    selectedCategory ? 
                      "This category doesn't contain any products. Please select a different category." : 
                      "Please select a category first to view available products."}
                </Text>
                {selectedCategory && selectedCategory !== "all" && productSearchQuery.trim() === "" && (
                  <TouchableOpacity
                    style={{
                      marginTop: 16,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: "#EEF2FF",
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center"
                    }}
                    onPress={() => {
                      setModalVisible(true);
                      setProductSelectionModalVisible(false);
                    }}
                  >
                    <FontAwesome name="tags" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#6366F1", fontWeight: "500" }}>
                      Change Category
                    </Text>
                  </TouchableOpacity>
                )}
                {productSearchQuery.trim() !== "" && (
                  <TouchableOpacity
                    style={{
                      marginTop: 16,
                      paddingVertical: 8,
                      paddingHorizontal: 16,
                      backgroundColor: "#EEF2FF",
                      borderRadius: 8,
                      flexDirection: "row",
                      alignItems: "center"
                    }}
                    onPress={() => setProductSearchQuery("")}
                  >
                    <FontAwesome name="refresh" size={16} color="#6366F1" style={{ marginRight: 8 }} />
                    <Text style={{ color: "#6366F1", fontWeight: "500" }}>
                      Clear Search
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filteredProducts.map((product) => (
                <TouchableOpacity
                  key={product.id}
                  onPress={() => {
                    setSelectedItems(prev => {
                      const isSelected = prev.includes(product.id);
                      if (isSelected) {
                        return prev.filter(id => id !== product.id);
                      } else {
                        return [...prev, product.id];
                      }
                    });
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    padding: 12,
                    backgroundColor: selectedItems.includes(product.id) ? "#EEF2FF" : "white",
                    borderRadius: 12,
                    marginBottom: 8,
                    borderWidth: 1,
                    borderColor: selectedItems.includes(product.id) ? "#C7D2FE" : "#E5E7EB"
                  }}
                >
                  <View style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    backgroundColor: selectedItems.includes(product.id) ? "#C7D2FE" : "#F3F4F6",
                    justifyContent: "center",
                    alignItems: "center",
                    marginRight: 12
                  }}>
                    <FontAwesome 
                      name="cube" 
                      size={16} 
                      color={selectedItems.includes(product.id) ? "#6366F1" : "#9CA3AF"} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ 
                      fontWeight: "600", 
                      color: selectedItems.includes(product.id) ? "#4F46E5" : "#1F2937",
                      fontSize: 16
                    }}>
                      {product.name}
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center" }}>
                      {product.price && (
                        <Text style={{ 
                          color: selectedItems.includes(product.id) ? "#6366F1" : "#6B7280",
                          fontSize: 14,
                          marginRight: 8
                        }}>
                          {product.discountPrice && parseFloat(product.discountPrice) < parseFloat(product.price) ? (
                            <>
                              <Text style={{ textDecorationLine: 'line-through', color: "#9CA3AF" }}>
                                {product.price}
                              </Text>
                              {" "}
                              <Text style={{ color: "#10B981" }}>
                                {product.discountPrice} Birr
                              </Text>
                            </>
                          ) : (
                            `${product.price} Birr`
                          )}
                        </Text>
                      )}
                      {product.stock && (
                        <View style={{
                          backgroundColor: selectedItems.includes(product.id) ? "#EEF2FF" : "#F3F4F6", 
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4,
                          marginRight: 8
                        }}>
                          <Text style={{ 
                            color: selectedItems.includes(product.id) ? "#6366F1" : "#6B7280",
                            fontSize: 12
                          }}>
                            Stock: {product.stock}
                          </Text>
                        </View>
                      )}
                      {product.categoryName && (
                        <View style={{
                          backgroundColor: selectedItems.includes(product.id) ? "#EEF2FF" : "#F3F4F6", 
                          paddingHorizontal: 6,
                          paddingVertical: 2,
                          borderRadius: 4
                        }}>
                          <Text style={{ 
                            color: selectedItems.includes(product.id) ? "#6366F1" : "#6B7280",
                            fontSize: 12
                          }}>
                            {product.categoryName}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={{
                    width: 24,
                    height: 24,
                    borderRadius: 4,
                    borderWidth: 2,
                    borderColor: selectedItems.includes(product.id) ? "#6366F1" : "#D1D5DB",
                    justifyContent: "center",
                    alignItems: "center"
                  }}>
                    {selectedItems.includes(product.id) && (
                      <Feather name="check" size={16} color="#6366F1" />
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={{ 
            padding: 16, 
            borderTopWidth: 1, 
            borderTopColor: "#F3F4F6",
            flexDirection: "column",
            gap: 12
          }}>
            {selectedItems.length > 0 && (
              <View style={{
                backgroundColor: "#F3F4F6",
                borderRadius: 8,
                padding: 12
              }}>
                <Text style={{ 
                  fontSize: 14, 
                  fontWeight: "500", 
                  color: "#4B5563",
                  marginBottom: 8 
                }}>
                  Selected Products Summary:
                </Text>
                <Text style={{ fontSize: 13, color: "#6B7280" }}>
                  {selectedItems.map(id => {
                    const product = filteredProducts.find(p => p.id === id) || products.find(p => p.id === id);
                    return product?.name || "Selected product";
                  }).slice(0, 3).join(", ")}
                  {selectedItems.length > 3 ? ` and ${selectedItems.length - 3} more` : ""}
                </Text>
              </View>
            )}
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center"
                }}
                onPress={() => setProductSelectionModalVisible(false)}
              >
                <Text style={{ color: "#4B5563", fontWeight: "600" }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 12,
                  backgroundColor: selectedItems.length > 0 ? "#6366F1" : "#A5B4FC",
                  borderRadius: 8,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row"
                }}
                onPress={() => {
                  if (selectedItems.length > 0) {
                    setProductSelectionModalVisible(false);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                  }
                }}
              >
                <Text style={{ 
                  color: "white", 
                  fontWeight: "600",
                  marginRight: selectedItems.length > 0 ? 8 : 0
                }}>
                  {selectedItems.length > 0 ? "Confirm Selection" : "Select Products"}
                </Text>
                {selectedItems.length > 0 && (
                  <View style={{
                    backgroundColor: "white",
                    borderRadius: 100,
                    paddingHorizontal: 8,
                    paddingVertical: 2
                  }}>
                    <Text style={{ color: "#6366F1", fontWeight: "600", fontSize: 12 }}>
                      {selectedItems.length}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );

  const renderConfirmationModal = () => (
    <Modal
      visible={confirmationModalVisible}
      animationType="fade"
      transparent={true}
      onRequestClose={() => setConfirmationModalVisible(false)}
    >
      <View style={{
        flex: 1,
        backgroundColor: "rgba(15,23,42,0.5)",
        justifyContent: "center",
        alignItems: "center",
        padding: 20
      }}>
        <View style={{
          width: "100%",
          backgroundColor: "white",
          borderRadius: 16,
          padding: 20,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 5,
        }}>
          <View style={{
            alignItems: "center",
            marginBottom: 16
          }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 30,
              backgroundColor: "#EEF2FF",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: 16
            }}>
              <FontAwesome name="check-circle" size={30} color="#6366F1" />
            </View>
            
            <Text style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#1F2937",
              marginBottom: 8
            }}>
              Confirm Discount Creation
            </Text>
            
            <Text style={{
              textAlign: "center",
              color: "#6B7280"
            }}>
              Are you sure you want to create this {discountType} based discount?
            </Text>
          </View>
          
          <View style={{
            backgroundColor: "#F9FAFB",
            padding: 16,
            borderRadius: 8,
            marginBottom: 20
          }}>
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8
            }}>
              <Text style={{ color: "#6B7280" }}>Discount Type:</Text>
              <Text style={{ color: "#1F2937", fontWeight: "500" }}>
                {discountType.charAt(0).toUpperCase() + discountType.slice(1)} Based
              </Text>
            </View>
            
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
              marginBottom: 8
            }}>
              <Text style={{ color: "#6B7280" }}>Discount Value:</Text>
              <Text style={{ color: "#1F2937", fontWeight: "500" }}>
                {formData.discountValue}{formData.discountType === "percentage" ? "%" : " Birr"}
              </Text>
            </View>
            
            {discountType === "customer" && (
              <View style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 8
              }}>
                <Text style={{ color: "#6B7280" }}>Point Requirement:</Text>
                <Text style={{ color: "#1F2937", fontWeight: "500" }}>
                  {formData.minRewardPoints}
                  {formData.maxRewardPoints ? ` - ${formData.maxRewardPoints}` : "+"}
                </Text>
              </View>
            )}
            
            <View style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}>
              <Text style={{ color: "#6B7280" }}>Valid Period:</Text>
              <Text style={{ color: "#1F2937", fontWeight: "500" }}>
                {formData.startDate.toLocaleDateString()} - {formData.endDate.toLocaleDateString()}
              </Text>
            </View>
          </View>
          
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#F3F4F6",
                alignItems: "center"
              }}
              onPress={() => setConfirmationModalVisible(false)}
            >
              <Text style={{ color: "#4B5563", fontWeight: "500" }}>
                Cancel
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor: "#6366F1",
                alignItems: "center"
              }}
              onPress={processSubmit}
            >
              <Text style={{ color: "white", fontWeight: "500" }}>
                Create Discount
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBasicDetailsForm = () => (
    <View style={{ 
      gap: 16, 
      marginBottom: 24,
      backgroundColor: "white", 
      borderRadius: 16,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
    }}>
      <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 4 }}>
        Basic Information
      </Text>

      {/* Discount Name */}
      <View>
        <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
          Discount Name
        </Text>
        <TextInput
          style={{ 
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: fieldErrors.name ? "#EF4444" : "#E5E7EB",
            borderRadius: 8,
            padding: 12,
            fontSize: 15,
            color: "#1F2937"
          }}
          value={formData.name}
          onChangeText={(text) => {
            setFormData(prev => ({ ...prev, name: text }));
            if (fieldErrors.name) {
              setFieldErrors(prev => ({ ...prev, name: false }));
            }
          }}
          placeholder="Enter discount name"
          placeholderTextColor="#9CA3AF"
        />
        {fieldErrors.name && (
          <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
            Discount name is required
          </Text>
        )}
      </View>

      {/* Description */}
      <View>
        <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
          Description
        </Text>
        <TextInput
          style={{ 
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 8,
            padding: 12,
            fontSize: 15,
            color: "#1F2937",
            minHeight: 80,
            textAlignVertical: "top"
          }}
          value={formData.description}
          onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
          placeholder="Enter discount description"
          multiline
          numberOfLines={3}
          placeholderTextColor="#9CA3AF"
        />
      </View>

      {/* Discount Value and Type */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
            Discount Value
          </Text>
          <TextInput
            style={{ 
              backgroundColor: "#F9FAFB",
              borderWidth: 1,
              borderColor: fieldErrors.discountValue ? "#EF4444" : "#E5E7EB",
              borderRadius: 8,
              padding: 12,
              fontSize: 15,
              color: "#1F2937"
            }}
            value={formData.discountValue}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, discountValue: text }));
              if (fieldErrors.discountValue) {
                setFieldErrors(prev => ({ ...prev, discountValue: false }));
              }
            }}
            placeholder="Enter value"
            keyboardType="numeric"
            placeholderTextColor="#9CA3AF"
          />
          {fieldErrors.discountValue && (
            <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
              {formData.discountType === "percentage" && formData.discountValue && parseFloat(formData.discountValue) > 100
                ? "Percentage cannot exceed 100%"
                : "Valid discount value is required"}
            </Text>
          )}
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
            Discount Type
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {[
              { type: "percentage", label: "%", icon: "percent" },
              { type: "fixed", label: "Birr", icon: "money" }
            ].map((type) => (
              <TouchableOpacity
                key={type.type}
                onPress={() => {
                  setFormData(prev => ({ ...prev, discountType: type.type }));
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: formData.discountType === type.type ? "#EEF2FF" : "#F9FAFB",
                  borderWidth: 1,
                  borderColor: formData.discountType === type.type ? "#C7D2FE" : "#E5E7EB",
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: "row"
                }}
              >
                <FontAwesome 
                  name={type.icon} 
                  size={14} 
                  color={formData.discountType === type.type ? "#6366F1" : "#6B7280"} 
                  style={{ marginRight: 6 }}
                />
                <Text style={{
                  color: formData.discountType === type.type ? "#6366F1" : "#6B7280",
                  fontWeight: formData.discountType === type.type ? "600" : "400"
                }}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Date Selection */}
      <View style={{ flexDirection: "row", gap: 12 }}>
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#F9FAFB",
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: fieldErrors.startDate ? "#EF4444" : "#E5E7EB"
          }}
          onPress={() => {
            showDatePickerModal("startDate");
            if (fieldErrors.startDate) {
              setFieldErrors(prev => ({ ...prev, startDate: false }));
            }
          }}
        >
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 4 }}>
            Start Date
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="calendar" size={16} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={{ color: "#1F2937", fontSize: 15 }}>
              {formData.startDate.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: "#F9FAFB",
            padding: 12,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: fieldErrors.endDate ? "#EF4444" : "#E5E7EB"
          }}
          onPress={() => {
            showDatePickerModal("endDate");
            if (fieldErrors.endDate) {
              setFieldErrors(prev => ({ ...prev, endDate: false }));
            }
          }}
        >
          <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 4 }}>
            End Date
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Feather name="calendar" size={16} color="#6B7280" style={{ marginRight: 8 }} />
            <Text style={{ color: "#1F2937", fontSize: 15 }}>
              {formData.endDate.toLocaleDateString()}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      {(fieldErrors.startDate || fieldErrors.endDate) && (
        <Text style={{ color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 }}>
          End date must be after start date
        </Text>
      )}

      {/* Active Toggle */}
      <View style={{ 
        flexDirection: "row", 
        justifyContent: "space-between", 
        alignItems: "center",
        backgroundColor: "#F9FAFB",
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB"
      }}>
        <View>
          <Text style={{ fontSize: 15, color: "#1F2937", fontWeight: "500" }}>Active</Text>
          <Text style={{ fontSize: 13, color: "#6B7280" }}>
            Toggle to immediately activate this discount
          </Text>
        </View>
        <Switch
          trackColor={{ false: "#D1D5DB", true: "#C7D2FE" }}
          thumbColor={formData.active ? "#6366F1" : "#9CA3AF"}
          ios_backgroundColor="#D1D5DB"
          onValueChange={() => {
            setFormData(prev => ({ ...prev, active: !prev.active }));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
          value={formData.active}
        />
      </View>
    </View>
  );

  const renderForm = () => (
    <View style={{ padding: 16 }}>
      <Text style={{ 
        fontSize: 20, 
        fontWeight: "600", 
        color: "#1F2937", 
        marginBottom: 16 
      }}>
        {discountType === "customer" ? "Customer Based Discount" : 
         discountType === "category" ? "Category Based Discount" : "Product Based Discount"}
      </Text>
      
      {/* Basic Details for all discount types */}
      {renderBasicDetailsForm()}

      {/* Type-specific fields */}
      {discountType === "customer" && renderCustomerDiscountForm()}
      {discountType === "category" && renderCategoryDiscountForm()}
      {discountType === "product" && renderProductDiscountForm()}

      {/* Submit Button */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={loading}
        style={{
          backgroundColor: loading ? "#A5B4FC" : "#6366F1",
          borderRadius: 12,
          padding: 16,
          marginTop: 24,
          marginBottom: 40,
          shadowColor: "#6366F1",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 3
        }}
      >
        {loading ? (
          <ActivityIndicator color="white" />
        ) : (
          <Text style={{ 
            color: "white", 
            textAlign: "center", 
            fontWeight: "600", 
            fontSize: 16
          }}>
            Create Discount
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <HomeHeader title={
        discountType === "customer" ? "Customer Based Discount" : 
        discountType === "category" ? "Category Based Discount" : 
        discountType === "product" ? "Product Based Discount" : 
        "Create Discount"
      } />
      
      <ScrollView className="flex-1">
        {!discountType ? renderDiscountTypeSelection() : renderForm()}
        {renderCategoryModal()}
        {renderCategorySelectionModal()}
        {renderProductSelectionModal()}
        {renderConfirmationModal()}
        {showDatePicker && (
          <DateTimePicker
            value={formData[dateType]}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={dateType === "endDate" ? formData.startDate : new Date()}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 