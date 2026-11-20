import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, { useState } from "react";
import {
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

export type SecondaryButtonProps = Omit<PressableProps, "style"> & {
  label: string;
  fullWidth?: boolean;
  /** Optional leading icon. */
  icon?: React.ComponentProps<typeof MaterialIcons>["name"];
  style?: StyleProp<ViewStyle>;
};

export function SecondaryButton({
  label,
  fullWidth = true,
  icon,
  disabled,
  style,
  onPressIn,
  onPressOut,
  ...rest
}: SecondaryButtonProps) {
  const { colors: c } = useAppTheme();
  const [pressed, setPressed] = useState(false);
  const active = pressed && !disabled;

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled }}
      disabled={disabled}
      onPressIn={(e) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        setPressed(false);
        onPressOut?.(e);
      }}
      style={[
        styles.base,
        {
          backgroundColor: active ? c.surfaceVariant : c.surface,
          borderColor: active ? c.primary : c.border,
        },
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      <View style={styles.row}>
        {icon ? (
          <MaterialIcons name={icon} size={20} color={c.textPrimary} />
        ) : null}
        <Text
          style={[styles.label, { color: c.textPrimary }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.buttonHeight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  fullWidth: {
    alignSelf: "stretch",
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
  },
});
