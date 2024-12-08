import { Button, Image } from "react-native";
import { StyleSheet, Text, ScrollView, View } from "react-native";
import { colors, Icon } from "react-native-elements";
import Footer from "../subscrean/foter.js";

export default function Item({ route, navigation }) {
  const { image } = route.params;
  const backwardIcon = (
    <Icon name="arrow-back" type="material" color="#000" size={30} />
  );
  const forwardIcon = (
    <Icon name="arrow-forward" type="material" color="#000" size={30} />
  );
  return (
    <ScrollView
      style={{ flex: 1, paddingBottom: 20 }}
      showsVerticalScrollIndicator={true}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={{ flex: 1 }}>
        <View style={styles.itemInfoContainer}>
          <View>
            <Image style={styles.cardimage} source={{ uri: image }} />
          </View>
          <View style={styles.Button}>
            <Button title={backwardIcon} />

            <Button title={forwardIcon} />
          </View>
          <Text style={styles.title}>Basic Information</Text>
          <View>
            <Text style={styles.text}>Product Name:</Text>
            <Text style={styles.text}>Product ID:</Text>
            <Text style={styles.text}>Product Category:</Text>
            <Text style={styles.text}>Product Brand:</Text>
          </View>
          <Text style={styles.title}>Pricing</Text>
          <View>
            <Text style={styles.text}>Price:</Text>
            <Text style={styles.text}>Discount:</Text>
          </View>
          <Text style={styles.title}>Product Details</Text>
          <View>
            <Text style={styles.text}>Description:</Text>
            <Text style={styles.text}>Ingredients:</Text>
            <Text style={styles.text}>Nutritional Information:</Text>
          </View>
          <Text style={styles.title}>Packaging Information</Text>
          <View>
            <Text style={styles.text}>Amount:</Text>
            <Text style={styles.text}>Package Type:</Text>
          </View>
          <Text style={styles.title}>Supplier Information</Text>
          <View>
            <Text style={styles.text}>Supplier Name:</Text>
            <Text style={styles.text}>Origin:</Text>
          </View>
          <Text style={styles.title}>Customer Reviews and Ratings</Text>
          <View>
            <Text style={styles.text}>Average Rating:</Text>
            <Text style={styles.text}>Reviews: </Text>
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
  cardimage: {
    width: "100%",
    height: "100%",
    borderRadius: 15,
    padding: 10,
    backgroundColor: colors.white,
  },
});
