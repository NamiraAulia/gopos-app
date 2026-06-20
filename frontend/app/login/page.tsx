"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Lock, Loader2, MonitorSmartphone } from "lucide-react";

// 👇 IMPORT KOMPONEN UI GLOBAL YANG SUDAH DIPISAH
import { Alert } from "../../components/ui/Alert";
import { InputField } from "../../components/ui/InputField";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const response = await fetch(`${API_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember_me: rememberMe }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMsg("Login Berhasil! Mengalihkan ke dashboard...");

        if (result.data && result.data.token) {
          const token = result.data.token;
          localStorage.setItem("token", token);

          const days = rememberMe ? 30 : 1;
          const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
          document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;
        }

        setTimeout(() => router.push("/cashier"), 1000);
      } else {
        setErrorMsg(result.message || "Email atau password salah.");
      }
    } catch (error) {
      setErrorMsg("Koneksi terputus. Pastikan server Backend menyala.");
    } finally {
      setIsLoading(false);
    }
  };

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

            {/* Title & Subtitle */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-1">
                Selamat Datang
              </h2>
              <p className="text-slate-500 text-sm">
                Masuk untuk mengakses dashboard kasir.
              </p>
            </div>

            {/* Alerts Feedback */}
            {successMsg && <Alert type="success" message={successMsg} />}
            {errorMsg && <Alert type="error" message={errorMsg} />}

            {/* Form Utama */}
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
                rightSlot={
                  <a href="#" className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                    Lupa sandi?
                  </a>
                }
              />

              {/* Checkbox "Ingat sesi saya" */}
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

              {/* Tombol Submit */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 text-sm rounded-xl bg-blue-600 text-white font-semibold flex items-center justify-center gap-2"
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