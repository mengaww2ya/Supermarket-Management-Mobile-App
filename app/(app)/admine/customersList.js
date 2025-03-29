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
    Modal,
    ScrollView
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { db } from '../../../firebase/firebaseConfig';
import { collection, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/HomeHeader';

const CustomerList = () => {
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        fetchCustomers();
    }, []);

    useEffect(() => {
        if (customers.length > 0) {
            handleSearch(searchQuery);
        }
    }, [customers, searchQuery]);

        const fetchCustomers = async () => {
            try {
            setLoading(true);
            // Query users collection for customers
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("role", "==", "customer"));
            const querySnapshot = await getDocs(q);
            
            const customersList = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
            
            setCustomers(customersList);
            setFilteredCustomers(customersList);
            } catch (err) {
            console.error('Error fetching customers:', err);
            setError('Failed to fetch customers. Please try again.');
            } finally {
                setLoading(false);
            setRefreshing(false);
            }
        };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchCustomers();
    };

    const handleSearch = (text) => {
        setSearchQuery(text);
        
        if (!text.trim()) {
            setFilteredCustomers(customers);
            return;
        }
        
        const filtered = customers.filter(customer => {
            const fullName = `${customer.firstName || ''} ${customer.lastName || ''}`.toLowerCase();
            const email = (customer.email || '').toLowerCase();
            const phone = (customer.phone || '').toLowerCase();
            const searchLower = text.toLowerCase();
            
            return (
                fullName.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchLower)
            );
        });
        
        setFilteredCustomers(filtered);
    };

    const handleDelete = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        Alert.alert(
            'Delete Customer',
            'Are you sure you want to delete this customer? This action cannot be undone.',
            [
                { 
                    text: 'Cancel',
                    style: 'cancel'
                },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await deleteDoc(doc(db, 'users', id));
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            
                            // Update state to remove the deleted customer
                            setCustomers(prev => prev.filter(customer => customer.id !== id));
                            
                            if (modalVisible) {
                                setModalVisible(false);
                            }
                            
                            Alert.alert('Success', 'Customer deleted successfully');
                        } catch (err) {
                            console.error('Error deleting customer:', err);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert('Error', 'Failed to delete customer. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleCustomerPress = (customer) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCustomer(customer);
        setModalVisible(true);
    };
    
    const renderHeader = () => (
        <View style={{ backgroundColor: '#F9FAFB' }}>
            <HomeHeader title="Customers" />
            
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
                    marginBottom: 10,
                    elevation: 3,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 3,
                }}>
                    <Ionicons name="search" size={22} color="#4F46E5" />
                    <TextInput
                        placeholder="Search customers..."
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
                
                <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 5 }}>
                    {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
                </Text>
            </View>
        </View>
    );
    
    // Customer Card Component
    const CustomerCard = ({ item, index }) => {
        const scaleAnim = useRef(new Animated.Value(0.95)).current;
        const opacityAnim = useRef(new Animated.Value(0)).current;
        
        useEffect(() => {
            Animated.parallel([
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                    delay: index * 50 // Reduced delay between cards
                }),
                Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 250,
                    useNativeDriver: true,
                    delay: index * 50 // Matching delay
                })
            ]).start();
        }, []);
        
        const getInitials = () => {
            const firstName = item.firstName || '';
            const lastName = item.lastName || '';
            return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
        };
        
        const cardStyle = {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
        };
        
        return (
            <Animated.View style={cardStyle}>
                <TouchableOpacity
                    style={{
                        backgroundColor: 'white',
                        borderRadius: 16,
                        marginHorizontal: 10,
                        marginBottom: 15,
                        padding: 16,
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                    }}
                    activeOpacity={0.7}
                    onPress={() => handleCustomerPress(item)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {item.profileUrl ? (
                            <Image
                                source={{ uri: item.profileUrl }}
                                style={{
                                    width: 60,
                                    height: 60,
                                    borderRadius: 30,
                                    backgroundColor: '#E5E7EB',
                                }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={{
                                width: 60,
                                height: 60,
                                borderRadius: 30,
                                backgroundColor: '#EEF2FF',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderWidth: 2,
                                borderColor: '#4F46E5',
                            }}>
                                <Text style={{
                                    fontSize: 22,
                                    fontWeight: 'bold',
                                    color: '#4F46E5',
                                }}>
                                    {getInitials()}
                                </Text>
                            </View>
                        )}
                        
                        <View style={{ marginLeft: 14, flex: 1 }}>
                            <Text style={{
                                fontSize: 18,
                                fontWeight: 'bold',
                                color: '#1F2937',
                                marginBottom: 2,
                            }}>
                                {item.firstName} {item.lastName}
                            </Text>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                <Ionicons name="mail-outline" size={14} color="#6B7280" />
                                <Text style={{
                                    fontSize: 14,
                                    color: '#4B5563',
                                    marginLeft: 4,
                                }}>
                                    {item.email}
                                </Text>
                            </View>
                            
                            {item.phone && (
                                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                    <Ionicons name="call-outline" size={14} color="#6B7280" />
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#4B5563',
                                        marginLeft: 4,
                                    }}>
                                        {item.phone}
                                    </Text>
                                </View>
                            )}
                        </View>
                        
                        <View style={{
                            backgroundColor: '#EEF2FF',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginLeft: 8,
                        }}>
                            <Text style={{ color: '#4F46E5', fontWeight: '600', fontSize: 12 }}>
                                Customer
                            </Text>
                        </View>
                    </View>
                    
                    <View style={{
                        height: 1,
                        backgroundColor: '#E5E7EB',
                        marginVertical: 12,
                    }} />
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#F3F4F6',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                            }}
                            onPress={() => handleCustomerPress(item)}
                        >
                            <Feather name="eye" size={16} color="#4B5563" />
                            <Text style={{ color: '#4B5563', marginLeft: 5, fontWeight: '500' }}>
                                Details
                            </Text>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: '#FEE2E2',
                                paddingHorizontal: 12,
                                paddingVertical: 8,
                                borderRadius: 8,
                            }}
                            onPress={() => handleDelete(item.id)}
                        >
                            <Feather name="trash-2" size={16} color="#DC2626" />
                            <Text style={{ color: '#DC2626', marginLeft: 5, fontWeight: '500' }}>
                                Delete
                            </Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Animated.View>
        );
    };
    
    // Customer Detail Modal Component
    const CustomerDetailModal = ({ visible, customer, onClose, onDelete }) => {
        if (!customer) return null;

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
                            colors={['#4F46E5', '#6366F1']}
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
                                onPress={onClose}
                            >
                                <AntDesign name="close" size={24} color="#6B7280" />
                            </TouchableOpacity>
                            
                            {customer.profileUrl ? (
                                <Image
                                    source={{ uri: customer.profileUrl }}
                                    style={{
                                        width: 100,
                                        height: 100,
                                        borderRadius: 50,
                                        marginBottom: 15,
                                        borderWidth: 3,
                                        borderColor: '#4F46E5',
                                    }}
                                />
                            ) : (
                                <View style={{ 
                                    width: 100, 
                                    height: 100, 
                                    borderRadius: 50, 
                                    backgroundColor: '#EEF2FF',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    marginBottom: 15,
                                    borderWidth: 3,
                                    borderColor: '#4F46E5',
                                }}>
                                    <Text style={{ 
                                        fontSize: 36, 
                                        fontWeight: 'bold', 
                                        color: '#4F46E5',
                                    }}>
                                        {customer.firstName?.charAt(0)}{customer.lastName?.charAt(0)}
                                    </Text>
                                </View>
                            )}
                            
                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                                {customer.firstName} {customer.lastName}
                            </Text>
                            
                            <View style={{ 
                                flexDirection: 'row', 
                                alignItems: 'center', 
                                marginTop: 5,
                                backgroundColor: '#EEF2FF',
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 20,
                            }}>
                                <MaterialIcons name="person" size={16} color="#4F46E5" />
                                <Text style={{ 
                                    marginLeft: 5, 
                                    color: '#4F46E5', 
                                    fontWeight: '600' 
                                }}>
                                    Customer
                                </Text>
                            </View>
                        </View>
                        
                        <ScrollView style={{ padding: 20 }}>
                            {/* Contact Information */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ 
                                    fontSize: 18, 
                                    fontWeight: 'bold', 
                                    color: '#111827',
                                    marginBottom: 15 
                                }}>
                                    Contact Information
                                </Text>
                                
                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="email" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Email</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {customer.email || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="phone" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Phone</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {customer.phone || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>
                                    
                                    <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                                        <View style={{ width: 36, alignItems: 'center', marginTop: 2 }}>
                                            <MaterialIcons name="location-on" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10, flex: 1 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Address</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {customer.address || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Additional Info */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{ 
                                    fontSize: 18, 
                                    fontWeight: 'bold', 
                                    color: '#111827',
                                    marginBottom: 15 
                                }}>
                                    Additional Information
                                </Text>
                                
                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    {customer.gender && (
                                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                            <View style={{ width: 36, alignItems: 'center' }}>
                                                <MaterialCommunityIcons 
                                                    name={customer.gender === 'male' ? 'gender-male' : 'gender-female'} 
                                                    size={20} 
                                                    color="#4F46E5" 
                                                />
                                            </View>
                                            <View style={{ marginLeft: 10 }}>
                                                <Text style={{ fontSize: 14, color: '#6B7280' }}>Gender</Text>
                                                <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500', textTransform: 'capitalize' }}>
                                                    {customer.gender}
                                                </Text>
                                            </View>
                                        </View>
                                    )}
                                    
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="date-range" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Member Since</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {customer.createdAt ? new Date(customer.createdAt.toDate()).toLocaleDateString() : 'Unknown'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                            
                            {/* Actions */}
                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                                <TouchableOpacity
                                    style={{
                                        backgroundColor: '#FEE2E2',
                                        paddingVertical: 12,
                                        paddingHorizontal: 20,
                                        borderRadius: 12,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        flex: 1
                                    }}
                                    onPress={() => {
                                        onClose();
                                        handleDelete(customer.id);
                                    }}
                                >
                                    <Feather name="trash-2" size={20} color="#DC2626" />
                                    <Text style={{ 
                                        color: '#DC2626', 
                                        fontWeight: 'bold', 
                                        fontSize: 16, 
                                        marginLeft: 8 
                                    }}>
                                        Delete Customer
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>
        );
    };

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
                <StatusBar style="light" />
                {renderHeader()}
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color="#4F46E5" />
                    <Text style={{ marginTop: 10, color: '#4B5563', fontSize: 16 }}>
                        Loading customers...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" />
            <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <CustomerCard item={item} index={index} />
                )}
                contentContainerStyle={{ 
                    paddingBottom: 20,
                    paddingTop: 10
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
                            No customers found
                        </Text>
                        <Text style={{ 
                            textAlign: 'center', 
                            color: '#6B7280',
                            marginTop: 5 
                        }}>
                            {searchQuery ? 'Try adjusting your search query' : 'Add customers to get started'}
                        </Text>
                    </View>
                }
            />
            
            <CustomerDetailModal 
                visible={modalVisible}
                customer={selectedCustomer}
                onClose={() => setModalVisible(false)}
                onDelete={handleDelete}
            />
        </SafeAreaView>
    );
};

export default CustomerList;