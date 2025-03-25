import Footer from "@components/Footer";
import NetInfo, { NetInfoStateType } from "@react-native-community/netinfo";
import Home from "@screens/index";
import { initializeCacheDir } from "@utils/cache";
import colors from "@utils/colors";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, BackHandler, Keyboard, StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

const App = () => {
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const initApp = async () => {
      await initializeCacheDir();
    };
    initApp();
  }, []);

  const handleBackAction = useCallback(() => {
    Alert.alert(
      "Exit App",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Exit", onPress: () => BackHandler.exitApp() },
      ],
      { cancelable: true }
    );
    return true;
  }, []);

  useEffect(() => {
    let netInfoUnsubscribe: (() => void) | null = null;
    let keyboardShowListener: { remove: () => void } | null = null;
    let keyboardHideListener: { remove: () => void } | null = null;

    try {
      netInfoUnsubscribe = NetInfo.addEventListener((state) => {
        setIsOnline(
          state.isConnected === true && state.type !== NetInfoStateType.none
        );
      });

      keyboardShowListener = Keyboard.addListener("keyboardDidShow", () => {
        setIsKeyboardVisible(true);
      });

      keyboardHideListener = Keyboard.addListener("keyboardDidHide", () => {
        setIsKeyboardVisible(false);
      });

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        handleBackAction
      );

      return () => {
        netInfoUnsubscribe?.();
        keyboardShowListener?.remove();
        keyboardHideListener?.remove();
        backHandler.remove();
      };
    } catch (error) {
      console.error("Error setting up app listeners:", error);
    }
  }, [handleBackAction]);

  const FooterComponent = useMemo(() => {
    return !isKeyboardVisible ? <Footer /> : null;
  }, [isKeyboardVisible]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={styles.rootView}>
        <SafeAreaView edges={["top"]} style={styles.container}>
          <StatusBar style="inverted" animated />
          <Home isOnline={isOnline} />
          {FooterComponent}
        </SafeAreaView>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  rootView: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default React.memo(App);
