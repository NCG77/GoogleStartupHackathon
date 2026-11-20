/**
 * SOS audio evidence helpers.
 *
 * Captures a rolling audio clip during an active SOS and uploads it to Firebase
 * Storage so guardians (and, with user consent, nearby helpers) can hear what is
 * happening after the alert fires.
 *
 * Storage layout:
 *   sos/{uid}/{clientEventId}/clip.m4a
 *
 * The *path* is computed deterministically from the user's UID and the
 * client-generated eventId, so it can be passed to the `activateSOS` callable at
 * alert time even before the file exists. The upload lands shortly after.
 */
import { storage } from "@/config/firebase";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";

export const SOS_AUDIO_PREF_KEY = "@SafeRoute:sosAudioRecording";

/** Deterministic storage path for an SOS audio clip. */
export function sosAudioPath(uid: string, clientEventId: string): string {
  return `sos/${uid}/${clientEventId}/clip.m4a`;
}

/**
 * Upload a locally-recorded audio file to Firebase Storage at the given path.
 * Returns the public download URL on success, null on failure.
 */
export async function uploadSosAudio(
  localUri: string,
  storagePath: string,
): Promise<{ path: string; url: string | null } | null> {
  try {
    const response = await fetch(localUri);
    const blob = await response.blob();
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, blob, {
      contentType: "audio/m4a",
      customMetadata: {
        source: "sos",
        uploadedAtMs: String(Date.now()),
      },
    });
    let url: string | null = null;
    try {
      url = await getDownloadURL(storageRef);
    } catch (error) {
      console.warn("SOS audio uploaded but download URL fetch failed", error);
    }
    return { path: storagePath, url };
  } catch (error) {
    console.warn("SOS audio upload failed", error);
    return null;
  }
}
