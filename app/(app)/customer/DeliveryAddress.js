// import React, { useState } from "react";
// import {
//     View,
//     Text,
//     TextInput,
//     TouchableOpacity,
//     StyleSheet,
//     Alert,
// } from "react-native";
// import { useLocalSearchParams, useNavigation } from 'expo-router';
// import MapView, { Marker } from 'react-native-maps';
// import CountryPicker from 'react-native-country-picker-modal';
// import axios from 'axios';


// const LOCATION_IQ_API_KEY = "pk.aff8dbc427d7260086c8f0c8c3dbe123";

// const DeliveryAddress = () => {
//     const navigation = useNavigation();
//     const { selectedItems = [], totalPrice = 0 } = useLocalSearchParams();
//     const [location, setLocation] = useState(null);
//     const [placeName, setPlaceName] = useState("");
//     const [phoneNumber, setPhoneNumber] = useState("");
//     const [countryCode, setCountryCode] = useState("");
//     const [country, setCountry] = useState(null);

//     const deliveryFee = 50;
//     const adjustedTotalPrice = Number(totalPrice) + deliveryFee;

//     const handleMapPress = async (event) => {
//         const { latitude, longitude } = event.nativeEvent.coordinate;
//         setLocation({ latitude, longitude });

//         try {
//             const response = await axios.get(`https://us1.locationiq.com/v1/reverse.php`, {
//                 params: {
//                     lat: latitude,
//                     lon: longitude,
//                     format: 'json',
//                     key: LOCATION_IQ_API_KEY
//                 }
//             });
//             const addressComponent = response.data.display_name;
//             setPlaceName(addressComponent);
//             Alert.alert("Location Selected", addressComponent);
//         } catch (error) {
//             console.warn(error.response ? error.response.data : error.message);
//             Alert.alert("Error", "Unable to retrieve address. Please try again.");
//             setPlaceName("");
//         }
//     };

//     const handleCancel = () => {
//         setPhoneNumber("");
//         setLocation(null);
//         setPlaceName("");
//         setCountryCode("");
//         setCountry(null);
//         navigation.goBack();
//     };

//     const handleProceedToPayment = () => {
//         if (!location || !phoneNumber) {
//             Alert.alert("Error", "Please complete your delivery details before proceeding to payment.");
//             return;
//         }

//         navigation.navigate('paymentscreen', {
//             totalPrice: adjustedTotalPrice,
//             deliveryFee,
//             location,
//             placeName,
//             phoneNumber,
//             countryCode,
//         });
//     };

//     return (
//         <View style={styles.container}>
//             <Text style={styles.title}>Select Your Delivery Location</Text>

//             { }
//             <MapView
//                 style={styles.map}
//                 initialRegion={{
//                     latitude: 9.03,
//                     longitude: 38.74,
//                     latitudeDelta: 0.0422,
//                     longitudeDelta: 0.0211,
//                 }}
//                 onPress={handleMapPress}
//             >
//                 {location && (
//                     <Marker coordinate={location} title={placeName} />
//                 )}
//             </MapView>

//             { }
//             <TextInput
//                 style={styles.input}
//                 value={placeName || "Select a location"}
//                 editable={false}
//             />

//             { }
//             <CountryPicker
//                 withFilter
//                 withFlag
//                 withCountryNameButton
//                 withModal
//                 onSelect={(country) => {
//                     setCountry(country);
//                     setCountryCode(country.callingCode[0]);
//                 }}
//                 visible={false}
//             />

//             <View style={styles.phoneContainer}>
//                 <Text style={styles.countryCode}>{countryCode ? `+${countryCode}` : '+'}</Text>
//                 <TextInput
//                     style={styles.input}
//                     placeholder="Enter your phone number"
//                     value={phoneNumber}
//                     onChangeText={setPhoneNumber}
//                     keyboardType="phone-pad"
//                 />
//             </View>

//             <Text style={styles.totalText}>Total: {adjustedTotalPrice} Birr</Text>
//             <Text style={styles.deliveryText}>Delivery: {deliveryFee} Birr</Text>

//             <TouchableOpacity onPress={handleProceedToPayment} style={[styles.button, styles.proceedButton]}>
//                 <Text style={styles.buttonText}>Proceed to Payment</Text>
//             </TouchableOpacity>

//             <TouchableOpacity onPress={handleCancel} style={[styles.button, styles.cancelButton]}>
//                 <Text style={styles.buttonText}>Cancel</Text>
//             </TouchableOpacity>
//         </View>
//     );
// };

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         padding: 20,
//     },
//     title: {
//         fontSize: 24,
//         fontWeight: 'bold',
//         marginBottom: 20,
//     },
//     map: {
//         width: '100%',
//         height: 300,
//         marginBottom: 20,
//     },
//     input: {
//         borderWidth: 1,
//         borderColor: '#ccc',
//         padding: 10,
//         marginBottom: 10,
//     },
//     phoneContainer: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         marginBottom: 20,
//     },
//     countryCode: {
//         fontSize: 18,
//         marginRight: 10,
//     },
//     totalText: {
//         fontSize: 18,
//         marginBottom: 10,
//     },
//     deliveryText: {
//         fontSize: 18,
//         marginBottom: 20,
//     },
//     button: {
//         backgroundColor: '#007BFF',
//         padding: 15,
//         alignItems: 'center',
//         borderRadius: 5,
//         marginBottom: 10,
//     },
//     buttonText: {
//         color: '#fff',
//         fontSize: 16,
//     },
//     proceedButton: {
//         backgroundColor: '#28a745',
//     },
//     cancelButton: {
//         backgroundColor: '#dc3545',
//     },
// });

// export default DeliveryAddress;