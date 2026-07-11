import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { MoreHorizontal, Receipt, XCircle, Eye } from "lucide-react";
import { Transaction } from "../types";

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
  onVoid: (id: number) => Promise<void>;
}

const STATUS_STYLE: Record<string, string> = {
  completed: "bg-emerald-50 text-emerald-600 border-emerald-200",
  voided: "bg-red-50 text-red-500 border-red-200",
  pending: "bg-amber-50 text-amber-600 border-amber-200",
};

const STATUS_LABEL: Record<string, string> = {
  completed: "Selesai",
  voided: "Batal",
  pending: "Pending",
};

const PAYMENT_STYLE: Record<string, string> = {
  cash: "bg-slate-100 text-slate-700 border-slate-200",
  qris: "bg-indigo-50 text-indigo-600 border-indigo-150",
  transfer: "bg-blue-50 text-blue-600 border-blue-150",
};

export const RecentTransactionsTable = ({
  transactions,
  isLoading,
  onVoid,
}: RecentTransactionsTableProps) => {
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
  const [voidingId, setVoidingId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleVoid = async (id: number, code: string) => {
    setActiveMenuId(null);
    if (confirm(`Apakah Anda yakin ingin membatalkan transaksi ${code}?`)) {
      try {
        setVoidingId(id);
        await onVoid(id);
        alert("Transaksi berhasil dibatalkan");
      } catch (err) {
        alert("Gagal membatalkan transaksi");
      } finally {
        setVoidingId(null);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Receipt className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-black text-sm text-slate-800">Transaksi Terakhir</h3>
        </div>
        <Link 
          href="/transactions" 
          className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors"
        >
          Lihat Semua
        </Link>
      </div>

      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50/75 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3">No. Struk</th>
              <th className="px-5 py-3">Waktu</th>
              <th className="px-5 py-3">Metode</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3 text-center">Status</th>
              <th className="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold animate-pulse">
                  Memuat data transaksi...
                </td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-slate-400 font-bold">
                  Belum ada transaksi hari ini.
                </td>
              </tr>
            ) : (
              transactions.slice(0, 5).map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-bold text-slate-800 whitespace-nowrap">
                    {trx.transaction_code}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-medium whitespace-nowrap">
                    {new Date(trx.created_at).toLocaleString("id-ID", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${
                      PAYMENT_STYLE[trx.payment_method.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {trx.payment_method}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right font-black text-blue-600 whitespace-nowrap">
                    {formatRp(trx.total_amount)}
                  </td>
                  <td className="px-5 py-3.5 text-center whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase border ${
                      STATUS_STYLE[trx.status.toLowerCase()] || "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                      {STATUS_LABEL[trx.status.toLowerCase()] || trx.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right relative whitespace-nowrap">
                    {voidingId === trx.id ? (
                      <span className="text-[10px] text-slate-400 font-bold animate-pulse">Memproses...</span>
                    ) : (
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === trx.id ? null : trx.id)}
                        className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    )}

                    {/* Dropdown Menu */}
                    {activeMenuId === trx.id && (
                      <div
                        ref={dropdownRef}
                        className="absolute right-5 mt-1 w-36 rounded-xl bg-white shadow-lg ring-1 ring-black/5 z-20 p-1 border border-slate-100 text-left"
                      >
                        <Link
                          href={`/transactions/${trx.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Lihat Detail
                        </Link>
                        {trx.status !== "voided" && (
                          <button
                            onClick={() => handleVoid(trx.id, trx.transaction_code)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Batalkan
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};