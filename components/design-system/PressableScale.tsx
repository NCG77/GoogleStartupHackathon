import React from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { motion } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, "style"> & {
  /** Static style only; the scale transform is appended and would override a `transform` here. */
  style?: StyleProp<ViewStyle>;
  /** Scale while held. Defaults to the button press scale. */
  pressedScale?: number;
};

/**
 * Pressable with a quick, non-bouncy scale-down on press.
 * Skips the motion when the OS reduce-motion setting is on.
 */
export function PressableScale({
  style,
  pressedScale = motion.pressScale,
  disabled,
  onPressIn,
  onPressOut,
  children,
  ...rest
}: PressableScaleProps) {
  const reduceMotion = useReducedMotion();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.get() }],
  }));

  const handlePressIn = (e: GestureResponderEvent) => {
    if (!disabled && !reduceMotion) {
      scale.set(withSpring(pressedScale, motion.pressSpring));
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: GestureResponderEvent) => {
    scale.set(withSpring(1, motion.pressSpring));
    onPressOut?.(e);
  };

  return (
    <AnimatedPressable
      {...rest}
      disabled={disabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
