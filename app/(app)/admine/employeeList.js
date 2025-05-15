// app/ViewEmployees.js
import React, { useEffect, useState, useRef } from 'react';
import {
    SafeAreaView,
    Text,
    ActivityIndicator,
    FlatList,
    TouchableOpacity,
    Alert,
    Image,
    View,
    Animated,
    TextInput,
    RefreshControl,
    Platform,
    ScrollView,
    Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/HomeHeader';

// Define available roles in one place to ensure consistency across the app
const EMPLOYEE_ROLES = {
    admin: { 
        label: 'Admin',
        color: '#833AB4',
        gradient: ['#833AB4', '#FD1D1D']
    },
    manager: { 
        label: 'Manager',
        color: '#4361EE',
        gradient: ['#4361EE', '#3A0CA3']
    },
    stockManager: { 
        label: 'Stock Manager',
        color: '#48BFE3',
        gradient: ['#48BFE3', '#56CFE1']
    },
    deliveryAgent: { 
        label: 'Delivery Agent',
        color: '#06D6A0',
        gradient: ['#06D6A0', '#2EC4B6']
    },
    customerAssistance: { 
        label: 'Customer Assistance',
        color: '#FFD166',
        gradient: ['#FFD166', '#FFB703']
    },
    default: { 
        label: 'Employee',
        color: '#6C757D',
        gradient: ['#6C757D', '#495057']
    }
};

// Employee Card Component - Now clickable without action buttons
const EmployeeCard = ({ item, index, onPress }) => {
    const animationDelay = index * 100;
    const translateY = useRef(new Animated.Value(50)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 0,
                duration: 500,
                delay: animationDelay,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 1,
                duration: 500,
                delay: animationDelay,
                useNativeDriver: true,
            }),
        ]).start();
    }, []);

    const getRoleColor = (role) => {
        return EMPLOYEE_ROLES[role]?.color || EMPLOYEE_ROLES.default.color;
    };

    const getRandomGradient = (role) => {
        return EMPLOYEE_ROLES[role]?.gradient || EMPLOYEE_ROLES.default.gradient;
    };

    const gradientColors = getRandomGradient(item.role);

    return (
        <TouchableOpacity onPress={() => onPress(item)} activeOpacity={0.7}>
            <Animated.View 
                style={{
                    transform: [{ translateY }],
                    opacity,
                    marginBottom: 15,
                    borderRadius: 16,
                    overflow: 'hidden',
                    backgroundColor: 'white',
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 3,
                    marginHorizontal: 15,
                }}
            >
                <LinearGradient
                    colors={gradientColors}
                    start={[0, 0]}
                    end={[1, 0]}
                    style={{
                        height: 8,
                    }}
                />
                <View style={{ padding: 15 }}>
                    <View style={{ flexDirection: 'row' }}>
                        <View style={{ 
                            width: 60, 
                            height: 60, 
                            borderRadius: 30, 
                            backgroundColor: '#F3F4F6',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 15,
                            borderWidth: 2,
                            borderColor: getRoleColor(item.role),
                        }}>
                            <Text style={{ 
                                fontSize: 20, 
                                fontWeight: 'bold', 
                                color: getRoleColor(item.role),
                            }}>
                                {item.firstName?.charAt(0)}{item.lastName?.charAt(0)}
                            </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                                {item.firstName} {item.lastName}
                            </Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                                <MaterialIcons name="work" size={16} color="#6B7280" />
                                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 5 }}>
                                    {item.role.charAt(0).toUpperCase() + item.role.slice(1).replace(/([A-Z])/g, ' $1')}
                                </Text>
                            </View>
                            <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                marginTop: 2,
                                flexWrap: 'wrap',
                            }}>
                                <Ionicons name="mail-outline" size={16} color="#6B7280" />
                                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 5, flexShrink: 1 }}>
                                    {item.email}
                                </Text>
                            </View>
                        </View>
                        <View style={{ justifyContent: 'center' }}>
                            <AntDesign name="right" size={20} color="#9CA3AF" />
                        </View>
                    </View>
                </View>
            </Animated.View>
        </TouchableOpacity>
    );
};

