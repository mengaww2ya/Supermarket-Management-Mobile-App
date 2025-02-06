import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { colors } from "react-native-elements";
import { Ionicons } from "@expo/vector-icons";

export default function EmployeeManagement({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.container}>
          <Text style={styles.textTitle}>Employee Management</Text>
          <View style={styles.buttonContainer}>
            {menuOptions.map((option, index) => (
              <TouchableOpacity
                key={index}
                style={styles.button}
                onPress={() =>
                  option.navigate && navigation.navigate(option.navigate)
                }
              >
                <Ionicons
                  name={option.icon}
                  size={30}
                  color="#007bff"
                  style={styles.icon}
                />
                <Text style={styles.buttonText}>{option.title}</Text>
                <Text style={styles.buttonSubtitle}>{option.subtitle}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const menuOptions = [
  {
    title: "Delivery Agent",
    subtitle: "Manage & Assign Deliveries",
    icon: "bicycle-outline",
    navigate: "MDeliveryAgentManagement",
  },
  {
    title: "Customer Assistance",
    subtitle: "Manage Customer Support",
    icon: "people-outline",
  },
  {
    title: "Stock Manager",
    subtitle: "Manage Stock & Inventory",
    icon: "cube-outline",
  },
  {
    title: "Roles & Permissions",
    subtitle: "Assign and Manage Roles",
    icon: "key-outline",
  },
  {
    title: "Schedule",
    subtitle: "Manage Shifts & Work Hours",
    icon: "calendar-outline",
  },
];

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  scrollView: {
    paddingBottom: 20,
  },
  contentContainer: {
    flexGrow: 1,
    // padding: 20,
  },
  container: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  textTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  button: {
    backgroundColor: "#fff",
    width: "48%",
    height: 130,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  icon: {
    marginBottom: 10,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  buttonSubtitle: {
    fontSize: 12,
    color: "#555",
    textAlign: "center",
  },
});
