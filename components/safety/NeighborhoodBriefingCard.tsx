import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  ActivityIndicator,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Haptics from "expo-haptics";
import { radius, spacing, typography } from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import {
  generateNeighborhoodSafetyBriefing,
  type NeighborhoodSafetyBriefing,
  type NeighborhoodBriefingParams,
} from "@/services/geminiNeighborhoodBriefing";

export type NeighborhoodBriefingCardProps = {
  areaName: string;
  hour?: number;
  lightingScore?: number;
  crimeScore?: number;
  policeDistanceM?: number;
  nearestPoliceName?: string;
  style?: StyleProp<ViewStyle>;
};

/**
 * NeighborhoodBriefingCard renders dynamic pre-trip safety intelligence.
 *
 * Displays Gemini-generated headlines, contextual briefings, risk pill indicators,
 * actionable safety highlights, and simulated earphone audio playback.
 *
 * @param props - Neighborhood identification, night illumination, and police proximity metrics.
 */
export function NeighborhoodBriefingCard({
  areaName,
  hour,
  lightingScore,
  crimeScore,
  policeDistanceM,
  nearestPoliceName,
  style,
}: NeighborhoodBriefingCardProps) {
  const { colors: c, elevation: elev } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [briefing, setBriefing] = useState<NeighborhoodSafetyBriefing | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const loadBriefing = useCallback(async () => {
    setLoading(true);
    try {
      const res = await generateNeighborhoodSafetyBriefing({
        areaName: areaName || "Kurla",
        hour: hour != null ? hour : new Date().getHours(),
        lightingScore: lightingScore ?? 0.7,
        crimeScore: crimeScore ?? 35,
        policeDistanceM: policeDistanceM ?? 300,
        nearestPoliceName: nearestPoliceName || "Police Beat Box",
      });
      setBriefing(res);
    } catch {
      // Fallback handled in service
    } finally {
      setLoading(false);
    }
  }, [areaName, hour, lightingScore, crimeScore, policeDistanceM, nearestPoliceName]);

  useEffect(() => {
    void loadBriefing();
  }, [loadBriefing]);

  const handleToggleAudio = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsPlayingAudio((prev) => !prev);
    // Auto-reset simulated playback after 5 seconds
    if (!isPlayingAudio) {
      setTimeout(() => {
        setIsPlayingAudio(false);
      }, 5000);
    }
  };

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
      accessibilityLabel={`Neighborhood safety briefing for ${areaName}`}
    >
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={[styles.aiBadge, { backgroundColor: c.primaryContainer }]}>
            <MaterialIcons name="auto-awesome" size={13} color={c.primary} />
            <Text style={[styles.aiBadgeText, { color: c.primary }]}>
              Gemini Intelligence
            </Text>
          </View>
          {briefing?.timeContext ? (
            <View style={[styles.timeChip, { backgroundColor: c.surfaceVariant }]}>
              <MaterialIcons name="schedule" size={12} color={c.textSecondary} />
              <Text style={[styles.timeChipText, { color: c.textSecondary }]}>
                {briefing.timeContext}
              </Text>
            </View>
          ) : null}
        </View>

        <Pressable
          onPress={() => void loadBriefing()}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Refresh safety briefing"
        >
          <MaterialIcons
            name="refresh"
            size={18}
            color={c.textTertiary}
            style={loading ? styles.spinning : undefined}
          />
        </Pressable>
      </View>

      {/* Content */}
      {loading && !briefing ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            Synthesizing night lighting & neighborhood safety data…
          </Text>
        </View>
      ) : briefing ? (
        <View style={styles.content}>
          <Text style={[styles.headline, { color: c.textPrimary }]}>
            {briefing.headline}
          </Text>
          <Text style={[styles.briefingText, { color: c.textSecondary }]}>
            {briefing.briefing}
          </Text>

          {/* Highlights */}
          {briefing.highlights?.length > 0 ? (
            <View style={styles.highlightsWrap}>
              {briefing.highlights.map((item, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.highlightPill,
                    { backgroundColor: c.surfaceVariant, borderColor: c.border },
                  ]}
                >
                  <MaterialIcons
                    name={idx === 1 ? "local-police" : "lightbulb-outline"}
                    size={12}
                    color={c.primary}
                  />
                  <Text style={[styles.highlightText, { color: c.textPrimary }]}>
                    {item}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Listen Button */}
          <View style={styles.footerRow}>
            <Pressable
              onPress={handleToggleAudio}
              style={[
                styles.audioBtn,
                { backgroundColor: isPlayingAudio ? c.primaryContainer : c.surfaceVariant },
                isPlayingAudio && { borderColor: c.primary, borderWidth: 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Listen to audio briefing"
            >
              <MaterialIcons
                name={isPlayingAudio ? "volume-up" : "headphones"}
                size={16}
                color={isPlayingAudio ? c.primary : c.textPrimary}
              />
              <Text
                style={[
                  styles.audioBtnText,
                  { color: isPlayingAudio ? c.primary : c.textPrimary },
                ]}
              >
                {isPlayingAudio ? "Playing Earphone Briefing…" : "Listen (Earphone Mode)"}
              </Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    flexWrap: "wrap",
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  aiBadgeText: {
    fontFamily: typography.fontFamily.bold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  timeChipText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  spinning: {
    opacity: 0.6,
  },
  loadingBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  loadingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 12,
  },
  content: {
    gap: spacing.xs,
  },
  headline: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.bodyLarge,
    lineHeight: 22,
  },
  briefingText: {
    fontFamily: typography.fontFamily.regular,
    fontSize: 13,
    lineHeight: 19,
  },
  highlightsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  highlightPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  highlightText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 11,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  audioBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  audioBtnText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: 12,
  },
});
