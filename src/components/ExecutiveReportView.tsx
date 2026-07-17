import React, { useMemo } from "react";
import { MeetingLog, ProgramJob } from "../types";
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb, 
  PieChart, 
  Activity,
  Layers
} from "lucide-react";

interface ExecutiveReportViewProps {
  logs: MeetingLog[];
  programs: ProgramJob[];
}

export default function ExecutiveReportView({ logs, programs }: ExecutiveReportViewProps) {
  
  // High level reporting insights
  const reportingInsights = useMemo(() => {
    const totalLogs = logs.length;
    const latestLog = logs.length > 0 ? logs[0].meetingDate : "N/A";
    
    // Calculate total progress adjustments recorded in meetings
    const progressIncreases = logs.filter(l => l.newProgress > l.previousProgress).length;
    const progressDecreases = logs.filter(l => l.newProgress < l.previousProgress).length;
    
    // Status improvements vs degradations
    const statusOrder: Record<string, number> = { "Green": 3, "Yellow": 2, "Red": 1, "Blocked": 0 };
    let statusUpgrades = 0;
    let statusDowngrades = 0;
    
    logs.forEach(l => {
      const prevScore = statusOrder[l.previousStatus] ?? 2;
      const newScore = statusOrder[l.newStatus] ?? 2;
      if (newScore > prevScore) statusUpgrades++;
      if (newScore < prevScore) statusDowngrades++;
    });

    // Cluster Breakdown calculations
    const clusterStatus: Record<string, { total: number; green: number; yellow: number; red: number; blocked: number }> = {};
    
    programs.forEach(p => {
      const clusterName = p.cluster || "Strategic Transformation";
      if (!clusterStatus[clusterName]) {
        clusterStatus[clusterName] = { total: 0, green: 0, yellow: 0, red: 0, blocked: 0 };
      }
      clusterStatus[clusterName].total += 1;
      if (p.statusTracker === "Green") clusterStatus[clusterName].green += 1;
      else if (p.statusTracker === "Yellow") clusterStatus[clusterName].yellow += 1;
      else if (p.statusTracker === "Red") clusterStatus[clusterName].red += 1;
      else if (p.statusTracker === "Blocked") clusterStatus[clusterName].blocked += 1;
    });

    return {
      totalLogs,
      latestLog,
      progressIncreases,
      progressDecreases,
      statusUpgrades,
      statusDowngrades,
      clusterStatus
    };
  }, [logs, programs]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header and Page Intro */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm flex items-start gap-4">
        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
          <PieChart className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-900 font-sans tracking-tight">
            I. PORTFOLIO EXECUTIVE DIAGNOSTICS & STATUS REPORT
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
            Laporan tingkat tinggi kinerja inisiatif transformasi korporasi. Panel ini mendedikasikan analisis diagnostics
            kesehatan program, tren perubahan status rapat koordinasi, serta penyelarasan program yang terhambat.
          </p>
        </div>
      </div>

      {/* 2. Executive Diagnostics Grid */}
      <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-md">
        <h3 className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-1.5">
          <Activity className="w-4 h-4 text-indigo-400" />
          EXECUTIVE SUMMARY METRICS
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-800">
          
          <div className="pt-2 md:pt-0">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Total Meeting Logs</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-indigo-400">{reportingInsights.totalLogs}</span>
              <span className="text-xs text-slate-400 font-mono">rapat direkam</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-serif">Mencakup sinergi rapat koordinasi transisi</p>
          </div>

          <div className="pt-3 md:pt-0 md:pl-4">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Progress Upgrades</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-emerald-400">{reportingInsights.progressIncreases}</span>
              <span className="text-xs text-slate-400 font-mono font-mono">momentum positif</span>
            </div>
            <p className="text-[10px] text-emerald-500 mt-1 font-mono flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> Peningkatan realisasi fisik
            </p>
          </div>

          <div className="pt-3 md:pt-0 md:pl-4">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Status Mutasi</span>
            <div className="flex items-center gap-3 mt-1">
              <div>
                <span className="text-2xl font-black text-emerald-400">+{reportingInsights.statusUpgrades}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Sehat</span>
              </div>
              <div className="border-l border-slate-800 h-8 self-center" />
              <div>
                <span className="text-2xl font-black text-rose-450 text-rose-400">-{reportingInsights.statusDowngrades}</span>
                <span className="text-[10px] text-slate-400 block font-mono">Eskalasi</span>
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-1 font-sans">Pergeseran level resiko program</p>
          </div>

          <div className="pt-3 md:pt-0 md:pl-4">
            <span className="block text-[10px] uppercase font-mono text-slate-400">Rapat Aktif Terakhir</span>
            <div className="flex items-center gap-2 mt-1.5 text-slate-205">
              <Calendar className="w-4 h-4 text-indigo-400" />
              <span className="text-sm font-bold font-mono text-slate-100">{reportingInsights.latestLog}</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Status database terintegrasi waktu nyata.</p>
          </div>

        </div>
      </div>

      {/* 3. Cluster Performance Breakdown & Advisory Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Side: Strategic Cluster Health Map */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-500" />
              Strategic Cluster Health Status
            </h4>
            <span className="text-[10px] text-slate-400 font-mono font-bold">BY INITIATIVE DENSITY</span>
          </div>

          <div className="space-y-3.5">
            {Object.keys(reportingInsights.clusterStatus).length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 font-mono border border-dashed border-slate-200 rounded">
                Tidak ada klaster strategis yang aktif saat ini.
              </div>
            ) : (
              (Object.entries(reportingInsights.clusterStatus) as [string, { total: number; green: number; yellow: number; red: number; blocked: number }][]).map(([clusterName, stats]) => {
                const total = stats.total;
                const greenPercent = total > 0 ? Math.round((stats.green / total) * 100) : 0;
                const yellowPercent = total > 0 ? Math.round((stats.yellow / total) * 100) : 0;
                const redPercent = total > 0 ? Math.round((stats.red / total) * 100) : 0;
                const blockedPercent = total > 0 ? Math.round((stats.blocked / total) * 100) : 0;

                return (
                  <div key={clusterName} className="p-3 bg-slate-50 border border-slate-200/80 rounded-lg space-y-2 hover:border-slate-300 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 font-mono">{clusterName}</span>
                      <span className="text-[10px] font-bold text-slate-500 font-mono bg-white px-2 py-0.5 rounded border border-slate-200 shadow-2xs">
                        {total} Initiative{total > 1 ? "s" : ""}
                      </span>
                    </div>

                    {/* Stacked Percentage bar */}
                    <div className="w-full h-2 rounded-full bg-slate-200 overflow-hidden flex shadow-inner">
                      {stats.green > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${greenPercent}%` }} title={`Green: ${stats.green}`} />}
                      {stats.yellow > 0 && <div className="bg-amber-400 h-full" style={{ width: `${yellowPercent}%` }} title={`Yellow: ${stats.yellow}`} />}
                      {stats.red > 0 && <div className="bg-rose-500 h-full" style={{ width: `${redPercent}%` }} title={`Red: ${stats.red}`} />}
                      {stats.blocked > 0 && <div className="bg-slate-800 h-full" style={{ width: `${blockedPercent}%` }} title={`Blocked: ${stats.blocked}`} />}
                    </div>

                    {/* Color indicators metrics row */}
                    <div className="flex items-center gap-4 text-[9px] font-mono text-slate-500 select-none">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>Green: {stats.green} ({greenPercent}%)</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <span>Yellow: {stats.yellow}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        <span>Red: {stats.red}</span>
                      </div>
                      {stats.blocked > 0 && (
                        <div className="flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-slate-800" />
                          <span>Blocked: {stats.blocked}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Unresolved Obstacles & Corporate Guidance */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Diagnostic Card 1: Blockers Unresolved */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                DIAGNOSTIC STATUS
              </span>
              <h4 className="text-xs font-bold font-sans text-slate-850 uppercase tracking-tight">
                Critical Red & Blocked Areas
              </h4>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-[220px] pr-1">
              {programs.filter(p => ["Red", "Blocked"].includes(p.statusTracker)).length === 0 ? (
                <div className="flex items-start gap-2 p-3 bg-emerald-50 text-emerald-800 rounded text-[11px] font-sans border border-emerald-100">
                  <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Status Sempurna!</span>
                    <span className="text-slate-500 text-[10px]">Semua inisiatif program berjalan terarah bebas dari hambatan kritis merah/blocked.</span>
                  </div>
                </div>
              ) : (
                programs.filter(p => ["Red", "Blocked"].includes(p.statusTracker)).map(p => (
                  <div key={p.id} className="p-2.5 bg-rose-50 border border-rose-150 rounded flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 text-xs truncate max-w-[200px]">{p.topic}</span>
                      <span className="text-[9px] bg-rose-200 text-rose-900 font-bold px-1.5 py-0.5 rounded uppercase">{p.statusTracker}</span>
                    </div>
                    <span className="text-[10px] text-rose-800 font-mono italic leading-normal">
                      Kendala: {p.keyIssue || "Butuh koordinasi perbaikan segera."}
                    </span>
                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-rose-100 text-[9px] text-slate-550 font-mono">
                      <span>Unit Owner: {p.owner}</span>
                      <span>Cluster: {p.cluster}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Diagnostic Card 2: Strategic Advisory Tips */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 uppercase block font-bold">
                GUIDANCE FOR EXECUTION
              </span>
              <h4 className="text-xs font-bold font-sans text-slate-850 uppercase tracking-tight">
                CT Advisory & Execution Recommendations
              </h4>
            </div>
            
            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed pt-1.5">
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Lightbulb className="w-4 h-4 flex-shrink-0" />
                </div>
                <p>
                  <strong>Kalog Transformation:</strong> Harus segera dilakukan sinergi transisi bersama RACI matriks dalam 30 hari untuk mengatasi hambatan integrasi group.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Lightbulb className="w-4 h-4 flex-shrink-0" />
                </div>
                <p>
                  <strong>Target Operating MRO:</strong> Keputusan model percepatan transisi teknis mutlak diperlukan koordinasi dengan maint group agar target selesai Q3.
                </p>
              </div>
              <div className="flex gap-2.5 items-start">
                <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg">
                  <Lightbulb className="w-4 h-4 flex-shrink-0" />
                </div>
                <p>
                  <strong>Investment Quality Gate:</strong> Kompresi waktu verifikasi gate capex dan dorong pilar-pilar klaster mengumpulkan berkas sebelum tanggal kematangan.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
