import {
  DesignSearchBar,
  LiveMiniMap,
  QuickActionsGrid,
  SafetyScoreChip,
  SOSButton,
  type QuickActionItem,
} from "@/components/design-system";
import { DestinationSearchSheet } from "@/components/destination/DestinationSearchSheet";
import { SafeWalkHeroCard } from "@/components/safewalk/SafeWalkHeroCard";
import { NeighborhoodBriefingCard } from "@/components/safety/NeighborhoodBriefingCard";
import { TourAnchor } from "@/components/tour/TourAnchor";
import { auth } from "@/config/firebase";
import type { DestinationPlace } from "@/core/destinationSearch";
import { calculateSafetyScore } from "@/core/safetyScore";
import {
  motion,
  radius,
  spacing,
  tabContentBottomInset,
  typography,
} from "@/constants/theme";
import { useAppTheme } from "@/hooks/useAppTheme";
import { isWithinMumbai } from "@/core/coverage";
import { useMyOpenSafeWalks } from "@/hooks/useMyOpenSafeWalk";
import { useProductTour } from "@/hooks/useProductTour";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import * as Location from "expo-location";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type WeatherInfo = {
  label: string;
  tempC: number | null;
  icon: React.ComponentProps<typeof MaterialIcons>["name"];
};

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function weatherIcon(
  code: number,
): React.ComponentProps<typeof MaterialIcons>["name"] {
  if (code === 0) return "wb-sunny";
  if (code <= 3) return "cloud";
  if (code <= 67) return "grain";
  if (code <= 77) return "ac-unit";
  return "thunderstorm";
}

function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Cloudy";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  return "Storms";
}

