import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { loginApi } from "../api";
import { setStoredToken } from "@/lib/axios";

export function useLogin() {
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
      const result = await loginApi.login({ email, password, rememberMe });

      if (result.success && result.data) {
        const { token, user } = result.data;
        
        setSuccessMsg("Login Berhasil! Mengalihkan ke dashboard...");
        
        setStoredToken(token);
        
        // Populate the client-side authentication store
        useAuthStore.setState({ user, token });

        const days = rememberMe ? 30 : 1;
        const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
        document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;

        setTimeout(() => router.push("/cashier"), 1000);
      } else {
        setErrorMsg(result.message || "Email atau password salah.");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      const msg = error.response?.data?.message || "Koneksi terputus. Pastikan server Backend menyala.";
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
