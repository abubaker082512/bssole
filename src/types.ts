export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: number;
  stock: number;
  colors: string[];
  sizes: string[];
}

export interface CartItem extends Product {
  quantity: number;
}

export interface DeliveryCharge {
  id: number;
  min_order: number;
  max_order: number | null; // null = no upper limit
  charge: number;           // 0 = free
  label: string;
}

export type Page = 'home' | 'shop' | 'contact' | 'admin' | 'returns' | 'delivery' | 'checkout' | 'order-success' | 'home2';
