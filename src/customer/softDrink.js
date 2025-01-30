import React, { useState } from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  Image,
} from "react-native";
import { SoftDrinkCategory } from "../global/data";
import { colors, Icon } from "react-native-elements";
import Homepage from "./homepage.js";
import Footer from "../subscrean/foter.js";

export default function SoftDrink({ navigation }) {
  const [indexcheck, setindexcheck] = useState(" ");
  const [titem, settitem] = useState("");
  const updateImage = (image) => {
    settitem(image);
  };
  return (
    <ScrollView>
      <View style={styles.vegetableView}>
        <FlatList
          nestedScrollEnabled
          //   horizontal={true}
          //  showsHorizontalScrollIndicator={false}
          data={SoftDrinkCategory}
          keyExtractor={(item) => item.id}
          extraData={indexcheck}
          renderItem={({ item, index }) => (
            <Pressable
              style={{ padding: 10 }}
              onPress={() => {
                setindexcheck(item.id);
                navigation.navigate("Item");
                setindexcheck(item.id);
                updateImage(item.image);
                navigation.navigate("Item", {
                  image: item.image,
                  ProductName: item.drinkName,
                  Price: item.Price,
                  DiscountPrice: item.DiscountPrice,
                  Rating: item.Rating,
                  NumberofReviews: item.NumberofReviews,
                  ShortDescription: item.ShortDescription,
                  catagory: item.catagory,
                  id: item.id,
                  suplier: item.SupplierName,
                  ingredients: item.ingredients,
                  NutritionalInformation: item.nutritionalInformation,
                  Amount: item.Amount,
                  packagetype: item.PackageType,
                  PackagingInformation: item.PackagingInformation,
                  origin: item.Origin,
                });
              }}
            >
              <Text
                style={
                  indexcheck === item.id
                    ? styles.CardtextSelected
                    : styles.Cardtext
                }
              >
                {item.VegetableName}
              </Text>
              <View
                style={
                  indexcheck === item.id ? styles.CardsSelected : styles.Cards
                }
              >
                <Image style={styles.cardimage} source={item.image} />
              </View>
              <View>
                <Text
                  style={
                    indexcheck === item.id
                      ? styles.CardtextSelected
                      : styles.Cardtext
                  }
                >
                  {item.NumberofReviews} reviews
                </Text>

                <Text
                  style={
                    indexcheck === item.id
                      ? styles.CardtextSelected
                      : styles.Cardtext
                  }
                >
                  {item.Rating}
                </Text>
              </View>
            </Pressable>
          )}
        />
      </View>
      <Footer navigation={navigation} />
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  vegetableView: {
    backgroundColor: colors.grey5,
    marginTop: 10,
    margin: 10,
    padding: 10,
  },
  CardtextSelected: {
    textAlign: "center",

    alignItems: "center",
    fontWeight: "bold",
    color: colors.grey1,
  },
  Cardtext: {
    textAlign: "center",

    fontWeight: "bold",
    color: colors.grey2,
  },

  Cards: {
    borderRadius: 15,
    backgroundColor: colors.grey3,
    justifyContent: "center",
    alignItems: "center",
    // height:screenheight*0.3,
    // width:screenwidth*0.4,
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 10,
  },
  CardsSelected: {
    borderRadius: 15,
    backgroundColor: "hsl(27, 88%, 58%)",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    marginVertical: 10,
    marginHorizontal: 10,
    // height:screenheight*0.3,
    // width:screenwidth*0.4,
  },
  cardimage: {
    // height:"90%",
    // width:"90%",
    borderRadius: 15,
    padding: 10,
    backgroundColor: colors.white,
  },
  cardTextView: {
    justifyContent: "space-between",
    textAlign: "center",
  },
});
