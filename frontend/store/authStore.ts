import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api, { setStoredToken, clearStoredToken } from '@/lib/axios';
import { handleResponse } from '@/lib/handleResponse';
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
        const { ok, data, message } = await handleResponse<{
          token: string;
          user: User;
        }>(
          api.post('/auth/login', { username, password })
        );

        if (ok && data) {
          setStoredToken(data.token);
          set({ user: data.user, token: data.token });

          await get().refreshActiveShift();
        }

        return { ok, message };
      },


      logout: () => {
        clearStoredToken();
        set({ user: null, token: null, activeShift: null });
      },


      setActiveShift: (shift) => set({ activeShift: shift }),

      refreshActiveShift: async () => {
        const { user } = get();
        if (!user) return;

        const { ok, data } = await handleResponse<Shift>(
          api.get('/shifts/active')
        );

        set({ activeShift: ok ? data : null });
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