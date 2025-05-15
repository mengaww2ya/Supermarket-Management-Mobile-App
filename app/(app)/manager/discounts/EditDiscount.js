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
  Animated,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { FontAwesome, MaterialIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import DateTimePicker from "@react-native-community/datetimepicker";
import { db } from "../../../../firebase/firebaseConfig";
import { collection, getDocs, getDoc, doc, updateDoc, query, where } from "firebase/firestore";
import { SafeAreaView } from "react-native-safe-area-context";
import HomeHeader from "../../../components/HomeHeader";
import * as Haptics from 'expo-haptics';

export default function EditDiscount() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const discountId = params.discountId;
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [discountType, setDiscountType] = useState("customer");
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
    if (!discountId) {
      Alert.alert("Error", "No discount ID provided");
      router.back();
      return;
    }
    
    fetchCategoriesAndProducts();
    fetchDiscountData();
  }, [discountId]);

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

  const fetchDiscountData = async () => {
    try {
      const discountRef = doc(db, "discounts", discountId);
      const discountSnap = await getDoc(discountRef);
      
      if (!discountSnap.exists()) {
        Alert.alert("Error", "Discount not found");
        router.back();
        return;
      }
      
      const discountData = discountSnap.data();
      
      // Convert Firestore timestamps to Date objects
      const startDate = discountData.startDate.toDate ? discountData.startDate.toDate() : new Date(discountData.startDate);
      const endDate = discountData.endDate.toDate ? discountData.endDate.toDate() : new Date(discountData.endDate);
      
      setDiscountType(discountData.type || "customer");
      
      setFormData({
        name: discountData.name || "",
        description: discountData.description || "",
        discountValue: discountData.discountValue ? discountData.discountValue.toString() : "",
        discountType: discountData.discountType || "percentage",
        startDate,
        endDate,
        minimumPurchase: discountData.minimumPurchase ? discountData.minimumPurchase.toString() : "",
        maxItemsPerCustomer: discountData.maxItemsPerCustomer ? discountData.maxItemsPerCustomer.toString() : "",
        maxRedemptions: discountData.maxRedemptions ? discountData.maxRedemptions.toString() : "",
        minRewardPoints: discountData.minRewardPoints ? discountData.minRewardPoints.toString() : "",
        maxRewardPoints: discountData.maxRewardPoints ? discountData.maxRewardPoints.toString() : "",
        termsAndConditions: discountData.termsAndConditions || "",
        active: discountData.active !== undefined ? discountData.active : true
      });
      
      if (discountData.selectedItems && discountData.selectedItems.length > 0) {
        setSelectedItems(discountData.selectedItems);
        setSelectionConfirmed(true);
      }
      
      if (discountData.selectedCategory) {
        setSelectedCategory(discountData.selectedCategory);
      }
      
    } catch (error) {
      console.error("Error fetching discount data:", error);
      Alert.alert("Error", "Failed to load discount data");
    } finally {
      setLoading(false);
    }
  };

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
    
    // No errors found, reset field errors and return null
    setFieldErrors(newFieldErrors);
    return null;
  };

  const handleSubmit = async () => {
    const error = validateForm();
    if (error) {
      // Provide haptic feedback for error
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show detailed error alert
      Alert.alert(
        "Form Validation Error",
        error,
        [
          { 
            text: "OK", 
            style: "default",
            onPress: () => {
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
        selectedItems: selectedItems,
        selectedCategory: discountType === "product" ? selectedCategory : null,
        updatedAt: new Date(),
        discountValue: parseFloat(formData.discountValue),
        minRewardPoints: formData.minRewardPoints ? parseInt(formData.minRewardPoints) : null,
        maxRewardPoints: formData.maxRewardPoints ? parseInt(formData.maxRewardPoints) : null,
        maxItemsPerCustomer: formData.maxItemsPerCustomer ? parseInt(formData.maxItemsPerCustomer) : null,
      };

      // Update the discount document
      await updateDoc(doc(db, "discounts", discountId), discountData);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success",
        "Discount updated successfully",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error) {
      console.error("Error updating discount:", error);
      Alert.alert("Error", "Failed to update discount");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
        <HomeHeader title="Edit Discount" onBackPress={() => router.back()} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6366F1" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F3F4F6" }}>
      <HomeHeader title="Edit Discount" onBackPress={() => router.back()} />
      
      <ScrollView 
        style={{ flex: 1, paddingHorizontal: 16 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={{ marginTop: 16, marginBottom: 24 }}>
          <Text style={{ fontSize: 24, fontWeight: "bold", color: "#1F2937" }}>
            Edit Discount
          </Text>
          <Text style={{ fontSize: 16, color: "#6B7280", marginTop: 4 }}>
            Update discount details below
          </Text>
        </View>
        
        {/* Basic Form Fields */}
        <View style={{ 
          backgroundColor: "white", 
          borderRadius: 16,
          padding: 16,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
        }}>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 16 }}>
            Basic Details
          </Text>
          
          <View style={{ gap: 16 }}>
            {/* Name Input */}
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
                onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
                placeholder="Enter discount name"
              />
            </View>
            
            {/* Description Input */}
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
                  height: 80,
                  textAlignVertical: "top"
                }}
                value={formData.description}
                onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
                placeholder="Enter discount description"
                multiline
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
                  onChangeText={(text) => setFormData(prev => ({ ...prev, discountValue: text }))}
                  placeholder="Enter value"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                  Discount Type
                </Text>
                <View style={{ 
                  flexDirection: "row", 
                  backgroundColor: "#F9FAFB", 
                  borderRadius: 8,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      backgroundColor: formData.discountType === "percentage" ? "#EEF2FF" : "transparent",
                      borderRadius: 6,
                      alignItems: "center"
                    }}
                    onPress={() => setFormData(prev => ({ ...prev, discountType: "percentage" }))}
                  >
                    <Text style={{ 
                      color: formData.discountType === "percentage" ? "#4F46E5" : "#6B7280", 
                      fontWeight: formData.discountType === "percentage" ? "600" : "normal" 
                    }}>
                      Percentage
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      paddingVertical: 12,
                      paddingHorizontal: 8,
                      backgroundColor: formData.discountType === "fixed" ? "#EEF2FF" : "transparent",
                      borderRadius: 6,
                      alignItems: "center"
                    }}
                    onPress={() => setFormData(prev => ({ ...prev, discountType: "fixed" }))}
                  >
                    <Text style={{ 
                      color: formData.discountType === "fixed" ? "#4F46E5" : "#6B7280", 
                      fontWeight: formData.discountType === "fixed" ? "600" : "normal" 
                    }}>
                      Fixed (Birr)
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {/* Date Range */}
            <View>
              <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                Valid Date Range
              </Text>
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  style={{ 
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: fieldErrors.startDate ? "#EF4444" : "#E5E7EB",
                    borderRadius: 8,
                    padding: 12
                  }}
                  onPress={() => showDatePickerModal("startDate")}
                >
                  <Text style={{ color: "#1F2937" }}>
                    {formData.startDate.toLocaleDateString()}
                  </Text>
                  <FontAwesome name="calendar" size={16} color="#6B7280" />
                </TouchableOpacity>
                
                <Text style={{ alignSelf: "center", color: "#6B7280" }}>to</Text>
                
                <TouchableOpacity
                  style={{ 
                    flex: 1,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: fieldErrors.endDate ? "#EF4444" : "#E5E7EB",
                    borderRadius: 8,
                    padding: 12
                  }}
                  onPress={() => showDatePickerModal("endDate")}
                >
                  <Text style={{ color: "#1F2937" }}>
                    {formData.endDate.toLocaleDateString()}
                  </Text>
                  <FontAwesome name="calendar" size={16} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Active Toggle */}
            <View>
              <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                Discount Status
              </Text>
              <View style={{ 
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#F9FAFB",
                borderWidth: 1,
                borderColor: "#E5E7EB",
                borderRadius: 8,
                padding: 12
              }}>
                <Text style={{ color: "#1F2937" }}>
                  {formData.active ? "Active" : "Inactive"}
                </Text>
                <Switch
                  value={formData.active}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, active: value }))}
                  trackColor={{ false: "#D1D5DB", true: "#C7D2FE" }}
                  thumbColor={formData.active ? "#6366F1" : "#9CA3AF"}
                />
              </View>
            </View>
          </View>
        </View>
        
        {/* Discount Type Specific Fields */}
        {discountType === "customer" && (
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
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F2937", marginBottom: 12 }}>
              Reward Point Requirements
            </Text>
            <View style={{ flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                  Minimum Points
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: fieldErrors.minRewardPoints ? "#EF4444" : "#E5E7EB",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: "#1F2937"
                  }}
                  value={formData.minRewardPoints}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, minRewardPoints: text }))}
                  placeholder="Min points"
                  keyboardType="numeric"
                />
              </View>
              
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: "#4B5563", marginBottom: 8 }}>
                  Maximum Points (Optional)
                </Text>
                <TextInput
                  style={{ 
                    backgroundColor: "#F9FAFB",
                    borderWidth: 1,
                    borderColor: fieldErrors.maxRewardPoints ? "#EF4444" : "#E5E7EB",
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 15,
                    color: "#1F2937"
                  }}
                  value={formData.maxRewardPoints}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, maxRewardPoints: text }))}
                  placeholder="Max points (optional)"
                  keyboardType="numeric"
                />
              </View>
            </View>
          </View>
        )}
        
        {/* Submit Button */}
        <TouchableOpacity
          style={{
            backgroundColor: "#6366F1",
            paddingVertical: 14,
            borderRadius: 8,
            alignItems: "center",
            marginTop: 16
          }}
          onPress={handleSubmit}
        >
          <Text style={{ color: "white", fontWeight: "600", fontSize: 16 }}>
            Update Discount
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Date Picker Modal */}
      {showDatePicker && (
        <DateTimePicker
          value={dateType === "startDate" ? formData.startDate : formData.endDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
      
      {/* Confirmation Modal */}
      <Modal
        visible={confirmationModalVisible}
        transparent={true}
        animationType="fade"
      >
        <View style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
          padding: 20
        }}>
          <View style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 20,
            width: "100%",
            maxWidth: 400
          }}>
            <Text style={{ fontSize: 18, fontWeight: "600", marginBottom: 16, color: "#1F2937" }}>
              Confirm Update
            </Text>
            
            <Text style={{ fontSize: 14, color: "#6B7280", marginBottom: 24 }}>
              Are you sure you want to update this discount?
            </Text>
            
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#F3F4F6",
                  borderRadius: 8,
                  alignItems: "center"
                }}
                onPress={() => setConfirmationModalVisible(false)}
              >
                <Text style={{ color: "#4B5563", fontWeight: "500" }}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={{
                  flex: 1,
                  padding: 12,
                  backgroundColor: "#6366F1",
                  borderRadius: 8,
                  alignItems: "center"
                }}
                onPress={processSubmit}
              >
                <Text style={{ color: "white", fontWeight: "500" }}>Update</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 