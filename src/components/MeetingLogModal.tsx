import React, { useState, useEffect, useMemo } from "react";
import { ProgramJob, MeetingLog, AttachmentFile, UserAccount } from "../types";
import { 
  X, 
  CheckCircle2, 
  History, 
  User, 
  Calendar, 
  ArrowRight, 
  Layers, 
  Tags, 
  Flame, 
  TrendingUp, 
  FileText, 
  ShieldAlert, 
  Plus, 
  FileEdit,
  Paperclip,
  Trash2,
  ExternalLink,
  Activity,
  FileCheck,
  AlertTriangle,
  Search,
  ChevronRight,
  Info,
  Eye,
  Download,
  File
} from "lucide-react";

interface MeetingLogModalProps {
  isOpen: boolean;
  program: ProgramJob | null;
  programs?: ProgramJob[];
  logs: MeetingLog[];
  onClose: () => void;
  onSubmit: (
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
  ) => void;
  currentUser?: UserAccount | null;
}

export default function MeetingLogModal({ 
  isOpen, 
  program, 
  programs = [], 
  logs, 
  onClose, 
  onSubmit,
  currentUser
}: MeetingLogModalProps) {
  // Tabs "details" = View complete Program details, "add_mom" = Write notes & update
  const [activeTab, setActiveTab] = useState<"details" | "add_mom">("details");
  const [notes, setNotes] = useState("");
  const [recordedBy, setRecordedBy] = useState("Executive Moderator");
  
  // Local active program selection
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [sidebarSearch, setSidebarSearch] = useState("");

  // -- File Attachments and Document Links States --
  const [logFiles, setLogFiles] = useState<AttachmentFile[]>([]);
  const [logDocumentLink, setLogDocumentLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<AttachmentFile | null>(null);

  // Sync with initial program prop on opening
  useEffect(() => {
    if (program) {
      setSelectedProgramId(program.id);
      setNotes("");
      setLogFiles([]);
      setLogDocumentLink("");
      setActiveTab("details");
    }
  }, [program, isOpen]);

  // Find currently active program either from selected ID or fallback to prop
  const activeProgram = useMemo(() => {
    const found = programs.find(p => p.id === selectedProgramId);
    return found || program;
  }, [programs, selectedProgramId, program]);

  const isOwner = useMemo(() => {
    if (!activeProgram || !currentUser) return false;
    if (currentUser.role === "ADMIN" || currentUser.role === "TEAM_INTERNAL") return true;
    return false;
  }, [activeProgram, currentUser]);

  useEffect(() => {
    if (currentUser) {
      setRecordedBy(currentUser.name || currentUser.roleName || "");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isOwner && activeTab === "add_mom") {
      setActiveTab("details");
    }
  }, [isOwner, activeTab]);

  // Form states for new progress & status (synced to active program)
  const [newStatus, setNewStatus] = useState<ProgramJob["statusTracker"]>("Green");
  const [newProgress, setNewProgress] = useState(0);

  useEffect(() => {
    if (activeProgram) {
      setNewStatus(activeProgram.statusTracker);
      setNewProgress(activeProgram.progress);
    }
  }, [activeProgram]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > 1500000) {
        alert(`File "${file.name}" melebihi batas maksimum 1.5MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogFiles((prev) => [
          ...prev,
          {
            name: file.name,
            type: file.type,
            size: file.size,
            dataUrl: reader.result as string,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });
  };

  if (!isOpen || !activeProgram) return null;

  // Filter programs for modal sidebar
  const filteredPrograms = programs.filter(p => {
    const term = sidebarSearch.toLowerCase();
    return (
      p.topic.toLowerCase().includes(term) ||
      (p.owner && p.owner.toLowerCase().includes(term)) ||
      (p.no && String(p.no).toLowerCase().includes(term))
    );
  });

  // Filter logs for active program and sort descending by date
  const programLogs = logs
    .filter((l) => l.programId === activeProgram.id)
    .sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      alert("Harap masukkan catatan hasil meeting!");
      return;
    }

    const updatedFields: Partial<ProgramJob> = {
      statusTracker: newStatus,
      progress: newProgress,
    };

    const logDetails = {
      notes: notes.trim(),
      previousStatus: activeProgram.statusTracker,
      newStatus,
      previousProgress: activeProgram.progress,
      newProgress,
      recordedBy: recordedBy.trim() || "Executive Moderator",
      programTitle: activeProgram.topic,
      files: logFiles,
      documentLink: logDocumentLink
    };

    onSubmit(activeProgram.id, updatedFields, logDetails);
    setNotes("");
    setLogFiles([]);
    setLogDocumentLink("");
    setActiveTab("details");
  };

  const getStatusLabelColor = (status: "Green" | "Yellow" | "Red" | "Blocked") => {
    switch (status) {
      case "Green":
        return "bg-emerald-50 text-emerald-800 border-emerald-200";
      case "Yellow":
        return "bg-amber-50 text-amber-800 border-amber-200";
      case "Red":
        return "bg-rose-50 text-rose-800 border-rose-250";
      case "Blocked":
        return "bg-slate-100 text-slate-800 border-slate-300";
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 flex items-start sm:items-center justify-center">
      <div className="relative w-full max-w-7xl bg-white rounded-xl shadow-2xl flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto h-auto lg:h-[90vh] overflow-hidden lg:overflow-hidden">
        
        {/* Modal Top Header */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800 relative">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-indigo-650 rounded-lg text-white shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-sans leading-tight break-words">
                DETAIL PROGRAM TRACKER & ROADMAP STATUS
              </h3>
              <p className="text-[10px] sm:text-xs text-indigo-300 font-mono mt-0.5 font-medium max-w-full truncate">
                Active Initiative: <span className="text-white font-bold">{activeProgram.no ? `[${activeProgram.no}] ` : ""}{activeProgram.topic}</span>
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Tutup"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Navigation & Status Ribbon */}
        <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("details")}
              className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "details"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-250"
                  : "text-slate-550 hover:bg-white hover:text-slate-800"
              }`}
            >
              <FileText className="w-4 h-4 text-indigo-650" />
              Detail Program Tracker
            </button>
            {isOwner && (
              <button
                onClick={() => setActiveTab("add_mom")}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "add_mom"
                    ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700"
                    : "text-slate-550 hover:bg-white hover:text-slate-800"
                }`}
              >
                <FileEdit className="w-4 h-4" />
                Update Progress & Buat MoM
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide border rounded-md ${getStatusLabelColor(activeProgram.statusTracker)}`}>
              Status: {activeProgram.statusTracker}
            </span>
            <span className="px-2.5 py-1 text-[10px] bg-slate-200 text-slate-750 font-extrabold font-mono rounded">
              {activeProgram.progress}% Completed
            </span>
          </div>
        </div>

        {/* Screen Tri-Split Layout */}
        <div className="flex flex-col lg:flex-row flex-1 overflow-visible lg:overflow-hidden min-h-0 bg-slate-50/20">
          
          {/* PANAL 1 (INNER LEFT): Sidebar selector of ALL program trackers */}
          <div className="w-full lg:w-72 bg-slate-50 border-b lg:border-b-0 lg:border-r border-slate-200 flex flex-col shrink-0 h-[180px] lg:h-auto">
            <div className="p-3 border-b border-slate-200 bg-white shrink-0">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari inisiatif..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 outline-none focus:ring-1 focus:ring-indigo-500 font-medium text-slate-850"
                />
              </div>
              <div className="mt-1.5 flex items-center justify-between text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                <span>Inisiatif Program ({filteredPrograms.length})</span>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-150 p-2 space-y-1 bg-slate-50/40">
              {filteredPrograms.map((p) => {
                const isActive = p.id === activeProgram.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      setSelectedProgramId(p.id);
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1.5 cursor-pointer ${
                      isActive 
                        ? "bg-white border-indigo-400 shadow-md ring-1 ring-indigo-500/20" 
                        : "bg-white/80 hover:bg-white border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="font-mono text-[9px] bg-slate-100 text-slate-650 font-bold px-1.5 py-0.5 rounded shrink-0">
                        No. {p.no || "-"}
                      </span>
                      <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${
                        p.priority === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                        p.priority === "High" ? "bg-orange-50 text-orange-750 border-orange-200" :
                        p.priority === "Medium" ? "bg-amber-50 text-amber-750 border-amber-250" :
                        "bg-slate-50 text-slate-600 border-slate-200"
                      }`}>
                        {p.priority === "Critical" ? "P1 (Crit)" :
                         p.priority === "High" ? "P2 (High)" :
                         p.priority === "Medium" ? "P3 (Med)" : "P4 (Low)"}
                      </span>
                    </div>

                    <p className={`text-xs font-bold leading-tight ${isActive ? "text-indigo-950 font-extrabold" : "text-slate-800"}`}>
                      {p.topic}
                    </p>

                    <div className="flex items-center justify-between text-[9px] text-slate-500 mt-1 border-t border-slate-100 pt-1 w-full">
                      <span className="font-medium truncate max-w-[110px]">{p.owner || "No owner"}</span>
                      <span className="font-bold text-slate-700 font-mono">{p.progress}%</span>
                    </div>
                  </button>
                );
              })}
              {filteredPrograms.length === 0 && (
                <div className="text-center py-8 text-xs text-slate-400 font-mono italic">
                  Tidak ditemukan inisiatif.
                </div>
              )}
            </div>
          </div>

          {/* PANEL 2 (INNER CENTER): Displays activeTab content */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-visible lg:overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 min-h-0">
            {activeTab === "details" ? (
              <div className="space-y-6 animate-in fade-in duration-200">
                
                {/* 1. TYPOGRAPHIC HERO HEADER */}
                <div className="bg-white border border-slate-200/80 rounded-xl p-6 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1.5 bg-indigo-600" />
                  
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] bg-slate-900 text-slate-100 font-extrabold uppercase px-2.5 py-0.5 rounded font-mono">
                        Initiative No. {activeProgram.no || "TBA"}
                      </span>
                      <span className="text-[9px] bg-indigo-50 text-indigo-800 font-extrabold uppercase px-2.5 py-0.5 rounded font-mono">
                        {activeProgram.cluster || "No Cluster"}
                      </span>
                      {activeProgram.priority && (
                        <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded font-mono border ${
                          activeProgram.priority === "Critical" ? "bg-rose-50 text-rose-700 border-rose-200" :
                          activeProgram.priority === "High" ? "bg-orange-50 text-orange-750 border-orange-200" :
                          activeProgram.priority === "Medium" ? "bg-amber-50 text-amber-700 border-amber-250" :
                          "bg-slate-100 text-slate-600 border-slate-200"
                        }`}>
                          {activeProgram.priority === "Critical" ? "P1 (Critical)" :
                           activeProgram.priority === "High" ? "P2 (High)" :
                           activeProgram.priority === "Medium" ? "P3 (Medium)" : "P4 (Low)"}
                        </span>
                      )}
                      {activeProgram.request && (
                        <span className="text-[9px] bg-teal-50 text-teal-800 font-extrabold uppercase px-2.5 py-0.5 rounded font-mono border border-teal-150">
                          Request: {activeProgram.request}
                        </span>
                      )}
                    </div>
                    
                    <h4 className="text-xl font-black font-sans text-slate-900 tracking-tight leading-snug">
                      {activeProgram.topic}
                    </h4>
                  </div>

                  {/* Elegant Split Metadata Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 pt-5 mt-5 border-t border-slate-100 text-xs">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Unit Owner</span>
                      <span className="font-extrabold text-slate-800 text-xs">{activeProgram.owner || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">ZT Role / PIC</span>
                      <span className="font-semibold text-slate-800 text-xs">
                        {activeProgram.ztRole || "-"} / <span className="text-indigo-600 font-bold">{activeProgram.ztPic || "-"}</span>
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Konseptor Justifikasi</span>
                      <span className="font-bold text-indigo-700 text-xs">{activeProgram.justificationConceptor || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Start Date</span>
                      <span className="font-extrabold text-indigo-800 text-xs font-mono inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                        {activeProgram.startDate || "TBA"}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Target Deadline</span>
                      <span className="font-extrabold text-rose-700 text-xs font-mono inline-flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-rose-500" />
                        {activeProgram.deadline || "TBA"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 mt-4 border-t border-slate-50 text-xs">
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Phase / Gate</span>
                      <span className="font-bold text-indigo-950 bg-indigo-50/70 px-2 py-0.5 rounded text-xs border border-indigo-100 inline-block">{activeProgram.phase || "Kajian"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">DZ Intervention</span>
                      <span className="font-mono font-bold text-slate-700 text-xs">{activeProgram.dzIntervention || "-"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Confidence Level</span>
                      <span className="font-bold text-slate-800 text-xs">{activeProgram.confidence || "Medium"}</span>
                    </div>
                    <div>
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Decision Needed</span>
                      <span className={`text-xs font-extrabold ${activeProgram.decisionNeeded === "Yes" ? "text-amber-600" : "text-slate-500"}`}>
                        {activeProgram.decisionNeeded || "No"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. STRATEGIC IMPACT & MILESTONES (Clean Split Layout) */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                    <Activity className="w-4.5 h-4.5 text-indigo-500" />
                    <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">I. Strategic Status & Milestones</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200/60">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Strategic Impact</span>
                        <p className="text-slate-750 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap shadow-2xs">
                          {activeProgram.strategicImpact || "Tidak ada rincian dampak."}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200/60">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Milestone</span>
                        <p className="text-slate-750 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap shadow-2xs">
                          {activeProgram.currentMilestone || "Tidak ada pencapaian milestone saat ini."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. KEY ISSUES & ACTION PLANS (High-contrast block layouts) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Key Issue Block (Rose warning card) */}
                  <div className="bg-rose-50/30 border border-rose-100 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-1.5 bg-rose-100 text-rose-700 rounded-lg">
                          <AlertTriangle className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-extrabold text-rose-900 uppercase tracking-wide">Key Issue</span>
                      </div>
                      <p className="text-xs text-rose-950 font-medium leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-rose-150 shadow-2xs">
                        {activeProgram.keyIssue || "Tidak ada hambatan atau isu aktif yang teridentifikasi."}
                      </p>
                    </div>
                  </div>

                  {/* Action Plan Block (Teal action card) */}
                  <div className="bg-teal-50/30 border border-teal-100 rounded-xl p-5 shadow-2xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                          <FileCheck className="w-4 h-4" />
                        </span>
                        <span className="text-xs font-extrabold text-teal-900 uppercase tracking-wide">ZT Recommendation</span>
                      </div>
                      <p className="text-xs text-teal-950 font-medium leading-relaxed whitespace-pre-wrap bg-white p-3 rounded-lg border border-teal-150 shadow-2xs">
                        {activeProgram.actionPlan || "Tidak ada rencana aksi tertulis."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 4. RISK REGISTRY & SEVERITY MATRIX */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">II. Risk Registry & Active Issues</span>
                    </div>
                    {activeProgram.riskLevel && (
                      <span className={`px-2.5 py-0.5 rounded font-mono font-bold text-[9px] border ${
                        activeProgram.riskLevel === "Critical" || activeProgram.riskLevel === "High"
                          ? "bg-rose-50 text-rose-850 border-rose-200"
                          : "bg-slate-100 text-slate-650"
                      }`}>
                        Risk Level: {activeProgram.riskLevel}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                    <div className="col-span-2 bg-slate-50/40 p-3 rounded-lg border border-slate-150">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Type / Category</span>
                      <span className="font-extrabold text-slate-800">{activeProgram.riskType || "Belum dievaluasi"}</span>
                    </div>
                    <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-150">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Owner</span>
                      <span className="font-bold text-slate-700">{activeProgram.riskOwner || "-"}</span>
                    </div>
                    <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-150 flex flex-col justify-center">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Status</span>
                      <span className={`inline-block w-fit font-extrabold px-2 py-0.5 rounded text-[9px] uppercase tracking-wider ${
                        activeProgram.riskStatus === "Open" ? "bg-amber-100 text-amber-900" :
                        activeProgram.riskStatus === "Closed" ? "bg-emerald-100 text-emerald-900" :
                        activeProgram.riskStatus === "In Progress" ? "bg-sky-100 text-sky-900" :
                        "bg-slate-100 text-slate-650"
                      }`}>
                        {activeProgram.riskStatus || "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100 text-xs">
                    <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-150">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Escalated To</span>
                      <span className="font-bold text-slate-800">{activeProgram.riskEscalationTo || "Tidak ada eskalasi"}</span>
                    </div>
                    <div className="col-span-2 bg-slate-50/40 p-3 rounded-lg border border-slate-150">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Clear The Path (Intervention)</span>
                      <span className="font-bold text-rose-700">{activeProgram.clearThePath || "-"}</span>
                    </div>
                    <div className="bg-slate-50/40 p-3 rounded-lg border border-slate-150">
                      <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Risk Program Reference</span>
                      <span className="font-bold text-slate-700">{activeProgram.riskProgram || "-"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row gap-5 pt-3 border-t border-slate-100">
                    <div className="grid grid-cols-3 gap-3 bg-slate-100 p-3 rounded-xl border border-slate-200 shrink-0 w-full md:w-64">
                      <div className="text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Impact</span>
                        <span className="font-mono text-sm font-black text-slate-800">{activeProgram.riskImpact || "-"}</span>
                      </div>
                      <div className="text-center border-x border-slate-200">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Probability</span>
                        <span className="font-mono text-sm font-black text-slate-800">{activeProgram.riskProbability || "-"}</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase mb-0.5">Score (I x P)</span>
                        <span className="font-mono text-sm font-black text-rose-700">{activeProgram.riskLevelScore || "0"}</span>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div>
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Risk Issue / Deskripsi</span>
                        <p className="text-slate-700 leading-relaxed bg-slate-50/40 p-2.5 rounded border border-slate-200 text-xs">{activeProgram.riskIssue || "Tidak ada rincian isu risiko."}</p>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold text-slate-450 uppercase tracking-wider mb-1">Mitigasi Risiko / Action Plan</span>
                        <p className="text-slate-700 leading-relaxed font-serif bg-slate-50/40 p-2.5 rounded border border-slate-200 whitespace-pre-wrap text-xs">{activeProgram.riskMitigation || "Belum ada langkah mitigasi aktif."}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 5. DOCUMENTS & FILE ATTACHMENTS */}
                <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-1.5">
                      <Paperclip className="w-4.5 h-4.5 text-indigo-500" />
                      <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wide">III. Documents & References</span>
                    </div>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-[9px] bg-indigo-50 text-indigo-800">
                      {activeProgram.files ? activeProgram.files.length : 0} File(s)
                    </span>
                  </div>

                  {activeProgram.documentLink && (
                    <div className="text-xs space-y-1.5 bg-indigo-50/15 p-3 rounded-lg border border-indigo-100">
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">External Document Link</span>
                      <a
                        href={activeProgram.documentLink.startsWith("http") ? activeProgram.documentLink : `https://${activeProgram.documentLink}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-700 font-extrabold hover:underline inline-flex items-center gap-1.5"
                      >
                        {activeProgram.documentLink}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="text-xs">
                    {activeProgram.files && activeProgram.files.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {activeProgram.files.map((file, fileIdx) => (
                          <div key={fileIdx} className="p-3 border border-slate-150 rounded-lg flex items-center justify-between hover:bg-slate-50 bg-white shadow-2xs">
                            <div className="flex items-center space-x-3 overflow-hidden">
                              <div className="p-2 bg-slate-100 rounded text-slate-600 flex-shrink-0">
                                {file.type.includes("image") ? (
                                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                  </svg>
                                ) : file.type.includes("pdf") ? (
                                  <svg className="w-4 h-4 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                )}
                              </div>
                              <div className="overflow-hidden">
                                <p className="text-xs font-bold text-slate-700 truncate" title={file.name}>{file.name}</p>
                                <p className="text-[10px] text-slate-500 font-semibold font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                              </div>
                            </div>
                            <a
                              href={file.dataUrl}
                              download={file.name}
                              className="p-2 bg-white hover:bg-indigo-50 text-indigo-700 border border-slate-150 rounded-lg transition-colors flex items-center justify-center shrink-0 shadow-2xs"
                              title="Download File"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                        <p className="text-slate-450 font-medium">Belum ada file atau dokumen yang dilampirkan.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            ) : (
              // Tab 2: Update Progress & Record MoM
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-xs text-amber-900 space-y-1">
                  <span className="font-bold block uppercase tracking-wider">Logger Info:</span>
                  <p className="leading-normal font-medium">
                    Formulir di bawah ini menyelaraskan pembukuan Minutes of Meeting (MoM). Tiap kali formulir disimpan, progres dan status pada sistem program tracker akan dimutasikan, dan log permanen akan diarsip otomatis ke database cloud.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 text-xs bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
                  
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Inisiatif Terpilih
                    </label>
                    <div className="p-3 bg-slate-100 border border-slate-200 rounded font-bold text-slate-900">
                      {activeProgram.topic}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Rekomendasi Status Baru
                      </label>
                      <select
                        value={newStatus}
                        onChange={(e) => setNewStatus(e.target.value as any)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-indigo-550 text-slate-800"
                      >
                        <option value="Green">Green (On Track)</option>
                        <option value="Yellow">Yellow (At Risk / Perhatian)</option>
                        <option value="Red">Red (Critical / Intervensi)</option>
                        <option value="Blocked">Blocked (Terhambat)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Progres Baru ({newProgress}%)
                      </label>
                      <div className="flex items-center gap-3 h-[42px] bg-white border border-slate-300 rounded px-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="5"
                          value={newProgress}
                          onChange={(e) => setNewProgress(Number(e.target.value))}
                          className="w-full bg-slate-100 rounded accent-indigo-600"
                        />
                        <span className="text-xs font-mono font-bold text-slate-700 w-8 text-right shrink-0">{newProgress}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Pencatat / Recorded By <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={recordedBy}
                      onChange={(e) => setRecordedBy(e.target.value)}
                      placeholder="e.g. Unit/Direktorat"
                      className="w-full font-medium text-xs bg-white border border-slate-300 rounded px-3 py-2.5 text-slate-850"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Hasil Keputusan & Catatan Meeting <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      required
                      rows={5}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Masukkan poin kesepakatan dewan direksi, program kerja tindak lanjut, status hambatan, atau justifikasi status..."
                      className="w-full font-medium text-xs bg-white border border-slate-300 rounded px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-slate-500 text-slate-850"
                    ></textarea>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Document / Reference Link
                      </label>
                      <input
                        type="url"
                        value={logDocumentLink}
                        onChange={(e) => setLogDocumentLink(e.target.value)}
                        placeholder="e.g. https://drive.google.com/your-doc-link"
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-slate-400 text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Upload Attachment Files
                      </label>
                      <div 
                        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
                          isDragging 
                            ? "border-indigo-600 bg-slate-50/50" 
                            : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/20"
                        }`}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files) {
                            processFiles(e.dataTransfer.files);
                          }
                        }}
                        onClick={() => document.getElementById("log-file-upload-input")?.click()}
                      >
                        <input
                          id="log-file-upload-input"
                          type="file"
                          multiple
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center justify-center space-y-1">
                          <Paperclip className="w-4 h-4 text-indigo-600" />
                          <p className="text-[10px] font-bold text-slate-700">
                            Drop files here, or <span className="text-indigo-600 hover:underline">browse</span>
                          </p>
                          <p className="text-[9px] text-slate-450 font-medium">
                            Up to 1.5MB (PDF, DOCX, XLSX, images)
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {logFiles.length > 0 && (
                    <div className="border border-slate-150 rounded-lg divide-y divide-slate-150 bg-slate-50/40 mt-2">
                      {logFiles.map((file, idx) => (
                        <div key={idx} className="p-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                          <div className="flex items-center space-x-2 overflow-hidden">
                            <div className="p-1 bg-white rounded text-slate-600 flex-shrink-0 border border-slate-100">
                              <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            </div>
                            <div className="overflow-hidden">
                              <p className="text-[10px] font-bold text-slate-700 truncate max-w-[180px]">{file.name}</p>
                              <p className="text-[8px] text-slate-550 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setLogFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="p-1 hover:bg-rose-50 text-slate-450 hover:text-rose-600 rounded transition-colors"
                            title="Remove file"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => setActiveTab("details")}
                      className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-xs font-bold text-white bg-[#f36e21] hover:bg-[#db5610] shadow transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Simpan Catatan & Update Status
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>

          {/* PANEL 3 (INNER RIGHT): Discussion log history timeline */}
          <div className="w-full lg:w-96 p-4 sm:p-6 overflow-y-visible lg:overflow-y-auto bg-white flex flex-col shrink-0 border-t lg:border-t-0 lg:border-l border-slate-200 min-h-0">
            <div className="border-b border-slate-200 pb-2.5 flex items-center justify-between shrink-0">
              <span className="text-[10px] font-mono tracking-wider text-slate-400 font-bold uppercase inline-flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Discussion & MoM History
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-650 font-bold font-mono px-2 py-0.5 rounded-full">
                {programLogs.length} Records
              </span>
            </div>

            <div className="flex-1 overflow-y-auto mt-4 pr-1">
              {programLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center py-12 border border-dashed border-slate-200 rounded-lg text-slate-400 font-mono text-center text-xs space-y-2">
                  <History className="w-7 h-7 text-slate-300 animate-pulse" />
                  <p className="font-bold text-slate-650">Tidak ada log MoM.</p>
                  <p className="font-sans text-[10px] text-slate-400 max-w-[200px] leading-normal italic">
                    Belum ada riwayat koordinasi tercatat untuk inisiatif ini.
                  </p>
                </div>
              ) : (
                <div className="relative border-l border-indigo-150 pl-4 ml-2.5 space-y-4 py-1">
                  {programLogs.map((log) => {
                    const hasProgressChanged = log.newProgress !== log.previousProgress;
                    const progressDiff = log.newProgress - log.previousProgress;
                    
                    return (
                      <div key={log.id} className="relative bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs shadow-2xs hover:border-slate-350 transition-all">
                        
                        {/* Dot timeline marker */}
                        <div className="absolute -left-[21px] top-4 w-2 h-2 rounded-full ring-4 ring-indigo-50 bg-indigo-600" />

                        {/* Top Metabar */}
                        <div className="flex flex-wrap items-center justify-between gap-1 border-b border-slate-200 pb-1.5 mb-2 text-[10px] text-slate-550">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-400" />
                            <span className="font-bold text-slate-700">{log.recordedBy}</span>
                          </div>
                          <div className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            <span>{log.meetingDate}</span>
                          </div>
                        </div>

                        {/* Status badges */}
                        <div className="flex flex-wrap items-center gap-1 mb-2 text-[9px] select-none">
                          {log.previousStatus !== log.newStatus ? (
                            <div className="flex items-center gap-1 bg-white border border-slate-200 px-1 py-0.5 rounded">
                              <span className={`px-1 py-0 rounded-xs font-mono font-extrabold ${getStatusLabelColor(log.previousStatus)}`}>
                                {log.previousStatus}
                              </span>
                              <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                              <span className={`px-1 py-0 rounded-xs font-mono font-extrabold ${getStatusLabelColor(log.newStatus)}`}>
                                {log.newStatus}
                              </span>
                            </div>
                          ) : (
                            <span className={`px-1.5 py-0.5 border rounded font-mono font-bold ${getStatusLabelColor(log.newStatus)}`}>
                              Status: {log.newStatus}
                            </span>
                          )}

                          {hasProgressChanged && (
                            <span className={`px-1.5 py-0.5 rounded font-mono font-bold border border-slate-200 ${progressDiff >= 0 ? "bg-emerald-50 text-emerald-850" : "bg-rose-50 text-rose-850"}`}>
                              {progressDiff >= 0 ? "+" : ""}{progressDiff}% ({log.previousProgress}% &rarr; {log.newProgress}%)
                            </span>
                          )}
                        </div>

                        {/* Notes text */}
                        <p className="text-[11px] leading-relaxed text-slate-750 whitespace-pre-wrap font-serif bg-white p-2.5 rounded-lg border border-slate-100 shadow-3xs">
                          {log.notes}
                        </p>

                        {/* Files and document links if any */}
                        {(log.documentLink || (log.files && log.files.length > 0)) && (
                          <div className="mt-2.5 pt-2 border-t border-slate-200 space-y-1.5 text-[10px]">
                            {log.documentLink && (
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-450 uppercase tracking-wider text-[8px]">Link:</span>
                                <a 
                                  href={log.documentLink}
                                  target="_blank"
                                  referrerPolicy="no-referrer"
                                  rel="noopener noreferrer"
                                  className="text-indigo-650 hover:underline font-bold break-all"
                                >
                                  {log.documentLink}
                                </a>
                              </div>
                            )}
                            {log.files && log.files.length > 0 && (
                              <div className="space-y-1">
                                <span className="font-extrabold text-slate-450 uppercase tracking-wider text-[8px] block">Attachments ({log.files.length}):</span>
                                <div className="space-y-1 max-h-24 overflow-y-auto">
                                  {log.files.map((f, fIdx) => (
                                    <div key={fIdx} className="flex items-center justify-between bg-white px-2 py-1 rounded border border-slate-200 text-[9px] shadow-3xs hover:border-slate-350 transition-colors">
                                      <span className="truncate max-w-[100px] font-medium text-slate-750 font-sans" title={f.name}>
                                        {f.name}
                                      </span>
                                      <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                        <button
                                          type="button"
                                          onClick={() => setSelectedPreviewFile(f)}
                                          className="text-indigo-650 hover:text-indigo-800 p-0.5 hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-center shrink-0"
                                          title="Pratinjau"
                                        >
                                          <Eye className="w-3 h-3" />
                                        </button>
                                        <a 
                                          href={f.dataUrl} 
                                          download={f.name}
                                          className="text-orange-600 hover:text-orange-700 flex items-center justify-center p-0.5 hover:bg-orange-50 rounded shrink-0"
                                          title="Download"
                                        >
                                          <Download className="w-3 h-3" />
                                        </a>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Modal Bottom Actions Footer */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between border-t border-slate-800 shrink-0">
          <div className="text-[10px] text-slate-400 font-mono">
            Active ID: {activeProgram.id}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-md hover:shadow-lg cursor-pointer"
          >
            Selesai & Tutup
          </button>
        </div>

      </div>

      {/* File Preview Modal */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[110] p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col border border-slate-200 animate-scale-in">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-150 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Paperclip className="w-4 h-4 text-indigo-600 shrink-0" />
                <h3 className="text-sm font-bold text-slate-800 truncate" title={selectedPreviewFile.name}>
                  {selectedPreviewFile.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPreviewFile(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex flex-col items-center justify-center bg-slate-50/50 min-h-[300px] max-h-[70vh]">
              {selectedPreviewFile.type.startsWith("image/") ? (
                <div className="bg-white p-2 rounded-lg border border-slate-200 shadow-sm">
                  <img
                    src={selectedPreviewFile.dataUrl}
                    alt={selectedPreviewFile.name}
                    className="max-w-full max-h-[55vh] object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ) : selectedPreviewFile.type.startsWith("text/") || 
                  selectedPreviewFile.name.endsWith(".txt") || 
                  selectedPreviewFile.name.endsWith(".json") || 
                  selectedPreviewFile.name.endsWith(".xml") || 
                  selectedPreviewFile.name.endsWith(".csv") ? (
                <pre className="w-full text-left bg-slate-950 text-slate-200 p-4 rounded-lg text-xs overflow-auto max-h-[55vh] font-mono border border-slate-800 leading-relaxed shadow-inner">
                  {(() => {
                    try {
                      const base64 = selectedPreviewFile.dataUrl.split(",")[1];
                      return atob(base64);
                    } catch (e) {
                      return "Format file tidak dapat didekode sebagai teks.";
                    }
                  })()}
                </pre>
              ) : (
                <div className="text-center p-8 bg-white border border-slate-200 rounded-xl shadow-3xs max-w-md w-full flex flex-col items-center gap-4">
                  <div className="p-4 bg-slate-100 rounded-full text-slate-400">
                    <File className="w-12 h-12" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-800 text-sm">Pratinjau Tidak Tersedia</h4>
                    <p className="text-xs text-slate-500">
                      Pratinjau langsung untuk file bertipe <span className="font-mono text-[11px] bg-slate-100 px-1 py-0.5 rounded border border-slate-200">{selectedPreviewFile.type || "unknown"}</span> tidak didukung.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between">
              <span className="text-xs font-mono text-slate-500">
                Ukuran: {(selectedPreviewFile.size / 1024).toFixed(1)} KB
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedPreviewFile(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                >
                  Tutup
                </button>
                <a
                  href={selectedPreviewFile.dataUrl}
                  download={selectedPreviewFile.name}
                  className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Unduh File
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
