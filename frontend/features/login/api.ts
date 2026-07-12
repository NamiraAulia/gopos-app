import api from "@/lib/axios";
import type { LoginPayload, LoginResponse } from "./types";

export const loginApi = {
  login: (payload: LoginPayload) => {
    // Map rememberMe from camelCase (TS/JS convention) to snake_case remember_me (Backend expectations)
    const body = {
      email: payload.email,
      password: payload.password,
      remember_me: payload.rememberMe,
    };
    return api.post<LoginResponse>("/auth/login", body).then((res) => res.data);
  },
};
