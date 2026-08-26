import type { CreateMemberPayloadDTO } from "../DTO/member.dto";

export function validateMemberInput(payload: CreateMemberPayloadDTO): { valid: boolean; error?: string } {
  if (!payload.name || payload.name.trim() === "") {
    return { valid: false, error: "Nama lengkap member wajib diisi." };
  }
  return { valid: true };
}
