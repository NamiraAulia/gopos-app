import { fetchKasbonMembers, recordRepayment } from "@/service/kasbon.service";
import type {
  KasbonSummaryDTO,
  DebtLogDTO,
  RepayKasbonDTO,
} from "../DTO/kasbon.dto";

export type KasbonSummaryDAO = KasbonSummaryDTO;
export type DebtLogDAO = DebtLogDTO;
export type RepayKasbonDAO = RepayKasbonDTO;

export const kasbonDAO = {
  getKasbonMembers: fetchKasbonMembers,
  recordRepayment: recordRepayment,
};
