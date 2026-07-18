export interface RestockItem {
  product_id: number;
  product_name: string;
  current_stock: number;
  avg_sales_per_day: number;
  days_remaining: number;
  supplier_name?: string;
  conversion: number;
  unit?: string;
  unit_big?: string;
  shelf_life_days?: number;
  expiry_date?: string;
  daily_demand: number;
  weekly_demand: number;
  recommend_qty: number;
  recommend_big_qty: number;
  max_safe_qty: number;
  max_safe_big_qty: number;
  risk_tier: "high" | "medium" | "low";
}