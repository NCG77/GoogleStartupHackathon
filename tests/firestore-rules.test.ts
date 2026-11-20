/**
 * Firestore Rules Test Suite.
 *
 * Verifies core security invariants:
 *   1. Unauthenticated writes blocked
 *   2. Non-participant cannot read a session
 *   3. Live/current payload-size guard (<= 400 points) enforced
 *   4. sos_responders unreadable by clients (server-only)
 *   5. Grace-window expiry behaviour
 */

import { assertFails, assertSucceeds, initializeTestEnvironment, RulesTestEnvironment } from "@firebase/rules-unit-testing";
import * as fs from "node:fs";
import * as path from "node:path";

describe("Firestore Security Rules", () => {
  let testEnv: RulesTestEnvironment;

  beforeAll(async () => {
    const rules = fs.readFileSync(path.resolve(__dirname, "../firestore.rules"), "utf8");
    testEnv = await initializeTestEnvironment({
      projectId: "saferoute-test",
      firestore: { rules },
    });
  });

  afterAll(async () => {
    if (testEnv) await testEnv.cleanup();
  });

  beforeEach(async () => {
    if (testEnv) await testEnv.clearFirestore();
  });

  test("1. Unauthenticated writes to routes are blocked", async () => {
    const unauthDb = testEnv.unauthenticatedContext().firestore();
    await assertFails(unauthDb.collection("routes").doc("r1").set({ ownerId: "anon" }));
  });

  test("2. Non-participant cannot read a private route session", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("routes").doc("route-alice").set({
        ownerId: "alice",
        participantIds: ["alice", "guardian-bob"],
        state: "active",
      });
    });

    const eveDb = testEnv.authenticatedContext("eve").firestore();
    await assertFails(eveDb.collection("routes").doc("route-alice").get());

    const bobDb = testEnv.authenticatedContext("guardian-bob").firestore();
    await assertSucceeds(bobDb.collection("routes").doc("route-alice").get());
  });

  test("3. Live current payload-size guard enforces <= 400 points", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("routes").doc("r100").set({
        ownerId: "alice",
        participantIds: ["alice"],
        state: "active",
      });
      await context.firestore().collection("routes").doc("r100").collection("live").doc("current").set({
        ownerId: "alice",
        participantIds: ["alice"],
        location: { latitude: 19.0, longitude: 72.8 },
      });
    });

    const aliceDb = testEnv.authenticatedContext("alice").firestore();
    const liveDoc = aliceDb.collection("routes").doc("r100").collection("live").doc("current");

    // Path with 401 points should fail
    const tooManyPoints = Array.from({ length: 401 }, (_, i) => ({ latitude: 19.0 + i * 0.0001, longitude: 72.8 }));
    await assertFails(liveDoc.update({ routePath: tooManyPoints }));

    // Path with 200 points should succeed
    const validPoints = Array.from({ length: 200 }, (_, i) => ({ latitude: 19.0 + i * 0.0001, longitude: 72.8 }));
    await assertSucceeds(liveDoc.update({ routePath: validPoints }));
  });

  test("4. sos_responders collection is strictly server-only", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("sos_responders").doc("emergency-1").set({
        userIds: ["responder-charlie"],
      });
    });

    const charlieDb = testEnv.authenticatedContext("responder-charlie").firestore();
    await assertFails(charlieDb.collection("sos_responders").doc("emergency-1").get());
    await assertFails(charlieDb.collection("sos_responders").doc("emergency-1").set({ userIds: [] }));
  });

  test("5. Grace window expiry behavior", async () => {
    const expiredTimestamp = new Date(Date.now() - 60000); // 1 minute in the past
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context.firestore().collection("routes").doc("r-grace-expired").set({
        ownerId: "alice",
        participantIds: ["alice", "bob"],
        state: "completed",
        readableUntil: expiredTimestamp,
      });
    });

    const bobDb = testEnv.authenticatedContext("bob").firestore();
    // After grace window has elapsed, non-owner participants lose read access
    await assertFails(bobDb.collection("routes").doc("r-grace-expired").get());
  });
});
