import { atom } from "jotai";
import type { MemberDTO } from "@/modules/Member/DTO/member.dto";

export type KasbonModalType = "REPAYMENT" | "HISTORY" | null;

export interface KasbonModalState {
  type: KasbonModalType;
  data: MemberDTO | null;
}

export const kasbonModalAtom = atom<KasbonModalState>({
  type: null,
  data: null,
});

export const openKasbonModalAtom = atom(
  null,
  (_get, set, payload: { type: KasbonModalType; data: MemberDTO | null }) => {
    set(kasbonModalAtom, payload);
  }
);

export const closeKasbonModalAtom = atom(null, (_get, set) => {
  set(kasbonModalAtom, { type: null, data: null });
});
