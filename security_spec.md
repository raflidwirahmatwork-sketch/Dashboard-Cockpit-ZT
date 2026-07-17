# Security Specification - KAI Corporate Transformation Cockpit

## 1. Data Invariants
1. **Programs Collection (`/programs/{programId}`)**:
   - `no` must be a strictly positive integer (`val >= 1`).
   - `topic` must be a non-empty string of reasonable size (`size() <= 256`).
   - `cluster` must be a valid category string.
   - `progress` must be an integer between 0 and 100 (`val >= 0 && val <= 100`).
   - `statusTracker` must be one of `["Green", "Yellow", "Red", "Blocked"]`.
   - `createdAt` is immutable once set and must align with server timestamp on creation (`request.time`).

2. **Meeting Logs Collection (`/meetingLogs/{logId}`)**:
   - Every log entry MUST reference a valid program via `programId`. The parent program document must exist: `exists(/databases/$(database)/documents/programs/$(incoming().programId))`.
   - `meetingDate` must be a non-empty string.
   - `previousStatus` and `newStatus` must be valid status values.
   - `previousProgress` and `newProgress` must be valid integers between 0 and 100.
   - `recordedBy` must be a valid string of length <= 128.

3. **Documents Collection (`/documents/{docId}`)**:
   - `tanggalSurat`, `noSurat`, `asalSurat`, and `prihal` are required string fields of valid lengths.
   - Files list (if provided) must be bounded in length to prevent storage exhaustion attacks.

---

## 2. The "Dirty Dozen" Malicious Payloads
The following payloads are designed to bypass business logic and must be strictly blocked by the rules:

### Programs Violation Payloads
1. **P1: Progress Overflow** - Setting `progress` to `150` (or `-20`).
2. **P2: Invalid Status Option** - Setting `statusTracker` to `"Super_Green"` (invalid option).
3. **P3: Topic Resource Poisoning** - Setting `topic` to a 5MB repeating string.
4. **P4: Sequential Underflow** - Setting `no` to `0` or `-5`.
5. **P5: Immutable Creation Hijack** - Overwriting `createdAt` to a historical date during an update.
6. **P6: Invalid Document ID Injection** - Injecting a 2KB junk character string as the document ID path.

### Meeting Logs Violation Payloads
7. **L1: Orphaned Meeting Log** - Writing a meeting log with a non-existent or invalid `programId` reference.
8. **L2: Progress Range Out-of-Bounds** - Setting `newProgress` to `-1`.
9. **L3: Missing Required RecordedBy** - Omitting the `recordedBy` field on log creation.
10. **L4: Null Date Format** - Providing a non-string or excessively long string for `meetingDate`.

### Documents Violation Payloads
11. **D1: Document Title Overflow** - Sending a `prihal` (subject) string of 1MB size.
12. **D2: Missing Vital Metadata** - Omitting `noSurat` (letter number) on document archiving.

---

## 3. Security Rules Verification Test Blueprint
A conceptual unit test file `firestore.rules.test.ts` is outlined below to ensure that all malicious payloads are correctly rejected with `PERMISSION_DENIED`:

```typescript
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("KAI Transformation Cockpit - Firestore Security Rules Test Suite", () => {
  let testEnv: any;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "tensile-guard-pjlsj",
      firestore: {
        rules: await fs.promises.readFile("firestore.rules", "utf8"),
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  it("should prevent creating a program with out-of-bounds progress", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(
      db.collection("programs").add({
        no: 100,
        topic: "Invalid Progress Test",
        progress: 150, // Out of bounds!
        statusTracker: "Green",
        cluster: "Strategic"
      })
    );
  });

  it("should enforce valid status tracker options", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(
      db.collection("programs").add({
        no: 101,
        topic: "Invalid Status Test",
        progress: 50,
        statusTracker: "Super_Green", // Invalid!
        cluster: "Strategic"
      })
    );
  });

  it("should prevent creating an orphaned meeting log", async () => {
    const context = testEnv.unauthenticatedContext();
    const db = context.firestore();
    await assertFails(
      db.collection("meetingLogs").add({
        programId: "non-existent-id-abc-123", // Non-existent program
        programTitle: "Test Log",
        meetingDate: "2026-07-13",
        notes: "This log should fail",
        previousStatus: "Green",
        newStatus: "Yellow",
        previousProgress: 10,
        newProgress: 20,
        recordedBy: "Auditor"
      })
    );
  });
});
```
