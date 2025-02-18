import React, { useEffect } from "react";
import Animated, {
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { CARD_HEIGHT, COL } from "./Config";
import Item from "./Item";

interface DraggableListProps {
  children: React.ReactNode;
  onDragEnd: (positions: Record<string, number>) => void;
}

const DraggableList: React.FC<DraggableListProps> = React.memo(
  ({ children, onDragEnd }) => {
    const scrollY = useSharedValue(0);
    const scrollView = useAnimatedRef<Animated.ScrollView>();
    const childrenCount = useSharedValue(React.Children.count(children));

    const positions = useSharedValue<Record<string, number>>(
      React.Children.toArray(children).reduce((acc, child, index) => {
        const element = child as React.ReactElement<{ id: string }>;
        acc[element.props.id] = index;
        return acc;
      }, {} as Record<string, number>)
    );

    useEffect(() => {
      const currentCount = React.Children.count(children);

      if (currentCount !== childrenCount.value) {
        const newPositions = React.Children.toArray(children).reduce(
          (acc, child, index) => {
            const element = child as React.ReactElement<{ id: string }>;
            const id = element.props.id;

            acc[id] =
              positions.value[id] !== undefined ? positions.value[id] : index;
            return acc;
          },
          {} as Record<string, number>
        );

        const sortedIds = Object.keys(newPositions).sort(
          (a, b) => newPositions[a] - newPositions[b]
        );

        const finalPositions = sortedIds.reduce((acc, id, index) => {
          acc[id] = index;
          return acc;
        }, {} as Record<string, number>);

        positions.value = finalPositions;
        childrenCount.value = currentCount;
      }
    }, [children]);

    const onScroll = useAnimatedScrollHandler({
      onScroll: ({ contentOffset: { y } }) => {
        scrollY.value = y;
      },
    });

    return (
      <Animated.ScrollView
        ref={scrollView}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          height: Math.ceil(React.Children.count(children) / COL) * CARD_HEIGHT,
        }}
      >
        {React.Children.map(children, (child) => {
          const element = child as React.ReactElement<{ id: string }>;
          return (
            <Item
              key={element.props.id}
              positions={positions}
              id={element.props.id}
              onDragEnd={onDragEnd}
              scrollView={scrollView}
              scrollY={scrollY}
            >
              {child}
            </Item>
          );
        })}
      </Animated.ScrollView>
    );
  }
);

export default DraggableList;
