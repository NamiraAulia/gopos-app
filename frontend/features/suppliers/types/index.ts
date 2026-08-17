export type VisitType = "taking_order" | "billing" | "both";

export interface SupplierSales {
  id?: number;
  supplier_id?: number;
  sales_name: string;
  category?: string;
  phone_number?: string;
  visit_day: string; // "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday"
  visit_type: VisitType;
  notes?: string;
  is_active?: boolean;
  last_visited_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  address?: string;
  notes?: string;
  is_active?: boolean;
  sales_contacts?: SupplierSales[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateSupplierSalesInput {
  id?: number;
  sales_name: string;
  category?: string;
  phone_number?: string;
  visit_day: string;
  visit_type: VisitType;
  notes?: string;
}

export interface CreateSupplierPayload {
  name: string;
  address?: string;
  notes?: string;
  sales_contacts: CreateSupplierSalesInput[];
}

export interface TodayScheduleItem extends SupplierSales {
  supplier_name: string;
  supplier_address?: string;
}

export interface TodayScheduleData {
  day: string;
  taking_order: TodayScheduleItem[];
  billing: TodayScheduleItem[];
  total_sales: number;
}
