import MaterialIcons from "@expo/vector-icons/MaterialIcons";

import React from "react";

import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, spacing, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type WhyReason = {
  icon: React.ComponentProps<typeof MaterialIcons>["name"];

  text: string;
};

export type WhyThisRouteProps = {
  title?: string;
  summary?: string;
  reasons: WhyReason[];
  style?: StyleProp<ViewStyle>;
};

/**
 * Route explanation card — calm, factual, never alarmist.
 */
export function WhyThisRoute({
  title = "Why this route?",
  summary,
  reasons,
  style,
}: WhyThisRouteProps) {
  const { colors: c, elevation: elev } = useAppTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: c.surfaceGlass,
          borderColor: c.border,
          ...elev.card,
        },
        style,
      ]}
      accessibilityRole="summary"
    >
      <View style={styles.header}>
        <View style={[styles.aiBadge, { backgroundColor: c.primaryContainer }]}>
          <MaterialIcons name="auto-awesome" size={14} color={c.primary} />
        </View>
        <Text style={[styles.title, { color: c.textPrimary }]}>{title}</Text>
      </View>

      {summary ? (
        <Text style={[styles.summaryText, { color: c.textPrimary }]}>
          {summary}
        </Text>
      ) : null}

      {reasons.map((reason) => (
        <View key={reason.text} style={styles.row}>
          <MaterialIcons name={reason.icon} size={18} color={c.success} />
          <Text style={[styles.text, { color: c.charcoal }]}>
            {reason.text}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  summaryText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radius.xl,

    borderWidth: 1,

    padding: spacing.md,

    gap: spacing.sm,
  },

  header: {
    flexDirection: "row",

    alignItems: "center",

    gap: spacing.sm,

    marginBottom: spacing.xs,
  },

  aiBadge: {
    width: 28,

    height: 28,

    borderRadius: radius.full,

    alignItems: "center",

    justifyContent: "center",
  },

  title: {
    fontFamily: typography.fontFamily.semibold,

    fontSize: typography.size.bodyLarge,
  },

  row: {
    flexDirection: "row",

    alignItems: "flex-start",

    gap: spacing.sm,
  },

  text: {
    flex: 1,

    fontFamily: typography.fontFamily.regular,

    fontSize: typography.size.body,

    lineHeight: typography.lineHeight.body,
  },
});
