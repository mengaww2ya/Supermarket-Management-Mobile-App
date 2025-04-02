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
import CountryPicker, { getAllCountries } from 'react-native-country-picker-modal';

// Get the width and height once at the beginning
const { width, height } = Dimensions.get('window');

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
  
  // Add country code state
  const [countryCode, setCountryCode] = useState('+251'); // Default Ethiopia
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({ callingCode: ['251'], cca2: 'ET' });
  
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

  // Add animation for button press
  const buttonScale = useRef(new Animated.Value(1)).current;

  // Add scroll state and handler
  const [financialScrollPosition, setFinancialScrollPosition] = useState(0);
  const financialScrollRef = useRef(null);

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
    hint = null,
    showCurrency = false,
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
          {label}{showCurrency ? ' (Birr)' : ''}
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
            maxLength={fieldName === 'phone' ? 9 : undefined}
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
        {hint && (
          <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2, marginLeft: 4, fontStyle: 'italic' }}>
            {hint}
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
    // First fade out
    Animated.timing(fadeAnim, {
      toValue: 0.7,
      duration: 100,
      useNativeDriver: true
    }).start(() => {
      // Then slide and fade back in
      Animated.parallel([
    Animated.timing(slideAnim, {
      toValue: -currentSection * width,
      duration: 300,
      useNativeDriver: true
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        })
      ]).start();
    });
    
    // Close any open dropdowns when changing sections
    setShowProductDropdown(false);
    setShowPaymentDropdown(false);
    
    // Dismiss keyboard when changing sections
    Keyboard.dismiss();
    
    // Add haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [currentSection]);
  
  const validateFields = () => {
    const newErrors = {};
    const errorMessages = [];
    
    // Required fields validation
    if (!name.trim()) {
      newErrors.name = "Supplier name is required";
      errorMessages.push("Supplier name is required");
    }
    
    if (!email.trim()) {
      newErrors.email = "Email is required";
      errorMessages.push("Email is required");
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email format is invalid";
      errorMessages.push("Email format is invalid");
    }
    
    if (!phone.trim()) {
      newErrors.phone = "Phone number is required";
      errorMessages.push("Phone number is required");
    } else if (!/^\d{9}$/.test(phone.replace(/[- )(]/g, ''))) {
      newErrors.phone = "Enter a valid 9-digit phone number";
      errorMessages.push("Enter a valid 9-digit phone number");
    }
    
    if (!address.trim()) {
      newErrors.address = "Address is required";
      errorMessages.push("Address is required");
    }
    
    if (!taxId.trim()) {
      newErrors.taxId = "Tax ID is required";
      errorMessages.push("Tax ID is required");
    }
    
    if (!contactPerson.trim()) {
      newErrors.contactPerson = "Contact person is required";
      errorMessages.push("Contact person is required");
    }
    
    if (!productType) {
      newErrors.productType = "Product type is required";
      errorMessages.push("Product type is required");
    }
    
    if (!website.trim()) {
      newErrors.website = "Website is required";
      errorMessages.push("Website is required");
    }
    
    if (!yearEstablished.trim()) {
      newErrors.yearEstablished = "Year established is required";
      errorMessages.push("Year established is required");
    } else {
      const year = Number(yearEstablished);
      const currentYear = new Date().getFullYear();
      if (isNaN(year) || year < 1900 || year > currentYear) {
        newErrors.yearEstablished = `Must be between 1900 and ${currentYear}`;
        errorMessages.push(`Year established must be between 1900 and ${currentYear}`);
      }
    }
     
    if (!accountNumber.trim()) {
      newErrors.accountNumber = "Account number is required";
      errorMessages.push("Account number is required");
    }
     
    if (!minOrderQuantity.trim()) {
      newErrors.minOrderQuantity = "Minimum order quantity is required";
      errorMessages.push("Minimum order quantity is required");
    } else if (isNaN(Number(minOrderQuantity))) {
      newErrors.minOrderQuantity = "Must be a number";
      errorMessages.push("Minimum order quantity must be a number");
    }
     
    if (!discountRate.trim()) {
      newErrors.discountRate = "Discount rate is required";
      errorMessages.push("Discount rate is required");
    } else if (isNaN(Number(discountRate)) || Number(discountRate) > 100) {
      newErrors.discountRate = "Must be a valid percentage (0-100)";
      errorMessages.push("Discount rate must be a valid percentage (0-100)");
    }
    
    // Account validation - always required now
    if (!password.trim()) {
      newErrors.password = "Password is required";
      errorMessages.push("Password is required");
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      errorMessages.push("Password must be at least 6 characters");
    }
    
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = "Please confirm your password";
      errorMessages.push("Please confirm your password");
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
      errorMessages.push("Passwords do not match");
    }
    
    setErrors(newErrors);
    
    // If there are errors, show an alert
    if (errorMessages.length > 0) {
      Alert.alert(
        "Validation Error",
        errorMessages.join('\n'),
        [{ text: "OK" }]
      );
    }
    
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
    
    // Animate button press
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    try {
      setLoading(true);
      // Create supplier data object
      const supplierData = {
        name,
        contactPerson,
        yearEstablished,
        email,
        phone: `${countryCode}${phone}`, // Include country code
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
        phone: `${countryCode}${phone}`, // Include country code
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
      
      // Enhanced success alert
      Alert.alert(
        "Success ✅", 
        `Supplier ${name} has been added successfully!\n\nLogin credentials have been created for this supplier.`,
        [
          {
            text: "OK",
            onPress: () => {
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
              }, 500);
            }
          }
        ]
      );
      
    } catch (error) {
      console.error("Error adding supplier:", error);
      setLoading(false);
      
      let errorMessage = "Failed to add supplier. Please try again.";
      let errorTitle = "Error ❌";
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered in the system.";
        errorTitle = "Email Already Exists";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
        errorTitle = "Invalid Email";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters with a combination of letters, numbers and symbols.";
        errorTitle = "Weak Password";
      }
      
      Alert.alert(
        errorTitle, 
        errorMessage,
        [
          {
            text: "Try Again",
            style: "default"
          }
        ]
      );
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };
  
  const goToNextSection = () => {
    const currentStepId = sectionTitles[currentSection];
    let hasError = false;
    const newErrors = {};
    const errorMessages = [];
    
    // Validate based on current section
    if (currentSection === 0) { // Basic Info
      if (!name.trim()) {
        newErrors.name = "Supplier name is required";
        errorMessages.push("Supplier name is required");
        hasError = true;
      }
      if (!contactPerson.trim()) {
        newErrors.contactPerson = "Contact person is required";
        errorMessages.push("Contact person is required");
        hasError = true;
      }
      if (!yearEstablished.trim()) {
        newErrors.yearEstablished = "Year established is required";
        errorMessages.push("Year established is required");
        hasError = true;
      } else {
        const year = Number(yearEstablished);
        const currentYear = new Date().getFullYear();
        if (isNaN(year) || year < 1900 || year > currentYear) {
          newErrors.yearEstablished = `Must be between 1900 and ${currentYear}`;
          errorMessages.push(`Year established must be between 1900 and ${currentYear}`);
          hasError = true;
        }
      }
    } else if (currentSection === 1) { // Contact
      if (!email.trim()) {
        newErrors.email = "Email is required";
        errorMessages.push("Email is required");
        hasError = true;
      } else if (!/\S+@\S+\.\S+/.test(email)) {
        newErrors.email = "Email format is invalid";
        errorMessages.push("Email format is invalid");
        hasError = true;
      }
      if (!phone.trim()) {
        newErrors.phone = "Phone number is required";
        errorMessages.push("Phone number is required");
        hasError = true;
      } else if (!/^\d{9}$/.test(phone.replace(/[- )(]/g, ''))) {
        newErrors.phone = "Enter a valid 9-digit phone number";
        errorMessages.push("Enter a valid 9-digit phone number");
        hasError = true;
      }
      if (!address.trim()) {
        newErrors.address = "Address is required";
        errorMessages.push("Address is required");
        hasError = true;
      }
      if (!website.trim()) {
        newErrors.website = "Website is required";
        errorMessages.push("Website is required");
        hasError = true;
      }
    } else if (currentSection === 2) { // Financial
      if (!taxId.trim()) {
        newErrors.taxId = "Tax ID is required";
        errorMessages.push("Tax ID is required");
        hasError = true;
      }
      if (!accountNumber.trim()) {
        newErrors.accountNumber = "Account number is required";
        errorMessages.push("Account number is required");
        hasError = true;
      }
      if (!minOrderQuantity.trim()) {
        newErrors.minOrderQuantity = "Minimum order quantity is required";
        errorMessages.push("Minimum order quantity is required");
        hasError = true;
      } else if (isNaN(Number(minOrderQuantity))) {
        newErrors.minOrderQuantity = "Must be a number";
        errorMessages.push("Minimum order quantity must be a number");
        hasError = true;
      }
      if (!discountRate.trim()) {
        newErrors.discountRate = "Discount rate is required";
        errorMessages.push("Discount rate is required");
        hasError = true;
      } else if (isNaN(Number(discountRate)) || Number(discountRate) > 100) {
        newErrors.discountRate = "Must be a valid percentage (0-100)";
        errorMessages.push("Discount rate must be a valid percentage (0-100)");
        hasError = true;
      }
    } else if (currentSection === 3) { // Product
      if (!productType) {
        newErrors.productType = "Product type is required";
        errorMessages.push("Product type is required");
        hasError = true;
      }
    } else if (currentSection === 4) { // Account
      if (!password.trim()) {
        newErrors.password = "Password is required";
        errorMessages.push("Password is required");
        hasError = true;
      } else if (password.length < 6) {
        newErrors.password = "Password must be at least 6 characters";
        errorMessages.push("Password must be at least 6 characters");
        hasError = true;
      }
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = "Please confirm your password";
        errorMessages.push("Please confirm your password");
        hasError = true;
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
        errorMessages.push("Passwords do not match");
        hasError = true;
      }
    }
    
    if (hasError) {
      setErrors(newErrors);
      
      // Show alert with all error messages
      if (errorMessages.length > 0) {
        Alert.alert(
          "Validation Error",
          errorMessages.join('\n'),
          [{ text: "OK" }]
        );
      }
      
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
      
      <View style={{ marginTop: 20 }}>
        <AnimatedButton 
          text="Next" 
          icon="arrow-right" 
          onPress={goToNextSection}
          isPrimary={true}
          isFullWidth={true}
        />
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
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600',
          color: '#374151', 
          marginBottom: 6,
          marginLeft: 4 
        }}>
          Phone Number
        </Text>
        
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: 'white',
              borderWidth: 2,
              borderColor: errors.phone ? '#EF4444' : '#4F46E5',
              borderTopLeftRadius: 10,
              borderBottomLeftRadius: 10,
              paddingHorizontal: 12,
              paddingVertical: 12,
              borderRightWidth: 0,
              height: 50,
            }}
            onPress={() => setCountryPickerVisible(true)}
          >
            <Text style={{ 
              color: '#1F2937',
              fontSize: 15,
              fontWeight: '500'
            }}>
              {countryCode}
            </Text>
            <Ionicons name="chevron-down" size={16} color="#4F46E5" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
          
          <View style={{ 
            flex: 1, 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: 'white', 
            borderWidth: 2, 
            borderColor: errors.phone ? '#EF4444' : '#4F46E5', 
            borderTopRightRadius: 10, 
            borderBottomRightRadius: 10, 
            paddingHorizontal: 12,
            height: 50,
          }}>
            <TextInput
              style={{ 
                flex: 1, 
                color: '#1F2937', 
                fontSize: 15 
              }}
        placeholder="Enter phone number"
        value={phone}
              onChangeText={(text) => {
                setPhone(text);
                if (errors.phone) clearFieldError('phone');
              }}
        keyboardType="phone-pad"
              maxLength={9}
              placeholderTextColor="#9CA3AF"
            />
            {!errors.phone && phone.length === 9 && (
              <Ionicons name="checkmark-circle" size={20} color="#059669" />
            )}
          </View>
        </View>
        
        {errors.phone && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, marginLeft: 4 }}>
            {errors.phone}
          </Text>
        )}
        
        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 4, marginLeft: 4, fontStyle: 'italic' }}>
          Enter a 9-digit phone number without country code
        </Text>
        
        <CountryPicker
          visible={countryPickerVisible}
          onClose={() => setCountryPickerVisible(false)}
          withFilter
          withFlag
          withCountryNameButton={false}
          withAlphaFilter
          withCallingCode
          onSelect={(country) => {
            setSelectedCountry(country);
            setCountryCode(`+${country.callingCode[0]}`);
            setCountryPickerVisible(false);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        />
      </View>
      
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
      
      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <AnimatedButton 
            text="Back" 
            icon="arrow-left" 
            iconPosition="left"
          onPress={goToPrevSection}
            isPrimary={false}
            isFullWidth={true}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <AnimatedButton 
            text="Next" 
            icon="arrow-right" 
          onPress={() => {
            setShowPaymentDropdown(false);
            goToNextSection();
          }}
            isPrimary={true}
            isFullWidth={true}
          />
        </View>
      </View>
    </View>
  );
  
  const renderFinancialSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Financial Information" icon="card-outline" />
      
      <ScrollView 
        ref={financialScrollRef}
        style={{ maxHeight: Platform.OS === 'ios' ? height - 300 : height - 250 }}
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ right: 1 }}
        contentContainerStyle={{ paddingRight: 5 }}
        onScroll={(event) => {
          const scrollY = event.nativeEvent.contentOffset.y;
          setFinancialScrollPosition(scrollY);
        }}
        scrollEventThrottle={16}
      >
        {/* Scroll indicator at top - fades out when scrolling down */}
        <Animated.View style={{ 
          alignItems: 'center', 
          marginBottom: 10, 
          paddingVertical: 5,
          backgroundColor: 'rgba(79, 70, 229, 0.05)',
          borderRadius: 20,
          opacity: financialScrollPosition > 50 ? 0 : 1,
        }}>
          <Feather name="chevrons-down" size={18} color="#4F46E5" />
        </Animated.View>

        {/* Shadow at top when scrolled down */}
        {financialScrollPosition > 20 && (
          <View style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 10,
            backgroundColor: 'transparent',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 3,
            elevation: 3,
            zIndex: 1000
          }} />
        )}

        <View style={{ 
          backgroundColor: `rgba(79, 70, 229, 0.05)`, 
          padding: 12, 
          borderRadius: 10, 
          marginBottom: 16,
          borderLeftWidth: 4,
          borderLeftColor: '#4F46E5',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 14, color: '#4F46E5', fontWeight: '600' }}>
              Financial Details
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Feather name="chevrons-down" size={14} color="#4F46E5" />
              <Text style={{ fontSize: 12, color: '#4F46E5', fontWeight: '500', marginLeft: 2 }}>
                Scroll for more
              </Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
            Please provide accurate financial information for this supplier.
          </Text>
        </View>
        
        {/* Enhanced Tax ID section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ 
            fontSize: 14, 
            fontWeight: '600',
            color: '#374151', 
            marginBottom: 6,
            marginLeft: 4 
          }}>
            Tax ID / Business Registration Number
          </Text>
          <View style={{
            borderWidth: 1,
            borderColor: errors.taxId ? '#EF4444' : '#D1D5DB',
            borderRadius: 10,
            backgroundColor: 'white',
            paddingHorizontal: 12,
            flexDirection: 'row',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 1,
            elevation: 1,
            height: 50,
          }}>
            <Ionicons 
              name="document-text-outline" 
              size={18} 
              color="#4F46E5" 
              style={{ marginRight: 8 }} 
            />
            <TextInput
        placeholder="Enter tax ID number"
        value={taxId}
              onChangeText={(text) => {
                setTaxId(text);
                if (errors.taxId) clearFieldError('taxId');
              }}
              style={{
                flex: 1,
                fontSize: 15,
                color: '#1F2937',
              }}
            />
          </View>
          {errors.taxId && (
            <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2, marginLeft: 4 }}>
              {errors.taxId}
            </Text>
          )}
        </View>
      
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
            borderWidth: 2,
            borderColor: errors.paymentTerms ? '#EF4444' : '#4F46E5',
          borderRadius: 10,
          backgroundColor: 'white',
            height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
            marginBottom: errors.paymentTerms ? 2 : 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.1,
            shadowRadius: 2,
            elevation: 2,
          }}
          onPress={() => {
            setShowPaymentDropdown(!showPaymentDropdown);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={paymentTermsOptions.find(option => option.value === paymentTerms)?.icon || "cash-outline"} 
              size={22} 
            color="#4F46E5" 
            style={{ marginRight: 8 }}
          />
          
            <Text style={{ 
              fontSize: 16, 
              color: '#1F2937',
              fontWeight: '500'
            }}>
              {paymentTermsOptions.find(option => option.value === paymentTerms)?.label}
          </Text>
        </View>
          <View style={{ backgroundColor: `rgba(79, 70, 229, 0.1)`, padding: 5, borderRadius: 8 }}>
        <Feather 
          name={showPaymentDropdown ? "chevron-up" : "chevron-down"} 
              size={22} 
              color="#4F46E5" 
        />
          </View>
      </TouchableOpacity>
      
        <Text style={{ 
          color: '#6B7280', 
          fontSize: 12, 
          marginTop: 2, 
          marginLeft: 4, 
          fontStyle: 'italic',
          marginBottom: 20 
        }}>
          Select the payment terms for this supplier
        </Text>
        
        <InputField
          label="Bank Account Number"
          placeholder="Enter bank account number"
          value={accountNumber}
          onChangeText={setAccountNumber}
          error={errors.accountNumber}
          icon="card-outline"
          fieldName="accountNumber"
        />
        
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
          label="Discount Rate"
          placeholder="Enter discount percentage"
          value={discountRate}
          onChangeText={setDiscountRate}
          keyboardType="numeric"
          error={errors.discountRate}
          icon="pricetag-outline"
          fieldName="discountRate"
          hint="Enter a percentage value between 0-100"
          showCurrency={false}
        />
        
        <View style={{ flexDirection: 'row', marginTop: 20, marginBottom: 10, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, marginRight: 10 }}>
            <AnimatedButton 
              text="Back" 
              icon="arrow-left" 
              iconPosition="left"
              onPress={goToPrevSection} 
              isPrimary={false}
              isFullWidth={true}
            />
          </View>
          
          <View style={{ flex: 1 }}>
            <AnimatedButton 
              text="Next" 
              icon="arrow-right" 
              onPress={() => {
                setShowPaymentDropdown(false);
                goToNextSection();
              }} 
              isPrimary={true}
              isFullWidth={true}
            />
          </View>
        </View>
      </ScrollView>
      
      {showPaymentDropdown && (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          borderWidth: 2,
          borderColor: '#4F46E5',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 5,
          maxHeight: 270,
          zIndex: 5000,
          position: 'absolute',
          top: Math.max(200 - financialScrollPosition, 100), // Adjust based on scroll
          left: 20,
          right: 20,
          paddingBottom: 4,
        }}>
          <View style={{ 
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6',
            backgroundColor: '#F9FAFB'
          }}>
            <Text style={{ fontWeight: '600', color: '#4F46E5' }}>Select Payment Terms</Text>
            <TouchableOpacity onPress={() => setShowPaymentDropdown(false)}>
              <Feather name="x" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView 
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            style={{ zIndex: 5001 }}
          >
            {paymentTermsOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: option.value !== paymentTermsOptions[paymentTermsOptions.length - 1].value ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                  backgroundColor: paymentTerms === option.value ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                }}
                onPress={() => {
                  setPaymentTerms(option.value);
                  setShowPaymentDropdown(false);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={option.icon} size={22} color="#4F46E5" style={{ marginRight: 12 }} />
                <Text style={{ 
                  fontSize: 16, 
                  color: '#1F2937',
                  fontWeight: paymentTerms === option.value ? 'bold' : '500',
                }}>
                  {option.label}
                </Text>
                
                {paymentTerms === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
  
  const renderProductSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Product Information" icon="cube-outline" />
      
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
          borderWidth: 2,
          borderColor: errors.productType ? '#EF4444' : '#4F46E5',
          borderRadius: 10,
          backgroundColor: 'white',
          height: 56,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 12,
          marginBottom: errors.productType ? 2 : 6,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 2,
        }}
        onPress={() => {
          setShowProductDropdown(!showProductDropdown);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
        activeOpacity={0.7}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {productType ? (
            <Ionicons 
              name={productOptions.find(option => option.value === productType)?.icon} 
              size={22} 
              color="#4F46E5" 
              style={{ marginRight: 8 }}
            />
          ) : (
            <Ionicons name="apps-outline" size={22} color="#9CA3AF" style={{ marginRight: 8 }} />
          )}
          
          <Text style={{ 
            fontSize: 16, 
            color: productType ? '#1F2937' : '#9CA3AF',
            fontWeight: '500'
          }}>
            {productType 
              ? productOptions.find(option => option.value === productType)?.label 
              : 'Select product type'}
          </Text>
        </View>
        <View style={{ backgroundColor: `rgba(79, 70, 229, 0.1)`, padding: 5, borderRadius: 8 }}>
        <Feather 
          name={showProductDropdown ? "chevron-up" : "chevron-down"} 
            size={22} 
            color="#4F46E5" 
        />
        </View>
      </TouchableOpacity>
      
      {errors.productType && (
        <Text style={{ color: '#EF4444', fontSize: 14, marginBottom: 12, marginLeft: 4, fontWeight: '500' }}>
          {errors.productType}
                    </Text>
      )}
      
      <Text style={{ 
        color: '#6B7280', 
        fontSize: 12, 
        marginTop: 2, 
        marginLeft: 4, 
        fontStyle: 'italic',
        marginBottom: 20 
      }}>
        Select the primary product category this supplier provides
      </Text>
      
      {showProductDropdown && (
        <View style={{
          backgroundColor: 'white',
          borderRadius: 10,
          borderWidth: 2,
          borderColor: '#4F46E5',
          marginBottom: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 5,
          elevation: 5,
          maxHeight: 300,
          zIndex: 5000,
          position: 'absolute',
          top: 195,
          left: 20,
          right: 20
        }}>
          <ScrollView 
            nestedScrollEnabled={true}
            keyboardShouldPersistTaps="handled"
            style={{ zIndex: 5001 }}
          >
            {productOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingVertical: 14,
                  paddingHorizontal: 16,
                  borderBottomWidth: option.value !== productOptions[productOptions.length - 1].value ? 1 : 0,
                  borderBottomColor: '#F3F4F6',
                  backgroundColor: productType === option.value ? 'rgba(79, 70, 229, 0.1)' : 'transparent',
                }}
                onPress={() => {
                  setProductType(option.value);
                  setShowProductDropdown(false);
                  clearFieldError("productType");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Ionicons name={option.icon} size={22} color="#4F46E5" style={{ marginRight: 12 }} />
                <Text style={{ 
                  fontSize: 16, 
                  color: '#1F2937',
                  fontWeight: productType === option.value ? 'bold' : '500',
                }}>
                  {option.label}
                    </Text>
                
                {productType === option.value && (
                  <Ionicons name="checkmark-circle" size={22} color="#4F46E5" style={{ marginLeft: 'auto' }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      <View style={{ flexDirection: 'row', marginTop: 20, justifyContent: 'space-between' }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <AnimatedButton 
            text="Back" 
            icon="arrow-left" 
            iconPosition="left"
            onPress={goToPrevSection} 
            isPrimary={false}
            isFullWidth={true}
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <AnimatedButton 
            text="Next" 
            icon="arrow-right" 
          onPress={() => {
            setShowProductDropdown(false);
            goToNextSection();
          }}
            isPrimary={true}
            isFullWidth={true}
          />
        </View>
      </View>
    </View>
  );

  // Fix the Account section to ensure form fields can be filled properly
  const renderAccountSection = () => (
    <View style={{ width: width, paddingHorizontal: 20, paddingVertical: 24 }}>
      <SectionHeader title="Account Information" icon="key-outline" />
      
      <View style={{ 
        backgroundColor: '#EBF5FF', 
        padding: 16, 
        borderRadius: 12,
        marginBottom: 24,
        flexDirection: 'row',
        alignItems: 'center'
      }}>
        <Ionicons name="information-circle" size={24} color="#1E40AF" style={{ marginRight: 12 }} />
        <Text style={{ fontSize: 14, color: '#1E40AF', flex: 1 }}>
          Create login credentials for this supplier to access the system
                    </Text>
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600',
          color: '#374151', 
          marginBottom: 6,
          marginLeft: 4 
        }}>
          Password
        </Text>
        <View style={{
          borderWidth: 1,
          borderColor: errors.password ? '#EF4444' : '#D1D5DB',
          borderRadius: 10,
          backgroundColor: 'white',
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
          height: 50,
        }}>
          <Ionicons 
            name="lock-closed-outline" 
            size={18} 
            color="#4F46E5" 
            style={{ marginRight: 8 }} 
          />
          <TextInput
        placeholder="Enter password for supplier account"
        value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) clearFieldError('password');
            }}
        secureTextEntry={!showPassword}
            style={{
              flex: 1,
              fontSize: 15,
              color: '#1F2937',
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
          </TouchableOpacity>
        </View>
        {errors.password && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2, marginLeft: 4 }}>
            {errors.password}
          </Text>
        )}
        <Text style={{ color: '#6B7280', fontSize: 12, marginTop: 2, marginLeft: 4, fontStyle: 'italic' }}>
          Password must be at least 6 characters with uppercase, lowercase and numbers
        </Text>
      </View>
      
      <View style={{ marginBottom: 20 }}>
        <Text style={{ 
          fontSize: 14, 
          fontWeight: '600',
          color: '#374151', 
          marginBottom: 6,
          marginLeft: 4 
        }}>
          Confirm Password
        </Text>
        <View style={{
          borderWidth: 1,
          borderColor: errors.confirmPassword ? '#EF4444' : '#D1D5DB',
          borderRadius: 10,
          backgroundColor: 'white',
          paddingHorizontal: 12,
          flexDirection: 'row',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.05,
          shadowRadius: 1,
          elevation: 1,
          height: 50,
        }}>
          <Ionicons 
            name="lock-closed-outline" 
            size={18} 
            color="#4F46E5" 
            style={{ marginRight: 8 }} 
          />
          <TextInput
        placeholder="Confirm password"
        value={confirmPassword}
            onChangeText={(text) => {
              setConfirmPassword(text);
              if (errors.confirmPassword) clearFieldError('confirmPassword');
            }}
        secureTextEntry={!showPassword}
          style={{
            flex: 1,
              fontSize: 15,
              color: '#1F2937',
            }}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
        </TouchableOpacity>
        </View>
        {errors.confirmPassword && (
          <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 2, marginLeft: 4 }}>
            {errors.confirmPassword}
          </Text>
        )}
      </View>
      
      <View style={{ 
        backgroundColor: `rgba(79, 70, 229, 0.1)`, 
        borderRadius: 12, 
        padding: 16, 
        marginBottom: 24,
        borderLeftWidth: 4,
        borderLeftColor: '#4F46E5'
      }}>
        <Text style={{ fontSize: 14, color: '#4F46E5', fontWeight: '500' }}>
          Security Tip
        </Text>
        <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>
          Strong passwords contain a mix of uppercase letters, lowercase letters, numbers, and special characters.
        </Text>
      </View>
      
      <View style={{ flexDirection: 'row', marginTop: 16 }}>
        <View style={{ flex: 1, marginRight: 10 }}>
          <AnimatedButton 
            text="Back" 
            icon="arrow-left" 
            iconPosition="left"
            onPress={goToPrevSection} 
            isPrimary={false}
            isFullWidth={true}
          />
        </View>
        
        <Animated.View style={{ 
          flex: 2,
          transform: [{ scale: buttonScale }] 
        }}>
        <TouchableOpacity
          style={{
            backgroundColor: submitted ? '#059669' : '#4F46E5',
            borderRadius: 10,
            height: 50,
            alignItems: 'center',
            justifyContent: 'center',
              flexDirection: 'row',
            zIndex: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 3,
              elevation: 2,
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
                <Text style={{ color: 'white', fontSize: 15, fontWeight: 'bold', marginRight: 8 }}>
              Add Supplier
              </Text>
                <Feather name="check-circle" size={18} color="white" />
            </>
          )}
        </TouchableOpacity>
        </Animated.View>
      </View>
    </View>
  );

  const ProgressDots = () => (
    <View style={{ 
      marginBottom: 24 
    }}>
    <View style={{ 
      flexDirection: 'row', 
        justifyContent: 'space-between',
        marginBottom: 10,
        paddingHorizontal: 12
      }}>
        {sectionTitles.map((title, index) => (
          <Text 
            key={index}
            style={{ 
              fontSize: 12,
              color: currentSection >= index ? '#4F46E5' : '#9CA3AF',
              fontWeight: currentSection === index ? '700' : '500',
              textAlign: 'center',
              width: 60,
            }}
          >
            {title}
          </Text>
        ))}
      </View>
      
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        height: 30,
        paddingHorizontal: 10
    }}>
      {sectionTitles.map((_, index) => (
          <React.Fragment key={index}>
            {/* Connect dots with lines */}
            {index > 0 && (
              <View style={{
                flex: 1,
                height: 3,
                backgroundColor: currentSection >= index ? '#4F46E5' : '#E5E7EB'
              }} />
            )}
            
        <TouchableOpacity
          onPress={() => setCurrentSection(index)}
              activeOpacity={0.7}
          style={{
            width: 30,
            height: 30,
            borderRadius: 15,
                backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
                borderWidth: 2,
                borderColor: currentSection >= index ? '#4F46E5' : '#E5E7EB',
                shadowColor: currentSection === index ? '#4F46E5' : 'transparent',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 3,
                elevation: currentSection === index ? 2 : 0,
              }}
            >
              {currentSection > index ? (
                <Ionicons name="checkmark" size={16} color="#4F46E5" />
              ) : (
          <Text style={{ 
                  color: currentSection === index ? '#4F46E5' : '#9CA3AF', 
            fontSize: 14, 
            fontWeight: 'bold' 
          }}>
            {index + 1}
            </Text>
              )}
            </TouchableOpacity>
          </React.Fragment>
      ))}
      </View>
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

