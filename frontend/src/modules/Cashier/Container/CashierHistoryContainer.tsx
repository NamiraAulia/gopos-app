"use client";

import { useCashierHistory } from "./useCashierHistory";
import { CashierHistoryView } from "../Component/CashierHistoryView";

export default function CashierHistoryContainer() {
  const historyProps = useCashierHistory();
  return <CashierHistoryView {...historyProps} />;
}
