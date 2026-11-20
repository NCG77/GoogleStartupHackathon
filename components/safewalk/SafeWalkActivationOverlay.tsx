import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

const HOLD_MS = 1100;
const TOTAL_MS = motion.normal + HOLD_MS + motion.slow;

type Props = {
  title: string;
  subtitle?: string;
  /** Called once the overlay has fully faded out. */
  onDone: () => void;
};

/**
 * Brief confirmation shown once a Safe Walk session is confirmed active.
 * Never intercepts touches, so SOS and walk controls stay usable underneath.
 */
export function SafeWalkActivationOverlay({ title, subtitle, onDone }: Props) {
  const { colors: c, elevation: elev } = useAppTheme();
  const reduceMotion = useReducedMotion();

  const fade = useSharedValue(0);
  const ring = useSharedValue(reduceMotion ? 1 : 0.6);
  const check = useSharedValue(reduceMotion ? 1 : 0.4);

  useEffect(() => {
    const out = Easing.in(Easing.cubic);
    const inEase = Easing.out(Easing.cubic);
    fade.value = withSequence(
      withTiming(1, { duration: motion.normal, easing: inEase }),
      withDelay(HOLD_MS, withTiming(0, { duration: motion.slow, easing: out })),
    );
    if (!reduceMotion) {
      ring.value = withTiming(1, { duration: motion.screen, easing: inEase });
      check.value = withDelay(
        motion.micro,
        withTiming(1, { duration: motion.normal, easing: Easing.out(Easing.back(1.6)) }),
      );
    }
    const t = setTimeout(onDone, TOTAL_MS + 40);
    return () => clearTimeout(t);
    // Runs once per mount; parent unmounts the overlay via onDone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const backdropStyle = useAnimatedStyle(() => ({ opacity: fade.value }));
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ring.value }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: check.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, styles.root, backdropStyle]}
      accessible
      accessibilityLiveRegion="polite"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} />
      <View
        style={[
          styles.card,
          { backgroundColor: c.surfaceElevated, borderColor: c.border, ...elev.cardLift },
        ]}
      >
        <Animated.View
          style={[styles.ring, { backgroundColor: c.primaryContainer }, ringStyle]}
        >
          <Animated.View
            style={[styles.core, { backgroundColor: c.primary }, checkStyle]}
          >
            <MaterialIcons name="check" size={34} color={c.textOnPrimary} />
          </Animated.View>
        </Animated.View>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textSecondary }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: "center",
    justifyContent: "center",
    zIndex: 60,
    elevation: 60,
  },
  card: {
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: 340,
  },
  ring: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  core: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    letterSpacing: typography.tracking.title,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    textAlign: "center",
  },
});
