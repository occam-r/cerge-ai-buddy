import Footer from "@components/Footer";
import NetInfo from "@react-native-community/netinfo";
import Home from "@screens/index";
import { initializeCacheDir } from "@utils/cache";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, BackHandler, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

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
          <StatusBar style="auto" animated />
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
