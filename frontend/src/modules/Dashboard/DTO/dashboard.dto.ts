import type {
  DashboardSummaryDAO,
  GrossProfitReportDAO,
  RestockSuggestionDAO,
  TransactionDAO,
} from "../DAO/dashboard.dao";

export type DashboardSummaryDTO = DashboardSummaryDAO;
export type GrossProfitReportDTO = GrossProfitReportDAO;
export type RestockSuggestionDTO = RestockSuggestionDAO;
export type TransactionDTO = TransactionDAO;

export interface DashboardFilterDTO {
  startDate?: string;
  endDate?: string;
}
