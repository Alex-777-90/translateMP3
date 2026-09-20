import React from "react";
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";

import HomeScreen from "./src/screens/HomeScreen";

export default function App() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0f172a"
      />

      <View style={styles.container}>
        <HomeScreen />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0f172a",
  },

  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
});