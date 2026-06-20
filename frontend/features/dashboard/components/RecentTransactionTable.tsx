import { MoreHorizontal } from "lucide-react";
import { Transaction } from "../types";

interface RecentTransactionsTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const RecentTransactionsTable = ({ transactions, isLoading }: RecentTransactionsTableProps) => {
  const formatRp = (n: number) => "Rp " + n.toLocaleString("id-ID");

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex items-center justify-between">
        <h3 className="font-bold text-slate-900">Transaksi Terakhir</h3>
        <button className="text-xs font-bold text-blue-600 hover:underline">Lihat Semua</button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-black tracking-widest">
            <tr>
              <th className="px-6 py-4">ID Transaksi</th>
              <th className="px-6 py-4">Waktu</th>
              <th className="px-6 py-4 text-right">Total</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">Memuat data...</td>
              </tr>
            ) : transactions.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-bold">Belum ada transaksi hari ini.</td>
              </tr>
            ) : (
              transactions.slice(0, 5).map((trx) => (
                <tr key={trx.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm text-slate-900">{trx.transaction_code}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-500">
                    {new Date(trx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-6 py-4 text-right font-black text-sm text-blue-600">{formatRp(trx.total_amount)}</td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-wider border border-emerald-100">
                      {trx.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-1.5 text-slate-300 hover:text-slate-600">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
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