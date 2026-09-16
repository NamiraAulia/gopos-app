"use client";

import { useState, useEffect } from "react";
import { useCartStore } from "@/store/useCartStore";
import { cashierDAO } from "../DAO/cashier.dao";
import { handleReceiptPrint } from "@/lib/printer";
import {
  Banknote,
  CreditCard,
  Landmark,
  BookOpen,
  AlertCircle,
  Layers,
  Check,
  Sparkles,
} from "lucide-react";
import type { PaymentSplitItem } from "../DTO/cashier.dto";

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (transactionData: any) => void;
  grandTotal: number;
  onShiftRequired: () => void;
  memberId?: number;
  discountAmount?: number;
};

export const PaymentModal = ({
  isOpen,
  onClose,
  onSuccess,
  grandTotal,
  onShiftRequired,
  memberId,
  discountAmount,
}: PaymentModalProps) => {
  const { cart, clearCart } = useCartStore();
  const [isLoading, setIsLoading] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "QRIS" | "TRANSFER" | "KASBON" | "SPLIT"
  >("CASH");
  const [amountPaid, setAmountPaid] = useState<string>("");
  const [bankInfo, setBankInfo] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [dpAmountStr, setDpAmountStr] = useState<string>("0");

  // State checklist untuk metode Split Payment
  const [useSplitCash, setUseSplitCash] = useState(true);
  const [useSplitQris, setUseSplitQris] = useState(true);
  const [useSplitTransfer, setUseSplitTransfer] = useState(false);
  const [useSplitKasbon, setUseSplitKasbon] = useState(false);

  // Nominal Split Payment
  const [splitCash, setSplitCash] = useState<string>("");
  const [splitCashReceived, setSplitCashReceived] = useState<string>("");
  const [splitQris, setSplitQris] = useState<string>("");
  const [splitTransfer, setSplitTransfer] = useState<string>("");
  const [splitTransferBank, setSplitTransferBank] = useState<string>("");
  const [splitKasbon, setSplitKasbon] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      setAmountPaid("");
      setBankInfo("");
      setRefNumber("");
      setDpAmountStr("0");
      setUseSplitCash(true);
      setUseSplitQris(true);
      setUseSplitTransfer(false);
      setUseSplitKasbon(false);
      setSplitCash("");
      setSplitCashReceived("");
      setSplitQris("");
      setSplitTransfer("");
      setSplitTransferBank("");
      setSplitKasbon("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const amountPaidNum = parseInt(amountPaid.replace(/\D/g, "")) || 0;
  const dpNum = parseInt(dpAmountStr.replace(/\D/g, "")) || 0;
  const sisaKasbon = Math.max(0, grandTotal - dpNum);
  const change = amountPaidNum - grandTotal;
  const splitCashNum = useSplitCash
    ? parseInt(splitCash.replace(/\D/g, "")) || 0
    : 0;
  const splitCashReceivedRaw =
    useSplitCash && splitCashReceived
      ? parseInt(splitCashReceived.replace(/\D/g, "")) || 0
      : 0;
  const splitCashReceivedNum =
    useSplitCash && splitCashReceived.trim() !== ""
      ? splitCashReceivedRaw
      : splitCashNum;

  const splitQrisNum = useSplitQris
    ? parseInt(splitQris.replace(/\D/g, "")) || 0
    : 0;
  const splitTransferNum = useSplitTransfer
    ? parseInt(splitTransfer.replace(/\D/g, "")) || 0
    : 0;
  const splitKasbonNum = useSplitKasbon
    ? parseInt(splitKasbon.replace(/\D/g, "")) || 0
    : 0;

  const totalSplitAllocated =
    splitCashNum + splitQrisNum + splitTransferNum + splitKasbonNum;
  const splitRemaining = grandTotal - totalSplitAllocated;
  const splitCashChange = Math.max(0, splitCashReceivedNum - splitCashNum);

  const activeCheckedCount =
    (useSplitCash ? 1 : 0) +
    (useSplitQris ? 1 : 0) +
    (useSplitTransfer ? 1 : 0) +
    (useSplitKasbon ? 1 : 0);

  const isCashReceivedValid =
    !useSplitCash ||
    splitCashReceived.trim() === "" ||
    splitCashReceivedRaw >= splitCashNum;

  const isSplitValid =
    activeCheckedCount >= 2 &&
    totalSplitAllocated === grandTotal &&
    isCashReceivedValid &&
    (!useSplitKasbon || (useSplitKasbon && splitKasbonNum > 0 && !!memberId));

  const isPaymentValid =
    cart.length > 0 &&
    ((paymentMethod === "CASH" && amountPaidNum >= grandTotal) ||
      paymentMethod === "QRIS" ||
      paymentMethod === "TRANSFER" ||
      (paymentMethod === "KASBON" && !!memberId && dpNum <= grandTotal) ||
      (paymentMethod === "SPLIT" && isSplitValid));

  const getQuickAmounts = (total: number): number[] => {
    let steps = [50000, 100000, 200000, 500000];
    if (total < 10000) {
      steps = [10000, 20000, 50000];
    } else if (total < 20000) {
      steps = [20000, 50000, 100000];
    } else if (total < 50000) {
      steps = [50000, 100000, 200000];
    } else {
      steps = [50000, 100000, 200000, 500000];
    }

    const candidates = steps.map((step) => Math.ceil(total / step) * step);
    const uniqueCandidates = Array.from(new Set(candidates))
      .filter((val) => val >= total)
      .sort((a, b) => a - b);
    return uniqueCandidates.slice(0, 3);
  };

  const fillRemainingSplit = (
    target: "cash" | "qris" | "transfer" | "kasbon",
  ) => {
    const currentVal =
      target === "cash"
        ? splitCashNum
        : target === "qris"
          ? splitQrisNum
          : target === "transfer"
            ? splitTransferNum
            : splitKasbonNum;

    const newTargetVal = Math.max(0, currentVal + splitRemaining);
    const strVal = newTargetVal > 0 ? newTargetVal.toString() : "";

    if (target === "cash") {
      setSplitCash(strVal);
    } else if (target === "qris") {
      setSplitQris(strVal);
    } else if (target === "transfer") {
      setSplitTransfer(strVal);
    } else if (target === "kasbon") {
      setSplitKasbon(strVal);
    }
  };

  const handleConfirmPayment = async () => {
    if (!isPaymentValid || isLoading) return;

    const idempotencyKey =
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : "idemp-" +
          Date.now() +
          "-" +
          Math.random().toString(36).substring(2, 9);

    let paymentMethodPayload:
      | "cash"
      | "qris"
      | "transfer"
      | "kasbon"
      | "split" = paymentMethod.toLowerCase() as any;
    let amountPaidFinal = grandTotal;
    let splitsPayload: PaymentSplitItem[] | undefined = undefined;

    if (paymentMethod === "CASH") {
      amountPaidFinal = amountPaidNum;
    } else if (paymentMethod === "KASBON") {
      amountPaidFinal = dpNum;
    } else if (paymentMethod === "SPLIT") {
      const splits: PaymentSplitItem[] = [];
      if (useSplitCash && splitCashNum > 0)
        splits.push({ method: "cash", amount: splitCashNum });
      if (useSplitQris && splitQrisNum > 0)
        splits.push({ method: "qris", amount: splitQrisNum });
      if (useSplitTransfer && splitTransferNum > 0) {
        splits.push({
          method: "transfer",
          amount: splitTransferNum,
          bank_info: splitTransferBank || undefined,
        });
      }
      if (useSplitKasbon && splitKasbonNum > 0)
        splits.push({ method: "kasbon", amount: splitKasbonNum });

      splitsPayload = splits;
      amountPaidFinal =
        splitCashReceivedNum + splitQrisNum + splitTransferNum + splitKasbonNum;
    }

    const payload = {
      items: cart.map((item) => {
        const hasCustom = item.custom_price != null && item.custom_price > 0;
        const effectivePrice = hasCustom
          ? Number(item.custom_price)
          : item.unit_choice === "big"
            ? Number(item.price_big)
            : Number(item.price);
        return {
          product_id: Number(item.id),
          qty: Number(item.qty),
          unit_price: effectivePrice,
          custom_price: hasCustom ? effectivePrice : undefined,
          unit_choice: item.unit_choice || "small",
        };
      }),
      payment_method: paymentMethodPayload,
      amount_paid: amountPaidFinal,
      member_id: memberId || undefined,
      discount_amount: discountAmount || 0,
      idempotency_key: idempotencyKey,
      payment_splits: splitsPayload,
    };

    setIsLoading(true);
    let result;
    try {
      result = await cashierDAO.checkout(payload);
    } catch (err: any) {
      result = { success: false, message: err.message };
    } finally {
      setIsLoading(false);
    }

    if (result.success && result.data) {
      clearCart();

      handleReceiptPrint({ transaction: result.data }).catch((err) => {
        console.error("Auto-print gagal:", err);
      });

      onSuccess(result.data);
    } else {
      alert(result.message || "Transaksi gagal.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-2xl bg-white p-5 sm:p-6 shadow-2xl my-auto">
        <div className="text-center mb-5">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Total Tagihan
          </p>
          <h2 className="text-3xl font-black text-blue-600 mt-1">
            Rp {grandTotal.toLocaleString("id-ID")}
          </h2>
        </div>

        {/* 5-Method Grid Selector */}
        <div className="grid grid-cols-5 gap-1.5 sm:gap-2 mb-5">
          <button
            type="button"
            onClick={() => setPaymentMethod("CASH")}
            className={`py-3 rounded-xl border-2 text-[11px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs ${
              paymentMethod === "CASH"
                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            }`}
          >
            <Banknote className="h-4 w-4 shrink-0" /> TUNAI
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("QRIS")}
            className={`py-3 rounded-xl border-2 text-[11px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs ${
              paymentMethod === "QRIS"
                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            }`}
          >
            <CreditCard className="h-4 w-4 shrink-0" /> QRIS
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("TRANSFER")}
            className={`py-3 rounded-xl border-2 text-[11px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs ${
              paymentMethod === "TRANSFER"
                ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-600/20"
                : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            }`}
          >
            <Landmark className="h-4 w-4 shrink-0" /> BANK
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("KASBON")}
            className={`py-3 rounded-xl border-2 text-[11px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs ${
              paymentMethod === "KASBON"
                ? "border-red-600 bg-red-600 text-white shadow-md shadow-red-600/20"
                : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
            }`}
          >
            <BookOpen className="h-4 w-4 shrink-0" /> KASBON
          </button>
          <button
            type="button"
            onClick={() => setPaymentMethod("SPLIT")}
            className={`py-3 rounded-xl border-2 text-[11px] sm:text-xs font-black transition-all flex flex-col items-center justify-center gap-1 cursor-pointer shadow-2xs ${
              paymentMethod === "SPLIT"
                ? "border-indigo-600 bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                : "border-slate-200 text-indigo-700 bg-indigo-50/50 hover:bg-indigo-50"
            }`}
          >
            <Layers className="h-4 w-4 shrink-0" /> SPLIT
          </button>
        </div>

        {/* MODE: CASH */}
        {paymentMethod === "CASH" && (
          <div className="space-y-4 mb-5 animate-in fade-in duration-150">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Uang Cepat
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <button
                  type="button"
                  onClick={() => setAmountPaid(grandTotal.toString())}
                  className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 cursor-pointer ${
                    amountPaidNum === grandTotal
                      ? "border-blue-600 text-blue-600 bg-blue-50 shadow-2xs"
                      : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                  }`}
                >
                  Uang Pas
                </button>
                {getQuickAmounts(grandTotal).map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountPaid(amt.toString())}
                    className={`py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all border-2 cursor-pointer ${
                      amountPaidNum === amt
                        ? "border-blue-600 text-blue-600 bg-blue-50 shadow-2xs"
                        : "border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                    }`}
                  >
                    Rp {amt.toLocaleString("id-ID")}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Uang Tunai Diterima
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-500 text-lg">
                  Rp
                </span>
                <input
                  type="text"
                  value={
                    amountPaidNum === 0
                      ? ""
                      : amountPaidNum.toLocaleString("id-ID")
                  }
                  onChange={(e) =>
                    setAmountPaid(e.target.value.replace(/\D/g, ""))
                  }
                  className="w-full h-14 sm:h-16 rounded-xl border-2 border-slate-300 pl-14 pr-4 text-2xl font-black text-slate-900 focus:border-blue-600 outline-none transition-all"
                  autoFocus
                />
              </div>
            </div>

            <div
              className={`border-2 rounded-2xl p-4 text-center ${
                change >= 0
                  ? "border-emerald-500 bg-emerald-50"
                  : "border-slate-200 bg-slate-50"
              }`}
            >
              <p
                className={`text-xs font-bold uppercase tracking-wider ${
                  change >= 0 ? "text-emerald-700" : "text-slate-500"
                }`}
              >
                Kembalian
              </p>
              <p
                className={`text-2xl sm:text-3xl font-black mt-0.5 ${
                  change >= 0 ? "text-emerald-600" : "text-slate-400"
                }`}
              >
                {change >= 0 ? `Rp ${change.toLocaleString("id-ID")} ` : "Rp 0"}
              </p>
            </div>
          </div>
        )}

        {/* MODE: TRANSFER
        {paymentMethod === "TRANSFER" && (
          <div className="space-y-4 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Informasi Bank / Rekening Tujuan
              </label>
              <input
                type="text"
                placeholder="Contoh: BCA - Rekening Toko (123456)"
                value={bankInfo}
                onChange={(e) => setBankInfo(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
              />
            </div>
          <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Nomor Referensi / Nama Pengirim (Opsional)
              </label>
              <input
                type="text"
                placeholder="Contoh: Ref 98765 atau a/n Budi"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full h-11 rounded-xl border-2 border-slate-200 px-4 text-xs font-bold text-slate-900 focus:border-blue-600 outline-none transition-all placeholder:text-slate-300 bg-white"
              />
            </div>
          </div>
        )} */}

        {/* MODE: KASBON */}
        {paymentMethod === "KASBON" && (
          <div className="space-y-4 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            {!memberId ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-black text-amber-900">
                    Member Belum Dipilih!
                  </p>
                  <p className="font-medium mt-0.5">
                    Silakan tutup modal ini dan pilih Member / Pelanggan di
                    bagian atas keranjang kasir terlebih dahulu.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Dibayar Sekarang / Uang Muka DP (Rp)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs">
                      Rp
                    </span>
                    <input
                      type="text"
                      value={dpNum === 0 ? "0" : dpNum.toLocaleString("id-ID")}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/\D/g, "");
                        setDpAmountStr(cleaned);
                      }}
                      placeholder="0"
                      className="w-full h-12 rounded-xl border-2 border-slate-200 pl-10 pr-4 text-base font-black text-slate-900 focus:border-blue-600 outline-none transition-all bg-white"
                    />
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium mt-1">
                    Isi Rp 0 jika pelanggan kasbon 100% tanpa DP
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200/80 space-y-1.5 font-semibold text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Total Belanja</span>
                    <span>Rp {grandTotal.toLocaleString("id-ID")}</span>
                  </div>
                  {dpNum > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Dibayar Sekarang (DP)</span>
                      <span>-Rp {dpNum.toLocaleString("id-ID")}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-red-600 font-black pt-1 border-t border-red-200/60 text-sm">
                    <span>Masuk Utang Kasbon</span>
                    <span>Rp {sisaKasbon.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE: SPLIT PAYMENT (CHECKLIST-DRIVEN) */}
        {paymentMethod === "SPLIT" && (
          <div className="space-y-3.5 mb-5 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header info */}
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                Centang Metode yang Digunakan:
              </span>
              <span className="font-black text-indigo-700">
                Rp {totalSplitAllocated.toLocaleString("id-ID")} / Rp{" "}
                {grandTotal.toLocaleString("id-ID")}
              </span>
            </div>

            {/* Checklist Tombol Pemilih Metode */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  useSplitCash
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useSplitCash}
                  onChange={(e) => {
                    setUseSplitCash(e.target.checked);
                    if (!e.target.checked) {
                      setSplitCash("");
                      setSplitCashReceived("");
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <span>Tunai</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  useSplitQris
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useSplitQris}
                  onChange={(e) => {
                    setUseSplitQris(e.target.checked);
                    if (!e.target.checked) setSplitQris("");
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <span>QRIS</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  useSplitTransfer
                    ? "border-blue-600 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useSplitTransfer}
                  onChange={(e) => {
                    setUseSplitTransfer(e.target.checked);
                    if (!e.target.checked) {
                      setSplitTransfer("");
                      setSplitTransferBank("");
                    }
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4 cursor-pointer"
                />
                <span>Transfer</span>
              </label>

              <label
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-xs font-bold cursor-pointer transition-all ${
                  useSplitKasbon
                    ? "border-red-600 bg-red-50 text-red-900"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <input
                  type="checkbox"
                  checked={useSplitKasbon}
                  onChange={(e) => {
                    setUseSplitKasbon(e.target.checked);
                    if (!e.target.checked) setSplitKasbon("");
                  }}
                  className="rounded text-red-600 focus:ring-red-500 h-4 w-4 cursor-pointer"
                />
                <span>Kasbon</span>
              </label>
            </div>

            {/* Warning if less than 2 methods selected */}
            {activeCheckedCount < 2 && (
              <p className="text-[11px] text-amber-700 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                Centang minimal 2 metode di atas untuk menggunakan pembayaran
                kombinasi (split payment).
              </p>
            )}

            {/* Split Form: Tunai */}
            {useSplitCash && (
              <div className="p-3.5 rounded-xl border-2 border-blue-200 bg-blue-50/40 space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Banknote className="h-4 w-4 text-blue-600" /> 1. Porsi
                    Tagihan Tunai
                  </span>
                  <button
                    type="button"
                    onClick={() => fillRemainingSplit("cash")}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Isi Sisa Tagihan
                  </button>
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">
                      Nominal yang Dibayar Tunai
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        placeholder="0"
                        value={
                          splitCashNum === 0
                            ? ""
                            : splitCashNum.toLocaleString("id-ID")
                        }
                        onChange={(e) => {
                          const cleaned = e.target.value.replace(/\D/g, "");
                          setSplitCash(cleaned);
                        }}
                        className="w-full h-11 rounded-lg border-2 border-slate-300 pl-9 pr-3 text-sm font-black text-slate-900 bg-white focus:border-blue-600 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[11px] font-bold text-slate-500">
                        Uang Lembaran / Fisik Diterima (Opsional, jika uang
                        lebih)
                      </label>
                      {splitCashReceived.trim() !== "" && (
                        <button
                          type="button"
                          onClick={() => setSplitCashReceived("")}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                        >
                          Kosongkan (Uang Pas)
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                        Rp
                      </span>
                      <input
                        type="text"
                        placeholder={
                          splitCashNum > 0
                            ? `Uang pas (Rp ${splitCashNum.toLocaleString("id-ID")})`
                            : "Uang pas (Kosongkan jika pas)"
                        }
                        value={
                          splitCashReceived === ""
                            ? ""
                            : (parseInt(splitCashReceived.replace(/\D/g, "")) ||
                                  0) === 0
                              ? ""
                              : (
                                  parseInt(
                                    splitCashReceived.replace(/\D/g, ""),
                                  ) || 0
                                ).toLocaleString("id-ID")
                        }
                        onChange={(e) =>
                          setSplitCashReceived(
                            e.target.value.replace(/\D/g, ""),
                          )
                        }
                        className="w-full h-11 rounded-lg border-2 border-slate-300 pl-9 pr-3 text-sm font-black text-slate-900 bg-white focus:border-blue-600 outline-none placeholder:text-slate-400 placeholder:font-medium"
                      />
                    </div>
                  </div>

                  {splitCashChange > 0 && (
                    <div className="p-2 rounded-lg bg-emerald-100/70 border border-emerald-300 flex justify-between items-center text-xs font-bold text-emerald-800">
                      <span>Kembalian Uang Tunai:</span>
                      <span className="font-black text-sm text-emerald-700">
                        Rp {splitCashChange.toLocaleString("id-ID")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Split Form: QRIS */}
            {useSplitQris && (
              <div className="p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/70 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <CreditCard className="h-4 w-4 text-blue-600" /> 2. Nominal
                    QRIS
                  </span>
                  <button
                    type="button"
                    onClick={() => fillRemainingSplit("qris")}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Isi Sisa Tagihan
                  </button>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                    Rp
                  </span>
                  <input
                    type="text"
                    placeholder="0"
                    value={
                      splitQrisNum === 0
                        ? ""
                        : splitQrisNum.toLocaleString("id-ID")
                    }
                    onChange={(e) =>
                      setSplitQris(e.target.value.replace(/\D/g, ""))
                    }
                    className="w-full h-11 rounded-lg border-2 border-slate-300 pl-9 pr-3 text-sm font-black text-slate-900 bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Split Form: Transfer */}
            {useSplitTransfer && (
              <div className="p-3.5 rounded-xl border-2 border-slate-200 bg-slate-50/70 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <Landmark className="h-4 w-4 text-blue-600" /> 3. Nominal
                    Bank Transfer
                  </span>
                  <button
                    type="button"
                    onClick={() => fillRemainingSplit("transfer")}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline cursor-pointer"
                  >
                    Isi Sisa Tagihan
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="0"
                      value={
                        splitTransferNum === 0
                          ? ""
                          : splitTransferNum.toLocaleString("id-ID")
                      }
                      onChange={(e) =>
                        setSplitTransfer(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full h-11 rounded-lg border-2 border-slate-300 pl-9 pr-3 text-sm font-black text-slate-900 bg-white focus:border-blue-600 outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    placeholder="Bank / Catatan (Opsional)"
                    value={splitTransferBank}
                    onChange={(e) => setSplitTransferBank(e.target.value)}
                    className="w-full h-11 rounded-lg border-2 border-slate-300 px-3 text-xs font-bold text-slate-900 bg-white focus:border-blue-600 outline-none"
                  />
                </div>
              </div>
            )}

            {/* Split Form: Kasbon */}
            {useSplitKasbon && (
              <div className="p-3.5 rounded-xl border-2 border-red-200 bg-red-50/40 space-y-2 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <BookOpen className="h-4 w-4 text-red-600" /> 4. Nominal
                    Masuk Kasbon Member
                  </span>
                  {memberId && (
                    <button
                      type="button"
                      onClick={() => fillRemainingSplit("kasbon")}
                      className="text-[11px] font-bold text-red-600 hover:text-red-800 underline cursor-pointer"
                    >
                      Isi Sisa Tagihan
                    </button>
                  )}
                </div>
                {!memberId ? (
                  <p className="text-[11px] text-amber-700 font-bold bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                    Member belum dipilih! Tutup modal dan pilih Member di
                    keranjang kasir jika ingin mengaktifkan kasbon.
                  </p>
                ) : (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                      Rp
                    </span>
                    <input
                      type="text"
                      placeholder="0"
                      value={
                        splitKasbonNum === 0
                          ? ""
                          : splitKasbonNum.toLocaleString("id-ID")
                      }
                      onChange={(e) =>
                        setSplitKasbon(e.target.value.replace(/\D/g, ""))
                      }
                      className="w-full h-11 rounded-lg border-2 border-slate-300 pl-9 pr-3 text-sm font-black text-slate-900 bg-white focus:border-blue-600 outline-none"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Status Sisa / Pas */}
            <div
              className={`p-3.5 rounded-xl border-2 font-bold text-xs flex justify-between items-center ${
                splitRemaining === 0
                  ? "bg-emerald-50 border-emerald-400 text-emerald-900"
                  : splitRemaining > 0
                    ? "bg-amber-50 border-amber-300 text-amber-900"
                    : "bg-rose-50 border-rose-300 text-rose-900"
              }`}
            >
              <span>
                {splitRemaining === 0 ? (
                  <span className="flex items-center gap-1.5 font-black text-emerald-700">
                    <Check className="h-4 w-4" /> Alokasi Pembayaran Pas (Lunas)
                  </span>
                ) : splitRemaining > 0 ? (
                  "Sisa Tagihan Belum Dialokasikan:"
                ) : (
                  "Kelebihan Alokasi Tagihan:"
                )}
              </span>
              <span className="font-black text-base">
                {splitRemaining === 0
                  ? "PAS"
                  : splitRemaining > 0
                    ? `Rp ${splitRemaining.toLocaleString("id-ID")}`
                    : `-Rp ${Math.abs(splitRemaining).toLocaleString("id-ID")}`}
              </span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            type="button"
            onClick={handleConfirmPayment}
            disabled={!isPaymentValid || isLoading}
            className="w-full h-13 sm:h-14 rounded-xl bg-blue-600 text-white text-sm sm:text-base font-black uppercase tracking-wide hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            {isLoading ? "Memproses..." : "Selesaikan Transaksi"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 text-xs sm:text-sm font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
          >
            Batal Pembayaran
          </button>
        </div>
      </div>
    </div>
  );
};
