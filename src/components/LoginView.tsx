import React, { useState } from "react";
import { 
  Lock, 
  Mail, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  Building2, 
  KeyRound,
  ShieldCheck,
  UserCheck,
  Eye as ViewIcon,
  Sparkles
} from "lucide-react";
import { safeStorage } from "../safeStorage";
import { UserAccount } from "../types";


export const SEEDED_ACCOUNTS: (UserAccount & { password: string; description: string; permissions: string[] })[] = [
  {
    email: "admin@kai.id",
    password: "admin",
    name: "",
    role: "ADMIN",
    roleName: "Admin",
    description: "Akses Penuh Administrasi",
    permissions: [
      "Tambah Program Baru",
      "Edit Seluruh Detail Program",
      "Rapid Inline Edit",
      "Hapus Program",
      "Penyetelan Ulang & Reset Database",
      "Arsip & Hapus Dokumen Cloud",
      "Buat Log Meeting & Minutes of Meeting (MoM)"
    ]
  },
  {
    email: "internal@kai.id",
    password: "pmo",
    name: "",
    role: "TEAM_INTERNAL",
    roleName: "Team Internal",
    description: "Akses Operasional Program, Tracker, & MoM",
    permissions: [
      "Tambah Program Baru",
      "Edit Seluruh Detail Program",
      "Rapid Inline Edit",
      "Buat Log Meeting & Minutes of Meeting (MoM)",
      "Arsip & Hapus Dokumen Cloud",
      "❌ Hapus Program (Dibatasi)",
      "❌ Penyetelan Ulang Database (Dibatasi)"
    ]
  },
  {
    email: "viewer@kai.id",
    password: "viewer",
    name: "",
    role: "VIEWER",
    roleName: "Viewer",
    description: "Akses Khusus Pemantauan (Read-Only)",
    permissions: [
      "Pemantauan Real-time Cockpit & Dashboard",
      "Melihat detail Program Tracker & Meeting Logs",
      "Membuka & Mengunduh Dokumen Cloud",
      "❌ Mengubah/Mengedit Data Apapun (Dibatasi)",
      "❌ Menghapus/Menyetel Ulang (Dibatasi)"
    ]
  }
];

interface LoginViewProps {
  onLogin: (user: UserAccount) => void;
}

