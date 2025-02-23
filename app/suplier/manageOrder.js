import React from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
  SafeAreaView,
} from "react-native";
import { colors } from "react-native-elements";
import { useRouter } from "expo-router";
export default function SmanageOrder() {
  const screenWidth = useWindowDimensions().width;
  const screenHeight = useWindowDimensions().height;
  const router =useRouter();
  return (
    <SafeAreaView style={styles.homeContainer}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.container}>
          {/* Welcome Message */}
          <Text style={styles.textTitle}>Manage Order</Text>

          {/* Cards Section */}
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>View Orders</Text>
                <Text style={styles.btnsubtitl}>
                  See all orders placed by the supermarket
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Accept or Reject Orders</Text>
                <Text style={styles.btnsubtitl}>Approve or decline orders</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Estimated Delivery </Text>
                <Text style={styles.btnsubtitl}>
                  Provide Estimated Delivery Time
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  homeContainer: {
    flex: 1,
  },
  container: {
    backgroundColor: "white",
    borderColor: colors.grey5,
    borderWidth: 1,
    alignSelf: "center",
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
