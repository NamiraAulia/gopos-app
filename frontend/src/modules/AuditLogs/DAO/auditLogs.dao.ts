export interface AuditLogUserDAO {
  id: number;
  name: string;
  email: string;
}

export interface AuditLogDAO {
  id: number;
  user_id: number;
  user?: AuditLogUserDAO;
  action: string;
  target_table: string;
  target_id: string | number;
  old_value?: any;
  new_value?: any;
  ip_address?: string;
  created_at: string;
}
