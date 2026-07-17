import { ProgramJob, MeetingLog, CloudDocument, AttachmentFile, UserAccount } from "./types";
import { initialPrograms, initialLogs } from "./mockData";
import { safeStorage } from "./safeStorage";
import { db, auth, OperationType, handleFirestoreError } from "./firebase";
import { signInAnonymously } from "firebase/auth";
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  writeBatch,
  getDocFromServer
} from "firebase/firestore";

// Synchronize User session with Firebase Auth & Profile DB
export async function syncUserWithFirebase(user: UserAccount | null): Promise<void> {
  if (!user) {
    return;
  }
  try {
    // CRITICAL CONSTRAINT: Test connection initially
    try {
      await getDocFromServer(doc(db, "test", "connection"));
    } catch (error) {
      if (error instanceof Error && error.message.includes("the client is offline")) {
        console.error("Please check your Firebase configuration.");
      }
    }

    const userCredential = await signInAnonymously(auth);
    const uid = userCredential.user.uid;
    
    // Store user session in users collection to satisfy security rules check
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, {
      email: user.email,
      name: user.name,
      role: user.role,
      roleName: user.roleName,
      ownerName: user.ownerName || ""
    });
    console.log("Firebase sync successful for user:", uid);
  } catch (error) {
    console.error("Failed to sync user with Firebase:", error);
    throw error;
  }
}

export function deduplicatePrograms(progs: ProgramJob[]): { unique: ProgramJob[], duplicates: ProgramJob[] } {
  const seenTopics = new Set<string>();
  const unique: ProgramJob[] = [];
  const duplicates: ProgramJob[] = [];
  
  const sorted = [...progs].sort((a, b) => (a.no || 0) - (b.no || 0));
  
  for (const p of sorted) {
    const normTopic = (p.topic || "").trim().toLowerCase();
    if (seenTopics.has(normTopic)) {
      duplicates.push(p);
    } else {
      seenTopics.add(normTopic);
      unique.push(p);
    }
  }
  
  unique.forEach((p, index) => {
    p.no = index + 1;
  });
  
  return { unique, duplicates };
}

