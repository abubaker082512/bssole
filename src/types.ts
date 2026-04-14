export interface Product {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  price: number;
  regular_price?: number;
  sale_price?: number;
  image: string;
  images?: string[];
  category: string;
  category_id?: number;
  featured: number;
  stock: number;
  stock_quantity?: number;
  sku?: string;
  status?: string;
  colors?: string[];
  sizes?: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryCharge {
  id: number;
  min_order: number;
  max_order: number | null;
  charge: number;
  label: string;
}

export type Page = 'home' | 'shop' | 'contact' | 'admin' | 'returns' | 'delivery' | 'checkout' | 'order-success' | 'home2' | 'men-shoes' | 'women-shoes' | 'product-detail';
