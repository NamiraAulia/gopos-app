import { PackageX } from "lucide-react";

interface RestockAlertProps {
  itemCount: number;
}

export const RestockAlert = ({ itemCount }: RestockAlertProps) => {
  if (itemCount === 0) return null; // Sembunyikan jika tidak ada barang kritis

  return (
    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8 flex items-start gap-4">
      <div className="bg-red-100 p-3 rounded-full text-red-600 shrink-0">
        <PackageX className="h-6 w-6" />
      </div>
      <div>
        <h3 className="text-red-800 font-bold text-lg mb-1">
          Ada {itemCount} produk dalam status kritis!
        </h3>
        <p className="text-red-600 text-sm font-medium">
          Berdasarkan kecepatan penjualan 7 hari terakhir, produk-produk di bawah ini diprediksi akan habis dalam waktu kurang dari 3 hari.
        </p>
      </div>
    </div>
  );
};