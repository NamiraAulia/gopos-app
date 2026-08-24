import type { AuditLogFilterDTO } from "../DTO/auditLogs.dto";

export function validateAuditFilter(filter: AuditLogFilterDTO): { valid: boolean; error?: string } {
  if (filter.startDate && filter.endDate) {
    if (new Date(filter.startDate) > new Date(filter.endDate)) {
      return { valid: false, error: "Tanggal mulai tidak boleh melebihi tanggal akhir." };
    }
  }
  return { valid: true };
}
