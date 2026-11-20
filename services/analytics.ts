/**
 * SafeRoute Analytics & Telemetry Service.
 *
 * Tracks core product metrics with PostHog / structured analytics.
 * Core hypothesis tracked: `route_selected` (whether pedestrians choose
 * safer-but-slower routes vs fastest).
 */

export type RouteMode = "safest" | "balanced" | "fastest";

export type AnalyticsEvent =
  | { name: "route_requested"; properties: { originLat: number; originLng: number; destLat: number; destLng: number } }
  | { name: "route_selected"; properties: { mode: RouteMode; distanceM?: number; etaMinutes?: number; safetyScore?: number; deltaMinVsFastest?: number } }
  | { name: "walk_started"; properties: { sessionId: string; hasGuardians: boolean; plannedDistanceM?: number } }
  | { name: "walk_completed"; properties: { sessionId: string; arrivedSafely: boolean; durationMin?: number } }
  | { name: "guardian_invited"; properties: { inviteId?: string; role?: string } }
  | { name: "guardian_accepted"; properties: { inviteId?: string } }
  | { name: "sos_triggered"; properties: { eventId?: string; silent: boolean; audioRecorded?: boolean } }
  | { name: "report_submitted"; properties: { category: string; severity: number; anonymous: boolean } };

class AnalyticsService {
  private enabled: boolean = true;
  private postHogApiKey: string = process.env.EXPO_PUBLIC_POSTHOG_API_KEY || "";
  private postHogHost: string = process.env.EXPO_PUBLIC_POSTHOG_HOST || "https://app.posthog.com";

  /** Track an event */
  async track(event: AnalyticsEvent): Promise<void> {
    if (!this.enabled) return;

    if (__DEV__) {
      console.log(`[Analytics] ${event.name}:`, event.properties);
    }

    if (this.postHogApiKey) {
      try {
        await fetch(`${this.postHogHost}/capture/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: this.postHogApiKey,
            event: event.name,
            properties: {
              ...event.properties,
              $lib: "saferoute-rn",
              timestamp: new Date().toISOString(),
            },
          }),
        });
      } catch (err) {
        // Analytics failures must never disrupt user flow
        if (__DEV__) console.warn("[Analytics] PostHog capture failed:", err);
      }
    }
  }

  // Convenience helpers
  routeRequested(origin: { latitude: number; longitude: number }, destination: { latitude: number; longitude: number }) {
    return this.track({
      name: "route_requested",
      properties: {
        originLat: origin.latitude,
        originLng: origin.longitude,
        destLat: destination.latitude,
        destLng: destination.longitude,
      },
    });
  }

  routeSelected(mode: RouteMode, details?: { distanceM?: number; etaMinutes?: number; safetyScore?: number; deltaMinVsFastest?: number }) {
    return this.track({
      name: "route_selected",
      properties: {
        mode,
        ...details,
      },
    });
  }

  walkStarted(sessionId: string, hasGuardians: boolean, plannedDistanceM?: number) {
    return this.track({
      name: "walk_started",
      properties: {
        sessionId,
        hasGuardians,
        plannedDistanceM,
      },
    });
  }

  walkCompleted(sessionId: string, arrivedSafely: boolean, durationMin?: number) {
    return this.track({
      name: "walk_completed",
      properties: {
        sessionId,
        arrivedSafely,
        durationMin,
      },
    });
  }

  guardianInvited(inviteId?: string, role?: string) {
    return this.track({
      name: "guardian_invited",
      properties: { inviteId, role },
    });
  }

  guardianAccepted(inviteId?: string) {
    return this.track({
      name: "guardian_accepted",
      properties: { inviteId },
    });
  }

  sosTriggered(eventId?: string, silent: boolean = false, audioRecorded: boolean = false) {
    return this.track({
      name: "sos_triggered",
      properties: { eventId, silent, audioRecorded },
    });
  }

  reportSubmitted(category: string, severity: number, anonymous: boolean = false) {
    return this.track({
      name: "report_submitted",
      properties: { category, severity, anonymous },
    });
  }
}

export const analytics = new AnalyticsService();
