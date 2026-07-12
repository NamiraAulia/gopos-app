export interface DBUser {
  id: number;
  name: string;
  email: string;
  role: "admin" | "kasir";
  is_active: boolean;
}
