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
export default function suplierHome() {
  const router =useRouter();
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.container}>
          <Text style={styles.textTitle}>Welcome!</Text>
          <View style={styles.buttoncontainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => router.push("")}
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
              onPress={() => router.push("")}
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
              onPress={() => router.push("")}
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
              onPress={() => router.push("")}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Performance & Analytics</Text>
                <Text style={styles.btnsubtitl}>
                  View Sales Reports ,Analytics
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