// Employee Detail Modal Component
const EmployeeDetailModal = ({ visible, employee, onClose, onDelete, onUpdate }) => {
    if (!employee) return null;
    
    const [isEditing, setIsEditing] = useState(false);
    const [editedEmployee, setEditedEmployee] = useState({});
    
    // Initialize editedEmployee when the modal opens or employee changes
    useEffect(() => {
        if (employee) {
            setEditedEmployee({...employee});
        }
    }, [employee]);

    const getRoleColor = (role) => {
        return EMPLOYEE_ROLES[role]?.color || EMPLOYEE_ROLES.default.color;
    };

    const getRandomGradient = (role) => {
        return EMPLOYEE_ROLES[role]?.gradient || EMPLOYEE_ROLES.default.gradient;
    };
    
    const handleInputChange = (field, value) => {
        setEditedEmployee(prev => ({
            ...prev,
            [field]: value
        }));
    };
    
    const handleNestedInputChange = (parent, field, value) => {
        setEditedEmployee(prev => ({
            ...prev,
            [parent]: {
                ...prev[parent],
                [field]: value
            }
        }));
    };
    
    const handleSaveChanges = () => {
        onUpdate(editedEmployee);
        setIsEditing(false);
    };
    
    const handleCancelEdit = () => {
        setEditedEmployee({...employee});
        setIsEditing(false);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
                <View style={{ 
                    backgroundColor: 'white',
                    borderTopLeftRadius: 25,
                    borderTopRightRadius: 25,
                    minHeight: '75%',
                    paddingBottom: 30,
                    marginTop: 80
                }}>
                    <LinearGradient
                        colors={getRandomGradient(employee.role)}
                        start={[0, 0]}
                        end={[1, 0]}
                        style={{
                            height: 12,
                            borderTopLeftRadius: 25,
                            borderTopRightRadius: 25,
                        }}
                    />
                    
                    <View style={{ 
                        paddingTop: 25,
                        paddingBottom: 20,
                        paddingHorizontal: 20,
                        alignItems: 'center',
                        borderBottomWidth: 1,
                        borderBottomColor: '#F3F4F6',
                        position: 'relative'
                    }}>
                        <TouchableOpacity 
                            style={{ 
                                position: 'absolute', 
                                right: 20, 
                                top: 25,
                                zIndex: 10
                            }}
                            onPress={isEditing ? handleCancelEdit : onClose}
                        >
                            <AntDesign name={isEditing ? "close" : "close"} size={24} color="#6B7280" />
                        </TouchableOpacity>
                        
                        <View style={{ 
                            width: 100, 
                            height: 100, 
                            borderRadius: 50, 
                            backgroundColor: '#F3F4F6',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginBottom: 15,
                            borderWidth: 3,
                            borderColor: getRoleColor(employee.role),
                        }}>
                            <Text style={{ 
                                fontSize: 36, 
                                fontWeight: 'bold', 
                                color: getRoleColor(employee.role),
                            }}>
                                {editedEmployee.firstName?.charAt(0)}{editedEmployee.lastName?.charAt(0)}
                            </Text>
                        </View>
                        
                        {isEditing ? (
                            <View style={{ width: '100%', flexDirection: 'row' }}>
                                <TextInput 
                                    value={editedEmployee.firstName || ''}
                                    onChangeText={(value) => handleInputChange('firstName', value)}
                                    style={{ 
                                        fontSize: 18, 
                                        fontWeight: '500', 
                                        color: '#111827',
                                        borderWidth: 1,
                                        borderColor: '#D1D5DB',
                                        borderRadius: 8,
                                        padding: 8,
                                        flex: 1,
                                        marginRight: 5
                                    }}
                                    placeholder="First Name"
                                />
                                <TextInput 
                                    value={editedEmployee.lastName || ''}
                                    onChangeText={(value) => handleInputChange('lastName', value)}
                                    style={{ 
                                        fontSize: 18, 
                                        fontWeight: '500', 
                                        color: '#111827',
                                        borderWidth: 1,
                                        borderColor: '#D1D5DB',
                                        borderRadius: 8,
                                        padding: 8,
                                        flex: 1,
                                        marginLeft: 5
                                    }}
                                    placeholder="Last Name"
                                />
                            </View>
                        ) : (
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                                {employee.firstName} {employee.lastName}
                            </Text>
                        )}
                        
                        <View style={{ 
                            paddingHorizontal: 12,
                            paddingVertical: 6, 
                            backgroundColor: '#F3F4F6', 
                            borderRadius: 20,
                            marginTop: 8
                        }}>
                            <Text style={{ 
                                color: getRoleColor(employee.role),
                                fontWeight: '600'
                            }}>
                                {employee.role.charAt(0).toUpperCase() + employee.role.slice(1).replace(/([A-Z])/g, ' $1')}
                            </Text>
                        </View>
                    </View>
                    
                    <ScrollView style={{ padding: 20 }}>
                        <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 15 }}>
                            Personal Information
                        </Text>
                        
                        <View style={{ marginBottom: 20 }}>
                            {isEditing ? (
                                <>
                                    <EditableItem 
                                        icon="mail" 
                                        label="Email" 
                                        value={editedEmployee.email} 
                                        onChangeText={(value) => handleInputChange('email', value)}
                                        keyboardType="email-address"
                                    />
                                    <EditableItem 
                                        icon="call" 
                                        label="Phone" 
                                        value={editedEmployee.phone} 
                                        onChangeText={(value) => handleInputChange('phone', value)}
                                        keyboardType="phone-pad"
                                    />
                                    <EditableItem 
                                        icon="home" 
                                        label="Address" 
                                        value={editedEmployee.address} 
                                        onChangeText={(value) => handleInputChange('address', value)}
                                    />
                                    <EditableItem 
                                        icon="calendar" 
                                        label="Date of Birth" 
                                        value={editedEmployee.dateOfBirth} 
                                        onChangeText={(value) => handleInputChange('dateOfBirth', value)}
                                    />
                                    <EditableItem 
                                        icon="person" 
                                        label="Gender" 
                                        value={editedEmployee.gender} 
                                        onChangeText={(value) => handleInputChange('gender', value)}
                                    />
                                    <EditableItem 
                                        icon="document-text" 
                                        label="National ID" 
                                        value={editedEmployee.nationalId} 
                                        onChangeText={(value) => handleInputChange('nationalId', value)}
                                    />
                                </>
                            ) : (
                                <>
                                    <DetailItem icon="mail" label="Email" value={employee.email} />
                                    <DetailItem icon="call" label="Phone" value={employee.phone} />
                                    <DetailItem icon="home" label="Address" value={employee.address} />
                                    <DetailItem icon="calendar" label="Date of Birth" value={employee.dateOfBirth} />
                                    <DetailItem icon="person" label="Gender" value={employee.gender} />
                                    <DetailItem icon="document-text" label="National ID" value={employee.nationalId} />
                                </>
                            )}
                        </View>
                        
                        {(employee.emergencyContact || isEditing) && (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 15, marginTop: 10 }}>
                                    Emergency Contact
                                </Text>
                                
                                <View style={{ marginBottom: 20 }}>
                                    {isEditing ? (
                                        <>
                                            <EditableItem 
                                                icon="person" 
                                                label="Name" 
                                                value={editedEmployee.emergencyContact?.name || ''} 
                                                onChangeText={(value) => handleNestedInputChange('emergencyContact', 'name', value)}
                                            />
                                            <EditableItem 
                                                icon="call" 
                                                label="Phone" 
                                                value={editedEmployee.emergencyContact?.phone || ''} 
                                                onChangeText={(value) => handleNestedInputChange('emergencyContact', 'phone', value)}
                                                keyboardType="phone-pad"
                                            />
                                            <EditableItem 
                                                icon="people" 
                                                label="Relationship" 
                                                value={editedEmployee.emergencyContact?.relationship || ''} 
                                                onChangeText={(value) => handleNestedInputChange('emergencyContact', 'relationship', value)}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <DetailItem icon="person" label="Name" value={employee.emergencyContact?.name} />
                                            <DetailItem icon="call" label="Phone" value={employee.emergencyContact?.phone} />
                                            <DetailItem icon="people" label="Relationship" value={employee.emergencyContact?.relationship} />
                                        </>
                                    )}
                                </View>
                            </>
                        )}
                        
                        {(employee.employmentDetails || isEditing) && (
                            <>
                                <Text style={{ fontSize: 18, fontWeight: '600', color: '#374151', marginBottom: 15, marginTop: 10 }}>
                                    Employment Details
                                </Text>
                                
                                <View style={{ marginBottom: 10 }}>
                                    {isEditing ? (
                                        <>
                                            <EditableItem 
                                                icon="business" 
                                                label="Department" 
                                                value={editedEmployee.employmentDetails?.department || ''} 
                                                onChangeText={(value) => handleNestedInputChange('employmentDetails', 'department', value)}
                                            />
                                            <EditableItem 
                                                icon="briefcase" 
                                                label="Position" 
                                                value={editedEmployee.employmentDetails?.position || ''} 
                                                onChangeText={(value) => handleNestedInputChange('employmentDetails', 'position', value)}
                                            />
                                            <EditableItem 
                                                icon="calendar" 
                                                label="Joining Date" 
                                                value={editedEmployee.employmentDetails?.joiningDate || ''} 
                                                onChangeText={(value) => handleNestedInputChange('employmentDetails', 'joiningDate', value)}
                                            />
                                            <EditableItem 
                                                icon="cash" 
                                                label="Salary" 
                                                value={editedEmployee.employmentDetails?.salary || ''} 
                                                onChangeText={(value) => handleNestedInputChange('employmentDetails', 'salary', value)}
                                                keyboardType="decimal-pad"
                                            />
                                            <EditableItem 
                                                icon="card" 
                                                label="Bank Account" 
                                                value={editedEmployee.employmentDetails?.bankAccount || ''} 
                                                onChangeText={(value) => handleNestedInputChange('employmentDetails', 'bankAccount', value)}
                                            />
                                        </>
                                    ) : (
                                        <>
                                            <DetailItem icon="business" label="Department" value={employee.employmentDetails?.department} />
                                            <DetailItem icon="briefcase" label="Position" value={employee.employmentDetails?.position} />
                                            <DetailItem icon="calendar" label="Joining Date" value={employee.employmentDetails?.joiningDate} />
                                            <DetailItem icon="cash" label="Salary" value={employee.employmentDetails?.salary} />
                                            <DetailItem icon="card" label="Bank Account" value={employee.employmentDetails?.bankAccount} />
                                        </>
                                    )}
                                </View>
                            </>
                        )}
                    </ScrollView>
                    
                    <View style={{ 
                        flexDirection: 'row', 
                        justifyContent: 'space-between',
                        padding: 20,
                        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
                        borderTopWidth: 1,
                        borderTopColor: '#F3F4F6'
                    }}>
                        {isEditing ? (
                            <>
                                <TouchableOpacity 
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#6B7280',
                                        padding: 15,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        marginRight: 10
                                    }}
                                    onPress={handleCancelEdit}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#10B981',
                                        padding: 15,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        marginLeft: 10
                                    }}
                                    onPress={handleSaveChanges}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Save</Text>
                                </TouchableOpacity>
                            </>
                        ) : (
                            <>
                                <TouchableOpacity 
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#EF4444',
                                        padding: 15,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        marginRight: 10
                                    }}
                                    onPress={() => onDelete(employee.id)}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Delete</Text>
                                </TouchableOpacity>
                                
                                <TouchableOpacity 
                                    style={{
                                        flex: 1,
                                        backgroundColor: '#4F46E5',
                                        padding: 15,
                                        borderRadius: 10,
                                        alignItems: 'center',
                                        marginLeft: 10
                                    }}
                                    onPress={() => setIsEditing(true)}
                                >
                                    <Text style={{ color: 'white', fontWeight: '600', fontSize: 16 }}>Edit</Text>
                                </TouchableOpacity>
                            </>
                        )}
                    </View>
                </View>
            </View>
        </Modal>
    );
};

