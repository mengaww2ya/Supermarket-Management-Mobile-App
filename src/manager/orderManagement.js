import { SafeAreaView, ScrollView, View, Text, StyleSheet,TouchableOpacity } from "react-native";
import { colors } from "react-native-elements";

export default function orderManagement() {
  return (
    <SafeAreaView>
      <ScrollView
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Title */}
        <View style={styles.container}>
          <Text style={styles.textTitle}>Order Management</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Customer orders</Text>
                <Text style={styles.btnsubtitl}>
                  Process and track customer orders
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>manage Order</Text>
                <Text style={styles.btnsubtitl}>
                  Manage pending, completed, and canceled orders
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Return and refunds</Text>
                <Text style={styles.btnsubtitl}>
                  Handle order returns and refunds.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Assign delivery</Text>
                <Text style={styles.btnsubtitl}>
                  Assign delivery agents to orders.
                </Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Notify customer</Text>
                <Text style={styles.btnsubtitl}>
                  Notify customers about order status updates.
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
  textTitle: {
    backgroundColor: colors.grey3,
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    padding: 15,
    marginBottom: 20,
    borderRadius: 5,
  },
  buttonContainer: {
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

