import { httpsCallable } from "firebase/functions";
import { analytics } from "./analytics";
import { functions } from "../config/firebase";
import type {
  AcceptGuardianInviteRequest,
  AcceptGuardianInviteResponse,
  EmergencyEventRequest,
  EmergencyEventResponse,
  GuardianInviteRequest,
  GuardianInviteResponse,
  LiveShareStartRequest,
  MarkNotificationReadRequest,
  MarkNotificationReadResponse,
  ReportRequest,
  ReportResponse,
  RevokeGuardianRequest,
  RevokeGuardianResponse,
  RouteRequest,
  RouteResponse,
  SafeWalkCheckinRequest,
  SafeWalkCheckinResponse,
  SafeWalkStartRequest,
  SafeWalkStartResponse,
  SafetyEventRequest,
  SafetyEventResponse,
  SafetySessionStartResponse,
  SafetyScoreQuery,
  SafetyScoreResponse,
  SosRequest,
  SosResponse,
} from "./api";

export function postReport(body: ReportRequest) {
  return httpsCallable<ReportRequest, ReportResponse>(functions, "verifyReport")(body);
}

export function postSos(body: SosRequest) {
  return httpsCallable<SosRequest, SosResponse>(functions, "activateSOS")(body);
}

export function getSafetyScore(query: SafetyScoreQuery) {
  return httpsCallable<SafetyScoreQuery, SafetyScoreResponse>(
    functions,
    "calculateSafetyScore"
  )(query);
}

export async function postSafeWalkStart(body: SafeWalkStartRequest) {
  const res = await httpsCallable<SafeWalkStartRequest, SafeWalkStartResponse>(
    functions,
    "startSafeWalk"
  )(body);
  if (res.data?.sessionId) {
    void analytics.walkStarted(res.data.sessionId, (body.guardianUserIds?.length ?? 0) > 0);
  }
  return res;
}

export function postSafeWalkCheckin(body: SafeWalkCheckinRequest) {
  return httpsCallable<SafeWalkCheckinRequest, SafeWalkCheckinResponse>(
    functions,
    "safeWalkCheckin"
  )(body);
}

export async function createGuardianInvite(body: GuardianInviteRequest) {
  const res = await httpsCallable<GuardianInviteRequest, GuardianInviteResponse>(
    functions,
    "createGuardianInvite"
  )(body);
  if (res.data?.inviteId) {
    void analytics.guardianInvited(res.data.inviteId, body.role);
  }
  return res;
}

export async function acceptGuardianInvite(body: AcceptGuardianInviteRequest) {
  const res = await httpsCallable<
    AcceptGuardianInviteRequest,
    AcceptGuardianInviteResponse
  >(functions, "acceptGuardianInvite")(body);
  if (res.data?.success) {
    void analytics.guardianAccepted(body.token);
  }
  return res;
}

export function revokeGuardian(body: RevokeGuardianRequest) {
  return httpsCallable<RevokeGuardianRequest, RevokeGuardianResponse>(
    functions,
    "revokeGuardian"
  )(body);
}

export function postLiveShareStart(body: LiveShareStartRequest) {
  return httpsCallable<LiveShareStartRequest, SafetySessionStartResponse>(
    functions,
    "startLiveShare"
  )(body);
}

export function publishSafetyEvent(body: SafetyEventRequest) {
  return httpsCallable<SafetyEventRequest, SafetyEventResponse>(
    functions,
    "publishSafetyEvent"
  )(body);
}

export function publishEmergencyEvent(body: EmergencyEventRequest) {
  return httpsCallable<EmergencyEventRequest, EmergencyEventResponse>(
    functions,
    "publishEmergencyEvent"
  )(body);
}

export function markNotificationRead(body: MarkNotificationReadRequest) {
  return httpsCallable<
    MarkNotificationReadRequest,
    MarkNotificationReadResponse
  >(functions, "markNotificationRead")(body);
}

export function callDeleteAccount() {
  return httpsCallable<void, { success: boolean }>(functions, "deleteAccount")();
}

export function callExportUserData() {
  return httpsCallable<void, Record<string, unknown>>(functions, "exportUserData")();
}
