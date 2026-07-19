import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/utils/supabaseClient';
import type { User, Shift } from '@/types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  activeShift: Shift | null;
  isHydrated: boolean; 
  login: (username: string, password: string) => Promise<{ ok: boolean; message: string }>;
  logout: () => void;
  setActiveShift: (shift: Shift | null) => void;
  refreshActiveShift: () => Promise<void>;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      activeShift: null,
      isHydrated: false,

      login: async (username, password) => {
        try {
          const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email: username,
            password,
          });

          if (authError) throw authError;

          const { data: userProfile, error: profileError } = await supabase
            .from("users")
            .select("*")
            .eq("email", username)
            .single();

          if (profileError || !userProfile) {
            throw new Error("Profil pengguna tidak ditemukan.");
          }

          if (!userProfile.is_active) {
            throw new Error("Akun dinonaktifkan oleh administrator.");
          }

          const token = authData.session?.access_token || "";
          const user = {
            id: userProfile.id,
            username: userProfile.name,
            role: userProfile.role as 'admin' | 'kasir',
            is_active: userProfile.is_active,
          };

          localStorage.setItem('token', token);
          set({ user, token });

          await get().refreshActiveShift();

          return { ok: true, message: "Login berhasil" };
        } catch (err: any) {
          return { ok: false, message: err.message || "Gagal masuk." };
        }
      },

      logout: () => {
        localStorage.removeItem('token');
        if (typeof window !== 'undefined') {
          document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        set({ user: null, token: null, activeShift: null });
      },

      setActiveShift: (shift) => set({ activeShift: shift }),

      refreshActiveShift: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from("shifts")
            .select("*")
            .eq("user_id", user.id)
            .eq("status", "open")
            .maybeSingle();

          if (error) throw error;
          set({ activeShift: data as any });
        } catch (err) {
          console.error("Gagal memuat shift aktif:", err);
          set({ activeShift: null });
        }
      },

      checkAuth: () => {
        return !!get().token && !!get().user;
      },
    }),

    {
      name: 'gopos-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) state.isHydrated = true;
      },
    }
  )
);

export const useUser = () => useAuthStore((s) => s.user);
export const useIsAdmin = () => useAuthStore((s) => s.user?.role === 'admin');
export const useIsKasir = () => useAuthStore((s) => s.user?.role === 'kasir');
export const useActiveShift = () => useAuthStore((s) => s.activeShift);
export const useIsShiftOpen = () => useAuthStore((s) => s.activeShift?.status === 'open');
export const useIsHydrated = () => useAuthStore((s) => s.isHydrated);