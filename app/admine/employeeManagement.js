import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "react-native-elements";

export default function aemployeeManagement({ navigation }) {
  return (
    <SafeAreaView>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 20 }}
      >
        <View style={styles.container}>
          <Text style={styles.titltxt}>Employee Management</Text>
          <View style={styles.buttonView}>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.navigate("AddEmployee")}
            >
              <View style={styles.viwbutton}>
                <Text style={styles.empytxt}>add new employee</Text>
                <Text style={styles.buttontxt}>Add Employee</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.viwbutton}>
                <Text style={styles.empytxt}> delete existing employee</Text>
                <Text style={styles.buttontxt}>Delete Employee</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.viwbutton}>
                <Text style={styles.empytxt}> update existing employee </Text>
                <Text style={styles.buttontxt}>Update Employee</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button}>
              <View style={styles.viwbutton}>
                <Text style={styles.empytxt}> Display Existing Employee</Text>
                <Text style={styles.buttontxt}>Display Employee List</Text>
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
  viwbutton: {
    backgroundColor:colors.grey5,
    justifyContent:"center",
  },
  empytxt: {
    fontSize: 10,
    textAlign: "center",
    color: "#333",
  },
});