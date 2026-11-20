import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, { Easing, Keyframe } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FullWindowOverlay } from "react-native-screens";
import { motion, radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";

export type ToastTone = "success" | "warning" | "error" | "info";

export type ToastOptions = {
  tone?: ToastTone;
  title: string;
  message?: string;
  /** Auto-dismiss delay. Defaults to motion.toastVisibleMs. */
  durationMs?: number;
};

type ToastState = ToastOptions & { id: number; tone: ToastTone };

type ToastContextValue = {
  show: (options: ToastOptions) => void;
  hide: () => void;
};

const noop: ToastContextValue = { show: () => {}, hide: () => {} };

const ToastContext = createContext<ToastContextValue>(noop);

const TONE_ICON: Record<ToastTone, React.ComponentProps<typeof MaterialIcons>["name"]> = {
  success: "check-circle",
  warning: "warning-amber",
  error: "error-outline",
  info: "info-outline",
};

const enter = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: -18 }, { scale: 0.96 }] },
  100: {
    opacity: 1,
    transform: [{ translateY: 0 }, { scale: 1 }],
    easing: Easing.out(Easing.cubic),
  },
}).duration(motion.toastIn);

const exit = new Keyframe({
  0: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  100: {
    opacity: 0,
    transform: [{ translateY: -12 }, { scale: 0.98 }],
    easing: Easing.in(Easing.cubic),
  },
}).duration(motion.toastOut);

/**
 * App-wide, non-blocking notifications. Use for confirmations and recoverable errors;
 * keep Alert for anything the user must acknowledge or decide on.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextId = useRef(1);

  const clearTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };

  const hide = useCallback(() => {
    clearTimer();
    setToast(null);
  }, []);

  const show = useCallback(
    (options: ToastOptions) => {
      clearTimer();
      const next: ToastState = {
        ...options,
        tone: options.tone ?? "info",
        id: nextId.current++,
      };
      setToast(next);
      AccessibilityInfo.announceForAccessibility(
        next.message ? `${next.title}. ${next.message}` : next.title,
      );
      timer.current = setTimeout(
        hide,
        options.durationMs ?? motion.toastVisibleMs,
      );
    },
    [hide],
  );

  useEffect(() => clearTimer, []);

  const value = useMemo(() => ({ show, hide }), [show, hide]);

  const layer = (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {toast ? <ToastCard key={toast.id} toast={toast} onDismiss={hide} /> : null}
    </View>
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {Platform.OS === "ios" ? <FullWindowOverlay>{layer}</FullWindowOverlay> : layer}
    </ToastContext.Provider>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastState;
  onDismiss: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors: c, elevation: elev } = useAppTheme();

  const tone = {
    success: { fg: c.success, bg: c.successContainer },
    warning: { fg: c.warning, bg: c.warningContainer },
    error: { fg: c.danger, bg: c.dangerContainer },
    info: { fg: c.primary, bg: c.primaryContainer },
  }[toast.tone];

  return (
    <Animated.View
      entering={enter}
      exiting={exit}
      pointerEvents="box-none"
      style={[styles.wrap, { top: Math.max(insets.top, spacing.md) + spacing.sm }]}
    >
      <Pressable
        onPress={onDismiss}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        accessibilityHint="Tap to dismiss"
        style={[
          styles.card,
          {
            backgroundColor: c.surfaceElevated,
            borderColor: c.border,
            ...elev.cardLift,
          },
        ]}
      >
        <View style={[styles.accent, { backgroundColor: tone.fg }]} />
        <View style={[styles.iconTile, { backgroundColor: tone.bg }]}>
          <MaterialIcons name={TONE_ICON[toast.tone]} size={20} color={tone.fg} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: c.textPrimary }]} numberOfLines={2}>
            {toast.title}
          </Text>
          {toast.message ? (
            <Text
              style={[styles.message, { color: c.textSecondary }]}
              numberOfLines={3}
            >
              {toast.message}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Show non-blocking toasts. Safe to call outside the provider (no-op). */
export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: 520,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    paddingLeft: spacing.md + 4,
    paddingRight: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  accent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  iconTile: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: 15,
    lineHeight: 20,
  },
  message: {
    fontFamily: typography.fontFamily.regular,
    fontSize: typography.size.caption,
    lineHeight: typography.lineHeight.caption,
  },
});
