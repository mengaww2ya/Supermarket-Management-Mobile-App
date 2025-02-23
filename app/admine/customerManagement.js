import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";

export default function CustomerManagement({ navigation }) {
  const { width: screenWidth } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        <View style={styles.container}>
          <Text style={styles.titltxt}>Customer Management</Text>

          <View style={styles.buttonView}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Signup")}
            >
              <View style={styles.btnView}>
                <Text style={styles.buttontxt}>Add Customer</Text>

                <Text style={styles.suptxt}>Register New Customer </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("Signup")}
            >
              <View style={styles.btnView}>
                <Text style={styles.buttontxt}>Delete Customer</Text>

                <Text style={styles.suptxt}>Remove Existing Customer </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => {}}>
              <View style={styles.btnView}>
                <Text style={styles.buttontxt}>Update Customer</Text>

                <Text style={styles.suptxt}>Update Existing Customer </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} onPress={() => {}}>
              <View style={styles.btnView}>
                <Text style={styles.buttontxt}>View Customers</Text>

                <Text style={styles.suptxt}>Display All Customers </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    borderRadius: 5,
  },
  buttonView: {
    margin: 10,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
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
  titltxt: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  buttontxt: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
  btnView: {
    backgroundColor: colors.grey5,
    justifyContent: "center",
  },
  suptxt: {
    fontSize: 10,
    textAlign: "center",
    color: "#333",
  },
});
