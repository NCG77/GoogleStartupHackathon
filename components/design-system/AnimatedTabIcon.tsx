import { LinearGradient } from "expo-linear-gradient";

import React, { useEffect } from "react";

import { StyleSheet, type ColorValue } from "react-native";

import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { motion, radius, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

type TabIconProps = {
  focused: boolean;

  color: ColorValue;

  children: (opts: { color: string; size: number }) => React.ReactNode;
};

/** Tab glyph with a burgundy pill that eases in behind the active tab. */

export function AnimatedTabIcon({ focused, color, children }: TabIconProps) {
  const { colors: c, gradients: grads } = useAppTheme();

  const reduceMotion = useReducedMotion();

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    const target = focused ? 1 : 0;

    progress.value = reduceMotion
      ? target
      : withSpring(target, { damping: 20, stiffness: 260, mass: 0.6 });
  }, [focused, progress, reduceMotion]);

  const wrapStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + (motion.iconActive - 1) * progress.value }],
  }));

  const washStyle = useAnimatedStyle(() => ({
    opacity: progress.value,

    transform: [{ scaleX: 0.6 + 0.4 * progress.value }],
  }));

  return (
    <Animated.View style={[styles.iconWrap, wrapStyle]}>
      <Animated.View pointerEvents="none" style={[styles.wash, washStyle]}>
        <LinearGradient
          colors={[...grads.navActive]}

          start={{ x: 0, y: 0 }}

          end={{ x: 1, y: 1 }}

          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      {children({
        color: focused ? c.textOnPrimary : String(color),

        size: 22,
      })}
    </Animated.View>
  );
}

type TabLabelProps = {
  focused: boolean;

  children: string;
};

export function AnimatedTabLabel({ focused, children }: TabLabelProps) {
  const { colors: c } = useAppTheme();

  const progress = useSharedValue(focused ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(focused ? 1 : 0, { duration: motion.normal });
  }, [focused, progress]);

  const style = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,

      [0, 1],

      [c.textSecondary, c.primary],
    ),

    opacity: 0.75 + 0.25 * progress.value,
  }));

  return (
    <Animated.Text style={[styles.label, style]}>{children}</Animated.Text>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 48,

    height: 30,

    borderRadius: radius.pill,

    alignItems: "center",

    justifyContent: "center",

    overflow: "hidden",
  },

  wash: {
    ...StyleSheet.absoluteFill,

    borderRadius: radius.pill,

    overflow: "hidden",
  },

  label: {
    fontSize: 11,

    fontFamily: typography.fontFamily.semibold,

    marginTop: 2,
  },
});
