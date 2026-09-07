export enum TransactionStatus {
  COMPLETED = "completed",
  VOIDED = "voided",
  PARTIALLY_REFUNDED = "partially_refunded",
}

export enum PaymentMethod {
  CASH = "cash",
  QRIS = "qris",
  TRANSFER = "transfer",
  KASBON = "kasbon",
}

export enum UserRole {
  ADMIN = "admin",
  KASIR = "kasir",
}

export enum ExpenseCategory {
  OPERATIONAL = "Operasional",
  INVENTORY = "Inventaris",
  SUPPLY = "Suplai",
  SALARY = "Gaji",
  RENT = "Sewa",
  DEBT = "Hutang",
  OTHER = "Lainnya",
}

export enum UnitChoice {
  SMALL = "small",
  BIG = "big",
}

export enum ShiftStatus {
  OPEN = "open",
  CLOSED = "closed",
}

export enum ShiftDifferenceStatus {
  LEBIH = "lebih",
  KURANG = "kurang",
  PAS = "pas",
}

export enum PrinterType {
  PCL = "pcl",
  ESCPOS = "escpos",
}

export enum PaperSize {
  SIZE_37MM = "37mm",
  SIZE_58MM = "58mm",
  SIZE_80MM = "80mm",
}

export enum BluetoothConnectionStatus {
  DISCONNECTED = "Disconnected",
  CONNECTING = "Connecting...",
  CONNECTED = "Connected",
}

export enum HardwareConnectionType {
  USB = "usb",
  TELPO_INTERNAL = "telpo_internal",
}

export enum SupplierVisitType {
  TAKING_ORDER = "taking_order",
  BILLING = "billing",
  BOTH = "both",
}

export enum KasbonLogType {
  DEBT = "debt",
  REPAYMENT = "repayment",
  KASBON = "kasbon",
  PELUNASAN = "pelunasan",
}

export enum InventoryRiskTier {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export enum CsvValidationStatus {
  VALID = "valid",
  WARNING = "warning",
  DB_DUPLICATE = "db_duplicate",
  CSV_DUPLICATE = "csv_duplicate",
  ERROR = "error",
}

export enum CsvDuplicateAction {
  CREATE = "create",
  UPDATE = "update",
  SKIP = "skip",
}

export enum CsvFilterTab {
  ALL = "all",
  IMPORTABLE = "importable",
  DB_DUP = "db_dup",
  CSV_DUP = "csv_dup",
  ERROR = "error",
}

export enum AuditAction {
  CREATE = "CREATE",
  UPDATE = "UPDATE",
  DELETE = "DELETE",
  LOGIN = "LOGIN",
  LOGOUT = "LOGOUT",
  VOID = "VOID",
}

export enum ProductUnit {
  PCS = "Pcs",
  KG = "Kg",
  LITER = "Liter",
  DUS = "Dus",
  PACK = "Pack",
  BOTTLE = "Botol",
  PACKET = "Bungkus",
}

export enum StorageKey {
  PRINTER_TYPE = "gopos-printer-type",
  PAPER_SIZE = "gopos_paper_size",
  PREFERRED_PRINTER = "preferred_printer_vid_pid",
  CUSTOMER_DISPLAY_ENABLED = "gopos-customer-display-enabled",
  CUSTOMER_DISPLAY_STATE = "gopos-customer-display-state",
  HELD_CARTS = "gopos-held-carts",
  SHOP_NAME = "gopos_shop_name",
  SHOP_ADDRESS = "gopos_shop_address",
  SHOP_PHONE = "gopos_shop_phone",
  SHOP_FOOTER = "gopos_shop_footer",
  SHOP_LOGO = "gopos_shop_logo",
  TOKEN = "token",
  AUTH_TOKEN = "auth_token",
  AUTH_STORE = "gopos-auth",
}

export enum BroadcastChannelName {
  CUSTOMER_DISPLAY = "gopos-customer-display",
}

export enum CustomerDisplayMessageType {
  CART_UPDATE = "CART_UPDATE",
  REQUEST_CURRENT_STATE = "REQUEST_CURRENT_STATE",
}

export enum AlertVariant {
  SUCCESS = "success",
  ERROR = "error",
  WARNING = "warning",
  INFO = "info",
}

export enum ModalType {
  PAYMENT = "PAYMENT",
  RECEIPT = "RECEIPT",
  EXPENSE = "EXPENSE",
  HELD_CARTS = "HELD_CARTS",
  CLOSE_SHIFT = "CLOSE_SHIFT",
  MEMBER_FORM = "MEMBER_FORM",
  KASBON_HISTORY = "KASBON_HISTORY",
  REPAYMENT = "REPAYMENT",
  PRODUCT_FORM = "PRODUCT_FORM",
  CSV_IMPORT = "CSV_IMPORT",
  SUPPLIER_FORM = "SUPPLIER_FORM",
  LOGOUT_CONFIRM = "LOGOUT_CONFIRM",
}

