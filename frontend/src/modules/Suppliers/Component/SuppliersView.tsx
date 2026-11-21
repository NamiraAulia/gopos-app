"use client";

import {
  Building,
  Plus,
  Edit2,
  Trash2,
  Phone,
  RefreshCw,
  Truck,
  ChevronRight,
} from "lucide-react";
import Sidebar from "@/components/Sidebar";
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
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />

      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header Breadcrumb */}
        <header className="h-16 sm:h-18 bg-white border-b-2 border-slate-200 flex items-center justify-between px-6 sm:px-8 shrink-0 shadow-sm relative z-30">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-xl bg-blue-100 text-blue-700 shadow-xs">
              <Truck className="h-6 w-6 stroke-[2.5]" />
            </div>
            <div className="flex items-center gap-2 text-slate-500">
              <ChevronRight className="h-4 w-4 stroke-[2.5]" />
              <span className="text-base sm:text-lg font-black text-slate-900">Manajemen Distributor & Sales</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex h-12 px-5 items-center justify-center gap-2 rounded-xl border-2 border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm sm:text-base font-black transition-all cursor-pointer shadow-xs"
            >
              <RefreshCw className={`h-4.5 w-4.5 stroke-[2.5] ${loading ? "animate-spin text-blue-600" : ""}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
            <button
              onClick={handleOpenCreateModal}
              className="flex h-12 px-5 items-center justify-center gap-2 rounded-xl bg-blue-600 text-white text-sm sm:text-base font-black hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20 hover:shadow-lg cursor-pointer"
            >
              <Plus className="h-5 w-5 stroke-[2.5]" />
              <span>Tambah Distributor</span>
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-50/50">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Title Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Distributor & Sales Toko</h2>
                <p className="text-slate-600 text-sm sm:text-base font-bold mt-1">
                  Pencatatan data distributor, salesman, dan monitoring jadwal kunjungan toko Anda.
                </p>
              </div>
            </div>
        {/* Today's Schedule Widget */}
        <TodayScheduleWidget
          scheduleData={scheduleData as any}
          selectedDayLabel={getIndonesianDayLabel(currentEngDay)}
          onRefresh={loadData}
        />

        {/* Search & Tabs Controls */}
        <div className="bg-white rounded-2xl p-5 border-2 border-slate-200 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="w-full md:w-96">
              <SupplierSearchBar value={searchQuery} onChange={setSearchQuery} />
            </div>

            {/* Day Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
              {DAYS_TABS.map((tab) => {
                const isActive = activeDayTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveDayTab(tab.key)}
                    className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200/80"
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
        <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-black text-base">
              <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Memuat data distributor...
            </div>
          ) : filteredSuppliers.length === 0 ? (
            <div className="p-16 text-center text-slate-400 font-medium">
              <Building className="h-12 w-12 text-slate-300 mx-auto mb-3 stroke-[2.5]" />
              <p className="font-black text-slate-700 text-base">Tidak ada distributor ditemukan</p>
              <p className="text-sm font-bold text-slate-500 mt-1">
                Coba sesuaikan kata kunci pencarian atau pilih filter hari yang lain
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[800px]">
                <thead className="bg-slate-100 border-b-2 border-slate-200 uppercase text-xs sm:text-sm font-black text-slate-800 tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Distributor / PT</th>
                    <th className="px-6 py-4">Alamat / Depo</th>
                    <th className="px-6 py-4">Daftar Salesman & Jadwal Kunjungan</th>
                    <th className="px-6 py-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSuppliers.map((sup) => {
                    const contacts = sup.sales_contacts || [];
                    return (
                      <tr key={sup.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-5 align-top">
                          <p className="font-black text-slate-900 text-base sm:text-lg">{sup.name}</p>
                          {sup.notes && (
                            <p className="text-xs sm:text-sm text-slate-500 font-bold mt-1">
                              {sup.notes}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-5 align-top text-slate-700 font-bold text-sm sm:text-base">
                          {sup.address ? sup.address : <span className="text-slate-400 italic">-</span>}
                        </td>
                        <td className="px-6 py-5 align-top">
                          {contacts.length === 0 ? (
                            <span className="text-slate-400 font-bold italic text-sm">Belum ada sales</span>
                          ) : (
                            <div className="space-y-2.5">
                              {contacts.map((sc, i) => (
                                <div
                                  key={sc.id || i}
                                  className="p-3 rounded-xl border-2 border-slate-200 bg-slate-50/60 text-sm space-y-1.5"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-black text-slate-900 text-sm sm:text-base">
                                      {sc.sales_name}
                                    </span>
                                    <span className="bg-blue-50 text-blue-700 font-black text-xs px-2.5 py-1 rounded-full border border-blue-200">
                                      {getIndonesianDayLabel(sc.visit_day || "")} ({sc.visit_day})
                                    </span>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs sm:text-sm text-slate-600 font-bold">
                                    {sc.category && <span>Divisi: {sc.category}</span>}
                                    {sc.phone_number && (
                                      <span className="flex items-center gap-1.5 font-black text-slate-900">
                                        <Phone className="h-4 w-4 text-emerald-600 stroke-[2.5]" /> {sc.phone_number}
                                      </span>
                                    )}
                                    <span className="text-xs font-black px-2 py-0.5 rounded bg-slate-200 text-slate-800">
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
                        <td className="px-6 py-5 align-top text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(sup)}
                              className="p-2.5 rounded-xl text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer border border-blue-200"
                              title="Edit Distributor"
                            >
                              <Edit2 className="h-5 w-5 stroke-[2.5]" />
                            </button>
                            {currentUser?.role === "admin" && (
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(sup)}
                                className="p-2.5 rounded-xl text-red-600 hover:bg-red-50 transition-colors cursor-pointer border border-red-200"
                                title="Hapus Distributor"
                              >
                                <Trash2 className="h-5 w-5 stroke-[2.5]" />
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
      </div>
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
