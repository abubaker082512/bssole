export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  featured: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Page = 'home' | 'shop' | 'contact' | 'admin';
