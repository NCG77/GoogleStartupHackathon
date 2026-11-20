import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { radius, spacing, touch, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { PressableScale } from "./PressableScale";

export type PrimaryButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  loading?: boolean;
  fullWidth?: boolean;
  /** Optional leading icon. */
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({
  label,
  loading = false,
  fullWidth = true,
  icon,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: PrimaryButtonProps) {
  const { colors: c, gradients: grads } = useAppTheme();
  const isDisabled = !!disabled || loading;
  const [pressed, setPressed] = useState(false);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[
        styles.wrap,
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <LinearGradient
        colors={[...grads.primaryButton]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.base}
      >
        {pressed && !isDisabled ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.pressedVeil]}
          />
        ) : null}
        {loading ? (
          <ActivityIndicator color={c.textOnPrimary} />
        ) : (
          <View style={styles.row}>
            {icon ? (
              <MaterialIcons name={icon} size={20} color={c.textOnPrimary} />
            ) : null}
            <Text
              style={[styles.label, { color: c.textOnPrimary }]}
              numberOfLines={1}
            >
              {label}
            </Text>
          </View>
        )}
      </LinearGradient>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.pill,
  },
  fullWidth: {
    alignSelf: "stretch",
  },
  base: {
    flexGrow: 1,
    minHeight: touch.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.pill,
    overflow: "hidden",
  },
  pressedVeil: {
    backgroundColor: "rgba(0, 0, 0, 0.14)",
  },
  disabled: {
    opacity: 0.45,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  label: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
    letterSpacing: 0.2,
  },
});
