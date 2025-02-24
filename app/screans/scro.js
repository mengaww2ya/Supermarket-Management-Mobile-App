import React, { useState, useRef } from "react";
import { View, Text, FlatList, Dimensions, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

const { width } = Dimensions.get("window");

import mg from "../../assets/images/mg.jpg";
import hk2 from "../../assets/images/hk2.png";
import mes from "../../assets/images/mes.png";

const slides = [
  { id: "1", text: "Discover Great Products", image: mg },
  { id: "2", text: "Get a delivery service", image: hk2 },
  { id: "3", text: "Let’s Get Started", image: mes },
];

const WelcomeScreen = () => {
  const flatListRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();

  const handleScroll = (event) => {
    const slideIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(slideIndex);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "white", alignItems: "center" }}>
      <FlatList
        ref={flatListRef}
        data={slides}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        renderItem={({ item }) => (
          <View style={{ justifyContent: "center", alignItems: "center" }}>
            <Image source={item.image} style={{ width: 300, height: 300, resizeMode: "contain", marginVertical: 20 }} />
            <View
              style={{
                width: "100%",
                minHeight: 250,
                backgroundColor: "#FACC15",
                borderTopLeftRadius: 30,
                borderTopRightRadius: 30,
                padding: 20,
                alignItems: "center",
                position: "absolute",
                bottom: 0,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
              }}
            >
              <View style={{ flexDirection: "row", marginBottom: 10 }}>
                {slides.map((_, index) => (
                  <View
                    key={index}
                    style={{
                      width: currentIndex === index ? 12 : 8,
                      height: currentIndex === index ? 12 : 8,
                      borderRadius: 50,
                      backgroundColor: currentIndex === index ? "#047857" : "#9CA3AF",
                      marginHorizontal: 5,
                    }}
                  />
                ))}
              </View>

              <Text style={{ fontSize: 20, color: "#047857", textAlign: "center", marginVertical: 10, fontWeight: "600" }}>
                {item.text}
              </Text>

              <TouchableOpacity
                style={{
                  backgroundColor: "#047857",
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 8,
                  marginTop: 10,
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                }}
                onPress={() => router.push("/screans/welcome")}
              >
                <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Get Started</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
};

export default WelcomeScreen;
