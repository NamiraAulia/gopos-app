"use client";

import { ChevronRight, AlertTriangle, PackageSearch } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { RestockAlert } from "./RestockAlert";
import { RestockCard } from "./RestockCard";
import type { RestockItemDTO } from "../DTO/restock.dto";

interface RestockViewProps {
  items: RestockItemDTO[];
  filteredItems: RestockItemDTO[];
  suppliers: string[];
  selectedSupplier: string;
  setSelectedSupplier: (supplier: string) => void;
  isLoading: boolean;
}

export function RestockView({
  items,
  filteredItems,
  suppliers,
  selectedSupplier,
  setSelectedSupplier,
  isLoading,
}: RestockViewProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 flex items-center px-6 sm:px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700 shadow-xs">
              <AlertTriangle className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Lembar Belanja Stok</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Lembar Belanja Stok</h2>
              <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                Daftar produk yang harus segera dipesan ulang agar jualan tidak terhenti.
              </p>
            </div>
          </div>

          {/* Supplier Filter Bar */}
          {!isLoading && items.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 bg-white p-5 rounded-2xl border-2 border-slate-200 shadow-sm">
              <span className="text-sm sm:text-base font-black text-slate-700 uppercase tracking-wider">
                Saring Berdasarkan Supplier Salesman:
              </span>
              <div className="w-full sm:w-80">
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-sm sm:text-base font-bold text-slate-800 outline-none focus:border-blue-500 transition-colors cursor-pointer"
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
