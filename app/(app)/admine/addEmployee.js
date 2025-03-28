import React, { useState, useRef } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { auth, db } from '../../../firebase/firebaseConfig';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import DropDownPicker from 'react-native-dropdown-picker';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import * as Haptics from 'expo-haptics';
import CountryPicker from 'react-native-country-picker-modal';

const { width } = Dimensions.get('window');

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
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' }
];

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const steps = [
  { id: 'personal', title: 'Personal Information', icon: 'person' },
  { id: 'contact', title: 'Contact Information', icon: 'contact-mail' },
  { id: 'emergency', title: 'Emergency Contact', icon: 'emergency' },
  { id: 'employment', title: 'Employment Details', icon: 'work' },
  { id: 'security', title: 'Account Security', icon: 'security' },
];

export default function AddEmployee() {
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
      position: '',
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

  const handleInputChange = (field, value) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
  };

  const validateDate = (dateString) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) return false;

    const date = new Date(dateString);
    const today = new Date();
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 18); // Minimum age 18

    if (isNaN(date.getTime())) return false;
    if (date > today) return false;
    if (date > minDate) return false;
    return true;
  };

  const validateCurrentStep = () => {
    const currentStepId = steps[currentStep].id;
    let errorMessage = "";

    switch (currentStepId) {
      case 'personal':
        if (!form.firstName) errorMessage = "First name is required";
        else if (!form.lastName) errorMessage = "Last name is required";
        else if (!form.gender) errorMessage = "Please select gender";
        else if (!form.nationalId) errorMessage = "National ID is required";
        else if (!form.dateOfBirth) errorMessage = "Date of birth is required";
        else if (!validateDate(form.dateOfBirth)) errorMessage = "Please enter a valid date of birth (YYYY-MM-DD)";
        break;

      case 'contact':
        if (!form.phone) errorMessage = "Phone number is required";
        else if (!form.email) errorMessage = "Email address is required";
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errorMessage = "Please enter a valid email address";
        else if (!form.address) errorMessage = "Address is required";
        break;

      case 'emergency':
        if (!form.emergencyContact.name) errorMessage = "Emergency contact name is required";
        else if (!form.emergencyContact.phone) errorMessage = "Emergency contact phone is required";
        else if (!form.emergencyContact.relationship) errorMessage = "Relationship is required";
        break;

      case 'employment':
        if (!form.employmentDetails.department) errorMessage = "Department is required";
        else if (!form.employmentDetails.position) errorMessage = "Position is required";
        else if (!form.employmentDetails.salary) errorMessage = "Salary is required";
        else if (!form.employmentDetails.joiningDate) errorMessage = "Joining date is required";
        else if (!validateDate(form.employmentDetails.joiningDate)) errorMessage = "Please enter a valid joining date (YYYY-MM-DD)";
        break;

      case 'security':
        if (!form.password) errorMessage = "Password is required";
        else if (form.password.length < 6) errorMessage = "Password must be at least 6 characters long";
        else if (!form.confirmPassword) errorMessage = "Please confirm your password";
        else if (form.password !== form.confirmPassword) errorMessage = "Passwords do not match";
        else if (!selectedRole) errorMessage = "Please select a role";
        break;
    }

    if (errorMessage) {
      Alert.alert("Error", errorMessage);
      return true;
    }
    return false;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      });
    }
  };

  const handleSubmit = async () => {
    if (validateCurrentStep()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const user = userCredential.user;

      await setDoc(doc(db, selectedRole), {
        uid: user.uid,
        ...form,
        createdAt: new Date(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Success", "Employee added successfully!");
      router.back();
    } catch (error) {
      console.error("Error adding document: ", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message);
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
  };

  const renderProgressBar = () => (
    <View className="flex-row justify-center items-center py-4">
      {steps.map((step, index) => (
        <React.Fragment key={step.id}>
          <View className={`w-8 h-8 rounded-full items-center justify-center ${
            index <= currentStep ? 'bg-indigo-600' : 'bg-gray-200'
          }`}>
            <MaterialIcons
              name={step.icon}
              size={20}
              color={index <= currentStep ? 'white' : '#9CA3AF'}
            />
          </View>
          {index < steps.length - 1 && (
            <View className={`h-1 w-16 mx-2 ${
              index < currentStep ? 'bg-indigo-600' : 'bg-gray-200'
            }`} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderInputField = (label, icon, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry = false, isDate = false, isGender = false, isPhone = false) => (
    <TouchableWithoutFeedback onPress={() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }}>
      <View className="mb-6">
        <Text className="text-lg font-semibold text-gray-800 mb-2">{label}</Text>
        {isDate ? (
          <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <MaterialIcons name={icon} size={24} color="#4F46E5" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType="numeric"
              maxLength={10}
            />
          </View>
        ) : isGender ? (
          <View>
            <DropDownPicker
              open={genderOpen}
              value={selectedGender}
              items={GENDER_OPTIONS}
              setOpen={setGenderOpen}
              setValue={(value) => {
                setSelectedGender(value);
                handleInputChange('gender', value);
                setGenderOpen(false);
              }}
              placeholder="Select gender"
              style={{
                backgroundColor: '#F9FAFB',
                borderColor: '#E5E7EB',
                borderRadius: 12,
                paddingHorizontal: 16,
                paddingVertical: 12,
                zIndex: 1000,
              }}
              textStyle={{
                fontSize: 16,
                color: '#374151',
              }}
              dropDownContainerStyle={{
                borderColor: '#E5E7EB',
              }}
              listItemLabelStyle={{
                color: '#374151',
              }}
              selectedItemLabelStyle={{
                color: '#4F46E5',
                fontWeight: 'bold',
              }}
              placeholderStyle={{
                color: '#9CA3AF',
              }}
              showTickIcon={true}
              tickIconStyle={{
                tintColor: '#4F46E5',
              }}
            />
          </View>
        ) : isPhone ? (
          <View className="flex-row items-center">
            <View className="flex-row items-center bg-gray-50 rounded-l-xl px-4 py-3 border border-gray-200 border-r-0">
              <Text className="text-gray-800">{countryCode}</Text>
            </View>
            <TextInput
              className="flex-1 bg-gray-50 rounded-r-xl px-4 py-3 border border-gray-200 text-gray-800"
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>
        ) : (
          <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
            <MaterialIcons name={icon} size={24} color="#4F46E5" />
            <TextInput
              className="flex-1 ml-3 text-gray-800"
              placeholder={placeholder}
              value={value}
              onChangeText={onChangeText}
              keyboardType={keyboardType}
              secureTextEntry={secureTextEntry && (label === 'Password' ? !showPassword : !showConfirmPassword)}
              autoCapitalize="none"
            />
            {secureTextEntry && (
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (label === 'Password') {
                    setShowPassword(!showPassword);
                  } else {
                    setShowConfirmPassword(!showConfirmPassword);
                  }
                }}
              >
                <MaterialIcons
                  name={(label === 'Password' ? showPassword : showConfirmPassword) ? 'visibility' : 'visibility-off'}
                  size={24}
                  color="#4F46E5"
                />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </TouchableWithoutFeedback>
  );

  const renderCurrentStep = () => {
    const currentStepId = steps[currentStep].id;
    return (
      <Animated.View
        style={{
          transform: [{ translateX: slideAnim }],
        }}
        className="flex-1"
      >
        <View className="bg-white rounded-2xl shadow-lg p-6">
          <View className="flex-row items-center mb-6">
            <MaterialIcons name={steps[currentStep].icon} size={24} color="#4F46E5" />
            <Text className="text-xl font-bold text-gray-800 ml-2">{steps[currentStep].title}</Text>
          </View>

          {currentStepId === 'personal' && (
            <>
              {renderInputField('First Name', 'person', form.firstName, (text) => handleInputChange("firstName", text), "Enter first name")}
              {renderInputField('Last Name', 'person', form.lastName, (text) => handleInputChange("lastName", text), "Enter last name")}
              {renderInputField('Date of Birth', 'event', form.dateOfBirth, (text) => handleInputChange("dateOfBirth", text), "YYYY-MM-DD", 'default', false, true)}
              {renderInputField('Gender', 'person', form.gender, (text) => handleInputChange("gender", text), "Select gender", 'default', false, false, true)}
              {renderInputField('National ID', 'badge', form.nationalId, (text) => handleInputChange("nationalId", text), "Enter national ID")}
            </>
          )}

          {currentStepId === 'contact' && (
            <>
              {renderInputField('Phone Number', 'phone', form.phone, (text) => handleInputChange("phone", text), "Enter phone number", 'phone-pad', false, false, false, true)}
              {renderInputField('Email Address', 'email', form.email, (text) => handleInputChange("email", text), "Enter email address", "email-address")}
              {renderInputField('Address', 'location-on', form.address, (text) => handleInputChange("address", text), "Enter address")}
            </>
          )}

          {currentStepId === 'emergency' && (
            <>
              {renderInputField('Emergency Contact Name', 'person', form.emergencyContact.name, (text) => handleInputChange("emergencyContact.name", text), "Enter emergency contact name")}
              {renderInputField('Emergency Contact Phone', 'phone', form.emergencyContact.phone, (text) => handleInputChange("emergencyContact.phone", text), "Enter emergency contact phone", "phone-pad", false, false, false, true)}
              {renderInputField('Relationship', 'people', form.emergencyContact.relationship, (text) => handleInputChange("emergencyContact.relationship", text), "Enter relationship")}
            </>
          )}

          {currentStepId === 'employment' && (
            <>
              {renderInputField('Department', 'business', form.employmentDetails.department, (text) => handleInputChange("employmentDetails.department", text), "Enter department")}
              {renderInputField('Position', 'work', form.employmentDetails.position, (text) => handleInputChange("employmentDetails.position", text), "Enter position")}
              {renderInputField('Joining Date', 'event', form.employmentDetails.joiningDate, (text) => handleInputChange("employmentDetails.joiningDate", text), "YYYY-MM-DD", 'default', false, true)}
              {renderInputField('Salary', 'attach-money', form.employmentDetails.salary, (text) => handleInputChange("employmentDetails.salary", text), "Enter salary", "numeric")}
              {renderInputField('Bank Account', 'account-balance', form.employmentDetails.bankAccount, (text) => handleInputChange("employmentDetails.bankAccount", text), "Enter bank account number")}
            </>
          )}

          {currentStepId === 'security' && (
            <>
              {renderInputField('Password', 'lock', form.password, (text) => handleInputChange("password", text), "Enter password", "default", true)}
              {renderInputField('Confirm Password', 'lock', form.confirmPassword, (text) => handleInputChange("confirmPassword", text), "Confirm password", "default", true)}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-800 mb-2">Select Role</Text>
                <DropDownPicker
                  open={open}
                  value={selectedRole}
                  items={roles}
                  setOpen={setOpen}
                  setValue={handleRoleSelect}
                  setItems={() => {}}
                  placeholder="Select a role"
                  style={{
                    backgroundColor: '#F9FAFB',
                    borderColor: '#E5E7EB',
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                  }}
                  textStyle={{
                    fontSize: 16,
                    color: '#374151',
                  }}
                  dropDownContainerStyle={{
                    borderColor: '#E5E7EB',
                  }}
                />
              </View>
            </>
          )}
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={['#4F46E5', '#6366F1']}
        className="h-32 rounded-b-3xl px-6 pt-4"
      >
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={handleBackPress}
            className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
          >
            <MaterialIcons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <View className="ml-4">
            <Text className="text-2xl font-bold text-white">Add Employee</Text>
            <Text className="text-white/80">Step {currentStep + 1} of {steps.length}</Text>
          </View>
        </View>
      </LinearGradient>

      {renderProgressBar()}

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView 
          ref={scrollViewRef}
          className="flex-1 px-6"
          showsVerticalScrollIndicator={false}
        >
          {renderCurrentStep()}
        </ScrollView>
      </KeyboardAvoidingView>

      <View className="px-6 py-4 bg-white border-t border-gray-200">
        <View className="flex-row justify-between">
          {currentStep > 0 && (
            <TouchableOpacity
              onPress={handleBack}
              className="px-6 py-3 bg-gray-100 rounded-xl"
            >
              <Text className="text-gray-700 font-semibold">Back</Text>
            </TouchableOpacity>
          )}
          {currentStep < steps.length - 1 ? (
            <TouchableOpacity
              onPress={handleNext}
              className={`px-6 py-3 bg-indigo-600 rounded-xl ${currentStep === 0 ? 'ml-auto' : ''}`}
            >
              <Text className="text-white font-semibold">Next</Text>
            </TouchableOpacity>
          ) : (
            <AnimatedTouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={{
                transform: [{ scale: buttonScale }],
              }}
              className={`px-6 py-3 bg-indigo-600 rounded-xl ${currentStep === 0 ? 'ml-auto' : ''}`}
            >
              <Text className="text-white font-semibold">
                {loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </AnimatedTouchableOpacity>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}