import React, { useState, useRef } from 'react';
import { View, Text, FlatList, Dimensions, StyleSheet, Image, TouchableOpacity } from 'react-native';

const { width, height } = Dimensions.get('window');

const slides = [
    { id: '1', text: 'Discover Great Products', image: require('../../assets/images/mg.jpg') },
    { id: '2', text: 'Get a delivery service', image: require('../../assets/images/hk2.png') },
    { id: '3', text: 'Let’s Get Started', image: require('../../assets/images/mes.png') },
];

const WelcomeScreen = ({ navigation }) => {
    const flatListRef = useRef(null);
    const [currentIndex, setCurrentIndex] = useState(0);

    const handleScroll = (event) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        setCurrentIndex(slideIndex);
    };

    const handleMomentumScrollEnd = (event) => {
        const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
        if (slideIndex === slides.length - 1) {
            navigation.replace('Welcome');
        }
    };

    return (
        <View style={styles.container}>
            <FlatList
                ref={flatListRef}
                data={slides}
                keyExtractor={(item) => item.id}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                onMomentumScrollEnd={handleMomentumScrollEnd}
                renderItem={({ item }) => (
                    <View style={styles.slide}>
                        <Image source={item.image} style={styles.image} />


                        <View style={styles.infoContainer}>


                            <View style={styles.dotsContainer}>
                                {slides.map((_, index) => (
                                    <View
                                        key={index}
                                        style={[
                                            styles.dot,
                                            currentIndex === index && styles.activeDot,
                                        ]}
                                    />
                                ))}
                            </View>


                            <Text style={styles.text}>{item.text}</Text>


                            <TouchableOpacity
                                style={styles.button}
                                onPress={() => navigation.navigate('Welcome')}>
                                <Text style={styles.buttonText}>Get Started</Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                )}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: 'white',
        alignItems: 'center',
    },
    slide: {
        width,
        alignItems: 'center',
    },
    image: {
        width: '100%',
        height: height * 0.5,
        resizeMode: 'cover',
    },
    infoContainer: {
        width: '100%',
        minHeight: 250,
        backgroundColor: '#FFDC2B',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        paddingVertical: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'absolute',
        bottom: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
    },
    text: {
        fontSize: 22,
        color: 'green',
        textAlign: 'center',
        marginVertical: 10,
    },
    button: {
        backgroundColor: 'green',
        paddingVertical: 12,
        paddingHorizontal: 25,
        borderRadius: 10,
        marginTop: 10,
    },
    buttonText: {
        fontSize: 18,
        color: 'white',
        fontWeight: 'bold',
    },
    dotsContainer: {
        flexDirection: 'row',
        marginBottom: 10,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'grey',
        marginHorizontal: 5,
    },
    activeDot: {
        backgroundColor: 'green',
        width: 12,
        height: 12,
    },
});

export default WelcomeScreen;
