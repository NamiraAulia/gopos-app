export interface RestockItem {
  product_id: number;
  product_name: string;
  current_stock: number;
  avg_sales_per_day: number;
  days_remaining: number;
}