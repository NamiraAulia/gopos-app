"use client";

import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Phone,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { SupplierModal } from "@/modules/Suppliers/Component/SupplierModal";
import { TodayScheduleWidget } from "@/modules/Suppliers/Component/TodayScheduleWidget";
import { SupplierSearchBar } from "@/modules/Suppliers/Component/SupplierSearchBar";
import type { SupplierDAO, TodayScheduleDataDAO } from "../DAO/suppliers.dao";

const DAYS_TABS = [
  { key: "all", label: "Semua Distributor" },
  { key: "Monday", label: "Senin" },
  { key: "Tuesday", label: "Selasa" },
  { key: "Wednesday", label: "Rabu" },
  { key: "Thursday", label: "Kamis" },
  { key: "Friday", label: "Jumat" },
  { key: "Saturday", label: "Sabtu" },
  { key: "Sunday", label: "Minggu" },
];

interface SuppliersViewProps {
  router: any;
  currentUser: any;
  filteredSuppliers: SupplierDAO[];
  scheduleData: TodayScheduleDataDAO;
  currentEngDay: string;
  getIndonesianDayLabel: (d: string) => string;
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  activeDayTab: string;
  setActiveDayTab: (tab: string) => void;
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedSupplierForEdit: SupplierDAO | null;
  loadData: () => void;
  handleOpenCreateModal: () => void;
  handleOpenEditModal: (sup: SupplierDAO) => void;
  handleDeleteSupplier: (sup: SupplierDAO) => void;
}

export function SuppliersView({
  router,
  currentUser,
  filteredSuppliers,
  scheduleData,
  currentEngDay,
  getIndonesianDayLabel,
  loading,
  searchQuery,
  setSearchQuery,
  activeDayTab,
  setActiveDayTab,
  isModalOpen,
  setIsModalOpen,
  selectedSupplierForEdit,
  loadData,
  handleOpenCreateModal,
  handleOpenEditModal,
  handleDeleteSupplier,
}: SuppliersViewProps) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-6 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/cashier")}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900 flex items-center gap-2">
              <Building className="h-5 w-5 text-blue-600" />
              Manajemen Distributor & Sales
            </h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              Pencatatan distributor, salesman, dan monitoring jadwal kunjungan toko
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            disabled={loading}
            className="flex h-10 px-3.5 items-center justify-center gap-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-blue-600" : ""}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <button
            onClick={handleOpenCreateModal}
            className="flex h-10 px-4 items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-white text-xs font-black uppercase tracking-wider hover:bg-blue-700 transition-all shadow-md shadow-blue-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>Tambah Distributor</span>
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Today's Schedule Widget */}
        <TodayScheduleWidget
          scheduleData={scheduleData as any}
          selectedDayLabel={getIndonesianDayLabel(currentEngDay)}
          onRefresh={loadData}
        />

        {/* Search & Tabs Controls */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="w-full md:w-96">
              <SupplierSearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Day Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {DAYS_TABS.map((tab) => {
                const isActive = activeDayTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDayTab(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200/80"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Suppliers List Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-bold text-sm">
              <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat data distributor...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              <Building className="h-10 w-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold text-slate-600">Tidak ada distributor ditemukan</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Coba sesuaikan kata kunci pencarian atau pilih filter hari yang lain
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 uppercase text-[10px] font-black text-slate-500 tracking-wider">
                  <tr>
                    <th className="px-4 py-3.5">Distributor / PT</th>
                    <th className="px-4 py-3.5">Alamat / Depo</th>
                    <th className="px-4 py-3.5">Daftar Salesman & Jadwal Kunjungan</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-semibold">
                  {filteredSuppliers.map((sup) => {
                    const contacts = sup.sales_contacts || [];
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-4 align-top">
                          <p className="font-black text-slate-900 text-sm">{sup.name}</p>
                          {sup.notes && (
                            <p className="text-[11px] text-slate-400 font-normal mt-0.5">
                              {sup.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-slate-600 text-xs">
                          {sup.address ? sup.address : <span className="text-slate-300 italic">-</span>}
                        </td>
                        <td className="px-4 py-4 align-top">
                          {contacts.length === 0 ? (
                            <span className="text-slate-300 italic">Belum ada sales</span>
                          ) : (
                            <div className="space-y-2">
                              {contacts.map((sc, i) => (
                                <div
                                  key={sc.id || i}
                                  className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-slate-800">
                                      {sc.sales_name}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 font-bold text-[10px] px-2 py-0.5 rounded-full border border-blue-200">
                                      {getIndonesianDayLabel(sc.visit_day || "")} ({sc.visit_day})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                                    {sc.category && <span>Divisi: {sc.category}</span>}
                                    {sc.phone_number && (
                                      <span className="flex items-center gap-1 font-bold text-slate-700">
                                        <Phone className="h-3 w-3 text-emerald-600" /> {sc.phone_number}
                                      </span>
                                    )}
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200/70 text-slate-700">
                                      {sc.visit_type === "taking_order"
                                        ? "Order Barang"
                                        : sc.visit_type === "billing"
                                        ? "Penagihan"
                                        : "Order & Penagihan"}
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-4 align-top text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sup)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                              title="Edit Distributor"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                            {currentUser?.role === "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(sup)}
                                className="p-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                                title="Hapus Distributor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Supplier Create/Edit Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadData}
        supplierToEdit={selectedSupplierForEdit as any}
      />
    </div>
  );
}
