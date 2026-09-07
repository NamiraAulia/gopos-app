import {
  fetchMembers,
  createMember,
  editMember,
  deleteMember,
  fetchDebtLogs,
  repayDebt,
  importMembersCsv,
  exportMembersCsv,
} from "@/service/member.service";
import type {
  MemberDTO,
  CreateMemberPayloadDTO,
  DebtLogDTO,
  RepayDebtPayloadDTO,
  MemberCsvItemDTO,
} from "../DTO/member.dto";

export type MemberDAO = MemberDTO;
export type CreateMemberPayloadDAO = CreateMemberPayloadDTO;
export type DebtLogDAO = DebtLogDTO;
export type RepayDebtPayloadDAO = RepayDebtPayloadDTO;
export type MemberCsvItemDAO = MemberCsvItemDTO;

export const memberDAO = {
  getMembers: fetchMembers,
  createMember: createMember,
  editMember: editMember,
  deleteMember: deleteMember,
  getDebtLogs: fetchDebtLogs,
  repayDebt: repayDebt,
  importMembersCsv: importMembersCsv,
  exportMembersCsv: exportMembersCsv,
};
