import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { setStoredToken } from "@/lib/axios";
import { supabase } from "@/utils/supabaseClient";

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
      // 1. Sign in via Supabase Auth
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

      // 2. Load user details (numeric ID and Role) from public.users table
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

      // 3. Set global store session values
      const token = authData.session?.access_token || "";
      const user = {
        id: userProfile.id,
        username: userProfile.name,
        role: userProfile.role as 'admin' | 'kasir',
        is_active: userProfile.is_active,
      };

      setSuccessMsg("Login Berhasil! Mengalihkan ke dashboard...");
      setStoredToken(token);
      useAuthStore.setState({ user, token });

      // 4. Set session cookie
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
