import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  FlatList,
  TextInput,
  Modal,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from 'expo-haptics';
import HomeHeader from "../../components/HomeHeader";
import { BlurView } from 'expo-blur';
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../firebase/firebaseConfig";
import { useIsFocused } from '@react-navigation/native';

const { width, height } = Dimensions.get("window");

export default function EmployeeManagement() {
  const router = useRouter();
  const isFocused = useIsFocused();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVisible, setFilterVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editableEmployee, setEditableEmployee] = useState(null);

  // Animation setup
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true
    }).start();
  }, []);

  // Fetch employees from Firebase
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simple query without compound conditions to avoid Firebase index error
        const usersRef = collection(db, "users");
        const q = query(usersRef);
        const querySnapshot = await getDocs(q);

        // Filter non-customers client-side
        const employeeData = [];
        querySnapshot.docs.forEach((doc) => {
          const userData = doc.data();
          // Skip customers
          if (!userData.role || userData.role === 'customer') return;

          // Extract name from various possible fields
          const displayName = userData.fullName ||
            (userData.firstName && userData.lastName ? `${userData.firstName} ${userData.lastName}` : null) ||
            userData.name ||
            userData.displayName ||
            'No Name';

          // Extract employment details
          const employmentDetails = userData.employmentDetails || {};
          const position = userData.position || employmentDetails.position || userData.role || 'Unknown Position';
          const department = employmentDetails.department || '';
          const salary = employmentDetails.salary || '';
          const bankAccount = employmentDetails.bankAccount || '';
          const joiningDate = employmentDetails.joiningDate || '';

          // Extract contact and personal information
          const email = userData.email || '';
          const phone = userData.phone || '';
          const address = userData.address || '';
          const gender = userData.gender || '';
          const dateOfBirth = userData.dateOfBirth || '';
          const nationalId = userData.nationalId || '';

          // Extract emergency contact
          const emergencyContact = userData.emergencyContact || {};
          const emergencyName = emergencyContact.name || '';
          const emergencyPhone = emergencyContact.phone || '';
          const relationship = emergencyContact.relationship || '';

          employeeData.push({
            id: doc.id,
            name: displayName,
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            position: position,
            email: email,
            phone: phone,
            photo: userData.photoURL || userData.profileImage || userData.avatar || null,
            department: getDepartmentFromRole(userData.role),
            role: userData.role || '',
            joinDate: joiningDate ||
              (userData.createdAt?.toDate ?
                new Date(userData.createdAt.toDate()).toISOString().split('T')[0] :
                'Unknown'),
            createdAt: userData.createdAt?.toDate ? new Date(userData.createdAt.toDate()) : null,
            performance: userData.performance || '85%',
            rating: userData.rating || 4.0,

            // Additional details for modal
            employmentDetails: {
              department,
              position,
              salary,
              bankAccount,
              joiningDate
            },
            personalDetails: {
              address,
              gender,
              dateOfBirth,
              nationalId
            },
            emergencyContact: {
              name: emergencyName,
              phone: emergencyPhone,
              relationship
            },
            status: userData.status || 'active'
          });
        });

        // Sort by department and name
        employeeData.sort((a, b) => {
          // First by department
          if (a.department !== b.department) {
            return a.department.localeCompare(b.department);
          }
          // Then by name
          return a.name.localeCompare(b.name);
        });

        setEmployees(employeeData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching employees:", error);
        setError("Failed to load employees. Please try again.");
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchEmployees();
    }
  }, [isFocused]);

  // Map user roles to departments
  const getDepartmentFromRole = (role) => {
    switch (role?.toLowerCase()) {
      case 'delivery agent':
      case 'deliveryagent':
        return 'field';
      case 'customer support':
      case 'customersupport':
        return 'support';
      case 'stock manager':
      case 'stockmanager':
      case 'supplier':
        return 'warehouse';
      case 'manager':
      case 'admin':
        return 'management';
      default:
        return 'management';
    }
  };

  // Filter employees based on search and category (role)
  const filteredEmployees = employees.filter(employee => {
    // Search filter
    const matchesSearch =
      !searchQuery ||
      employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.position.toLowerCase().includes(searchQuery.toLowerCase()) ||
      employee.email.toLowerCase().includes(searchQuery.toLowerCase());

    // Category filter by role
    const matchesCategory = selectedCategory === 'all' || employee.role === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Category filter options based on database roles
  const categories = [
    { id: 'all', name: 'All Roles', icon: 'apps' },
    { id: 'admin', name: 'Admin', icon: 'admin-panel-settings' },
    { id: 'manager', name: 'Manager', icon: 'people-alt' },
    { id: 'stockManager', name: 'Stock Manager', icon: 'inventory' },
    { id: 'supplier', name: 'Supplier', icon: 'local-shipping' },
    { id: 'deliveryAgent', name: 'Delivery Agent', icon: 'local-shipping' },
    { id: 'customerAssistance', name: 'Customer Assistance', icon: 'headset' }
  ];

  const handleEmployeePress = (employee) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedEmployee(employee);
    setModalVisible(true);
  };

  // Get role color
  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return '#EF4444'; // Red
      case 'manager': return '#8B5CF6'; // Purple
      case 'stockManager': return '#F59E0B'; // Amber
      case 'supplier': return '#0EA5E9'; // Light Blue
      case 'deliveryAgent': return '#4F46E5'; // Indigo
      case 'customerAssistance': return '#10B981'; // Emerald
      default: return '#6B7280'; // Gray
    }
  };

  // Get role icon
  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin': return <MaterialIcons name="admin-panel-settings" size={24} color="#EF4444" />;
      case 'manager': return <MaterialIcons name="people-alt" size={24} color="#8B5CF6" />;
      case 'stockManager': return <MaterialIcons name="inventory" size={24} color="#F59E0B" />;
      case 'supplier': return <MaterialIcons name="store" size={24} color="#0EA5E9" />;
      case 'deliveryAgent': return <MaterialCommunityIcons name="truck-delivery" size={24} color="#4F46E5" />;
      case 'customerAssistance': return <MaterialIcons name="headset" size={24} color="#10B981" />;
      default: return <MaterialIcons name="work" size={24} color="#6B7280" />;
    }
  };

  // Employee detail modal
  const EmployeeDetailModal = () => {
    if (!selectedEmployee) return null;

    const departmentColor = getRoleColor(selectedEmployee.role);

    return (
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: 20,
              maxHeight: height * 0.8,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setModalVisible(false);
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Employee Details
              </Text>

              <View style={{ width: 40 }}>
                <TouchableOpacity
                  style={{
                    width: 40,
                    height: 40,
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Show edit modal instead of navigating
                    setEditableEmployee({ ...selectedEmployee });
                    setModalVisible(false);
                    setEditModalVisible(true);
                  }}
                >
                  <Ionicons name="create-outline" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
            >
              {/* Employee Profile */}
              <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                <View style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: `${departmentColor}15`,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginBottom: 16,
                }}>
                  {selectedEmployee.photo ? (
                    <Image
                      source={{ uri: selectedEmployee.photo }}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                      }}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 32,
                      fontWeight: 'bold',
                      color: departmentColor,
                    }}>
                      {selectedEmployee.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  )}
                </View>

                <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                  {selectedEmployee.name}
                </Text>

                <Text style={{
                  fontSize: 16,
                  color: '#4B5563',
                  marginBottom: 8,
                  paddingHorizontal: 12,
                  paddingVertical: 4,
                  borderRadius: 20,
                  backgroundColor: `${departmentColor}15`,
                  color: departmentColor,
                  fontWeight: '500'
                }}>
                  {selectedEmployee.position}
                </Text>

                {/* Status Badge */}
                {selectedEmployee.status && (
                  <View style={{
                    paddingHorizontal: 10,
                    paddingVertical: 3,
                    borderRadius: 12,
                    backgroundColor: selectedEmployee.status === 'active' ? '#DCFCE7' : '#FEF2F2',
                    marginTop: 4
                  }}>
                    <Text style={{
                      fontSize: 12,
                      color: selectedEmployee.status === 'active' ? '#16A34A' : '#DC2626',
                      fontWeight: '600'
                    }}>
                      {selectedEmployee.status.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Performance Metrics */}
              <View style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginBottom: 24,
                paddingHorizontal: 20,
              }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                    {selectedEmployee.performance}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Performance</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#111827' }}>
                    {selectedEmployee.rating}/5
                  </Text>
                  <Text style={{ fontSize: 14, color: '#6B7280' }}>Rating</Text>
                </View>
              </View>

              {/* Employee ID and Job Role */}
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                  Employee Information
                </Text>

                <View style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  gap: 16
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="finger-print-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Employee ID</Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.id.substring(0, 8)}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="briefcase-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Position</Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.position}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="shield-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Role</Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>
                      {selectedEmployee.role ? (
                        selectedEmployee.role.charAt(0).toUpperCase() + selectedEmployee.role.slice(1).replace(/([A-Z])/g, ' $1')
                      ) : 'Not assigned'}
                    </Text>
                  </View>

                  {selectedEmployee.employmentDetails.department && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="business-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Department</Text>
                      <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.employmentDetails.department}</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Joined on</Text>
                    <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.joinDate}</Text>
                  </View>

                  {selectedEmployee.personalDetails.nationalId && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="card-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>National ID</Text>
                      <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.personalDetails.nationalId}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Contact Information */}
              <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                  Contact Information
                </Text>

                <View style={{
                  backgroundColor: '#F9FAFB',
                  borderRadius: 12,
                  padding: 16,
                  gap: 16
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="mail-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', flex: 1 }}>{selectedEmployee.email}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Email functionality would go here
                      }}
                    >
                      <Ionicons name="open-outline" size={20} color={departmentColor} />
                    </TouchableOpacity>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="call-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                    <Text style={{ fontSize: 16, color: '#111827', flex: 1 }}>{selectedEmployee.phone}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        // Call functionality would go here
                      }}
                    >
                      <Ionicons name="call" size={20} color={departmentColor} />
                    </TouchableOpacity>
                  </View>

                  {selectedEmployee.personalDetails.address && (
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="location-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, color: '#111827', flex: 1 }}>{selectedEmployee.personalDetails.address}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Personal Details */}
              {(selectedEmployee.personalDetails.dateOfBirth || selectedEmployee.personalDetails.gender) && (
                <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                    Personal Details
                  </Text>

                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 16,
                    gap: 16
                  }}>
                    {selectedEmployee.personalDetails.gender && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Gender</Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>
                          {selectedEmployee.personalDetails.gender.charAt(0).toUpperCase() + selectedEmployee.personalDetails.gender.slice(1)}
                        </Text>
                      </View>
                    )}

                    {selectedEmployee.personalDetails.dateOfBirth && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="calendar-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Date of Birth</Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.personalDetails.dateOfBirth}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Emergency Contact */}
              {selectedEmployee.emergencyContact.name && (
                <View style={{ paddingHorizontal: 20, marginBottom: 24 }}>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 12 }}>
                    Emergency Contact
                  </Text>

                  <View style={{
                    backgroundColor: '#F9FAFB',
                    borderRadius: 12,
                    padding: 16,
                    gap: 16
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="person-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                      <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Name</Text>
                      <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.emergencyContact.name}</Text>
                    </View>

                    {selectedEmployee.emergencyContact.phone && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="call-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Phone</Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.emergencyContact.phone}</Text>
                      </View>
                    )}

                    {selectedEmployee.emergencyContact.relationship && (
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="people-outline" size={20} color="#6B7280" style={{ marginRight: 12 }} />
                        <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>Relationship</Text>
                        <Text style={{ fontSize: 16, color: '#6B7280', marginLeft: 'auto' }}>{selectedEmployee.emergencyContact.relationship}</Text>
                      </View>
                    )}
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={{ paddingHorizontal: 20, gap: 12 }}>
                <TouchableOpacity
                  style={{
                    backgroundColor: departmentColor,
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

                    // Navigate directly to chat room with ability to write messages
                    try {
                      router.push({
                        pathname: '/(app)/chatRoom',
                        params: {
                          uid: selectedEmployee.id,
                          recipientId: selectedEmployee.id,
                          name: selectedEmployee.name,
                          recipientName: selectedEmployee.name,
                          startChat: true, // Flag to immediately open message composer
                          returnPath: '/manager/employee%20management' // Path to return to when pressing back
                        }
                      });
                    } catch (navError) {
                      console.error("Navigation error:", navError);
                      // Fallback to string navigation
                      router.push(`/(app)/chatRoom?uid=${selectedEmployee.id}&recipientId=${selectedEmployee.id}&name=${encodeURIComponent(selectedEmployee.name)}&recipientName=${encodeURIComponent(selectedEmployee.name)}&startChat=true&returnPath=${encodeURIComponent('/manager/employee management')}`);
                    }

                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="chatbubble-ellipses" size={20} color="white" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: 'white' }}>
                    Message Employee
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    paddingVertical: 16,
                    alignItems: 'center',
                    flexDirection: 'row',
                    justifyContent: 'center',
                    borderWidth: 1,
                    borderColor: '#E5E7EB',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Close modal
                    setModalVisible(false);
                  }}
                >
                  <Ionicons name="close-circle-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#64748B' }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  // Filter modal
  const FilterModal = () => {
    return (
      <Modal
        visible={filterVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFilterVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          activeOpacity={1}
          onPress={() => setFilterVisible(false)}
        >
          <View
            style={{
              backgroundColor: 'white',
              borderRadius: 16,
              padding: 12,
              paddingBottom: 16,
              width: '100%',
              maxWidth: 300,
              alignSelf: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
            onStartShouldSetResponder={() => true}
          >
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}>
              <Text style={{ fontSize: 16, fontWeight: 'bold', color: '#111827' }}>
                Filter by Role
              </Text>

              <TouchableOpacity onPress={() => setFilterVisible(false)}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <View style={{ gap: 6 }}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: 8,
                    backgroundColor: selectedCategory === category.id ? '#EEF2FF' : '#F9FAFB',
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: selectedCategory === category.id ? '#E0E7FF' : '#F3F4F6',
                  }}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category.id);
                    setFilterVisible(false);
                  }}
                >
                  <MaterialIcons
                    name={category.icon}
                    size={18}
                    color={selectedCategory === category.id ? getRoleColor(category.id) : '#6B7280'}
                    style={{ marginRight: 8 }}
                  />

                  <Text style={{
                    fontSize: 14,
                    fontWeight: selectedCategory === category.id ? '600' : 'normal',
                    color: selectedCategory === category.id ? getRoleColor(category.id) : '#111827',
                    flex: 1,
                  }}>
                    {category.name}
                  </Text>

                  {selectedCategory === category.id && (
                    <Ionicons name="checkmark-circle" size={18} color={getRoleColor(category.id)} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    );
  };

  // Edit Employee Modal
  const EditEmployeeModal = () => {
    if (!editableEmployee) return null;

    const [firstName, setFirstName] = useState(editableEmployee.firstName || '');
    const [lastName, setLastName] = useState(editableEmployee.lastName || '');
    const [position, setPosition] = useState(editableEmployee.position || '');
    const [email, setEmail] = useState(editableEmployee.email || '');
    const [phone, setPhone] = useState(editableEmployee.phone || '');
    const [address, setAddress] = useState(editableEmployee.personalDetails?.address || '');
    const [department, setDepartment] = useState(editableEmployee.employmentDetails?.department || '');
    const [saving, setSaving] = useState(false);

    const departmentColor = getRoleColor(editableEmployee.role);

    const handleSave = async () => {
      try {
        setSaving(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Create updated employee object
        const updatedEmployee = {
          ...editableEmployee,
          firstName,
          lastName,
          name: `${firstName} ${lastName}`,
          fullName: `${firstName} ${lastName}`,
          position,
          email,
          phone,
          personalDetails: {
            ...editableEmployee.personalDetails,
            address
          },
          employmentDetails: {
            ...editableEmployee.employmentDetails,
            department,
            position
          }
        };

        // Update Firestore document
        const employeeRef = doc(db, 'users', editableEmployee.id);
        await updateDoc(employeeRef, {
          firstName,
          lastName,
          fullName: `${firstName} ${lastName}`,
          position,
          email,
          phone,
          'personalDetails.address': address,
          'employmentDetails.department': department,
          'employmentDetails.position': position,
          lastUpdated: serverTimestamp()
        });

        // Update local state
        setEmployees(prev =>
          prev.map(emp =>
            emp.id === editableEmployee.id ? updatedEmployee : emp
          )
        );

        setEditModalVisible(false);
        Alert.alert('Success', 'Employee information updated successfully!');
      } catch (error) {
        console.error('Error updating employee:', error);
        Alert.alert('Error', 'Failed to update employee information. Please try again.');
      } finally {
        setSaving(false);
      }
    };

    const handleCancel = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEditModalVisible(false);
    };

    return (
      <Modal
        visible={editModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <BlurView
          intensity={20}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
          }}
        />
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          <Animated.View
            style={{
              backgroundColor: 'white',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 16,
              paddingBottom: 20,
              maxHeight: height * 0.9,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -5 },
              shadowOpacity: 0.1,
              shadowRadius: 6,
              elevation: 5,
            }}
          >
            {/* Header */}
            <View style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingHorizontal: 20,
              paddingBottom: 16,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}>
              <TouchableOpacity
                style={{
                  width: 40,
                  height: 40,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
                onPress={handleCancel}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>

              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                Edit Employee
              </Text>

              <TouchableOpacity
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  backgroundColor: departmentColor,
                  borderRadius: 8,
                }}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={{ color: 'white', fontWeight: '600' }}>Save</Text>
                )}
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ padding: 20 }}
            >
              {/* Profile Photo */}
              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  backgroundColor: `${departmentColor}15`,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                  {editableEmployee.photo ? (
                    <Image
                      source={{ uri: editableEmployee.photo }}
                      style={{
                        width: 96,
                        height: 96,
                        borderRadius: 48,
                      }}
                    />
                  ) : (
                    <Text style={{
                      fontSize: 32,
                      fontWeight: 'bold',
                      color: departmentColor,
                    }}>
                      {editableEmployee.name.split(' ').map(n => n[0]).join('')}
                    </Text>
                  )}
                </View>

                <TouchableOpacity style={{ marginTop: 8 }}>
                  <Text style={{ color: departmentColor, fontWeight: '500' }}>
                    Change Photo
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Form Fields */}
              <View style={{ gap: 16 }}>
                {/* Personal Information */}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
                  Personal Information
                </Text>

                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>First Name</Text>
                    <TextInput
                      value={firstName}
                      onChangeText={setFirstName}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="First Name"
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Last Name</Text>
                    <TextInput
                      value={lastName}
                      onChangeText={setLastName}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Last Name"
                    />
                  </View>
                </View>

                {/* Contact Information */}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 8, marginBottom: 4 }}>
                  Contact Information
                </Text>

                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Email</Text>
                    <TextInput
                      value={email}
                      onChangeText={setEmail}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Email Address"
                      keyboardType="email-address"
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Phone</Text>
                    <TextInput
                      value={phone}
                      onChangeText={setPhone}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Phone Number"
                      keyboardType="phone-pad"
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Address</Text>
                    <TextInput
                      value={address}
                      onChangeText={setAddress}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Address"
                    />
                  </View>
                </View>

                {/* Job Information */}
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827', marginTop: 8, marginBottom: 4 }}>
                  Job Information
                </Text>

                <View style={{ gap: 12 }}>
                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Position</Text>
                    <TextInput
                      value={position}
                      onChangeText={setPosition}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Job Position"
                    />
                  </View>

                  <View>
                    <Text style={{ fontSize: 14, color: '#4B5563', marginBottom: 4 }}>Department</Text>
                    <TextInput
                      value={department}
                      onChangeText={setDepartment}
                      style={{
                        backgroundColor: '#F9FAFB',
                        borderWidth: 1,
                        borderColor: '#E5E7EB',
                        borderRadius: 8,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        fontSize: 16,
                      }}
                      placeholder="Department"
                    />
                  </View>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
       {/* Header */}
       <HomeHeader title="Employee Management" />
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        {/* Search and Filter Bar */}
        <View style={{
          flexDirection: 'row',
          paddingHorizontal: 16,
          paddingBottom: 16,
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: '#E5E7EB',
        }}>
          <View style={{
            flex: 1,
            backgroundColor: '#F3F4F6',
            borderRadius: 12,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginRight: 8,
          }}>
            <Ionicons name="search" size={20} color="#6B7280" />
            <TextInput
              placeholder="Search employees..."
              placeholderTextColor="#9CA3AF"
              style={{
                flex: 1,
                marginLeft: 8,
                fontSize: 15,
                color: '#1F2937',
              }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </TouchableOpacity>
            ) : null}
          </View>

          <TouchableOpacity
            style={{
              width: 44,
              height: 44,
              justifyContent: 'center',
              alignItems: 'center',
            }}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterVisible(true);
            }}
          >
            <Ionicons name="filter" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* Loading State */}
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#64748B" />
            <Text style={{ marginTop: 12, fontSize: 16, color: '#64748B' }}>
              Loading employees...
            </Text>
          </View>
        ) : error ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={{ marginTop: 12, fontSize: 16, color: '#EF4444', fontWeight: '600', textAlign: 'center' }}>
              {error}
            </Text>
            <TouchableOpacity
              style={{
                marginTop: 20,
                paddingVertical: 10,
                paddingHorizontal: 16,
                backgroundColor: '#F3F4F6',
                borderRadius: 8,
                flexDirection: 'row',
                alignItems: 'center',
              }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                // Retry loading
                setLoading(true);
                setError(null);
                // This would trigger the useEffect to re-fetch data
              }}
            >
              <Ionicons name="refresh" size={16} color="#4B5563" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 14, fontWeight: '500', color: '#4B5563' }}>
                Try Again
              </Text>
            </TouchableOpacity>
          </View>
        ) : filteredEmployees.length === 0 ? (
          <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 40,
          }}>
            <MaterialCommunityIcons name="account-group" size={48} color="#D1D5DB" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 16, textAlign: 'center' }}>
              {searchQuery || selectedCategory !== 'all' ? 'No matching employees found' : 'No employees available'}
            </Text>
            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
              {searchQuery || selectedCategory !== 'all'
                ? 'Try a different search term or filter'
                : 'Employees will appear here once they are added to the system'}
            </Text>

            {(searchQuery || selectedCategory !== 'all') && (
              <TouchableOpacity
                style={{
                  marginTop: 20,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  backgroundColor: '#F3F4F6',
                  borderRadius: 8,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchQuery('');
                  setSelectedCategory('all');
                }}
              >
                <Ionicons name="refresh" size={16} color="#4B5563" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '500', color: '#4B5563' }}>
                  Clear Filters
                </Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredEmployees}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ item, index }) => {
              const departmentColor = getRoleColor(item.role);

              return (
                <Animated.View
                  style={{
                    opacity: 1,
                    transform: [{ translateY: 0 }],
                  }}
                >
                  <TouchableOpacity
                    style={{
                      backgroundColor: 'white',
                      borderRadius: 16,
                      padding: 16,
                      shadowColor: '#000',
                      shadowOffset: { width: 0, height: 1 },
                      shadowOpacity: 0.03,
                      shadowRadius: 3,
                      elevation: 1,
                      overflow: 'hidden',
                    }}
                    onPress={() => handleEmployeePress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <View style={{
                          width: 50,
                          height: 50,
                          borderRadius: 25,
                          backgroundColor: `${departmentColor}15`,
                          justifyContent: 'center',
                          alignItems: 'center',
                          marginRight: 12,
                        }}>
                          {item.photo ? (
                            <Image
                              source={{ uri: item.photo }}
                              style={{
                                width: 50,
                                height: 50,
                                borderRadius: 25,
                              }}
                            />
                          ) : (
                            <Text style={{
                              fontSize: 18,
                              fontWeight: 'bold',
                              color: departmentColor,
                            }}>
                              {item.name.split(' ').map(n => n[0]).join('')}
                            </Text>
                          )}
                        </View>

                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: '#1F2937',
                            marginBottom: 2
                          }}>
                            {item.name}
                          </Text>

                          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            {getRoleIcon(item.role)}
                            <Text style={{
                              fontSize: 14,
                              color: '#4B5563',
                              marginLeft: 4,
                            }}>
                              {item.position}
                            </Text>
                          </View>

                        </View>
                      </View>

                      <View style={{
                        backgroundColor: item.status === 'active' ? '#EEF2FF' : '#FEE2E2',
                        paddingHorizontal: 10,
                        paddingVertical: 4,
                        borderRadius: 12,
                        marginLeft: 8,
                      }}>
                        <Text style={{
                          color: item.status === 'active' ? '#4F46E5' : '#DC2626',
                          fontWeight: '600',
                          fontSize: 12
                        }}>
                          {item.status === 'active' ? 'Active' : 'Inactive'}
                        </Text>
                      </View>
                    </View>

                  </TouchableOpacity>
                </Animated.View>
              );
            }}
          />
        )}
      </Animated.View>

      {/* Modals */}
      <EmployeeDetailModal />
      <EditEmployeeModal />
      <FilterModal />
    </SafeAreaView>
  );
}
