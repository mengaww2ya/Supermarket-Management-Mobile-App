import React from "react";
import {
  Text,
  View,
TouchableOpacity,
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
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>
          <Text style={styles.textTitle}>welcome!</Text>
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("aemployeeManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Employee management</Text>
                <Text style={styles.btnsubtitl}>
                  {" "}
                  add,delet,update employee
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("acustomerManagement");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Customer management</Text>
                <Text style={styles.btnsubtitl}>
                  {" "}
                  add,delet,update Customer
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                navigation.navigate("asuplierManagement");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Supplier Management</Text>
                <Text style={styles.btnsubtitl}>
                  {" "}
                  add,delet,update Supplier
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
const styles = StyleSheet.create({
  homecontainer: {
    margin: 10,
  },
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
  },
  buttoncontainer: {
    margin: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  textTitle: {
    backgroundColor: colors.grey3,
    color: "white",
    fontSize: 20,
    fontWeight: "bold",
    padding: 10,
    margin: 10,
    textAlign: "center",
    borderRadius:5,
  },
  button: {
    backgroundColor: colors.grey5,
    width: "47%",
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
    elevation: 4,
  },
  buttontxt: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFF",
    marginBottom: 5,
    color: "#333",
  },
  btnsubtitl: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
