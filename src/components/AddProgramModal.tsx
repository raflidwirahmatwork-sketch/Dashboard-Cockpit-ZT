import React, { useState, useRef, useEffect } from "react";
import { ProgramJob, AttachmentFile } from "../types";
import { X, Plus, AlertTriangle, ShieldCheck, Coins, Activity, Info } from "lucide-react";

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (program: Omit<ProgramJob, "id" | "no">) => void;
}

export default function AddProgramModal({ isOpen, onClose, onSubmit }: AddProgramModalProps) {
  // -- SECTION 1: Program Tracker States --
  const [topic, setTopic] = useState("");
  const [subTopic, setSubTopic] = useState("");
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
  const [ztRole, setZtRole] = useState("Orchestrator");
  const [strategicImpact, setStrategicImpact] = useState("");
  const [phase, setPhase] = useState("Ideation");
  const [progress, setProgress] = useState(0);
  const [statusTracker, setStatusTracker] = useState<ProgramJob["statusTracker"]>("Green");
  const [currentMilestone, setCurrentMilestone] = useState("");
  const [keyIssue, setKeyIssue] = useState("");
  const [actionPlan, setActionPlan] = useState("");
  const [startDate, setStartDate] = useState("");
  const [deadline, setDeadline] = useState("");
  const [decisionNeeded, setDecisionNeeded] = useState<"Yes" | "No">("No");
  const [dzIntervention, setDzIntervention] = useState("No");
  const [ztPicType, setZtPicType] = useState<"preset" | "custom">("preset");
  const [ztPicPreset, setZtPicPreset] = useState("");
  const [ztPicCustom, setZtPicCustom] = useState("");
  const [confidence, setConfidence] = useState<ProgramJob["confidence"]>("Medium");
  const [strategicFit, setStrategicFit] = useState<ProgramJob["strategicFit"]>("Medium");
  const [priority, setPriority] = useState<ProgramJob["priority"]>("Medium");
  const [request, setRequest] = useState<ProgramJob["request"]>("");

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

  // -- SECTION 5: File Attachments States --
  const [files, setFiles] = useState<AttachmentFile[]>([]);
  const [documentLink, setDocumentLink] = useState("");
  const [justificationConceptor, setJustificationConceptor] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Derive dynamic risk scores in real-time
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

  // Automatically calculate statusTracker based on progress
  React.useEffect(() => {
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !owner) {
      alert("Topic dan Owner wajib diisi!");
      return;
    }

    onSubmit({
      // Core fields
      topic,
      subTopic,
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
      deadline: deadline || new Date().toISOString().split("T")[0],
      decisionNeeded,
      dzIntervention,
      ztPic: ztPicType === "custom" ? ztPicCustom : ztPicPreset,
      confidence,
      strategicFit,
      priority,
      request,

      // Risk fields
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
    });

    // Reset All Forms to default
    setTopic("");
    setSubTopic("");
    setOwner("");
    setStrategicImpact("");
    setCurrentMilestone("");
    setKeyIssue("");
    setActionPlan("");
    setStartDate("");
    setDeadline("");
    setDzIntervention("No");
    setZtPicType("preset");
    setZtPicPreset("");
    setZtPicCustom("");
    setJustificationConceptor("");
    setRequest("");
    
    setRiskType("");
    setRiskIssue("");
    setRiskProgram("");
    setRiskImpact(1);
    setRiskProbability(1);
    setRiskMitigation("");
    setClearThePath("");
    setRiskOwner("");
    setRiskStatus("Open");
    setRiskEscalationTo("");

    setNotes("");
    setFiles([]);
    setDocumentLink("");
    setIsDragging(false);

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
      <div className="relative w-full max-w-5xl max-h-[90vh] bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-200">
        
        {/* Modal Header */}
        <div className="bg-white border-b border-slate-100 px-6 py-5 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold font-sans text-slate-900 tracking-tight">
              Add Program Tracker
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Provide implementation details and metrics below
            </p>
          </div>
          <button 
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Content Container */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50">
          
          {/* SECTION 1: PROGRAM TRACKER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#F8FAFC] border-b border-slate-200 px-5 py-3 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 tracking-wider">
                PROGRAM TRACKER
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                SECTION 1
              </span>
            </div>
            
            <div className="p-5 grid grid-cols-12 gap-x-5 gap-y-4">
              <div className="col-span-12">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Topic <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Migration of Legacy Core Ledger"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Sub Topic
                </label>
                <input
                  type="text"
                  value={subTopic}
                  onChange={(e) => setSubTopic(e.target.value)}
                  placeholder="Input sub topic..."
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Cluster <span className="text-red-500">*</span>
                </label>
                <select
                  required
                  value={cluster}
                  onChange={(e) => setCluster(e.target.value as any)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                >
                  <option value="">-- Choose cluster --</option>
                  <option value="Strategic Transformation">Strategic Transformation</option>
                  <option value="Corporate Culture">Corporate Culture</option>
                  <option value="Change Management">Change Management</option>
                  <option value="Investment Governance">Investment Governance</option>
                  <option value="Corporate Insight">Corporate Insight</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-3 relative" ref={ownerDropdownRef}>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Strategic Impact
                </label>
                <input
                  type="text"
                  value={strategicImpact}
                  onChange={(e) => setStrategicImpact(e.target.value)}
                  placeholder="e.g. Revenue acceleration or efficiency"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-850 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Progress ({progress}%)
                </label>
                <div className="flex items-center bg-white p-2.5 border border-slate-200 rounded-lg shadow-sm h-[38px]">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={progress}
                    onChange={(e) => setProgress(Number(e.target.value))}
                    className="w-full h-1 bg-slate-100 rounded appearance-none cursor-pointer accent-slate-800"
                  />
                </div>
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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

              <div className="col-span-12 md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Current Milestone
                </label>
                <input
                  type="text"
                  value={currentMilestone}
                  onChange={(e) => setCurrentMilestone(e.target.value)}
                  placeholder="e.g. Core System Integration"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Key Issue
                </label>
                <input
                  type="text"
                  value={keyIssue}
                  onChange={(e) => setKeyIssue(e.target.value)}
                  placeholder="e.g. Technical schema mismatch"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  ZT Recommendation
                </label>
                <input
                  type="text"
                  value={actionPlan}
                  onChange={(e) => setActionPlan(e.target.value)}
                  placeholder="e.g. Schedule integration coordination meeting"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12 md:col-span-6 lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Decision Needed
                </label>
                <select
                  value={decisionNeeded}
                  onChange={(e) => setDecisionNeeded(e.target.value as any)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                >
                  <option value="">-- Choose --</option>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>

              <div className="col-span-12 md:col-span-6 lg:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider relative group inline-flex items-center gap-1 cursor-help">
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Clear the Path
                </label>
                <input
                  type="text"
                  value={clearThePath}
                  onChange={(e) => setClearThePath(e.target.value)}
                  placeholder="Input action/decision needed to clear the path..."
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>
            </div>
          </div>


          {/* SECTION 3: RISK ISSUE TRACKER */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-[#F8FAFC] border-b border-slate-200 px-5 py-3 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 tracking-wider">
                RISK ISSUE TRACKER
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                SECTION 2
              </span>
            </div>

            <div className="p-5 grid grid-cols-12 gap-x-5 gap-y-4 bg-white">
              <div className="col-span-12">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Type
                </label>
                <select
                  value={riskType}
                  onChange={(e) => setRiskType(e.target.value as any)}
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                >
                  <option value="">-- Choose Type --</option>
                  <option value="Portfolio & Delivery Risk">Portfolio & Delivery Risk</option>
                  <option value="Strategic & Business Model Alignment Risk">Strategic & Business Model Alignment Risk</option>
                  <option value="Change Management & Cultural Readiness Risk">Change Management & Cultural Readiness Risk</option>
                  <option value="Digital & Technology Transformation Risk">Digital & Technology Transformation Risk</option>
                  <option value="Controls & Operational Readiness Risk">Controls & Operational Readiness Risk</option>
                </select>
              </div>

              <div className="col-span-12">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Risk / Issue Description (Free-text)
                </label>
                <textarea
                  rows={2}
                  value={riskIssue}
                  onChange={(e) => setRiskIssue(e.target.value)}
                  placeholder="State detailed explanation of key obstacles or blockers..."
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg p-3 outline-none transition-colors text-slate-800 shadow-sm resize-none"
                />
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Impact (1-4)
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Probability (1-4)
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Level Score
                </label>
                <div className="w-full text-xs font-mono font-extrabold bg-[#F8FAFC] border border-slate-200 rounded-lg py-2.5 text-center text-slate-800 select-none shadow-sm h-[38px] flex items-center justify-center">
                  {calculatedRiskScore}
                </div>
              </div>

              <div className="col-span-12 md:col-span-3">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Risk Level
                </label>
                <div className={`w-full text-xs font-bold border rounded-lg py-2.5 text-center shadow-sm h-[38px] flex items-center justify-center transition-all ${
                  riskLevelText === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                  riskLevelText === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  riskLevelText === "Medium" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                  riskLevelText === "Low" && calculatedRiskScore >= 4 ? "bg-[#92e58c]/10 text-emerald-800 border-[#7cd076]/30" :
                  riskLevelText === "Low" ? "bg-cyan-50 text-cyan-700 border-cyan-200" :
                  "bg-slate-55 text-slate-400 border-slate-200"
                }`}>
                  {riskLevelText || "-"}
                </div>
              </div>

              <div className="col-span-12 md:col-span-6">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Status Risk
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
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Escalation To
                </label>
                <input
                  type="text"
                  value={riskEscalationTo}
                  onChange={(e) => setRiskEscalationTo(e.target.value)}
                  placeholder="e.g. DZ"
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div className="col-span-12">
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Mitigation / Recovery Action
                </label>
                <input
                  type="text"
                  value={riskMitigation}
                  onChange={(e) => setRiskMitigation(e.target.value)}
                  placeholder="Input recommendation or key actions here..."
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>
            </div>
          </div>


          {/* SECTION 5: DOCUMENT / FILE ATTACHMENTS */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
            <div className="bg-[#F8FAFC] border-b border-slate-200 px-5 py-3 flex justify-between items-center">
              <h4 className="text-xs font-bold text-slate-800 tracking-wider">
                DOCUMENT / FILE ATTACHMENTS
              </h4>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                SECTION 3
              </span>
            </div>

            <div className="p-5 bg-white space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Konseptor Justifikasi
                </label>
                <input
                  type="text"
                  value={justificationConceptor}
                  onChange={(e) => setJustificationConceptor(e.target.value)}
                  placeholder="Masukkan nama konseptor justifikasi..."
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
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
                  className="w-full text-xs font-medium bg-white border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2.5 outline-none transition-colors text-slate-800 shadow-sm"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1.5 uppercase tracking-wider">
                  Upload Attachment Files
                </label>
                <div 
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                    isDragging 
                      ? "border-[#1e266f] bg-slate-50/50" 
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
                onClick={() => document.getElementById("file-upload-input")?.click()}
              >
                <input
                  id="file-upload-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <div className="p-3 bg-slate-50 rounded-full text-[#1e266f] border border-slate-100 flex items-center justify-center">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <p className="text-xs font-bold text-slate-700">
                    Drag and drop your files here, or <span className="text-[#1e266f] hover:underline">browse</span>
                  </p>
                  <p className="text-[10px] text-slate-500 font-medium">
                    PDF, DOCX, XLSX, PNG, or JPG up to 1.5MB
                  </p>
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
                          className="p-1.5 hover:bg-slate-100 text-slate-550 hover:text-slate-800 rounded-lg transition-colors flex items-center justify-center"
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
          </div>

        </form>

        {/* Footer Panel Actions */}
        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg text-xs font-extrabold text-white bg-[#f36e21] hover:bg-[#db5610] shadow-sm transition-all font-sans"
          >
            Create Program Initiative
          </button>
        </div>

      </div>
    </div>
  );
}
