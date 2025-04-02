import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
  ActivityIndicator,
  Keyboard,
  StatusBar
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons, FontAwesome, Ionicons } from '@expo/vector-icons';
import { auth, db } from '../../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';
import CountryPicker from 'react-native-country-picker-modal';
import { useAuth } from '../../context/authContext';
import HomeHeader from '../../components/HomeHeader';
const { width } = Dimensions.get('window');

// Define color palette
const colors = {
  primary: "#2563EB",
  primaryDark: "#1E40AF",
  primaryLight: "#3B82F6",
  background: "#F8FAFC",
  card: "#FFFFFF",
  text: "#1E293B",
  textLight: "#64748B",
  success: "#10B981",
  error: "#EF4444",
  warning: "#F59E0B",
  border: "#E2E8F0",
  inputBg: "#F1F5F9",
};

const EMPLOYEE_ROLES = [
  { label: 'Admin', value: 'admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Stock Manager', value: 'stockManager' },
  { label: 'Delivery Agent', value: 'deliveryAgent' },
  { label: 'Customer Assistance', value: 'customerAssistance' },
  { label: 'Customer', value: 'customer' }
];

const GENDER_OPTIONS = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const steps = [
  { id: 'personal', title: 'Personal Information', icon: 'person' },
  { id: 'contact', title: 'Contact Information', icon: 'contact-mail' },
  { id: 'emergency', title: 'Emergency Contact', icon: 'emergency' },
  { id: 'employment', title: 'Employment Details', icon: 'work' },
  { id: 'security', title: 'Account Security', icon: 'security' },
];

// Define styles object
const styles = {
  stepContainer: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 16,
  },
  stepHeader: {
    flexDirection: 'row', 
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  stepTitle: {
    fontSize: 18, 
    fontWeight: 'bold', 
    color: colors.text,
    marginLeft: 12
  },
  inputLabel: {
    fontSize: 16, 
    fontWeight: '600', 
    color: colors.text, 
    marginBottom: 8 
  },
  dropdownSelector: {
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.inputBg, 
    borderWidth: 1, 
    borderRadius: 12, 
    paddingHorizontal: 16, 
    paddingVertical: 14,
    height: 56,
  },
  dropdownText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12, 
    color: colors.error, 
    marginTop: 4,
    marginLeft: 4
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    minWidth: 120,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginHorizontal: 8
  },
  backButton: {
    backgroundColor: colors.textLight,
  },
  nextButton: {
    backgroundColor: colors.primary,
  }
};

