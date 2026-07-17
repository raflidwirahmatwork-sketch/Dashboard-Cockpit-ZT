import { useMemo, useState } from "react";
import { ProgramJob, MeetingLog, UserAccount } from "../types";
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend 
} from "recharts";
import { 
  PlusCircle, 
  TrendingUp, 
  Activity, 
  AlertTriangle, 
  Flame, 
  Lock, 
  CheckCircle2,
  X
} from "lucide-react";

interface DashboardViewProps {
  programs: ProgramJob[];
  logs?: MeetingLog[];
  onAddClick: () => void;
  onEditProgramClick?: (program: ProgramJob) => void;
  onUpdateProgressClick?: (program: ProgramJob) => void;
  currentUser?: UserAccount | null;
}

export default function DashboardView({ 
  programs: rawPrograms, 
  logs, 
  onAddClick, 
  onEditProgramClick,
  onUpdateProgressClick,
  currentUser
}: DashboardViewProps) {
  const [selectedCell, setSelectedCell] = useState<{ probability: number; impact: number } | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [onlyMyPrograms, setOnlyMyPrograms] = useState(false);

  // Dynamically shadow rawPrograms if "Only My Programs" filter is toggled by a PROGRAM_OWNER
  const programs = useMemo(() => {
    if (onlyMyPrograms && currentUser && currentUser.ownerName) {
      const code = currentUser.ownerName.toUpperCase();
      return rawPrograms.filter(p => 
        (p.owner || "").split(",").map(o => o.trim().toUpperCase()).includes(code) ||
        (p.ztPic || "").toUpperCase() === code
      );
    }
    return rawPrograms;
  }, [rawPrograms, onlyMyPrograms, currentUser]);


  // Calculate actual last updated timestamp dynamically based on latest date in programs or logs
  const lastUpdatedText = useMemo(() => {
    const dates: Date[] = [];
    
    // Parse programs' updatedAt fields
    programs.forEach(p => {
      if (p.updatedAt) {
        const normalized = p.updatedAt.replace(' ', 'T');
        const d = new Date(normalized);
        if (!isNaN(d.getTime())) dates.push(d);
      }
    });

    // Parse logs' meetingDate fields
    if (logs) {
      logs.forEach(l => {
        if (l.meetingDate) {
          const normalized = l.meetingDate.replace(' ', 'T');
          const d = new Date(normalized);
          if (!isNaN(d.getTime())) dates.push(d);
        }
      });
    }

    if (dates.length > 0) {
      const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
      const yyyy = maxDate.getFullYear();
      const mm = String(maxDate.getMonth() + 1).padStart(2, "0");
      const dd = String(maxDate.getDate()).padStart(2, "0");
      const hh = String(maxDate.getHours()).padStart(2, "0");
      const min = String(maxDate.getMinutes()).padStart(2, "0");
      
      const today = new Date();
      const isToday = today.getFullYear() === yyyy && (today.getMonth() + 1) === Number(mm) && today.getDate() === Number(dd);
      
      return `${isToday ? "Hari Ini" : `${yyyy}-${mm}-${dd}`} ${hh}:${min}`;
    }

    return "2026-06-21 09:00";
  }, [programs, logs]);

  const getProgramCoordinates = (p: ProgramJob) => {
    // Determine coordinate based on the actual Section 3: Risk Issue fields
    let impact = p.riskImpact || 0;
    let probability = p.riskProbability || 0;

    // Fallback if not populated
    if (!impact || !probability) {
      const level = p.riskLevel || p.priority || "Medium";
      if (level === "Critical") {
        impact = 4;
        probability = 4;
      } else if (level === "High") {
        impact = 3;
        probability = 4;
      } else if (level === "Medium") {
        impact = 3;
        probability = 3;
      } else if (level === "Low") {
        impact = 2;
        probability = 2;
      } else {
        impact = 2;
        probability = 2;
      }
    }

    // Clamp values strictly between 1 and 4
    impact = Math.max(1, Math.min(4, impact));
    probability = Math.max(1, Math.min(4, probability));

    return { probability, impact };
  };

  const selectedCellPrograms = useMemo(() => {
    if (!selectedCell) return [];
    return programs.filter(p => {
      const coords = getProgramCoordinates(p);
      return coords.probability === selectedCell.probability && coords.impact === selectedCell.impact;
    });
  }, [programs, selectedCell]);

  const selectedMetricPrograms = useMemo(() => {
    if (!selectedMetric) return [];
    
    const clusters = [
      "Strategic Transformation",
      "Corporate Culture",
      "Change Management",
      "Investment Governance",
      "Corporate Insight"
    ];
    if (clusters.includes(selectedMetric)) {
      return programs.filter(p => p.cluster === selectedMetric);
    }

    switch (selectedMetric) {
      case "total":
        return programs;
      case "green":
        return programs.filter(p => p.statusTracker === "Green");
      case "yellow":
        return programs.filter(p => p.statusTracker === "Yellow");
      case "red_blocked":
        return programs.filter(p => p.statusTracker === "Red" || p.statusTracker === "Blocked");
      case "decisionPending":
        return programs.filter(p => p.decisionNeeded === "Yes");
      default:
        return [];
    }
  }, [programs, selectedMetric]);

  const getMetricLabel = (metric: string) => {
    switch (metric) {
      case "total": return "Semua Program Initiatives (Total Initiatives)";
      case "green": return "Program dengan Status Aman / On Track (Green)";
      case "yellow": return "Program dengan Kendala Ringan / At Risk (Yellow)";
      case "red_blocked": return "Program dengan Status Kritis (Red + Blocked)";
      case "decisionPending": return "Program Memerlukan Keputusan (Decision Pending)";
      default: return `Daftar Program Cluster: ${metric}`;
    }
  };

  const handleMetricCardClick = (metricName: string) => {
    setSelectedMetric(prev => prev === metricName ? null : metricName);
    // Auto-scroll to selected metric table for smooth UX
    setTimeout(() => {
      const element = document.getElementById("selected-category-section");
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }, 100);
  };

  
  // 1. Core Summary Metrics
  const metrics = useMemo(() => {
    const total = programs.length;
    const green = programs.filter(p => p.statusTracker === "Green").length;
    const yellow = programs.filter(p => p.statusTracker === "Yellow").length;
    const red = programs.filter(p => p.statusTracker === "Red").length;
    const blocked = programs.filter(p => p.statusTracker === "Blocked").length;
    
    const decisionPending = programs.filter(p => p.decisionNeeded === "Yes").length;

    // Health Index Calculation
    const totalWeighted = (green * 100) + (yellow * 70) + (red * 35) + (blocked * 0);
    const healthIndex = total > 0 ? Math.round(totalWeighted / total) : 0;

    return {
      total,
      green,
      yellow,
      redAndBlocked: red + blocked,
      decisionPending,
      healthIndex
    };
  }, [programs]);

  // 2. Portfolio Status by Cluster
  const clusterStats = useMemo(() => {
    const clusters: ProgramJob["cluster"][] = [
      "Strategic Transformation",
      "Corporate Culture",
      "Change Management",
      "Investment Governance",
      "Corporate Insight"
    ];

    return clusters.map(c => {
      const clusterPrograms = programs.filter(p => p.cluster === c);
      const total = clusterPrograms.length;
      const green = clusterPrograms.filter(p => p.statusTracker === "Green").length;
      const yellow = clusterPrograms.filter(p => p.statusTracker === "Yellow").length;
      const red = clusterPrograms.filter(p => p.statusTracker === "Red").length;
      const blocked = clusterPrograms.filter(p => p.statusTracker === "Blocked").length;
      
      const avgProgress = total > 0 
        ? Math.round(clusterPrograms.reduce((acc, curr) => acc + (curr.progress || 0), 0) / total) 
        : 0;
        
      const criticalOrHigh = clusterPrograms.filter(p => p.priority === "Critical" || p.priority === "High").length;
      const dzIntervention = clusterPrograms.filter(p => p.dzIntervention && p.dzIntervention !== "None" && p.dzIntervention !== "").length;

      return {
        name: c,
        total,
        green,
        yellow,
        red,
        blocked,
        avgProgress,
        criticalOrHigh,
        dzIntervention
      };
    });
  }, [programs]);

  // 3. Top Execution Issues & Decision Needed for DZ (Priority sorted from Critical, High, Medium, to Low)
  const topIssues = useMemo(() => {
    const priorityOrder: Record<string, number> = {
      "Critical": 1,
      "High": 2,
      "Medium": 3,
      "Low": 4
    };

    return [...programs]
      .filter(p => p.priority === "Critical" || p.priority === "High" || p.decisionNeeded === "Yes")
      .sort((a, b) => {
        const scoreA = priorityOrder[a.priority] || 99;
        const scoreB = priorityOrder[b.priority] || 99;
        return scoreA - scoreB;
      })
      .slice(0, 5); // display top 5 prioritized issues
  }, [programs]);

  // 5. Risk Heatmap Calculations
  // We place programs on standard 4x4 heatmap (Probability x Impact) based on their real risk level & status in the program tracker
  const heatmapData = useMemo(() => {
    const grid = Array(4).fill(null).map(() => Array(4).fill(0));
    
    programs.forEach(p => {
      const { probability, impact } = getProgramCoordinates(p);
      // Adjust coordinate scale to index (0 to 3)
      grid[4 - probability][impact - 1] += 1;
    });

    return grid;
  }, [programs]);

  return (
    <div className="space-y-6">

      {/* Role-based Welcoming and Personal Filtering Banner */}
      {currentUser && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm bg-gradient-to-r from-white via-white to-slate-50">
          <div className="flex items-center gap-3 self-start sm:self-center">
            <div className="p-2.5 bg-[#1e266f]/5 text-[#1e266f] rounded-xl border border-[#1e266f]/10">
              <Activity className="w-5 h-5 text-[#f36e21]" />
            </div>
            <div>
              <div className="text-[10px] text-slate-400 font-mono font-bold uppercase tracking-wider">Identitas Hak Akses</div>
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>{currentUser.name || currentUser.roleName}</span>
                <span className="text-[10px] bg-[#1e266f] text-white px-2 py-0.5 rounded-full font-mono font-normal">
                  {currentUser.role}
                </span>
              </h3>
              {currentUser.name && <p className="text-xs text-slate-500 mt-0.5">{currentUser.roleName}</p>}
            </div>
          </div>

          {currentUser.role === "TEAM_INTERNAL" && currentUser.ownerName && (
            <div className="flex items-center gap-3 bg-[#f36e21]/5 px-3 py-2 rounded-xl border border-[#f36e21]/15 self-end sm:self-center">
              <span className="text-xs font-bold text-[#1e266f]">Filter Program Saya ({currentUser.ownerName}):</span>
              <button
                type="button"
                onClick={() => setOnlyMyPrograms(!onlyMyPrograms)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  onlyMyPrograms ? "bg-[#f36e21]" : "bg-slate-250"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition duration-200 ease-in-out ${
                    onlyMyPrograms ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
              <span className="text-[10px] font-black uppercase text-slate-500 font-mono w-10">
                {onlyMyPrograms ? "AKTIF" : "OFF"}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* 1. Key Executive Badges/Cards (Responsive Layout) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        
        <div 
          onClick={() => handleMetricCardClick("total")}
          className={`cursor-pointer transition-all duration-200 active:scale-95 bg-slate-900 text-white rounded-lg p-2 sm:p-3 border flex flex-col justify-between shadow-sm min-h-[80px] sm:min-h-[92px] hover:bg-slate-850 hover:border-slate-700 ${
            selectedMetric === "total" ? "ring-2 ring-slate-900 ring-offset-2 scale-[1.03]" : "border-slate-800"
          }`}
        >
          <span className="text-[9px] sm:text-[10px] text-slate-400 uppercase tracking-wider font-mono font-bold block">
            Total Initiatives
          </span>
          <span className="text-lg sm:text-2xl font-black font-sans my-0.5 sm:my-1 block text-center">
            {metrics.total}
          </span>
          <div className="text-[8px] sm:text-[9px] text-slate-400 mt-auto text-center border-t border-slate-800 pt-1">
            Transformasi Strategis
          </div>
        </div>

        <div 
          onClick={() => handleMetricCardClick("green")}
          className={`cursor-pointer transition-all duration-200 active:scale-95 bg-emerald-50 text-emerald-900 rounded-lg p-2 sm:p-3 border flex flex-col justify-between shadow-sm min-h-[80px] sm:min-h-[92px] hover:bg-emerald-100 hover:border-emerald-300 ${
            selectedMetric === "green" ? "ring-2 ring-emerald-600 ring-offset-2 scale-[1.03]" : "border-emerald-100"
          }`}
        >
          <span className="text-[9px] sm:text-[10px] text-emerald-700 uppercase tracking-wider font-mono font-bold block">
            On Track / Green
          </span>
          <span className="text-lg sm:text-2xl font-black font-sans my-0.5 sm:my-1 block text-center text-emerald-600">
            {metrics.green}
          </span>
          <div className="text-[8px] sm:text-[9px] text-emerald-700 mt-auto text-center border-t border-emerald-100 pt-1">
            Status Berjalan Sehat
          </div>
        </div>

        <div 
          onClick={() => handleMetricCardClick("yellow")}
          className={`cursor-pointer transition-all duration-200 active:scale-95 bg-amber-50 text-amber-900 rounded-lg p-2 sm:p-3 border flex flex-col justify-between shadow-sm min-h-[80px] sm:min-h-[92px] hover:bg-amber-100/80 hover:border-amber-300 ${
            selectedMetric === "yellow" ? "ring-2 ring-amber-500 ring-offset-2 scale-[1.03]" : "border-amber-100"
          }`}
        >
          <span className="text-[9px] sm:text-[10px] text-amber-700 uppercase tracking-wider font-mono font-bold block">
            At Risk / Yellow
          </span>
          <span className="text-lg sm:text-2xl font-black font-sans my-0.5 sm:my-1 block text-center text-amber-600">
            {metrics.yellow}
          </span>
          <div className="text-[8px] sm:text-[9px] text-amber-700 mt-auto text-center border-t border-amber-100 pt-1">
            Terdapat Kendala Ringan
          </div>
        </div>

        <div 
          onClick={() => handleMetricCardClick("red_blocked")}
          className={`cursor-pointer transition-all duration-200 active:scale-95 bg-rose-50 text-rose-900 rounded-lg p-2 sm:p-3 border flex flex-col justify-between shadow-sm min-h-[80px] sm:min-h-[92px] hover:bg-rose-100 hover:border-rose-250 ${
            selectedMetric === "red_blocked" ? "ring-2 ring-rose-500 ring-offset-2 scale-[1.03]" : "border-rose-150"
          }`}
        >
          <span className="text-[9px] sm:text-[10px] text-rose-700 uppercase tracking-wider font-mono font-bold block">
            BLOCKED + RED
          </span>
          <span className="text-lg sm:text-2xl font-black font-sans my-0.5 sm:my-1 block text-center text-rose-600">
            {metrics.redAndBlocked}
          </span>
          <div className="text-[8px] sm:text-[9px] text-rose-700 mt-auto text-center border-t border-rose-100 pt-1">
            Perlu Intervensi Segera
          </div>
        </div>

        <div 
          onClick={() => handleMetricCardClick("decisionPending")}
          className={`cursor-pointer transition-all duration-200 active:scale-95 bg-slate-50 text-slate-900 rounded-lg p-2 sm:p-3 border flex flex-col justify-between shadow-sm min-h-[80px] sm:min-h-[92px] hover:bg-slate-100 hover:border-slate-300 col-span-2 sm:col-span-1 ${
            selectedMetric === "decisionPending" ? "ring-2 ring-slate-800 ring-offset-2 scale-[1.03]" : "border-slate-200"
          }`}
        >
          <span className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-wider font-mono font-bold block">
            Decision Pending
          </span>
          <span className="text-lg sm:text-2xl font-black font-sans my-0.5 sm:my-1 block text-center text-slate-800">
            {metrics.decisionPending}
          </span>
          <div className="text-[8px] sm:text-[9px] text-slate-500 mt-auto text-center border-t border-slate-200 pt-1">
            Butuh Keputusan DZ
          </div>
        </div>

      </div>



      {/* 2. Top Execution Issues Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-red-500 animate-pulse flex-shrink-0" />
            <h3 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wider leading-relaxed">
              Top Execution Issues & Decision Required For DZ (Klik baris untuk Detail)
            </h3>
          </div>
          <span className="text-[10px] bg-red-50 text-red-700 font-mono font-bold px-2 py-0.5 rounded self-start sm:self-auto shrink-0">
            Escalation Needed
          </span>
        </div>
        
        <div className="overflow-x-auto">
          {topIssues.length === 0 ? (
            <p className="text-slate-400 text-xs py-4 text-center font-mono">
              Tidak ada isu mendesak berprioritas Kritikal/Tinggi saat ini.
            </p>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <table className="w-full text-left text-xs font-sans min-w-[800px]">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 font-mono text-slate-500 font-bold">
                      <th className="py-2 px-3 w-20">Priority</th>
                      <th className="py-2 px-3 w-40 bg-indigo-50/50 text-indigo-900 font-bold border-r border-indigo-100/30">Topic</th>
                      <th className="py-2 px-3">Issue</th>
                      <th className="py-2 px-3">Impact</th>
                      <th className="py-2 px-3">ZT Recommendation</th>
                      <th className="py-2 px-3">Clear the Path</th>
                      <th className="py-2 px-3 w-28">Deadline</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150 divide-slate-200">
                    {topIssues.map((issue) => (
                      <tr 
                        key={issue.id} 
                        onClick={() => (onUpdateProgressClick || onEditProgramClick)?.(issue)}
                        className="hover:bg-slate-100 cursor-pointer transition-colors"
                        title="Klik untuk melihat detail lengkap program"
                      >
                        <td className="py-3 px-3">
                          <span className="px-2 py-1 rounded text-[10px] font-bold block text-center border font-sans"
                            style={{
                              backgroundColor: 
                                issue.priority === "Critical" ? "#fef2f2" : 
                                issue.priority === "High" ? "#fff7ed" : 
                                issue.priority === "Medium" ? "#eff6ff" : "#f8fafc",
                              color: 
                                issue.priority === "Critical" ? "#b91c1c" : 
                                issue.priority === "High" ? "#c2410c" : 
                                issue.priority === "Medium" ? "#1d4ed8" : "#475569",
                              borderColor: 
                                issue.priority === "Critical" ? "#fecaca" : 
                                issue.priority === "High" ? "#fed7aa" : 
                                issue.priority === "Medium" ? "#bfdbfe" : "#e2e8f0"
                            }}
                          >
                            {issue.priority === "Critical" ? "P1 (Critical)" : 
                             issue.priority === "High" ? "P2 (High)" : 
                             issue.priority === "Medium" ? "P3 (Medium)" : 
                             issue.priority === "Low" ? "P4 (Low)" : (issue.priority || "P3 (Medium)")}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-bold text-[#1e266f] bg-indigo-50/30 border-r border-indigo-100/30">{issue.topic}</td>
                        <td className="py-3 px-3 text-slate-700">{issue.keyIssue || "N/A"}</td>
                        <td className="py-3 px-3 text-slate-600 text-[11px] leading-relaxed">{issue.strategicImpact}</td>
                        <td className="py-3 px-3 text-slate-700">{issue.actionPlan || "N/A"}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">{issue.clearThePath || "None"}</td>
                        <td className="py-3 px-3 font-mono text-slate-650 font-bold">{issue.deadline}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="grid grid-cols-1 gap-4 md:hidden pb-2">
                {topIssues.map((issue) => {
                  const isCritical = issue.priority === "Critical";
                  const isHigh = issue.priority === "High";
                  const isMedium = issue.priority === "Medium";
                  const priorityBg = 
                    isCritical ? "bg-red-50 text-red-700 border-red-200" : 
                    isHigh ? "bg-orange-50 text-orange-700 border-orange-200" :
                    isMedium ? "bg-blue-50 text-blue-700 border-blue-200" :
                    "bg-slate-50 text-slate-500 border-slate-200";
                  const priorityLabel = 
                    issue.priority === "Critical" ? "P1 (Critical)" :
                    issue.priority === "High" ? "P2 (High)" :
                    issue.priority === "Medium" ? "P3 (Medium)" :
                    issue.priority === "Low" ? "P4 (Low)" : (issue.priority || "P3 (Medium)");
                  
                  return (
                    <div 
                      key={issue.id}
                      onClick={() => (onUpdateProgressClick || onEditProgramClick)?.(issue)}
                      className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-3xs hover:shadow-2xs transition-all active:scale-[0.98] cursor-pointer flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${priorityBg}`}>
                          {priorityLabel}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          Deadline: <strong className="text-slate-700">{issue.deadline || "-"}</strong>
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1e266f] leading-snug">
                          {issue.topic}
                        </h4>
                        <span className="inline-block text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/50 px-2 py-0.5 rounded uppercase tracking-wider">
                          {issue.cluster}
                        </span>
                      </div>

                      <div className="space-y-2.5 pt-1.5 border-t border-slate-100 text-[11px] text-slate-600">
                        <div>
                          <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Isu Utama</span>
                          <p className="bg-slate-50 p-2.5 rounded border border-slate-100 font-medium text-slate-700 leading-relaxed">
                            {issue.keyIssue || "N/A"}
                          </p>
                        </div>

                        {issue.strategicImpact && (
                          <div>
                            <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Dampak Strategis</span>
                            <p className="text-slate-600 leading-relaxed font-normal">
                              {issue.strategicImpact}
                            </p>
                          </div>
                        )}

                        <div>
                          <span className="block text-[8.5px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Rekomendasi ZT</span>
                          <p className="bg-indigo-50/20 text-indigo-950 p-2.5 rounded border border-indigo-100/50 font-medium leading-relaxed">
                            {issue.actionPlan || "N/A"}
                          </p>
                        </div>

                        {issue.clearThePath && (
                          <div className="bg-rose-50/20 border border-rose-100/50 p-2.5 rounded">
                            <span className="block text-[8.5px] font-bold text-rose-600 uppercase tracking-wider mb-0.5">Clear the Path (DZ Decision Needed)</span>
                            <p className="font-bold text-slate-850 leading-relaxed text-slate-900">
                              {issue.clearThePath}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="pt-2.5 border-t border-slate-150 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>Owner: <strong className="text-slate-600">{issue.owner}</strong></span>
                        <span className="text-indigo-600 font-bold hover:underline">Ketuk untuk Detail &rarr;</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Selected Risk Heatmap Details Table */}
      {selectedCell && (
        <div className="bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs transition-all duration-300">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1e266f]"></span>
              <div>
                <h3 className="text-xs font-bold font-sans text-slate-850 uppercase tracking-wider">
                  Detail Program Risiko: Probabilitas {selectedCell.probability} & Dampak {selectedCell.impact}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ditemukan {selectedCellPrograms.length} program pada sel koordinat ini
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedCell(null)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedCellPrograms.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-mono">
              Tidak ada program yang berada di koordinat risiko ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans min-w-[750px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200/80 font-mono text-slate-500 font-bold">
                    <th className="py-2 px-3 w-12 text-center">No</th>
                    <th className="py-2 px-3 bg-indigo-50/50 text-indigo-900 font-bold border-r border-indigo-100/30">Topic</th>
                    <th className="py-2 px-3">Cluster</th>
                    <th className="py-2 px-3">Owner / PIC</th>
                    <th className="py-2 px-3">Phase</th>
                    <th className="py-2 px-3 text-center">Progress</th>
                    <th className="py-2 px-3 text-center">Status</th>
                    <th className="py-2 px-3 text-center">Priority</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedCellPrograms.map((item, index) => {
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => (onUpdateProgressClick || onEditProgramClick)?.(item)}
                        className="hover:bg-slate-100 cursor-pointer transition-colors"
                        title="Klik untuk melihat detail lengkap program"
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">{index + 1}</td>
                        <td className="py-3 px-3 font-bold text-[#1e266f] bg-indigo-50/30 border-r border-indigo-100/30">{item.topic}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{item.cluster}</td>
                        <td className="py-3 px-3 text-slate-500">{item.owner}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/50">
                            {item.phase}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-1.5 hidden md:block">
                              <div className="bg-[#1e266f] h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                            </div>
                            <span className="font-mono text-[10px] font-bold text-slate-700">
                              {item.progress}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block`}
                            style={{
                              backgroundColor: item.statusTracker === "Green" ? "#ecfdf5" : item.statusTracker === "Yellow" ? "#fffbeb" : item.statusTracker === "Red" ? "#fef2f2" : "#f1f5f9",
                              color: item.statusTracker === "Green" ? "#047857" : item.statusTracker === "Yellow" ? "#b45309" : item.statusTracker === "Red" ? "#b91c1c" : "#475569"
                            }}
                          >
                            {item.statusTracker}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold inline-block border`}
                            style={{
                              backgroundColor: 
                                item.priority === "Critical" ? "#fef2f2" : 
                                item.priority === "High" ? "#fff7ed" : 
                                item.priority === "Medium" ? "#eff6ff" : "#f8fafc",
                              color: 
                                item.priority === "Critical" ? "#b91c1c" : 
                                item.priority === "High" ? "#c2410c" : 
                                item.priority === "Medium" ? "#1d4ed8" : "#475569",
                              borderColor: 
                                item.priority === "Critical" ? "#fecaca" : 
                                item.priority === "High" ? "#fed7aa" : 
                                item.priority === "Medium" ? "#bfdbfe" : "#e2e8f0"
                            }}
                          >
                            {item.priority === "Critical" ? "P1 (Critical)" : 
                             item.priority === "High" ? "P2 (High)" : 
                             item.priority === "Medium" ? "P3 (Medium)" : 
                             item.priority === "Low" ? "P4 (Low)" : (item.priority || "P3 (Medium)")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Selected Metric Details Table */}
      {selectedMetric && (
        <div id="selected-category-section" className="bg-white rounded-xl border border-indigo-200/85 p-4 sm:p-5 shadow-sm transition-all duration-300 animate-in fade-in-50 duration-200">
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3 mb-4">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse"></span>
              <div>
                <h3 className="text-xs font-bold font-sans text-indigo-950 uppercase tracking-wider">
                  {getMetricLabel(selectedMetric)}
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Ditemukan {selectedMetricPrograms.length} program pada kategori ini (Klik baris untuk Detail Lengkap)
                </p>
              </div>
            </div>
            <button 
              onClick={() => setSelectedMetric(null)}
              className="p-1.5 hover:bg-slate-100 rounded-full transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {selectedMetricPrograms.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs font-mono">
              Tidak ada program yang berada di kategori ini.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-sans min-w-[850px]">
                <thead>
                  <tr className="bg-indigo-50/50 border-b border-indigo-100 font-mono text-indigo-900/80 font-bold">
                    <th className="py-2.5 px-3 w-12 text-center">No</th>
                    <th className="py-2.5 px-3 bg-indigo-50/50 text-indigo-900 font-bold border-r border-indigo-100/30">Topic</th>
                    <th className="py-2.5 px-3">Cluster</th>
                    <th className="py-2.5 px-3">Unit Owner</th>
                    <th className="py-2.5 px-3">Phase</th>
                    
                    {/* Dynamic Headers based on selected metric */}
                    {selectedMetric === "decisionPending" ? (
                      <>
                        <th className="py-2.5 px-3 text-center">Decision Needed</th>
                        <th className="py-2.5 px-3">Key Issue & Decision Required</th>
                        <th className="py-2.5 px-3">Action Plan / Recommendation</th>
                      </>
                    ) : (
                      <>
                        <th className="py-2.5 px-3 text-center">Progress</th>
                        <th className="py-2.5 px-3 text-center">Status Tracker</th>
                        <th className="py-2.5 px-3 text-center">Risk Level</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {selectedMetricPrograms.map((item, index) => {
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => (onUpdateProgressClick || onEditProgramClick)?.(item)}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        title="Klik untuk melihat detail lengkap program"
                      >
                        <td className="py-3 px-3 text-center font-mono text-slate-500 font-medium">{index + 1}</td>
                        <td className="py-3 px-3 font-bold text-[#1e266f] bg-indigo-50/30 border-r border-indigo-100/30">{item.topic}</td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{item.cluster}</td>
                        <td className="py-3 px-3 text-slate-500">{item.owner}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-medium border border-slate-200/50">
                            {item.phase}
                          </span>
                        </td>

                        {/* Dynamic Body Cells */}
                        {selectedMetric === "decisionPending" ? (
                          <>
                            <td className="py-3 px-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-red-55 bg-red-100 text-red-700 font-bold text-[10px]">
                                {item.decisionNeeded || "Yes"}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-slate-700 font-medium max-w-[200px] truncate" title={item.keyIssue}>
                              {item.keyIssue || "-"}
                            </td>
                            <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate" title={item.actionPlan}>
                              {item.actionPlan || "-"}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="w-16 bg-slate-200 rounded-full h-1.5 hidden md:block">
                                  <div className="bg-[#1e266f] h-1.5 rounded-full" style={{ width: `${item.progress}%` }}></div>
                                </div>
                                <span className="font-mono text-[10px] font-bold text-slate-700">
                                  {item.progress}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold inline-block`}
                                style={{
                                  backgroundColor: item.statusTracker === "Green" ? "#ecfdf5" : item.statusTracker === "Yellow" ? "#fffbeb" : item.statusTracker === "Red" ? "#fef2f2" : "#f1f5f9",
                                  color: item.statusTracker === "Green" ? "#047857" : item.statusTracker === "Yellow" ? "#b45309" : item.statusTracker === "Red" ? "#b91c1c" : "#475569"
                                }}
                              >
                                {item.statusTracker}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold inline-block border`}
                                style={{
                                  backgroundColor: 
                                    item.priority === "Critical" ? "#fef2f2" : 
                                    item.priority === "High" ? "#fff7ed" : 
                                    item.priority === "Medium" ? "#eff6ff" : "#f8fafc",
                                  color: 
                                    item.priority === "Critical" ? "#b91c1c" : 
                                    item.priority === "High" ? "#c2410c" : 
                                    item.priority === "Medium" ? "#1d4ed8" : "#475569",
                                  borderColor: 
                                    item.priority === "Critical" ? "#fecaca" : 
                                    item.priority === "High" ? "#fed7aa" : 
                                    item.priority === "Medium" ? "#bfdbfe" : "#e2e8f0"
                                }}
                              >
                                {item.priority === "Critical" ? "P1 (Critical)" : 
                                 item.priority === "High" ? "P2 (High)" : 
                                 item.priority === "Medium" ? "P3 (Medium)" : 
                                 item.priority === "Low" ? "P4 (Low)" : (item.priority || "P3 (Medium)")}
                              </span>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. Transformation Health Index & Risk Heatmap Matrix Side-by-Side */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Transformation Health Index (Custom Gauge) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black font-sans text-[#1e266f] tracking-tight">
              Transformation Health Index
            </h3>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">
              Transformation Executive Cockpit Metrics
            </p>
          </div>

          {/* Premium Custom Gauge Visualizer */}
          <div className="my-4 relative flex flex-col items-center">
            {(() => {
              const clampedHealth = Math.max(0, Math.min(100, metrics.healthIndex));
              
              // Dynamic status color configuration following the health metrics logic:
              // >=80 (emerald/green), 65-79 (amber/yellow), <65 (rose/red)
              let statusColorClass = "text-slate-900";
              let statusColorHex = "#1e266f";
              if (clampedHealth >= 80) {
                statusColorClass = "text-emerald-500";
                statusColorHex = "#10b981";
              } else if (clampedHealth >= 40) {
                statusColorClass = "text-amber-500";
                statusColorHex = "#f59e0b";
              } else {
                statusColorClass = "text-rose-600";
                statusColorHex = "#e11d48";
              }

              // Angle from 180 (left) to 360 (right)
              const pointerAngle = 180 + (clampedHealth / 100) * 180;
              const pointerRad = (pointerAngle * Math.PI) / 180;
              const cx = 100;
              const cy = 110;
              const r = 74;
              const px = cx + r * Math.cos(pointerRad);
              const py = cy + r * Math.sin(pointerRad);

              // Helper for arc path string
              const getArcPathStr = (startX: number, startY: number, endX: number, endY: number) => {
                return `M ${startX} ${startY} A ${r} ${r} 0 0 1 ${endX} ${endY}`;
              };

              // Let's pre-calculate segment points for exact styling
              // Segment 1 (Intervensi DZ - Red/Rose): 0% - 40% (180 to 252 degrees)
              const r1_s = (180 * Math.PI) / 180;
              const r1_e = (252 * Math.PI) / 180;
              const p1_sx = cx + r * Math.cos(r1_s);
              const p1_sy = cy + r * Math.sin(r1_s);
              const p1_ex = cx + r * Math.cos(r1_e);
              const p1_ey = cy + r * Math.sin(r1_e);

              // Segment 2 (Perhatian - Amber/Yellow): 40% - 80% (252 to 324 degrees)
              const r2_s = (252 * Math.PI) / 180;
              const r2_e = (324 * Math.PI) / 180;
              const p2_sx = cx + r * Math.cos(r2_s);
              const p2_sy = cy + r * Math.sin(r2_s);
              const p2_ex = cx + r * Math.cos(r2_e);
              const p2_ey = cy + r * Math.sin(r2_e);

              // Segment 3 (Sehat - Green/Emerald): 80% - 100% (324 to 360 degrees)
              const r3_s = (324 * Math.PI) / 180;
              const r3_e = (360 * Math.PI) / 180;
              const p3_sx = cx + r * Math.cos(r3_s);
              const p3_sy = cy + r * Math.sin(r3_s);
              const p3_ex = cx + r * Math.cos(r3_e);
              const p3_ey = cy + r * Math.sin(r3_e);

              return (
                <>
                  {/* Gauge Container with Relative Overlay positioning */}
                  <div className="relative w-full max-w-[240px]">
                    <svg viewBox="0 0 200 125" className="w-full h-auto overflow-visible">
                      <defs>
                        {/* Wavy fine filter effect or beautiful standard high-fidelity gradients */}
                        <linearGradient id="g1" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#e11d48" />
                          <stop offset="100%" stopColor="#f43f5e" />
                        </linearGradient>
                        <linearGradient id="g2" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#f59e0b" />
                          <stop offset="100%" stopColor="#fbbf24" />
                        </linearGradient>
                        <linearGradient id="g3" x1="0%" y1="100%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#10b981" />
                          <stop offset="100%" stopColor="#34d399" />
                        </linearGradient>
                      </defs>

                      {/* 3 Segmented Paths with small gaps & rounded caps */}
                      <path d={getArcPathStr(p1_sx, p1_sy, p1_ex, p1_ey)} fill="none" stroke="url(#g1)" strokeWidth="13" strokeLinecap="butt" />
                      <path d={getArcPathStr(p2_sx, p2_sy, p2_ex, p2_ey)} fill="none" stroke="url(#g2)" strokeWidth="13" strokeLinecap="butt" />
                      <path d={getArcPathStr(p3_sx, p3_sy, p3_ex, p3_ey)} fill="none" stroke="url(#g3)" strokeWidth="13" strokeLinecap="butt" />

                      {/* Interactive glowing pointer pulsing dot following current status color */}
                      <circle cx={px} cy={py} r="10" style={{ fill: `${statusColorHex}33` }} />
                      <circle cx={px} cy={py} r="5.5" style={{ fill: statusColorHex }} className="stroke-white stroke-[2px] shadow-sm" />
                    </svg>

                    {/* Absolutely Centered Overlay inside Semi-circle */}
                    <div className="absolute inset-0 flex flex-col items-center justify-end pb-2.5 text-center pointer-events-none">

                      {/* Main Dynamic Large Percentage Metric with status-following text color */}
                      <div className={`text-4xl sm:text-4.5xl font-black tracking-tighter ${statusColorClass} leading-none select-none`}>
                        +{clampedHealth}%
                      </div>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>

          {/* Elegant Parameters & Interpretation Block with requested info */}
          <div className="border-t border-slate-150 pt-3.5 mt-2.5 text-[10.5px] text-slate-600 leading-relaxed font-sans space-y-2">
            <div>
              <span className="font-bold text-slate-800 block">Formula Perhitungan:</span>
              <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[9.5px] text-slate-500 mt-1 select-all">
                Green = 100 | Yellow = 70 | Red = 35 | Blocked = 0
              </div>
              <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">
                Skor dihitung dari rerata bobot status program tracker.
              </p>
            </div>
            
            <div>
              <span className="font-bold text-slate-800 block">Interpretasi Status:</span>
              <div className="grid grid-cols-3 gap-1 mt-1 font-mono text-[9px] text-center">
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-100/50 p-1 rounded">
                  <span className="font-bold block">&ge;80</span>
                  Sehat
                </div>
                <div className="bg-amber-50 text-amber-800 border border-amber-100/50 p-1 rounded">
                  <span className="font-bold block">65-79</span>
                  Perhatian
                </div>
                <div className="bg-rose-50 text-rose-800 border border-rose-100/50 p-1 rounded font-medium">
                  <span className="font-bold block">&lt;65</span>
                  Intervensi DZ
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Risk Heatmap Matrix */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200/80 p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* Left: Heatmap Matrix */}
            <div className="xl:col-span-7 flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-2">
                  RISK HEATMAP MATRIX
                </h3>
                <p className="text-[10px] text-slate-400 font-mono mb-4 leading-relaxed">
                  Pemetaan risiko program berdasarkan Kemungkinan (Probability) &amp; Dampak (Impact).
                </p>
              </div>

              <div className="space-y-1.5">
                {heatmapData.map((row, rIdx) => {
                  const probLabel = 4 - rIdx;
                  return (
                    <div key={rIdx} className="flex gap-1.5 sm:gap-2 items-center">
                      {/* Y-axis label */}
                      <span className="w-5 text-right text-[11px] font-bold text-slate-400 font-mono pr-1 select-none">
                        {probLabel}
                      </span>
                      
                      {/* Row Cells */}
                      <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2">
                        {row.map((val, cIdx) => {
                          const impactLabel = cIdx + 1;
                          const cellScore = probLabel * impactLabel;
                          
                          // High-fidelity styling parameters matching the user's mockup image exactly
                          let bgClass = "";
                          let borderClass = "";
                          let circleBg = "";
                          let coordTextClass = "";

                          if (cellScore === 16) {
                            // Critical (Red)
                            bgClass = "bg-[#e50000]/8";
                            borderClass = "border-[#e50000]/30";
                            circleBg = "bg-[#e50000]";
                            coordTextClass = "text-[#e50000]/70 font-bold";
                          } else if (cellScore === 12) {
                            // High (Orange)
                            bgClass = "bg-[#ff9000]/8";
                            borderClass = "border-[#ff9000]/30";
                            circleBg = "bg-[#ff9000]";
                            coordTextClass = "text-[#ff9000]/75 font-bold";
                          } else if (cellScore === 8 || cellScore === 9) {
                            // Medium (Yellow)
                            bgClass = "bg-[#ffd400]/8";
                            borderClass = "border-[#ffd400]/30";
                            circleBg = "bg-[#ffd400] text-slate-900";
                            coordTextClass = "text-[#c4a200]/80 font-bold";
                          } else if (cellScore === 4 || cellScore === 6) {
                            // Low (Light Green)
                            bgClass = "bg-[#92e58c]/12";
                            borderClass = "border-[#92e58c]/40";
                            circleBg = "bg-[#5ebd47]";
                            coordTextClass = "text-[#5fae59]/90 font-bold";
                          } else {
                            // Very Low (Teal/Cyan 1-3)
                            bgClass = "bg-[#26afb2]/8";
                            borderClass = "border-[#26afb2]/30";
                            circleBg = "bg-[#26afb2]";
                            coordTextClass = "text-[#26afb2]/80 font-bold";
                          }

                          const isSelected = selectedCell?.probability === probLabel && selectedCell?.impact === impactLabel;
                          const borderHighlight = isSelected 
                            ? "ring-2 ring-indigo-600 ring-offset-1 z-10 scale-[1.04] border-indigo-500 shadow-md" 
                            : "shadow-2xs hover:scale-[1.015]";

                          return (
                            <div 
                              key={cIdx} 
                              onClick={() => {
                                setSelectedCell(
                                  selectedCell?.probability === probLabel && selectedCell?.impact === impactLabel
                                    ? null
                                    : { probability: probLabel, impact: impactLabel }
                                );
                              }}
                              className={`h-11 sm:h-13 rounded-lg flex items-center justify-center font-sans border ${bgClass} ${borderClass} ${borderHighlight} relative transition-all duration-150 cursor-pointer active:scale-[0.98]`}
                              title={`Probability: ${probLabel}, Impact: ${impactLabel} (${val} Program)`}
                            >
                              {val > 0 ? (
                                /* Solid beautiful circle badge for non-empty cells exactly like mockup */
                                <div className={`w-7 h-7 sm:w-8.5 sm:h-8.5 rounded-full flex items-center justify-center ${circleBg} text-white font-extrabold text-xs sm:text-sm shadow-md ring-2 ring-white transition-all`}>
                                  {val}
                                </div>
                              ) : (
                                /* Faint coordinates format for empty cells exactly like mockup image */
                                <span className={`text-[9px] sm:text-[10px] font-semibold font-mono tracking-wider ${coordTextClass} select-none`}>
                                  {probLabel},{impactLabel}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                
                {/* X-axis indicators */}
                <div className="flex gap-1.5 sm:gap-2 items-center pt-1.5">
                  <span className="w-5"></span>
                  <div className="flex-1 grid grid-cols-4 gap-1.5 sm:gap-2 text-center font-mono text-[11px] font-bold text-slate-400 select-none">
                    <span>1</span>
                    <span>2</span>
                    <span>3</span>
                    <span>4</span>
                  </div>
                </div>
                
                {/* Under axis label */}
                <div className="flex justify-between items-center px-6 pt-2 text-[9px] font-sans font-bold uppercase tracking-wider text-slate-400 select-none">
                  <span>&larr; DAMPAK RENDAH (IMPACT)</span>
                  <span>DAMPAK TINGGI (IMPACT) &rarr;</span>
                </div>
              </div>
            </div>

            {/* Right: Explanatory & Legends */}
            <div className="xl:col-span-5 flex flex-col justify-between border-t xl:border-t-0 xl:border-l border-slate-100 pt-4 xl:pt-0 xl:pl-6">
              <div>
                <h4 className="text-xs font-bold font-sans text-slate-700 uppercase tracking-wider mb-2">
                  Keterangan Tingkat Risiko &amp; Petunjuk Penggunaan
                </h4>
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4">
                  Matriks di samping memetakan portofolio program berdasarkan parameter tingkat risiko riil (4x4). Klik pada sel mana saja yang berisi angka program untuk memfilter daftar detail program di bawah secara otomatis.
                </p>
                
                {/* Responsive Elegant Legend Table exactly matching the Indonesian specification */}
                <div className="overflow-x-auto border border-slate-200/80 rounded-lg shadow-2xs">
                  <table className="w-full text-left text-[11px] font-sans">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                        <th className="py-2 px-2.5">Risk Level</th>
                        <th className="py-2 px-2 text-center">Skor</th>
                        <th className="py-2 px-2">Warna</th>
                        <th className="py-2 px-2.5">Tindakan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-150">
                      <tr>
                        <td className="py-2 px-2.5 font-bold text-rose-600">Critical Risk</td>
                        <td className="py-2 px-2 text-center font-bold text-rose-700">16</td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#e50000]" />
                            <span className="text-[10px] text-slate-600 font-medium">Merah</span>
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-medium leading-tight">Kondisi Darurat</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-bold text-orange-600">High Risk</td>
                        <td className="py-2 px-2 text-center font-bold text-orange-700">12</td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ff9000]" />
                            <span className="text-[10px] text-slate-600 font-medium">Oranye</span>
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-medium leading-tight">Perhatian Utama</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-bold text-yellow-600">Medium Risk</td>
                        <td className="py-2 px-2 text-center font-bold text-yellow-700">6 - 9</td>
                        <td className="py-2 px-2">
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#ffd400]" />
                            <span className="text-[10px] text-slate-600 font-medium">Kuning</span>
                          </span>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-medium leading-tight">Pemantauan Rutin</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-2.5 font-bold text-emerald-600">Low Risk</td>
                        <td className="py-2 px-2 text-center font-bold text-emerald-700">1 - 4</td>
                        <td className="py-2 px-2">
                          <div className="flex flex-col gap-1">
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#26afb2]" />
                              <span className="text-[9px] text-slate-500 font-medium">Teal (1-3)</span>
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <span className="w-2.5 h-2.5 rounded-full bg-[#92e58c]" />
                              <span className="text-[9px] text-slate-500 font-medium">Hijau Muda (4-6)</span>
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-slate-700 font-medium leading-tight">Risiko Ringan</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3.5 mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[10px] font-sans font-bold text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#e50000] rounded-full shadow-2xs"></span> Critical (16)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#ff9000] rounded-full shadow-2xs"></span> High (12)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#ffd400] rounded-full shadow-2xs"></span> Medium (8-9)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#92e58c] rounded-full shadow-2xs"></span> Low - Light Green (4-6)</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-[#26afb2] rounded-full shadow-2xs"></span> Low - Teal (1-3)</span>
              </div>
            </div>
          </div>
        </div>

      </div>



      {/* 5. Details Section Placeholder */}

      {/* 4. Portfolio Status by Cluster Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm overflow-hidden flex flex-col">
        <h3 className="text-xs font-bold font-sans text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2 mb-3">
          Portfolio Status By Cluster
        </h3>
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs font-sans min-w-[850px]">
            <thead>
              <tr className="bg-slate-55 bg-slate-100 font-mono text-slate-600 font-bold border-b border-slate-200">
                <th className="py-3.5 px-4 md:py-4 md:px-5">Cluster</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center">Total</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center text-emerald-600">Green</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center text-amber-600">Yellow</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center text-rose-600">Red</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center text-slate-500">Blocked</th>
                <th className="py-3.5 px-5 md:py-4 md:px-6 text-center">Avg Progress</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center">Critical/High</th>
                <th className="py-3.5 px-3 md:py-4 md:px-4 text-center">DZ Interv.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clusterStats.map((stat, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleMetricCardClick(stat.name)}
                  className={`hover:bg-slate-50 transition-colors cursor-pointer ${
                    selectedMetric === stat.name ? "bg-indigo-50/70 font-bold" : ""
                  }`}
                  title={`Klik untuk melihat detail program cluster ${stat.name}`}
                >
                  <td className="py-3.5 px-4 md:py-4 md:px-5 font-medium text-slate-900">{stat.name}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-bold text-slate-800">{stat.total}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-semibold text-emerald-600">{stat.green}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-semibold text-amber-600">{stat.yellow}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-semibold text-rose-600">{stat.red}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-semibold text-slate-500">{stat.blocked}</td>
                  <td className="py-3.5 px-5 md:py-4 md:px-6 text-center">
                    <div className="flex items-center gap-2">
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div 
                          className="bg-indigo-600 h-2 rounded-full" 
                          style={{ width: `${stat.avgProgress}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700 min-w-[30px]">
                        {stat.avgProgress}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-bold text-slate-800">{stat.criticalOrHigh}</td>
                  <td className="py-3.5 px-3 md:py-4 md:px-4 text-center font-bold text-indigo-700">{stat.dzIntervention}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile View Cards */}
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {clusterStats.map((stat, idx) => {
            const isSelected = selectedMetric === stat.name;
            return (
              <div 
                key={idx} 
                onClick={() => handleMetricCardClick(stat.name)}
                className={`bg-white border rounded-xl p-4 shadow-3xs transition-all duration-200 active:scale-[0.98] cursor-pointer flex flex-col gap-3 ${
                  isSelected 
                    ? "border-indigo-400 ring-2 ring-indigo-100 bg-indigo-50/10" 
                    : "border-slate-200 hover:border-slate-300"
                }`}
              >
                {/* Header Cluster & Total */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 shrink-0"></span>
                    <h4 className="text-xs font-extrabold text-[#1e266f] leading-snug">
                      {stat.name}
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded-md shrink-0">
                    {stat.total} Pekerjaan
                  </span>
                </div>

                {/* Avg Progress */}
                <div className="space-y-1 bg-slate-50/50 p-2.5 rounded-lg border border-slate-150">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="font-bold text-slate-400 uppercase tracking-wider">Average Progress</span>
                    <span className="font-mono font-black text-[#1e266f]">{stat.avgProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-[#1e266f] h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${stat.avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* Status Breakdown Grid */}
                <div className="grid grid-cols-4 gap-1.5">
                  <div className="bg-emerald-50/40 border border-emerald-100 rounded-lg p-1.5 text-center flex flex-col items-center">
                    <span className="text-[8px] font-mono font-bold text-emerald-600 uppercase tracking-wider">Green</span>
                    <span className="text-xs font-bold text-emerald-700 mt-0.5">{stat.green}</span>
                  </div>
                  <div className="bg-amber-50/40 border border-amber-100 rounded-lg p-1.5 text-center flex flex-col items-center">
                    <span className="text-[8px] font-mono font-bold text-amber-600 uppercase tracking-wider">Yellow</span>
                    <span className="text-xs font-bold text-amber-700 mt-0.5">{stat.yellow}</span>
                  </div>
                  <div className="bg-rose-50/40 border border-rose-100 rounded-lg p-1.5 text-center flex flex-col items-center">
                    <span className="text-[8px] font-mono font-bold text-rose-600 uppercase tracking-wider">Red</span>
                    <span className="text-xs font-bold text-rose-700 mt-0.5">{stat.red}</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-150 rounded-lg p-1.5 text-center flex flex-col items-center">
                    <span className="text-[8px] font-mono font-bold text-slate-500 uppercase tracking-wider">Blocked</span>
                    <span className="text-xs font-bold text-slate-600 mt-0.5">{stat.blocked}</span>
                  </div>
                </div>

                {/* Critical/High & DZ Intervention Indicators */}
                <div className="grid grid-cols-2 gap-2 text-[10px] pt-1 border-t border-slate-100">
                  <div className="flex items-center justify-between bg-rose-50/25 border border-rose-100/50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">Critical / High:</span>
                    <span className={`font-mono font-black ${stat.criticalOrHigh > 0 ? "text-rose-600" : "text-slate-400"}`}>
                      {stat.criticalOrHigh}
                    </span>
                  </div>
                  <div className="flex items-center justify-between bg-indigo-50/25 border border-indigo-100/50 p-2 rounded-lg">
                    <span className="font-semibold text-slate-500">DZ Intervensi:</span>
                    <span className={`font-mono font-black ${stat.dzIntervention > 0 ? "text-indigo-600" : "text-slate-400"}`}>
                      {stat.dzIntervention}
                    </span>
                  </div>
                </div>

                {/* Tap to View Detail */}
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mt-0.5 border-t border-slate-100 pt-2">
                  <span className="text-slate-400">Pilih cluster untuk filter</span>
                  <span className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5">
                    Detail &rarr;
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
