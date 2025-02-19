import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors } from "react-native-elements";
import Icon from "react-native-vector-icons/MaterialIcons"; // Import Material Icons

export default function CustomerSupport() {
  return (
    <SafeAreaView>
      <ScrollView
        style={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.container}>

          <View style={styles.buttoncontainer}>
            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonview}>
                <Icon name="star" size={30} color="#006400" />
                <Text style={styles.buttontxt}>Review</Text>
                <Text style={styles.btnsubtitl}></Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button}>
              <View style={styles.buttonview}>
                <Icon name="feedback" size={30} color="#006400" />
                <Text style={styles.buttontxt}>Feedback</Text>
                <Text style={styles.btnsubtitl}></Text>
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
    padding: 15,

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
  buttonview: {
    alignItems: "center",
  },
  buttontxt: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginTop: 5,
  },
  btnsubtitl: {
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
