import { Ionicons } from "@expo/vector-icons";

import React from "react";

import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { radius, spacing, touch, typography } from "@/constants/theme";

import { useAppTheme } from "@/hooks/useAppTheme";

export type SocialProvider = "google" | "apple";

export type SocialButtonProps = {
  provider: SocialProvider;

  onPress?: () => void;

  loading?: boolean;

  disabled?: boolean;

  style?: StyleProp<ViewStyle>;
};

const COPY: Record<
  SocialProvider,
  { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }
> = {
  google: { label: "Continue with Google", icon: "logo-google" },

  apple: { label: "Continue with Apple", icon: "logo-apple" },
};

/**

 * Social auth button.

 * Variants: Google | Apple × Default | Pressed | Loading | Disabled

 */

export function SocialButton({
  provider,

  onPress,

  loading = false,

  disabled = false,

  style,
}: SocialButtonProps) {
  const { colors: c } = useAppTheme();

  const meta = COPY[provider];

  const isDisabled = disabled || loading;

  const isApple = provider === "apple";

  // Apple's button is the inverse of the canvas in both schemes.
  const appleBg = c.textPrimary;

  const appleFg = c.background;

  return (
    <Pressable
      accessibilityRole="button"

      accessibilityLabel={meta.label}

      accessibilityState={{ disabled: isDisabled, busy: loading }}

      disabled={isDisabled}

      onPress={onPress}

      style={({ pressed }) => [
        styles.base,

        isApple
          ? { backgroundColor: appleBg, borderColor: appleBg }
          : { backgroundColor: c.surface, borderColor: c.border },

        pressed && !isDisabled && styles.pressed,

        isDisabled && styles.disabled,

        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isApple ? appleFg : c.textPrimary} />
      ) : (
        <View style={styles.row}>
          <Ionicons
            name={meta.icon}

            size={20}

            color={isApple ? appleFg : c.textPrimary}
          />

          <Text
            style={[
              styles.label,

              { color: c.textPrimary },

              isApple && { color: appleFg },
            ]}
          >
            {meta.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touch.minTarget,

    borderRadius: radius.pill,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: spacing.lg,

    borderWidth: 1.5,
  },

  pressed: {
    opacity: 0.88,

    transform: [{ scale: 0.99 }],
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
