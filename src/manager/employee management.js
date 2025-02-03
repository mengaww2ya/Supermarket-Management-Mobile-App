import { SafeAreaView, ScrollView, View,Text, StyleSheet, TouchableOpacity } from "react-native";
import { colors } from "react-native-elements";

export default function emplyeeManagement(){
    return (
      <SafeAreaView>
        <ScrollView
          style={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.container}>
            <Text style={styles.textTitle}>Employee management</Text>
            <View style={styles.buttoncontainer}>
              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>Delivery Agent</Text>
                  <Text style={styles.btnsubtitl}> Manage, asign Delivery</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>Customer Assistance</Text>
                  <Text style={styles.btnsubtitl}>
                    Manage Customer Assistance
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>Customer Assistance</Text>
                  <Text style={styles.btnsubtitl}>
                    Manage Customer Assistance
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>Stock Manager</Text>
                  <Text style={styles.btnsubtitl}>Manage stock Manager</Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>
                    Assign roles and permissions
                  </Text>
                  <Text style={styles.btnsubtitl}>Manage permissions</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.button}>
                <View style={styles.buttonview}>
                  <Text style={styles.buttontxt}>
                    Schedule
                  </Text>
                  <Text style={styles.btnsubtitl}>
                    Schedule shifts and manage work hours
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
    textAlign:"center",
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