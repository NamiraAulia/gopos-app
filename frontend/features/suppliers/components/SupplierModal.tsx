import { useState, useEffect } from "react";
import { X, Plus, Trash2, UserPlus, Building, Phone, Calendar, Tag } from "lucide-react";
import type { Supplier, CreateSupplierPayload, CreateSupplierSalesInput, VisitType } from "../types";

type SupplierModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
};

const DAYS_OF_WEEK = [
  { value: "Monday", label: "Senin" },
  { value: "Tuesday", label: "Selasa" },
  { value: "Wednesday", label: "Rabu" },
  { value: "Thursday", label: "Kamis" },
  { value: "Friday", label: "Jumat" },
  { value: "Saturday", label: "Sabtu" },
  { value: "Sunday", label: "Minggu" },
];

export const SupplierModal = ({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}: SupplierModalProps) => {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [salesContacts, setSalesContacts] = useState<CreateSupplierSalesInput[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (supplierToEdit) {
        setName(supplierToEdit.name || "");
        setAddress(supplierToEdit.address || "");
        setNotes(supplierToEdit.notes || "");
        if (supplierToEdit.sales_contacts && supplierToEdit.sales_contacts.length > 0) {
          setSalesContacts(
            supplierToEdit.sales_contacts.map((s) => ({
              id: s.id,
              sales_name: s.sales_name || "",
              category: s.category || "",
              phone_number: s.phone_number || "",
              visit_day: s.visit_day || "Monday",
              visit_type: s.visit_type || "both",
              notes: s.notes || "",
            }))
          );
        } else {
          addSalesRow();
        }
      } else {
        setName("");
        setAddress("");
        setNotes("");
        setSalesContacts([
          {
            sales_name: "",
            category: "Sales General",
            phone_number: "",
            visit_day: "Monday",
            visit_type: "both",
            notes: "",
          },
        ]);
      }
    }
  }, [isOpen, supplierToEdit]);

  if (!isOpen) return null;

  const addSalesRow = () => {
    setSalesContacts((prev) => [
      ...prev,
      {
        sales_name: "",
        category: "Sales General",
        phone_number: "",
        visit_day: "Monday",
        visit_type: "both",
        notes: "",
      },
    ]);
  };

  const removeSalesRow = (index: number) => {
    setSalesContacts((prev) => prev.filter((_, i) => i !== index));
  };

  const updateSalesRow = (index: number, field: keyof CreateSupplierSalesInput, value: any) => {
    setSalesContacts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Nama distributor wajib diisi!");
      return;
    }

    const validSales = salesContacts.filter((s) => s.sales_name.trim() !== "");
    if (validSales.length === 0) {
      alert("Masukkan minimal 1 kontak sales / salesman!");
      return;
    }

    setLoading(true);
    try {
      const { supplierApi } = await import("../api");
      const payload: CreateSupplierPayload = {
        name: name.trim(),
        address: address.trim(),
        notes: notes.trim(),
        sales_contacts: validSales,
      };

      let res;
      if (supplierToEdit) {
        res = await supplierApi.editSupplier(supplierToEdit.id, payload);
      } else {
        res = await supplierApi.createSupplier(payload);
      }

      if (res.success) {
        alert(res.message);
        onSuccess();
        onClose();
      } else {
        alert(res.message || "Gagal menyimpan distributor");
      }
    } catch (err: any) {
      alert("Terjadi kesalahan: " + (err.message || "Gagal menyimpan"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">
                {supplierToEdit ? "Edit Distributor & Sales" : "Tambah Distributor Baru"}
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Kelola data distributor dan kontak salesman kunjungan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 flex items-center justify-center transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Supplier Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nama Distributor / PT <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: PT Indofood Sukses Makmur"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Alamat Kantor / Depo
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Jl. Industri No. 12 Depo Surabaya"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                  Catatan Toko (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Minimum order Rp 500rb gratis ongkir"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Sales Contacts List */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <UserPlus className="h-4 w-4 text-blue-600" /> Kontak Sales / Salesman ({salesContacts.length})
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Satu distributor dapat memiliki beberapa salesman untuk divisi / hari berbeda
                </p>
              </div>
              <button
                type="button"
                onClick={addSalesRow}
                className="h-8 px-3 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold transition-colors flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" /> Tambah Sales
              </button>
            </div>

            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
              {salesContacts.map((sc, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                      Sales #{idx + 1}
                    </span>
                    {salesContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeSalesRow(idx)}
                        className="text-red-400 hover:text-red-600 p-1 rounded-md hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Nama Salesman <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Budi Santoso"
                        value={sc.sales_name}
                        onChange={(e) => updateSalesRow(idx, "sales_name", e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Divisi / Kategori Produk
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Sales Makanan / Minuman"
                        value={sc.category}
                        onChange={(e) => updateSalesRow(idx, "category", e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        No Telp / WhatsApp
                      </label>
                      <input
                        type="text"
                        placeholder="08123456789"
                        value={sc.phone_number}
                        onChange={(e) => updateSalesRow(idx, "phone_number", e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 px-3 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Hari Kunjungan
                      </label>
                      <select
                        value={sc.visit_day}
                        onChange={(e) => updateSalesRow(idx, "visit_day", e.target.value)}
                        className="w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none bg-white cursor-pointer"
                      >
                        {DAYS_OF_WEEK.map((d) => (
                          <option key={d.value} value={d.value}>
                            {d.label} ({d.value})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                        Tujuan Kunjungan
                      </label>
                      <select
                        value={sc.visit_type}
                        onChange={(e) => updateSalesRow(idx, "visit_type", e.target.value as VisitType)}
                        className="w-full h-9 rounded-lg border border-slate-200 px-2 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none bg-white cursor-pointer"
                      >
                        <option value="both">Order & Penagihan</option>
                        <option value="taking_order">Order Barang (TO)</option>
                        <option value="billing">Menagih / Tukar Faktur</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-12 rounded-xl bg-blue-600 text-white font-bold text-sm uppercase tracking-wider hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Memproses..." : supplierToEdit ? "Simpan Perubahan" : "Tambah Distributor"}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="py-3 px-6 rounded-xl border border-slate-200 text-slate-600 text-sm font-bold hover:bg-slate-50 transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