export default function HomeDashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors: c, elevation: elev } = useAppTheme();
  const { maybeAutoStart, active, step, requestRemeasure } = useProductTour();
  const { walks: openWalks } = useMyOpenSafeWalks();
  const scrollRef = React.useRef<ScrollView>(null);
  // Content offsets of tour-highlighted sections, so the tour scrolls to real positions.
  const sectionY = React.useRef<Record<string, number>>({});
  const onSafeWalkLayout = (e: LayoutChangeEvent) => {
    sectionY.current.safewalk = e.nativeEvent.layout.y;
  };
  const onActionsLayout = (e: LayoutChangeEvent) => {
    sectionY.current.actions = e.nativeEvent.layout.y;
  };
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [placeName, setPlaceName] = useState("Finding you…");
  const [outOfArea, setOutOfArea] = useState(false);
  const [score, setScore] = useState(72);
  const [weather, setWeather] = useState<WeatherInfo>({
    label: "—",
    tempC: null,
    icon: "cloud-queue",
  });
  const [refreshing, setRefreshing] = useState(false);

  const displayName =
    auth.currentUser?.displayName?.split(" ")[0] ||
    auth.currentUser?.email?.split("@")[0] ||
    "there";

  const hour = new Date().getHours();
  const greetingLine = greetingForHour(hour);

  const loadContext = useCallback(async () => {
    const now = new Date();
    let usedLiveScore = false;

    // Phase 5: prefer live safety_scores cell when signed in
    try {
      if (auth.currentUser) {
        const pos = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const { getSafetyScore } = await import("@/services/callables");
        const live = await getSafetyScore({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          departAtMs: now.getTime(),
        });
        if (live.data?.score != null) {
          setScore(live.data.score);
          usedLiveScore = true;
        }
      }
    } catch {
      // fall through to local formula
    }

    if (!usedLiveScore) {
      const baseScore = calculateSafetyScore({
        hour: now.getHours(),
        dayOfWeek: now.getDay(),
        communityRating: 3.8,
        crowdDensity: 0.55,
        streetLighting: now.getHours() >= 18 || now.getHours() < 6 ? 0.45 : 0.85,
        visibilityKm: 8,
        policeDistanceM: 900,
        cctv: 0.4,
        verifiedIncidents30d: 1,
        historicalReports: 2,
        xgbRisk: null,
        xgbConfidence: null,
      });
      setScore(baseScore.score);
    }

    try {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== Location.PermissionStatus.GRANTED) {
        setPlaceName("Location off — enable in Permissions");
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = position.coords;
      setOutOfArea(!isWithinMumbai(latitude, longitude));

      const places = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      const place = places[0];
      if (place) {
        const label =
          [place.name || place.street, place.district || place.city]
            .filter(Boolean)
            .join(", ") || "Current area";
        setPlaceName(label);
      } else {
        setPlaceName("Current area");
      }

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          const code = Number(data?.current?.weather_code ?? 0);
          const temp = data?.current?.temperature_2m;
          setWeather({
            label: weatherLabel(code),
            tempC: typeof temp === "number" ? Math.round(temp) : null,
            icon: weatherIcon(code),
          });
        }
      } catch {
        setWeather({ label: "Local", tempC: null, icon: "wb-cloudy" });
      }
    } catch {
      setPlaceName("Unable to read location");
    }
  }, []);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  useFocusEffect(
    useCallback(() => {
      // First-run / pending only — Profile replay starts from the provider
      void maybeAutoStart();
    }, [maybeAutoStart]),
  );

  useEffect(() => {
    if (active) setSearchOpen(false);
  }, [active]);

  useEffect(() => {
    if (!active) return;
    const id = step.id;
    const scrollToSection = (key: string, fallback: number) => {
      const y = sectionY.current[key] ?? fallback;
      scrollRef.current?.scrollTo({
        y: Math.max(0, y - spacing.xxl),
        animated: true,
      });
    };
    const t = setTimeout(() => {
      if (id === "search") {
        scrollRef.current?.scrollTo({ y: 0, animated: true });
      } else if (id === "safewalk") {
        scrollToSection("safewalk", 220);
      } else if (id === "report") {
        scrollToSection("actions", 360);
      } else if (id === "heatmap" || id === "sos") {
        scrollRef.current?.scrollToEnd({ animated: true });
      }
      // Remeasure after scroll animation so the hole matches the feature
      setTimeout(() => requestRemeasure(), 280);
      setTimeout(() => requestRemeasure(), 520);
      setTimeout(() => requestRemeasure(), 900);
    }, 80);
    return () => clearTimeout(t);
  }, [active, step.id, requestRemeasure]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContext();
    setRefreshing(false);
  };

  const goMap = (params?: Record<string, unknown>) => {
    router.push({ pathname: "/navigate", params: params as never });
  };

  const openDestinationSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const actions: QuickActionItem[] = useMemo(
    () => [
      {
        key: "route",
        label: "Safe Route",
        description: "Paths ranked for lighting & crowd",
        icon: "alt-route",
        tone: "primary",
        size: "small",
        onPress: openDestinationSearch,
      },
      {
        key: "report",
        label: "Report Area",
        description: "Lighting, hazard, or harassment",
        icon: "report-problem",
        tone: "warning",
        size: "small",
        tourId: "report",
        onPress: () => router.push("/CommunityReport" as never),
      },
      {
        key: "police",
        label: "Nearby Police",
        description: "Stations on your map",
        icon: "local-police",
        tone: "neutral",
        size: "small",
        onPress: () =>
          goMap({ showPoliceStations: "true", nearbyNonce: String(Date.now()) }),
      },
      {
        key: "guardians",
        label: "Guardians",
        description: "People who know you’re safe",
        icon: "people-outline",
        tone: "neutral",
        size: "small",
        onPress: () => router.push("/contacts"),
      },
    ],
    [router, openDestinationSearch],
  );

  const openWalk = openWalks[0] ?? null;

  const onDestinationSelect = (place: DestinationPlace) => {
    if (!isWithinMumbai(place.coordinate.latitude, place.coordinate.longitude)) {
      Alert.alert(
        "Outside Coverage Area",
        `"${place.title}" is outside SafeRoute's Mumbai coverage area. Safety routing is available within Mumbai only in this beta.`,
        [{ text: "OK" }],
      );
      return;
    }
    setSearch(place.title);
    router.push({
      pathname: "/navigate",
      params: {
        selectedPlaceLat: String(place.coordinate.latitude),
        selectedPlaceLng: String(place.coordinate.longitude),
        selectedPlaceTitle: place.title,
        selectedPlaceSubtitle: place.subtitle,
        selectedPlaceNonce: String(Date.now()),
      } as never,
    });
  };

  const bottomPad = tabContentBottomInset(insets.bottom);

  return (
    <View style={[styles.root, { backgroundColor: c.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: Math.max(insets.top, spacing.md) + spacing.md,
            paddingBottom: bottomPad,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Animated.View
          entering={FadeInDown.duration(motion.page)}
          style={styles.header}
        >
          <Text style={[styles.greetingLine, { color: c.textSecondary }]}>
            {`${greetingLine},`}
          </Text>
          <Text
            style={[styles.nameLine, { color: c.textPrimary }]}
            accessibilityRole="header"
          >
            {displayName}
          </Text>

          <View style={styles.metaRow}>
            <View
              style={[
                styles.locationPill,
                {
                  backgroundColor: c.surface,
                  borderColor: c.border,
                  ...elev.card,
                },
              ]}
            >
              <MaterialIcons name="place" size={16} color={c.primary} />
              <Text
                style={[styles.locationText, { color: c.textPrimary }]}
                numberOfLines={1}
              >
                {placeName}
              </Text>
            </View>
          </View>

          <View style={styles.contextRow}>
            <View
              style={[
                styles.weatherPill,
                { backgroundColor: c.surfaceVariant },
              ]}
            >
              <MaterialIcons
                name={weather.icon}
                size={16}
                color={c.textPrimary}
              />
              <Text style={[styles.weatherText, { color: c.textPrimary }]}>
                {weather.label}
                {weather.tempC != null ? ` · ${weather.tempC}°` : ""}
              </Text>
            </View>
            <SafetyScoreChip score={score} label="Area safety" />
          </View>
        </Animated.View>

        {outOfArea && (
          <View
            style={{
              flexDirection: "row",
              padding: spacing.md,
              borderRadius: radius.md,
              backgroundColor: c.surface,
              borderColor: c.primary,
              borderWidth: 1,
              marginTop: spacing.sm,
              marginBottom: spacing.xs,
              alignItems: "center",
            }}
          >
            <MaterialIcons name="info-outline" size={24} color={c.primary} />
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={{ fontFamily: typography.fontFamily.semibold, color: c.textPrimary, fontSize: 14 }}>
                SafeRoute is in Mumbai Beta
              </Text>
              <Text style={{ fontFamily: typography.fontFamily.regular, color: c.textSecondary, fontSize: 12, marginTop: 2 }}>
                High-resolution safety scores are active in Mumbai. Join our waitlist for expansion to your city.
              </Text>
            </View>
          </View>
        )}

        <Animated.View
          entering={FadeInDown.delay(motion.stagger).duration(motion.normal)}
          style={styles.searchBlock}
        >
          <Text style={[styles.searchKicker, { color: c.textTertiary }]}>
            Where to?
          </Text>
          <TourAnchor id="search">
            <Pressable onPress={openDestinationSearch}>
              <View pointerEvents="none">
                <DesignSearchBar
                  variant="hero"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Where do you want to go safely?"
                  editable={false}
                />
              </View>
            </Pressable>
          </TourAnchor>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(motion.stagger * 2).duration(motion.normal)}
          style={styles.section}
          onLayout={onSafeWalkLayout}
        >
          <TourAnchor id="safewalk">
            <SafeWalkHeroCard
              walk={openWalk}
              onStart={() => router.push("/(tabs)/safewalk" as never)}
              onOpen={() => router.push("/(tabs)/safewalk" as never)}
            />
          </TourAnchor>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(motion.stagger * 2.5).duration(motion.normal)}
          style={styles.section}
        >
          <NeighborhoodBriefingCard
            areaName="Kurla"
            lightingScore={0.75}
            policeDistanceM={280}
            nearestPoliceName="Kurla Police Beat Box"
            crimeScore={30}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(motion.stagger * 3).duration(motion.normal)}
          style={styles.section}
          onLayout={onActionsLayout}
        >
          <Text style={[styles.sectionTitle, { color: c.textPrimary }]}>
            Quick actions
          </Text>
          <QuickActionsGrid actions={actions} />
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(motion.stagger * 4).duration(motion.normal)}
          style={styles.section}
        >
          <LiveMiniMap onPress={() => goMap()} />
        </Animated.View>
      </ScrollView>

      <TourAnchor
        id="sos"
        style={[
          styles.sosFab,
          { bottom: tabContentBottomInset(insets.bottom) - spacing.sm },
        ]}
      >
        <SOSButton
          compact
          onPress={() => router.push("/(tabs)/SOS" as never)}
          onLongPress={() => router.push("/(tabs)/SOS" as never)}
        />
      </TourAnchor>

      <DestinationSearchSheet
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelect={onDestinationSelect}
        initialQuery={search}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
  },
  header: {
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  greetingLine: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.body,
    lineHeight: typography.lineHeight.body,
  },
  nameLine: {
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.headline,
    lineHeight: typography.lineHeight.headline,
    letterSpacing: typography.tracking.tight,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  locationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    maxWidth: "100%",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  locationText: {
    flexShrink: 1,
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  weatherPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  weatherText: {
    fontFamily: typography.fontFamily.medium,
    fontSize: typography.size.caption,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  searchBlock: {
    gap: spacing.sm,
  },
  searchKicker: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.caption,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  section: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontFamily: typography.fontFamily.semibold,
    fontSize: typography.size.title,
    lineHeight: typography.lineHeight.title,
    marginBottom: spacing.md,
    letterSpacing: typography.tracking.title,
  },
  sosFab: {
    position: "absolute",
    right: spacing.lg,
    zIndex: 40,
  },
});
