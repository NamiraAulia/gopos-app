"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Lock, Mail, Loader2, Store } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const { login, user, isHydrated } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isHydrated && user) {
      router.replace("/cashier");
    }
  }, [isHydrated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsLoading(true);
    try {
      const res = await login(email.trim(), password);
      if (res.ok) {
        router.push("/cashier");
      } else {
        setErrorMsg(res.message || "Gagal masuk.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md md:max-w-lg lg:max-w-xl bg-white rounded-3xl shadow-2xl p-7 sm:p-10 border-2 border-slate-100">
        <div className="text-center mb-8">
          <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-xl shadow-blue-600/30 mx-auto mb-4">
            <Store className="h-8 w-8 sm:h-10 sm:w-10 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
            GoPOS Login
          </h1>
          <p className="text-sm sm:text-base font-bold text-slate-500 mt-1.5">
            Masuk ke sistem kasir toko Anda
          </p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 text-red-700 text-sm sm:text-base font-bold rounded-xl">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Email Pengguna
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[2.5]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@toko.com"
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-lg font-bold transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-black text-slate-700 uppercase tracking-wider mb-2">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 stroke-[2.5]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 pl-12 pr-4 bg-slate-50 border-2 border-slate-200 rounded-xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-base sm:text-lg font-bold transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-14 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-black text-base sm:text-lg rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Masuk Aplikasi</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
