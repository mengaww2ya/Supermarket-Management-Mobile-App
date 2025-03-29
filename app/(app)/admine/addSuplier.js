import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Animated,
  Keyboard,
  Dimensions,
  Switch
} from "react-native";
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather, MaterialCommunityIcons, FontAwesome } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/HomeHeader';
import { db } from '../../../firebase/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../../context/authContext';

// Get the width once at the beginning
const { width } = Dimensions.get('window');

export default function AddSupplier() {
  const { registerSupplier } = useAuth();
  const [productType, setProductType] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [showProductDropdown, setShowProductDropdown] = useState(false);
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const sectionTitles = ["Basic Info", "Contact", "Financial", "Products", "Account"];
  
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [yearEstablished, setYearEstablished] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [website, setWebsite] = useState("");
  const [taxId, setTaxId] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("net30");
  const [accountNumber, setAccountNumber] = useState("");
  const [minOrderQuantity, setMinOrderQuantity] = useState("");
  const [discountRate, setDiscountRate] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // Payment terms options
  const paymentTermsOptions = [
    { label: "Net 30 days", value: "net30", icon: "calendar-outline" },
    { label: "Net 60 days", value: "net60", icon: "calendar-outline" },
    { label: "Cash on Delivery", value: "cod", icon: "cash-outline" },
    { label: "Pay in Advance", value: "advance", icon: "wallet-outline" },
    { label: "Monthly Statement", value: "monthly", icon: "document-text-outline" }
  ];

  const productOptions = [
    { label: "Groceries", value: "groceries", icon: "basket-outline" },
    { label: "Beverages", value: "beverages", icon: "wine-outline" },
    { label: "Electronics", value: "electronics", icon: "hardware-chip-outline" },
    { label: "Household Items", value: "household", icon: "home-outline" },
    { label: "Cosmetics", value: "cosmetics", icon: "color-palette-outline" },
    { label: "Clothing", value: "clothing", icon: "shirt-outline" },
    { label: "Fresh Produce", value: "produce", icon: "leaf-outline" },
    { label: "Frozen Foods", value: "frozen", icon: "snow-outline" },
    { label: "Bakery", value: "bakery", icon: "restaurant-outline" },
    { label: "Dairy", value: "dairy", icon: "water-outline" },
    { label: "Meat & Seafood", value: "meat", icon: "fish-outline" }
  ];
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const scrollRef = useRef(null);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const router = useRouter();
  
  // Create a reference for input fields
  const inputRefs = useRef({});

  // This custom component will handle its own internal state
  const InputField = useCallback(({ 
    label, 
    placeholder, 
    value, 
    onChangeText, 
    keyboardType = "default", 
    multiline = false, 
    error, 
    icon,
    fieldName,
    secureTextEntry = false,
    onToggleSecure = null,
  }) => {
    // Internal state to handle text changes
    const [text, setText] = useState(value);
    
    // Update internal state when parent value changes
    useEffect(() => {
      setText(value);
    }, [value]);
    
    // Update parent state when internal state changes
    const handleTextChange = useCallback((newText) => {
      setText(newText);
      onChangeText(newText);
      if (error) clearFieldError(fieldName);
    }, [onChangeText, error, fieldName]);
    
    return (
      <View style={{ marginBottom: 20 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600',
          color: '#374151', 
          marginBottom: 6,
          marginLeft: 4 
        }}>
          {label}
        </Text>
        <View style={{
          borderWidth: 1,
          borderColor: error ? '#EF4444' : '#D1D5DB',
          borderRadius: 10,
          backgroundColor: 'white',
          paddingHorizontal: 12,
          paddingVertical: multiline ? 10 : 0,
          flexDirection: 'row',
          alignItems: multiline ? 'flex-start' : 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
          height: multiline ? 100 : 50,
        }}>
          {icon && (
            <Ionicons 
              name={icon} 
              size={18} 
              color="#4F46E5" 
              style={{ marginRight: 8, marginTop: multiline ? 10 : 0 }} 
            />
          )}
          <TextInput
            placeholder={placeholder}
            value={text}
            onChangeText={handleTextChange}
            keyboardType={keyboardType}
            multiline={multiline}
            secureTextEntry={secureTextEntry}
            style={{
              flex: 1,
              fontSize: 15,
              color: '#1F2937',
            }}
            ref={ref => {
              if (ref) {
                inputRefs.current[fieldName] = ref;
              }
            }}
          />
          {onToggleSecure && (
            <TouchableOpacity onPress={onToggleSecure}>
              <Ionicons
                name={secureTextEntry ? 'eye-outline' : 'eye-off-outline'}
                size={22}
                color="#6B7280"
              />
            </TouchableOpacity>
          )}
        </View>
        {error && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2, marginLeft: 4 }}>
            {error}
          </Text>
        )}
      </View>
    );
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: -currentSection * width,
      duration: 300,
      useNativeDriver: true
    }).start();
    
    // Close any open dropdowns when changing sections
    setShowProductDropdown(false);
    setShowPaymentDropdown(false);
    
    // Dismiss keyboard when changing sections
    Keyboard.dismiss();
  }, [currentSection]);
  
  const validateFields = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!name.trim()) {
      newErrors.name = "Supplier name is required";
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email format is invalid";
    }
    
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10,}$/.test(phone.replace(/[- )(]/g, ''))) {
      newErrors.phone = "Phone number must have at least 10 digits";
    }
    
    if (!address.trim()) {
      newErrors.address = "Address is required";
    }
    
    if (!taxId.trim()) {
      newErrors.taxId = "Tax ID is required";
    }
    
    if (!contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
    }
    
    if (!productType) {
      newErrors.productType = "Product type is required";
    }
    
    if (!website.trim()) {
      newErrors.website = "Website is required";
    }
    
    if (!yearEstablished.trim()) {
      newErrors.yearEstablished = "Year established is required";
    } else {
      const year = Number(yearEstablished);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.yearEstablished = `Must be between 1900 and ${currentYear}`;
      }
    }
     
    if (!accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
    }
     
    if (!minOrderQuantity.trim()) {
      newErrors.minOrderQuantity = "Minimum order quantity is required";
    } else if (isNaN(Number(minOrderQuantity))) {
      newErrors.minOrderQuantity = "Must be a number";
    }
     
    if (!discountRate.trim()) {
      newErrors.discountRate = "Discount rate is required";
    } else if (isNaN(Number(discountRate)) || Number(discountRate) > 100) {
      newErrors.discountRate = "Must be a valid percentage (0-100)";
    }
    
    // Account validation - always required now
    if (!password.trim()) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      const updatedErrors = { ...errors };
      delete updatedErrors[field];
      setErrors(updatedErrors);
    }
  };

  const handleSubmit = async () => {
    Keyboard.dismiss();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (!validateFields()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    try {
      setLoading(true);
      // Create supplier data object
      const supplierData = {
        name,
        contactPerson,
        yearEstablished,
        email,
        phone,
        address,
        website,
        taxId,
        paymentTerms,
        accountNumber,
        minOrderQuantity,
        discountRate,
        productType,
        createdAt: serverTimestamp()
      };
      
      // Add to suppliers collection
      await addDoc(collection(db, "suppliers"), supplierData);
      
      // Create user registration data
      const userData = {
        companyName: name,
        contactPerson,
        email,
        phone,
        address,
        website,
        taxId,
        yearEstablished,
        productType
      };
      
      // Always register supplier in the authentication system
      await registerSupplier(email, password, userData, true);
      
      setLoading(false);
      setSubmitted(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Reset form after successful submission
      setTimeout(() => {
        setName("");
        setContactPerson("");
        setYearEstablished("");
        setEmail("");
        setPhone("");
        setAddress("");
        setWebsite("");
        setTaxId("");
        setPaymentTerms("net30");
        setAccountNumber("");
        setMinOrderQuantity("");
        setDiscountRate("");
        setProductType(null);
        setPassword("");
        setConfirmPassword("");
        setSubmitted(false);
        setCurrentSection(0);
        
        if (scrollRef.current) {
          scrollRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
      }, 2000);
      
    } catch (error) {
      console.error("Error adding supplier:", error);
      setLoading(false);
      
      let errorMessage = "Failed to add supplier. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }
      
      Alert.alert("Error", errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const goToNextSection = () => {
    const currentStepId = sectionTitles[currentSection];
    let hasError = false;
    const newErrors = {};
    
    // Validate based on current section
    if (currentSection === 0) { // Basic Info
      if (!name.trim()) {
        newErrors.name = "Supplier name is required";
        hasError = true;
      }
      if (!contactPerson.trim()) {
        newErrors.contactPerson = "Contact person is required";
        hasError = true;
      }
      if (!yearEstablished.trim()) {
        newErrors.yearEstablished = "Year established is required";
        hasError = true;
      } else {
        const year = Number(yearEstablished);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear) {
          newErrors.yearEstablished = `Must be between 1900 and ${currentYear}`;
          hasError = true;
        }
      }
    } else if (currentSection === 1) { // Contact
      if (!email.trim()) {
        newErrors.email = "Email is required";
        hasError = true;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Email format is invalid";
        hasError = true;
      }
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
        hasError = true;
      } else if (!/^\d{10,}$/.test(phone.replace(/[- )(]/g, ''))) {
        newErrors.phone = "Phone number must have at least 10 digits";
        hasError = true;
      }
      if (!address.trim()) {
        newErrors.address = "Address is required";
        hasError = true;
      }
      if (!website.trim()) {
        newErrors.website = "Website is required";
        hasError = true;
      }
    } else if (currentSection === 2) { // Financial
      if (!taxId.trim()) {
        newErrors.taxId = "Tax ID is required";
        hasError = true;
      }
      if (!accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
        hasError = true;
      }
      if (!minOrderQuantity.trim()) {
        newErrors.minOrderQuantity = "Minimum order quantity is required";
        hasError = true;
      } else if (isNaN(Number(minOrderQuantity))) {
        newErrors.minOrderQuantity = "Must be a number";
        hasError = true;
      }
      if (!discountRate.trim()) {
        newErrors.discountRate = "Discount rate is required";
        hasError = true;
      } else if (isNaN(Number(discountRate)) || Number(discountRate) > 100) {
        newErrors.discountRate = "Must be a valid percentage (0-100)";
        hasError = true;
      }
    } else if (currentSection === 3) { // Product
      if (!productType) {
        newErrors.productType = "Product type is required";
        hasError = true;
      }
    } else if (currentSection === 4) { // Account
      if (!password.trim()) {
        newErrors.password = "Password is required";
        hasError = true;
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        hasError = true;
      }
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
        hasError = true;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        hasError = true;
      }
    }
    
    if (hasError) {
      setErrors(newErrors);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    if (currentSection < sectionTitles.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSection(currentSection + 1);
    }
  };
  
  const goToPrevSection = () => {
    if (currentSection > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setCurrentSection(currentSection - 1);
    }
  };
  
  const forceNavigateFinancialToProduct = () => {
    // Close any dropdowns
    setShowPaymentDropdown(false);
    setShowProductDropdown(false);
    
    // Move directly to section 3 (Products)
    console.log("Forcing navigation to Products section");
    setCurrentSection(3);
    
    // Clear any existing errors that might be blocking
    setErrors({});
    
    // Provide haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const SectionHeader = ({ title, icon }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        start={[0, 0]}
        end={[1, 0]}
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Ionicons name={icon} size={22} color="white" />
      </LinearGradient>
      <Text style={{ 
        fontSize: 18, 
        fontWeight: 'bold', 
        marginLeft: 12, 
        color: '#111827' 
      }}>
        {title}
      </Text>
    </View>
  );

  const renderBasicInfoSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Basic Information" icon="information-circle-outline" />
      
      <InputField
        label="Supplier Name"
        placeholder="Enter supplier name"
        value={name}
        onChangeText={setName}
        error={errors.name}
        icon="person-outline"
        fieldName="name"
      />
      
      <InputField
        label="Contact Person"
        placeholder="Enter contact person's name"
        value={contactPerson}
        onChangeText={setContactPerson}
        error={errors.contactPerson}
        icon="people-outline"
        fieldName="contactPerson"
      />
      
      <InputField
        label="Year Established"
        placeholder="YYYY"
        value={yearEstablished}
        onChangeText={setYearEstablished}
        keyboardType="numeric"
        error={errors.yearEstablished}
        icon="calendar-outline"
        fieldName="yearEstablished"
      />
      
      <View style={{ marginTop: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'row',
          }}
          onPress={goToNextSection}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
            Next
          </Text>
          <Feather name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderContactSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Contact Information" icon="call-outline" />
      
      <InputField
        label="Email Address"
        placeholder="Enter email address"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={errors.email}
        icon="mail-outline"
        fieldName="email"
      />
      
      <InputField
        label="Phone Number"
        placeholder="Enter phone number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        error={errors.phone}
        icon="call-outline"
        fieldName="phone"
      />
      
      <InputField
        label="Address"
        placeholder="Enter complete address"
        value={address}
        onChangeText={setAddress}
        multiline={true}
        error={errors.address}
        icon="location-outline"
        fieldName="address"
      />
      
      <InputField
        label="Website"
        placeholder="Enter website URL"
        value={website}
        onChangeText={setWebsite}
        keyboardType="url"
        error={errors.website}
        icon="globe-outline"
        fieldName="website"
      />
      
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            marginRight: 10,
            zIndex: 20,
          }}
          onPress={goToPrevSection}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={16} color="#4B5563" />
          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600', marginLeft: 4 }}>
            Back
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onPress={() => {
            setShowPaymentDropdown(false);
            goToNextSection();
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
            Next
          </Text>
          <Feather name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderFinancialSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Financial Information" icon="card-outline" />
      
      <InputField
        label="Tax ID / Business Registration Number"
        placeholder="Enter tax ID number"
        value={taxId}
        onChangeText={setTaxId}
        error={errors.taxId}
        icon="document-text-outline"
        fieldName="taxId"
      />
      
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: 6,
        marginLeft: 4 
      }}>
        Payment Terms
      </Text>
      
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: errors.paymentTerms ? '#EF4444' : '#D1D5DB',
          borderRadius: 10,
          backgroundColor: 'white',
          height: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          marginBottom: errors.paymentTerms ? 2 : 20,
        }}
        onPress={() => setShowPaymentDropdown(!showPaymentDropdown)}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={paymentTermsOptions.find(option => option.value === paymentTerms)?.icon || "cash-outline"} 
            size={18} 
            color="#4F46E5" 
            style={{ marginRight: 8 }}
          />
          
          <Text style={{ fontSize: 15, color: '#1F2937' }}>
            {paymentTermsOptions.find(option => option.value === paymentTerms)?.label || "Select payment terms"}
          </Text>
        </View>
        <Feather 
          name={showPaymentDropdown ? "chevron-up" : "chevron-down"} 
          size={18} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {errors.paymentTerms && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, marginLeft: 4 }}>
          {errors.paymentTerms}
        </Text>
      )}
      
      {showPaymentDropdown && (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
          maxHeight: 200,
          zIndex: 9,
          position: 'absolute',
          top: 245,
          left: 20,
          right: 20
        }}>
          <ScrollView 
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {paymentTermsOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: option.value !== paymentTermsOptions[paymentTermsOptions.length - 1].value ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                  backgroundColor: paymentTerms === option.value ? '#F3F4F6' : 'transparent',
                }}
                onPress={() => {
                  setPaymentTerms(option.value);
                  setShowPaymentDropdown(false);
                  clearFieldError("paymentTerms");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={option.icon} size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                <Text style={{ 
                  fontSize: 15, 
                  color: '#1F2937',
                  fontWeight: paymentTerms === option.value ? 'bold' : 'normal',
                }}>
                  {option.label}
                </Text>
                
                {paymentTerms === option.value && (
                  <Ionicons name="checkmark" size={18} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <InputField
        label="Account Number"
        placeholder="Enter bank account number"
        value={accountNumber}
        onChangeText={setAccountNumber}
        error={errors.accountNumber}
        icon="wallet-outline"
        fieldName="accountNumber"
      />
      
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            marginRight: 10,
            zIndex: 20,
          }}
          onPress={goToPrevSection}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={16} color="#4B5563" />
          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600', marginLeft: 4 }}>
            Back
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onPress={forceNavigateFinancialToProduct}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
            Next
          </Text>
          <Feather name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
  
  const renderProductSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Product Information" icon="basket-outline" />
      
      <Text style={{ 
        fontSize: 14, 
        fontWeight: '600', 
        color: '#374151', 
        marginBottom: 6,
        marginLeft: 4 
      }}>
        Product Type
      </Text>
      
      <TouchableOpacity
        style={{
          borderWidth: 1,
          borderColor: errors.productType ? '#EF4444' : '#D1D5DB',
          borderRadius: 10,
          backgroundColor: 'white',
          height: 50,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          marginBottom: errors.productType ? 2 : 20,
        }}
        onPress={() => {
          setShowProductDropdown(!showProductDropdown);
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {productType ? (
            <Ionicons 
              name={productOptions.find(option => option.value === productType)?.icon} 
              size={18} 
              color="#4F46E5" 
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons name="apps-outline" size={18} color="#9CA3AF" style={{ marginRight: 8 }} />
          )}
          
          <Text style={{ 
            fontSize: 15, 
            color: productType ? '#1F2937' : '#9CA3AF' 
          }}>
            {productType 
              ? productOptions.find(option => option.value === productType)?.label 
              : 'Select product type'}
          </Text>
        </View>
        <Feather 
          name={showProductDropdown ? "chevron-up" : "chevron-down"} 
          size={18} 
          color="#6B7280" 
        />
      </TouchableOpacity>
      
      {errors.productType && (
        <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, marginLeft: 4 }}>
          {errors.productType}
                    </Text>
      )}
      
      {showProductDropdown && (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#E5E7EB',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 3,
          elevation: 2,
          maxHeight: 200,
          zIndex: 9,
          position: 'absolute',
          top: 175,
          left: 20,
          right: 20
        }}>
          <ScrollView 
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
          >
            {productOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 12,
                  paddingHorizontal: 12,
                  borderBottomWidth: option.value !== productOptions[productOptions.length - 1].value ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                  backgroundColor: productType === option.value ? '#F3F4F6' : 'transparent',
                }}
                onPress={() => {
                  setProductType(option.value);
                  setShowProductDropdown(false);
                  clearFieldError("productType");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={option.icon} size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                <Text style={{ 
                  fontSize: 15, 
                  color: '#1F2937',
                  fontWeight: productType === option.value ? 'bold' : 'normal',
                }}>
                  {option.label}
                    </Text>
                
                {productType === option.value && (
                  <Ionicons name="checkmark" size={18} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <InputField
        label="Minimum Order Quantity"
        placeholder="Enter minimum order quantity"
        value={minOrderQuantity}
        onChangeText={setMinOrderQuantity}
        keyboardType="numeric"
        error={errors.minOrderQuantity}
        icon="cart-outline"
        fieldName="minOrderQuantity"
      />
      
      <InputField
        label="Discount Rate %"
        placeholder="Enter discount percentage"
        value={discountRate}
        onChangeText={setDiscountRate}
        keyboardType="numeric"
        error={errors.discountRate}
        icon="pricetag-outline"
        fieldName="discountRate"
      />
      
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            marginRight: 10,
            zIndex: 20,
          }}
          onPress={goToPrevSection}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={16} color="#4B5563" />
          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600', marginLeft: 4 }}>
            Back
                    </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onPress={() => {
            setShowProductDropdown(false);
            goToNextSection();
          }}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
            Next
                    </Text>
          <Feather name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  // Modify the account section to remove the toggle and always show password fields
  const renderAccountSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Account Information" icon="key-outline" />
      
      <View style={{ 
        backgroundColor: '#EBF5FF', 
        padding: 12, 
        borderRadius: 8,
        marginBottom: 20
      }}>
        <Text style={{ fontSize: 14, color: '#1E40AF' }}>
          Create login credentials for this supplier
                    </Text>
      </View>
      
      <InputField
        label="Password"
        placeholder="Enter password for supplier account"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        icon="lock-closed-outline"
        fieldName="password"
        secureTextEntry={!showPassword}
        onToggleSecure={() => setShowPassword(!showPassword)}
      />
      
      <InputField
        label="Confirm Password"
        placeholder="Confirm password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
        icon="lock-closed-outline"
        fieldName="confirmPassword"
        secureTextEntry={!showPassword}
        onToggleSecure={() => setShowPassword(!showPassword)}
      />
      
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <TouchableOpacity
          style={{
            backgroundColor: '#F3F4F6',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 1,
            flexDirection: 'row',
            justifyContent: 'center',
            marginRight: 10,
            zIndex: 20,
          }}
          onPress={goToPrevSection}
          activeOpacity={0.8}
        >
          <Feather name="arrow-left" size={16} color="#4B5563" />
          <Text style={{ color: '#4B5563', fontSize: 15, fontWeight: '600', marginLeft: 4 }}>
            Back
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={{
            backgroundColor: submitted ? '#059669' : '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            flex: 2,
            flexDirection: 'row',
            justifyContent: 'center',
            zIndex: 20,
          }}
          onPress={handleSubmit}
          disabled={loading || submitted}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : submitted ? (
            <>
              <AntDesign name="checkcircle" size={18} color="white" style={{ marginRight: 6 }} />
              <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold' }}>
                Added Successfully
              </Text>
            </>
          ) : (
            <>
              <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold' }}>
              Add Supplier
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const ProgressDots = () => (
    <View style={{ 
      flexDirection: 'row', 
      justifyContent: 'center', 
      marginBottom: 16 
    }}>
      {sectionTitles.map((_, index) => (
        <TouchableOpacity
          key={index}
          onPress={() => setCurrentSection(index)}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
            backgroundColor: currentSection === index ? '#4F46E5' : '#E5E7EB',
            justifyContent: 'center',
            alignItems: 'center',
            marginHorizontal: 4
          }}
        >
          <Text style={{ 
            color: currentSection === index ? 'white' : '#6B7280', 
            fontSize: 14, 
            fontWeight: 'bold' 
          }}>
            {index + 1}
            </Text>
            </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar style="light" />
      <HomeHeader title="Add Supplier" />
      
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <View style={{ padding: 16, flex: 1 }}>
          <Animated.View style={{ 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }}>
            <ProgressDots />
            
            <View style={{ 
              backgroundColor: 'white', 
              borderRadius: 16,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.08,
              shadowRadius: 4,
              elevation: 2,
              overflow: 'hidden'
            }}>
              <Animated.View style={{
                flexDirection: 'row',
                transform: [{ translateX: slideAnim }],
                width: width * (sectionTitles.length)
              }}>
                {renderBasicInfoSection()}
                {renderContactSection()}
                {renderFinancialSection()}
                {renderProductSection()}
                {renderAccountSection()}
              </Animated.View>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
