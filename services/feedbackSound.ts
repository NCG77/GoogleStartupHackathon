import { SAFE_WALK_CHIME_KEY } from "@/constants/preferences";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

type ExpoAudio = typeof import("expo-audio");

let audioModule: ExpoAudio | null | undefined;

/**
 * expo-audio is a native module; dev clients built before it was added don't include it.
 * Load lazily so a missing module silently disables the chime instead of crashing.
 */
function loadAudio(): ExpoAudio | null {
  if (audioModule !== undefined) return audioModule;
  try {
    audioModule = require("expo-audio") as ExpoAudio;
  } catch (err) {
    console.warn("[sound] expo-audio unavailable; chime disabled", err);
    audioModule = null;
  }
  return audioModule;
}

export async function isSafeWalkChimeEnabled(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(SAFE_WALK_CHIME_KEY)) !== "0";
  } catch {
    return true;
  }
}

export async function setSafeWalkChimeEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(SAFE_WALK_CHIME_KEY, enabled ? "1" : "0");
}

let playing = false;
const CHIME_RELEASE_MS = 2500;

/**
 * Short acknowledgement chime for a confirmed Safe Walk start.
 * Respects the user's mute preference and the device silent / vibrate mode,
 * mixes with other audio, and never plays while the app is in the background.
 */
export async function playSafeWalkChime(): Promise<void> {
  if (playing || AppState.currentState !== "active") return;
  if (!(await isSafeWalkChimeEnabled())) return;
  const audio = loadAudio();
  if (!audio) return;

  playing = true;
  try {
    await audio.setAudioModeAsync({
      playsInSilentMode: false,
      interruptionMode: "mixWithOthers",
      shouldPlayInBackground: false,
    });
    const player = audio.createAudioPlayer(
      require("@/assets/sounds/safe-walk-chime.wav"),
    );
    player.volume = 0.7;

    player.play();
    // The clip is 1.2 s; release the native player once it has certainly finished.
    setTimeout(() => {
      try {
        player.remove();
      } catch {
        /* already released */
      }
      playing = false;
    }, CHIME_RELEASE_MS);
  } catch (err) {
    console.warn("[sound] chime failed", err);
    playing = false;
  }
}

const LAST_ACTIVATION_KEY = "@SafeRoute:lastActivationFeedback";
const celebratedSessions = new Set<string>();

/**
 * Resolves true only the first time it is called for a session, including across app
 * restarts, so resuming or remounting the live screen never replays activation feedback.
 */
export async function claimActivationFeedback(sessionId: string): Promise<boolean> {
  if (!sessionId || celebratedSessions.has(sessionId)) return false;
  celebratedSessions.add(sessionId);
  try {
    if ((await AsyncStorage.getItem(LAST_ACTIVATION_KEY)) === sessionId) return false;
    await AsyncStorage.setItem(LAST_ACTIVATION_KEY, sessionId);
  } catch {
    /* in-memory guard still applies */
  }
  return true;
}
