import React from "react";
import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import { Transaction } from "../types";

interface TransactionTableProps {
  transactions: Transaction[];
  isLoading: boolean;
}

export const TransactionTable = ({ transactions, isLoading }: TransactionTableProps) => {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const formatRp = (n: number) => "Rp " + (n ?? 0).toLocaleString("id-ID");

  const formatDate = (s: string) =>
    new Date(s).toLocaleString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statusStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "sukses":
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
      case "pending":
      case "partially_refunded":
        return "bg-amber-50 text-amber-600 border border-amber-100";
      default:
        return "bg-red-50 text-red-600 border border-red-100";
    }
  };

  const statusLabel = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
      case "sukses":
        return "Selesai";
      case "pending":
        return "Pending";
      case "partially_refunded":
        return "Diretur Sebagian";
      case "voided":
        return "Dibatalkan";
      default:
        return status || "Selesai";
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-sm font-medium">
          Memuat data transaksi...
        </div>
      ) : transactions.length === 0 ? (
        <div className="py-20 text-center text-slate-400 text-sm font-medium">
          Belum ada transaksi ditemukan.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Kode Transaksi</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Waktu</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider">Metode Bayar</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Total</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-center">Status</th>
                <th className="px-6 py-4 text-xs font-black text-slate-500 uppercase tracking-wider text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((trx) => (
                <React.Fragment key={trx.id}>
                  <tr className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <span className="text-sm font-bold text-slate-900">{trx.transaction_code || `#${trx.id}`}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-500 font-medium">{formatDate(trx.created_at)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-slate-600 capitalize">{trx.payment_method || "—"}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{formatRp(trx.total_amount)}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${statusStyle(trx.status)}`}>
                        {statusLabel(trx.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setExpandedId(expandedId === trx.id ? null : trx.id)}
                        className="p-2 text-slate-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                        title="Lihat detail"
                      >
                        <MoreHorizontal className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>

                  {/* Expanded detail row */}
                  {expandedId === trx.id && (
                    <tr className="bg-slate-50/80">
                      <td colSpan={6} className="px-6 py-4">
                        <div className="rounded-lg border border-slate-200 overflow-hidden bg-white shadow-inner">
                          <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                            <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Item Transaksi</p>
                          </div>
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-slate-100">
                                <th className="px-4 py-2 text-left text-xs font-bold text-slate-500">Produk</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-500">Harga Satuan</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-500">Qty</th>
                                <th className="px-4 py-2 text-right text-xs font-bold text-slate-500">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                              {(trx.items ?? []).map((item) => (
                                <tr key={item.id}>
                                  <td className="px-4 py-2.5 font-semibold text-slate-800">{item.product_name}</td>
                                  <td className="px-4 py-2.5 text-right text-slate-500">{formatRp(item.unit_price)}</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-slate-700">{item.qty}x</td>
                                  <td className="px-4 py-2.5 text-right font-bold text-slate-900">{formatRp(item.subtotal)}</td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t border-slate-200 bg-slate-50">
                                <td colSpan={3} className="px-4 py-2.5 text-right text-sm font-bold text-slate-700">Total</td>
                                <td className="px-4 py-2.5 text-right text-sm font-black text-blue-600">{formatRp(trx.total_amount)}</td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer count */}
      {!isLoading && transactions.length > 0 && (
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
          <p className="text-xs font-semibold text-slate-500">
            Menampilkan <span className="text-slate-900">{transactions.length}</span> transaksi
          </p>
        </div>
      )}
    </div>
  );
};