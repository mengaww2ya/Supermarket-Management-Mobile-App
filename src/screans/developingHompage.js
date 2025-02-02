import React from "react";
import {
  Text,
  View,
  Pressable,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { colors } from "react-native-elements";

export default function DeveloperHomePage({ navigation }) {
  const { width: ScreenWidth, height: ScreenHeight } = useWindowDimensions();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.titleText}>
          Hey! Which role do you want to test?
        </Text>

        <View style={styles.container}>
          {/* Manager Button */}
          <Pressable
            style={[
              styles.button,
              { width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 },
            ]}
            onPress={() => navigation.navigate("ManagerHomePage")}
          >
            <Text style={styles.buttonText}>Manager</Text>
          </Pressable>

          {/* Customer Button */}
          <Pressable
            style={[
              styles.button,
              { width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 },
            ]}
            onPress={() => navigation.navigate("Homepage")}
          >
            <Text style={styles.buttonText}>Customer</Text>
          </Pressable>

          {/* Customer Support Button */}
          <Pressable
            style={[
              styles.button,
              { width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 },
            ]}
            onPress={() => {navigation.navigate("CustomerSuport");}}
          >
            <Text style={styles.buttonText}>Customer Support</Text>
          </Pressable>

          {/* Admin Button */}
          <Pressable
            style={[
              styles.button,
              { width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 },
            ]}
            onPress={() => navigation.navigate("admineHomePage")}
          >
            <Text style={styles.buttonText}>Admin</Text>
          </Pressable>

          {/* Stock Manager Button */}
          <Pressable
            style={[
              styles.button,
              { width: ScreenWidth * 0.4, height: ScreenHeight * 0.12 },
            ]}
            onPress={() => navigation.navigate("stockManagerHome")}
          >
            <Text style={styles.buttonText}>Stock Manager</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  titleText: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 20,
  },
  container: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: 20,
    gap: 15,
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
  buttonText: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
  },
});
