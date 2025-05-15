import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    Dimensions,
    ScrollView,
    ActivityIndicator,
    Keyboard,
    Platform,
} from "react-native";
import { useLocalSearchParams, useNavigation } from 'expo-router';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import CountryPicker from 'react-native-country-picker-modal';
import axios from 'axios';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width, height } = Dimensions.get('window');
const LOCATION_IQ_API_KEY = "pk.aff8dbc427d7260086c8f0c8c3dbe123";
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0222;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const DeliveryAddress = () => {
    const navigation = useNavigation();
    const insets = useSafeAreaInsets();
    const mapRef = useRef(null);
    const { selectedItems = [], totalPrice = 0 } = useLocalSearchParams();
    
    const [location, setLocation] = useState(null);
    const [placeName, setPlaceName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [countryCode, setCountryCode] = useState("251"); // Default to Ethiopia
    const [country, setCountry] = useState({ callingCode: ["251"], cca2: "ET" });
    const [countryPickerVisible, setCountryPickerVisible] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingUserLocation, setLoadingUserLocation] = useState(false);
    const [locationNote, setLocationNote] = useState("");
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    // Initial region (Ethiopia - Addis Ababa)
    const initialRegion = {
        latitude: 9.03,
        longitude: 38.74,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
    };

    const deliveryFee = 50;
    const adjustedTotalPrice = Number(totalPrice) + deliveryFee;

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener(
            'keyboardDidShow',
            () => setIsKeyboardVisible(true)
        );
        const keyboardDidHideListener = Keyboard.addListener(
            'keyboardDidHide',
            () => setIsKeyboardVisible(false)
        );

        return () => {
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const handleMapPress = async (event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const { latitude, longitude } = event.nativeEvent.coordinate;
        setLocation({ latitude, longitude });
        setIsLoading(true);

        try {
            const response = await axios.get(`https://us1.locationiq.com/v1/reverse.php`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    key: LOCATION_IQ_API_KEY
                }
            });
            const addressComponent = response.data.display_name;
            setPlaceName(addressComponent);
            setIsLoading(false);
        } catch (error) {
            console.warn(error.response ? error.response.data : error.message);
            Alert.alert("Error", "Unable to retrieve address. Please try again.");
            setPlaceName("");
            setIsLoading(false);
        }
    };

    const getCurrentLocation = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setLoadingUserLocation(true);
        
        try {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Please allow location access to use this feature');
                setLoadingUserLocation(false);
                return;
            }

            const location = await Location.getCurrentPositionAsync({});
            const { latitude, longitude } = location.coords;
            
            setLocation({ latitude, longitude });
            
            // Animate to user location
            mapRef.current?.animateToRegion({
                latitude,
                longitude,
                latitudeDelta: LATITUDE_DELTA / 2,
                longitudeDelta: LONGITUDE_DELTA / 2,
            }, 1000);

            // Reverse geocode to get address
            const response = await axios.get(`https://us1.locationiq.com/v1/reverse.php`, {
                params: {
                    lat: latitude,
                    lon: longitude,
                    format: 'json',
                    key: LOCATION_IQ_API_KEY
                }
            });

            const addressComponent = response.data.display_name;
            setPlaceName(addressComponent);
            
        } catch (error) {
            console.warn(error);
            Alert.alert("Error", "Unable to get your current location. Please try again or select manually.");
        } finally {
            setLoadingUserLocation(false);
        }
    };

    const handleCancel = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPhoneNumber("");
        setLocation(null);
        setPlaceName("");
        setLocationNote("");
        navigation.goBack();
    };

    const handleProceedToPayment = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Validation
        if (!location) {
            Alert.alert("Error", "Please select a delivery location on the map.");
            return;
        }

        if (!phoneNumber) {
            Alert.alert("Error", "Please enter your phone number.");
            return;
        }

        // Phone number validation (simple length check)
        if (phoneNumber.length < 9) {
            Alert.alert("Error", "Please enter a valid phone number.");
            return;
        }

        // Navigate to payment screen with all necessary data
        navigation.push('paymentscreen', {
                totalPrice: adjustedTotalPrice,
                deliveryFee,
                location: JSON.stringify(location),
                placeName,
            phoneNumber,
            countryCode,
            locationNote,
        });
    };

    return (
        <View style={[styles.container, { paddingTop: insets.top }]}>
            <ScrollView 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.header}>
                    <TouchableOpacity 
                        style={styles.backButton} 
                        onPress={handleCancel}
                    >
                        <Ionicons name="arrow-back" size={24} color="#333" />
                    </TouchableOpacity>
                    <Text style={styles.title}>Delivery Location</Text>
                </View>
                
                <View style={styles.mapContainer}>
                    <MapView
                        ref={mapRef}
                        provider={PROVIDER_GOOGLE}
                        style={styles.map}
                        initialRegion={initialRegion}
                        onPress={handleMapPress}
                        showsUserLocation={true}
                        showsMyLocationButton={false}
                        showsCompass={true}
                        zoomEnabled={true}
                        scrollEnabled={true}
                        rotateEnabled={true}
                    >
                        {location && (
                            <Marker 
                                coordinate={location} 
                                title="Delivery Location"
                                description={placeName}
                                pinColor="#FF5252"
                            >
                                <View style={styles.customMarker}>
                                    <View style={styles.markerIcon}>
                                        <MaterialIcons name="location-pin" size={30} color="#FF5252" />
                                    </View>
                                    <View style={styles.markerShadow} />
                                </View>
                            </Marker>
                        )}
                    </MapView>

                    {isLoading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color="#FF5252" />
                </View>
                    )}

                    <TouchableOpacity 
                        style={styles.myLocationButton}
                        onPress={getCurrentLocation}
                        disabled={loadingUserLocation}
                    >
                        {loadingUserLocation ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <MaterialIcons name="my-location" size={22} color="#fff" />
                        )}
                    </TouchableOpacity>

                    <View style={styles.mapInstructions}>
                        <Text style={styles.mapInstructionsText}>
                            Tap on the map to select your delivery location
                        </Text>
                    </View>
                    </View>
                    
                <View style={styles.formContainer}>
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Address Details</Text>
                        
                        <View style={styles.addressContainer}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="location-on" size={24} color="#FF5252" />
                            </View>
                            <TextInput
                                style={styles.addressInput}
                                value={placeName}
                                placeholder="Select a location on map"
                                editable={false}
                                multiline
                            />
                        </View>

                        <View style={styles.inputContainer}>
                            <View style={styles.iconContainer}>
                                <MaterialIcons name="note-add" size={24} color="#FF5252" />
                            </View>
                            <TextInput
                                style={styles.noteInput}
                                placeholder="Add delivery notes (optional)"
                                value={locationNote}
                                onChangeText={setLocationNote}
                                multiline
                            />
                        </View>
                    </View>
                    
                    <View style={styles.formSection}>
                        <Text style={styles.sectionTitle}>Contact Information</Text>
                        
                        <View style={styles.phoneInputContainer}>
                        <TouchableOpacity 
                                style={styles.countryPickerButton}
                            onPress={() => setCountryPickerVisible(true)}
                        >
                                <Text style={styles.countryCode}>{`+${countryCode}`}</Text>
                                <MaterialIcons name="arrow-drop-down" size={24} color="#333" />
                        </TouchableOpacity>
                        
                        <TextInput
                                style={styles.phoneInput}
                                placeholder="Phone number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                            keyboardType="phone-pad"
                            />
                        </View>

                        <CountryPicker
                            withFilter
                            withFlag
                            withCallingCode
                            withEmoji
                            onSelect={(selectedCountry) => {
                                setCountry(selectedCountry);
                                setCountryCode(selectedCountry.callingCode[0]);
                                setCountryPickerVisible(false);
                            }}
                            visible={countryPickerVisible}
                            onClose={() => setCountryPickerVisible(false)}
                            countryCode={country?.cca2 || "ET"}
                        />
                    </View>
                </View>
                
                <View style={styles.orderSummary}>
                    <Text style={styles.summaryTitle}>Order Summary</Text>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Item Total:</Text>
                        <Text style={styles.summaryValue}>{parseFloat(totalPrice).toFixed(2)} Birr</Text>
                    </View>
                    <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Delivery Fee:</Text>
                        <Text style={styles.summaryValue}>{deliveryFee.toFixed(2)} Birr</Text>
                    </View>
                    <View style={[styles.summaryRow, styles.totalRow]}>
                        <Text style={styles.totalLabel}>Total:</Text>
                        <Text style={styles.totalValue}>{adjustedTotalPrice.toFixed(2)} Birr</Text>
                    </View>
                </View>
            </ScrollView>
                
            {!isKeyboardVisible && (
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={handleCancel}
                    >
                        <Text style={styles.cancelButtonText}>Cancel</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        onPress={handleProceedToPayment}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FF5252', '#FF7B7B']}
                            start={[0, 0]}
                            end={[1, 0]}
                            style={styles.proceedButton}
                        >
                            <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
                            <MaterialIcons name="arrow-forward" size={22} color="#fff" />
                        </LinearGradient>
                    </TouchableOpacity>
                </View>
            )}
            </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9f9f9',
    },
    scrollContent: {
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
    },
    backButton: {
        padding: 8,
    },
    title: {
        fontSize: 22,
        fontWeight: 'bold',
        marginLeft: 15,
        color: '#333',
    },
    mapContainer: {
        width: '100%',
        height: 300,
        marginBottom: 20,
        position: 'relative',
    },
    map: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
        overflow: 'hidden',
    },
    customMarker: {
        alignItems: 'center',
    },
    markerIcon: {
        height: 35,
        zIndex: 1,
    },
    markerShadow: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
        marginTop: -5,
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.6)',
    },
    myLocationButton: {
        position: 'absolute',
        bottom: 20,
        right: 20,
        backgroundColor: '#FF5252',
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
        elevation: 3,
    },
    mapInstructions: {
        position: 'absolute',
        top: 10,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    mapInstructionsText: {
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: '#fff',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 20,
        fontSize: 12,
        fontWeight: '500',
    },
    formContainer: {
        paddingHorizontal: 20,
    },
    formSection: {
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    addressContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        marginBottom: 15,
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 5,
    },
    iconContainer: {
        padding: 10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    addressInput: {
        flex: 1,
        paddingVertical: 10,
        paddingRight: 10,
        color: '#333',
        fontSize: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        padding: 5,
    },
    noteInput: {
        flex: 1,
        paddingVertical: 10,
        paddingRight: 10,
        color: '#333',
        fontSize: 14,
        minHeight: 60,
        textAlignVertical: 'top',
    },
    phoneInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        borderRadius: 10,
        overflow: 'hidden',
    },
    countryPickerButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRightWidth: 1,
        borderColor: '#e0e0e0',
        backgroundColor: '#f5f5f5',
    },
    countryCode: {
        fontSize: 16,
        fontWeight: '500',
        color: '#333',
    },
    phoneInput: {
        flex: 1,
        padding: 12,
        fontSize: 16,
    },
    orderSummary: {
        backgroundColor: '#fff',
        margin: 20,
        borderRadius: 15,
        padding: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    summaryTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
    },
    summaryLabel: {
        fontSize: 16,
        color: '#666',
    },
    summaryValue: {
        fontSize: 16,
        color: '#333',
    },
    totalRow: {
        marginTop: 10,
        paddingTop: 10,
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    totalValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#FF5252',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderColor: '#eee',
    },
    cancelButton: {
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
    proceedButton: {
        flexDirection: 'row',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    proceedButtonText: {
        color: '#fff',
        fontWeight: '600',
        fontSize: 16,
        marginRight: 8,
    },
});

export default DeliveryAddress;