// Detail Item Component for Employee Detail Modal
const DetailItem = ({ icon, label, value }) => {
    if (!value) return null;
    
    return (
        <View style={{ 
            flexDirection: 'row', 
            marginBottom: 12,
            alignItems: 'center'
        }}>
            <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
            }}>
                <Ionicons name={icon} size={20} color="#6B7280" />
            </View>
            <View>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
                <Text style={{ fontSize: 16, color: '#111827', fontWeight: '500' }}>{value}</Text>
            </View>
        </View>
    );
};

// Editable Item Component for Employee Detail Modal
const EditableItem = ({ icon, label, value, onChangeText, keyboardType = 'default' }) => {
    return (
        <View style={{ 
            flexDirection: 'row', 
            marginBottom: 12,
            alignItems: 'center'
        }}>
            <View style={{ 
                width: 40, 
                height: 40, 
                borderRadius: 20, 
                backgroundColor: '#F3F4F6',
                justifyContent: 'center',
                alignItems: 'center',
                marginRight: 12
            }}>
                <Ionicons name={icon} size={20} color="#6B7280" />
            </View>
            <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, color: '#6B7280' }}>{label}</Text>
                <TextInput
                    value={value}
                    onChangeText={onChangeText}
                    style={{ 
                        fontSize: 16, 
                        color: '#111827', 
                        fontWeight: '500',
                        borderBottomWidth: 1,
                        borderBottomColor: '#D1D5DB',
                        paddingVertical: 4
                    }}
                    keyboardType={keyboardType}
                />
            </View>
        </View>
    );
};

