"use client";

import { User, Lock, Loader2, MonitorSmartphone } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { InputField } from "@/components/ui/InputField";
import { useLogin } from "../hooks/useLogin";

export function LoginForm() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    errorMsg,
    successMsg,
    handleLogin,
  } = useLogin();

  return (
    <div className="bg-slate-50 h-screen flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="flex flex-col w-full max-w-md max-h-[90vh] bg-white rounded-3xl shadow-2xl ring-1 ring-slate-100 overflow-y-auto">
        <div className="flex flex-col justify-center p-6 md:px-10 md:py-8">
          <div className="max-w-sm mx-auto w-full">
            <div className="flex items-center gap-2 text-blue-600 mb-6">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <MonitorSmartphone className="h-5 w-5" />
              </div>
              <h1 className="text-2xl font-bold">GoPOS</h1>
            </div>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Selamat Datang
              </h2>
              <p className="text-slate-500 text-sm">
                Masuk untuk mengakses dashboard kasir.
              </p>
            </div>

            {successMsg && <Alert type="success" message={successMsg} />}
            {errorMsg && <Alert type="error" message={errorMsg} />}

            <form className="space-y-4" onSubmit={handleLogin}>
              
              <InputField
                id="email"
                label="Alamat Email"
                type="email"
                value={email}
                placeholder="nama@email.com"
                icon={<User size={20} />}
                onChange={(e) => setEmail(e.target.value)}
              />

              <InputField
                id="password"
                label="Password"
                type="password"
                value={password}
                placeholder="••••••••"
                icon={<Lock size={20} />}
                onChange={(e) => setPassword(e.target.value)}
              />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="size-5 text-blue-600 focus:ring-blue-500 border-slate-300 rounded-lg cursor-pointer transition-all"
                  />
                  <label htmlFor="remember-me" className="text-sm font-semibold text-slate-600 cursor-pointer select-none">
                    Ingat sesi saya
                  </label>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-sm rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="animate-spin size-5 text-white" />
                      Memverifikasi...
                    </>
                  ) : (
                    "Masuk ke Dashboard"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