export default function AddEmployee() {
  const { registerUser, registerEmployee } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [roles] = useState(EMPLOYEE_ROLES);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [genderOpen, setGenderOpen] = useState(false);
  const [selectedGender, setSelectedGender] = useState(null);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState({
    name: 'United States',
    dial_code: '+1',
    flag: 'US'
  });
  const router = useRouter();
  const scrollViewRef = useRef(null);
  const buttonScale = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [countryCode, setCountryCode] = useState('+1');
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    password: '',
    confirmPassword: '',
    dateOfBirth: '',
    gender: '',
    nationalId: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    employmentDetails: {
      department: '',
      joiningDate: '',
      salary: '',
      bankAccount: '',
    },
    documents: {
      idProof: '',
      addressProof: '',
      bankStatement: '',
    }
  });

  // Handle keyboard hiding dropdowns
  useEffect(() => {
    const keyboardDidHideSubscription = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setOpen(false);
        setGenderOpen(false);
      }
    );
    
    return () => {
      keyboardDidHideSubscription.remove();
    };
  }, []);

  const handleInputChange = (field, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mark field as touched
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setTouched(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: true
        }
      }));
    } else {
      setTouched(prev => ({ ...prev, [field]: true }));
    }
    
    // Update form value
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setForm(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
    }
    
    // Validate field immediately after change
    validateField(field, value);
  };

  const validateField = (field, value) => {
    let newErrors = { ...errors };
    let fieldValue = value;
    
    // If no value was passed, use current form value
    if (fieldValue === undefined) {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        fieldValue = form[parent][child];
      } else {
        fieldValue = form[field];
      }
    }
    
    // Validation rules
    switch (field) {
      case 'firstName':
        if (!fieldValue.trim()) {
          newErrors.firstName = 'First name is required';
        } else if (fieldValue.length < 2) {
          newErrors.firstName = 'First name must be at least 2 characters';
        } else {
          delete newErrors.firstName;
        }
        break;
        
      case 'lastName':
        if (!fieldValue.trim()) {
          newErrors.lastName = 'Last name is required';
        } else if (fieldValue.length < 2) {
          newErrors.lastName = 'Last name must be at least 2 characters';
        } else {
          delete newErrors.lastName;
        }
        break;
        
      case 'dateOfBirth':
        if (!fieldValue.trim()) {
          newErrors.dateOfBirth = 'Date of birth is required';
        } else if (!validateDate(fieldValue)) {
          newErrors.dateOfBirth = 'Enter a valid date (YYYY-MM-DD)';
        } else {
          delete newErrors.dateOfBirth;
        }
        break;
        
      case 'gender':
        if (!fieldValue) {
          newErrors.gender = 'Gender is required';
        } else {
          delete newErrors.gender;
        }
        break;
        
      case 'nationalId':
        if (!fieldValue.trim()) {
          newErrors.nationalId = 'National ID is required';
        } else if (fieldValue.length < 5) {
          newErrors.nationalId = 'Enter a valid National ID';
        } else {
          delete newErrors.nationalId;
        }
        break;
        
      case 'phone':
        if (!fieldValue.trim()) {
          newErrors.phone = 'Phone number is required';
        } else if (!/^\d{9}$/.test(fieldValue)) {
          newErrors.phone = 'Enter a valid 9-digit phone number';
        } else {
          delete newErrors.phone;
        }
        break;
        
      case 'email':
        if (!fieldValue.trim()) {
          newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fieldValue)) {
          newErrors.email = 'Enter a valid email address';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'address':
        if (!fieldValue.trim()) {
          newErrors.address = 'Address is required';
        } else if (fieldValue.length < 5) {
          newErrors.address = 'Please enter complete address';
        } else {
          delete newErrors.address;
        }
        break;
        
      case 'emergencyContact.name':
        if (!fieldValue.trim()) {
          newErrors.emergencyContactName = 'Emergency contact name is required';
        } else {
          delete newErrors.emergencyContactName;
        }
        break;
        
      case 'emergencyContact.phone':
        if (!fieldValue.trim()) {
          newErrors.emergencyContactPhone = 'Emergency contact phone is required';
        } else if (!/^\d{9}$/.test(fieldValue)) {
          newErrors.emergencyContactPhone = 'Enter a valid 9-digit phone number';
        } else {
          delete newErrors.emergencyContactPhone;
        }
        break;
        
      case 'emergencyContact.relationship':
        if (!fieldValue.trim()) {
          newErrors.emergencyContactRelationship = 'Relationship is required';
        } else {
          delete newErrors.emergencyContactRelationship;
        }
        break;
        
      case 'employmentDetails.department':
        if (!fieldValue.trim()) {
          newErrors.department = 'Department is required';
        } else {
          delete newErrors.department;
        }
        break;
        
      case 'employmentDetails.joiningDate':
        if (!fieldValue.trim()) {
          newErrors.joiningDate = 'Joining date is required';
        } else if (!validateDate(fieldValue)) {
          newErrors.joiningDate = 'Enter a valid date (YYYY-MM-DD)';
        } else {
          delete newErrors.joiningDate;
        }
        break;
        
      case 'employmentDetails.salary':
        if (!fieldValue.trim()) {
          newErrors.salary = 'Salary is required';
        } else if (isNaN(fieldValue) || parseFloat(fieldValue) <= 0) {
          newErrors.salary = 'Enter a valid salary amount';
        } else {
          delete newErrors.salary;
        }
        break;
        
      case 'password':
        if (!fieldValue) {
          newErrors.password = 'Password is required';
        } else if (fieldValue.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[a-z])/.test(fieldValue)) {
          newErrors.password = 'Include at least one lowercase letter';
        } else if (!/(?=.*[A-Z])/.test(fieldValue)) {
          newErrors.password = 'Include at least one uppercase letter';
        } else if (!/(?=.*\d)/.test(fieldValue)) {
          newErrors.password = 'Include at least one number';
        } else {
          delete newErrors.password;
        }
        // Also check confirm password match if it exists
        if (form.confirmPassword && fieldValue !== form.confirmPassword) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else if (form.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
        
      case 'confirmPassword':
        if (!fieldValue) {
          newErrors.confirmPassword = 'Confirm your password';
        } else if (fieldValue !== form.password) {
          newErrors.confirmPassword = 'Passwords do not match';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateDate = (dateString) => {
    // Check format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    // Check if it's a valid date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return false; // Invalid date

    // Get year, month, day parts to check if the date was correctly parsed
    const parts = dateString.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // JS months are 0-based
    const day = parseInt(parts[2], 10);
    
    // Check if date was correctly parsed (avoid things like 2023-02-31 becoming March 3rd)
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
      return false;
    }

    const today = new Date();
    
    if (currentStep === 0) { // Personal information - date of birth
      // Minimum age check (18 years)
      const minAge = new Date();
      minAge.setFullYear(minAge.getFullYear() - 18);
      
      if (date > today) return false; // Future date
      if (date > minAge) return false; // Less than 18 years old
    } else if (currentStep === 3) { // Employment - joining date
      // Joining date should not be in the future by more than 1 month
      const maxDate = new Date();
      maxDate.setMonth(maxDate.getMonth() + 1);
      
      if (date > maxDate) return false; // More than 1 month in future
    }
    
    return true;
  };

  const validateCurrentStep = () => {
    const currentStepId = steps[currentStep].id;
    let isValid = true;
    let errorMessages = [];
    
    // Mark all fields in the current step as touched
    const touchFields = () => {
      let newTouched = { ...touched };

    switch (currentStepId) {
      case 'personal':
          newTouched = {
            ...newTouched,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            nationalId: true
          };
        break;

      case 'contact':
          newTouched = {
            ...newTouched,
            phone: true,
            email: true,
            address: true
          };
        break;

      case 'emergency':
          newTouched = {
            ...newTouched,
            emergencyContact: {
              ...newTouched.emergencyContact,
              name: true,
              phone: true,
              relationship: true
            }
          };
        break;

      case 'employment':
          newTouched = {
            ...newTouched,
            employmentDetails: {
              ...newTouched.employmentDetails,
              department: true,
              joiningDate: true,
              salary: true,
              bankAccount: true
            }
          };
        break;

      case 'security':
          newTouched = {
            ...newTouched,
            password: true,
            confirmPassword: true,
            role: true
          };
        break;
    }

      setTouched(newTouched);
    };
    
    // Validate all fields in current step
    switch (currentStepId) {
      case 'personal':
        validateField('firstName');
        validateField('lastName');
        validateField('dateOfBirth');
        validateField('gender');
        validateField('nationalId');
        
        if (errors.firstName) errorMessages.push(errors.firstName);
        if (errors.lastName) errorMessages.push(errors.lastName);
        if (errors.dateOfBirth) errorMessages.push(errors.dateOfBirth);
        if (errors.gender) errorMessages.push(errors.gender);
        if (errors.nationalId) errorMessages.push(errors.nationalId);
        
        if (!form.firstName) errorMessages.push("First name is required");
        if (!form.lastName) errorMessages.push("Last name is required");
        if (!form.dateOfBirth) errorMessages.push("Date of birth is required");
        if (!form.gender && !selectedGender) errorMessages.push("Gender is required");
        if (!form.nationalId) errorMessages.push("National ID is required");
        
        if (errorMessages.length > 0) isValid = false;
        break;
        
      case 'contact':
        validateField('phone');
        validateField('email');
        validateField('address');
        
        if (errors.phone) errorMessages.push(errors.phone);
        if (errors.email) errorMessages.push(errors.email);
        if (errors.address) errorMessages.push(errors.address);
        
        if (!form.phone) errorMessages.push("Phone number is required");
        if (!form.email) errorMessages.push("Email is required");
        if (!form.address) errorMessages.push("Address is required");
        
        if (errorMessages.length > 0) isValid = false;
        break;
        
      case 'emergency':
        validateField('emergencyContact.name');
        validateField('emergencyContact.phone');
        validateField('emergencyContact.relationship');
        
        if (errors.emergencyContactName) errorMessages.push(errors.emergencyContactName);
        if (errors.emergencyContactPhone) errorMessages.push(errors.emergencyContactPhone);
        if (errors.emergencyContactRelationship) errorMessages.push(errors.emergencyContactRelationship);
        
        if (!form.emergencyContact.name) errorMessages.push("Emergency contact name is required");
        if (!form.emergencyContact.phone) errorMessages.push("Emergency contact phone is required");
        if (!form.emergencyContact.relationship) errorMessages.push("Relationship is required");
        
        if (errorMessages.length > 0) isValid = false;
        break;
        
      case 'employment':
        validateField('employmentDetails.department');
        validateField('employmentDetails.joiningDate');
        validateField('employmentDetails.salary');
        
        if (errors.department) errorMessages.push(errors.department);
        if (errors.joiningDate) errorMessages.push(errors.joiningDate);
        if (errors.salary) errorMessages.push(errors.salary);
        
        if (!form.employmentDetails.department) errorMessages.push("Department is required");
        if (!form.employmentDetails.joiningDate) errorMessages.push("Joining date is required");
        if (!form.employmentDetails.salary) errorMessages.push("Salary is required");
        
        if (errorMessages.length > 0) isValid = false;
        break;
        
      case 'security':
        validateField('password');
        validateField('confirmPassword');
        
        if (errors.password) errorMessages.push(errors.password);
        if (errors.confirmPassword) errorMessages.push(errors.confirmPassword);
        
        if (!form.password) errorMessages.push("Password is required");
        if (!form.confirmPassword) errorMessages.push("Confirm password is required");
        if (!selectedRole) errorMessages.push("Please select a role");
        
        if (errorMessages.length > 0) {
          if (!selectedRole) {
            setErrors(prev => ({ ...prev, role: 'Please select a role' }));
          } else {
            setErrors(prev => {
              const updated = { ...prev };
              delete updated.role;
              return updated;
            });
          }
          isValid = false;
        }
        break;
    }
    
    if (!isValid) {
      touchFields();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Show alert with all error messages
      if (errorMessages.length > 0) {
        Alert.alert(
          "Validation Error",
          errorMessages.join('\n'),
          [{ text: "OK" }]
        );
      }
    }
    
    return isValid;
  };

  const handleNext = () => {
    if (!validateCurrentStep()) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep < steps.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: -width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(prev => prev + 1);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
      });
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (currentStep > 0) {
      Animated.sequence([
        Animated.timing(slideAnim, {
          toValue: width,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setCurrentStep(prev => prev - 1);
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
        }
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
      
      // Get the gender value correctly
      const genderValue = selectedGender || form.gender;
      
      // Prepare user data
      const userData = {
        firstName: form.firstName,
        lastName: form.lastName,
        fullName: `${form.firstName} ${form.lastName}`,
        email: form.email,
        phone: form.phone,
        address: form.address,
        dateOfBirth: form.dateOfBirth,
        gender: genderValue,
        nationalId: form.nationalId,
        emergencyContact: {
          name: form.emergencyContact.name,
          phone: form.emergencyContact.phone,
          relationship: form.emergencyContact.relationship
        },
        employmentDetails: {
          department: form.employmentDetails.department,
          joiningDate: form.employmentDetails.joiningDate,
          salary: form.employmentDetails.salary,
          bankAccount: form.employmentDetails.bankAccount
        },
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Register employee using the auth function
      await registerEmployee(
        form.email,
        form.password,
        selectedRole,
        userData,
        true  // Add preserveSession=true parameter to prevent logging out the admin
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Success", 
        "Employee added successfully!",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error("Error adding employee: ", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      let errorMessage = "An error occurred while adding the employee.";
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = "This email is already registered.";
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = "Please enter a valid email address.";
      } else if (error.code === 'auth/weak-password') {
        errorMessage = "Password should be at least 6 characters.";
      }
      
      Alert.alert("Error", errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  const handleRoleSelect = (value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedRole(value);
    setOpen(false);
    
    // Clear role error if exists
    if (errors.role) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated.role;
        return updated;
      });
    }
  };

  const renderProgressBar = () => (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 16,
      backgroundColor: 'transparent'
    }}>
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View style={{
            alignItems: 'center',
            width: 40
          }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: index <= currentStep ? colors.primary : `${colors.primary}20`,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 8
            }}>
            <MaterialIcons
              name={step.icon}
                size={22}
                color={index <= currentStep ? 'white' : colors.primary}
            />
          </View>
            <View style={{
              height: 3,
              width: index < steps.length - 1 ? 72 : 0,
              backgroundColor: index < currentStep ? colors.primary : `${colors.primary}20`,
              position: 'absolute',
              right: -36,
              top: 20,
              zIndex: -1
            }} />
          </View>
        </React.Fragment>
      ))}
    </View>
  );

  const renderInputField = (label, icon, field, placeholder, keyboardType = 'default', secureTextEntry = false, isDate = false, isGender = false, isPhone = false) => {
    // Get the correct value based on whether it's a nested field or not
    const getValue = () => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return form[parent][child];
      }
      return form[field];
    };
    
    // Get the corresponding error
    const getError = () => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        const errorKey = `${parent}${child.charAt(0).toUpperCase() + child.slice(1)}`;
        return errors[errorKey];
      }
      return errors[field];
    };
    
    // Check if field has been touched
    const isTouched = () => {
      if (field.includes('.')) {
        const [parent, child] = field.split('.');
        return touched[parent]?.[child];
      }
      return touched[field];
    };
    
    // Handle change text
    const onChangeText = (text) => {
      handleInputChange(field, text);
    };
    
    const value = getValue();
    const error = getError();
    const fieldTouched = isTouched();
    const hasError = fieldTouched && error;
    const isValid = fieldTouched && !error && value;
    
    return (
      <TouchableWithoutFeedback 
        onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }}
      >
        <View style={{ marginBottom: 16 }}>
          <Text style={{ 
            fontSize: 16, 
            fontWeight: '600', 
            color: colors.text, 
            marginBottom: 8 
          }}>
            {label}{field === 'employmentDetails.salary' ? ' (Birr)' : ''}
          </Text>
          
        {isDate ? (
            <View>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.inputBg, 
                borderWidth: 1, 
                borderColor: hasError ? colors.error : isValid ? colors.success : colors.border, 
                borderRadius: 12, 
                paddingHorizontal: 16, 
                paddingVertical: 12 
              }}>
                <MaterialIcons name="event" size={22} color={hasError ? colors.error : isValid ? colors.success : colors.primary} />
            <TextInput
                  style={{ 
                    flex: 1, 
                    marginLeft: 12, 
                    color: colors.text, 
                    fontSize: 16 
                  }}
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
                  placeholderTextColor={colors.textLight}
                />
                {isValid && (
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                )}
                {hasError && (
                  <MaterialIcons name="error" size={20} color={colors.error} />
                )}
              </View>
              <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                Format: YYYY-MM-DD
              </Text>
              {hasError && (
                <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                  {error}
                </Text>
              )}
          </View>
        ) : isGender ? (
            <View style={{ zIndex: 3000, marginBottom: 60 }}>
            <DropDownPicker
              open={genderOpen}
              value={selectedGender}
              items={GENDER_OPTIONS}
                setOpen={(isOpen) => {
                  // Close other dropdowns if this one opens
                  if (isOpen) {
                    setOpen(false);
                  }
                  setGenderOpen(isOpen);
                }}
              setValue={(value) => {
                setSelectedGender(value);
                  handleInputChange('gender', value);
              }}
                placeholder={placeholder}
              style={{
                  backgroundColor: colors.inputBg,
                  borderColor: hasError ? colors.error : isValid ? colors.success : colors.primary,
                  borderWidth: 2,
                borderRadius: 12,
                paddingHorizontal: 16,
                  paddingVertical: 14,
                  minHeight: 56
              }}
              textStyle={{
                fontSize: 16,
                  color: colors.text,
                  fontWeight: '500'
              }}
              dropDownContainerStyle={{
                  borderColor: colors.primary,
                  borderWidth: 2,
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  position: 'absolute',
                  top: 56
                }}
                listMode="SCROLLVIEW"
                scrollViewProps={{
                  nestedScrollEnabled: true,
              }}
              listItemLabelStyle={{
                  color: colors.text,
                  fontSize: 16,
                  fontWeight: '500',
                }}
                listItemContainerStyle={{
                  height: 56,
                  paddingHorizontal: 8
              }}
              selectedItemLabelStyle={{
                  color: colors.primary,
                fontWeight: 'bold',
              }}
              placeholderStyle={{
                  color: colors.textLight,
                  fontSize: 16
              }}
              showTickIcon={true}
              tickIconStyle={{
                  tintColor: colors.primary,
                }}
                ArrowDownIconComponent={() => (
                  <View style={{ backgroundColor: `${colors.primary}15`, padding: 5, borderRadius: 8 }}>
                    <MaterialIcons name="arrow-drop-down" size={32} color={colors.primary} />
                  </View>
                )}
                ArrowUpIconComponent={() => (
                  <View style={{ backgroundColor: `${colors.primary}15`, padding: 5, borderRadius: 8 }}>
                    <MaterialIcons name="arrow-drop-up" size={32} color={colors.primary} />
                  </View>
                )}
                TickIconComponent={() => (
                  <MaterialIcons name="check-circle" size={24} color={colors.primary} />
                )}
              />
              {hasError && (
                <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                  {error}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4, fontStyle: 'italic' }}>
                Please select Male or Female as listed on official ID documents
              </Text>
          </View>
        ) : isPhone ? (
            <View>
              <View style={{ flexDirection: 'row' }}>
                <TouchableOpacity
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.inputBg,
                    borderWidth: 1,
                    borderColor: hasError ? colors.error : isValid ? colors.success : colors.border,
                    borderTopLeftRadius: 12,
                    borderBottomLeftRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderRightWidth: 0,
                  }}
                  onPress={() => setCountryPickerVisible(true)}
                >
                  <Text style={{ color: colors.text }}>{countryCode}</Text>
                  <MaterialIcons name="arrow-drop-down" size={20} color={colors.primary} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
                <View style={{ 
                  flex: 1, 
                  flexDirection: 'row', 
                  alignItems: 'center', 
                  backgroundColor: colors.inputBg, 
                  borderWidth: 1, 
                  borderColor: hasError ? colors.error : isValid ? colors.success : colors.border, 
                  borderTopRightRadius: 12, 
                  borderBottomRightRadius: 12, 
                  paddingHorizontal: 16
                }}>
            <TextInput
                    style={{ 
                      flex: 1, 
                      color: colors.text, 
                      fontSize: 16 
                    }}
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType="phone-pad"
                    maxLength={9}
                    placeholderTextColor={colors.textLight}
                  />
                  {isValid && (
                    <MaterialIcons name="check-circle" size={20} color={colors.success} />
                  )}
                  {hasError && (
                    <MaterialIcons name="error" size={20} color={colors.error} />
                  )}
                </View>
              </View>
              {hasError && (
                <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                  {error}
                </Text>
              )}
              <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4, fontStyle: 'italic' }}>
                Enter a valid 9-digit phone number
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
                }}
            />
          </View>
        ) : (
            <View>
              <View style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                backgroundColor: colors.inputBg, 
                borderWidth: 1, 
                borderColor: hasError ? colors.error : isValid ? colors.success : colors.border, 
                borderRadius: 12, 
                paddingHorizontal: 16, 
                paddingVertical: 12 
              }}>
                <MaterialIcons 
                  name={icon} 
                  size={22} 
                  color={hasError ? colors.error : isValid ? colors.success : colors.primary} 
                />
            <TextInput
                  style={{ 
                    flex: 1, 
                    marginLeft: 12, 
                    color: colors.text, 
                    fontSize: 16 
                  }}
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
                  secureTextEntry={secureTextEntry && (field === 'password' ? !showPassword : !showConfirmPassword)}
                  autoCapitalize={field === 'email' ? 'none' : field === 'password' || field === 'confirmPassword' ? 'none' : 'words'}
                  placeholderTextColor={colors.textLight}
            />
            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (field === 'password') {
                    setShowPassword(!showPassword);
                  } else {
                    setShowConfirmPassword(!showConfirmPassword);
                  }
                }}
              >
                <MaterialIcons
                      name={(field === 'password' ? showPassword : showConfirmPassword) ? 'visibility' : 'visibility-off'}
                      size={22}
                      color={colors.primary}
                />
              </TouchableOpacity>
                )}
                {!secureTextEntry && isValid && (
                  <MaterialIcons name="check-circle" size={20} color={colors.success} />
                )}
                {!secureTextEntry && hasError && (
                  <MaterialIcons name="error" size={20} color={colors.error} />
                )}
              </View>
              {hasError && (
                <Text style={{ fontSize: 12, color: colors.error, marginTop: 4 }}>
                  {error}
                </Text>
              )}
              {field === 'password' && !hasError && (
                <Text style={{ fontSize: 12, color: colors.textLight, marginTop: 4 }}>
                  Must be at least 6 characters with uppercase, lowercase and numbers
                </Text>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );
  };

  const renderCurrentStep = () => {
    const currentStepId = steps[currentStep].id;
    switch (currentStep) {
      case 0: // Personal Information
  return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="person" size={24} color={colors.primary} />
              <Text style={styles.stepTitle}>Personal Information</Text>
            </View>
            
            {renderInputField('First Name', 'person', 'firstName', "Enter first name")}
            {renderInputField('Last Name', 'person', 'lastName', "Enter last name")}
            {renderInputField('Date of Birth', 'event', 'dateOfBirth', "YYYY-MM-DD", 'default', false, true)}
            {renderInputField('Gender', 'person', 'gender', "Select gender", 'default', false, false, true)}
            {renderInputField('National ID', 'badge', 'nationalId', "Enter national ID")}
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]} 
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
          </View>
          </View>
        );
      
      case 1: // Contact Information
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="contact-mail" size={24} color={colors.primary} />
              <Text style={styles.stepTitle}>Contact Information</Text>
            </View>
            
            {renderInputField('Phone Number', 'phone', 'phone', "Enter phone number", 'phone-pad', false, false, false, true)}
            {renderInputField('Email Address', 'email', 'email', "Enter email address", "email-address")}
            {renderInputField('Address', 'location-on', 'address', "Enter address")}
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]} 
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 2: // Emergency Contact
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="emergency" size={24} color={colors.primary} />
              <Text style={styles.stepTitle}>Emergency Contact</Text>
            </View>
            
            {renderInputField('Emergency Contact Name', 'person', 'emergencyContact.name', "Enter emergency contact name")}
            {renderInputField('Emergency Contact Phone', 'phone', 'emergencyContact.phone', "Enter emergency contact phone", "phone-pad", false, false, false, true)}
            {renderInputField('Relationship', 'people', 'emergencyContact.relationship', "Enter relationship")}
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]} 
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 3: // Employment Details
        return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="work" size={24} color={colors.primary} />
              <Text style={styles.stepTitle}>Employment Details</Text>
            </View>
            
            {renderInputField(
              'Department',
              'business-center',
              'employmentDetails.department',
              'Enter department name'
            )}
            
            {renderInputField(
              'Joining Date',
              'event',
              'employmentDetails.joiningDate',
              'YYYY-MM-DD',
              'default',
              false,
              true
            )}
            
            {renderInputField(
              'Salary (ETB)',
              'attach-money',
              'employmentDetails.salary',
              'Enter monthly salary',
              'numeric'
            )}
            
            {renderInputField(
              'Bank Account',
              'account-balance',
              'employmentDetails.bankAccount',
              'Enter bank account number'
            )}
            
            <View style={{ marginBottom: 24 }}>
              <Text style={styles.inputLabel}>Employee Role</Text>
              
              <TouchableOpacity
                style={[
                  styles.dropdownSelector,
                  { borderColor: errors.role ? colors.error : colors.border }
                ]}
                onPress={() => {
                  setOpen(!open);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Close keyboard when opening dropdown
                  Keyboard.dismiss();
                }}
              >
                <MaterialIcons name="assignment-ind" size={20} color={colors.primary} />
                <Text style={[
                  styles.dropdownText,
                  { color: selectedRole ? colors.text : colors.textLight }
                ]}>
                  {selectedRole ? 
                    EMPLOYEE_ROLES.find(r => r.value === selectedRole)?.label : 
                    'Select employee role'}
                </Text>
                <MaterialIcons 
                  name={open ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                  size={24} 
                  color={colors.textLight} 
                />
              </TouchableOpacity>
              
              {errors.role && (
                <Text style={styles.errorText}>{errors.role}</Text>
              )}
              
              {open && (
                <View style={{
                  position: 'absolute',
                  top: 76,
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                    borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.primary,
                  zIndex: 9999,
                  elevation: 5,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  maxHeight: 200, // Limit height and make scrollable
                }}>
                  <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                  }}>
                    <Text style={{ fontWeight: 'bold', color: colors.primary }}>
                      Select Role
                    </Text>
                    <TouchableOpacity onPress={() => setOpen(false)}>
                      <MaterialIcons name="close" size={20} color={colors.textLight} />
                    </TouchableOpacity>
                  </View>
                  
                  <ScrollView 
                    style={{ maxHeight: 150 }}
                    nestedScrollEnabled={true}
                    showsVerticalScrollIndicator={true}
                  >
                    {EMPLOYEE_ROLES.map((role) => (
                      <TouchableOpacity
                        key={role.value}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 12,
                          paddingHorizontal: 16,
                          backgroundColor: selectedRole === role.value ? 
                            `${colors.primary}20` : 'transparent',
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                        onPress={() => {
                          handleRoleSelect(role.value);
                          setOpen(false);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                      >
                        <MaterialIcons 
                          name={role.value === 'admin' ? 'admin-panel-settings' : 
                                role.value === 'manager' ? 'manage-accounts' :
                                role.value === 'stockManager' ? 'inventory' :
                                role.value === 'deliveryAgent' ? 'local-shipping' :
                                role.value === 'customerAssistance' ? 'support-agent' :
                                'person'}
                          size={20}
                          color={colors.primary}
                          style={{ marginRight: 12 }}
                        />
                        <Text style={{ 
                          fontSize: 16, 
                          color: selectedRole === role.value ? colors.primary : colors.text,
                          fontWeight: selectedRole === role.value ? 'bold' : 'normal'
                        }}>
                          {role.label}
                        </Text>
                        
                        {selectedRole === role.value && (
                          <MaterialIcons 
                            name="check-circle" 
                            size={20} 
                            color={colors.primary} 
                            style={{ marginLeft: 'auto' }} 
                          />
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
              </View>
          )}
        </View>
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.nextButton]} 
                onPress={handleNext}
              >
                <Text style={styles.buttonText}>Next</Text>
                <MaterialIcons name="arrow-forward" size={20} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      case 4: // Account Security
  return (
          <View style={styles.stepContainer}>
            <View style={styles.stepHeader}>
              <MaterialIcons name="security" size={24} color={colors.primary} />
              <Text style={styles.stepTitle}>Account Security</Text>
            </View>
            
            {renderInputField('Password', 'lock', 'password', "Create a strong password", "default", true)}
            {renderInputField('Confirm Password', 'lock', 'confirmPassword', "Confirm your password", "default", true)}
            
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.backButton]} 
                onPress={handleBack}
              >
                <MaterialIcons name="arrow-back" size={20} color="white" />
                <Text style={styles.buttonText}>Back</Text>
              </TouchableOpacity>
              
          <TouchableOpacity
                style={[styles.button, styles.nextButton]} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Submit</Text>
                    <MaterialIcons name="check" size={20} color="white" />
                  </>
                )}
          </TouchableOpacity>
          </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={[colors.primary, colors.primaryLight]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          paddingTop: 8,
          paddingBottom: 16,
          borderBottomLeftRadius: 24,
          borderBottomRightRadius: 24,
          shadowColor: colors.primary,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 5
        }}
      >
        <HomeHeader title="Add Employee" />
      </LinearGradient>

      {renderProgressBar()}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={{ flex: 1, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
          contentContainerStyle={{ paddingBottom: 30 }}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}