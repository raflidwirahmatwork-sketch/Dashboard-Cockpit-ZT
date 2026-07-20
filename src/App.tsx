import { useState, useEffect, useMemo } from "react";
import { safeStorage } from "./safeStorage";
import { 
  getAllPrograms, 
  getAllMeetingLogs, 
  initializeDatabaseIfEmpty, 
  addNewProgram, 
  updateProgramAndLogMeeting,
  updateProgramFieldsOnly,
  deleteProgram,
  getAllCloudDocuments,
  addNewCloudDocument,
  deleteCloudDocument,
  forceResetDatabaseWithStandardCorporateData,
  clearAllProgramsAndLogs
} from "./dataService";
import { ProgramJob, MeetingLog, CloudDocument, UserAccount } from "./types";
import DashboardView from "./components/DashboardView";
import ProgramTrackerView from "./components/ProgramTrackerView";
import MeetingLogsView from "./components/MeetingLogsView";
import CloudDocumentsView from "./components/CloudDocumentsView";
import AddProgramModal from "./components/AddProgramModal";
import MeetingLogModal from "./components/MeetingLogModal";
import EditProgramModal from "./components/EditProgramModal";
import LoginView from "./components/LoginView";
import { 
  LayoutDashboard, 
  ListTodo, 
  History, 
  FolderSync, 
  Briefcase, 
  Activity, 
  HelpCircle,
  CloudLightning,
  LogOut,
  Shield,
  Trash2,
  RefreshCw
} from "lucide-react";


