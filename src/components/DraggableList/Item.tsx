import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  AnimatedRef,
  runOnJS,
  scrollTo,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  animationConfig,
  CARD_HEIGHT,
  COL,
  getOrder,
  getPosition,
} from "./Config";

interface ItemProps {
  children: React.ReactNode;
  positions: SharedValue<Record<string, number>>;
  id: string;
  onDragEnd: (positions: Record<string, number>) => void;
  scrollView: AnimatedRef<Animated.ScrollView>;
  scrollY: SharedValue<number>;
}

const Item: React.FC<ItemProps> = React.memo((props) => {
  const { children, positions, id, onDragEnd, scrollView, scrollY } = props;

  const containerHeight = Dimensions.get("window").height - CARD_HEIGHT;
  const CARD_WIDTH = (Dimensions.get("window").width - 12) / COL;
  const contentHeight =
    Math.ceil(Object.keys(positions.value).length / COL) * CARD_HEIGHT;
  const isGestureActive = useSharedValue(false);
  const initialPosition = getPosition(positions.value[id] || 0, CARD_WIDTH);
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  useAnimatedReaction(
    () => positions.value[id],
    (newOrder) => {
      if (!isGestureActive.value && typeof newOrder === "number") {
        const pos = getPosition(newOrder, CARD_WIDTH);
        translateX.value = withTiming(pos.x, animationConfig);
        translateY.value = withTiming(pos.y, animationConfig);
      }
    }
  );

  const panGesture = Gesture.Pan()
    .activateAfterLongPress(350)
    .onStart(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
      isGestureActive.value = true;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;

      if (!isNaN(translateX.value) && !isNaN(translateY.value)) {
        const newOrder = getOrder(
          translateX.value,
          translateY.value,
          Object.keys(positions.value).length - 1,
          CARD_WIDTH
        );

        const oldOrder = positions.value[id];
        if (newOrder !== oldOrder) {
          const newPositions = { ...positions.value };
          const idToSwap = Object.keys(newPositions).find(
            (key) => newPositions[key] === newOrder
          );
          if (idToSwap) {
            newPositions[id] = newOrder;
            newPositions[idToSwap] = oldOrder;
            positions.value = newPositions;
          }
        }
      }

      const lowerBound = scrollY.value;
      const upperBound = lowerBound + containerHeight;
      const maxScroll = Math.max(0, contentHeight - containerHeight);

      if (translateY.value < lowerBound && scrollY.value > 0) {
        const diff = Math.min(lowerBound - translateY.value, scrollY.value);
        scrollY.value = Math.max(0, scrollY.value - diff);
        scrollTo(scrollView, 0, scrollY.value, false);
        contextY.value -= diff;
        translateY.value = contextY.value + event.translationY;
      }

      if (translateY.value > upperBound && scrollY.value < maxScroll) {
        const diff = Math.min(
          translateY.value - upperBound,
          maxScroll - scrollY.value
        );
        scrollY.value = Math.min(maxScroll, scrollY.value + diff);
        scrollTo(scrollView, 0, scrollY.value, false);
        contextY.value += diff;
        translateY.value = contextY.value + event.translationY;
      }
    })
    .onEnd(() => {
      const newPosition = getPosition(positions.value[id] || 0, CARD_WIDTH);
      translateX.value = withTiming(newPosition.x, animationConfig, () => {
        isGestureActive.value = false;
        runOnJS(onDragEnd)(positions.value);
      });
      translateY.value = withTiming(newPosition.y, animationConfig);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    position: "absolute",
    top: 0,
    left: 0,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    zIndex: isGestureActive.value ? 100 : 0,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: withSpring(isGestureActive.value ? 1.1 : 1) },
    ],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <GestureDetector gesture={panGesture}>
        <Animated.View style={StyleSheet.absoluteFill}>
          {children}
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
});

export default Item;
