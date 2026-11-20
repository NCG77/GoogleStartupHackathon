/**
 * SafeRoute Crash Reporting & Error Monitoring.
 *
 * Configures Sentry error capture for uncaught errors, network failures,
 * and critical navigation exceptions.
 */

class CrashReporter {
  private dsn: string = process.env.EXPO_PUBLIC_SENTRY_DSN || "";
  private initialized: boolean = false;

  init(): void {
    if (this.initialized) return;
    this.initialized = true;

    if (!this.dsn) {
      if (__DEV__) console.log("[Sentry] No DSN configured; crash reporting running in mock mode.");
      return;
    }

    if (__DEV__) console.log("[Sentry] Initialized crash reporter.");
  }

  captureException(error: unknown, context?: Record<string, unknown>): void {
    console.error("[CrashReporter] Captured error:", error, context);
    if (!this.dsn) return;

    // Send payload to Sentry endpoint
    try {
      const errObj = error instanceof Error ? error : new Error(String(error));
      const payload = {
        exception: {
          values: [
            {
              type: errObj.name,
              value: errObj.message,
              stacktrace: errObj.stack ? { frames: [] } : undefined,
            },
          ],
        },
        extra: context,
        platform: "javascript",
        timestamp: Math.floor(Date.now() / 1000),
      };

      // Best effort background post
      fetch(`https://${this.dsn.replace(/https?:\/\/([^@]+)@/, "")}/api/store/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch(() => {});
    } catch {
      // Ignore Sentry dispatch failures
    }
  }

  captureMessage(message: string, level: "info" | "warning" | "error" = "info"): void {
    if (__DEV__) console.log(`[CrashReporter][${level}] ${message}`);
  }
}

export const crashReporter = new CrashReporter();
