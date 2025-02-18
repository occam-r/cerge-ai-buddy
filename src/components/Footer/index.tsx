import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const SIZE = 50;
const Footer = () => {
  return (
    <View style={styles.container}>
      <Image
        style={styles.image}
        source={require("../../../assets/logos/footer_logo.png")}
      />
      <Text style={styles.text}>AI Buddy</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: SIZE,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    alignItems: "center",
    backgroundColor: "rgb(23 37 84)",
  },
  image: {
    height: SIZE * 0.75,
    width: SIZE * 1.3,
  },
  text: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});

export default React.memo(Footer);