export default function LoginView({ onLogin }: LoginViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDemoRole, setSelectedDemoRole] = useState<string>("ADMIN");

  const currentSelectedDemo = SEEDED_ACCOUNTS.find(acc => acc.role === selectedDemoRole) || SEEDED_ACCOUNTS[0];

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const foundAccount = SEEDED_ACCOUNTS.find(
      acc => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (foundAccount) {
      const userSession: UserAccount = {
        email: foundAccount.email,
        name: foundAccount.name,
        role: foundAccount.role,
        roleName: foundAccount.roleName
      };
      
      safeStorage.setItem("kai_logged_in_user", JSON.stringify(userSession));
      onLogin(userSession);
    } else {
      setError("Email atau Password tidak valid. Silakan coba kembali atau gunakan Akun Demo.");
    }
  };

  const handleQuickLogin = (acc: typeof SEEDED_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError(null);
    
    const userSession: UserAccount = {
      email: acc.email,
      name: acc.name,
      role: acc.role,
      roleName: acc.roleName
    };
    
    safeStorage.setItem("kai_logged_in_user", JSON.stringify(userSession));
    onLogin(userSession);
  };

  return (
    <div className="min-h-screen bg-[#f0f2f8] flex flex-col justify-between text-slate-900 font-sans border-t-8 border-[#f36e21] relative overflow-hidden">
      
      {/* Decorative BG Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e2e8f0_1px,transparent_1px),linear-gradient(to_bottom,#e2e8f0_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 py-3.5 px-6 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/56/Logo_PT_Kereta_Api_Indonesia_%28Persero%29_2020.svg" 
              alt="KAI Logo" 
              className="h-7 sm:h-9 w-auto object-contain" 
              referrerPolicy="no-referrer"
            />
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-xs sm:text-sm font-black text-[#1e266f] tracking-tight leading-none">
                CORPORATE TRANSFORMATION <span className="text-[#f36e21]">COCKPIT</span>
              </h1>
              <p className="text-[8px] text-slate-400 font-mono tracking-wider mt-1 uppercase font-semibold">
                ZT COCKPIT HUB • ACCESS GATE
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-block px-3 py-1 bg-[#1e266f]/5 rounded-full text-[10px] font-bold text-[#1e266f] font-mono border border-[#1e266f]/10">
            SECURE ACCESS v2.5
          </span>
        </div>
      </header>

      {/* Main Content Box */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-10 z-10 my-auto">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-150 max-w-5xl w-full overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[550px]">
          
          {/* Left Panel: Live Credentials Guide & Role Details */}
          <div className="lg:col-span-5 bg-gradient-to-br from-[#1e266f] to-[#121848] text-white p-6 sm:p-8 flex flex-col justify-between border-r border-slate-200">
            <div>
              <div className="flex items-center gap-2 mb-6">
                <span className="p-1.5 bg-white/10 rounded-lg text-[#f36e21]">
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold tracking-widest text-[#f36e21] font-mono uppercase">
                  Sistem Otorisasi KAI
                </span>
              </div>

              <h2 className="text-xl sm:text-2xl font-black tracking-tight mb-2 leading-tight">
                Hak Akses &amp; Peran Akun <span className="text-[#f36e21]">ZT Cockpit</span>
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mb-6">
                Silakan pilih salah satu Peran Demo di bawah ini untuk melihat pratinjau hak akses instan, atau masuk menggunakan kredensial tertulis di kanan.
              </p>

              {/* Demo Account Tabs */}
              <div className="grid grid-cols-3 gap-1.5 mb-6">
                {SEEDED_ACCOUNTS.map(acc => {
                  const isSelected = selectedDemoRole === acc.role;
                  return (
                    <button
                      key={acc.role}
                      type="button"
                      onClick={() => {
                        setSelectedDemoRole(acc.role);
                        setEmail(acc.email);
                        setPassword(acc.password);
                      }}
                      className={`px-2 py-2.5 text-center rounded-lg transition-all duration-150 border cursor-pointer ${
                        isSelected 
                          ? "bg-[#f36e21] border-[#f36e21] text-white shadow-md font-bold"
                          : "bg-white/5 hover:bg-white/10 border-white/10 text-slate-200"
                      }`}
                    >
                      <div className="text-[11px] uppercase font-mono tracking-wider">
                        {acc.role === "ADMIN" && "Admin"}
                        {acc.role === "TEAM_INTERNAL" && "Internal"}
                        {acc.role === "VIEWER" && "Viewer"}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Permissions List Card */}
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <div className="flex items-center gap-1.5 text-xs font-black text-[#f36e21]">
                    {selectedDemoRole === "ADMIN" && <ShieldCheck className="w-4 h-4" />}
                    {selectedDemoRole === "TEAM_INTERNAL" && <KeyRound className="w-4 h-4" />}
                    {selectedDemoRole === "VIEWER" && <ViewIcon className="w-4 h-4" />}
                    <span>{currentSelectedDemo.roleName}</span>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-slate-300 border border-white/5">
                    {currentSelectedDemo.role}
                  </span>
                </div>

                <ul className="space-y-2">
                  {currentSelectedDemo.permissions.map((perm, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-[11px] text-slate-200 leading-snug">
                      {perm.startsWith("❌") ? (
                        <span className="shrink-0 mt-0.5">{perm.slice(0, 2)}</span>
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      )}
                      <span>{perm.startsWith("❌") ? perm.slice(2) : perm}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-300 font-mono">
                  <span>Sandi masuk: <strong className="text-white font-sans text-xs bg-white/10 px-2 py-0.5 rounded ml-1">{currentSelectedDemo.password}</strong></span>
                </div>
              </div>
            </div>

            {/* Bottom info */}
            <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-[10px] text-slate-400 font-mono">
              <span>Sistem Manajemen Otorisasi</span>
              <span>© 2026 PT KAI</span>
            </div>
          </div>

          {/* Right Panel: Official Login Form */}
          <div className="lg:col-span-7 p-6 sm:p-8 md:p-10 flex flex-col justify-between">
            
            {/* Title / Greetings */}
            <div>
              <div className="mb-8">
                <span className="text-[#f36e21] text-xs font-extrabold uppercase tracking-widest font-mono">
                  Gerbang Autentikasi KAI
                </span>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#1e266f] tracking-tight mt-1">
                  Masuk ke Dashboard Cockpit
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Gunakan kredensial Anda untuk mengakses data monitoring program transformasi perusahaan.
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-start gap-2.5 animate-shake">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Gagal Masuk:</span> {error}
                  </div>
                </div>
              )}

              {/* Login Form */}
              <form onSubmit={handleLoginSubmit} className="space-y-4 sm:space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide mb-1.5">
                    Alamat Email KAI
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="contoh: nama@kai.id"
                      className="w-full pl-10 pr-4 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e266f] focus:border-[#1e266f] outline-none transition-all placeholder:text-slate-450 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wide">
                      Kata Sandi (Password)
                    </label>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 pointer-events-none">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi"
                      className="w-full pl-10 pr-10 py-2.5 sm:py-3 text-xs sm:text-sm border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#1e266f] focus:border-[#1e266f] outline-none transition-all placeholder:text-slate-450 bg-slate-50/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                    </button>
                  </div>
                </div>

                {/* Form Action Controls */}
                <div className="pt-2 flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-[#1e266f] hover:bg-[#161c52] text-white py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                  >
                    <span>Masuk Secara Manual</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleQuickLogin(currentSelectedDemo)}
                    className="flex-1 bg-[#f36e21] hover:bg-[#df6017] text-white py-3 rounded-xl text-xs font-extrabold tracking-wider uppercase transition-all duration-150 shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-98 border border-[#e5590c]"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Masuk Instan (Sesuai Pilihan)</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Footer tips */}
            <div className="mt-8 pt-6 border-t border-slate-150 text-[11px] text-slate-450 leading-relaxed bg-slate-50/60 p-3 rounded-xl border border-slate-100">
              <span className="font-bold text-slate-600 block mb-0.5">💡 Tips Eksplorasi:</span>
              Gunakan panel sebelah kiri untuk beralih di antara 3 Peran Demo. Hak akses pada seluruh dashboard, tombol tindakan, dan laporan akan disaring secara waktu nyata berdasarkan peran yang aktif.
            </div>

          </div>

        </div>
      </main>

      {/* Footer Branding */}
      <footer className="bg-white/50 border-t border-slate-200 py-4 text-center text-[10px] font-mono text-slate-400 z-10">
        <div>Sistem Pengendalian Program Transformasi PT Kereta Api Indonesia (Persero)</div>
      </footer>

    </div>
  );
}
