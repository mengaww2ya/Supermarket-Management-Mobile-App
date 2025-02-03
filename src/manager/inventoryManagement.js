import { SafeAreaView, ScrollView, View, Text, StyleSheet,TouchableOpacity } from "react-native";
import { colors } from "react-native-elements";

export default function inventoryManagement() {
  return (
    <SafeAreaView>
      <ScrollView
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Title */}
        <View style={styles.container}>
          <Text style={styles.textTitle}>Inventory Management</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>Stock level</Text>
                <Text style={styles.btnsubtitl}>
                  Monitor stock levels in real-time
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
                <Text style={styles.buttontxt}>Product Detail</Text>
                <Text style={styles.btnsubtitl}>
                  Update product details like price
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
                <Text style={styles.buttontxt}>Stock thresholds</Text>
                <Text style={styles.btnsubtitl}>
                  Set minimum stock thresholds and reorder levels
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
                <Text style={styles.buttontxt}>Expiry date</Text>
                <Text style={styles.btnsubtitl}>
                  Track expiration dates for perishable items
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
                <Text style={styles.buttontxt}>Stock report</Text>
                <Text style={styles.btnsubtitl}>
                  Generate stock reports and analytics
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

