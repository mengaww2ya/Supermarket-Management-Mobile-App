import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    Modal,
    TouchableOpacity,
    TextInput,
    FlatList,
    Image,
    Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { FadeInDown, SlideInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SupplierDisplay = ({
    visible,
    onClose,
    suppliers,
    onSelectSupplier,
    provideFeedback,
    navigation
}) => {
    const insets = useSafeAreaInsets();
    const { height } = Dimensions.get('window');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);

    useEffect(() => {
        if (visible) {
            // Filter suppliers based on search query
            const filtered = suppliers.filter(supplier =>
                supplier.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.contactPerson?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
            );
            setFilteredSuppliers(filtered);
        }
    }, [searchQuery, visible, suppliers]);

    const handleSelectSupplier = (supplier) => {
        provideFeedback('light');
        onSelectSupplier(supplier);
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
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
                        paddingBottom: Math.max(20, insets.bottom),
                        maxHeight: height * 0.8,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: -5 },
                        shadowOpacity: 0.1,
                        shadowRadius: 6,
                        elevation: 5,
                    }}
                    entering={SlideInDown.springify().damping(15)}
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
                                provideFeedback('light');
                                onClose();
                                setSearchQuery('');
                            }}
                        >
                            <Ionicons name="close" size={24} color="#6B7280" />
                        </TouchableOpacity>

                        <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#111827' }}>
                            Select Supplier
                        </Text>

                        <View style={{ width: 40 }} />
                    </View>

                    {/* Search Bar */}
                    <View style={{
                        paddingHorizontal: 20,
                        paddingVertical: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: '#E5E7EB',
                    }}>
                        <View style={{
                            flexDirection: 'row',
                            backgroundColor: '#F3F4F6',
                            borderRadius: 10,
                            paddingHorizontal: 12,
                            height: 44,
                            alignItems: 'center',
                        }}>
                            <Ionicons name="search" size={20} color="#9CA3AF" />
                            <TextInput
                                placeholder="Search suppliers..."
                                placeholderTextColor="#9CA3AF"
                                style={{
                                    flex: 1,
                                    marginLeft: 8,
                                    fontSize: 15,
                                    color: '#4B5563',
                                    height: '100%',
                                }}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity
                                    onPress={() => {
                                        setSearchQuery('');
                                        provideFeedback('light');
                                    }}
                                >
                                    <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Suppliers List */}
                    {filteredSuppliers.length === 0 ? (
                        <View style={{
                            flex: 1,
                            justifyContent: 'center',
                            alignItems: 'center',
                            paddingHorizontal: 40,
                            paddingBottom: 40
                        }}>
                            <MaterialCommunityIcons name="account-group" size={48} color="#D1D5DB" />
                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#4B5563', marginTop: 16, textAlign: 'center' }}>
                                {searchQuery ? 'No matching suppliers found' : 'No suppliers available'}
                            </Text>
                            <Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8, textAlign: 'center', lineHeight: 20 }}>
                                {searchQuery
                                    ? 'Try a different search term or add suppliers first'
                                    : 'You need to add suppliers before creating an order'}
                            </Text>

                            {searchQuery ? (
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
                                        provideFeedback('light');
                                        setSearchQuery('');
                                    }}
                                >
                                    <Ionicons name="refresh" size={16} color="#4B5563" style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#4B5563' }}>
                                        Clear Search
                                    </Text>
                                </TouchableOpacity>
                            ) : (
                                <TouchableOpacity
                                    style={{
                                        marginTop: 20,
                                        paddingVertical: 10,
                                        paddingHorizontal: 16,
                                        backgroundColor: '#4F46E5',
                                        borderRadius: 8,
                                        flexDirection: 'row',
                                        alignItems: 'center',
                                    }}
                                    onPress={() => {
                                        provideFeedback('medium');
                                        onClose();
                                        navigation.navigate('/admine/manageSuppliers');
                                    }}
                                >
                                    <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                    <Text style={{ fontSize: 14, fontWeight: '500', color: '#FFFFFF' }}>
                                        Add New Supplier
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredSuppliers}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item, index }) => (
                                <Animated.View
                                    entering={FadeInDown.delay(index * 50).springify()}
                                >
                                    <TouchableOpacity
                                        style={{
                                            flexDirection: 'row',
                                            alignItems: 'center',
                                            paddingVertical: 12,
                                            paddingHorizontal: 20,
                                            borderBottomWidth: 1,
                                            borderBottomColor: '#F3F4F6',
                                        }}
                                        onPress={() => handleSelectSupplier(item)}
                                    >
                                        <View style={{
                                            width: 48,
                                            height: 48,
                                            borderRadius: 24,
                                            backgroundColor: '#F3F4F6',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            marginRight: 16,
                                        }}>
                                            {item.photoURL ? (
                                                <Image
                                                    source={{ uri: item.photoURL }}
                                                    style={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 24,
                                                    }}
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <MaterialCommunityIcons name="account" size={24} color="#9CA3AF" />
                                            )}
                                        </View>

                                        <View style={{ flex: 1 }}>
                                            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 2 }}>
                                                {item.name}
                                            </Text>
                                            <Text style={{ fontSize: 14, color: '#6B7280' }}>
                                                {item.contactPerson || 'No contact person'} • {item.phone || 'No phone'}
                                            </Text>
                                        </View>

                                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                                    </TouchableOpacity>
                                </Animated.View>
                            )}
                            showsVerticalScrollIndicator={false}
                            contentContainerStyle={{ paddingBottom: 20 }}
                        />
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
};

export default SupplierDisplay; 