import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Image,
  useWindowDimensions,
} from "react-native";
import { promoCategories, standard, recomended } from "../global/data.js";
import DrawNavigator from "../navigator/drawNavigator.js";
import Footer from "../subscrean/foter.js";
import { colors, Icon } from "react-native-elements";

export default function Homepage({ navigation }) {
  const screenwidth = useWindowDimensions().width;
  const screenheight = useWindowDimensions().height;
  const [Delivery, setDelivery] = useState(false);
  const [indexcheck, setindexcheck] = useState(" ");
  const [sindexcheck, ssetindexcheck] = useState(" ");
  const [recoindexcheck, recosetindexcheck] = useState(" ");

  return (
    <ScrollView
      style={{ flex: 1, paddingBottom: 20 }}
      stickyHeaderIndices={[0]}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View>
        <View style={styles.container}>
          <TouchableOpacity
            onPress={() => {
              setDelivery(true);
            }}
          >
            <View
              style={{
                ...styles.deliveryButon,
                backgroundColor: Delivery ? "hsl(27, 88%, 58%)" : colors.grey5,
              }}
            >
              <Text style={styles.deliveryText}>Delivery</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setDelivery(false);
            }}
          >
            <View
              style={{
                ...styles.setDeliveryButon,
                backgroundColor: Delivery ? colors.grey5 : "hsl(27, 88%, 58%)",
              }}
            >
              <Text style={styles.deliveryText}>pick up</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.filterWholContainer}>
          <View style={styles.mepTimeContainer}>
            <View style={[{ flexDirection: "row", padding: 5 }]}>
              <Icon
                type="material-community"
                name="map-marker"
                color="hsl(0, 71%, 58%)"
                // onPress={() => {navigation.menu()}}
                size={32}
              />
              <Text>gurd shola</Text>
            </View>
            <View style={styles.timeIconCntainer}>
              <Icon
                type="material-community"
                name="clock-time-four"
                color={colors.grey3}
                // onPress={() => {navigation.menu()}}
                size={32}
              />
              <Text style={{ paddingRight: 5 }}>now</Text>
            </View>
          </View>
          <View style={styles.filterView}>
            <Icon
              type="material-community"
              name="tune"
              color={colors.grey2}
              // onPress={() => {navigation.menu()}}
              size={32}
            />
          </View>
        </View>
      </View>
      <View>
        <Text style={styles.TextHead}>Promotion Categories</Text>
        <View style={styles.promotionView}>
          <FlatList
            nestedScrollEnabled
            horizontal={true}
            showsHorizontalScrollIndicator={false}
            data={promoCategories}
            keyExtractor={(item) => item.id}
            extraData={indexcheck}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.cardContainer]}
                onPress={() => {
                  setindexcheck(item.id);
                  if (item.ProductName == "Vegetable") {
                    navigation.navigate("Vegetable");
                  } else if (item.ProductName == "Fruit") {
                    navigation.navigate("Fruit");
                  } else if (item.ProductName == "Pcked food") {
                    navigation.navigate("PckedFood");
                  } else if (item.ProductName == "Soft drink") {
                    navigation.navigate("SoftDrink");
                  } else if (item.ProductName == "cosmotics") {
                    navigation.navigate("Csmotics");
                  } else if (item.ProductName == "Alcholic drink") {
                    navigation.navigate("AlcholicDrink");
                  }
                }}
              >
                <Image style={styles.cardImage} source={item.image} />
                <Text style={styles.cardText}>{item.ProductName}</Text>
                {/* <Text style={styles.reviewText}>
                  {item.NumberofReviews} reviews
                </Text>
                <Text style={styles.ratingText}>⭐ {item.Rating}</Text> */}
              </Pressable>
            )}
          />
        </View>
      </View>

      <View>
        <Text style={styles.TextHead}>standard Categories</Text>
        <View style={styles.promotionView}>
          <FlatList
            nestedScrollEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            data={standard}
            keyExtractor={(item) => item.id}
            extraData={sindexcheck}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.cardContainer]}
                onPress={() => {
                  ssetindexcheck(item.id);
                  if (item.ProductName == "Vegetable") {
                    navigation.navigate("Vegetable");
                  } else if (item.ProductName == "Fruit") {
                    navigation.navigate("Fruit");
                  } else if (item.ProductName == "Pcked food") {
                    navigation.navigate("PckedFood");
                  } else if (item.ProductName == "Soft drink") {
                    navigation.navigate("SoftDrink");
                  } else if (item.ProductName == "cosmotics") {
                    navigation.navigate("Csmotics");
                  } else if (item.ProductName == "Alcholic drink") {
                    navigation.navigate("AlcholicDrink");
                  }
                }}
              >
                <Image style={styles.cardImage} source={item.image} />
                <Text style={styles.cardText}>{item.ProductName}</Text>
                {/* <Text style={styles.reviewText}>
                  {item.NumberofReviews} reviews
                </Text>
                <Text style={styles.ratingText}>⭐ {item.Rating}</Text> */}
              </Pressable>
            )}
          />
        </View>
      </View>
      <View>
        <Text style={styles.TextHead}>recomended Categories</Text>
        <View style={styles.promotionView}>
          <FlatList
            nestedScrollEnabled
            horizontal
            showsHorizontalScrollIndicator={false}
            data={recomended}
            keyExtractor={(item) => item.id}
            extraData={recoindexcheck}
            renderItem={({ item }) => (
              <Pressable
                style={[styles.cardContainer]}
                onPress={() => {
                  recosetindexcheck(item.id);
                  if (item.ProductName == "Vegetable") {
                    navigation.navigate("Vegetable");
                  } else if (item.ProductName == "Fruit") {
                    navigation.navigate("Fruit");
                  } else if (item.ProductName == "Pcked food") {
                    navigation.navigate("PckedFood");
                  } else if (item.ProductName == "Soft drink") {
                    navigation.navigate("SoftDrink");
                  } else if (item.ProductName == "cosmotics") {
                    navigation.navigate("Csmotics");
                  } else if (item.ProductName == "Alcholic drink") {
                    navigation.navigate("AlcholicDrink");
                  }
                }}
              >
                <Image style={styles.cardImage} source={item.image} />
                <Text style={styles.cardText}>{item.ProductName}</Text>
                {/* <View style={styles.cardTextView}>
                  <Text style={styles.reviewText}>
                    {item.NumberofReviews} reviews
                  </Text>
                  <Text style={styles.ratingText}>⭐ {item.Rating}</Text>
                </View> */}
              </Pressable>
            )}
          />
        </View>
      </View>
      <Footer navigation={navigation} />
      {/* { navigation.navigate("Footer")} */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "space-evenly",
    flexDirection: "row",
  },
  deliveryButon: {
    paddingHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 15,
    marginVertical: 20,
  },
  setDeliveryButon: {
    paddingHorizontal: 20,
    borderRadius: 15,
    paddingVertical: 15,
    marginVertical: 20,
  },
  deliveryText: {
    marginLeft: 15,
    fontSize: 16,
    color: "black",
  },
  filterWholContainer: {
    flexDirection: "row",
    paddingLeft: 10,
    justifyContent: "space-evenly",
    alignItems: "center",
  },
  mepTimeContainer: {
    flexDirection: "row",
    borderRadius: 15,
    backgroundColor: colors.grey5,
    paddingVertical: 5,
    paddingHorizontal: 20,

    justifyContent: "space-evenly",
  },
  timeIconCntainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 5,
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 15,
  },
  filterView: {
    alignItems: "center",
    marginRight: 5,
  },
  promotionView: {
    backgroundColor: colors.grey5,
    marginTop: 10,
    margin: 10,
    padding: 10,
  },
  TextHead: {
    color: colors.grey2,
    fontSize: 22,
    fontWeight: "bold",
    paddingLeft: 5,
    textAlign: "center",
  },

  cardContainer: {
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    width: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    transform: [{ scale: 1 }],
  },
  selectedCard: {
    backgroundColor: "hsl(27, 88%, 58%)",
    transform: [{ scale: 1.05 }],
  },
  cardImage: {
    width: "100%",
    height:100,
    marginBottom: 10,
  },
  cardText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  cardTextSelected: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
  },
  reviewText: {
    fontSize: 12,
    color: "#666",
    marginTop: 5,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#FFA500",
    marginTop: 3,
  },
});
