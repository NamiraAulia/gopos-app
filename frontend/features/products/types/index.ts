export interface Product {
  id?: number;
  barcode?: string;
  name: string;
  price: number;
  cost_price: number;
  stock: number;
  min_stock: number;
  unit?: string;
  image_url?: string;
  is_active?: boolean;
}

export interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingProduct?: Product | null; 
}