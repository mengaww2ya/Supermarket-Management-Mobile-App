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
import { collection, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Ionicons, MaterialIcons, FontAwesome5, AntDesign, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import HomeHeader from '../../components/HomeHeader';

// Define supplier product type categories with colors for visual distinction
const PRODUCT_CATEGORIES = {
  groceries: {
    label: 'Groceries',
    color: '#4F46E5',
    gradient: ['#4F46E5', '#7C3AED'],
    icon: 'basket-outline'
  },
  beverages: {
    label: 'Beverages',
    color: '#06B6D4',
    gradient: ['#06B6D4', '#0891B2'],
    icon: 'wine-outline'
  },
  electronics: {
    label: 'Electronics',
    color: '#F59E0B',
    gradient: ['#F59E0B', '#D97706'],
    icon: 'hardware-chip-outline'
  },
  household: {
    label: 'Household Items',
    color: '#10B981',
    gradient: ['#10B981', '#059669'],
    icon: 'home-outline'
  },
  cosmetics: {
    label: 'Cosmetics',
    color: '#EC4899',
    gradient: ['#EC4899', '#DB2777'],
    icon: 'color-palette-outline'
  },
  clothing: {
    label: 'Clothing',
    color: '#8B5CF6',
    gradient: ['#8B5CF6', '#7C3AED'],
    icon: 'shirt-outline'
  },
  produce: {
    label: 'Fresh Produce',
    color: '#34D399',
    gradient: ['#34D399', '#10B981'],
    icon: 'leaf-outline'
  },
  frozen: {
    label: 'Frozen Foods',
    color: '#60A5FA',
    gradient: ['#60A5FA', '#3B82F6'],
    icon: 'snow-outline'
  },
  bakery: {
    label: 'Bakery',
    color: '#FBBF24',
    gradient: ['#FBBF24', '#F59E0B'],
    icon: 'restaurant-outline'
  },
  dairy: {
    label: 'Dairy',
    color: '#A3E635',
    gradient: ['#A3E635', '#84CC16'],
    icon: 'water-outline'
  },
  meat: {
    label: 'Meat & Seafood',
    color: '#F87171',
    gradient: ['#F87171', '#EF4444'],
    icon: 'fish-outline'
  },
  default: {
    label: 'General',
    color: '#6B7280',
    gradient: ['#6B7280', '#4B5563'],
    icon: 'apps-outline'
  }
};

// Supplier Card Component
const SupplierCard = ({ item, index, onPress }) => {
  const slideAnim = useRef(new Animated.Value(-50)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const fadeInDelay = index * 100;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        delay: fadeInDelay,
        useNativeDriver: true
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 450,
        delay: fadeInDelay,
        useNativeDriver: true
      })
    ]).start();
  }, []);

  const getCategoryInfo = (productType) => {
    return PRODUCT_CATEGORIES[productType] || PRODUCT_CATEGORIES.default;
  };

  const categoryInfo = getCategoryInfo(item.productType);

  return (
    <TouchableOpacity 
      onPress={() => onPress(item)}
      activeOpacity={0.7}
    >
      <Animated.View 
        style={{
          opacity: opacityAnim,
          transform: [{ translateX: slideAnim }],
          marginHorizontal: 16,
          marginBottom: 16,
          borderRadius: 16,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
          overflow: 'hidden'
        }}
      >
        <LinearGradient
          colors={categoryInfo.gradient}
          start={[0, 0]}
          end={[1, 0]}
          style={{ height: 8 }}
        />
        
        <View style={{ padding: 16 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{
              width: 60,
              height: 60,
              borderRadius: 12,
              backgroundColor: `${categoryInfo.color}15`, // 15% opacity
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 16
            }}>
              <Ionicons name={categoryInfo.icon} size={28} color={categoryInfo.color} />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{ 
                fontSize: 18, 
                fontWeight: 'bold', 
                color: '#1F2937',
                marginBottom: 3
              }}>
                {item.companyName || item.name}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <MaterialIcons name="category" size={16} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 5 }}>
                  {categoryInfo.label}
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                <Ionicons name="person-outline" size={16} color="#6B7280" />
                <Text style={{ fontSize: 14, color: '#6B7280', marginLeft: 5 }}>
                  {item.contactPerson}
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

