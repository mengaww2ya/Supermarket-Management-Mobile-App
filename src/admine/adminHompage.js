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
export default function admineHomePage({ navigation }) {
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
            onPress={() => navigation.navigate("aemployeeManagement")}
          >
            <Text style={styles.buttontext}>employee management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("acustomerManagement");
            }}
          >
            <Text style={styles.buttontext}> customer management</Text>
          </Pressable>
          <Pressable
            style={styles.homecard}
            onPress={() => {
              navigation.navigate("asuplierManagement");
            }}
          >
            <Text style={styles.buttontext}>Supplier Management</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  homecontainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 10,
    paddingTop: 20,
  },
  buttonview: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  homecard: {
    backgroundColor: colors.grey5,
    width: "47%", // Responsive grid layout
    height: 120,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
    borderColor: colors.grey4,
    borderWidth: 1,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4, // For Android shadow
  },
  buttontext: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  titlText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
});
