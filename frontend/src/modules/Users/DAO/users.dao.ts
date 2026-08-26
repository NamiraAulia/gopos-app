export interface UserDAO {
  id: number;
  name: string;
  email: string;
  role: "admin" | "kasir";
  is_active: boolean;
}
