export interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
  role: "admin" | "kasir";
}

export interface ToggleUserStatusDTO {
  id: number;
  action: "activate" | "deactivate";
}