// Local cache functions used as fallbacks
function getLocalPrograms(): ProgramJob[] {
  const data = safeStorage.getItem("kai_programs");
  if (data) {
    try {
      const parsed = JSON.parse(data) as ProgramJob[];
      let modified = false;
      const enriched = parsed.map((p) => {
        let hasChanges = false;
        const up = { ...p };

        const validOwners = ["DC", "DJ", "DN", "DR", "DS", "DH", "DI", "DF"];
        const ownersList = (up.owner || "").split(",").map(o => o.trim()).filter(Boolean);
        const hasInvalidOwner = ownersList.some(o => !validOwners.includes(o));
        if (hasInvalidOwner || (ownersList.length === 0 && up.owner !== "")) {
          const mappedList = ownersList.map(o => {
            const cleanOpt = o.toUpperCase();
            if (validOwners.includes(cleanOpt)) return cleanOpt;
            if (cleanOpt === "ZS" || cleanOpt === "SG") return "DC";
            if (cleanOpt === "KS") return "DN";
            if (cleanOpt === "HS" || cleanOpt === "HO" || cleanOpt === "HL" || cleanOpt === "HC") return "DR";
            if (cleanOpt === "SC") return "DH";
            if (cleanOpt === "ZL" || cleanOpt === "IS" || cleanOpt === "IP" || cleanOpt === "FM" || cleanOpt === "FS" || cleanOpt === "ISM" || cleanOpt === "DI" || cleanOpt === "DO" || cleanOpt === "DT" || cleanOpt === "DK") return "DI";
            if (cleanOpt === "KAWISTA" || cleanOpt === "CS" || cleanOpt === "CC" || cleanOpt === "KALOG" || cleanOpt === "RMU") return "DS";
            if (cleanOpt === "TE") return "DF";
            if (cleanOpt === "SCB") return "DJ";
            const hash = cleanOpt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return validOwners[Math.abs(hash) % validOwners.length];
          });
          const filteredMapped = Array.from(new Set(mappedList)).filter(o => validOwners.includes(o));
          up.owner = filteredMapped.length > 0 ? filteredMapped.join(", ") : "DC";
          hasChanges = true;
        }

        const validRoles = [
          "Orchestrator",
          "Challenger",
          "Reviewer",
          "Integrator",
          "Strategist",
          "Value Designer",
          "Quality Gate Controller",
          "Program Designer",
          "Benchmark",
          "Governance"
        ];
        if (!up.ztRole || !validRoles.includes(up.ztRole)) {
          const oldRole = up.ztRole || "";
          if (oldRole.includes("Tata Kelola")) {
            up.ztRole = "Governance";
          } else if (oldRole.includes("Penyelarasan")) {
            up.ztRole = "Strategist";
          } else if (oldRole.includes("Koordinasi")) {
            up.ztRole = "Integrator";
          } else if (oldRole.includes("Monitoring")) {
            up.ztRole = "Quality Gate Controller";
          } else if (oldRole.includes("Contributing")) {
            up.ztRole = "Program Designer";
          } else if (oldRole.includes("Owner")) {
            up.ztRole = "Orchestrator";
          } else {
            up.ztRole = "Orchestrator";
          }
          hasChanges = true;
        }

        if (up.riskLevel) {
          let expectedPriority: "Critical" | "High" | "Medium" | "Low" = "Medium";
          if (up.riskLevel === "Critical") expectedPriority = "Critical";
          else if (up.riskLevel === "High") expectedPriority = "High";
          else if (up.riskLevel === "Medium") expectedPriority = "Medium";
          else expectedPriority = "Low";

          if (up.priority !== expectedPriority) {
            up.priority = expectedPriority;
            hasChanges = true;
          }
        } else if (up.priority) {
          let expectedRiskLevel: "Critical" | "High" | "Medium" | "Low" | "" = "";
          if (up.priority === "Critical") expectedRiskLevel = "Critical";
          else if (up.priority === "High") expectedRiskLevel = "High";
          else if (up.priority === "Medium") expectedRiskLevel = "Medium";
          else expectedRiskLevel = "Low";

          if (up.riskLevel !== expectedRiskLevel) {
            up.riskLevel = expectedRiskLevel;
            hasChanges = true;
          }
        }

        if (hasChanges) modified = true;
        return up;
      });
      
      const { unique, duplicates } = deduplicatePrograms(enriched);
      if (duplicates.length > 0 || modified) {
        safeStorage.setItem("kai_programs", JSON.stringify(unique));
        return unique;
      }
      return enriched;
    } catch (e) {
      console.error("Error parsing local programs", e);
    }
  }
  
  const progs = initialPrograms.map((p, idx) => ({ 
    ...p, 
    id: `local-${idx}`
  })) as ProgramJob[];
  
  const { unique } = deduplicatePrograms(progs);
  safeStorage.setItem("kai_programs", JSON.stringify(unique));
  return unique;
}

function saveLocalPrograms(programs: ProgramJob[]) {
  safeStorage.setItem("kai_programs", JSON.stringify(programs));
}

function getLocalLogs(): MeetingLog[] {
  const data = safeStorage.getItem("kai_logs");
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error("Error parsing local logs", e);
    }
  }
  const logs = initialLogs.map((l, idx) => ({ ...l, id: `local-log-${idx}` })) as MeetingLog[];
  safeStorage.setItem("kai_logs", JSON.stringify(logs));
  return logs;
}

function saveLocalLogs(logs: MeetingLog[]) {
  safeStorage.setItem("kai_logs", JSON.stringify(logs));
}

function getLocalDocuments(): CloudDocument[] {
  const data = safeStorage.getItem("kai_documents");
  if (data) {
    try {
      return JSON.parse(data) as CloudDocument[];
    } catch (e) {
      console.error("Error parsing local documents", e);
    }
  }
  return [];
}

