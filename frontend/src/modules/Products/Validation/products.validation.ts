import type { ProductDTO } from "../DTO/products.dto";

export function validateProductInput(product: Partial<ProductDTO>): { valid: boolean; error?: string } {
  if (!product.name || product.name.trim() === "") {
    return { valid: false, error: "Nama produk tidak boleh kosong." };
  }
  if (product.price != null && product.price < 0) {
    return { valid: false, error: "Harga jual tidak boleh negatif." };
  }
  if (product.stock != null && product.stock < 0) {
    return { valid: false, error: "Stok produk tidak boleh negatif." };
  }
  return { valid: true };
}
