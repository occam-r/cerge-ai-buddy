import NetInfo from "@react-native-community/netinfo";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Footer from "./components/Footer";
import Home from "./Home";
import { initializeCacheDir } from "./utils/cache";

const App = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    initializeCacheDir();
  }, []);

  const handleBackAction = useCallback(() => {
    Alert.alert("Exit App", "Are you sure you want to exit?", [
      { text: "Cancel", style: "cancel" },
      { text: "Exit", onPress: () => BackHandler.exitApp() },
    ]);
    return true;
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      handleBackAction
    );

    return () => backHandler.remove();
  }, [handleBackAction]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((net) => {
      setIsOnline(!!net.isConnected);
    });
    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView>
        <SafeAreaView edges={["top"]} style={styles.container}>
          <StatusBar style="auto" />
          <Home isOnline={isOnline} />
          <Footer />
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
});

export default React.memo(App);
