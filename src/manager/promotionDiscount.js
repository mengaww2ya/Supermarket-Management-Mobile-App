import { SafeAreaView, ScrollView, View, Text, StyleSheet,TouchableOpacity } from "react-native";
import { colors } from "react-native-elements";

export default function promotionManagement({navigation}) {
  return (
    <SafeAreaView>
      <ScrollView
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Title */}
        <View style={styles.container}>
          <Text style={styles.textTitle}>Promotion Management</Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                alert("Hey! this button is not functional right now.", "ok");
              }}
            >
              <View style={styles.buttonview}>
                <Text style={styles.buttontxt}>special event discounts</Text>
                <Text style={styles.btnsubtitl}>
                  Integrate seasonal or special event discounts
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
                <Text style={styles.buttontxt}>product discounts</Text>
                <Text style={styles.btnsubtitl}>
                  Set up product discounts and offers
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
                <Text style={styles.buttontxt}>discount based on customer</Text>
                <Text style={styles.btnsubtitl}>
                  Apply discount rules based on customer categories
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
                <Text style={styles.buttontxt}>review discounts</Text>
                <Text style={styles.btnsubtitl}>
                  display all aplied discounts
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
                <Text style={styles.buttontxt}>remove discounts</Text>
                <Text style={styles.btnsubtitl}>
                  remove all aplied discounts
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
