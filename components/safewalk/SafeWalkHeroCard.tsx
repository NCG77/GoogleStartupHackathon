import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { PressableScale } from "@/components/design-system/PressableScale";
import { motion, radius, spacing, typography } from "@/constants/theme";
import type { MyOpenSafeWalk } from "@/hooks/useMyOpenSafeWalk";
import { useAppTheme } from "@/hooks/useAppTheme";

type Props = {
  /** Newest open walk from Firestore, or null when none is open. */
  walk: MyOpenSafeWalk | null;
  onStart: () => void;
  onOpen: () => void;
};

/**
 * Home hero for Safe Walk. Inactive: burgundy call to action.
 * Active: status reflects the server-side session state only.
 */
export function SafeWalkHeroCard({ walk, onStart, onOpen }: Props) {
  return walk ? (
    <ActiveCard walk={walk} onOpen={onOpen} />
  ) : (
    <InactiveCard onStart={onStart} />
  );
}

function InactiveCard({ onStart }: { onStart: () => void }) {
  const { colors: c, gradients: grads } = useAppTheme();

  return (
    <LinearGradient
      colors={[...grads.important]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.hero}
    >
      <View style={styles.heroTop}>
        <View style={styles.heroIcon}>
          <MaterialIcons
            name="directions-walk"
            size={24}
            color={c.textOnPrimary}
          />
        </View>
        <View style={styles.heroCopy}>
          <Text style={[styles.heroTitle, { color: c.textOnPrimary }]}>
            Safe Walk
          </Text>
          <Text style={styles.heroBody}>
            A guardian follows your live location until you arrive.
          </Text>
        </View>
      </View>
      <PressableScale
        onPress={onStart}
        accessibilityRole="button"
        accessibilityLabel="Start Safe Walk"
        style={[styles.heroButton, { backgroundColor: c.textOnPrimary }]}
      >
        <Text style={[styles.heroButtonLabel, { color: c.primary }]}>
          Start Safe Walk
        </Text>
        <MaterialIcons name="arrow-forward" size={18} color={c.primary} />
      </PressableScale>
    </LinearGradient>
  );
}

function ActiveCard({
  walk,
  onOpen,
}: {
  walk: MyOpenSafeWalk;
  onOpen: () => void;
}) {
  const { colors: c, elevation: elev } = useAppTheme();
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (reduceMotion) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(0.35, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [pulse, reduceMotion]);

  const dotStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  const status =
    walk.state === "sos"
      ? { label: "SOS active", fg: c.danger, bg: c.dangerContainer, icon: "emergency" as const }
      : walk.state === "check_in_pending"
        ? { label: "Check-in needed", fg: c.warning, bg: c.warningContainer, icon: "notification-important" as const }
        : { label: "Safe Walk active", fg: c.success, bg: c.successContainer, icon: "verified-user" as const };

  const destination = walk.destinationLabel ?? "your destination";

  return (
    <PressableScale
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${status.label}. Walking to ${destination}. Open walk`}
      pressedScale={motion.pressScaleCard}
      style={[
        styles.active,
        { backgroundColor: c.surface, borderColor: status.fg, ...elev.card },
      ]}
    >
      <View style={styles.activeHeader}>
        <View style={[styles.statusPill, { backgroundColor: status.bg }]}>
          <Animated.View
            style={[styles.statusDot, { backgroundColor: status.fg }, dotStyle]}
          />
          <Text style={[styles.statusLabel, { color: status.fg }]}>
            {status.label}
          </Text>
        </View>
        <MaterialIcons name={status.icon} size={22} color={status.fg} />
      </View>
      <Text style={[styles.activeTitle, { color: c.textPrimary }]} numberOfLines={2}>
        Walking to {destination}
      </Text>
      {walk.etaMinutes != null ? (
        <Text style={[styles.activeMeta, { color: c.textSecondary }]}>
          Planned walk · about {walk.etaMinutes} min
        </Text>
      ) : null}
      <View style={[styles.activeAction, { borderTopColor: c.divider }]}>
        <Text style={[styles.activeActionLabel, { color: c.primary }]}>
          Open walk
        </Text>
        <MaterialIcons name="chevron-right" size={20} color={c.primary} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  heroTop: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "flex-start",
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroCopy: {
    flex: 1,
    gap: 4,
  },
  heroTitle: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    letterSpacing: typography.tracking.title,
  },
  heroBody: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    color: "rgba(255, 255, 255, 0.82)",
  },
  heroButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    minHeight: 52,
    borderRadius: radius.pill,
  },
  heroButtonLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
  active: {
    borderRadius: radius.xl,
    borderWidth: 1.5,
    padding: spacing.lg,
    gap: spacing.sm,
  },
  activeHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
    letterSpacing: 0.2,
  },
  activeTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    letterSpacing: typography.tracking.title,
    marginTop: spacing.xs,
  },
  activeMeta: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
  activeAction: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: spacing.sm,
    paddingTop: spacing.sm + 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  activeActionLabel: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
  },
});
