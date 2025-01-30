import React, { useState, useEffect } from "react";
import {
  Button,
  Dimensions,
  Image,
  Pressable,
  useWindowDimensions,
  StyleSheet,
  Text,
  Modal,
  ScrollView,
  View,
} from "react-native";
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
    products,
    currentIndex,
  } = route.params;
  const [index, setIndex] = useState(currentIndex); // Track current product index
  const [product, setProduct] = useState(products[index]); // Track displayed product

  useEffect(() => {
    setProduct(products[index]);
  }, [index]);

  const handleNext = () => {
    if (index < products.length - 1) {
      setIndex(index + 1);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(index - 1);
    }
  };
  const [modalVisible, setModalVisible] = useState(false);
  const likeItem = () => {
    setModalVisible(true);
  };

  const backwardIcon = (
    <Icon
      name="arrow-back"
      type="material"
      color={index === 0 ? "gray" : "black"}
      size={30}
    />
  );
  const forwardIcon = (
    <Icon
      name="arrow-forward"
      type="material"
      color={index === products.length - 1 ? "gray" : "black"}
      size={30}
    />
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
            <Pressable onPress={handlePrev}>
              <Text>{backwardIcon}</Text>
            </Pressable>

            <Pressable onPress={handleNext}>
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
                alert("Hey! this button is not functional right now.", "ok")
              }
            >
              <Text style={styles.btntext}>Add to cart</Text>
            </Pressable>
            <Pressable style={styles.btns} onPress={likeItem}>
              <Text style={styles.btntext}>like</Text>
            </Pressable>
          </View>
        </View>
        <Footer navigation={navigation} />
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.liketitl}>
              How much do you like this{" "}
              <Text
                styele={{
                  fontStyle: "italic",
                  fontSize: 20,
                  fontWeight: "bold",
                }}
              >
                {ProductName}
              </Text>
            </Text>

            {[
              "1: Very poor",
              "2: Below average",
              "3: Average",
              "4: Good",
              "5: Excellent",
            ].map((text, index) => (
              <Pressable key={index} style={styles.stylbtn}>
                <Text style={styles.liketxt}>{text}</Text>
              </Pressable>
            ))}

            {/* Close Button */}
            <Pressable
              style={styles.closeButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.closeText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

// return (
//   <View style={styles.likecontainer}>
//     <Text style={styles.liketitl}>how much you like this Product?</Text>
//     <Pressable style={styles.stylbtn}>
//       <Text style={styles.liketxt}>1:-Very poor</Text>
//     </Pressable>
//     <Pressable style={styles.stylbtn}>
//       <Text style={styles.liketxt}>2:Below average</Text>
//     </Pressable>
//     <Pressable style={styles.stylbtn}>
//       <Text style={styles.liketxt}>3:-Average</Text>
//     </Pressable>
//     <Pressable style={styles.stylbtn}>
//       <Text style={styles.liketxt}>4:-Good</Text>
//     </Pressable>
//     <Pressable style={styles.stylbtn}>
//       <Text style={styles.liketxt}>5:-Excellent</Text>
//     </Pressable>
//   </View>
// );

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
  btntext: {
    textAlign: "center",
    fontFamily: "new times roman",
    fontWeight: "bold",
    fontSize: 20,
  },
  likecontainer: {
    backgroundColor: "white",
    borderColor: colors.grey4,
    borderWidth: 1,
    justifyContent: "center",
    padding: 10,
  },
  liketitl: {
    fontSize: 20,
    fontWeight: "bold",
    fontVariant: ["small-caps"],
  },
  stylbtn: {
    backgroundColor: colors.grey1,
    borderColor: colors.grey0,
    borderWidth: 1,
    backgroundColor: "#ddd",
    padding: 10,
    marginVertical: 5,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  liketxt: {
    fontSize: 18,
    color: "white",
  },
  closeButton: {
    marginTop: 10,
    backgroundColor: "#ff0000",
    padding: 10,
    borderRadius: 5,
    width: "100%",
    alignItems: "center",
  },
  closeText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContainer: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
  },
});
