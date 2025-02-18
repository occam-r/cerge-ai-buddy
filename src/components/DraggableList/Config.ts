import { Easing } from "react-native-reanimated";

export const CARD_HEIGHT = 200;
export const COL = 2;
export const SPLIT = "KJTN";

export const animationConfig = {
  easing: Easing.inOut(Easing.ease),
  duration: 350,
};

export const getPosition = (position: number, CARD_WIDTH: number) => {
  "worklet";
  return {
    x: position % COL === 0 ? 0 : CARD_WIDTH,
    y: Math.floor(position / COL) * CARD_HEIGHT,
  };
};

export const getOrder = (
  tx: number,
  ty: number,
  max: number,
  CARD_WIDTH: number
) => {
  "worklet";
  const x = Math.round(tx / CARD_HEIGHT) * CARD_WIDTH;
  const y = Math.round(ty / CARD_HEIGHT) * CARD_WIDTH;
  const row = Math.max(y, 0) / CARD_WIDTH;
  const col = Math.max(x, 0) / CARD_WIDTH;
  return Math.min(row * COL + col, max);
};