export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activeTab, setActiveTab] = useState<"dashboard" | "tracker" | "logs" | "cloud_docs">("dashboard");
  const [programs, setPrograms] = useState<ProgramJob[]>([]);
  const [logs, setLogs] = useState<MeetingLog[]>([]);
  const [documents, setDocuments] = useState<CloudDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dbStatus, setDbStatus] = useState<string>("Penyimpanan Lokal Aktif (Local Storage)");

  // Restore session on mount
  useEffect(() => {
    const savedUser = safeStorage.getItem("kai_logged_in_user");
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Failed to parse user session", e);
      }
    }
  }, []);


  // Modal control states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<ProgramJob | null>(null);
  const [selectedProgramForEdit, setSelectedProgramForEdit] = useState<ProgramJob | null>(null);

  const handleLogout = () => {
    safeStorage.removeItem("kai_logged_in_user");
    setCurrentUser(null);
  };

  // Initialize and load application data on startup
  const loadData = async () => {
    setIsLoading(true);
    setDbStatus("Memuat data Penyimpanan Lokal...");
    try {
      await initializeDatabaseIfEmpty();
      
      const fetchedPrograms = await getAllPrograms();
      const fetchedLogs = await getAllMeetingLogs();
      const fetchedDocs = await getAllCloudDocuments();
      
      setPrograms(fetchedPrograms);
      setLogs(fetchedLogs);
      setDocuments(fetchedDocs);
      
      setDbStatus("Penyimpanan Lokal Aktif (Local Storage)");
    } catch (error) {
      console.error("Error loading application data:", error);
      try {
        const { initialPrograms, initialLogs } = await import("./mockData");
        setPrograms(initialPrograms.map((p, idx) => ({ ...p, id: `mock-${idx}` })) as ProgramJob[]);
        setLogs(initialLogs.map((l, idx) => ({ ...l, id: `mock-log-${idx}` })) as MeetingLog[]);
        const fetchedDocs = await getAllCloudDocuments();
        setDocuments(fetchedDocs);
      } catch (innerErr) {
        console.error("Failed to load local mock data:", innerErr);
      }
      setDbStatus("Offline Mode • Local Dataset Loaded");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const runOneTimeSeedAndLoad = async () => {
      const hasSeeded = safeStorage.getItem("kai_one_time_seed_29_v2");
      if (!hasSeeded) {
        safeStorage.setItem("kai_one_time_seed_29_v2", "true");
        try {
          await forceResetDatabaseWithStandardCorporateData();
        } catch (err) {
          console.error("Failed to run initial 29 programs seed:", err);
        }
      }
      await loadData();
    };
    runOneTimeSeedAndLoad();
  }, []);

  // Automatically close any active details or modals when navigating between tabs
  useEffect(() => {
    setIsAddModalOpen(false);
    setIsUpdateModalOpen(false);
    setIsEditModalOpen(false);
    setSelectedProgram(null);
    setSelectedProgramForEdit(null);
  }, [activeTab]);

  // Form Submission Handler: Insert new Job Program
  const handleAddProgram = async (newProgFields: Omit<ProgramJob, "id" | "no">) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak diizinkan membuat program baru.");
      return;
    }
    setIsLoading(true);
    try {
      await addNewProgram(newProgFields);
      await loadData();
    } catch (error) {
      console.error("Gagal menambahkan program baru:", error);
      alert("Gagal menambahkan program baru. Sila coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  // Log Update & Record Meeting Decisions Handler
  const handleUpdateProgramAndLog = async (
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
    }
  ) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Viewer hanya memiliki hak baca (Read-Only).");
      return;
    }

    setIsLoading(true);
    try {
      await updateProgramAndLogMeeting(programId, updatedFields, logDetails);
      await loadData();
    } catch (error) {
      console.error("Gagal memperbarui status program & log meeting:", error);
      alert("Gagal memperbarui program. Sila coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  // Inline rapid updates for spreadsheet fields
  const handleInlineUpdate = async (programId: string, updatedFields: Partial<ProgramJob>) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak diizinkan melakukan inline editing.");
      return;
    }

    // Optimistic local state update to ensure UI response is instant and lag-free
    setPrograms(prev => prev.map(p => p.id === programId ? { ...p, ...updatedFields } : p));
    try {
      await updateProgramFieldsOnly(programId, updatedFields);
    } catch (error) {
      console.error("Gagal melakukan inline update program:", error);
      const fetchedPrograms = await getAllPrograms();
      setPrograms(fetchedPrograms);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    if (currentUser?.role !== "ADMIN") {
      alert("Akses Dibatasi: Hanya peran Admin yang diizinkan untuk menghapus program.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteProgram(programId);
      await loadData();
    } catch (error) {
      console.error("Gagal menghapus program:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddDocument = async (docFields: Omit<CloudDocument, "id">) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak memiliki izin untuk mengarsipkan dokumen baru.");
      return;
    }

    setIsLoading(true);
    try {
      await addNewCloudDocument(docFields);
      await loadData();
    } catch (error) {
      console.error("Gagal mengarsipkan dokumen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak memiliki izin untuk menghapus dokumen cloud.");
      return;
    }

    setIsLoading(true);
    try {
      await deleteCloudDocument(docId);
      await loadData();
    } catch (error) {
      console.error("Gagal menghapus dokumen:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Trigger modal helper for specific job updates
  const handleOpenUpdateModal = (program: ProgramJob) => {
    setSelectedProgram(program);
    setIsUpdateModalOpen(true);
  };

  const handleOpenEditModal = (program: ProgramJob) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak diizinkan mengubah detail lengkap program.");
      return;
    }

    setSelectedProgramForEdit(program);
    setIsEditModalOpen(true);
  };

  const handleUpdateProgramFields = async (programId: string, updatedFields: Partial<ProgramJob>) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak diizinkan mengubah detail program.");
      return;
    }

    setIsLoading(true);
    try {
      await updateProgramFieldsOnly(programId, updatedFields);
      await loadData();
    } catch (error) {
      console.error("Gagal memperbarui detail program:", error);
      alert("Gagal memperbarui program. Sila coba kembali.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceResetStandardData = async () => {
    if (currentUser?.role !== "ADMIN") {
      alert("Akses Dibatasi: Hanya peran Admin yang dapat menyetel ulang database.");
      return;
    }

    if (confirm("Apakah Anda yakin ingin menyetel ulang database ke 29 program standar ZT Cockpit Hub? Tindakan ini akan menghapus semua program & log kustom Anda.")) {
      setIsLoading(true);
      try {
        await forceResetDatabaseWithStandardCorporateData();
        await loadData();
        alert("Database berhasil disetel ulang ke 29 program standar!");
      } catch (error) {
        console.error("Gagal menyetel ulang database:", error);
        alert("Gagal menyetel ulang database. Silakan periksa koneksi Anda.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleClearAllPrograms = async () => {
    if (confirm("Apakah Anda yakin ingin menghapus seluruh data program tracker yang ada? Tindakan ini tidak dapat dibatalkan.")) {
      setIsLoading(true);
      try {
        await clearAllProgramsAndLogs();
        await loadData();
        alert("Seluruh data program tracker berhasil dihapus!");
      } catch (error) {
        console.error("Gagal menghapus seluruh data program tracker:", error);
        alert("Gagal menghapus data. Silakan periksa koneksi Anda.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!currentUser) {
    return <LoginView onLogin={(user) => setCurrentUser(user)} />;
  }

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col text-slate-900 font-sans selection:bg-[#f36e21] selection:text-white">
      
      {/* 1. Global Executive Header (Minimalist Clean KAI Style with Brand Accent) */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40 backdrop-blur-md bg-white/95 border-t-4 border-[#f36e21]">
        
        {/* Main Brand row with KAI Logo and DB Status */}
        <div className="max-w-none mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 flex flex-row items-center justify-between gap-2 sm:gap-4">
          
          {/* Brand/logo and Title Section */}
          <div className="flex items-center gap-2 sm:gap-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/56/Logo_PT_Kereta_Api_Indonesia_%28Persero%29_2020.svg" 
              alt="KAI Logo" 
              className="h-6 sm:h-8 w-auto object-contain" 
              referrerPolicy="no-referrer"
            />
            <div className="h-6 w-px bg-slate-200 hidden xs:block" />
            <div>
              <h1 className="text-xs sm:text-sm md:text-base font-black text-[#1e266f] tracking-tight leading-none">
                CORPORATE TRANSFORMATION <span className="text-[#f36e21]">COCKPIT</span>
              </h1>
              <p className="text-[8px] sm:text-[10px] text-slate-400 font-mono tracking-wider mt-1 sm:mt-1.5 uppercase font-semibold">
                ZT COCKPIT HUB
              </p>
            </div>
          </div>

          {/* User Profile & Logout section */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Identitas Hak Akses (Moved to header) */}
            <div className="flex items-center gap-2 sm:gap-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm max-h-[46px]">
              <div className="p-1 bg-[#1e266f]/5 text-[#1e266f] rounded-lg border border-[#1e266f]/10 hidden sm:block shrink-0">
                <Activity className="w-4 h-4 text-[#f36e21]" />
              </div>
              <div className="flex flex-col text-left font-sans">
                <span className="text-[9px] text-slate-400 font-mono font-bold uppercase tracking-wider leading-none">
                  Identitas Hak Akses
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-xs font-black text-slate-800 leading-none">
                    {currentUser.name || currentUser.roleName}
                  </span>
                  <span className="text-[9px] bg-[#1e266f] text-white px-1.5 py-0.5 rounded font-mono font-semibold uppercase shrink-0 leading-none">
                    {currentUser.role}
                  </span>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-650 rounded-xl text-[10px] font-black tracking-wider uppercase transition-colors border border-red-250 cursor-pointer active:scale-95 self-stretch"
              title="Keluar dari Akun"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>


        </div>

        {/* 2. Menu Navigation Tabs Strip with KAI Navy Blue Background & KAI Orange highlight */}
        <div className="hidden md:block bg-[#1e266f] border-b border-[#f36e21]/20 py-1.5">
          <div className="max-w-none mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 overflow-x-auto scrollbar-none">
            <nav className="flex space-x-1.5 min-w-max">
              
              <button
                id="menu-dashboard"
                onClick={() => setActiveTab("dashboard")}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-extrabold tracking-wide font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#f36e21] text-white shadow-md font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-md`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                Dashboard Cockpit
              </button>

              <button
                id="menu-tracker"
                onClick={() => setActiveTab("tracker")}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-extrabold tracking-wide font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === "tracker"
                    ? "bg-[#f36e21] text-white shadow-md font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-md`}
              >
                <ListTodo className="w-3.5 h-3.5" />
                Program Tracker
              </button>

              <button
                id="menu-logs"
                onClick={() => setActiveTab("logs")}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-extrabold tracking-wide font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === "logs"
                    ? "bg-[#f36e21] text-white shadow-md font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-md`}
              >
                <History className="w-3.5 h-3.5" />
                Meeting Logs
              </button>

              <button
                id="menu-documents"
                onClick={() => setActiveTab("cloud_docs")}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-[10px] sm:text-xs font-extrabold tracking-wide font-sans transition-all duration-150 cursor-pointer ${
                  activeTab === "cloud_docs"
                    ? "bg-[#f36e21] text-white shadow-md font-black"
                    : "text-white/80 hover:text-white hover:bg-white/10"
                } rounded-md`}
              >
                <CloudLightning className="w-3.5 h-3.5" />
                Arsip Dokumen Cloud
              </button>

            </nav>
          </div>
        </div>

      </header>

      {/* 3. Main Stage Content Frame */}
      <main className="flex-1 max-w-none w-full mx-auto px-2 sm:px-4 md:px-6 lg:px-8 xl:px-10 py-4 sm:py-6">
        
        {/* Loading overlay for transitions */}
        {isLoading && (
          <div className="flex items-center justify-center p-12 bg-white/50 backdrop-blur-[1px] absolute inset-x-0 top-32 bottom-0 z-40 transition-all font-mono text-xs text-slate-500 gap-3">
            <span className="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></span>
            Memproses mutasi data waktu nyata...
          </div>
        )}

        {/* Dynamic Navigation rendering views */}
        <div className="transition-opacity duration-200">
          
          {activeTab === "dashboard" && (
            <DashboardView 
              programs={programs} 
              logs={logs}
              onAddClick={() => setIsAddModalOpen(true)} 
              onEditProgramClick={handleOpenEditModal}
              onUpdateProgressClick={handleOpenUpdateModal}
              currentUser={currentUser}
            />
          )}

          {activeTab === "tracker" && (
            <ProgramTrackerView 
              programs={programs}
              onAddProgramClick={() => setIsAddModalOpen(true)}
              onUpdateProgressClick={handleOpenUpdateModal}
              onEditProgramClick={handleOpenEditModal}
              onInlineUpdate={handleInlineUpdate}
              onDeleteProgram={handleDeleteProgram}
              currentUser={currentUser}
            />
          )}

          {activeTab === "logs" && (
            <MeetingLogsView 
              logs={logs}
              programs={programs}
              onSubmitLog={handleUpdateProgramAndLog}
              currentUser={currentUser}
            />
          )}

          {activeTab === "cloud_docs" && (
            <CloudDocumentsView 
              documents={documents}
              onAddDocument={handleAddDocument}
              onDeleteDocument={handleDeleteDocument}
              currentUser={currentUser}
            />
          )}

        </div>

      </main>

      {/* 4. Overlay Popups Modals Component Placement */}
      
      {/* Form Tambah Program Baru */}
      <AddProgramModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSubmit={handleAddProgram}
      />

      {/* Record Minutes of Meeting update popup */}
      <MeetingLogModal 
        isOpen={isUpdateModalOpen}
        program={selectedProgram}
        programs={programs}
        logs={logs}
        onClose={() => {
          setIsUpdateModalOpen(false);
          setSelectedProgram(null);
        }}
        onSubmit={handleUpdateProgramAndLog}
        currentUser={currentUser}
      />

      {/* Full detail edit modal */}
      <EditProgramModal 
        isOpen={isEditModalOpen}
        program={selectedProgramForEdit}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedProgramForEdit(null);
        }}
        onSubmit={handleUpdateProgramFields}
      />

      {/* 5. Minimal Elegant Corporate Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-5 pb-24 md:pb-5 text-center text-xs font-mono text-slate-400">
        <div className="max-w-none mx-auto px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>ZT Cockpit Control Center © 2026</span>
        </div>
      </footer>

      {/* 6. Sticky Bottom Navigation Bar for Mobile View (< md) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-4 h-16 pb-safe">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === "dashboard" ? "text-[#1e266f]" : "text-slate-400"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === "dashboard" ? "bg-[#1e266f]/10 text-[#1e266f]" : "text-slate-400"}`}>
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab("tracker")}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === "tracker" ? "text-[#1e266f]" : "text-slate-400"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === "tracker" ? "bg-[#1e266f]/10 text-[#1e266f]" : "text-slate-400"}`}>
              <ListTodo className="w-5 h-5" />
            </div>
            <span>Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === "logs" ? "text-[#1e266f]" : "text-slate-400"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === "logs" ? "bg-[#1e266f]/10 text-[#1e266f]" : "text-slate-400"}`}>
              <History className="w-5 h-5" />
            </div>
            <span>Logs</span>
          </button>

          <button
            onClick={() => setActiveTab("cloud_docs")}
            className={`flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
              activeTab === "cloud_docs" ? "text-[#1e266f]" : "text-slate-400"
            }`}
          >
            <div className={`p-1 rounded-lg transition-colors ${activeTab === "cloud_docs" ? "bg-[#1e266f]/10 text-[#1e266f]" : "text-slate-400"}`}>
              <CloudLightning className="w-5 h-5" />
            </div>
            <span>Dokumen</span>
          </button>
        </div>
      </div>

    </div>
  );
}
