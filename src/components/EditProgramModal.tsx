import React, { useState, useEffect, useRef } from "react";
import { ProgramJob, AttachmentFile } from "../types";
import { X, Check, AlertTriangle, Coins, Activity, FileText, Info, FileEdit } from "lucide-react";

interface EditProgramModalProps {
  isOpen: boolean;
  program: ProgramJob | null;
  onClose: () => void;
  onSubmit: (programId: string, updatedFields: Partial<ProgramJob>) => void;
}

type TabType = "tracker" | "risk" | "attachments";

export default function EditProgramModal({ isOpen, program, onClose, onSubmit }: EditProgramModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("tracker");

  // -- SECTION 1: Program Tracker States --
  const [topic, setTopic] = useState("");
  const [cluster, setCluster] = useState<ProgramJob["cluster"]>("Strategic Transformation");
  const [owner, setOwner] = useState("");
  const [ownerDropdownOpen, setOwnerDropdownOpen] = useState(false);
  const ownerDropdownRef = useRef<HTMLDivElement>(null);
  const ownerOptions = ["DC", "DJ", "DN", "DR", "DS", "DH", "DI", "DF"];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ownerDropdownRef.current && !ownerDropdownRef.current.contains(event.target as Node)) {
        setOwnerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const [ztRole, setZtRole] = useState("");
  const [strategicImpact, setStrategicImpact] = useState("");
  const [phase, setPhase] = useState("");
  const [progress, setProgress] = useState(0);
  const [statusTracker, setStatusTracker] = useState<ProgramJob["statusTracker"]>("Green");
  const [currentMilestone, setCurrentMilestone] = useState("");
  const [keyIssue, setKeyIssue] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [deadline, setDeadline] = useState("");
  const [startDate, setStartDate] = useState("");
  const [decisionNeeded, setDecisionNeeded] = useState<"Yes" | "No">("No");
  const [dzIntervention, setDzIntervention] = useState("No");
  const [ztPicType, setZtPicType] = useState<"preset" | "custom">("preset");
  const [ztPicPreset, setZtPicPreset] = useState("");
  const [ztPicCustom, setZtPicCustom] = useState("");
  const [confidence, setConfidence] = useState<ProgramJob["confidence"]>("Medium");
  const [strategicFit, setStrategicFit] = useState<ProgramJob["strategicFit"]>("Medium");
  const [priority, setPriority] = useState<ProgramJob["priority"]>("Medium");
  const [request, setRequest] = useState<ProgramJob["request"]>("");

  // -- SECTION 5: File Attachments States --
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [documentLink, setDocumentLink] = useState("");
  const [justificationConceptor, setJustificationConceptor] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // -- SECTION 3: Risk Issue States --
  const [riskType, setRiskType] = useState<ProgramJob["riskType"]>("");
  const [riskIssue, setRiskIssue] = useState("");
  const [riskProgram, setRiskProgram] = useState("");
  const [riskImpact, setRiskImpact] = useState<number>(1);
  const [riskProbability, setRiskProbability] = useState<number>(1);
  const [riskMitigation, setRiskMitigation] = useState("");
  const [clearThePath, setClearThePath] = useState("");
  const [riskOwner, setRiskOwner] = useState("");
  const [riskStatus, setRiskStatus] = useState<ProgramJob["riskStatus"]>("Open");
  const [riskEscalationTo, setRiskEscalationTo] = useState("");
  const [notes, setNotes] = useState("");

  // Populate data when the program changes
  useEffect(() => {
    if (program) {
      setTopic(program.topic || "");
      setCluster(program.cluster || "Strategic Transformation");
      setOwner(program.owner || "");
      setZtRole(program.ztRole || "");
      setStrategicImpact(program.strategicImpact || "");
      setPhase(program.phase || "");
      setProgress(program.progress ?? 0);
      setStatusTracker(program.statusTracker || "Green");
      setCurrentMilestone(program.currentMilestone || "");
      setKeyIssue(program.keyIssue || "");
      setActionPlan(program.actionPlan || "");
      setStartDate(program.startDate || "");
      setDeadline(program.deadline || "");
      setDecisionNeeded(program.decisionNeeded || "No");
      setDzIntervention(program.dzIntervention || "No");
      const currentPic = program.ztPic || "";
      if (["", "ZT", "ZTI", "ZTS", "ZTE"].includes(currentPic)) {
        setZtPicType("preset");
        setZtPicPreset(currentPic);
        setZtPicCustom("");
      } else {
        setZtPicType("custom");
        setZtPicPreset("");
        setZtPicCustom(currentPic);
      }
      setConfidence(program.confidence || "Medium");
      setStrategicFit(program.strategicFit || "Medium");
      setPriority(program.priority || "Medium");
      setRequest(program.request || "");

      setRiskType(program.riskType || "");
      setRiskIssue(program.riskIssue || "");
      setRiskProgram(program.riskProgram || "");
      setRiskImpact(program.riskImpact ?? 1);
      setRiskProbability(program.riskProbability ?? 1);
      setRiskMitigation(program.riskMitigation || "");
      setClearThePath(program.clearThePath || "");
      setRiskOwner(program.riskOwner || "");
      setRiskStatus(program.riskStatus || "Open");
      setRiskEscalationTo(program.riskEscalationTo || "");

      setNotes(program.notes || "");
      setFiles(program.files || []);
      setDocumentLink(program.documentLink || "");
      setJustificationConceptor(program.justificationConceptor || "");
      
      setActiveTab("tracker"); // Default back to first tab
    }
  }, [program]);

  // Automatically calculate statusTracker based on progress
  useEffect(() => {
    if (progress === 0) {
      setStatusTracker("Blocked");
    } else if (progress >= 80) {
      setStatusTracker("Green");
    } else if (progress >= 40) {
      setStatusTracker("Yellow");
    } else {
      setStatusTracker("Red");
    }
  }, [progress]);

  // Realtime derived risk score
  const calculatedRiskScore = riskImpact * riskProbability;
  
  const getDerivedRiskLevel = (score: number) => {
    if (score === 16) return "Critical";
    if (score === 12) return "High";
    if (score === 8 || score === 9) return "Medium";
    if (score >= 1 && score <= 6) return "Low";
    return "";
  };

  const riskLevelText = getDerivedRiskLevel(calculatedRiskScore);

  useEffect(() => {
    if (riskLevelText) {
      if (riskLevelText === "Critical") setPriority("Critical");
      else if (riskLevelText === "High") setPriority("High");
      else if (riskLevelText === "Medium") setPriority("Medium");
      else if (riskLevelText === "Low") setPriority("Low");
    }
  }, [riskLevelText]);

  if (!isOpen || !program) return null;

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
        setFiles((prev) => [
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !owner) {
      alert("Topic dan Owner wajib diisi!");
      return;
    }

    const updatedFields: Partial<ProgramJob> = {
      topic,
      cluster,
      owner,
      ztRole,
      strategicImpact,
      phase,
      progress,
      statusTracker,
      currentMilestone,
      keyIssue,
      actionPlan,
      startDate,
      deadline,
      decisionNeeded,
      dzIntervention,
      ztPic: ztPicType === "custom" ? ztPicCustom : ztPicPreset,
      confidence,
      strategicFit,
      priority,
      request,

      riskType,
      riskIssue,
      riskProgram,
      riskImpact: Number(riskImpact),
      riskProbability: Number(riskProbability),
      riskLevelScore: calculatedRiskScore,
      riskLevel: riskLevelText,
      riskMitigation,
      clearThePath,
      riskOwner,
      riskStatus,
      riskEscalationTo,

      notes,
      files,
      documentLink,
      justificationConceptor
    };

    onSubmit(program.id, updatedFields);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm p-2 sm:p-4 flex items-center justify-center">
      <div className="relative w-full max-w-5xl h-[85vh] sm:h-[85vh] lg:h-[90vh] max-h-[92vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200 animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Modal Top Header (Matching MeetingLogModal Style) */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 sm:py-4 flex items-center justify-between gap-3 shrink-0 border-b border-slate-800 relative">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="p-2 sm:p-2.5 bg-[#f36e21] rounded-lg text-white shrink-0">
              <FileEdit className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-extrabold text-white uppercase tracking-wider font-sans leading-tight break-words">
                Edit Initiative Program Details
              </h3>
              <p className="text-[10px] sm:text-xs text-indigo-300 font-mono mt-0.5 font-medium max-w-full truncate">
                Active Initiative: <span className="text-white font-bold">{program.no ? `[${program.no}] ` : ""}{topic || program.topic}</span>
              </p>
            </div>
          </div>
          
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Tab Navigation Menu strip (Matching MeetingLogModal style) */}
        <div className="bg-slate-50 px-4 sm:px-6 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("tracker")}
              className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "tracker"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-250"
                  : "text-slate-550 hover:bg-white hover:text-slate-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-650" />
              I. Program Tracker
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("risk")}
              className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "risk"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-250"
                  : "text-slate-550 hover:bg-white hover:text-slate-800"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              II. Risk & Issue
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("attachments")}
              className={`px-3 sm:px-4 py-1.5 text-[11px] sm:text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "attachments"
                  ? "bg-white text-indigo-750 shadow-sm border border-slate-250"
                  : "text-slate-550 hover:bg-white hover:text-slate-800"
              }`}
            >
              <svg className="w-3.5 h-3.5 text-sky-505" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              III. Attachments
            </button>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <span className={`px-2.5 py-0.5 rounded text-[10px] sm:text-[11px] font-extrabold uppercase tracking-wide border ${
              statusTracker === "Green" ? "bg-emerald-50 text-emerald-800 border-emerald-200" :
              statusTracker === "Yellow" ? "bg-amber-50 text-amber-800 border-amber-200" :
              statusTracker === "Red" ? "bg-rose-50 text-rose-800 border-rose-250" :
              "bg-slate-100 text-slate-800 border-slate-300"
            }`}>
              Status: {statusTracker}
            </span>
          </div>
        </div>

        {/* Scrollable form fields based on active tab */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 bg-[#FAFBFD] space-y-4 sm:space-y-6">
          
          {/* TAB 1: PROGRAM TRACKER */}
          {activeTab === "tracker" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
                  SECTION I: GENERAL INFO & TRACKER FIELDS
                </h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  PROGRAM TRACKER
                </span>
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-12 gap-5">
                
                {/* Topic / Program Name with wide visual text area for typing easily */}
                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Topic / Initiative Name <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Input program or topic name..."
                    className="w-full text-xs font-semibold bg-white border border-slate-200 hover:border-slate-350 focus:border-indigo-500 rounded-lg p-3 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                  <p className="text-[10 px] text-slate-400 mt-1">Spacious text field allows seeing complete title when typing.</p>
                </div>

                 <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Cluster <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={cluster}
                    onChange={(e) => setCluster(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="Strategic Transformation">Strategic Transformation</option>
                    <option value="Corporate Culture">Corporate Culture</option>
                    <option value="Change Management">Change Management</option>
                    <option value="Investment Governance">Investment Governance</option>
                    <option value="Corporate Insight">Corporate Insight</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-3 relative" ref={ownerDropdownRef}>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Unit Owner <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setOwnerDropdownOpen(!ownerDropdownOpen)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm flex items-center justify-between text-left h-[38px]"
                  >
                    <span className="truncate">
                      {owner ? owner : "-- Choose owner --"}
                    </span>
                    <svg className="w-4 h-4 text-slate-400 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {ownerDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg py-1.5 max-h-60 overflow-y-auto">
                      {(() => {
                        const selectedList = owner ? owner.split(",").map(s => s.trim()).filter(Boolean) : [];

                        return ownerOptions.map((opt) => {
                          const isChecked = selectedList.includes(opt);

                          const handleToggle = () => {
                            let newSelected: string[];
                            if (isChecked) {
                              newSelected = selectedList.filter(o => o !== opt);
                            } else {
                              newSelected = [...selectedList, opt];
                            }
                            const sortedSelected = ownerOptions.filter(o => newSelected.includes(o));
                            setOwner(sortedSelected.join(", "));
                          };

                          return (
                            <label
                              key={opt}
                              className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 select-none"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={handleToggle}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        });
                      })()}
                    </div>
                  )}
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Request
                  </label>
                  <select
                    value={request}
                    onChange={(e) => setRequest(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="">-- Choose request --</option>
                    <option value="From DZ">From DZ</option>
                    <option value="Not DZ">Not DZ</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm font-bold"
                  >
                    <option value="Critical">P1 (Critical)</option>
                    <option value="High">P2 (High)</option>
                    <option value="Medium">P3 (Medium)</option>
                    <option value="Low">P4 (Low)</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    ZT Role
                  </label>
                  <select
                    value={ztRole}
                    onChange={(e) => setZtRole(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="">-- Choose Role --</option>
                    <option value="Orchestrator">Orchestrator</option>
                    <option value="Challenger">Challenger</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Integrator">Integrator</option>
                    <option value="Strategist">Strategist</option>
                    <option value="Value Designer">Value Designer</option>
                    <option value="Quality Gate Controller">Quality Gate Controller</option>
                    <option value="Program Designer">Program Designer</option>
                    <option value="Benchmark">Benchmark</option>
                    <option value="Governance">Governance</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Strategic Impact
                  </label>
                  <textarea
                    rows={2}
                    value={strategicImpact}
                    onChange={(e) => setStrategicImpact(e.target.value)}
                    placeholder="Input strategic impact value..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-2.5 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Phase
                  </label>
                  <select
                    value={phase}
                    onChange={(e) => setPhase(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="">-- Choose Phase --</option>
                    <option value="Ideation">Ideation</option>
                    <option value="Kajian">Kajian</option>
                    <option value="Validasi">Validasi</option>
                    <option value="Approval">Approval</option>
                    <option value="Execution">Execution</option>
                    <option value="Benefit Realization">Benefit Realization</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Progress ({progress}%)
                  </label>
                  <div className="flex items-center gap-3 bg-white p-2 border border-slate-200 rounded-lg shadow-sm h-[38px]">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={progress}
                      onChange={(e) => setProgress(Number(e.target.value))}
                      className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-800"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700">{progress}%</span>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-4">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Status Tracker <span className="text-slate-400 font-normal lowercase">(auto)</span>
                  </label>
                  <select
                    disabled
                    value={statusTracker}
                    onChange={(e) => setStatusTracker(e.target.value as any)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-200 rounded-lg px-3 py-2.5 outline-none text-slate-500 shadow-sm cursor-not-allowed"
                  >
                    <option value="Green">Green</option>
                    <option value="Yellow">Yellow</option>
                    <option value="Red">Red</option>
                    <option value="Blocked">Blocked</option>
                  </select>
                </div>

                {/* Highly readable free-text area for Milestone */}
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Current Milestone
                  </label>
                  <textarea
                    rows={2}
                    value={currentMilestone}
                    onChange={(e) => setCurrentMilestone(e.target.value)}
                    placeholder="Input current milestone achievements..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-2.5 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

                {/* Highly readable text area for Key Issue */}
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Key Issue
                  </label>
                  <textarea
                    rows={2}
                    value={keyIssue}
                    onChange={(e) => setKeyIssue(e.target.value)}
                    placeholder="State key issues or decisions needed..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-2.5 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

                {/* Action Plan spacious area */}
                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    ZT Recommendation
                  </label>
                  <textarea
                    rows={2}
                    value={actionPlan}
                    onChange={(e) => setActionPlan(e.target.value)}
                    placeholder="Detail action plan or recovery track..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-2.5 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 outline-none transition-colors text-slate-800 shadow-sm"
                  />
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Deadline Target
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 outline-none transition-colors text-slate-800 shadow-sm"
                  />
                </div>

                <div className="col-span-12 md:col-span-6 lg:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Decision Needed
                  </label>
                  <select
                    value={decisionNeeded}
                    onChange={(e) => setDecisionNeeded(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6 lg:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    DZ Intervention
                  </label>
                  <select
                    value={dzIntervention}
                    onChange={(e) => setDzIntervention(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="No">No</option>
                    <option value="Yes">Yes</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6 lg:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    ZT PIC
                  </label>
                  <div className="space-y-2">
                    <select
                      value={ztPicType === "custom" ? "custom" : ztPicPreset}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "custom") {
                          setZtPicType("custom");
                        } else {
                          setZtPicType("preset");
                          setZtPicPreset(val);
                        }
                      }}
                      className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                    >
                      <option value="">-- Choose PIC --</option>
                      <option value="ZT">ZT</option>
                      <option value="ZTI">ZTI</option>
                      <option value="ZTS">ZTS</option>
                      <option value="ZTE">ZTE</option>
                      <option value="custom">Custom (Ketik Manual)...</option>
                    </select>
                    {ztPicType === "custom" && (
                      <input
                        type="text"
                        value={ztPicCustom}
                        onChange={(e) => setZtPicCustom(e.target.value)}
                        placeholder="Masukkan nama PIC..."
                        className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 outline-none transition-colors text-slate-800 shadow-sm animate-fade-in"
                      />
                    )}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6 lg:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 relative group inline-flex items-center gap-1 cursor-help">
                    <span>Confidence</span>
                    <Info className="w-3.5 h-3.5 text-slate-400" />
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-50 w-72 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                      <div className="font-bold text-slate-300 mb-1.5 pb-1 border-b border-slate-800 text-[10.5px]">ARTI / MAKNA OPERASIONAL</div>
                      <div className="space-y-1.5 text-[11px] font-medium animate-in fade-in duration-200">
                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 border border-emerald-400 shadow-sm mt-0.5"></span>
                          <div>
                            <span className="text-emerald-400 font-bold">High:</span>{" "}
                            <span className="text-slate-300">Sangat Yakin / Valid.</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 border border-blue-400 shadow-sm mt-0.5"></span>
                          <div>
                            <span className="text-blue-400 font-bold">Medium:</span>{" "}
                            <span className="text-slate-300">Cukup Yakin / Perlu Validasi Ringan.</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 border border-amber-400 shadow-sm mt-0.5"></span>
                          <div>
                            <span className="text-amber-400 font-bold">Low:</span>{" "}
                            <span className="text-slate-300">Kurang Yakin / Risiko Tinggi.</span>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 border border-rose-400 shadow-sm mt-0.5"></span>
                          <div>
                            <span className="text-rose-400 font-bold">No-Go:</span>{" "}
                            <span className="text-slate-300">Sama Sekali Tidak Yakin / Bahaya / Berhenti.</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </label>
                  <select
                    value={confidence}
                    onChange={(e) => setConfidence(e.target.value as any)}
                    className="w-full text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                    <option value="No-Go">No-Go</option>
                  </select>
                </div>

                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Clear the Path details / action needed
                  </label>
                  <textarea
                    rows={3}
                    value={clearThePath}
                    onChange={(e) => setClearThePath(e.target.value)}
                    placeholder="Input action or support required to clear the path..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-3 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

              </div>
            </div>
          )}



          {/* TAB 3: RISK TRACKER */}
          {activeTab === "risk" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
                  SECTION II: RISK & ISSUE DETAILS
                </h4>
                <span className="text-[10px] bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  RISK MANAGEMENT
                </span>
              </div>

              <div className="grid grid-cols-12 gap-5">
                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Risk Type Category
                  </label>
                  <select
                    value={riskType}
                    onChange={(e) => setRiskType(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="">N/A</option>
                    <option value="Portfolio & Delivery Risk">Portfolio & Delivery Risk</option>
                    <option value="Strategic & Business Model Alignment Risk">Strategic & Business Model Alignment Risk</option>
                    <option value="Change Management & Cultural Readiness Risk">Change Management & Cultural Readiness Risk</option>
                    <option value="Digital & Technology Transformation Risk">Digital & Technology Transformation Risk</option>
                    <option value="Controls & Operational Readiness Risk">Controls & Operational Readiness Risk</option>
                  </select>
                </div>

                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Risk / Issue Description (Free-text)
                  </label>
                  <textarea
                    rows={3}
                    value={riskIssue}
                    onChange={(e) => setRiskIssue(e.target.value)}
                    placeholder="State detailed explanation of key obstacles or blockers..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-3 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Impact level (1-4)
                  </label>
                  <select
                    value={riskImpact}
                    onChange={(e) => setRiskImpact(Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value={1}>1 - Tidak Signifikan</option>
                    <option value={2}>2 - Minor</option>
                    <option value={3}>3 - Moderat</option>
                    <option value={4}>4 - Kritis</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Probability level (1-4)
                  </label>
                  <select
                    value={riskProbability}
                    onChange={(e) => setRiskProbability(Number(e.target.value))}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value={1}>1 - Sangat Jarang</option>
                    <option value={2}>2 - Jarang</option>
                    <option value={3}>3 - Sering</option>
                    <option value={4}>4 - Hampir Pasti</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Calculated Score
                  </label>
                  <div className="w-full text-sm font-mono font-extrabold bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 text-center text-slate-800 select-none shadow-sm h-[38px] flex items-center justify-center">
                    {calculatedRiskScore} <span className="text-[10px] text-slate-450 ml-1.5">(Impact * Prob)</span>
                  </div>
                </div>

                <div className="col-span-12 md:col-span-3">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Severity Level
                  </label>
                  <div className={`w-full text-xs font-bold border rounded-lg py-2.5 text-center shadow-sm h-[38px] flex items-center justify-center transition-all ${
                    riskLevelText === "Critical" ? "bg-red-100 text-red-900 border-red-200" :
                    riskLevelText === "High" ? "bg-orange-100 text-orange-800 border-orange-200" :
                    riskLevelText === "Medium" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                    riskLevelText === "Low" && calculatedRiskScore >= 4 ? "bg-lime-100 text-lime-800 border-lime-200" :
                    riskLevelText === "Low" ? "bg-cyan-100 text-cyan-800 border-cyan-200" :
                    "bg-slate-100 text-slate-600 border-slate-200"
                  }`}>
                    {riskLevelText || "-"}
                  </div>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Risk / Action Status
                  </label>
                  <select
                    value={riskStatus}
                    onChange={(e) => setRiskStatus(e.target.value as any)}
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  >
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <div className="col-span-12 md:col-span-6">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Escalation Authority Required
                  </label>
                  <input
                    type="text"
                    value={riskEscalationTo}
                    onChange={(e) => setRiskEscalationTo(e.target.value)}
                    placeholder="e.g. PMO Director or DZ"
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  />
                </div>

                <div className="col-span-12">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mitigation / Contingency Action details
                  </label>
                  <textarea
                    rows={3}
                    value={riskMitigation}
                    onChange={(e) => setRiskMitigation(e.target.value)}
                    placeholder="Detail specific activities and deadlines to resolve or mitigate..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg p-3 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ATTACHMENTS */}
          {activeTab === "attachments" && (
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5 animate-in fade-in duration-100">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-2">
                <h4 className="text-xs font-bold text-slate-800 tracking-wider font-mono uppercase">
                  SECTION III: DOCUMENT / FILE ATTACHMENTS
                </h4>
                <span className="text-[10px] bg-sky-50 text-sky-700 px-2.5 py-0.5 rounded-full font-mono font-bold">
                  ATTACHMENTS
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Konseptor Justifikasi
                  </label>
                  <input
                    type="text"
                    value={justificationConceptor}
                    onChange={(e) => setJustificationConceptor(e.target.value)}
                    placeholder="Masukkan nama konseptor justifikasi..."
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Document / Reference Link
                  </label>
                  <input
                    type="url"
                    value={documentLink}
                    onChange={(e) => setDocumentLink(e.target.value)}
                    placeholder="e.g. https://drive.google.com/your-document-link"
                    className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-350 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                    Upload Attachment Files
                  </label>
                  <div 
                    className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging 
                        ? "border-slate-800 bg-slate-50/50" 
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
                onClick={() => document.getElementById("edit-file-upload-input")?.click()}
              >
                <input
                  id="edit-file-upload-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-slate-50 rounded-full text-slate-700 border border-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Drag and drop your files here, or <span className="text-slate-900 hover:underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    PDF, DOCX, XLSX, PNG, or JPG up to 1.5MB
                  </p>
                </div>
              </div>
              </div>
              </div>

              {files.length > 0 && (
                <div className="mt-4 border border-slate-100 rounded-lg divide-y divide-slate-100">
                  {files.map((file, index) => (
                    <div key={index} className="p-3 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
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
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          )}
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-500 font-semibold">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a
                          href={file.dataUrl}
                          download={file.name}
                          className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg transition-colors flex items-center justify-center"
                          title="Download File"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFiles((prev) => prev.filter((_, i) => i !== index));
                          }}
                          className="p-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </form>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-end gap-2 sm:gap-3 border-t border-slate-200 select-none shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 sm:px-4 py-2 sm:py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </button>
          
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg text-xs font-extrabold text-white bg-[#f36e21] hover:bg-[#db5610] shadow-md transition-all font-sans flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            <Check className="w-4 h-4" />
            Apply Changes
          </button>
        </div>

      </div>
    </div>
  );
}
