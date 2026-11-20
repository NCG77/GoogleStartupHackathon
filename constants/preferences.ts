/** Shared preference keys persisted in AsyncStorage */
export const SILENT_SOS_KEY = "@SafeRoute:silentSosDefault";
export const PRIVACY_ANON_KEY = "@SafeRoute:privacyAnonymousLocation";
export const PRIVACY_SHARE_KEY = "@SafeRoute:privacyShareWithGuardians";
/** Opt-in to receive SOS alerts from SafeRoute users within a few hundred metres. */
export const HELP_NEARBY_KEY = "@SafeRoute:helpNearbySos";
/** Record a short audio clip during SOS as evidence for guardians. Defaults to on. Stored as "false" when disabled. */
export const SOS_AUDIO_PREF_KEY = "@SafeRoute:sosAudioRecording";
/** Play a short chime when a Safe Walk starts. Defaults to on; stored as "0" when muted. */
export const SAFE_WALK_CHIME_KEY = "@SafeRoute:safeWalkChime";

/** First-run onboarding carousel completed (or skipped via Log in). */
export const ONBOARDING_DONE_KEY = "@SafeRoute:onboardingDone";
export const PERMISSIONS_WIZARD_KEY = "@SafeRoute:permissionsWizardDone";
export const PRODUCT_TOUR_DONE_KEY = "@SafeRoute:productTourDone";
export const PRODUCT_TOUR_PENDING_KEY = "@SafeRoute:productTourPending";
export const SIGNUP_PHONE_KEY = "@SafeRoute:signupPhone";
