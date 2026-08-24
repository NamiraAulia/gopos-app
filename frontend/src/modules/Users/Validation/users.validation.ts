import type { CreateUserDTO } from "../DTO/users.dto";

export function validateCreateUser(payload: CreateUserDTO): { valid: boolean; error?: string } {
  if (!payload.name || payload.name.trim() === "") {
    return { valid: false, error: "Nama lengkap wajib diisi." };
  }
  if (!payload.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)) {
    return { valid: false, error: "Alamat email tidak valid." };
  }
  if (!payload.password || payload.password.length < 6) {
    return { valid: false, error: "Kata sandi minimal 6 karakter." };
  }
  if (payload.role !== "admin" && payload.role !== "kasir") {
    return { valid: false, error: "Peran pengguna tidak valid." };
  }
  return { valid: true };
}
