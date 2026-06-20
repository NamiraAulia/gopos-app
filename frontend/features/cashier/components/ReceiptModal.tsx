import { ShieldCheck } from "lucide-react";

type ReceiptModalProps = {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
};

export const ReceiptModal = ({ isOpen, onClose, transaction }: ReceiptModalProps) => {
  if (!isOpen || !transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col">
        <div className="p-8 pb-6 flex flex-col items-center border-b border-slate-100 bg-slate-50">
          <div className="h-16 w-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-4">
            <ShieldCheck className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 text-center leading-tight">Transaksi Berhasil</h2>
          <p className="text-center text-sm text-slate-500 mt-2">Stok gudang diperbarui otomatis.</p>
        </div>

        <div className="p-6 bg-slate-50/50 m-6 mt-0 rounded-xl border border-slate-200">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-bold text-slate-500">Nomor Struk</span>
            <span className="font-bold text-slate-900">{transaction.transaction_code}</span>
          </div>
          <div className="flex justify-between text-sm mb-4">
            <span className="font-bold text-slate-500">Metode</span>
            <span className="font-bold text-slate-900 uppercase">{transaction.payment_method}</span>
          </div>
          <div className="border-t border-slate-200 pt-4 flex justify-between items-center">
            <span className="text-sm font-bold text-slate-500">Total Bayar</span>
            <span className="text-2xl font-black text-blue-600">Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>
        </div>

        <div className="px-6 pb-6 space-y-3 print:hidden">
          <button onClick={() => window.print()} className="w-full h-12 rounded-xl border-2 border-slate-200 text-sm font-bold text-blue-700 hover:bg-slate-50">
            🖨️ Cetak Struk Fisik
          </button>
          <button onClick={onClose} className="w-full h-12 rounded-xl border-2 border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50">
            🛒 Tutup & Transaksi Baru
          </button>
        </div>

        {/* Print Content Area */}
        <div className="hidden print:block text-black font-mono text-sm p-4">
          <h1 className="text-center font-bold text-lg mb-2">GoPOS</h1>
          <p className="text-center mb-4">{transaction.transaction_code}</p>
          <div className="border-b border-dashed border-black mb-2"></div>
          {transaction.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between mb-1">
              <span>{item.qty}x {item.product_name}</span>
              <span>{item.subtotal.toLocaleString("id-ID")}</span>
            </div>
          ))}
          <div className="border-b border-dashed border-black my-2"></div>
          <div className="flex justify-between font-bold">
            <span>TOTAL</span>
            <span>Rp {transaction.total_amount.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    </div>
  );
};