export default function EmployeeList() {
    const [employees, setEmployees] = useState([]);
    const [filteredEmployees, setFilteredEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRole, setSelectedRole] = useState('All');
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [roleModalVisible, setRoleModalVisible] = useState(false);
    const router = useRouter();
    
    const scrollY = useRef(new Animated.Value(0)).current;
    const headerHeight = scrollY.interpolate({
        inputRange: [0, 100],
        outputRange: [240, 120], // Increased height for dropdown
        extrapolate: 'clamp'
    });

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            // Query users collection for employees (users that are not customers)
            const q = query(collection(db, "users"), where("role", "!=", "customer"));
            const querySnapshot = await getDocs(q);

            const employeeList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setEmployees(employeeList);
            setFilteredEmployees(employeeList);
        } catch (err) {
            console.error('Error fetching employee data:', err);
            setError('Error fetching employee data: ' + err.message);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    useEffect(() => {
        // Filter employees based on search query and selected role
        let results = employees;
        
        if (searchQuery) {
            const lowercasedQuery = searchQuery.toLowerCase();
            results = results.filter(employee => 
                (employee.firstName?.toLowerCase().includes(lowercasedQuery) ||
                employee.lastName?.toLowerCase().includes(lowercasedQuery) ||
                employee.email?.toLowerCase().includes(lowercasedQuery) ||
                employee.phone?.includes(searchQuery))
            );
        }
        
        if (selectedRole !== 'All') {
            results = results.filter(employee => employee.role === selectedRole);
        }
        
        setFilteredEmployees(results);
    }, [searchQuery, selectedRole, employees]);

    const handleDelete = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(
            'Delete Employee',
            'Are you sure you want to delete this employee?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, "users", id));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            Alert.alert('Success', 'Employee deleted successfully');
                            setEmployees(employees.filter((employee) => employee.id !== id));
                            setModalVisible(false);
                        } catch (err) {
                            console.error('Error deleting employee:', err);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert('Error', 'Failed to delete employee');
                        }
                    },
                },
            ]
        );
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchEmployees();
    };

    const handleRoleFilter = (role) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedRole(role);
        setRoleModalVisible(false);
    };

    const handleAddEmployee = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push('/admine/addEmployee');
    };
    
    const handleEmployeePress = (employee) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedEmployee(employee);
        setModalVisible(true);
    };
    
    const handleUpdate = async (updatedEmployee) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            // Update user document in Firestore
            await updateDoc(doc(db, "users", updatedEmployee.id), updatedEmployee);
            
            // Update local state
            setEmployees(employees.map(emp => 
                emp.id === updatedEmployee.id ? updatedEmployee : emp
            ));
            
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Employee updated successfully');
            setModalVisible(false);
        } catch (err) {
            console.error('Error updating employee:', err);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'Failed to update employee: ' + err.message);
        }
    };

    const renderHeader = () => (
        <View style={{ backgroundColor: '#F9FAFB' }}>
            <HomeHeader title="Employees" />
            
            <View style={{ 
                padding: 15,
                paddingTop: 5,
                backgroundColor: '#F9FAFB',
                marginBottom: 10
            }}>
                <View style={{
                    backgroundColor: 'white',
                    borderRadius: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    marginBottom: 15,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                }}>
                    <Ionicons name="search" size={22} color="#4F46E5" />
                    <TextInput
                        placeholder="Search employees..."
                        placeholderTextColor="#9CA3AF"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        style={{
                            flex: 1,
                            marginLeft: 10,
                            fontSize: 16,
                            color: '#1F2937',
                        }}
                    />
                    {searchQuery ? (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <Ionicons name="close-circle" size={22} color="#6B7280" />
                        </TouchableOpacity>
                    ) : null}
                </View>
                
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    {/* Role Selector Button */}
                    <TouchableOpacity 
                        style={{
                            backgroundColor: 'white',
                            borderRadius: 12,
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 15,
                            paddingVertical: 12,
                            elevation: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                            flex: 1,
                            marginRight: 10
                        }}
                        onPress={() => setRoleModalVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <MaterialIcons name="work" size={22} color="#4F46E5" />
                            <Text style={{ marginLeft: 10, fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                {selectedRole === 'All' ? 'All Roles' : EMPLOYEE_ROLES[selectedRole]?.label}
                            </Text>
                        </View>
                        <Feather name="chevron-down" size={22} color="#6B7280" />
                    </TouchableOpacity>
                    
                    {/* Add Employee Button */}
                    <TouchableOpacity 
                        onPress={handleAddEmployee} 
                        style={{
                            backgroundColor: '#4F46E5',
                            width: 48,
                            height: 48,
                            borderRadius: 12,
                            justifyContent: 'center',
                            alignItems: 'center',
                            elevation: 3,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.2,
                            shadowRadius: 3,
                        }}
                    >
                        <Ionicons name="add" size={28} color="white" />
                    </TouchableOpacity>
                </View>
                
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 10 }}>
                    {filteredEmployees.length} employee{filteredEmployees.length !== 1 ? 's' : ''} found
                </Text>
            </View>
        </View>
    );

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <StatusBar style="light" />
                {renderHeader()}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{ marginTop: 10, color: '#4B5563', fontSize: 16 }}>
                        Loading employees...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" />
            <FlatList
                data={filteredEmployees}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <EmployeeCard 
                        item={item} 
                        index={index} 
                        onPress={handleEmployeePress}
                    />
                )}
                contentContainerStyle={{ 
                    paddingBottom: 20,
                    marginHorizontal: 5
                }}
                ListHeaderComponent={renderHeader}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        colors={['#4F46E5']}
                        tintColor="#4F46E5"
                    />
                }
                ListEmptyComponent={
                    <View style={{ 
                        padding: 20, 
                        alignItems: 'center', 
                        marginTop: 50 
                    }}>
                        <FontAwesome5 name="users-slash" size={80} color="#D1D5DB" />
                        <Text style={{ 
                            fontSize: 18, 
                            fontWeight: 'bold', 
                            color: '#4B5563',
                            marginTop: 15 
                        }}>
                            No employees found
                        </Text>
                        <Text style={{ 
                            textAlign: 'center', 
                            color: '#6B7280',
                            marginTop: 5 
                        }}>
                            {searchQuery || selectedRole !== 'All' ? 
                                'Try adjusting your filters or search query' : 
                                'Add employees to get started'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleAddEmployee}
                            style={{
                                marginTop: 20,
                                backgroundColor: '#4F46E5',
                                paddingHorizontal: 20,
                                paddingVertical: 12,
                                borderRadius: 10,
                                flexDirection: 'row',
                                alignItems: 'center',
                            }}
                        >
                            <Ionicons name="add" size={20} color="white" />
                            <Text style={{ color: 'white', marginLeft: 8, fontWeight: '600' }}>
                                Add Employee
                            </Text>
                        </TouchableOpacity>
                    </View>
                }
            />
            
            {/* Employee Detail Modal */}
            <EmployeeDetailModal 
                visible={modalVisible}
                employee={selectedEmployee}
                onClose={() => setModalVisible(false)}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
            />
            
            {/* Role Selection Modal */}
            <Modal
                visible={roleModalVisible}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setRoleModalVisible(false)}
            >
                <View style={{ 
                    flex: 1, 
                    backgroundColor: 'rgba(0,0,0,0.5)', 
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 20
                }}>
                    <View style={{ 
                        backgroundColor: 'white', 
                        borderRadius: 16,
                        width: '90%',
                        maxHeight: '80%',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 5 },
                        shadowOpacity: 0.3,
                        shadowRadius: 10,
                        elevation: 10
                    }}>
                        <View style={{ 
                            flexDirection: 'row', 
                            justifyContent: 'space-between', 
                            alignItems: 'center',
                            borderBottomWidth: 1,
                            borderBottomColor: '#E5E7EB',
                            padding: 15
                        }}>
                            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                                Select Role
                            </Text>
                            <TouchableOpacity onPress={() => setRoleModalVisible(false)}>
                                <AntDesign name="close" size={22} color="#6B7280" />
                            </TouchableOpacity>
                        </View>
                        
                        <ScrollView style={{ maxHeight: '80%' }}>
                            {/* All Roles Option */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: selectedRole === 'All' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('All');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <MaterialIcons name="people" size={24} color="#4F46E5" />
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'All' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        All Roles
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        View employees with any role
                                    </Text>
                                </View>
                                {selectedRole === 'All' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Admin Role */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: selectedRole === 'admin' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('admin');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: EMPLOYEE_ROLES.admin.color,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MaterialIcons name="person" size={18} color="white" />
                                </View>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'admin' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        {EMPLOYEE_ROLES.admin.label}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        Super-users with full system access
                                    </Text>
                                </View>
                                {selectedRole === 'admin' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Manager Role */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: selectedRole === 'manager' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('manager');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: EMPLOYEE_ROLES.manager.color,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MaterialIcons name="person" size={18} color="white" />
                                </View>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'manager' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        {EMPLOYEE_ROLES.manager.label}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        Oversee store operations
                                    </Text>
                                </View>
                                {selectedRole === 'manager' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Stock Manager Role */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: selectedRole === 'stockManager' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('stockManager');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: EMPLOYEE_ROLES.stockManager.color,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MaterialIcons name="inventory" size={18} color="white" />
                                </View>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'stockManager' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        {EMPLOYEE_ROLES.stockManager.label}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        Manage inventory and supplies
                                    </Text>
                                </View>
                                {selectedRole === 'stockManager' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Delivery Agent Role */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#F3F4F6',
                                    backgroundColor: selectedRole === 'deliveryAgent' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('deliveryAgent');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: EMPLOYEE_ROLES.deliveryAgent.color,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MaterialIcons name="delivery-dining" size={18} color="white" />
                                </View>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'deliveryAgent' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        {EMPLOYEE_ROLES.deliveryAgent.label}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        Handle order deliveries
                                    </Text>
                                </View>
                                {selectedRole === 'deliveryAgent' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                            
                            {/* Customer Assistance Role */}
                            <TouchableOpacity
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    padding: 15,
                                    backgroundColor: selectedRole === 'customerAssistance' ? '#F3F4F6' : 'transparent'
                                }}
                                onPress={() => {
                                    handleRoleFilter('customerAssistance');
                                    setRoleModalVisible(false);
                                }}
                            >
                                <View style={{
                                    width: 30,
                                    height: 30,
                                    borderRadius: 15,
                                    backgroundColor: EMPLOYEE_ROLES.customerAssistance.color,
                                    justifyContent: 'center',
                                    alignItems: 'center'
                                }}>
                                    <MaterialIcons name="support-agent" size={18} color="white" />
                                </View>
                                <View style={{ marginLeft: 15 }}>
                                    <Text style={{ 
                                        fontSize: 16, 
                                        fontWeight: selectedRole === 'customerAssistance' ? 'bold' : 'normal',
                                        color: '#1F2937' 
                                    }}>
                                        {EMPLOYEE_ROLES.customerAssistance.label}
                                    </Text>
                                    <Text style={{ fontSize: 12, color: '#6B7280' }}>
                                        Provide customer support
                                    </Text>
                                </View>
                                {selectedRole === 'customerAssistance' && (
                                    <View style={{ marginLeft: 'auto' }}>
                                        <Ionicons name="checkmark-circle" size={24} color="#4F46E5" />
                                    </View>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}