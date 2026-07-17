# Security Specification & Threat Model

This specification defines the security invariants and threat mitigation vectors for the **Remix: ZT Cockpit Dashboard Rev02** Firestore database.

---

## 1. Core Data Invariants

1. **Authentication & Authorization Verification**: 
   - All standard writes require a fully authenticated session (`request.auth != null`).
2. **Viewer Limitation**:
   - Users with the role of `VIEWER` are strictly restricted from performing any write, update, delete, or creation actions across all collections (`programs`, `meeting_logs`, `cloud_documents`).
3. **Data Type & Format Constraints**:
   - All fields must adhere to the data type declarations defined in `firebase-blueprint.json` (e.g. `progress` is a number from `0` to `100`, `topic` must be a string up to `1000` chars max, IDs must comply with alpha-numeric formatting `^[a-zA-Z0-9_\-]+$`).
4. **Minutes of Meeting (MoM) Integrity**:
   - Once a `meeting_log` is created, it cannot be modified or deleted. It is write-once/read-only to maintain regulatory logs integrity.
5. **Admin Escape Hatch**:
   - Users with administrative credentials (e.g. `ADMIN` or internal verified managers) are the only ones authorized to perform deletions or hard state resets.

---

## 2. The "Dirty Dozen" Malicious Payloads

The following payloads represent targeted attacks attempting to breach system security. All of these payloads must return `PERMISSION_DENIED` under the security rules.

### Payload 1: Unauthorized Creation by Non-Admin/Non-Internal (Viewer)
- **Target**: `databases/$(database)/documents/programs/p1`
- **Action**: `create`
- **Payload**:
```json
{
  "topic": "Malicious Agenda",
  "cluster": "Strategic Transformation",
  "owner": "DC",
  "ztRole": "Orchestrator",
  "phase": "Ideation",
  "progress": 50,
  "statusTracker": "Green",
  "priority": "High"
}
```
- **Context**: Authenticated as `viewer@kai.id` (Viewer role, should be denied).

### Payload 2: Self-Assigned Escalated Fields (Privilege Escalation)
- **Target**: `databases/$(database)/documents/programs/p1`
- **Action**: `update`
- **Payload**: Attempting to alter structural attributes (such as changing an existing ID or modifying priority) without authorization.
```json
{
  "id": "new-admin-id",
  "topic": "Altered Topic"
}
```

### Payload 3: Unbounded String Field Size (Denial of Wallet)
- **Target**: `databases/$(database)/documents/programs/p2`
- **Action**: `create`
- **Payload**:
```json
{
  "topic": "A".repeat(1000000), 
  "cluster": "Strategic Transformation",
  "owner": "DC",
  "ztRole": "Orchestrator",
  "phase": "Ideation",
  "progress": 50,
  "statusTracker": "Green",
  "priority": "High"
}
```

### Payload 4: Invalid Cluster Type
- **Target**: `databases/$(database)/documents/programs/p3`
- **Action**: `create`
- **Payload**:
```json
{
  "topic": "Invalid Cluster Program",
  "cluster": "Ultra Secret Unapproved Cluster",
  "owner": "DC",
  "ztRole": "Orchestrator",
  "phase": "Ideation",
  "progress": 50,
  "statusTracker": "Green",
  "priority": "High"
}
```

### Payload 5: Out of Range Progress Values
- **Target**: `databases/$(database)/documents/programs/p4`
- **Action**: `create`
- **Payload**:
```json
{
  "topic": "Broken Progress Program",
  "cluster": "Strategic Transformation",
  "owner": "DC",
  "ztRole": "Orchestrator",
  "phase": "Ideation",
  "progress": 9999,
  "statusTracker": "Green",
  "priority": "High"
}
```

### Payload 6: Meeting Log Orphaned from Program
- **Target**: `databases/$(database)/documents/meeting_logs/log1`
- **Action**: `create`
- **Payload**: Missing `programId` reference.
```json
{
  "programTitle": "Orphaned Log",
  "meetingDate": "2026-07-16 12:00",
  "notes": "Testing notes",
  "previousStatus": "Green",
  "newStatus": "Green",
  "previousProgress": 10,
  "newProgress": 20,
  "recordedBy": "Viewer"
}
```

### Payload 7: Modification of Historical MoM Logs
- **Target**: `databases/$(database)/documents/meeting_logs/log1`
- **Action**: `update`
- **Payload**:
```json
{
  "notes": "Attempting to change historical log notes"
}
```

### Payload 8: Deletion of Meeting Logs
- **Target**: `databases/$(database)/documents/meeting_logs/log1`
- **Action**: `delete`
- **Payload**: null

### Payload 9: Cloud Document Missing Required Field
- **Target**: `databases/$(database)/documents/cloud_documents/doc1`
- **Action**: `create`
- **Payload**: Missing `tanggalSurat`.
```json
{
  "noSurat": "B-100/KAI",
  "asalSurat": "Kementerian BUMN",
  "prihal": "Infrastruktur Baru"
}
```

### Payload 10: Unauthorized Document Deletion
- **Target**: `databases/$(database)/documents/cloud_documents/doc1`
- **Action**: `delete`
- **Context**: Authenticated as a non-admin/viewer.

### Payload 11: Invalid ID injection (Special characters in document path)
- **Target**: `databases/$(database)/documents/programs/program$$$malicious`
- **Action**: `create`
- **Payload**:
```json
{
  "topic": "Invalid path id inject",
  "cluster": "Strategic Transformation",
  "owner": "DC",
  "ztRole": "Orchestrator",
  "phase": "Ideation",
  "progress": 50,
  "statusTracker": "Green",
  "priority": "High"
}
```

### Payload 12: Spoofed Author / Modifier Session ID
- **Target**: `databases/$(database)/documents/programs/p10`
- **Action**: `create`
- **Payload**: Attempting to set `uploadedBy` or administrative logs metadata under a spoofed UID.

---

## 3. Security Test Plan Verification

Our automated and manual checks verify that rules are evaluated securely before final deployment.
All reads and writes must be guarded with `isSignedIn()`, data type constraints, and strict role permissions.
