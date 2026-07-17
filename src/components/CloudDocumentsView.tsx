import React, { useState, useMemo } from "react";
import { CloudDocument, AttachmentFile, UserAccount } from "../types";
import { 
  FileText, 
  Calendar, 
  Hash, 
  Send, 
  Paperclip, 
  Trash2, 
  Search, 
  Plus, 
  Download, 
  CloudLightning, 
  Tag, 
  X, 
  File, 
  Inbox,
  Eye
} from "lucide-react";

interface CloudDocumentsViewProps {
  documents: CloudDocument[];
  onAddDocument: (docFields: Omit<CloudDocument, "id">) => Promise<void>;
  onDeleteDocument: (docId: string) => Promise<void>;
  currentUser?: UserAccount | null;
}

export default function CloudDocumentsView({
  documents,
  onAddDocument,
  onDeleteDocument,
  currentUser
}: CloudDocumentsViewProps) {
  // Navigation & State Management
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Form Fields State
  const [tanggalSurat, setTanggalSurat] = useState("");
  const [noSurat, setNoSurat] = useState("");
  const [asalSurat, setAsalSurat] = useState("");
  const [prihal, setPrihal] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<AttachmentFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPreviewFile, setSelectedPreviewFile] = useState<AttachmentFile | null>(null);

  // File drag & drop processing
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
  };

  const processFiles = (fileList: FileList) => {
    Array.from(fileList).forEach((file) => {
      if (file.size > 2000000) { // 2MB max size
        alert(`File "${file.name}" melebihi batas maksimum 2MB.`);
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedFiles((prev) => [
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

  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tanggalSurat) {
      alert("Harap isi Tanggal Surat!");
      return;
    }
    if (!noSurat.trim()) {
      alert("Harap isi No Surat!");
      return;
    }
    if (!asalSurat.trim()) {
      alert("Harap isi Asal Surat!");
      return;
    }
    if (!prihal.trim()) {
      alert("Harap isi Perihal!");
      return;
    }

    setIsSubmitting(true);
    try {
      await onAddDocument({
        tanggalSurat,
        noSurat: noSurat.trim(),
        asalSurat: asalSurat.trim(),
        prihal: prihal.trim(),
        files: uploadedFiles,
        uploadedBy: "Executive Moderator"
      });

      // Clear Form on success
      setTanggalSurat("");
      setNoSurat("");
      setAsalSurat("");
      setPrihal("");
      setUploadedFiles([]);
      setIsAddFormOpen(false);
    } catch (error) {
      console.error("Gagal menambahkan dokumen:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered documents
  const filteredDocs = useMemo(() => {
    let result = [...documents];

    if (searchTerm.trim()) {
      const lower = searchTerm.toLowerCase();
      result = result.filter((doc) => 
        doc.noSurat.toLowerCase().includes(lower) ||
        doc.asalSurat.toLowerCase().includes(lower) ||
        doc.prihal.toLowerCase().includes(lower) ||
        doc.tanggalSurat.toLowerCase().includes(lower)
      );
    }

    if (startDate) {
      result = result.filter((doc) => doc.tanggalSurat >= startDate);
    }

    if (endDate) {
      result = result.filter((doc) => doc.tanggalSurat <= endDate);
    }

    return result;
  }, [documents, searchTerm, startDate, endDate]);

  return (
    <div className="space-y-6">
      
      {/* 1. Header Area with statistics */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-slate-100 text-slate-700 rounded-lg shrink-0 border border-slate-200">
            <CloudLightning className="w-5 h-5" />
          </div>
          <div className="space-y-0.5">
            <h2 className="text-lg font-extrabold text-slate-900 font-sans tracking-tight leading-tight">
              Arsip Dokumen
            </h2>
            <p className="text-xs text-slate-500 max-w-xl">
              Pusat penyimpanan digital dokumen surat-menyurat dan referensi.
            </p>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-2">
          {currentUser?.role !== "VIEWER" && (
            <button
              onClick={() => setIsAddFormOpen(!isAddFormOpen)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                isAddFormOpen 
                  ? "bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              {isAddFormOpen ? (
                <>
                  <X className="w-3.5 h-3.5" />
                  Tutup Formulir
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  Unggah Surat
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* 2. Interactive Add Document Form */}
      {isAddFormOpen && (
        <form onSubmit={handleSubmit} className="bg-slate-50 border border-slate-200 rounded-lg p-4 sm:p-5 animate-fade-in space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Tanggal Surat */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Tanggal Surat <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-8 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-800"
                />
              </div>
            </div>

            {/* No Surat */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                No Surat <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={noSurat}
                  onChange={(e) => setNoSurat(e.target.value)}
                  placeholder="05/SURAT/VII/2026"
                  className="w-full text-xs font-medium bg-white border border-slate-300 rounded pl-8 pr-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-800 placeholder:text-slate-300"
                />
              </div>
            </div>

            {/* Asal Surat */}
            <div className="md:col-span-5 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Asal Surat <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={asalSurat}
                onChange={(e) => setAsalSurat(e.target.value)}
                placeholder="Direktorat Strategis"
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-800 placeholder:text-slate-300"
              />
            </div>

            {/* Perihal */}
            <div className="md:col-span-12 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Perihal <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={prihal}
                onChange={(e) => setPrihal(e.target.value)}
                placeholder="Deskripsi singkat surat..."
                className="w-full text-xs font-medium bg-white border border-slate-300 rounded px-3 py-2 outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 text-slate-800 placeholder:text-slate-300"
              />
            </div>

            {/* File Attachments drag & drop */}
            <div className="md:col-span-12 space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Lampiran Berkas
              </label>
              <div 
                className={`border border-dashed rounded bg-white p-4 text-center cursor-pointer transition-all ${
                  isDragging 
                    ? "border-indigo-400 bg-indigo-50/50" 
                    : "border-slate-300 hover:border-slate-400"
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
                onClick={() => document.getElementById("cloud-doc-file-input")?.click()}
              >
                <input
                  id="cloud-doc-file-input"
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="flex flex-col items-center justify-center space-y-1">
                  <Paperclip className="w-4 h-4 text-slate-400" />
                  <p className="text-[11px] font-medium text-slate-600">
                    Geser file di sini, atau <span className="text-indigo-600 font-semibold hover:underline">pilih berkas</span>
                  </p>
                </div>
              </div>
            </div>

            {/* List of files to be uploaded */}
            {uploadedFiles.length > 0 && (
              <div className="md:col-span-12 border border-slate-200 rounded divide-y divide-slate-100 bg-white">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="px-3 py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <File className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="font-medium text-slate-700 truncate max-w-[200px] sm:max-w-[400px]" title={file.name}>
                          {file.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-[10px] text-slate-400">{(file.size / 1024).toFixed(1)} KB</span>
                      <button
                        type="button"
                        onClick={() => setUploadedFiles((prev) => prev.filter((_, i) => i !== index))}
                        className="text-slate-400 hover:text-rose-600 transition-colors p-1 rounded hover:bg-rose-50"
                        title="Hapus"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setTanggalSurat("");
                setNoSurat("");
                setAsalSurat("");
                setPrihal("");
                setUploadedFiles([]);
                setIsAddFormOpen(false);
              }}
              className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-50"
            >
              {isSubmitting ? "Menyimpan..." : "Simpan Arsip"}
            </button>
          </div>
        </form>
      )}

      {/* 3. Search and filter panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan No Surat, Asal Surat, Perihal..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg pl-10 pr-10 py-2.5 outline-none focus:border-slate-300 focus:ring-1 focus:ring-slate-200 transition-all text-slate-800 placeholder:text-slate-400 shadow-sm"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer animate-fade-in"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tgl:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 outline-none px-2 py-1.5 cursor-pointer focus:border-slate-300 shadow-sm"
              title="Tanggal Mulai"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 outline-none px-2 py-1.5 cursor-pointer focus:border-slate-300 shadow-sm"
              title="Tanggal Selesai"
            />
          </div>

          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate("");
                setEndDate("");
              }}
              className="text-slate-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition-colors"
              title="Reset Tanggal"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="hidden sm:block w-px h-4 bg-slate-200"></div>

          <div className="text-[10px] font-mono font-bold text-slate-500 whitespace-nowrap">
            {filteredDocs.length !== documents.length ? (
              <span className="text-indigo-600">DITEMUKAN: {filteredDocs.length}</span>
            ) : (
              <span>TOTAL ARSIP: {documents.length}</span>
            )}
          </div>
        </div>
      </div>

      {/* 4. Documents List Area (Minimalist) */}
      {filteredDocs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center justify-center space-y-3">
          <div className="p-4 bg-slate-50 text-slate-300 rounded-full">
            <Inbox className="w-10 h-10" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-700">Tidak Ada Dokumen Surat</h3>
            <p className="text-xs text-slate-400 max-w-sm">
              {searchTerm 
                ? "Tidak menemukan hasil pencarian untuk kata kunci tersebut. Coba cari kata kunci lainnya."
                : "Belum ada dokumen yang diunggah ke cloud. Klik tombol 'Unggah Surat Baru' untuk mulai mengarsipkan."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Table view for Medium and Larger screens */}
          <div className="hidden md:block bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-5 py-3 whitespace-nowrap">No Surat</th>
                    <th className="px-5 py-3 whitespace-nowrap">Tanggal</th>
                    <th className="px-5 py-3 min-w-[250px]">Asal / Perihal</th>
                    <th className="px-5 py-3 whitespace-nowrap">Lampiran</th>
                    {currentUser?.role !== "VIEWER" && (
                      <th className="px-5 py-3 whitespace-nowrap text-right">Aksi</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredDocs.map((docItem) => (
                    <tr key={docItem.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3 whitespace-nowrap font-mono font-medium text-slate-700">
                        {docItem.noSurat}
                      </td>
                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium text-slate-700 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {docItem.tanggalSurat}
                          </span>
                          <span className="text-[10px] text-slate-400">Diunggah: {docItem.createdAt || "N/A"}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider w-fit flex items-center gap-1">
                            <Tag className="w-2.5 h-2.5" />
                            {docItem.asalSurat}
                          </span>
                          <span className="font-semibold text-slate-800 leading-snug">
                            {docItem.prihal}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {docItem.files && docItem.files.length > 0 ? (
                          <div className="flex flex-col gap-1.5 min-w-[180px]">
                            {docItem.files.map((file, fIdx) => (
                              <div key={fIdx} className="flex items-center justify-between bg-white border border-slate-200 px-2.5 py-1.5 rounded text-[11px] hover:border-slate-300 transition-colors">
                                <span className="truncate max-w-[100px] font-medium text-slate-600" title={file.name}>
                                  {file.name}
                                </span>
                                <div className="flex items-center gap-1 shrink-0 ml-1">
                                  <button
                                    onClick={() => setSelectedPreviewFile(file)}
                                    className="text-indigo-650 hover:text-indigo-800 p-1 hover:bg-indigo-50 rounded cursor-pointer flex items-center justify-center"
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
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">-</span>
                        )}
                      </td>
                      {currentUser?.role !== "VIEWER" && (
                        <td className="px-5 py-3 whitespace-nowrap text-right align-middle">
                          <button
                            onClick={() => {
                              if (confirm(`Apakah Anda yakin ingin menghapus arsip No Surat: ${docItem.noSurat}?`)) {
                                onDeleteDocument(docItem.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer inline-flex items-center justify-center"
                            title="Hapus Dokumen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cards view for Mobile/Tablet screens */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredDocs.map((docItem) => (
              <div key={docItem.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-3xs flex flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col gap-1">
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {docItem.noSurat}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {docItem.tanggalSurat}
                    </span>
                  </div>
                  {currentUser?.role !== "VIEWER" && (
                    <button
                      onClick={() => {
                        if (confirm(`Apakah Anda yakin ingin menghapus arsip No Surat: ${docItem.noSurat}?`)) {
                          onDeleteDocument(docItem.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer shrink-0"
                      title="Hapus Dokumen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded uppercase tracking-wider w-fit flex items-center gap-1">
                    <Tag className="w-2.5 h-2.5" />
                    {docItem.asalSurat}
                  </span>
                  <p className="font-semibold text-slate-800 text-xs leading-normal">
                    {docItem.prihal}
                  </p>
                </div>

                {docItem.files && docItem.files.length > 0 && (
                  <div className="border-t border-slate-100 pt-3 space-y-1.5">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Lampiran:</span>
                    <div className="grid grid-cols-1 gap-1.5">
                      {docItem.files.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center justify-between bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded text-[11px] hover:border-slate-300 transition-colors">
                          <span className="truncate max-w-[150px] font-medium text-slate-600 font-mono" title={file.name}>
                            {file.name}
                          </span>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <button
                              onClick={() => setSelectedPreviewFile(file)}
                              className="text-indigo-650 hover:text-indigo-800 p-1 bg-white border border-slate-200 rounded shadow-3xs cursor-pointer flex items-center justify-center shrink-0"
                              title="Pratinjau"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <a 
                              href={file.dataUrl} 
                              download={file.name}
                              className="text-orange-600 hover:text-orange-700 font-bold flex items-center justify-center p-1 bg-white border border-slate-200 rounded shadow-3xs shrink-0"
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
            ))}
          </div>
        </div>
      )}

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