function saveLocalDocuments(docs: CloudDocument[]) {
  safeStorage.setItem("kai_documents", JSON.stringify(docs));
}

export function isQuotaExceeded(): boolean {
  return false;
}

export function resetQuotaStatus(): void {}

export function isLocalFallbackActive(): boolean {
  return false;
}

export function toggleLocalFallback(forceLocal: boolean): void {}

export function clearLocalFallbackCache(): void {
  safeStorage.removeItem("kai_programs");
  safeStorage.removeItem("kai_logs");
  safeStorage.removeItem("kai_documents");
}

// Check database empty state and seed standard corporate data inside Firestore
export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  try {
    const progCollection = collection(db, "programs");
    const progSnapshot = await getDocs(progCollection);
    
    if (progSnapshot.empty) {
      console.log("Firestore database empty. Seeding initial corporate data...");
      const batch = writeBatch(db);
      
      initialPrograms.forEach((p, idx) => {
        const id = `program-${idx + 1}`;
        const ref = doc(db, "programs", id);
        batch.set(ref, {
          ...p,
          id,
          updatedAt: p.updatedAt || new Date().toISOString().replace("T", " ").substring(0, 16)
        });
      });
      
      initialLogs.forEach((l, idx) => {
        const id = `log-${idx + 1}`;
        const ref = doc(db, "meeting_logs", id);
        batch.set(ref, {
          ...l,
          id
        });
      });
      
      await batch.commit();
      console.log("Firebase seeding completed successfully!");
    }
    return true;
  } catch (error) {
    console.warn("Could not seed Firestore (possibly due to Viewer permissions or offline state). Graceful bypass.", error);
    return false;
  }
}

// Retrieve all Programs sorted by 'no' ascending
export async function getAllPrograms(): Promise<ProgramJob[]> {
  try {
    const q = query(collection(db, "programs"), orderBy("no", "asc"));
    const snapshot = await getDocs(q);
    const progs: ProgramJob[] = [];
    snapshot.forEach(docSnap => {
      progs.push({ id: docSnap.id, ...docSnap.data() } as ProgramJob);
    });
    saveLocalPrograms(progs);
    return progs;
  } catch (error) {
    console.warn("getAllPrograms using offline cache:", error);
    return getLocalPrograms();
  }
}

// Retrieve all Meeting Logs sorted by date descending
export async function getAllMeetingLogs(): Promise<MeetingLog[]> {
  try {
    const q = query(collection(db, "meeting_logs"), orderBy("meetingDate", "desc"));
    const snapshot = await getDocs(q);
    const logs: MeetingLog[] = [];
    snapshot.forEach(docSnap => {
      logs.push({ id: docSnap.id, ...docSnap.data() } as MeetingLog);
    });
    saveLocalLogs(logs);
    return logs;
  } catch (error) {
    console.warn("getAllMeetingLogs using offline cache:", error);
    return getLocalLogs();
  }
}

// Insert new program to Firestore
export async function addNewProgram(program: Omit<ProgramJob, "id" | "no">): Promise<ProgramJob> {
  const currentProgs = await getAllPrograms();
  const nextNo = currentProgs.length > 0 ? Math.max(...currentProgs.map(p => p.no || 0)) + 1 : 1;
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  
  const tempId = `program-${Date.now()}`;
  const payload: ProgramJob = {
    ...program,
    id: tempId,
    no: nextNo,
    updatedAt: nowStr
  } as ProgramJob;

  try {
    await setDoc(doc(db, "programs", tempId), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `programs/${tempId}`);
    throw error;
  }
}

