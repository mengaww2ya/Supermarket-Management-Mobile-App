import {
  Button,
  Dimensions,
  Image,
  Pressable,
  useWindowDimensions,
} from "react-native";
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
      style={{ flex: 1, marginBottom: "15%", paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }}
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
            <Text style={styles.text}>
              Product Name:{" "}
              <Text style={styles.recievedMsg}>{ProductName}</Text>
            </Text>
            <Text style={styles.text}>
              Product ID:<Text style={styles.recievedMsg}>{id}</Text>{" "}
            </Text>
            <Text style={styles.text}>
              Product Category:
              <Text style={styles.recievedMsg}>{catagory}</Text>
            </Text>
          </View>
          <Text style={styles.title}>Pricing</Text>
          <View>
            <Text style={styles.text}>
              Price: <Text style={styles.recievedMsg}>{Price}</Text>
            </Text>
            <Text style={styles.text}>
              Discount:<Text style={styles.recievedMsg}>{DiscountPrice}</Text>
            </Text>
          </View>
          <Text style={styles.title}>Product Details </Text>
          <View>
            <Text style={styles.text}>
              Description:
              <Text style={styles.recievedMsg}>{ShortDescription}</Text>
            </Text>
            <Text style={styles.text}>
              Ingredients: <Text style={styles.recievedMsg}>{ingredients}</Text>
            </Text>
            <Text style={styles.text}>
              Nutritional Info:
              <Text style={styles.recievedMsg}>{NutritionalInformation}</Text>
            </Text>
          </View>
          <Text style={styles.title}>Packaging Information</Text>
          <View>
            <Text style={styles.text}>
              Amount:<Text style={styles.recievedMsg}>{Amount}</Text>
            </Text>
            <Text style={styles.text}>
              Package Type:<Text style={styles.recievedMsg}>{packagetype}</Text>
            </Text>
          </View>
          <Text style={styles.title}>Supplier Information</Text>
          <View>
            <Text style={styles.text}>
              Supplier Name:<Text style={styles.recievedMsg}>{suplier}</Text>
            </Text>
            <Text style={styles.text}>
              Origin:<Text style={styles.recievedMsg}>{origin}</Text>
            </Text>
          </View>
          <Text style={styles.title}>Customer Reviews and Ratings</Text>
          <View>
            <Text style={styles.text}>
              Average Rating: <Text style={styles.recievedMsg}>{Rating}</Text>
            </Text>
            <Text style={styles.text}>
              Reviews: <Text style={styles.recievedMsg}>{NumberofReviews}</Text>
            </Text>
          </View>
          <View>
            <Pressable
              style={styles.btns}
              onPress={() =>
                alert("Hey this button is not functional right now", "ok")
              }
            >
              <Text style={styles.btntext}>Add to cart</Text>
            </Pressable>
            <Pressable
              style={styles.btns}
              onPress={() =>
                alert("Hey this button is not functional right now", "ok")
              }
            >
              <Text style={styles.btntext}>like</Text>
            </Pressable>
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
    backgroundColor: "white",
    paddingHorizontal: 15,
    paddingVertical: 10,
    margin: 10,
    borderColor: colors.grey5,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    // textAlign:"center",
    // backgroundColor:colors.grey3,
  },
  text: {
    fontSize: 15,
  },
  recievedMsg: {
    fontWeight: "bold",
    fontStyle: "italic",
  },
  Button: {
    justifyContent: "space-evenly",
    flexDirection: "row",
  },
  imageview: {
    width: screenwidth,
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
  btns: {
    backgroundColor: colors.grey4,
    padding: 10,
    justifyContent: "center",
    margin: 5,
    alignItems: "center",
    borderRadius: 5,
  },
  btntext:{
    textAlign:"center",
    fontFamily:"new times roman",
    fontWeight:"bold",
    fontSize:20,
  }
});
