"use client";

import { useState } from "react";
import { ChevronRight, AlertTriangle, PackageSearch } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { RestockAlert } from "./RestockAlert";
import { RestockCard } from "./RestockCard";
import { useRestock } from "../hooks/useRestock";

export function RestockView() {
  const { items, isLoading } = useRestock();
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");

  // Get unique list of supplier names
  const suppliers = Array.from(
    new Set(items.map((item) => item.supplier_name).filter(Boolean))
  ) as string[];

  // Filter items based on selected supplier
  const filteredItems = selectedSupplier === "all"
    ? items
    : items.filter((item) => item.supplier_name === selectedSupplier);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <AlertTriangle className="h-4 w-4" />
            <ChevronRight className="h-4 w-4" />
            <span className="text-sm font-bold text-slate-900">Asumsi Restock</span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">Asumsi Restock</h2>
              <p className="text-slate-500 text-sm mt-1">
                Daftar produk yang harus segera dipesan ulang agar jualan tidak terhenti.
              </p>
            </div>
          </div>

          {/* Supplier Filter Bar */}
          {!isLoading && items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Saring Berdasarkan Supplier Salesman:
              </span>
              <div className="w-full sm:w-72">
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-colors cursor-pointer"
                >
                  <option value="all">Semua Supplier ({items.length} Produk)</option>
                  {suppliers.map((sup) => {
                    const count = items.filter((i) => i.supplier_name === sup).length;
                    return (
                      <option key={sup} value={sup}>
                        {sup} ({count} Produk)
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* Banner Peringatan */}
          <RestockAlert itemCount={filteredItems.length} />

          {/* Conditional Rendering State */}
          {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center">
              <PackageSearch className="h-12 w-12 mb-3 animate-pulse" />
              Menghitung algoritma penjualan...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-bold text-lg">Stok aman terkendali!</p>
              <p className="text-slate-400 text-sm mt-2">Tidak ada produk yang mendekati batas kritis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Looping Data ke Komponen Kartu */}
              {filteredItems.map((item) => (
                <RestockCard key={item.product_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