// Supplier Detail Modal
const SupplierDetailModal = ({ visible, supplier, onClose, onDelete, onUpdate }) => {
  if (!supplier) return null;
  
  const [isEditing, setIsEditing] = useState(false);
  const [editedSupplier, setEditedSupplier] = useState({});
  
  useEffect(() => {
    if (supplier) {
      setEditedSupplier({...supplier});
    }
  }, [supplier]);
  
  const getCategoryInfo = (productType) => {
    return PRODUCT_CATEGORIES[productType] || PRODUCT_CATEGORIES.default;
  };
  
  const categoryInfo = getCategoryInfo(supplier.productType);
  
  const handleInputChange = (field, value) => {
    setEditedSupplier(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleSaveChanges = () => {
    onUpdate(editedSupplier);
    setIsEditing(false);
  };
  
  const handleCancelEdit = () => {
    setEditedSupplier({...supplier});
    setIsEditing(false);
  };
  
  const DetailItem = ({ icon, label, value }) => (
    <View style={{ 
      flexDirection: 'row', 
      marginBottom: 16,
      alignItems: 'flex-start'
    }}>
      <View style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 8, 
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
      }}>
        <Ionicons name={icon} size={18} color="#4F46E5" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>{label}</Text>
        <Text style={{ fontSize: 16, color: '#111827', marginTop: 2 }}>{value || 'Not provided'}</Text>
      </View>
    </View>
  );
  
  const EditableItem = ({ icon, label, value, onChangeText, keyboardType = 'default' }) => (
    <View style={{ 
      flexDirection: 'row', 
      marginBottom: 16,
      alignItems: 'flex-start'
    }}>
      <View style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 8, 
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10
      }}>
        <Ionicons name={icon} size={18} color="#4F46E5" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, color: '#6B7280' }}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          style={{
            fontSize: 16,
            color: '#111827',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            paddingVertical: 4
          }}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  );
  
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ 
        flex: 1, 
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end'
      }}>
        <View style={{ 
          backgroundColor: 'white',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          maxHeight: '90%',
        }}>
          <LinearGradient
            colors={categoryInfo.gradient}
            start={[0, 0]}
            end={[1, 0]}
            style={{ 
              height: 8,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
            }}
          />
          
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: 12,
            borderBottomWidth: 1,
            borderBottomColor: '#F3F4F6'
          }}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
            
            <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
              Supplier Details
            </Text>
            
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView 
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <View style={{ 
              flexDirection: 'row',
              marginBottom: 24,
              alignItems: 'center'
            }}>
              <View style={{
                width: 70,
                height: 70,
                borderRadius: 16,
                backgroundColor: `${categoryInfo.color}15`,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 16
              }}>
                <Ionicons name={categoryInfo.icon} size={30} color={categoryInfo.color} />
              </View>
              
              <View style={{ flex: 1 }}>
                {isEditing ? (
                  <TextInput
                    value={editedSupplier.companyName || editedSupplier.name || ''}
                    onChangeText={(text) => handleInputChange('companyName', text)}
                    style={{
                      fontSize: 22,
                      fontWeight: 'bold',
                      color: '#111827',
                      borderBottomWidth: 1,
                      borderBottomColor: '#E5E7EB',
                      paddingVertical: 4
                    }}
                  />
                ) : (
                  <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827' }}>
                    {supplier.companyName || supplier.name}
                  </Text>
                )}
                
                <View style={{
                  backgroundColor: `${categoryInfo.color}20`,
                  paddingHorizontal: 10,
                  paddingVertical: 4,
                  borderRadius: 100,
                  alignSelf: 'flex-start',
                  marginTop: 6,
                  flexDirection: 'row',
                  alignItems: 'center'
                }}>
                  <Ionicons name={categoryInfo.icon} size={14} color={categoryInfo.color} />
                  <Text style={{ 
                    color: categoryInfo.color, 
                    fontWeight: '600',
                    fontSize: 13,
                    marginLeft: 4
                  }}>
                    {categoryInfo.label}
                  </Text>
                </View>
              </View>
            </View>
            
            <View style={{ 
              backgroundColor: '#F9FAFB', 
              padding: 16, 
              borderRadius: 12,
              marginBottom: 24
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 16,
                color: '#111827'
              }}>
                Company Information
              </Text>
              
              {isEditing ? (
                <>
                  <EditableItem
                    icon="business-outline"
                    label="Year Established"
                    value={editedSupplier.yearEstablished?.toString() || ''}
                    onChangeText={(text) => handleInputChange('yearEstablished', text)}
                    keyboardType="numeric"
                  />
                  <EditableItem
                    icon="globe-outline"
                    label="Website"
                    value={editedSupplier.website || ''}
                    onChangeText={(text) => handleInputChange('website', text)}
                  />
                  <EditableItem
                    icon="document-text-outline"
                    label="Tax ID"
                    value={editedSupplier.taxId || ''}
                    onChangeText={(text) => handleInputChange('taxId', text)}
                  />
                </>
              ) : (
                <>
                  <DetailItem
                    icon="business-outline"
                    label="Year Established"
                    value={supplier.yearEstablished}
                  />
                  <DetailItem
                    icon="globe-outline"
                    label="Website"
                    value={supplier.website}
                  />
                  <DetailItem
                    icon="document-text-outline"
                    label="Tax ID"
                    value={supplier.taxId}
                  />
                </>
              )}
            </View>
            
            <View style={{ 
              backgroundColor: '#F9FAFB', 
              padding: 16, 
              borderRadius: 12,
              marginBottom: 24
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 16,
                color: '#111827'
              }}>
                Contact Information
              </Text>
              
              {isEditing ? (
                <>
                  <EditableItem
                    icon="person-outline"
                    label="Contact Person"
                    value={editedSupplier.contactPerson || ''}
                    onChangeText={(text) => handleInputChange('contactPerson', text)}
                  />
                  <EditableItem
                    icon="mail-outline"
                    label="Email"
                    value={editedSupplier.email || ''}
                    onChangeText={(text) => handleInputChange('email', text)}
                    keyboardType="email-address"
                  />
                  <EditableItem
                    icon="call-outline"
                    label="Phone"
                    value={editedSupplier.phone || ''}
                    onChangeText={(text) => handleInputChange('phone', text)}
                    keyboardType="phone-pad"
                  />
                  <EditableItem
                    icon="location-outline"
                    label="Address"
                    value={editedSupplier.address || ''}
                    onChangeText={(text) => handleInputChange('address', text)}
                  />
                </>
              ) : (
                <>
                  <DetailItem
                    icon="person-outline"
                    label="Contact Person"
                    value={supplier.contactPerson}
                  />
                  <DetailItem
                    icon="mail-outline"
                    label="Email"
                    value={supplier.email}
                  />
                  <DetailItem
                    icon="call-outline"
                    label="Phone"
                    value={supplier.phone}
                  />
                  <DetailItem
                    icon="location-outline"
                    label="Address"
                    value={supplier.address}
                  />
                </>
              )}
            </View>
            
            <View style={{ 
              backgroundColor: '#F9FAFB', 
              padding: 16, 
              borderRadius: 12,
              marginBottom: 24
            }}>
              <Text style={{ 
                fontSize: 16, 
                fontWeight: 'bold', 
                marginBottom: 16,
                color: '#111827'
              }}>
                Supply Information
              </Text>
              
              {isEditing ? (
                <>
                  <EditableItem
                    icon="cart-outline"
                    label="Minimum Order Quantity"
                    value={editedSupplier.minOrderQuantity?.toString() || ''}
                    onChangeText={(text) => handleInputChange('minOrderQuantity', text)}
                    keyboardType="numeric"
                  />
                  <EditableItem
                    icon="pricetag-outline"
                    label="Discount Rate (%)"
                    value={editedSupplier.discountRate?.toString() || ''}
                    onChangeText={(text) => handleInputChange('discountRate', text)}
                    keyboardType="numeric"
                  />
                  <EditableItem
                    icon="calendar-outline"
                    label="Payment Terms"
                    value={editedSupplier.paymentTerms || ''}
                    onChangeText={(text) => handleInputChange('paymentTerms', text)}
                  />
                </>
              ) : (
                <>
                  <DetailItem
                    icon="cart-outline"
                    label="Minimum Order Quantity"
                    value={supplier.minOrderQuantity}
                  />
                  <DetailItem
                    icon="pricetag-outline"
                    label="Discount Rate (%)"
                    value={supplier.discountRate}
                  />
                  <DetailItem
                    icon="calendar-outline"
                    label="Payment Terms"
                    value={supplier.paymentTerms}
                  />
                </>
              )}
            </View>
            
            <View style={{ flexDirection: 'row', marginBottom: 20 }}>
              {isEditing ? (
                <>
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#F3F4F6',
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginRight: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }}
                    onPress={handleCancelEdit}
                  >
                    <Ionicons name="close-circle-outline" size={20} color="#4B5563" />
                    <Text style={{ color: '#4B5563', fontWeight: '600', marginLeft: 6 }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#4F46E5',
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginLeft: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }}
                    onPress={handleSaveChanges}
                  >
                    <Ionicons name="save-outline" size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>
                      Save
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#F87171',
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginRight: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }}
                    onPress={() => onDelete(supplier.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={{
                      flex: 1,
                      backgroundColor: '#4F46E5',
                      paddingVertical: 12,
                      borderRadius: 10,
                      marginLeft: 8,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center'
                    }}
                    onPress={() => setIsEditing(true)}
                  >
                    <Ionicons name="create-outline" size={20} color="white" />
                    <Text style={{ color: 'white', fontWeight: '600', marginLeft: 6 }}>
                      Edit
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState([]);
  const [filteredSuppliers, setFilteredSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const router = useRouter();
  
  useEffect(() => {
    fetchSuppliers();
  }, []);
  
  useEffect(() => {
    if (suppliers.length > 0) {
      filterSuppliers();
    }
  }, [suppliers, searchQuery, selectedCategory]);
  
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where("role", "==", "supplier"));
      const querySnapshot = await getDocs(q);
      
      const suppliersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setSuppliers(suppliersList);
      setFilteredSuppliers(suppliersList);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      Alert.alert('Error', 'Could not load suppliers. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const filterSuppliers = () => {
    let filtered = [...suppliers];
    
    // Apply search query filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(supplier => {
        const companyName = (supplier.companyName || supplier.name || '').toLowerCase();
        const contactPerson = (supplier.contactPerson || '').toLowerCase();
        const email = (supplier.email || '').toLowerCase();
        
        return (
          companyName.includes(query) ||
          contactPerson.includes(query) ||
          email.includes(query)
        );
      });
    }
    
    // Apply category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(supplier => supplier.productType === selectedCategory);
    }
    
    setFilteredSuppliers(filtered);
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchSuppliers();
  };
  
  const handleSupplierPress = (supplier) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedSupplier(supplier);
    setModalVisible(true);
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
  
  const handleUpdate = async (updatedSupplier) => {
    try {
      const supplierRef = doc(db, 'users', updatedSupplier.id);
      await updateDoc(supplierRef, {
        companyName: updatedSupplier.companyName || updatedSupplier.name,
        contactPerson: updatedSupplier.contactPerson,
        email: updatedSupplier.email,
        phone: updatedSupplier.phone,
        address: updatedSupplier.address,
        website: updatedSupplier.website,
        taxId: updatedSupplier.taxId,
        yearEstablished: updatedSupplier.yearEstablished,
        minOrderQuantity: updatedSupplier.minOrderQuantity,
        discountRate: updatedSupplier.discountRate,
        paymentTerms: updatedSupplier.paymentTerms
      });
      
      // Update the local state
      setSuppliers(prev => 
        prev.map(supplier => 
          supplier.id === updatedSupplier.id ? updatedSupplier : supplier
        )
      );
      
      setSelectedSupplier(updatedSupplier);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Supplier updated successfully');
    } catch (error) {
      console.error('Error updating supplier:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', 'Failed to update supplier. Please try again.');
    }
  };
  
  const handleAddSupplier = () => {
    router.push('/admine/addSuplier');
  };
  
  const CategoryButton = ({ category, label, icon }) => (
    <TouchableOpacity
      onPress={() => setSelectedCategory(category)}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 100,
        backgroundColor: selectedCategory === category ? '#4F46E515' : 'transparent',
        borderWidth: 1,
        borderColor: selectedCategory === category ? '#4F46E5' : '#E5E7EB',
        marginRight: 8,
        flexDirection: 'row',
        alignItems: 'center'
      }}
    >
      {icon && (
        <Ionicons 
          name={icon} 
          size={16} 
          color={selectedCategory === category ? '#4F46E5' : '#6B7280'} 
          style={{ marginRight: 6 }}
        />
      )}
      <Text
        style={{
          color: selectedCategory === category ? '#4F46E5' : '#6B7280',
          fontWeight: selectedCategory === category ? '600' : 'normal',
          fontSize: 14,
        }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
  
  const renderHeader = () => (
    <View style={{ backgroundColor: '#F9FAFB' }}>
      <HomeHeader title="Suppliers" />
      
      <View style={{ 
        padding: 15,
        paddingTop: 5,
        backgroundColor: '#F9FAFB',
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 12,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 15,
          paddingVertical: 10,
          marginBottom: 16,
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
        
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 30, marginBottom: 16 }}
        >
          <CategoryButton 
            category="all" 
            label="All Categories" 
            icon="apps-outline"
          />
          {Object.entries(PRODUCT_CATEGORIES)
            .filter(([key]) => key !== 'default')
            .map(([key, value]) => (
              <CategoryButton 
                key={key}
                category={key} 
                label={value.label} 
                icon={value.icon}
              />
            ))
          }
        </ScrollView>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 14, color: '#6B7280' }}>
            {filteredSuppliers.length} supplier{filteredSuppliers.length !== 1 ? 's' : ''} found
          </Text>
          
          <TouchableOpacity 
            onPress={handleAddSupplier}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#4F46E5',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8
            }}
          >
            <Ionicons name="add" size={18} color="white" />
            <Text style={{ color: 'white', fontWeight: '600', marginLeft: 4 }}>
              Add Supplier
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
        <StatusBar style="dark" />
        <HomeHeader title="Suppliers" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4F46E5" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#6B7280' }}>
            Loading suppliers...
          </Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <StatusBar style="dark" />
      
      <FlatList
        data={filteredSuppliers}
        renderItem={({ item, index }) => (
          <SupplierCard 
            item={item} 
            index={index} 
            onPress={handleSupplierPress}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ 
          paddingTop: 10,
          paddingBottom: 20
        }}
        ListHeaderComponent={renderHeader}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#4F46E5']}
            tintColor="#4F46E5"
          />
        }
        ListEmptyComponent={() => (
          <View style={{
            alignItems: 'center',
            justifyContent: 'center',
            padding: 30,
            marginTop: 50
          }}>
            <Ionicons name="business-outline" size={60} color="#D1D5DB" />
            <Text style={{ 
              fontSize: 16, 
              color: '#6B7280', 
              textAlign: 'center',
              marginTop: 16,
              marginBottom: 24
            }}>
              No suppliers found
            </Text>
            <TouchableOpacity 
              onPress={handleAddSupplier}
              style={{
                backgroundColor: '#4F46E5',
                paddingVertical: 12,
                paddingHorizontal: 20,
                borderRadius: 10,
                flexDirection: 'row',
                alignItems: 'center'
              }}
            >
              <Ionicons name="add-circle-outline" size={20} color="white" />
              <Text style={{ color: 'white', fontWeight: '600', marginLeft: 8 }}>
                Add Your First Supplier
              </Text>
            </TouchableOpacity>
          </View>
        )}
      />
      
      {selectedSupplier && (
        <SupplierDetailModal
          visible={modalVisible}
          supplier={selectedSupplier}
          onClose={() => setModalVisible(false)}
          onDelete={handleDelete}
          onUpdate={handleUpdate}
        />
      )}
    </SafeAreaView>
  );
} 