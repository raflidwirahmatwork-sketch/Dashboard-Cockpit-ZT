import React, { useState, useMemo, useEffect } from "react";
import { MeetingLog, ProgramJob, AttachmentFile, UserAccount } from "../types";
import { 
  History, 
  User, 
  Calendar, 
  ArrowRight, 
  Search,
  Filter,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Plus,
  X,
  FileCheck2,
  Info,
  Layers,
  Paperclip,
  Trash2,
  Eye,
  Download
} from "lucide-react";

// Deterministic topic styling helper for visual distinction based on different program topics
const getTopicStyle = (topic: string) => {
  if (!topic) {
    return {
      lineColor: "bg-slate-300",
      dotBorder: "border-slate-500",
      dotBg: "bg-slate-100",
      cardBorder: "border-l-4 border-l-slate-400",
      pillBg: "bg-slate-50 text-slate-700 border-slate-200",
    };
  }
  let hash = 0;
  for (let i = 0; i < topic.length; i++) {
    hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colorSchemes = [
    {
      lineColor: "bg-indigo-400",
      dotBorder: "border-indigo-600",
      dotBg: "bg-indigo-50",
      cardBorder: "border-l-4 border-l-indigo-600",
      pillBg: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    {
      lineColor: "bg-emerald-400",
      dotBorder: "border-emerald-600",
      dotBg: "bg-emerald-50",
      cardBorder: "border-l-4 border-l-emerald-600",
      pillBg: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    {
      lineColor: "bg-amber-400",
      dotBorder: "border-amber-600",
      dotBg: "bg-amber-50",
      cardBorder: "border-l-4 border-l-amber-500",
      pillBg: "bg-amber-50 text-amber-800 border-amber-200",
    },
    {
      lineColor: "bg-rose-400",
      dotBorder: "border-rose-600",
      dotBg: "bg-rose-50",
      cardBorder: "border-l-4 border-l-rose-500",
      pillBg: "bg-rose-50 text-rose-800 border-rose-250",
    },
    {
      lineColor: "bg-violet-400",
      dotBorder: "border-violet-600",
      dotBg: "bg-violet-50",
      cardBorder: "border-l-4 border-l-violet-600",
      pillBg: "bg-violet-50 text-violet-700 border-violet-200",
    },
    {
      lineColor: "bg-sky-400",
      dotBorder: "border-sky-600",
      dotBg: "bg-sky-50",
      cardBorder: "border-l-4 border-l-sky-500",
      pillBg: "bg-sky-50 text-sky-800 border-sky-200",
    },
    {
      lineColor: "bg-teal-400",
      dotBorder: "border-teal-600",
      dotBg: "bg-teal-50",
      cardBorder: "border-l-4 border-l-teal-500",
      pillBg: "bg-teal-50 text-teal-800 border-teal-200",
    },
    {
      lineColor: "bg-fuchsia-400",
      dotBorder: "border-fuchsia-600",
      dotBg: "bg-fuchsia-50",
      cardBorder: "border-l-4 border-l-fuchsia-500",
      pillBg: "bg-fuchsia-50 text-fuchsia-800 border-fuchsia-200",
    }
  ];
  const index = Math.abs(hash) % colorSchemes.length;
  return colorSchemes[index];
};

interface MeetingLogsViewProps {
  logs: MeetingLog[];
  programs: ProgramJob[];
  onSubmitLog: (
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

export default function MeetingLogsView({ logs, programs, onSubmitLog, currentUser }: MeetingLogsViewProps) {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState("all");

  // Add Log form states
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [formProgramId, setFormProgramId] = useState("");
  const [formNewStatus, setFormNewStatus] = useState<ProgramJob["statusTracker"]>("Green");
  const [formNewProgress, setFormNewProgress] = useState(0);
  const [formNotes, setFormNotes] = useState("");
  const [formRecordedBy, setFormRecordedBy] = useState("Executive Moderator");
  const [formTopicSearch, setFormTopicSearch] = useState("");

  // File and document link form states
  const [formFiles, setFormFiles] = useState<AttachmentFile[]>([]);
  const [formDocumentLink, setFormDocumentLink] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<AttachmentFile | null>(null);

  // Sync recordedBy with currentUser's name
  useEffect(() => {
    if (currentUser) {
      setFormRecordedBy(currentUser.name || currentUser.roleName || "");
    }
  }, [currentUser]);

  // Filter programs list inside the add MoM dropdown form when searching topics
  const filteredProgramsForForm = useMemo(() => {
    let list = programs;
    if (currentUser && currentUser.role === "TEAM_INTERNAL" && currentUser.ownerName) {
      const code = currentUser.ownerName.toUpperCase();
      list = programs.filter(p => 
        (p.owner || "").split(",").map(o => o.trim().toUpperCase()).includes(code) ||
        (p.ztPic || "").toUpperCase() === code
      );
    }

    if (!formTopicSearch.trim()) return list;
    const q = formTopicSearch.toLowerCase();
    return list.filter(p => 
      p.topic.toLowerCase().includes(q) || 
      (p.cluster && p.cluster.toLowerCase().includes(q))
    );
  }, [programs, formTopicSearch, currentUser]);

  // Find currently selected program in form for real-time reference retrieval
  const selectedFormProgram = useMemo(() => {
    return programs.find(p => p.id === formProgramId) || null;
  }, [programs, formProgramId]);

  // Synchronize form values whenever user selects a new program topic
  useEffect(() => {
    if (selectedFormProgram) {
      setFormNewStatus(selectedFormProgram.statusTracker);
      setFormNewProgress(selectedFormProgram.progress);
      setFormFiles([]);
      setFormDocumentLink("");
    }
  }, [selectedFormProgram]);

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
        setFormFiles((prev) => [
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

  // Filter and compute active logs list sorted by meetingDate desc
  const filteredLogs = useMemo(() => {
    let result = [...logs];

    // Filter by search term (notes or recordedBy or programTitle)
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (l) =>
          l.notes.toLowerCase().includes(q) ||
          l.recordedBy.toLowerCase().includes(q) ||
          l.programTitle.toLowerCase().includes(q)
      );
    }

    // Filter by selected program
    if (selectedProgramId !== "all") {
      result = result.filter((l) => l.programId === selectedProgramId);
    }

    // Filter by selected status update targets
    if (selectedStatusFilter !== "all") {
      result = result.filter((l) => l.newStatus === selectedStatusFilter);
    }

    // Sort by meetingDate desc, then id desc
    return result.sort((a, b) => b.meetingDate.localeCompare(a.meetingDate));
  }, [logs, searchTerm, selectedProgramId, selectedStatusFilter]);

  // Color helper for status updates inside log timeline
  const getStatusBadgeStyle = (status: "Green" | "Yellow" | "Red" | "Blocked") => {
    switch (status) {
      case "Green":
        return { bg: "bg-emerald-50 text-emerald-800 border-emerald-250", text: "Green" };
      case "Yellow":
        return { bg: "bg-amber-50 text-amber-800 border-amber-250", text: "Yellow" };
      case "Red":
        return { bg: "bg-rose-50 text-rose-800 border-rose-250", text: "Red" };
      case "Blocked":
        return { bg: "bg-slate-100 text-slate-800 border-slate-300", text: "Blocked" };
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProgramId) {
      alert("Harap pilih topic program/inisiatif terlebih dahulu!");
      return;
    }
    if (!formNotes.trim()) {
      alert("Harap masukkan catatan hasil meeting!");
      return;
    }
    if (!selectedFormProgram) return;

    const updatedFields: Partial<ProgramJob> = {
      statusTracker: formNewStatus,
      progress: formNewProgress,
    };

    const logDetails = {
      notes: formNotes.trim(),
      previousStatus: selectedFormProgram.statusTracker,
      newStatus: formNewStatus,
      previousProgress: selectedFormProgram.progress,
      newProgress: formNewProgress,
      recordedBy: formRecordedBy.trim() || "Executive Moderator",
      programTitle: selectedFormProgram.topic,
      files: formFiles,
      documentLink: formDocumentLink
    };

    onSubmitLog(formProgramId, updatedFields, logDetails);
    
    // Reset form states
    setFormProgramId("");
    setFormNotes("");
    setFormRecordedBy("Executive Moderator");
    setFormFiles([]);
    setFormDocumentLink("");
    setIsAddFormOpen(false);
  };

  return (
    <div className="space-y-6">
      
      {/* 1. Page Header & Action Trigger */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl shrink-0">
            <History className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-slate-900 font-sans tracking-tight">
              Archive of Minutes of Meeting (MoM) & Discussion Logs
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed max-w-2xl">
              Riwayat lengkap semua catatan rapat (MoM), kemajuan mingguan, keputusan dewan direksi, dan justifikasi
              yang mempengaruhi status pekerjaan serta pergeseran persentase progres.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {currentUser?.role !== "VIEWER" && (
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm cursor-pointer ${
                isAddFormOpen ? "bg-rose-600 hover:bg-rose-700" : "bg-[#f36e21] hover:bg-[#db5610]"
              }`}
            >
              {isAddFormOpen ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {isAddFormOpen ? "Tutup Form" : "Buat MoM Baru"}
            </button>
          )}
        </div>
      </div>

      {/* 2. Expandable Record MoM / Meeting Log Form Panel */}
      {isAddFormOpen && (
        <div className="bg-white border-2 border-indigo-100 rounded-xl shadow-md overflow-hidden animate-in fade-in duration-150">
          <div className="bg-indigo-950 p-4 border-b border-indigo-900 flex items-center justify-between">
            <div className="flex items-center gap-2 text-white">
              <FileCheck2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider font-mono">RECORD NEW MEETING LOG (MoM)</span>
            </div>
            <button 
              onClick={() => setIsAddFormOpen(false)}
              className="text-indigo-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="p-4 sm:p-5 bg-slate-50/50 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
              
              {/* Topic / Program Selector */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  PILIH TOPIK SEBAGAI ACUAN / INISIATIF <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative mb-1.5">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 text-slate-400 pointer-events-none">
                      <Search className="w-3.5 h-3.5" />
                    </span>
                    <input
                      type="text"
                      placeholder="Cari nama topik inisiatif..."
                      value={formTopicSearch}
                      onChange={(e) => setFormTopicSearch(e.target.value)}
                      className="w-full text-xs font-semibold pl-8 pr-7 py-2 bg-slate-100/50 hover:bg-slate-100 focus:bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 text-slate-800"
                    />
                    {formTopicSearch && (
                      <button
                        type="button"
                        onClick={() => setFormTopicSearch("")}
                        className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    required
                    value={formProgramId}
                    onChange={(e) => setFormProgramId(e.target.value)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="">-- Pilih Program / Inisiatif ({filteredProgramsForForm.length} Cocok) --</option>
                    {filteredProgramsForForm.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.topic} ({p.cluster || "No Cluster"})
                      </option>
                    ))}
                    {filteredProgramsForForm.length === 0 && (
                      <option value="" disabled>-- Tidak ada topik yang cocok --</option>
                    )}
                  </select>
                </div>

                {selectedFormProgram && (
                  <div className="flex items-center gap-2 mt-1.5 p-2 bg-indigo-50/80 border border-indigo-100/50 rounded text-[10px] text-indigo-900 font-mono">
                    <Info className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                    <span>
                      Status Saat Ini: <strong>{selectedFormProgram.statusTracker}</strong> | Progres Saat Ini: <strong>{selectedFormProgram.progress}%</strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Recorder / Recorded By Input */}
              <div className="md:col-span-6 space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  PENCATAT / RECORDED BY <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formRecordedBy}
                  onChange={(e) => setFormRecordedBy(e.target.value)}
                  placeholder="e.g. Robertus Danang"
                  className="w-full font-medium text-xs bg-white border border-slate-300 rounded px-3 py-2.5 text-slate-850"
                />
              </div>

            </div>

            {/* Sub Form: Conditionally rendered once a program is selected */}
            {selectedFormProgram ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 pt-2 border-t border-slate-200">
                
                {/* New Status Select */}
                <div className="md:col-span-4 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    REKOMENDASI STATUS BARU
                  </label>
                  <select
                    value={formNewStatus}
                    onChange={(e) => setFormNewStatus(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-white border border-slate-300 rounded px-3 py-2.5 focus:ring-1 focus:ring-indigo-500 text-slate-800"
                  >
                    <option value="Green">Green (On Track / Sehat)</option>
                    <option value="Yellow">Yellow (At Risk / Perhatian)</option>
                    <option value="Red">Red (Critical / Intervensi)</option>
                    <option value="Blocked">Blocked (Terhambat)</option>
                  </select>
                </div>

                {/* New Progress Range Slider */}
                <div className="md:col-span-8 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    PROGRES REALISASI BARU ({formNewProgress}%)
                  </label>
                  <div className="flex items-center gap-3 bg-white border border-slate-300 rounded px-3 h-[38px]">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={formNewProgress}
                      onChange={(e) => setFormNewProgress(Number(e.target.value))}
                      className="w-full bg-slate-100 rounded accent-indigo-650"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 w-10 text-right shrink-0">{formNewProgress}%</span>
                  </div>
                </div>

                {/* Metas and notes summary text area */}
                <div className="md:col-span-12 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    HASIL KESEPAKATAN / CATATAN MEETING <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    placeholder="Tuliskan keputusan rapat koordinasi, program mitigasi selanjutnya, atau argumentasi kegagalan gate..."
                    className="w-full font-medium text-xs bg-white border border-slate-300 rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-850"
                  ></textarea>
                </div>

                {/* Reference Link Input */}
                <div className="md:col-span-6 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    DOCUMENT / REFERENCE LINK
                  </label>
                  <input
                    type="url"
                    value={formDocumentLink}
                    onChange={(e) => setFormDocumentLink(e.target.value)}
                    placeholder="e.g. https://drive.google.com/your-document-link"
                    className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-3 py-2.5 outline-none focus:ring-1 focus:ring-indigo-400 text-slate-800"
                  />
                </div>

                {/* File Upload Zone */}
                <div className="md:col-span-6 space-y-1">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    UPLOAD ATTACHMENT FILES
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-lg p-3 text-center cursor-pointer transition-all ${
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
                    onClick={() => document.getElementById("meeting-log-form-file-upload")?.click()}
                  >
                    <input
                      id="meeting-log-form-file-upload"
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileChange}
                    />
                    <div className="flex flex-col items-center justify-center space-y-1">
                      <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                      <p className="text-[10px] font-bold text-slate-700">
                        Drop files here, or <span className="text-indigo-600 hover:underline">browse</span>
                      </p>
                      <p className="text-[9px] text-slate-400 font-medium">
                        Up to 1.5MB (PDF, DOCX, XLSX, images)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Uploaded Files List */}
                {formFiles.length > 0 && (
                  <div className="md:col-span-12 border border-slate-150 rounded-lg divide-y divide-slate-100 bg-slate-50/40 mt-1">
                    {formFiles.map((file, index) => (
                      <div key={index} className="p-2 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center space-x-2 overflow-hidden">
                          <div className="p-1 bg-white rounded text-slate-600 flex-shrink-0 border border-slate-100">
                            <Paperclip className="w-3.5 h-3.5 text-indigo-550" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-[10px] font-bold text-slate-700 truncate max-w-[250px]">{file.name}</p>
                            <p className="text-[8px] text-slate-500 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setFormFiles((prev) => prev.filter((_, i) => i !== index))}
                          className="p-1 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Form Actions */}
                <div className="md:col-span-12 flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormProgramId("");
                      setIsAddFormOpen(false);
                    }}
                    className="px-4 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-bold text-white bg-[#f36e21] hover:bg-[#db5610] shadow transition-all cursor-pointer"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Simpan Catatan & Update
                  </button>
                </div>

              </div>
            ) : (
              <div className="p-4 bg-slate-100/70 border border-slate-200 rounded text-center text-xs text-slate-500 font-medium font-sans">
                💡 Harap pilih program topik terlebih dahulu di atas untuk mengisi data evaluasi MoM.
              </div>
            )}
          </form>
        </div>
      )}

      {/* 3. Interactive Search and Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
          
          {/* Keyword search input */}
          <div className="md:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Cari keputusan, nama pencatat, isi catatan..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs font-medium pl-9 pr-4 py-2.5 bg-slate-50/80 hover:bg-slate-50 focus:bg-white border border-slate-250 hover:border-slate-350 focus:border-indigo-500 rounded-lg transition-colors focus:ring-1 focus:ring-indigo-500 font-sans text-slate-800"
            />
          </div>

          {/* Filter by initiative dropdown */}
          <div className="md:col-span-4 relative flex items-center">
            <span className="absolute left-3 text-slate-400 pointer-events-none shrink-0">
              <Filter className="w-3.5 h-3.5" />
            </span>
            <select
              value={selectedProgramId}
              onChange={(e) => setSelectedProgramId(e.target.value)}
              className="w-full text-xs font-semibold pl-8 pr-3 py-2.5 bg-slate-50/85 hover:bg-slate-50 border border-slate-250 rounded-lg transition-colors focus:ring-1 focus:ring-indigo-500 text-slate-750"
            >
              <option value="all">Semua Program / Initiative ({programs.length})</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.topic}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by target status update */}
          <div className="md:col-span-3">
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 bg-slate-50/85 hover:bg-slate-50 border border-slate-250 rounded-lg transition-colors focus:ring-1 focus:ring-indigo-500 text-slate-750"
            >
              <option value="all">Semua Target Status Baru</option>
              <option value="Green">Green (On Track)</option>
              <option value="Yellow">Yellow (At Risk)</option>
              <option value="Red">Red (Critical)</option>
              <option value="Blocked">Blocked</option>
            </select>
          </div>

        </div>
      </div>

      {/* 4. Main Timeline Segment */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-sm">
        
        {filteredLogs.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-lg p-5 text-center text-slate-400 space-y-3">
            <History className="w-8 h-8 text-slate-300 animate-pulse" />
            <div className="space-y-1">
              <p className="font-bold font-mono text-xs text-slate-650">Tidak ada log rapat ditemukan.</p>
              <p className="text-[10px] font-sans text-slate-400 leading-normal max-w-sm">
                Cobalah mengubah kata kunci pencarian Anda atau membuat catatan meeting baru via tombol
                &apos;MoM&apos; di dalam **Program Tracker** atau tekan tombol **Buat MoM Baru** di kanan atas.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative border-l border-slate-200/60 pl-5 ml-3 space-y-6 py-2.5">
            {filteredLogs.map((log) => {
              const prev = getStatusBadgeStyle(log.previousStatus);
              const next = getStatusBadgeStyle(log.newStatus);
              const hasProgressChanged = log.newProgress !== log.previousProgress;
              const progressDiff = log.newProgress - log.previousProgress;
              const topicStyle = getTopicStyle(log.programTitle);

              return (
                <div 
                  key={log.id} 
                  className={`relative bg-slate-50/70 hover:bg-slate-50 border border-slate-200 ${topicStyle.cardBorder} rounded-xl p-4 shadow-2xs hover:shadow-sm transition-all duration-150`}
                >
                  
                  {/* Absolute positioning colored track segment bridging gaps to change timeline line color dynamically */}
                  <div className={`absolute -left-[21px] -top-3.5 -bottom-3.5 w-[2px] ${topicStyle.lineColor}`} />
                  
                  {/* Absolute positioning marker dot matched to topic color */}
                  <div className={`absolute -left-[27px] top-5 w-3.5 h-3.5 rounded-full border-2 ${topicStyle.dotBorder} ${topicStyle.dotBg} shadow-sm z-10`} />

                  {/* Header / Meta bar inside timeline card */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase border font-mono tracking-wide ${topicStyle.pillBg}`}>
                          Topic
                        </span>
                        <span className="text-xs font-extrabold text-slate-900 block font-sans tracking-tight">
                          {log.programTitle}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[10px] text-slate-400 mt-1.5 font-mono">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-600 font-sans">{log.recordedBy || "Unknown"}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          <span>{log.meetingDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Progress tracking badge details */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[9px]">
                      
                      {/* Status evolution badge */}
                      {log.previousStatus !== log.newStatus ? (
                        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1.5 rounded shadow-3xs">
                          <span className={`px-1.5 py-0.5 rounded font-extrabold ${prev.bg}`}>
                            {prev.text}
                          </span>
                          <ArrowRight className="w-3 h-3 text-slate-400" />
                          <span className={`px-1.5 py-0.5 rounded font-extrabold ${next.bg}`}>
                            {next.text}
                          </span>
                        </div>
                      ) : (
                        <span className={`px-2 py-1.5 rounded font-extrabold border bg-white ${next.bg}`}>
                          Status: {next.text}
                        </span>
                      )}

                      {/* Progress increase/decrease badging */}
                      {hasProgressChanged && (
                        <span className={`px-2 py-1.5 rounded font-mono font-bold border ${
                          progressDiff >= 0 
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200" 
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}>
                          {progressDiff >= 0 ? "+" : ""}{progressDiff}% Progress ({log.previousProgress}% &rarr; {log.newProgress}%)
                        </span>
                      )}

                    </div>
                  </div>

                  {/* Decisions and notes details panel */}
                  <p className="text-xs text-slate-705 leading-relaxed font-serif bg-white p-3.5 border border-slate-200 rounded-lg text-slate-700 whitespace-pre-wrap">
                    {log.notes}
                  </p>

                  {/* Document Link and Attachment Files */}
                  {(log.documentLink || (log.files && log.files.length > 0)) && (
                    <div className="mt-3 p-3 bg-white border border-slate-200 rounded-lg space-y-2 text-xs">
                      {log.documentLink && (
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] shrink-0">Link:</span>
                          <a 
                            href={log.documentLink}
                            target="_blank"
                            referrerPolicy="no-referrer"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:underline font-semibold break-all"
                          >
                            {log.documentLink}
                          </a>
                        </div>
                      )}
                      {log.files && log.files.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="font-bold text-slate-500 uppercase tracking-wider text-[9px] block">Attachments ({log.files.length})</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                            {log.files.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center justify-between bg-slate-50 px-3 py-1.5 rounded border border-slate-150 text-xs hover:border-slate-300 transition-colors">
                                <span className="truncate max-w-[110px] font-medium text-slate-700" title={file.name}>
                                  {file.name}
                                </span>
                                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                  <button
                                    onClick={() => setSelectedPreviewFile(file)}
                                    className="text-indigo-600 hover:text-indigo-700 p-1 hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-center shrink-0"
                                    title="Pratinjau"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <a 
                                    href={file.dataUrl} 
                                    download={file.name}
                                    className="text-orange-600 hover:text-orange-700 font-bold flex items-center justify-center p-1 hover:bg-orange-50 rounded shrink-0"
                                    title="Download"
                                  >
                                    <Download className="w-3.5 h-3.5" />
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

      {/* File Preview Modal */}
      {selectedPreviewFile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-[100] p-4 animate-fade-in">
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
                    <FileCheck2 className="w-12 h-12" />
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
