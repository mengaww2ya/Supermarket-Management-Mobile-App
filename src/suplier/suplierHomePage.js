import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
  Modal,
} from "react-native";
import { colors } from "react-native-elements";
 const screenWidth = useWindowDimensions().width;
  const screenHeight = useWindowDimensions().height;
export default function suplierHome() {
  return (
    <SafeAreaView style={{flex:1}}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.container}>
          {/* Welcome Message */}
          <Text style={styles.textTitle}>Welcome!</Text>

          {/* Cards Section */}
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("emplyeeManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Manage Product</Text>
                <Text style={styles.btnsubtitl}>
                  Manage Product Supply for supermarket
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("customerManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Manage Order</Text>
                <Text style={styles.btnsubtitl}>
                  Manage Orders from Supermarket
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("promotionManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Manage Deliveries</Text>
                <Text style={styles.btnsubtitl}>
                  Schedule,Track,Assign delivery
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("inventoryManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Payment & Invoicing</Text>
                <Text style={styles.btnsubtitl}>
                  View,Request,Track Outstanding payments
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("orderManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Communication & Alerts</Text>
                <Text style={styles.btnsubtitl}>
                  Receive Order,Low-Stock alert
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("saleRevenueManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Performance & Analytics</Text>
                <Text style={styles.btnsubtitl}>
                  View Sales Reports ,Analytics
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("suplierManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Supplier Management</Text>
                <Text style={styles.btnsubtitl}>
                  Add, update, and remove suppliers
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("alertNotifManagement")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>
                  Manage Profile & Business Info
                </Text>
                <Text style={styles.btnsubtitl}>Update Business Details</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <Modal></Modal>
    </SafeAreaView>
    
  );
}
const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    alignSelf: "center",
  },
  buttoncontainer: {
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
  },
  button: {
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
