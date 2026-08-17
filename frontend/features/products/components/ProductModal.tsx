import { useState, useEffect, useCallback } from "react";
import { Product } from "@/types/api";
import { useMutationProducts } from "../hooks";
import { Calculator, Lightbulb } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProduct: Product | null;
}

const UNIT_OPTIONS = [
  { value: "pcs", label: "Pcs" },
  { value: "rcg", label: "Renceng" },
  { value: "btl", label: "Botol" },
  { value: "bks", label: "Bungkus" },
  { value: "dus", label: "Dus / Karton" },
  { value: "pack", label: "Pack / Pak" },
  { value: "kg", label: "Kg" },
  { value: "ltr", label: "Liter" },
];

const UNIT_BIG_OPTIONS = [
  { value: "dus", label: "Dus / Karton" },
  { value: "pack", label: "Pack Besar" },
  { value: "krat", label: "Krat" },
  { value: "lusin", label: "Lusin" },
  { value: "ikat", label: "Ikat" },
];

// const unitLabel = (val: string) =>
//   UNIT_OPTIONS.find((o) => o.value === val)?.label.split(" ")[0] ?? val;

// const unitBigLabel = (val: string) =>
//   UNIT_BIG_OPTIONS.find((o) => o.value === val)?.label.split(" ")[0] ?? val;

const unitLabel = (val: string) => {
  if (!val) return "pcs"; // Fallback default jika unit kosong
  const found = UNIT_OPTIONS.find((o) => o.value === val.toLowerCase().trim());
  if (!found || !found.label) return val;
  return found.label.split(" ")[0];
};

const unitBigLabel = (val: string) => {
  if (!val) return "dus"; // Fallback default jika unit grosir kosong
  const found = UNIT_BIG_OPTIONS.find((o) => o.value === val.toLowerCase().trim());
  if (!found || !found.label) return val;
  return found.label.split(" ")[0];
};

const formatRupiah = (n: number) => (n > 0 ? n.toLocaleString("id-ID") : "");

const parseNumber = (val: string): number => {
  const raw = val.replace(/\D/g, "");
  return raw ? parseInt(raw, 10) : 0;
};

const EMPTY_FORM: Partial<Product> = {
  barcode: "",
  name: "",
  price: 0,
  best_price: 0,
  stock: 0,
  min_stock: 5,
  unit: "pcs",
  unit_big: "",
  conversion: 0,
  price_big: 0,
};

interface FieldProps {
  label: string;
  helper?: string;
  required?: boolean;
  children: React.ReactNode;
}

const Field = ({ label, helper, required, children }: FieldProps) => (
  <div className="flex flex-col gap-1">
    <label className="text-xs font-bold text-slate-600 tracking-wide uppercase">
      {label}
      {required && <span className="text-blue-500 ml-0.5">*</span>}
    </label>
    {children}
    {helper && (
      <p className="text-[11px] text-slate-400 leading-snug mt-0.5">{helper}</p>
    )}
  </div>
);

const inputClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white placeholder:text-slate-300";

const inputMoneyClass =
  "w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 transition-all bg-white text-blue-600 font-bold placeholder:text-slate-300";

const disabledClass =
  "w-full border border-slate-100 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-300 cursor-not-allowed";


