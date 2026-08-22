"use client";

import { useState } from "react";
import { X, Upload, FileText, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { memberApi } from "../api";

interface MemberImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const MemberImportModal = ({
  isOpen,
  onClose,
  onSuccess,
}: MemberImportModalProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<{ name: string; phone?: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setErrorMsg("");
    setSuccessMsg("");
    setFile(selected);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r\n|\n/).filter((l) => l.trim().length > 0);
        
        if (lines.length === 0) {
          setErrorMsg("File CSV kosong.");
          return;
        }

        const items: { name: string; phone?: string }[] = [];
        const startIndex = lines[0].toLowerCase().includes("nama") ? 1 : 0;

        for (let i = startIndex; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
          if (cols[0]) {
            const name = cols[0];
            const phone = cols[1] || "";
            items.push({ name, phone });
          }
        }

        if (items.length === 0) {
          setErrorMsg("Tidak ada baris data member valid yang terdeteksi di CSV.");
        } else {
          setParsedData(items);
        }
      } catch (err: any) {
        setErrorMsg("Gagal membaca file CSV: " + err.message);
      }
    };

    reader.readAsText(selected);
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      setErrorMsg("Pilih file CSV yang berisi data member.");
      return;
    }

    setLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await memberApi.importMembersCsv(parsedData);
      if (res.success) {
        setSuccessMsg(res.message);
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        setErrorMsg(res.message || "Gagal mengimpor data member.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat mengimpor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Import Member (CSV)</h3>
              <p className="text-xs text-slate-500 font-medium">Unggah file CSV berisi data pelanggan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-700 text-xs font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-700 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="p-4 border-2 border-dashed border-slate-200 hover:border-blue-500 rounded-2xl bg-slate-50/50 text-center transition-colors">
            <input
              type="file"
              accept=".csv"
              id="member-csv-input"
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="member-csv-input"
              className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4"
            >
              <div className="p-3 bg-white text-slate-600 rounded-xl shadow-xs border border-slate-200">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-blue-600 hover:underline">
                  Klik untuk unggah file CSV
                </span>
                <p className="text-[11px] text-slate-400 mt-1">Format kolom: Nama, Nomor HP (Opsional)</p>
              </div>
              {file && (
                <span className="mt-2 text-xs font-extrabold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  📄 {file.name} ({parsedData.length} baris)
                </span>
              )}
            </label>
          </div>

          {parsedData.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700">Preview Data ({parsedData.length} baris):</span>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-2 bg-white text-xs space-y-1 divide-y divide-slate-100">
                {parsedData.slice(0, 10).map((item, idx) => (
                  <div key={idx} className="pt-1.5 flex justify-between text-slate-700 font-medium">
                    <span>{idx + 1}. {item.name}</span>
                    <span className="text-slate-400 font-mono">{item.phone || "(Tanpa No HP)"}</span>
                  </div>
                ))}
                {parsedData.length > 10 && (
                  <div className="text-[11px] text-slate-400 text-center pt-2 italic">
                    ... dan {parsedData.length - 10} baris lainnya
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={loading || parsedData.length === 0}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-black rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Mengimpor...
              </>
            ) : (
              "Import Sekarang"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
