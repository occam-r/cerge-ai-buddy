import Reactotron from "reactotron-react-native";
import { expo } from "./app.json";
Reactotron.configure({
  name: expo.name,
})
  .useReactNative()
  .connect();
