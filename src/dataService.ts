import { ProgramJob, MeetingLog, CloudDocument, AttachmentFile } from "./types";
import { initialPrograms, initialLogs } from "./mockData";
import { safeStorage } from "./safeStorage";

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

function getLocalPrograms(): ProgramJob[] {
  const data = safeStorage.getItem("kai_programs");
  if (data) {
    try {
      const parsed = JSON.parse(data) as ProgramJob[];
      let modified = false;
      const enriched = parsed.map((p, idx) => {
        let hasChanges = false;
        const up = { ...p };

        // Robust owner cleaning / migration to the 8 allowed ones (DC, DJ, DN, DR, DS, DH, DI, DF)
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
            // Default select based on name hash if completely unknown
            const hash = cleanOpt.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
            return validOwners[Math.abs(hash) % validOwners.length];
          });
          const filteredMapped = Array.from(new Set(mappedList)).filter(o => validOwners.includes(o));
          up.owner = filteredMapped.length > 0 ? filteredMapped.join(", ") : "DC";
          hasChanges = true;
        }

        // Clean & migrate ztRole to the 10 allowed ones
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

        // Ensure priority and riskLevel are synchronized on load
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
  
  // Initialize with initialPrograms
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
  return true;
}

export function toggleLocalFallback(forceLocal: boolean): void {}

export function clearLocalFallbackCache(): void {
  safeStorage.removeItem("kai_programs");
  safeStorage.removeItem("kai_logs");
  safeStorage.removeItem("kai_documents");
}

export async function initializeDatabaseIfEmpty(): Promise<boolean> {
  getLocalPrograms();
  getLocalLogs();
  return true;
}


export async function getAllPrograms(): Promise<ProgramJob[]> {
  return getLocalPrograms();
}

export async function getAllMeetingLogs(): Promise<MeetingLog[]> {
  return getLocalLogs();
}

export async function addNewProgram(program: Omit<ProgramJob, "id" | "no">): Promise<ProgramJob> {
  const currentProgs = getLocalPrograms();
  const nextNo = currentProgs.length > 0 ? Math.max(...currentProgs.map(p => p.no)) + 1 : 1;
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  
  const newProg: ProgramJob = {
    id: `local-${Date.now()}`,
    ...program,
    no: nextNo,
    updatedAt: nowStr
  } as ProgramJob;
  
  currentProgs.push(newProg);
  saveLocalPrograms(currentProgs);
  return newProg;
}

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
  const meetingDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const fieldsWithTime = {
    ...updatedFields,
    updatedAt: meetingDate
  };
  
  const localProgs = getLocalPrograms();
  const updatedProgs = localProgs.map(p => p.id === programId ? { ...p, ...fieldsWithTime } : p);
  saveLocalPrograms(updatedProgs);
  
  const localLogs = getLocalLogs();
  const newLogRecord: MeetingLog = {
    id: `local-log-${Date.now()}`,
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
  localLogs.unshift(newLogRecord);
  saveLocalLogs(localLogs);
}

export async function updateProgramFieldsOnly(
  programId: string,
  updatedFields: Partial<ProgramJob>
): Promise<void> {
  const meetingDate = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const fieldsWithTime = {
    ...updatedFields,
    updatedAt: meetingDate
  };
  
  const localProgs = getLocalPrograms();
  const updatedProgs = localProgs.map(p => p.id === programId ? { ...p, ...fieldsWithTime } : p);
  saveLocalPrograms(updatedProgs);
}

export async function deleteProgram(programId: string): Promise<void> {
  const localProgs = getLocalPrograms();
  const updatedProgs = localProgs.filter(p => p.id !== programId);
  saveLocalPrograms(updatedProgs);
}

export async function getAllCloudDocuments(): Promise<CloudDocument[]> {
  return getLocalDocuments();
}

export async function addNewCloudDocument(docFields: Omit<CloudDocument, "id">): Promise<CloudDocument> {
  const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
  const payload = {
    ...docFields,
    createdAt: nowStr
  };
  
  const newDoc: CloudDocument = {
    id: `local-${Date.now()}`,
    ...payload
  } as CloudDocument;
  
  const currentDocs = getLocalDocuments();
  currentDocs.unshift(newDoc);
  saveLocalDocuments(currentDocs);
  return newDoc;
}

export async function deleteCloudDocument(docId: string): Promise<void> {
  const localDocs = getLocalDocuments();
  const updatedDocs = localDocs.filter(d => d.id !== docId);
  saveLocalDocuments(updatedDocs);
}

export async function clearAllProgramsAndLogs(): Promise<void> {
  safeStorage.setItem("kai_programs", JSON.stringify([]));
  safeStorage.setItem("kai_logs", JSON.stringify([]));
}

export async function forceResetDatabaseWithStandardCorporateData(): Promise<void> {
  safeStorage.removeItem("kai_programs");
  safeStorage.removeItem("kai_logs");
  getLocalPrograms();
  getLocalLogs();
}
