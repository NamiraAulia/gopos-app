import { atom } from "jotai";
import type { MemberDTO } from "../DTO/member.dto";

export type MemberModalType = "MEMBER_FORM" | "IMPORT_CSV" | "REPAYMENT" | "HISTORY" | null;

export interface MemberModalState {
  type: MemberModalType;
  data?: MemberDTO | any;
}

export const memberModalAtom = atom<MemberModalState>({
  type: null,
  data: null,
});

export const openMemberModalAtom = atom(
  null,
  (_get, set, payload: { type: MemberModalType; data?: MemberDTO | any }) => {
    set(memberModalAtom, payload);
  }
);

export const closeMemberModalAtom = atom(null, (_get, set) => {
  set(memberModalAtom, { type: null, data: null });
});
