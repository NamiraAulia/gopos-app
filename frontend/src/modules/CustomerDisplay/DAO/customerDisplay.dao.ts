export interface CustomerDisplayCartItemDAO {
  id: number;
  name: string;
  price: number;
  price_big: number;
  price_member: number;
  qty: number;
  unit: string;
  unit_big: string;
  unit_choice: "small" | "big";
  custom_price?: number;
  subtotal?: number;
}

export interface CustomerDisplayPayloadDAO {
  cart: CustomerDisplayCartItemDAO[];
  totalNormal: number;
  discountAmount: number;
  grandTotal: number;
  selectedMember: any;
  lastTransaction: any;
  isPaying?: boolean;
}

