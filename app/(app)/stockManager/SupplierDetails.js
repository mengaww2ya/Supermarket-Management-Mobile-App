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

const SupplierDetails = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSupplier, setSelectedSupplier] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const router = useRouter();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    useEffect(() => {
        if (suppliers.length > 0) {
            handleSearch(searchQuery);
        }
    }, [suppliers, searchQuery]);

    const fetchSuppliers = async () => {
        try {
            setLoading(true);
            // Query users collection for suppliers
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where("role", "==", "supplier"));
            const querySnapshot = await getDocs(q);

            const suppliersList = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setSuppliers(suppliersList);
            setFilteredSuppliers(suppliersList);
        } catch (err) {
            console.error('Error fetching suppliers:', err);
            setError('Failed to fetch suppliers. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleRefresh = () => {
        setRefreshing(true);
        fetchSuppliers();
    };

    const handleSearch = (text) => {
        setSearchQuery(text);

        if (!text.trim()) {
            setFilteredSuppliers(suppliers);
            return;
        }

        const filtered = suppliers.filter(supplier => {
            const companyName = (supplier.companyName || '').toLowerCase();
            const contactPerson = (supplier.contactPerson || '').toLowerCase();
            const email = (supplier.email || '').toLowerCase();
            const phone = (supplier.phone || '').toLowerCase();
            const searchLower = text.toLowerCase();

            return (
                companyName.includes(searchLower) ||
                contactPerson.includes(searchLower) ||
                email.includes(searchLower) ||
                phone.includes(searchLower)
            );
        });

        setFilteredSuppliers(filtered);
    };

    const handleDelete = async (id) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        Alert.alert(
            'Delete Supplier',
            'Are you sure you want to delete this supplier? This action cannot be undone.',
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

                            // Update state to remove the deleted supplier
                            setSuppliers(prev => prev.filter(supplier => supplier.id !== id));

                            if (modalVisible) {
                                setModalVisible(false);
                            }

                            Alert.alert('Success', 'Supplier deleted successfully');
                        } catch (err) {
                            console.error('Error deleting supplier:', err);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                            Alert.alert('Error', 'Failed to delete supplier. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    const handleSupplierPress = (supplier) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedSupplier(supplier);
        setModalVisible(true);
    };

    const renderHeader = () => (
        <View style={{ backgroundColor: '#F9FAFB' }}>
            <HomeHeader title="Suppliers" />

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
                        placeholder="Search suppliers..."
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
                    {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
                </Text>
            </View>
        </View>
    );

    // Supplier Card Component
    const SupplierCard = ({ item, index }) => {
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
            const companyName = item.companyName || '';
            if (companyName.length > 0) {
                return companyName.charAt(0).toUpperCase();
            }
            const contactPerson = item.contactPerson || '';
            if (contactPerson.length > 0) {
                const names = contactPerson.split(' ');
                if (names.length > 1) {
                    return `${names[0].charAt(0)}${names[1].charAt(0)}`.toUpperCase();
                }
                return contactPerson.charAt(0).toUpperCase();
            }
            return 'S';
        };

        const cardStyle = {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
        };

        // Check if supplier is active
        const isActive = item.active !== undefined ? item.active : true;

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
                    onPress={() => handleSupplierPress(item)}
                >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {item.photoURL ? (
                            <Image
                                source={{ uri: item.photoURL }}
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
                                {item.companyName || 'Unnamed Supplier'}
                            </Text>

                            {item.contactPerson && (
                                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                                    <Text style={{
                                        fontSize: 14,
                                        color: '#4B5563',
                                        marginLeft: 4,
                                    }}>
                                        {item.contactPerson}
                                    </Text>
                                </View>
                            )}

                            {item.email && (
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
                            )}

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
                            backgroundColor: isActive ? '#EEF2FF' : '#FEE2E2',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: 12,
                            marginLeft: 8,
                        }}>
                            <Text style={{
                                color: isActive ? '#4F46E5' : '#DC2626',
                                fontWeight: '600',
                                fontSize: 12
                            }}>
                                {isActive ? 'Active' : 'Inactive'}
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
                            onPress={() => handleSupplierPress(item)}
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

    // Supplier Detail Modal Component
    const SupplierDetailModal = ({ visible, supplier, onClose, onDelete }) => {
        if (!supplier) return null;

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

                            {supplier.photoURL ? (
                                <Image
                                    source={{ uri: supplier.photoURL }}
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
                                    <MaterialCommunityIcons name="domain" size={40} color="#4F46E5" />
                                </View>
                            )}

                            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827' }}>
                                {supplier.companyName || 'Unnamed Supplier'}
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
                                <MaterialIcons name="business" size={16} color="#4F46E5" />
                                <Text style={{
                                    marginLeft: 5,
                                    color: '#4F46E5',
                                    fontWeight: '600'
                                }}>
                                    Supplier
                                </Text>
                            </View>
                        </View>

                        <ScrollView style={{ padding: 20 }}>
                            {/* Company Information */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: 15
                                }}>
                                    Company Information
                                </Text>

                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="domain" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Company Name</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.companyName || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="calendar-today" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Year Established</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.yearEstablished || 'Not provided'}
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
                                                {supplier.address || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

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
                                            <MaterialIcons name="person" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Contact Person</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.contactPerson || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="email" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Email</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.email || 'Not provided'}
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
                                                {supplier.phone || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="language" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Website</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.website || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>

                            {/* Supply Information */}
                            <View style={{ marginBottom: 20 }}>
                                <Text style={{
                                    fontSize: 18,
                                    fontWeight: 'bold',
                                    color: '#111827',
                                    marginBottom: 15
                                }}>
                                    Supply Information
                                </Text>

                                <View style={{ backgroundColor: 'white', borderRadius: 12, padding: 15, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="package-variant" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Minimum Order Quantity</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.minOrderQuantity || 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialCommunityIcons name="percent" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Discount Rate</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.discountRate ? `${supplier.discountRate}%` : 'Not provided'}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <View style={{ width: 36, alignItems: 'center' }}>
                                            <MaterialIcons name="payments" size={20} color="#4F46E5" />
                                        </View>
                                        <View style={{ marginLeft: 10 }}>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>Payment Terms</Text>
                                            <Text style={{ fontSize: 16, color: '#1F2937', fontWeight: '500' }}>
                                                {supplier.paymentTerms || 'Not provided'}
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
                                        onDelete(supplier.id);
                                    }}
                                >
                                    <Feather name="trash-2" size={20} color="#DC2626" />
                                    <Text style={{
                                        color: '#DC2626',
                                        fontWeight: 'bold',
                                        fontSize: 16,
                                        marginLeft: 8
                                    }}>
                                        Delete Supplier
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
                        Loading suppliers...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
            <StatusBar style="light" />
            <FlatList
                data={filteredSuppliers}
                keyExtractor={(item) => item.id}
                renderItem={({ item, index }) => (
                    <SupplierCard item={item} index={index} />
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
                        <FontAwesome5 name="store-slash" size={80} color="#D1D5DB" />
                        <Text style={{
                            fontSize: 18,
                            fontWeight: 'bold',
                            color: '#4B5563',
                            marginTop: 15
                        }}>
                            No suppliers found
                        </Text>
                        <Text style={{
                            textAlign: 'center',
                            color: '#6B7280',
                            marginTop: 5
                        }}>
                            {searchQuery ? 'Try adjusting your search query' : 'Add suppliers to get started'}
                        </Text>
                    </View>
                }
            />

            <SupplierDetailModal
                visible={modalVisible}
                supplier={selectedSupplier}
                onClose={() => setModalVisible(false)}
                onDelete={handleDelete}
            />
        </SafeAreaView>
    );
};

export default SupplierDetails; 