"use client";

import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchSuppliers, fetchTodaySchedule, deleteSupplier } from "@/service/suppliers.service";
import { useSupplierStore } from "../Store/useSupplierStore";
import { SuppliersView } from "../Component/SuppliersView";
import { useAuthStore } from "@/store/authStore";
import type { SupplierDAO } from "../DAO/suppliers.dao";

export default function SuppliersContainer() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user: currentUser } = useAuthStore();

  const {
    searchQuery,
    setSearchQuery,
    activeDayTab,
    setActiveDayTab,
    isModalOpen,
    setIsModalOpen,
    selectedSupplierForEdit,
    setSelectedSupplierForEdit,
  } = useSupplierStore();

  const getEnglishDayName = (dayIndex: number): string => {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return days[dayIndex] || "Monday";
  };

  const getIndonesianDayLabel = (engDay: string): string => {
    const map: Record<string, string> = {
      Monday: "Senin",
      Tuesday: "Selasa",
      Wednesday: "Rabu",
      Thursday: "Kamis",
      Friday: "Jumat",
      Saturday: "Sabtu",
      Sunday: "Minggu",
    };
    return map[engDay] || engDay;
  };

  const currentEngDay = getEnglishDayName(new Date().getDay());

  // Query 1: Fetch Suppliers
  const { data: suppliers = [], isLoading: isSuppliersLoading, refetch: refetchSuppliers } = useQuery({
    queryKey: ["suppliers", searchQuery],
    queryFn: () => fetchSuppliers(searchQuery),
  });

  // Query 2: Fetch Today Schedule
  const { data: scheduleData = { day: currentEngDay, taking_order: [], billing: [], total_sales: 0 }, isLoading: isSchedLoading, refetch: refetchSched } = useQuery({
    queryKey: ["todaySchedule", currentEngDay],
    queryFn: () => fetchTodaySchedule(currentEngDay),
  });

  const loading = isSuppliersLoading || isSchedLoading;

  const deleteMutation = useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
      queryClient.invalidateQueries({ queryKey: ["todaySchedule"] });
      alert("Distributor berhasil dinonaktifkan.");
    },
    onError: (err: any) => {
      alert("Terjadi kesalahan: " + (err.message || "Gagal menghapus"));
    },
  });

  const loadData = () => {
    refetchSuppliers();
    refetchSched();
  };

  const handleOpenCreateModal = () => {
    setSelectedSupplierForEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (supplier: SupplierDAO) => {
    setSelectedSupplierForEdit(supplier);
    setIsModalOpen(true);
  };

  const handleDeleteSupplier = (supplier: SupplierDAO) => {
    if (currentUser?.role !== "admin") {
      alert("Akses Ditolak: Hanya Admin yang berwenang menghapus data distributor.");
      return;
    }

    if (
      confirm(
        `Apakah Anda yakin ingin menonaktifkan distributor "${supplier.name}" dan seluruh kontak sales-nya?`
      )
    ) {
      deleteMutation.mutate(supplier.id);
    }
  };

  // Filter suppliers by Day tab
  const filteredSuppliers = suppliers.filter((sup) => {
    const contacts = sup.sales_contacts || [];
    if (activeDayTab !== "all") {
      const hasSalesOnDay = contacts.some((sc) => sc.visit_day === activeDayTab);
      if (!hasSalesOnDay) return false;
    }
    return true;
  });

  return (
    <SuppliersView
      router={router}
      currentUser={currentUser}
      filteredSuppliers={filteredSuppliers}
      scheduleData={scheduleData}
      currentEngDay={currentEngDay}
      getIndonesianDayLabel={getIndonesianDayLabel}
      loading={loading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      activeDayTab={activeDayTab}
      setActiveDayTab={setActiveDayTab}
      isModalOpen={isModalOpen}
      setIsModalOpen={setIsModalOpen}
      selectedSupplierForEdit={selectedSupplierForEdit}
      loadData={loadData}
      handleOpenCreateModal={handleOpenCreateModal}
      handleOpenEditModal={handleOpenEditModal}
      handleDeleteSupplier={handleDeleteSupplier}
    />
  );
}