// Add animated button for all Next/Back buttons
const AnimatedButton = ({ 
  text, 
  icon, 
  iconPosition = 'right', 
  onPress, 
  isPrimary = true,
  isFullWidth = false,
  loading = false,
  disabled = false
}) => {
  const buttonAnimation = useRef(new Animated.Value(1)).current;
  
  const handlePress = () => {
    Animated.sequence([
      Animated.timing(buttonAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    if (onPress) onPress();
  };
  
  return (
    <Animated.View style={{ 
      flex: isFullWidth ? 1 : undefined,
      transform: [{ scale: buttonAnimation }],
      shadowColor: isPrimary ? "#4338CA" : "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isPrimary ? 0.2 : 0.1,
      shadowRadius: 3,
      elevation: isPrimary ? 2 : 1,
      borderRadius: 10,
    }}>
      <TouchableOpacity
        style={{
          backgroundColor: disabled ? '#A5B4FC' : (isPrimary ? '#4F46E5' : '#F3F4F6'),
          borderRadius: 10,
          height: 50,
          paddingHorizontal: 16,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
        }}
        onPress={handlePress}
        activeOpacity={0.8}
        disabled={disabled || loading}
      >
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <Feather name={icon} size={16} color={isPrimary ? 'white' : '#4B5563'} style={{ marginRight: 6 }} />
            )}
            <Text style={{ 
              color: isPrimary ? 'white' : '#4B5563', 
              fontSize: 15, 
              fontWeight: isPrimary ? 'bold' : '600',
              marginLeft: icon && iconPosition === 'left' ? 4 : 0,
              marginRight: icon && iconPosition === 'right' ? 4 : 0
            }}>
              {text}
            </Text>
            {icon && iconPosition === 'right' && (
              <Feather name={icon} size={16} color={isPrimary ? 'white' : '#4B5563'} style={{ marginLeft: 6 }} />
            )}
          </>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};