// Atomically record progress updates & add a meeting log (Pillar 7 Atomicity)
export async function updateProgramAndLogMeeting(
  programId: string,
  updatedFields: Partial<ProgramJob>,
  logDetails: {
    notes: string;
    previousStatus: "Green" | "Yellow" | "Red" | "Blocked";
    newStatus: "Green" | "Yellow" | "Red" | "Blocked";
    previousProgress: number;
    newProgress: number;
    recordedBy: string;
    programTitle: string;
    files?: AttachmentFile[];
    documentLink?: string;
  }
): Promise<void> {
  const meetingDate = new Date().toISOString().replace("T", " ").substring(0, 16);
  const fieldsWithTime = {
    ...updatedFields,
    updatedAt: meetingDate
  };

  const batch = writeBatch(db);
  const progRef = doc(db, "programs", programId);
  batch.update(progRef, fieldsWithTime);

  const logId = `log-${Date.now()}`;
  const logRef = doc(db, "meeting_logs", logId);
  
  const newLogRecord: MeetingLog = {
    id: logId,
    programId,
    programTitle: logDetails.programTitle,
    meetingDate,
    notes: logDetails.notes,
    previousStatus: logDetails.previousStatus,
    newStatus: logDetails.newStatus,
    previousProgress: logDetails.previousProgress,
    newProgress: logDetails.newProgress,
    recordedBy: logDetails.recordedBy || "Executive Moderator",
    files: logDetails.files || [],
    documentLink: logDetails.documentLink || ""
  };
  batch.set(logRef, newLogRecord);

  try {
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `programs/${programId} + meeting_logs/${logId}`);
    throw error;
  }
}

// Update program attributes only
export async function updateProgramFieldsOnly(
  programId: string,
  updatedFields: Partial<ProgramJob>
): Promise<void> {
  const meetingDate = new Date().toISOString().replace("T", " ").substring(0, 16);
  const fieldsWithTime = {
    ...updatedFields,
    updatedAt: meetingDate
  };

  try {
    const progRef = doc(db, "programs", programId);
    await updateDoc(progRef, fieldsWithTime);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `programs/${programId}`);
    throw error;
  }
}

// Delete program
export async function deleteProgram(programId: string): Promise<void> {
  try {
    const progRef = doc(db, "programs", programId);
    await deleteDoc(progRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `programs/${programId}`);
    throw error;
  }
}

// Cloud Documents Retrieve
export async function getAllCloudDocuments(): Promise<CloudDocument[]> {
  try {
    const q = query(collection(db, "cloud_documents"), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    const docs: CloudDocument[] = [];
    snapshot.forEach(docSnap => {
      docs.push({ id: docSnap.id, ...docSnap.data() } as CloudDocument);
    });
    saveLocalDocuments(docs);
    return docs;
  } catch (error) {
    console.warn("getAllCloudDocuments using offline cache:", error);
    return getLocalDocuments();
  }
}

// Add new cloud document
export async function addNewCloudDocument(docFields: Omit<CloudDocument, "id">): Promise<CloudDocument> {
  const nowStr = new Date().toISOString().replace("T", " ").substring(0, 16);
  const tempId = `doc-${Date.now()}`;
  const payload: CloudDocument = {
    ...docFields,
    id: tempId,
    createdAt: nowStr
  } as CloudDocument;

  try {
    await setDoc(doc(db, "cloud_documents", tempId), payload);
    return payload;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `cloud_documents/${tempId}`);
    throw error;
  }
}

// Delete cloud document
export async function deleteCloudDocument(docId: string): Promise<void> {
  try {
    const docRef = doc(db, "cloud_documents", docId);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `cloud_documents/${docId}`);
    throw error;
  }
}

// Clear all records
export async function clearAllProgramsAndLogs(): Promise<void> {
  try {
    const batch = writeBatch(db);
    const programsSnap = await getDocs(collection(db, "programs"));
    programsSnap.forEach(d => batch.delete(d.ref));

    const logsSnap = await getDocs(collection(db, "meeting_logs"));
    logsSnap.forEach(d => batch.delete(d.ref));

    await batch.commit();
  } catch (error) {
    console.error("Could not clear cloud DB, resetting local only", error);
  }
  saveLocalPrograms([]);
  saveLocalLogs([]);
}

// Hard Reset Database with original datasets
export async function forceResetDatabaseWithStandardCorporateData(): Promise<void> {
  await clearAllProgramsAndLogs();
  await initializeDatabaseIfEmpty();
}
