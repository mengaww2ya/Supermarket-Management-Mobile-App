import { Button, Dimensions, Image, Pressable, useWindowDimensions } from "react-native";
import { StyleSheet, Text, ScrollView, View } from "react-native";
import { colors, Icon } from "react-native-elements";
import Footer from "../subscrean/foter.js";
const screenwidth = Dimensions.get("window").width;
const screenheight = Dimensions.get("window").height;
export default function Item({ route, navigation }) {
  const {
    image,
    ProductName,
    Price,
    DiscountPrice,
    Rating,
    NumberofReviews,
    ShortDescription,
    id,
    suplier,
    ingredients,
    NutritionalInformation,
    Amount,
    packagetype,
    catagory,
    origin,
  } = route.params;
  const backwardIcon = (
    <Icon name="arrow-back" type="material" color="#000" size={30} />
  );
  const forwardIcon = (
    <Icon name="arrow-forward" type="material" color="#000" size={30} />
  );
  return (
    <ScrollView
      style={{ flex: 1,marginBottom:"15%", paddingBottom: 20,}}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }
    }
    >
      <View>
        <View style={styles.itemInfoContainer}>
          <View style={styles.imageview}>
            <Image style={styles.cardimage} source={image} />
          </View>
          <View style={styles.Button}>
            <Pressable
              onPress={(id) => {
                NUM = id - 1;
                id == NUM;
              }}
            >
              <Text>{backwardIcon}</Text>
            </Pressable>

            <Pressable
              onPress={(id) => {
                NUM = id + 1;
                id == NUM;
              }}
            >
              <Text>{forwardIcon}</Text>
            </Pressable>
          </View>
          <Text style={styles.title}>Basic Information</Text>
          <View>
            <Text style={styles.text}>Product Name:{ProductName}</Text>
            <Text style={styles.text}>Product ID:{id}</Text>
            <Text style={styles.text}>Product Category:{catagory}</Text>
          </View>
          <Text style={styles.title}>Pricing</Text>
          <View>
            <Text style={styles.text}>Price:{Price}</Text>
            <Text style={styles.text}>Discount:{DiscountPrice}</Text>
          </View>
          <Text style={styles.title}>Product Details</Text>
          <View>
            <Text style={styles.text}>Description:{ShortDescription}</Text>
            <Text style={styles.text}>Ingredients:{ingredients}</Text>
            <Text style={styles.text}>
              Nutritional Information:{NutritionalInformation}
            </Text>
          </View>
          <Text style={styles.title}>Packaging Information</Text>
          <View>
            <Text style={styles.text}>Amount:{Amount}</Text>
            <Text style={styles.text}>Package Type:{packagetype}</Text>
          </View>
          <Text style={styles.title}>Supplier Information</Text>
          <View>
            <Text style={styles.text}>Supplier Name:{suplier}</Text>
            <Text style={styles.text}>Origin:{origin}</Text>
          </View>
          <Text style={styles.title}>Customer Reviews and Ratings</Text>
          <View>
            <Text style={styles.text}>Average Rating:{Rating}</Text>
            <Text style={styles.text}>Reviews: {NumberofReviews}</Text>
          </View>
        </View>
        <Footer navigation={navigation} />
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  itemInfoContainer: {
    flex: 1,
    backgroundColor: colors.grey4,
    paddingHorizontal: 15,
  },
  title: {
    fontSize: 20,
    // textAlign:"center",
    // backgroundColor:colors.grey3,
  },
  text: {
    fontSize: 15,
  },
  Button: {
    justifyContent: "space-evenly",
    flexDirection: "row",
  },
  imageview: {
    width: screenwidth ,
    height: screenheight * 0.5,
    alignContent: "center",
    alignItems: "center",
  },
  cardimage: {
    alignContent: "center",
    width: "100%",
    height: "100%",
    borderRadius: 15,
    padding: 10,
    backgroundColor: colors.white,
  },
});
