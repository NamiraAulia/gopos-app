import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { supabase } from "@/utils/supabaseClient";
import { loginApi } from "../api";

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
      let token = "";
      let user: any = null;

   try {
        const res = await loginApi.login({ email, password, rememberMe });
        if ((res as any)?.success && (res as any)?.data?.token) {
          token = (res as any).data.token;
          const dbUser = (res as any).data.user;
          user = {
            id: dbUser.id,
            username: dbUser.name,
            role: dbUser.role as 'admin' | 'kasir',
            is_active: dbUser.is_active,
          };
        }
      } catch (backendErr) {
        console.warn("Go Backend login error, attempting Supabase fallback:", backendErr);
      }

 if (!token) {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError) {
          setErrorMsg(authError.message === "Invalid login credentials"
            ? "Email atau password salah."
            : authError.message);
          setIsLoading(false);
          return;
        }

        const { data: userProfile, error: profileError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();

        if (profileError || !userProfile) {
          setErrorMsg("Profil pengguna tidak ditemukan di database.");
          setIsLoading(false);
          return;
        }

        if (!userProfile.is_active) {
          setErrorMsg("Akun Anda sedang dinonaktifkan oleh administrator.");
          setIsLoading(false);
          return;
        }

        token = authData.session?.access_token || "";
        user = {
          id: userProfile.id,
          username: userProfile.name,
          role: userProfile.role as 'admin' | 'kasir',
          is_active: userProfile.is_active,
        };
      }

      setSuccessMsg("Login Berhasil! Mengalihkan ke dashboard...");
      localStorage.setItem("token", token);
      useAuthStore.setState({ user, token });

      const days = rememberMe ? 30 : 1;
      const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
      document.cookie = `auth_token=${token}; path=/; expires=${expires}; SameSite=Lax`;

      setTimeout(() => router.push("/cashier"), 1000);
    } catch (error: any) {
      console.error("Login error:", error);
      setErrorMsg("Terjadi kesalahan sistem saat mencoba masuk.");
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
