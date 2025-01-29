import React from "react";
import {
  Text,
  View,
  Pressable,
  StyleSheet,
  FlatList,
  ScrollView,
  useWindowDimensions,
  Image,
} from "react-native";
import { colors } from "react-native-elements";
import { ScreenWidth, ScreenHeight } from "react-native-elements/dist/helpers";
export default function admoneHomePage({ navigation }) {
  return (
    <View style={styles.homecontainer}>
      <ScrollView
        style={{ flex: 1, paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Text style={styles.titlText}>welcome!</Text>
        <View style={styles.buttonview}>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("emplyeeManagement");
            }}
          >
            <Text style={styles.buttontext}>employee management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("customerManagement");
            }}
          >
            <Text style={styles.buttontext}> customer management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("promotionManagement");
            }}
          >
            <Text style={styles.buttontext}>
              promotion and discount management
            </Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("inventoryManagement");
            }}
          >
            <Text style={styles.buttontext}>Inventory Management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("orderManagement");
            }}
          >
            <Text style={styles.buttontext}>Order Management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("saleRevenueManagement");
            }}
          >
            <Text style={styles.buttontext}>Sales and Revenue Management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("suplierManagement");
            }}
          >
            <Text style={styles.buttontext}>Supplier Management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("alertNotifManagement");
            }}
          >
            <Text style={styles.buttontext}>Alerts and Notifications</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  homecontainer: {
    justifyContent: "space-evenly",
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: 10,
    rowGap: 10,
  },
  buttonview: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 10,
    rowGap: 20,
    alignContent: "center",
    alignSelf: "center",
  },
  homecard: {
    backgroundColor: colors.grey5,
    width: ScreenWidth * 0.3,
    height: ScreenHeight * 0.2,
    justifyContent: "center",
    borderColor: colors.grey4,
    borderWidth: 1,
    borderRadius: 5,
    bordershadowColor: colors.grey0,
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 2,
  },
  buttontext: {
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
  },
  titlText: {
    padding: 10,
    fontFamily: "new times roman",
    fontSize: 20,
    textAlign: "center",
    backgroundColor: colors.grey5,
    fontWeight: "bold",
    fontVariant: ["small-caps"],
  },
});
