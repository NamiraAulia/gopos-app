"use client";

import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";

export default function ForbiddenView({
  title = "Akses Ditolak (403 Forbidden)",
  message = "Maaf, akun Anda terdaftar sebagai Kasir dan tidak memiliki izin untuk membuka rute ini. Halaman ini khusus untuk Administrator.",
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans text-slate-900">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center p-6 bg-slate-50/50">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-8 shadow-xl text-center flex flex-col items-center animate-in fade-in zoom-in-95 duration-200">
          <div className="h-16 w-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-5 shadow-inner">
            <ShieldAlert className="h-8 w-8 stroke-[2.5]" />
          </div>

          <span className="text-[10px] font-black tracking-widest text-red-500 uppercase bg-red-50 px-3 py-1 rounded-full border border-red-100 mb-3">
            Error 403 · Access Denied
          </span>

          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {title}
          </h1>

          <p className="text-xs text-slate-500 font-medium leading-relaxed mt-2 mb-6">
            {message}
          </p>

          <Link
            href="/cashier"
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-wider transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            Kembali ke Dashboard Kasir
          </Link>
        </div>
      </main>
    </div>
  );
}
