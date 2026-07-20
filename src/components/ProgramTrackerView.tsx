import React, { useState, useMemo, useEffect, useRef } from "react";
import { ProgramJob, UserAccount } from "../types";
import * as XLSX from "xlsx";
import { 
  Search, 
  FileSpreadsheet, 
  PlusCircle, 
  ArrowUpDown, 
  Edit,
  Edit2,
  Eye,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  User,
  Info,
  ChevronDown,
  X,
  Check,
  Trash2,
  Paperclip,
  ChevronLeft,
  ChevronRight,
  Calendar,
  AlertTriangle,
  Layers,
  ExternalLink,
  ChevronUp,
  TrendingUp,
  CheckSquare,
  ShieldAlert,
  MoreVertical
} from "lucide-react";

interface ProgramTrackerViewProps {
  programs: ProgramJob[];
  onAddProgramClick: () => void;
  onUpdateProgressClick: (program: ProgramJob) => void;
  onEditProgramClick: (program: ProgramJob) => void;
  onInlineUpdate?: (programId: string, updatedFields: Partial<ProgramJob>) => void;
  onDeleteProgram?: (programId: string) => void;
  currentUser?: UserAccount | null;
}

// ----------------- Lightweight Spreadsheet Cell Components -----------------

// Text & Number editable cell
function SpreadsheetCell({ 
  value, 
  onSave, 
  type = "text",
  className = "",
  placeholder = "-"
}: { 
  value: string | number; 
  onSave: (val: any) => void;
  type?: "text" | "number" | "date";
  className?: string;
  placeholder?: string;
}) {
  const [localVal, setLocalVal] = useState<string | number>(value !== null && value !== undefined ? value : "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    setLocalVal(value !== null && value !== undefined ? value : "");
  }, [value]);

  const handleBlur = () => {
    setIsFocused(false);
    if (localVal !== value) {
      const finalVal = type === "number" ? (Number(localVal) || 0) : localVal;
      onSave(finalVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  // Convert numerical input strings back to visual presentation when not in active focus
  let displayValue = String(localVal);
  if (!isFocused) {
    if (type === "number") {
      const numVal = Number(value) || 0;
      if (numVal === 0) {
        displayValue = placeholder;
      } else {
        displayValue = placeholder === "0.0" ? numVal.toFixed(1) : String(numVal);
      }
    } else {
      if (!value) {
        displayValue = placeholder;
      }
    }
  }

  return (
    <input
      type={isFocused && type === "date" ? "date" : (isFocused && type === "number" ? "number" : "text")}
      value={displayValue}
      onFocus={() => setIsFocused(true)}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={`w-full bg-transparent border border-transparent hover:border-slate-300 hover:bg-slate-50/50 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-1 text-xs outline-none transition-all duration-100 font-sans tracking-tight ${
        !isFocused && (displayValue === "-" || displayValue === "0.0") 
          ? "text-slate-400 font-medium text-center" 
          : `text-slate-850 ${className.includes("text-center") ? "text-center" : className.includes("text-right") ? "text-right" : "text-left"}`
      } ${className}`}
    />
  );
}

// Select dropdown editable cell
function SpreadsheetSelectCell({ 
  value, 
  options, 
  onSave,
  className = "" 
}: { 
  value: string; 
  options: string[] | { value: string; label: string }[];
  onSave: (val: string) => void;
  className?: string;
}) {
  const displayValue = value || "";
  const isPlaceholder = displayValue === "";
  
  const dynamicTextColor = isPlaceholder ? "text-slate-400 font-semibold" : "text-slate-700 font-bold";
  const filteredClassName = isPlaceholder
    ? className.replace(/\btext-\S+/g, "").replace(/\bfont-\S+/g, "")
    : className;

  return (
    <div className="relative w-full flex items-center px-0.5">
      <select
        value={displayValue}
        onChange={(e) => onSave(e.target.value)}
        className={`w-full rounded px-2 py-1.5 text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer outline-none transition-all duration-100 font-sans appearance-none pr-5 shadow-sm hover:opacity-95 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${dynamicTextColor} ${filteredClassName}`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundSize: "0.9rem 0.9rem",
          backgroundPosition: "right 0.25rem center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val} className="bg-white text-slate-800 font-semibold text-xs">
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

// Multi-select dropdown editable cell with checkboxes
function SpreadsheetMultiSelectCell({
  value,
  options,
  onSave,
  className = ""
}: {
  value: string;
  options: string[];
  onSave: (val: string) => void;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedList = value ? value.split(",").map(v => v.trim()).filter(Boolean) : [];

  return (
    <div className="relative w-full px-0.5" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full rounded px-2 py-1.5 text-xs border border-slate-200 bg-slate-50 hover:bg-slate-100/80 cursor-pointer outline-none transition-all duration-100 font-sans flex items-center justify-between text-left shadow-sm ${
          !value ? "text-slate-400 font-semibold" : "text-slate-700 font-bold"
        } ${className}`}
      >
        <span className="truncate pr-1">{value || "-- choose --"}</span>
        <svg className="w-3 h-3 text-slate-500 shrink-0 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg py-1 max-h-60 overflow-y-auto left-0 font-sans">
          {options.map((opt) => {
            const isChecked = selectedList.includes(opt);

            const handleToggle = () => {
              let newSelected: string[];
              if (isChecked) {
                newSelected = selectedList.filter(o => o !== opt);
              } else {
                newSelected = [...selectedList, opt];
              }
              const sortedSelected = options.filter(o => newSelected.includes(o));
              onSave(sortedSelected.join(", "));
            };

            return (
              <label
                key={opt}
                className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 select-none w-full text-left"
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
          })}
        </div>
      )}
    </div>
  );
}

// Colored dropdown selector for Status Tracker / Priority
function ColoredDropdownCell({
  value,
  options,
  onSave,
  getStyles
}: {
  value: string;
  options: string[] | { value: string; label: string }[];
  onSave: (val: string) => void;
  getStyles: (val: string) => { bg: string; text: string; border: string };
}) {
  const styles = getStyles(value);
  const isPlaceholder = value === "";
  
  const textClass = isPlaceholder ? "text-slate-400 font-semibold" : `${styles.text} font-bold`;
  const bgClass = isPlaceholder ? "bg-slate-50" : styles.bg;
  const borderClass = isPlaceholder ? "border-slate-200" : styles.border;

  return (
    <div className="relative w-full flex items-center px-0.5">
      <select
        value={value}
        onChange={(e) => onSave(e.target.value)}
        className={`w-full rounded px-2 py-1.5 text-xs border cursor-pointer outline-none transition-all duration-100 font-sans appearance-none pr-5 shadow-sm hover:opacity-90 focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 ${bgClass} ${textClass} ${borderClass}`}
        style={{
          backgroundImage: `url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='none'%3E%3Cpath d='M7 9l3 3 3-3' stroke='%2364748b' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
          backgroundSize: "0.9rem 0.9rem",
          backgroundPosition: "right 0.25rem center",
          backgroundRepeat: "no-repeat"
        }}
      >
        {options.map((opt) => {
          const val = typeof opt === "string" ? opt : opt.value;
          const lbl = typeof opt === "string" ? opt : opt.label;
          return (
            <option key={val} value={val} className="bg-white text-slate-800 font-semibold text-xs">
              {lbl}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default function ProgramTrackerView({ 
  programs, 
  onAddProgramClick, 
  onUpdateProgressClick,
  onEditProgramClick,
  onInlineUpdate,
  onDeleteProgram,
  currentUser
}: ProgramTrackerViewProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCluster, setSelectedCluster] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");
  const [selectedPriority, setSelectedPriority] = useState<string>("All");
  const [selectedPhase, setSelectedPhase] = useState<string>("All");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [activeActionDropdownId, setActiveActionDropdownId] = useState<string | null>(null);
  const [onlyMyPrograms, setOnlyMyPrograms] = useState(false);
  
  // Close actions dropdown when clicking anywhere else
  useEffect(() => {
    const handleOutsideClick = () => {
      setActiveActionDropdownId(null);
    };
    window.addEventListener("click", handleOutsideClick);
    return () => {
      window.removeEventListener("click", handleOutsideClick);
    };
  }, []);
  
  // Responsive layout configuration state
  const [viewMode, setViewMode] = useState<"card" | "spreadsheet">("spreadsheet");
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const handleResize = () => {
      const isMobile = window.innerWidth < 1024;
      setViewMode(isMobile ? "card" : "spreadsheet");
    };

    // Initialize on mount
    handleResize();

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  const toggleCard = (id: string) => {
    setExpandedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Tab section state to split columns into focused sections
  const [activeSectionTab, setActiveSectionTab] = useState<"All" | "I" | "III" | "V">("All");
  const [showConditionsGuide, setShowConditionsGuide] = useState(false);

  const topScrollbarRef = useRef<HTMLDivElement>(null);
  const tableContainerRef = useRef<HTMLDivElement>(null);

  // Sync scroll positions between top scrollbar and table container
  const handleTopScroll = () => {
    if (tableContainerRef.current && topScrollbarRef.current) {
      const targetScroll = topScrollbarRef.current.scrollLeft;
      if (tableContainerRef.current.scrollLeft !== targetScroll) {
        tableContainerRef.current.scrollLeft = targetScroll;
      }
    }
  };

  const handleTableScroll = () => {
    if (topScrollbarRef.current && tableContainerRef.current) {
      const targetScroll = tableContainerRef.current.scrollLeft;
      if (topScrollbarRef.current.scrollLeft !== targetScroll) {
        topScrollbarRef.current.scrollLeft = targetScroll;
      }
    }
  };

  // Reset scrolls when tab changes
  useEffect(() => {
    if (tableContainerRef.current) tableContainerRef.current.scrollLeft = 0;
    if (topScrollbarRef.current) topScrollbarRef.current.scrollLeft = 0;
  }, [activeSectionTab]);

  const scrollTable = (direction: "left" | "right") => {
    if (tableContainerRef.current) {
      const scrollAmount = direction === "left" ? -500 : 500;
      tableContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: "smooth"
      });
    }
  };

  // Column visibility and min-width helpers
  const isColVisible = (section: "I" | "III" | "V") => {
    return activeSectionTab === "All" || activeSectionTab === section;
  };

  const tableMinWidth = useMemo(() => {
    switch (activeSectionTab) {
      case "I": return "min-w-[2995px]";
      case "III": return "min-w-[1595px]";
      case "V": return "min-w-[875px]";
      default: return "min-w-[4675px]";
    }
  }, [activeSectionTab]);

  const totalActiveCols = useMemo(() => {
    let cols = 3; // No, Topic, Actions
    if (isColVisible("I")) cols += 20;
    if (isColVisible("III")) cols += 9;
    if (isColVisible("V")) cols += 3;
    return cols;
  }, [activeSectionTab]);

  const colWidths = useMemo(() => {
    const widths = ["40px", "240px"];
    if (activeSectionTab === "All" || activeSectionTab === "I") {
      widths.push(
        "160px", "160px", "120px", "120px", "120px", "120px", "120px", "100px",
        "160px", "160px", "160px", "160px", "120px", "120px", "160px",
        "160px", "160px", "120px", "120px", "120px"
      );
    }
    if (activeSectionTab === "All" || activeSectionTab === "III") {
      widths.push(
        "160px", "160px", "120px", "160px", "120px", "120px", "120px", "120px", "120px"
      );
    }
    if (activeSectionTab === "All" || activeSectionTab === "V") {
      widths.push("160px", "160px", "160px");
    }
    widths.push("75px");
    return widths;
  }, [activeSectionTab]);
  
  // Sort control
  const [sortField, setSortField] = useState<keyof ProgramJob>("no");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // Selection configurations
  const clusterOptions = ["Strategic Transformation", "Corporate Culture", "Change Management", "Investment Governance", "Corporate Insight"];
  const ownerOptions = ["DC", "DJ", "DN", "DR", "DS", "DH", "DI", "DF"];
  const requestOptions = ["From DZ", "Not DZ"];
  const ztRoleOptions = [
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
  const phaseOptions = ["Ideation", "Kajian", "Validasi", "Approval", "Execution", "Benefit Realization"];
  const statusOptions = ["Green", "Yellow", "Red", "Blocked"];
  const decisionOptions = ["Yes", "No"];
  const confidenceOptions = ["High", "Medium", "Low", "No-Go"];
  const strategicFitOptions = ["High", "Medium", "Low"];
  const priorityOptions = [
    { value: "Critical", label: "P1 (Critical)" },
    { value: "High", label: "P2 (High)" },
    { value: "Medium", label: "P3 (Medium)" },
    { value: "Low", label: "P4 (Low)" }
  ];
  
  const ztPicOptions = [
    { value: "", label: "-- Choose --" },
    { value: "ZTI", label: "ZTI" },
    { value: "ZTS", label: "ZTS" },
    { value: "ZTI & ZTS", label: "ZTI & ZTS" }
  ];
  
  const committeeStatusOptions = [
    { value: "", label: "-- choose --" },
    { value: "Pre-Review", label: "Pre-Review" },
    { value: "Review", label: "Review" },
    { value: "Revise", label: "Revise" },
    { value: "Hold", label: "Hold" },
    { value: "Rejected", label: "Rejected" }
  ];
  
  const investmentStatusOptions = [
    { value: "", label: "-- choose --" },
    { value: "Approved", label: "Approved" },
    { value: "Pending", label: "Pending" },
    { value: "Revise", label: "Revise" },
    { value: "Hold", label: "Hold" },
    { value: "Rejected", label: "Rejected" }
  ];

  const riskTypeOptions = [
    { value: "", label: "-- choose --" },
    { value: "Portfolio & Delivery Risk", label: "Portfolio & Delivery Risk" },
    { value: "Strategic & Business Model Alignment Risk", label: "Strategic & Business Model Alignment Risk" },
    { value: "Change Management & Cultural Readiness Risk", label: "Change Management & Cultural Readiness Risk" },
    { value: "Digital & Technology Transformation Risk", label: "Digital & Technology Transformation Risk" },
    { value: "Controls & Operational Readiness Risk", label: "Controls & Operational Readiness Risk" }
  ];

  const riskStatusOptions = [
    { value: "", label: "-- choose --" },
    { value: "Open", label: "Open" },
    { value: "In Progress", label: "In Progress" },
    { value: "Closed", label: "Closed" }
  ];

  const valueStatusOptions = [
    { value: "", label: "-- choose --" },
    { value: "Green", label: "Green" },
    { value: "Yellow", label: "Yellow" },
    { value: "Red", label: "Red" },
    { value: "Blocked", label: "Blocked" }
  ];

  const scoreOptions = [
    { value: "1", label: "1" },
    { value: "2", label: "2" },
    { value: "3", label: "3" },
    { value: "4", label: "4" }
  ];

  // Stylers
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Green":
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" };
      case "Yellow":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "Red":
        return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
      case "Blocked":
        return { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-300" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-150" };
    }
  };

  const getPriorityStyles = (prio: string) => {
    switch (prio) {
      case "Critical":
        return { bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
      case "High":
        return { bg: "bg-orange-50", text: "text-orange-700", border: "border-orange-200" };
      case "Medium":
        return { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
      case "Low":
        return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-200" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-150" };
    }
  };

  const getSimpleTagStyles = (val: string) => {
    switch (val) {
      case "High":
      case "Yes":
      case "Approved":
      case "Open":
        return { bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" };
      case "Medium":
      case "Pending":
      case "In Progress":
        return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
      case "No-Go":
        return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200" };
      case "Low":
      case "No":
      case "Closed":
        return { bg: "bg-slate-50", text: "text-slate-500", border: "border-slate-150" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" };
    }
  };

  const getZtPicStyles = (val: string) => {
    switch (val) {
      case "ZTI":
        return { bg: "bg-teal-50/70", text: "text-teal-700", border: "border-teal-200" };
      case "ZTS":
        return { bg: "bg-purple-50/70", text: "text-purple-700", border: "border-purple-200" };
      case "ZTI & ZTS":
        return { bg: "bg-pink-50/70", text: "text-pink-700", border: "border-pink-200" };
      default:
        return { bg: "bg-slate-50", text: "text-slate-400", border: "border-slate-100" };
    }
  };

  // Live Spreadsheet Save Field Linkage Logic
  const handleSaveField = (programId: string, program: ProgramJob, field: keyof ProgramJob, value: any) => {
    if (currentUser?.role === "VIEWER") {
      alert("Akses Dibatasi: Peran Anda tidak memiliki izin untuk mengedit sel spreadsheet ini secara langsung.");
      return;
    }

    const updated: Partial<ProgramJob> = { [field]: value };

    // Section 3 automatic formula linkage
    if (field === "riskImpact" || field === "riskProbability") {
      const imp = field === "riskImpact" ? Number(value) : (program.riskImpact || 0);
      const prob = field === "riskProbability" ? Number(value) : (program.riskProbability || 0);
      const score = imp * prob;
      updated.riskLevelScore = score;
      
      let level: "Critical" | "High" | "Medium" | "Low" | "" = "";
      if (score === 16) level = "Critical";
      else if (score === 12) level = "High";
      else if (score === 8 || score === 9) level = "Medium";
      else if (score >= 1 && score <= 6) level = "Low";
      
      updated.riskLevel = level;

      // Synchronize priority with calculated riskLevel
      if (level === "Critical") {
        updated.priority = "Critical";
      } else if (level === "High") {
        updated.priority = "High";
      } else if (level === "Medium") {
        updated.priority = "Medium";
      } else if (level === "Low") {
        updated.priority = "Low";
      } else {
        updated.priority = "Medium"; // Fallback default
      }
    }

    // Same progress link across Section 1 and Section 2
    if (field === "progress") {
      updated.progress = Number(value);
    }

    // Auto calculate statusTracker based on progress (%)
    if (field === "progress") {
      const currentProgress = Number(value);

      let status: "Green" | "Yellow" | "Red" | "Blocked" = "Green";
      if (currentProgress === 0) {
        status = "Blocked";
      } else if (currentProgress >= 80) {
        status = "Green";
      } else if (currentProgress >= 40) {
        status = "Yellow";
      } else {
        status = "Red";
      }
      updated.statusTracker = status;
    }

    if (onInlineUpdate) {
      onInlineUpdate(programId, updated);
    }
  };

  // Excel columns definition matching the cockpit sheet
  const handleExportToExcel = () => {
    if (programs.length === 0) return;
    
    const rows = filteredPrograms.map((p, idx) => ({
      "No": idx + 1,
      "Topic": p.topic,
      "Sub Topic": p.subTopic || "",
      "Cluster": p.cluster,
      "Owner": p.owner,
      "ZT Role": p.ztRole,
      "Phase": p.phase,
      "Progress (%)": p.progress + "%",
      "Strategic Impact": p.strategicImpact,
      "Status Tracker": p.statusTracker,
      "Current Milestone": p.currentMilestone,
      "Key Issue": p.keyIssue,
      "Action Plan": p.actionPlan,
      "Deadline": p.deadline,
      "Decision Needed": p.decisionNeeded,
      "DZ Intervention": p.dzIntervention,
      "ZT PIC": p.ztPic,
      "Confidence": p.confidence,
      "Strategic Fit": p.strategicFit,
      "Priority / Risk Level": p.priority === "Critical" ? "P1 (Critical)" : p.priority === "High" ? "P2 (High)" : p.priority === "Medium" ? "P3 (Medium)" : p.priority === "Low" ? "P4 (Low)" : p.priority,

      "Risk Type": p.riskType || "",
      "Risk/Issue": p.riskIssue || "",
      "Risk Program Ref": p.riskProgram || "",
      "Impact Score (1-5)": p.riskImpact || 0,
      "Probability Score (1-5)": p.riskProbability || 0,
      "Calculated Risk Score": p.riskLevelScore || 0,
      "Risk Severity Level": p.riskLevel || "",
      "Mitigation / Recovery Action": p.riskMitigation || "",
      "Clear the Path": p.clearThePath || "",
      "Risk Owner": p.riskOwner || "",
      "Risk Status": p.riskStatus || "",
      "Escalation To": p.riskEscalationTo || "",

      "Notes / Comments": p.notes || ""
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Program Tracker Core");

    XLSX.writeFile(workbook, `DZ_Cockpit_Program_Tracker_2026.xlsx`);
  };

  // Filter evaluation logic
  const filteredPrograms = useMemo(() => {
    let list = programs;
    if (onlyMyPrograms && currentUser && currentUser.ownerName) {
      const code = currentUser.ownerName.toUpperCase();
      list = programs.filter(p => 
        (p.owner || "").split(",").map(o => o.trim().toUpperCase()).includes(code) ||
        (p.ztPic || "").toUpperCase() === code
      );
    }

    return list
      .filter(p => {
        const matchesSearch = 
          p.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (p.keyIssue && p.keyIssue.toLowerCase().includes(searchTerm.toLowerCase()));
          
        const matchesCluster = selectedCluster === "All" || p.cluster === selectedCluster;
        const matchesStatus = selectedStatus === "All" || p.statusTracker === selectedStatus;
        const matchesPriority = selectedPriority === "All" || p.priority === selectedPriority;
        const matchesPhase = selectedPhase === "All" || p.phase === selectedPhase;

        return matchesSearch && matchesCluster && matchesStatus && matchesPriority && matchesPhase;
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];

        if (typeof valA === "string") {
          valA = valA.toLowerCase();
          valB = (valB as string).toLowerCase();
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1;
        if (valA > valB) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
  }, [programs, onlyMyPrograms, currentUser, searchTerm, selectedCluster, selectedStatus, selectedPriority, selectedPhase, sortField, sortDirection]);

  const handleSort = (field: keyof ProgramJob) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field: keyof ProgramJob) => {
    if (sortField !== field) {
      return <span className="inline-block ml-1 text-slate-350 font-mono text-[9px] select-none">⇅</span>;
    }
    return (
      <span className="inline-block ml-1 text-indigo-600 font-mono text-[9px] font-bold select-none">
        {sortDirection === "asc" ? "▲" : "▼"}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      
      {/* 1. Header Toolbar with actions */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-2">
          
          {/* Search box */}
          <div className="relative col-span-1 md:col-span-2 lg:col-span-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari Topic, Unit Owner, Isu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50"
            />
          </div>

          {/* Cluster filter */}
          <div>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded focus:ring-1 focus:ring-slate-500 bg-white"
            >
              <option value="All">Semua Cluster</option>
              {clusterOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Status Tracker filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded focus:ring-1 bg-white"
            >
              <option value="All">Semua Status</option>
              <option value="Green">Green / Sehat</option>
              <option value="Yellow">Yellow / Perhatian</option>
              <option value="Red">Red / Intervensi</option>
              <option value="Blocked">Blocked / Terhambat</option>
            </select>
          </div>

          {/* Priority filter */}
          <div>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded focus:ring-1 bg-white"
            >
              <option value="All">Semua Prioritas</option>
              <option value="Critical">P1 (Critical)</option>
              <option value="High">P2 (High)</option>
              <option value="Medium">P3 (Medium)</option>
              <option value="Low">P4 (Low)</option>
            </select>
          </div>

          {/* Phase filter */}
          <div>
            <select
              value={selectedPhase}
              onChange={(e) => setSelectedPhase(e.target.value)}
              className="w-full text-xs px-2.5 py-2 border border-slate-300 rounded focus:ring-1 bg-white"
            >
              <option value="All">Semua Phase</option>
              {phaseOptions.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>

        </div>

        {/* Action Button Strip */}
        <div className="flex items-center gap-2">
          {currentUser?.role === "TEAM_INTERNAL" && currentUser?.ownerName && (
            <div className="flex items-center gap-2 bg-[#f36e21]/5 px-2.5 py-1.5 rounded-lg border border-[#f36e21]/15 mr-1 shrink-0">
              <span className="text-[10px] font-extrabold text-[#1e266f] tracking-wide">Cluster {currentUser.ownerName} Saja:</span>
              <button
                type="button"
                onClick={() => setOnlyMyPrograms(!onlyMyPrograms)}
                className={`relative inline-flex h-5.5 w-10 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  onlyMyPrograms ? "bg-[#f36e21]" : "bg-slate-300"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    onlyMyPrograms ? "translate-x-4.5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          )}

          <button
            onClick={handleExportToExcel}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Download excel spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export to Excel
          </button>
          
          {currentUser?.role !== "VIEWER" && (
            <button
              onClick={onAddProgramClick}
              className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[#f36e21] hover:bg-[#db5610] active:scale-95 transition-all duration-150 text-white rounded-lg font-bold text-xs shadow-3xs cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Tambah Kerja Baru
            </button>
          )}
        </div>
      </div>

      {/* 2. Spreadsheet Tip Info Banner */}
      {viewMode === "spreadsheet" && (
        <div className="bg-slate-50 rounded-lg p-2.5 px-4 text-[10.5px] text-slate-500 border border-slate-200 flex items-center gap-2 bg-gradient-to-r from-slate-50 to-indigo-50/20">
          <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span>
            <strong>Spreadsheet Mode Aktif:</strong> Anda dapat langsung mengedit nilai (Owner, Impact, Risiko, Potensi Value, dll) di sel tabel di bawah. Perubahan langsung disimpan ke database lokal dan terhubung otomatis.
          </span>
        </div>
      )}

      {/* 3. Core Spreadsheet Grid */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Card Header matching screenshot */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 select-none">
          <div>
            <h3 className="font-mono text-slate-800 font-bold text-xs tracking-widest uppercase">
              Program Tracker Main List
            </h3>
            <p className="text-[10px] text-slate-500 mt-1">
              {viewMode === "spreadsheet" 
                ? "Pilih tab di bawah untuk memfokuskan tampilan spreadsheet per-seksi."
                : "Gunakan Card View untuk interaksi mobile yang cepat & responsif."}
            </p>
          </div>
          
          <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center gap-0.5 bg-slate-200/70 p-1 rounded-lg border border-slate-300">
              <button
                type="button"
                onClick={() => setViewMode("card")}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === "card"
                    ? "bg-[#1e266f] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Card View
              </button>
              <button
                type="button"
                onClick={() => setViewMode("spreadsheet")}
                className={`px-3 py-1.5 text-[10.5px] font-bold rounded-md transition-all cursor-pointer ${
                  viewMode === "spreadsheet"
                    ? "bg-[#1e266f] text-white shadow-xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Spreadsheet
              </button>
            </div>

            <span className="font-mono text-[10px] sm:text-xs text-slate-500 font-medium tracking-wide bg-slate-100 px-2.5 py-1 rounded border border-slate-200/60 self-center shrink-0">
              {filteredPrograms.length} entries filtered
            </span>
          </div>
        </div>

        {/* Section Tabs Navigation with Scroll Assist */}
        <div className={`${viewMode === "spreadsheet" ? "flex" : "hidden"} flex-col xl:flex-row xl:items-center justify-between border-b border-slate-200 bg-slate-50/50 p-2 gap-2 select-none`}>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setActiveSectionTab("All")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSectionTab === "All"
                  ? "bg-[#1E293B] text-white shadow-xs"
                  : "text-slate-600 hover:bg-slate-150"
              }`}
            >
              Semua Kolom (All)
            </button>
            
            <div className="w-[1px] h-4 bg-slate-300 mx-1 shrink-0" />
            
            <button
              onClick={() => setActiveSectionTab("I")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSectionTab === "I"
                  ? "bg-slate-200 text-slate-800 border border-slate-300 shadow-xs"
                  : "text-slate-600 hover:bg-slate-150"
              }`}
            >
              I. Program Tracker
            </button>
            
            <div className="w-[1px] h-4 bg-slate-300 mx-1 shrink-0" />
            
            <button
              onClick={() => setActiveSectionTab("III")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSectionTab === "III"
                  ? "bg-rose-100 text-rose-900 border border-rose-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-150"
              }`}
            >
              II. Risk & Issue
            </button>
            
            <div className="w-[1px] h-4 bg-slate-300 mx-1 shrink-0" />
            
            <button
              onClick={() => setActiveSectionTab("V")}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                activeSectionTab === "V"
                  ? "bg-sky-100 text-sky-900 border border-sky-200 shadow-xs"
                  : "text-slate-600 hover:bg-slate-150"
              }`}
            >
              III. Attachments
            </button>
          </div>

          {/* Quick Scroll Actions Bar */}
          <div className="flex items-center gap-1.5 px-3 py-1 bg-white rounded-lg border border-slate-200 self-end xl:self-auto shadow-3xs">
            <span className="text-[10px] font-mono text-slate-500 font-bold uppercase tracking-wider mr-1">Navigasi Tabel:</span>
            <button
              onClick={() => scrollTable("left")}
              className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 hover:border-indigo-200 text-slate-600 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Geser Kiri"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scrollTable("right")}
              className="p-1.5 bg-slate-50 hover:bg-indigo-50 hover:text-indigo-600 rounded border border-slate-200 hover:border-indigo-200 text-slate-600 transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              title="Geser Kanan"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Synced Top Scrollbar: Allows users to scroll horizontally from the top of the spreadsheet without scrolling down first */}
        <div className={`${viewMode === "spreadsheet" ? "flex" : "hidden"} bg-slate-100/60 border-b border-slate-200 px-1 py-1.5 select-none items-center gap-2`}>
          <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest pl-2 shrink-0">Top Scrollbar:</span>
          <div 
            ref={topScrollbarRef}
            onScroll={handleTopScroll}
            className="overflow-x-scroll overflow-y-hidden flex-1 custom-scrollbar-always cursor-ew-resize"
            style={{ height: "14px" }}
          >
            <div style={{ width: tableMinWidth, height: "1px" }} />
          </div>
        </div>

        {/* Scrollable Container */}
        <div 
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          className={`${viewMode === "spreadsheet" ? "block" : "hidden"} overflow-x-scroll overflow-y-scroll max-h-[68vh] custom-scrollbar-always`}
        >
          <table className={`table-fixed w-full text-left text-xs divide-y divide-slate-200 ${tableMinWidth} font-sans`}>
            <colgroup>
              {colWidths.map((width, index) => (
                <col key={index} style={{ width }} />
              ))}
            </colgroup>

            <thead className="sticky top-0 z-30 shadow-sm select-none">
              {/* Row 1: Unified Color-Coded Category Blocks */}
              <tr className="divide-x divide-[#1d1b5c] border-b border-[#1d1b5c]">
                <th rowSpan={2} className="bg-[#26247b] border-b-2 border-r border-[#1d1b5c] text-white font-mono font-bold text-center text-[10px] uppercase tracking-wider sm:sticky sm:left-0 sm:z-30 z-20">
                  No
                </th>
                <th 
                  rowSpan={2} 
                  onClick={() => handleSort("topic")}
                  className="bg-[#26247b] border-b-2 border-r border-[#1d1b5c] text-white font-mono font-bold text-center text-[10px] uppercase tracking-wider sm:sticky sm:left-[40px] sm:z-30 z-20 sm:shadow-[2px_0_5px_rgba(0,0,0,0.15)] cursor-pointer hover:bg-[#1d1b5c] transition-colors"
                >
                  Topic
                </th>
                
                {/* Section 1 Group block */}
                {isColVisible("I") && (
                  <th colSpan={20} className="bg-[#26247b] border-b-2 border-r border-[#1d1b5c] text-white font-bold text-center py-2 uppercase text-[10px] tracking-widest font-mono">
                    I. PROGRAM TRACKER
                  </th>
                )}
                
                {/* Section 3 Group block */}
                {isColVisible("III") && (
                  <th colSpan={9} className="bg-[#f36f21] border-b-2 border-r border-[#d55b14] text-white font-bold text-center py-2 uppercase text-[10.5px] tracking-widest font-mono">
                    II. RISK & ISSUE TRACKER
                  </th>
                )}

                {/* Section 5 Group block */}
                {isColVisible("V") && (
                  <th colSpan={3} className="bg-[#26247b] border-b-2 border-r border-[#1d1b5c] text-white font-bold text-center py-2 uppercase text-[10.5px] tracking-widest font-mono">
                    III. DOCUMENT / FILE ATTACHMENTS
                  </th>
                )}
                
                <th rowSpan={2} className="bg-[#f36f21] border-b-2 border-l border-[#d55b14] text-white font-mono font-bold text-center text-[10px] uppercase tracking-wider sm:sticky sm:right-0 sm:z-30 z-20 sm:shadow-[-2px_0_5px_rgba(0,0,0,0.15)]">
                  Actions
                </th>
              </tr>
              
              {/* Row 2: Header Labels for Spreadsheet columns */}
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold text-[9.5px] uppercase tracking-wider divide-x divide-slate-200 divide-y-0 select-none">
                {/* Section 1 Sub-Headers */}
                {isColVisible("I") && (
                  <>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center font-bold text-[#1e266f]" onClick={() => handleSort("subTopic")}>Sub Topic</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("cluster")}>Cluster</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("owner")}>Unit Owner</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("request")}>Request</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("priority")}>Priority</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("ztRole")}>ZT Role</th>
                    <th className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => handleSort("phase")}>Phase</th>
                    <th 
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center relative group" 
                      onClick={() => handleSort("statusTracker")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Status Tracker</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-1.5 pb-1 border-b border-slate-800 text-[10.5px]">LOGIKA STATUS & PROGRESS</div>
                        <div className="space-y-1.5 text-[11px] font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 border border-emerald-400 shadow-sm"></span>
                            <span className="text-emerald-400 font-bold">Green (Sehat):</span>
                            <span className="text-slate-300 ml-auto">80% - 100%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 border border-amber-400 shadow-sm"></span>
                            <span className="text-amber-400 font-bold">Yellow (Perhatian):</span>
                            <span className="text-slate-300 ml-auto">40% - 79%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 border border-rose-400 shadow-sm"></span>
                            <span className="text-rose-400 font-bold">Red (Intervensi):</span>
                            <span className="text-slate-300 ml-auto">1% - 39%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0 border border-slate-400 shadow-sm"></span>
                            <span className="text-slate-400 font-bold">Blocked (Terhambat):</span>
                            <span className="text-slate-300 ml-auto">0% atau Hold</span>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th 
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center relative group" 
                      onClick={() => handleSort("progress")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Progress</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-1.5 pb-1 border-b border-slate-800 text-[10.5px]">LOGIKA STATUS & PROGRESS</div>
                        <div className="space-y-1.5 text-[11px] font-medium">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 border border-emerald-400 shadow-sm"></span>
                            <span className="text-emerald-400 font-bold">Green (Sehat):</span>
                            <span className="text-slate-300 ml-auto">80% - 100%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0 border border-amber-400 shadow-sm"></span>
                            <span className="text-amber-400 font-bold">Yellow (Perhatian):</span>
                            <span className="text-slate-300 ml-auto">40% - 79%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 border border-rose-400 shadow-sm"></span>
                            <span className="text-rose-400 font-bold">Red (Intervensi):</span>
                            <span className="text-slate-300 ml-auto">1% - 39%</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-500 shrink-0 border border-slate-400 shadow-sm"></span>
                            <span className="text-slate-400 font-bold">Blocked (Terhambat):</span>
                            <span className="text-slate-300 ml-auto">0% atau Hold</span>
                          </div>
                        </div>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center">Strategic Impact</th>
                    <th className="py-2.5 px-2 text-center">Current Milestone</th>
                    <th className="py-2.5 px-2 text-center">Key Issue</th>
                    <th className="py-2.5 px-2 text-center">ZT Recommendation</th>
                    <th 
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center relative group" 
                      onClick={() => handleSort("startDate")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Start Date</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-56 p-2.5 bg-slate-900 text-white text-center text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-medium text-[11px] text-slate-200">
                          Tanggal dimulainya pelaksanaan program atau inisiatif utama.
                        </div>
                      </div>
                    </th>
                    <th 
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center relative group" 
                      onClick={() => handleSort("deadline")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Deadline</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-56 p-2.5 bg-slate-900 text-white text-center text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-medium text-[11px] text-slate-200">
                          Target tanggal batas waktu penyelesaian program atau milestone utama.
                        </div>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center">Decision Needed</th>
                    <th className="py-2.5 px-2 text-center">DZ Intervention</th>
                    <th className="py-2.5 px-2 text-center">Clear the Path</th>
                    <th className="py-2.5 px-2 text-center">ZT PIC</th>
                    <th 
                      className="py-2.5 px-2 cursor-pointer hover:bg-slate-100 transition-colors text-center relative group" 
                      onClick={() => handleSort("confidence")}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <span>Confidence</span>
                        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-1.5 hidden sm:group-hover:block z-50 w-72 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
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
                    </th>
                  </>
                )}
                
                {/* Section 3 Sub-Headers */}
                {isColVisible("III") && (
                  <>
                    <th className="py-2.5 px-2 text-center">Type</th>
                    <th className="py-2.5 px-2 text-center">Risk / Issue Description (Free-text)</th>
                    <th className="py-2.5 px-2 text-center">Escalation To</th>
                    <th className="py-2.5 px-2 text-center">Mitigation / Recovery Action</th>
                    <th className="py-2.5 px-2 text-center relative group cursor-help hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Impact (1-4)</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-[10.5px] uppercase tracking-wider text-center font-mono">KRITERIA IMPACT (DAMPAK)</div>
                        <table className="w-full text-[11px] font-medium border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[9.5px]">
                              <th className="text-left pb-1.5 w-12">Skor</th>
                              <th className="text-left pb-1.5">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            <tr>
                              <td className="py-1.5 font-bold text-cyan-400">1</td>
                              <td className="py-1.5 text-slate-300">Tidak Signifikan</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-emerald-400">2</td>
                              <td className="py-1.5 text-slate-300">Minor</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-yellow-400">3</td>
                              <td className="py-1.5 text-slate-300">Moderat</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-rose-400">4</td>
                              <td className="py-1.5 text-slate-300">Kritis / Fatal</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center relative group cursor-help hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Probability (1-4)</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-64 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-[10.5px] uppercase tracking-wider text-center font-mono">KRITERIA PROBABILITY (KEMUNGKINAN)</div>
                        <table className="w-full text-[11px] font-medium border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[9.5px]">
                              <th className="text-left pb-1.5 w-12">Skor</th>
                              <th className="text-left pb-1.5">Keterangan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            <tr>
                              <td className="py-1.5 font-bold text-cyan-400">1</td>
                              <td className="py-1.5 text-slate-300">Sangat Jarang</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-emerald-400">2</td>
                              <td className="py-1.5 text-slate-300">Jarang</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-yellow-400">3</td>
                              <td className="py-1.5 text-slate-300">Sering</td>
                            </tr>
                            <tr>
                              <td className="py-1.5 font-bold text-rose-400">4</td>
                              <td className="py-1.5 text-slate-300">Hampir Pasti</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center relative group cursor-help hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Level Score</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-1.5 hidden sm:group-hover:block z-50 w-72 p-3 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-[10.5px] uppercase tracking-wider text-center">MATRIKS SKOR RISIKO</div>
                        <table className="w-full text-[11px] font-medium border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[9.5px]">
                              <th className="text-left pb-1">Level Risk</th>
                              <th className="text-center pb-1">Warna</th>
                              <th className="text-right pb-1">Skor (Impact×Prob)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            <tr>
                              <td className="py-1 text-rose-400 font-bold">Critical Risk</td>
                              <td className="py-1 text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#e50000] border border-red-400"></span></td>
                              <td className="py-1 text-right text-slate-300 font-semibold">16</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-orange-400 font-bold">High Risk</td>
                              <td className="py-1 text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ff9000] border border-orange-400"></span></td>
                              <td className="py-1 text-right text-slate-300 font-semibold">12</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-yellow-400 font-bold">Medium Risk</td>
                              <td className="py-1 text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#ffd400] border border-yellow-450"></span></td>
                              <td className="py-1 text-right text-slate-300 font-semibold font-semibold">6 - 9</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-emerald-400 font-bold">Low Risk (Light Green)</td>
                              <td className="py-1 text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#92e58c] border border-emerald-450"></span></td>
                              <td className="py-1 text-right text-slate-300 font-semibold">4 - 6</td>
                            </tr>
                            <tr>
                              <td className="py-1 text-cyan-400 font-bold">Low Risk (Teal)</td>
                              <td className="py-1 text-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-[#26afb2] border border-cyan-300"></span></td>
                              <td className="py-1 text-right text-slate-300 font-semibold">1 - 3</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center relative group cursor-help hover:bg-slate-100 transition-colors">
                      <div className="flex items-center justify-center gap-1">
                        <span>Risk Level</span>
                        <Info className="w-3 h-3 text-slate-400" />
                      </div>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full right-0 mt-1.5 hidden sm:group-hover:block z-50 w-96 p-3.5 bg-slate-900 text-white text-left text-xs rounded-xl shadow-xl border border-slate-700 pointer-events-none normal-case tracking-normal font-sans">
                        <div className="font-bold text-slate-300 mb-2 pb-1 border-b border-slate-800 text-[10.5px] uppercase tracking-wider text-center font-mono">Tingkat Risiko (Risk Level)</div>
                        <table className="w-full text-[11px] font-medium border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-[9.5px]">
                              <th className="text-left pb-1.5">Risk Level</th>
                              <th className="text-center pb-1.5">Rentang Skor</th>
                              <th className="text-left pb-1.5 px-1">Warna Heatmap</th>
                              <th className="text-right pb-1.5">Deskripsi Tindakan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/40">
                            <tr>
                              <td className="py-2 text-rose-400 font-bold">Critical Risk</td>
                              <td className="py-2 text-center text-rose-400 font-bold">16</td>
                              <td className="py-2 px-1">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#e50000] border border-red-500"></span>
                                  <span className="text-[10px] text-slate-300">Merah Kritis (Red)</span>
                                </span>
                              </td>
                              <td className="py-2 text-right text-slate-300">Kondisi Darurat</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-orange-400 font-bold">High Risk</td>
                              <td className="py-2 text-center text-orange-400 font-bold">12</td>
                              <td className="py-2 px-1">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff9000] border border-orange-400"></span>
                                  <span className="text-[10px] text-slate-300">Oranye (Orange)</span>
                                </span>
                              </td>
                              <td className="py-2 text-right text-slate-300">Perhatian Utama</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-yellow-400 font-bold">Medium Risk</td>
                              <td className="py-2 text-center text-yellow-400 font-bold">6 - 9</td>
                              <td className="py-2 px-1">
                                <span className="inline-flex items-center gap-1.5">
                                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffd400] border border-yellow-500"></span>
                                  <span className="text-[10px] text-slate-300">Kuning (Yellow)</span>
                                </span>
                              </td>
                              <td className="py-2 text-right text-slate-300">Pemantauan Rutin</td>
                            </tr>
                            <tr>
                              <td className="py-2 text-emerald-400 font-bold">Low Risk</td>
                              <td className="py-2 text-center text-emerald-400 font-bold">1 - 4</td>
                              <td className="py-2 px-1">
                                <div className="flex flex-col gap-1">
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[#26afb2] border border-cyan-400"></span>
                                    <span className="text-[9px] text-slate-300">Teal (1-3)</span>
                                  </span>
                                  <span className="inline-flex items-center gap-1">
                                    <span className="w-2 h-2 rounded-full bg-[#92e58c] border border-emerald-400"></span>
                                    <span className="text-[9px] text-slate-300">Light Green (4-6)</span>
                                  </span>
                                </div>
                              </td>
                              <td className="py-2 text-right text-slate-300">Risiko Ringan</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </th>
                    <th className="py-2.5 px-2 text-center">Status Risk</th>
                  </>
                )}

                {/* Section 5 Sub-Headers */}
                {isColVisible("V") && (
                  <>
                    <th className="py-2.5 px-2 text-center">Konseptor Justifikasi</th>
                    <th className="py-2.5 px-2 text-center">Upload Attachment Files</th>
                    <th className="py-2.5 px-2 text-center">Document / Reference Link</th>
                  </>
                )}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filteredPrograms.length === 0 ? (
                <tr>
                  <td colSpan={totalActiveCols} className="py-20 text-center font-mono text-slate-400 bg-slate-50/50">
                    Tidak ditemukan pekerjaan cocok dengan filter yang ditentukan.
                  </td>
                </tr>
              ) : (
                filteredPrograms.map((p, idx) => {
                  const rowBgClass = idx % 2 === 0 ? "bg-white" : "bg-slate-50/15";
                  const stickyBgClass = idx % 2 === 0 ? "bg-white" : "bg-[#FAFBFD]";
                  const topicStickyBgClass = idx % 2 === 0 ? "bg-[#f8f9fe]" : "bg-[#f1f3fe]";
                  return (
                    <tr 
                      key={p.id} 
                      onClick={(e) => {
                        const target = e.target as HTMLElement;
                        if (target.closest("input, select, button, a, [role='button']")) {
                          return;
                        }
                        onUpdateProgressClick(p);
                      }}
                      className={`group hover:bg-slate-100/50 cursor-pointer transition-all align-middle divide-x divide-slate-200 font-sans ${rowBgClass}`}
                      title="Klik baris ini untuk melihat detail & riwayat lengkap program"
                    >
                      {/* Index (Sticky Column) */}
                      <td className={`py-3 px-2 text-center font-mono font-bold text-slate-500 sm:sticky sm:left-0 sm:z-10 border-r border-slate-200 ${stickyBgClass} group-hover:bg-slate-100/90 transition-colors`}>
                        {p.no}
                      </td>
                      
                      {/* Topic (Sticky Column with Shadow Accent) */}
                      <td className={`py-3 px-3 sm:sticky sm:left-[40px] sm:z-10 border-r border-slate-250 sm:shadow-[2px_0_5px_rgba(0,0,0,0.06)] font-bold text-[#1e266f] ${topicStickyBgClass} group-hover:bg-[#e8ebfc] transition-colors`}>
                        <SpreadsheetCell 
                          value={p.topic}
                          onSave={(val) => handleSaveField(p.id, p, "topic", val)}
                          className="font-bold text-[#1e266f] text-indigo-950 focus:bg-white"
                        />
                      {p.files && p.files.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1 select-none" onClick={(e) => e.stopPropagation()}>
                          {p.files.map((file, fileIdx) => (
                            <a
                              key={fileIdx}
                              href={file.dataUrl}
                              download={file.name}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all font-mono font-medium border border-slate-200/60 max-w-[190px]"
                              title={`Download ${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                            >
                              <Paperclip className="w-2.5 h-2.5 text-[#1e266f] shrink-0" />
                              <span className="truncate max-w-[140px]">{file.name}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </td>
                    
                    {/* ----------------- SECTION 1: PROGRAM TRACKER ----------------- */}
                    {isColVisible("I") && (
                      <>
                        {/* Sub Topic */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.subTopic || ""}
                            onSave={(val) => handleSaveField(p.id, p, "subTopic", val)}
                            className="font-medium text-slate-700 focus:bg-white text-left"
                            placeholder="Input sub topic..."
                          />
                        </td>

                        {/* Cluster select dropdown */}
                        <td className="py-1 px-1">
                          <SpreadsheetSelectCell
                            value={p.cluster}
                            options={clusterOptions}
                            onSave={(val) => handleSaveField(p.id, p, "cluster", val)}
                            className="font-medium text-slate-700"
                          />
                        </td>

                        {/* Owner */}
                        <td className="py-1 px-1">
                          <SpreadsheetMultiSelectCell
                            value={p.owner}
                            options={ownerOptions}
                            onSave={(val) => handleSaveField(p.id, p, "owner", val)}
                            className="font-medium text-slate-700"
                          />
                        </td>

                        {/* Request */}
                        <td className="py-1 px-1">
                          <SpreadsheetSelectCell
                            value={p.request || ""}
                            options={requestOptions}
                            onSave={(val) => handleSaveField(p.id, p, "request", val)}
                            className="font-medium text-slate-700"
                          />
                        </td>

                        {/* Priority */}
                        <td className="py-1 px-0.5 text-center">
                          <ColoredDropdownCell
                            value={p.priority || "Medium"}
                            options={priorityOptions}
                            onSave={(val) => handleSaveField(p.id, p, "priority", val)}
                            getStyles={getPriorityStyles}
                          />
                        </td>

                        {/* ZT Role */}
                        <td className="py-1 px-1">
                          <SpreadsheetSelectCell
                            value={p.ztRole}
                            options={ztRoleOptions}
                            onSave={(val) => handleSaveField(p.id, p, "ztRole", val)}
                            className="font-mono text-[10.5px] text-slate-600"
                          />
                        </td>

                        {/* Phase select dropdown */}
                        <td className="py-1 px-1 text-center">
                          <SpreadsheetSelectCell
                            value={p.phase}
                            options={phaseOptions}
                            onSave={(val) => handleSaveField(p.id, p, "phase", val)}
                            className="text-center font-bold text-indigo-700"
                          />
                        </td>

                        {/* Status Tracker colored cell */}
                        <td className="py-1 px-1 text-center">
                          <span className={`inline-block px-2.5 py-1 text-xs font-bold rounded-full border shadow-sm ${getStatusStyles(p.statusTracker).bg} ${getStatusStyles(p.statusTracker).text} ${getStatusStyles(p.statusTracker).border}`}>
                            {p.statusTracker || "-"}
                          </span>
                        </td>

                        {/* Progress % */}
                        <td className="py-1 px-1">
                          <div className="flex items-center gap-1">
                            <SpreadsheetCell
                              value={p.progress}
                              type="number"
                              onSave={(val) => handleSaveField(p.id, p, "progress", parseInt(val) || 0)}
                              className="font-mono text-right font-bold w-12"
                            />
                            <span className="text-slate-400 text-[10px] font-bold">%</span>
                          </div>
                        </td>

                        {/* Strategic Impact */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.strategicImpact}
                            onSave={(val) => handleSaveField(p.id, p, "strategicImpact", val)}
                            className="text-slate-600"
                          />
                        </td>

                        {/* Current Milestone */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.currentMilestone}
                            onSave={(val) => handleSaveField(p.id, p, "currentMilestone", val)}
                            className="italic font-normal text-slate-600"
                          />
                        </td>

                        {/* Key Issue */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.keyIssue || ""}
                            onSave={(val) => handleSaveField(p.id, p, "keyIssue", val)}
                            className="text-rose-700 font-medium"
                          />
                        </td>

                        {/* Action Plan */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.actionPlan || ""}
                            onSave={(val) => handleSaveField(p.id, p, "actionPlan", val)}
                            className="font-normal text-slate-600"
                          />
                        </td>

                        {/* Start Date (Date Selector) */}
                        <td className="py-1 px-1 text-center">
                          <SpreadsheetCell
                            value={p.startDate || ""}
                            type="date"
                            onSave={(val) => handleSaveField(p.id, p, "startDate", val)}
                            className="font-mono text-[10px] text-center"
                          />
                        </td>

                        {/* Deadline (Date Selector) */}
                        <td className="py-1 px-1 text-center">
                          <SpreadsheetCell
                            value={p.deadline}
                            type="date"
                            onSave={(val) => handleSaveField(p.id, p, "deadline", val)}
                            className="font-mono text-[10px] text-center"
                          />
                        </td>

                        {/* Decision Needed */}
                        <td className="py-1 px-0.5 text-center">
                          <ColoredDropdownCell
                            value={p.decisionNeeded}
                            options={decisionOptions}
                            onSave={(val) => handleSaveField(p.id, p, "decisionNeeded", val)}
                            getStyles={getSimpleTagStyles}
                          />
                        </td>

                        {/* DZ Intervention */}
                        <td className="py-1 px-0.5 text-center">
                          <ColoredDropdownCell
                            value={p.dzIntervention || "No"}
                            options={decisionOptions}
                            onSave={(val) => handleSaveField(p.id, p, "dzIntervention", val)}
                            getStyles={getSimpleTagStyles}
                          />
                        </td>

                        {/* Clear the Path */}
                        <td className="py-1 px-1">
                          <SpreadsheetCell
                            value={p.clearThePath || ""}
                            onSave={(val) => handleSaveField(p.id, p, "clearThePath", val)}
                            className="text-teal-700 truncate focus:w-auto font-medium"
                          />
                        </td>

                        {/* ZT PIC */}
                        <td className="py-1 px-0.5 text-center">
                          <ColoredDropdownCell
                            value={p.ztPic || ""}
                            options={ztPicOptions}
                            onSave={(val) => handleSaveField(p.id, p, "ztPic", val)}
                            getStyles={getZtPicStyles}
                          />
                        </td>

                        {/* Confidence */}
                        <td className="py-1 px-1 text-center">
                          <ColoredDropdownCell
                            value={p.confidence}
                            options={confidenceOptions}
                            onSave={(val) => handleSaveField(p.id, p, "confidence", val)}
                            getStyles={getSimpleTagStyles}
                          />
                        </td>
                      </>
                    )}

                    {/* ----------------- SECTION 3: RISK & ISSUE TRACKER ----------------- */}
                    {isColVisible("III") && (
                      <>
                        {/* Risk Type Option */}
                        <td className="py-1 px-1 bg-rose-50/5">
                          <SpreadsheetSelectCell
                            value={p.riskType || ""}
                            options={riskTypeOptions}
                            onSave={(val) => handleSaveField(p.id, p, "riskType", val)}
                            className="text-slate-700"
                          />
                        </td>

                        {/* Risk Description */}
                        <td className="py-1 px-1 bg-rose-50/5">
                          <SpreadsheetCell
                            value={p.riskIssue || ""}
                            onSave={(val) => handleSaveField(p.id, p, "riskIssue", val)}
                            className="font-medium text-rose-800"
                          />
                        </td>

                        {/* Risk Escalation To */}
                        <td className="py-1 px-1 bg-rose-50/5">
                          <SpreadsheetCell
                            value={p.riskEscalationTo || ""}
                            onSave={(val) => handleSaveField(p.id, p, "riskEscalationTo", val)}
                            className="font-medium text-slate-700"
                          />
                        </td>

                        {/* Mitigation Recovery Action */}
                        <td className="py-1 px-1 bg-rose-50/5">
                          <SpreadsheetCell
                            value={p.riskMitigation || ""}
                            onSave={(val) => handleSaveField(p.id, p, "riskMitigation", val)}
                            className="text-slate-600 truncate focus:w-auto"
                          />
                        </td>

                        {/* Risk Impact Score */}
                        <td className="py-1 px-1 bg-rose-50/5 text-center">
                          <SpreadsheetSelectCell
                            value={String(p.riskImpact || 0)}
                            options={scoreOptions}
                            onSave={(val) => handleSaveField(p.id, p, "riskImpact", parseInt(val) || 0)}
                            className="text-center font-bold"
                          />
                        </td>

                        {/* Risk Probability Score */}
                        <td className="py-1 px-1 bg-rose-50/5 text-center">
                          <SpreadsheetSelectCell
                            value={String(p.riskProbability || 0)}
                            options={scoreOptions}
                            onSave={(val) => handleSaveField(p.id, p, "riskProbability", parseInt(val) || 0)}
                            className="text-center font-bold"
                          />
                        </td>

                        {/* Calculated Risk Level Score (Impact * Prob) */}
                        <td className="py-1 px-2 bg-rose-50/10 text-center font-mono font-extrabold text-[11px] text-rose-700">
                          {p.riskLevelScore !== 0 ? p.riskLevelScore : "-"}
                        </td>

                        {/* Calculated Risk Severity Level */}
                        <td className="py-1 px-2 text-center bg-rose-50/10">
                          {p.riskLevel ? (
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[10.5px] font-extrabold border ${
                              p.riskLevel === "Critical" ? "bg-red-100 text-red-800 border-red-200" :
                              p.riskLevel === "High" ? "bg-orange-100 text-orange-800 border-orange-200" :
                              p.riskLevel === "Medium" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                              p.riskLevel === "Low" && (p.riskLevelScore || 0) >= 4 ? "bg-lime-100 text-lime-800 border-lime-200" :
                              p.riskLevel === "Low" ? "bg-cyan-100 text-cyan-800 border-cyan-200" :
                              "bg-slate-100 text-slate-500 border-slate-200"
                            }`}>
                              {p.riskLevel}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic font-mono">-</span>
                          )}
                        </td>

                        {/* Risk Status */}
                        <td className="py-1 px-0.5 text-center bg-rose-50/5">
                          <ColoredDropdownCell
                            value={p.riskStatus || ""}
                            options={riskStatusOptions}
                            onSave={(val) => handleSaveField(p.id, p, "riskStatus", val)}
                            getStyles={getSimpleTagStyles}
                          />
                        </td>
                      </>
                    )}



                    {/* Section 5: Attached Files */}
                    {isColVisible("V") && (
                      <>
                        {/* Konseptor Justifikasi */}
                        <td className="py-1 px-1 bg-sky-50/5">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <SpreadsheetCell
                              value={p.justificationConceptor || ""}
                              placeholder="Ketik Konseptor..."
                              onSave={(val) => handleSaveField(p.id, p, "justificationConceptor", val)}
                              className="text-slate-700 font-medium text-[10.5px]"
                            />
                          </div>
                        </td>

                        <td className="py-1 px-2 bg-sky-50/5 text-center">
                          <div className="flex flex-col gap-1 justify-center max-h-[60px] overflow-y-auto pr-1">
                            {p.files && p.files.length > 0 ? (
                              p.files.map((file, fileIdx) => (
                                <a
                                  key={fileIdx}
                                  href={file.dataUrl}
                                  download={file.name}
                                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] bg-sky-50 hover:bg-sky-100 text-sky-800 transition-all font-mono font-bold border border-sky-100 shrink-0 select-none cursor-pointer text-left"
                                  title={`Download ${file.name} (${(file.size / 1024).toFixed(1)} KB)`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Paperclip className="w-3 h-3 text-sky-700 shrink-0" />
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                </a>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 font-mono text-center block">-</span>
                            )}
                          </div>
                        </td>

                        {/* Document Link */}
                        <td className="py-1 px-1 bg-sky-50/5">
                          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                            <SpreadsheetCell
                              value={p.documentLink || ""}
                              placeholder="Paste/type link..."
                              onSave={(val) => handleSaveField(p.id, p, "documentLink", val)}
                              className="text-slate-700 font-medium text-[10.5px]"
                            />
                            {p.documentLink && (p.documentLink.startsWith("http://") || p.documentLink.startsWith("https://")) && (
                              <a
                                href={p.documentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 hover:bg-sky-100 rounded text-sky-700 hover:text-sky-900 transition-colors shrink-0"
                                title="Open link in new tab"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </td>
                      </>
                    )}

                    {/* Sticky Actions Column */}
                    {(() => {
                      const isActionActive = activeActionDropdownId === p.id || confirmDeleteId === p.id;
                      const openDownwards = idx < 3;
                      return (
                        <td 
                          className={`py-2 px-2 text-center sm:sticky sm:right-0 ${isActionActive ? "sm:z-25 z-25" : "sm:z-10 z-10"} border-l border-slate-200 sm:shadow-[-2px_0_5px_rgba(0,0,0,0.06)] min-w-[75px] ${stickyBgClass} group-hover:bg-slate-100/90 transition-colors`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {confirmDeleteId === p.id ? (
                            <div className="flex items-center justify-center gap-1 bg-rose-50/90 p-1 rounded-lg border border-rose-100 shadow-sm">
                              <button
                                onClick={() => {
                                  if (onDeleteProgram) onDeleteProgram(p.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="p-1 bg-rose-600 text-white hover:bg-rose-700 rounded transition-colors shadow-sm flex items-center justify-center cursor-pointer"
                                title="Ya, Hapus"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => setConfirmDeleteId(null)}
                                className="p-1 bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded transition-colors flex items-center justify-center cursor-pointer"
                                title="Batal"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="relative inline-block text-left">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveActionDropdownId(activeActionDropdownId === p.id ? null : p.id);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all flex items-center justify-center cursor-pointer mx-auto"
                                title="Aksi"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
    
                              {activeActionDropdownId === p.id && (
                                <div className={`absolute right-0 ${openDownwards ? "top-full mt-1" : "bottom-full mb-1"} z-50 w-28 bg-white border border-slate-200 rounded-lg shadow-xl py-1 divide-y divide-slate-100 font-sans`}>
                              <button
                                onClick={() => {
                                  onUpdateProgressClick(p);
                                  setActiveActionDropdownId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                <span>View</span>
                              </button>

                              {(currentUser?.role === "ADMIN" || currentUser?.role === "TEAM_INTERNAL") && (
                                <button
                                  onClick={() => {
                                    onEditProgramClick(p);
                                    setActiveActionDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-slate-700 hover:bg-indigo-50 hover:text-indigo-950 transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                                  <span>Edit</span>
                                </button>
                              )}

                              {currentUser?.role === "ADMIN" && (
                                <button
                                  onClick={() => {
                                    setConfirmDeleteId(p.id);
                                    setActiveActionDropdownId(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>Delete</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  );
                })()}
                  </tr>
                );
              })
            )}
              {/* Spacer row to ensure horizontal scrollbar doesn't cover data when scrolled to the very bottom */}
              {filteredPrograms.length > 0 && (
                <tr className="h-10 pointer-events-none select-none bg-white border-none">
                  <td colSpan={totalActiveCols} className="h-10 border-0 bg-white"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Responsive Card Grid View for Mobile & Tablet Viewports */}
        {viewMode === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-5 bg-slate-100/50 max-h-[82vh] overflow-y-auto flex-1 min-h-0">
            {filteredPrograms.length === 0 ? (
              <div className="col-span-full py-16 text-center text-slate-400 font-mono text-xs bg-white rounded-xl border border-dashed border-slate-200 shadow-3xs">
                Tidak ada program yang memenuhi kriteria filter saat ini.
              </div>
            ) : (
              filteredPrograms.map((item) => {
                const isExpanded = !!expandedCards[item.id];
                
                // Color mapping for Status Tracker
                const statusColor = 
                  item.statusTracker === "Green" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  item.statusTracker === "Yellow" ? "bg-amber-50 text-amber-700 border-amber-200" :
                  item.statusTracker === "Red" ? "bg-rose-50 text-rose-700 border-rose-200" :
                  item.statusTracker === "Blocked" ? "bg-slate-100 text-slate-700 border-slate-300" :
                  "bg-slate-50 text-slate-500 border-slate-200";

                const leftStripColor = 
                  item.statusTracker === "Green" ? "border-l-emerald-500" :
                  item.statusTracker === "Yellow" ? "border-l-amber-500" :
                  item.statusTracker === "Red" ? "border-l-rose-500" :
                  item.statusTracker === "Blocked" ? "border-l-slate-400" :
                  "border-l-slate-300";

                // Color mapping for priority
                const priorityColor = 
                  item.priority === "Critical" ? "bg-red-50 text-red-700 border-red-200" :
                  item.priority === "High" ? "bg-orange-50 text-orange-700 border-orange-200" :
                  item.priority === "Medium" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-slate-50 text-slate-600 border-slate-200";

                // Color mapping for Confidence
                const confidenceColor = 
                  item.confidence === "High" ? "bg-emerald-50 text-emerald-700 border-emerald-150" :
                  item.confidence === "Medium" ? "bg-blue-50 text-blue-700 border-blue-150" :
                  item.confidence === "Low" ? "bg-amber-50 text-amber-700 border-amber-150" :
                  "bg-rose-50 text-rose-700 border-rose-150";

                return (
                  <div 
                    key={item.id} 
                    className={`bg-white border-y border-r border-slate-200 border-l-[5px] ${leftStripColor} rounded-xl shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between overflow-hidden group min-h-[220px]`}
                  >
                    {/* Card Header Section */}
                    <div className="p-4 border-b border-slate-100 bg-slate-50/45 flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold bg-[#1e266f]/10 text-[#1e266f] px-2.5 py-1 rounded-md border border-[#1e266f]/10 shadow-3xs uppercase tracking-wider">
                          INITIATIVE #{item.no}
                        </span>
                        
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${statusColor}`}>
                            {item.statusTracker || "-"}
                          </span>
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded border ${priorityColor}`}>
                            {item.priority === "Critical" ? "P1 (Critical)" : item.priority === "High" ? "P2 (High)" : item.priority === "Medium" ? "P3 (Medium)" : "P4 (Low)"}
                          </span>
                        </div>
                      </div>

                      {/* Main Title / Topic (Toggles details on click) */}
                      <h4 
                        onClick={() => toggleCard(item.id)}
                        className="text-[13px] font-bold text-[#1e266f] hover:text-[#f36e21] transition-colors leading-snug cursor-pointer mt-1 flex items-start gap-1"
                        title="Klik untuk membuka/menutup detail lengkap"
                      >
                        <span>{item.topic}</span>
                      </h4>

                      {/* Summary Tags */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                        <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <User className="w-2.5 h-2.5 text-[#1e266f]" />
                          Owner: <strong className="text-slate-850 font-bold">{item.owner}</strong>
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600 bg-white border border-slate-200/80 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Layers className="w-2.5 h-2.5 text-[#f36e21]" />
                          Phase: <strong className="text-slate-850 font-bold">{item.phase}</strong>
                        </span>
                        {item.request && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                            item.request === "From DZ" 
                              ? "bg-amber-50 text-amber-700 border border-amber-200" 
                              : "bg-slate-50 text-slate-600 bg-white border border-slate-200/80"
                          }`}>
                            <HelpCircle className="w-2.5 h-2.5 text-[#1e266f]" />
                            Request: <strong className="font-bold">{item.request}</strong>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Content Stage */}
                    <div className="p-4 space-y-4 flex-1 flex flex-col justify-between">
                      {/* Progress Slider block */}
                      <div className="bg-slate-50/50 rounded-lg p-3 border border-slate-100">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            <TrendingUp className="w-3 h-3 text-indigo-500" />
                            Progress
                          </span>
                          <span className="text-[11.5px] font-mono font-bold text-slate-850 bg-white border border-slate-200 px-2 py-0.5 rounded shadow-3xs">
                            {item.progress}%
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={item.progress}
                            onChange={(e) => onInlineUpdate?.(item.id, { progress: Number(e.target.value) })}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#1e266f]"
                          />
                        </div>
                      </div>

                      {/* Main Collapsible Details Block */}
                      {isExpanded ? (
                        <div className="pt-3 border-t border-slate-100 space-y-4 animate-fade-in text-xs text-slate-600">
                          
                          {/* Segment 1: General Specs */}
                          <div className="space-y-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📄 Detail Strategis & PIC</span>
                            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200/70">
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Cluster</span>
                                <span className="font-semibold text-slate-800 text-[11px] leading-tight block mt-0.5">{item.cluster}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">ZT Role</span>
                                <span className="font-semibold text-slate-800 text-[11px] leading-tight block mt-0.5">{item.ztRole || "-"}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">ZT PIC</span>
                                <span className="font-semibold text-slate-800 text-[11px] leading-tight block mt-0.5">{item.ztPic || "-"}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Confidence</span>
                                <span className={`inline-block text-[9.5px] font-bold px-1.5 py-0.5 rounded border mt-0.5 ${confidenceColor}`}>
                                  {item.confidence || "Medium"}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Strategic Fit</span>
                                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{item.strategicFit || "Medium"}</span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Deadline</span>
                                <span className="font-mono font-bold text-slate-800 text-[11px] flex items-center gap-1 mt-0.5">
                                  <Calendar className="w-3 h-3 text-rose-500 shrink-0" />
                                  {item.deadline || "-"}
                                </span>
                              </div>
                              <div>
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Request</span>
                                <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">{item.request || "-"}</span>
                              </div>
                            </div>
                            
                            {item.strategicImpact && (
                              <div className="bg-indigo-50/20 border border-indigo-100 p-2.5 rounded-lg text-[11px] mt-1.5">
                                <span className="block text-[8px] font-mono font-bold text-indigo-500 uppercase">Strategic Impact</span>
                                <p className="text-slate-700 leading-snug font-medium mt-0.5">{item.strategicImpact}</p>
                              </div>
                            )}
                          </div>

                          {/* Segment 2: Milestone & Recommendation */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🎯 Milestone & Rekomendasi</span>
                            
                            <div className="space-y-1.5">
                              <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-lg">
                                <span className="block text-[8px] font-mono font-bold text-slate-400 uppercase">Milestone Terbaru</span>
                                <p className="text-slate-700 text-[11px] leading-snug font-medium mt-0.5">
                                  {item.currentMilestone || "Tidak ada detail milestone."}
                                </p>
                              </div>

                              <div className="bg-indigo-50/20 border border-indigo-100/80 p-2.5 rounded-lg">
                                <span className="block text-[8px] font-mono font-bold text-indigo-600 uppercase">ZT Rekomendasi / Tindak Lanjut</span>
                                <p className="text-indigo-950 text-[11px] leading-snug font-semibold mt-0.5">
                                  {item.actionPlan || "Tidak ada rekomendasi."}
                                </p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-1">
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500">Decision Needed:</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.decisionNeeded === "Yes" ? "bg-amber-100 text-amber-850" : "bg-slate-150 text-slate-600"}`}>
                                  {item.decisionNeeded || "No"}
                                </span>
                              </div>
                              <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex items-center justify-between">
                                <span className="text-[9px] font-bold text-slate-500">DZ Intervention:</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${item.dzIntervention === "Yes" ? "bg-rose-100 text-rose-850 border border-rose-200" : "bg-slate-150 text-slate-600"}`}>
                                  {item.dzIntervention || "No"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Segment 3: Risks & Obstacles */}
                          {(item.riskIssue || item.keyIssue) && (
                            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                              <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Risiko & Hambatan
                              </span>

                              {item.keyIssue && (
                                <div className="p-2.5 bg-rose-50/20 border border-rose-100 rounded-lg">
                                  <span className="block text-[8px] font-mono font-bold text-rose-500 uppercase">Isu Utama / Kendala</span>
                                  <p className="font-semibold text-rose-950 text-[11px] leading-snug mt-0.5">
                                    {item.keyIssue}
                                  </p>
                                </div>
                              )}

                              {item.riskIssue && (
                                <div className="bg-amber-50/20 border border-amber-150 p-2.5 rounded-lg space-y-1.5">
                                  <div className="flex justify-between items-center text-[9px] text-slate-500 pb-1 border-b border-amber-100/50">
                                    <span>Tipe: <strong className="text-slate-800">{item.riskType || "-"}</strong></span>
                                    <span>Skor: <strong className="font-mono text-rose-700">{item.riskLevelScore} ({item.riskLevel})</strong></span>
                                  </div>
                                  <p className="text-slate-700 font-semibold text-[11px] leading-snug">{item.riskIssue}</p>
                                  {item.riskMitigation && (
                                    <p className="text-[10px] text-slate-500 bg-white border border-slate-200 p-1.5 rounded mt-1.5 leading-snug">
                                      <strong className="text-emerald-700">Mitigasi:</strong> {item.riskMitigation}
                                    </p>
                                  )}
                                  {item.riskEscalationTo && (
                                    <div className="text-[9.5px] text-indigo-700">
                                      Eskalasi ke: <strong>{item.riskEscalationTo}</strong>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Segment 4: Attachments */}
                          {((item.files && item.files.length > 0) || item.documentLink) && (
                            <div className="space-y-1.5 border-t border-slate-100 pt-3">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📎 Dokumen Pendukung & Link</span>
                              
                              {item.documentLink && (
                                <a 
                                  href={item.documentLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-bold bg-indigo-50 hover:bg-indigo-100/60 px-2 py-1 rounded border border-indigo-150 text-[10px] transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Kunjungi Tautan Dokumen
                                </a>
                              )}

                              {item.files && item.files.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-1">
                                  {item.files.map((file, idx) => (
                                    <a
                                      key={idx}
                                      href={file.dataUrl}
                                      download={file.name}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] border border-slate-200 font-mono font-medium truncate max-w-[200px]"
                                      title={`Unduh ${file.name}`}
                                    >
                                      <Paperclip className="w-3 h-3 text-[#1e266f] shrink-0" />
                                      <span className="truncate">{file.name}</span>
                                    </a>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Segment 5: Notes */}
                          {item.notes && (
                            <div className="pt-2.5 border-t border-slate-100 bg-slate-50 p-2 rounded text-[10px] text-slate-500 italic">
                              <strong>Komentar:</strong> {item.notes}
                            </div>
                          )}

                        </div>
                      ) : (
                        /* Click to Expand Banner inside Collapsed Card */
                        <div 
                          onClick={() => toggleCard(item.id)}
                          className="py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-lg text-center text-[10px] font-semibold cursor-pointer border border-slate-150 transition-colors flex items-center justify-center gap-1 select-none"
                        >
                          <span>Lihat Detail Program Selengkapnya</span>
                          <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      )}

                      {/* Action Button Row */}
                      <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                        {(currentUser?.role === "ADMIN" || currentUser?.role === "TEAM_INTERNAL") ? (
                          <button
                            type="button"
                            onClick={() => onEditProgramClick(item)}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-indigo-100 shadow-3xs"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Ubah Detail
                          </button>
                        ) : (
                          <div /> // Spacer if not allowed
                        )}

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onUpdateProgressClick(item)}
                            className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100/60 px-3 py-1.5 rounded-lg transition-colors cursor-pointer border border-orange-100 shadow-3xs"
                          >
                            <FileCheck2 className="w-3.5 h-3.5" />
                            MoM Log
                          </button>

                          <button
                            type="button"
                            onClick={() => toggleCard(item.id)}
                            className="flex items-center gap-1 p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg border border-transparent hover:border-indigo-100 transition-all cursor-pointer"
                            title={isExpanded ? "Sembunyikan Detail" : "Tampilkan Detail"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-indigo-600" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer info stats */}
        <div className="bg-slate-50 border-t border-slate-200 p-3 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-[10.5px] text-slate-500 font-mono">
          <span>Menampilkan <strong>{filteredPrograms.length}</strong> dari total <strong>{programs.length}</strong> pekerjaan terdaftar</span>
          <div className="flex flex-wrap items-center gap-4">
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-100 rounded border border-emerald-300"></span> Green: Sehat</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-100 rounded border border-amber-300"></span> Yellow: Perhatian</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-rose-105 bg-rose-100 rounded border border-rose-300"></span> Red: Intervensi</span>
            <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-slate-100 rounded border border-slate-300"></span> Blocked: Terhambat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