export const ProductModal = ({
  isOpen,
  onClose,
  onSuccess,
  existingProduct,
}: ProductModalProps) => {
  const [formData, setFormData] = useState<Partial<Product>>(EMPTY_FORM);
  const [suppliersList, setSuppliersList] = useState<Array<{ id: number; name: string }>>([]);

  const [parentStock, setParentStock] = useState(0);
  const [childStock, setChildStock] = useState(0);

  const {
    createProduct,
    updateProduct,
    loading: isMutating,
  } = useMutationProducts();

  const isGrosirActive = !!(formData.unit_big && formData.unit_big !== "");
  const conversion = formData.conversion ?? 0;

  useEffect(() => {
    if (!isOpen) return;

    // Load supplier list for dropdown
    const loadSuppliers = async () => {
      try {
        const { supplierApi } = await import("@/features/suppliers/api");
        const res = await supplierApi.getSuppliers();
        if (res.success && res.data) {
          setSuppliersList(res.data);
        }
      } catch (err) {
        console.warn("Gagal memuat supplier list:", err);
      }
    };
    loadSuppliers();

    if (existingProduct) {
      setFormData(existingProduct);
      const conv = existingProduct.conversion ?? 0;
      const hasGrosir = !!existingProduct.unit_big && conv > 0;

      if (hasGrosir) {
        setParentStock(Math.floor(existingProduct.stock / conv));
        setChildStock(existingProduct.stock % conv);
      } else {
        setParentStock(0);
        setChildStock(existingProduct.stock);
      }
    } else {
      setFormData(EMPTY_FORM);
      setParentStock(0);
      setChildStock(0);
    }
  }, [existingProduct, isOpen]);

  useEffect(() => {
    if (!isGrosirActive || conversion <= 0) return;

    const totalStock = parentStock * conversion + childStock;
    setFormData((prev) => ({ ...prev, stock: totalStock }));
  }, [parentStock, childStock, conversion, isGrosirActive]);

  useEffect(() => {
    if (!isGrosirActive) {
      setParentStock(0);
      setChildStock(0);
      setFormData((prev) => ({
        ...prev,
        unit_big: "",
        conversion: 0,
        price_big: 0,
      }));
    }
  }, [isGrosirActive]);

  const totalEceranNormal = (formData.price ?? 0) * conversion;
  const selisihHemat = totalEceranNormal - (formData.price_big ?? 0);
  const showPricePreview =
    isGrosirActive &&
    conversion > 0 &&
    (formData.price ?? 0) > 0 &&
    (formData.price_big ?? 0) > 0;

  const setField = useCallback(
    <K extends keyof Product>(field: K, value: Product[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setMoney = useCallback(
    (field: keyof Product, raw: string) => {
      setField(field, parseNumber(raw) as Product[typeof field]);
    },
    [setField],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      unit_choice: "small",
    };

    try {
      let res;
      if (existingProduct?.id) {
        res = await updateProduct(existingProduct.id, payload);
      } else {
        res = await createProduct(payload);
      }

      if (res?.success) {
        onSuccess();
        onClose();
      } else {
        alert(`Gagal menyimpan: ${res?.message ?? "Terjadi kesalahan."}`);
      }
    } catch {
      alert("Tidak dapat terhubung ke server. Periksa koneksi Anda.");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.55)", backdropFilter: "blur(3px)" }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden border border-slate-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex-shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">
              {existingProduct ? "Edit Produk" : "Tambah Produk Baru"}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {existingProduct
                ? "Perubahan langsung tersimpan ke database"
                : "Isi data barang yang akan ditambahkan ke toko"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xl leading-none font-light"
            aria-label="Tutup"
          >
            ×
          </button>
        </div>

        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto flex-1 px-6 py-5 space-y-5"
          id="product-form"
        >
          <div>
            <SectionLabel>Identitas Produk</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Barcode">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Scan atau ketik..."
                  value={formData.barcode ?? ""}
                  onChange={(e) => setField("barcode", e.target.value)}
                />
              </Field>
              <Field label="Nama Barang" required>
                <input
                  type="text"
                  className={inputClass}
                  placeholder="Contoh: Kopi Kapal Api Mix"
                  required
                  value={formData.name ?? ""}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Distributor / Supplier">
                <select
                  className={inputClass + " bg-white"}
                  value={formData.supplier_id ?? ""}
                  onChange={(e) => {
                    const selectedId = e.target.value ? parseInt(e.target.value, 10) : undefined;
                    const foundSup = suppliersList.find((s) => s.id === selectedId);
                    setFormData((prev) => ({
                      ...prev,
                      supplier_id: selectedId,
                      supplier_name: foundSup ? foundSup.name : "",
                    }));
                  }}
                >
                  <option value="">-- Pilih / Tanpa Distributor --</option>
                  {suppliersList.map((sup) => (
                    <option key={sup.id} value={sup.id}>
                      {sup.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>

          <Divider />

          <div>
            <SectionLabel>Harga</SectionLabel>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <Field label="Harga Jual Eceran (Rp)" required>
                <input
                  type="text"
                  className={inputMoneyClass}
                  placeholder="0"
                  required
                  value={formatRupiah(formData.price ?? 0)}
                  onChange={(e) => setMoney("price", e.target.value)}
                />
              </Field>
              <Field label="Harga Khusus Member (Rp)">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="0"
                  value={formatRupiah(formData.price_member ?? 0)}
                  onChange={(e) => setMoney("price_member", e.target.value)}
                />
              </Field>
              <Field label="Harga Modal / HPP (Rp)">
                <input
                  type="text"
                  className={inputClass}
                  placeholder="0"
                  value={formatRupiah(formData.best_price ?? 0)}
                  onChange={(e) => setMoney("best_price", e.target.value)}
                />
              </Field>
            </div>
          </div>

          <Divider />

          <div>
            <SectionLabel>Stok & Satuan</SectionLabel>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <Field label="Satuan Eceran">
                <select
                  className={inputClass + " bg-white"}
                  value={formData.unit ?? "pcs"}
                  onChange={(e) => setField("unit", e.target.value)}
                >
                  {UNIT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>

              <Field
                label="Min. Stok (Notifikasi)"
                helper="Baris tabel berubah merah jika stok di bawah angka ini."
              >
                <input
                  type="text"
                  className={inputClass}
                  placeholder="5"
                  value={formatRupiah(formData.min_stock ?? 0)}
                  onChange={(e) => setMoney("min_stock", e.target.value)}
                />
              </Field>
            </div>

            <div className="mt-3">
              {!isGrosirActive ? (
                <Field
                  label={`Total Stok (${unitLabel(formData.unit ?? "pcs")})`}
                  required
                >
                  <input
                    type="text"
                    className={inputClass}
                    placeholder="0"
                    required
                    value={formData.stock ?? ""}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                      setField("stock", val === "" ? 0 : parseFloat(val) || 0);
                    }}
                  />
                </Field>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label={`Stok Masuk (${unitBigLabel(formData.unit_big ?? "")})`}
                      required
                    >
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="0"
                        value={parentStock || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setParentStock(val === "" ? 0 : parseInt(val, 10));
                        }}
                      />
                    </Field>
                    <Field
                      label={`Sisa Eceran (${unitLabel(formData.unit ?? "pcs")})`}
                      helper="Satuan kecil yang sudah keluar dari kemasan besar."
                    >
                      <input
                        type="text"
                        className={inputClass}
                        placeholder="0"
                        value={childStock || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9.,]/g, "").replace(",", ".");
                          setChildStock(val === "" ? 0 : parseFloat(val) || 0);
                        }}
                      />
                    </Field>
                  </div>

                  {conversion > 0 && (
                    <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2">
                      <Calculator className="h-4 w-4 text-blue-500 shrink-0" />
                      <p className="text-xs text-blue-700">
                        <span className="font-bold">Total stok tersimpan:</span>{" "}
                        ({parentStock} × {conversion}) + {childStock} ={" "}
                        <span className="font-black text-blue-600">
                          {(
                            parentStock * conversion +
                            childStock
                          ).toLocaleString("id-ID")}{" "}
                          {unitLabel(formData.unit ?? "pcs")}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Divider />

          <div>
            <div className="flex items-center justify-between">
              <SectionLabel>Pengaturan Grosir</SectionLabel>
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                Opsional
              </span>
            </div>

            <div className="mt-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <Field label="Satuan Besar">
                  <select
                    className={inputClass + " bg-white"}
                    value={formData.unit_big ?? ""}
                    onChange={(e) => {
                      const val = e.target.value;
                      setField("unit_big", val);
                      if (!val) {
                        setFormData((prev) => ({
                          ...prev,
                          unit_big: "",
                          conversion: 0,
                          price_big: 0,
                        }));
                        setParentStock(0);
                        setChildStock(0);
                      }
                    }}
                  >
                    <option value="">-- Tidak Ada --</option>
                    {UNIT_BIG_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field
                  label={`Isi per ${isGrosirActive ? unitBigLabel(formData.unit_big ?? "") : "Satuan Besar"}`}
                >
                  {isGrosirActive ? (
                    <input
                      type="text"
                      className={inputClass}
                      placeholder="Contoh: 12"
                      value={formatRupiah(formData.conversion ?? 0)}
                      onChange={(e) => setMoney("conversion", e.target.value)}
                    />
                  ) : (
                    <div className={disabledClass}>—</div>
                  )}
                </Field>

                <Field label="Harga per Grosir (Rp)">
                  {isGrosirActive ? (
                    <input
                      type="text"
                      className={inputMoneyClass}
                      placeholder="0"
                      value={formatRupiah(formData.price_big ?? 0)}
                      onChange={(e) => setMoney("price_big", e.target.value)}
                    />
                  ) : (
                    <div className={disabledClass}>—</div>
                  )}
                </Field>
              </div>

              {showPricePreview ? (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800 leading-relaxed space-y-0.5">
                      <p className="font-bold text-amber-900">
                        Analisis Harga Grosir
                      </p>
                      <p>
                        1 {unitBigLabel(formData.unit_big ?? "")} berisi{" "}
                        <span className="font-bold">
                          {conversion} {unitLabel(formData.unit ?? "pcs")}
                        </span>
                        . Jika dijual eceran semua, totalnya{" "}
                        <span className="font-bold">
                          Rp {totalEceranNormal.toLocaleString("id-ID")}
                        </span>
                        .
                      </p>
                      <p>
                        Dengan harga grosir{" "}
                        <span className="font-bold">
                          Rp {(formData.price_big ?? 0).toLocaleString("id-ID")}
                        </span>
                        , pelanggan grosir{" "}
                        {selisihHemat > 0 ? (
                          <>
                            <span className="font-black text-green-700">
                              hemat Rp {selisihHemat.toLocaleString("id-ID")}
                            </span>{" "}
                            per {unitBigLabel(formData.unit_big ?? "")}.
                          </>
                        ) : selisihHemat < 0 ? (
                          <span className="font-black text-red-600">
                            bayar lebih mahal Rp{" "}
                            {Math.abs(selisihHemat).toLocaleString("id-ID")} vs
                            eceran. Periksa harga grosir!
                          </span>
                        ) : (
                          <span className="text-amber-700">
                            sama dengan total harga eceran.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              ) : isGrosirActive ? (
                <p className="text-[11px] text-slate-400 text-center py-1">
                  Lengkapi isi per satuan besar dan harga grosir untuk melihat
                  analisis harga.
                </p>
              ) : (
                <p className="text-[11px] text-slate-400 text-center py-1">
                  Pilih satuan besar untuk mengaktifkan fitur grosir.
                </p>
              )}
            </div>
          </div>
        </form>

        <div className="px-6 py-4 border-t border-slate-100 bg-white flex-shrink-0 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Batal
          </button>
          <button
            type="submit"
            form="product-form"
            disabled={isMutating}
            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-bold text-white transition-colors"
          >
            {isMutating ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Menyimpan...
              </span>
            ) : existingProduct ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Produk"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
    {children}
  </p>
);

const Divider = () => <hr className="border-slate-100" />;
