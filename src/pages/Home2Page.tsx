import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import { supabase } from '../lib/supabase';

type Product = { id: number; name: string; image: string; price: number; category: string };

export default function Home2Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [slide, setSlide] = useState(0);
  const slides = [
    { id: 1, image: 'https://images.unsplash.com/photo-1528701800487-2f8a8b9a0f0a?q=80&w=1600&auto=format&fit=crop', title: 'Step into Luxury', subtitle: 'Premium footwear for every step' },
    { id: 2, image: 'https://images.unsplash.com/photo-1521335629791-ce4aec67dd1d?q=80&w=1600&auto=format&fit=crop', title: 'Urban Classics', subtitle: 'Lightweight and comfortable' },
  ];

  useEffect(() => {
    // fetch a few products for the grid (fallback if no data)
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('id, name, image, price, category').limit(8);
        setProducts(data ?? []);
      } catch {
        // fallback to mock data
        setProducts([
          { id: 101, name: 'Formality Runner', image: 'https://images.unsplash.com/photo-1526178616788-6a0b3a10b0f1', price: 1200, category: 'Formal' },
          { id: 102, name: 'City Glide', image: 'https://images.unsplash.com/photo-1519741497674-14e90a89c1a8', price: 999, category: 'Casual' },
          { id: 103, name: 'Trail Master', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff', price: 1499, category: 'Outdoor' },
        ]);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      <Header onMenu={() => {}} onSearch={() => {}} onLogin={() => {}} cartCount={0} />
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="relative h-72 bg-gray-100 rounded-lg overflow-hidden mb-8">
            {/* Simple hero carousel */}
            {slides.map((s, idx) => (
              <img key={s.id} src={s.image} alt={s.title} className={`w-full h-full object-cover absolute inset-0 transition-opacity ${idx === slide ? 'opacity-100' : 'opacity-0'}`} style={{ transition: 'opacity 0.6s ease' }} />
            ))}
            <button className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2" onClick={() => setSlide((slide + slides.length - 1) % slides.length)}>
              ‹
            </button>
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 text-white px-3 py-2" onClick={() => setSlide((slide + 1) % slides.length)}>
              ›
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="border rounded p-4 text-center">
                <img src={p.image} alt={p.name} className="w-full h-40 object-cover mb-2" />
                <div className="text-sm font-semibold">{p.name}</div>
                <div className="text-xs text-gray-600">{p.category}</div>
                <div className="mt-2 font-bold">RS. {p.price?.toLocaleString?.() ?? ''}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
