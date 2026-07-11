"use client";

import { useEffect, useState } from "react";
import { ChevronRight, AlertTriangle, PackageSearch } from "lucide-react";
import Sidebar from "@/components/Sidebar";
import { RestockItem } from "../../features/restock/types";
import { RestockAlert } from "../../features/restock/components/RestockAlert";
import { RestockCard } from "../../features/restock/components/RestockCard";

export default function RestockPage() {
  const [items, setItems] = useState<RestockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const token = localStorage.getItem("token");
      
      const response = await fetch(`${API_URL}/api/v1/restock-suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      
      if (result.success && result.data) {
        setItems(result.data);
      }
    } catch (error) {
      console.error("Gagal load asumsi restock", error);
    } finally {
      setIsLoading(false);
    }
  };

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
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">Asumsi Restock</h2>
            <p className="text-slate-500 text-sm mt-1">
              Daftar produk yang harus segera dipesan ulang agar jualan tidak terhenti.
            </p>
          </div>

          {/* 👇 Panggil Banner Peringatan */}
          <RestockAlert itemCount={items.length} />

          {/* Conditional Rendering State */}
          {isLoading ? (
            <div className="text-center py-20 text-slate-400 font-bold flex flex-col items-center">
              <PackageSearch className="h-12 w-12 mb-3 animate-pulse" />
              Menghitung algoritma penjualan...
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <p className="text-slate-500 font-bold text-lg">Stok aman terkendali!</p>
              <p className="text-slate-400 text-sm mt-2">Tidak ada produk yang mendekati batas kritis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* 👇 Looping Data ke Komponen Kartu */}
              {items.map((item) => (
                <RestockCard key={item.product_id} item={item} />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}