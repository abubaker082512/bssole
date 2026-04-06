import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ArrowRight, Truck, Shield, RefreshCw, Star } from 'lucide-react';

type Product = { id: number; name: string; image: string; price: number; category: string; featured?: number };

type Props = {
  setPage: (page: any) => void;
  addToCart?: (p: Product) => void;
  heroSlides?: any[];
};

const defaultSlides = [
  { id: 1, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1600&q=80&fit=crop', title: 'Step Into Style', subtitle: 'Premium footwear crafted for every occasion', cta_text: 'Shop Now', cta_link: 'shop', video_url: '' },
  { id: 2, image: 'https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=1600&q=80&fit=crop', title: 'New Arrivals', subtitle: 'Fresh drops you don\'t want to miss', cta_text: 'Explore', cta_link: 'shop', video_url: '' },
  { id: 3, image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=1600&q=80&fit=crop', title: 'Casual Comfort', subtitle: 'Everyday shoes that feel as good as they look', cta_text: 'View Collection', cta_link: 'shop', video_url: '' },
];

export default function Home2Page({ setPage, addToCart, heroSlides }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [slide, setSlide] = useState(0);
  const [loading, setLoading] = useState(true);

  const slides = heroSlides && heroSlides.length > 0
    ? heroSlides.map((s: any, i: number) => ({ ...s, idx: i }))
    : defaultSlides;

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await supabase.from('products').select('id, name, image, price, category, featured').limit(8);
        setProducts(data ?? []);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setSlide((s) => (s + 1) % slides.length), 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Carousel */}
      <section className="relative h-[500px] md:h-[600px] overflow-hidden bg-black">
        {slides.map((s, idx) => (
          <div
            key={s.id ?? idx}
            className={`absolute inset-0 transition-opacity duration-700 ${idx === slide ? 'opacity-100 z-10' : 'opacity-0 z-0'}`}
          >
            {s.video_url ? (
              <video src={s.video_url} autoPlay muted loop playsInline className="w-full h-full object-cover" />
            ) : (
              <img src={s.image_url ?? s.image} alt={s.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex items-center">
              <div className="max-w-6xl mx-auto px-6 md:px-8 w-full">
                <div className="max-w-lg">
                  <h1 className="text-4xl md:text-6xl font-serif font-bold text-white mb-4 leading-tight">{s.title}</h1>
                  <p className="text-lg text-white/60 mb-8">{s.subtitle}</p>
                  {s.cta_text && (
                    <button
                      onClick={() => setPage(s.cta_link ?? s.ctaPage ?? 'shop')}
                      className="inline-flex items-center gap-2 bg-gold text-white px-8 py-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors"
                    >
                      {s.cta_text} <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setSlide(idx)}
              className={`w-3 h-3 rounded-full transition-colors ${idx === slide ? 'bg-gold' : 'bg-white/30'}`}
            />
          ))}
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-black border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: <Truck size={24} />, title: 'Free Shipping', desc: 'On orders above Rs. 3,000' },
            { icon: <Shield size={24} />, title: 'Secure Payment', desc: '100% secure checkout' },
            { icon: <RefreshCw size={24} />, title: 'Easy Returns', desc: '7-day return policy' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <div className="text-gold">{f.icon}</div>
              <div>
                <div className="font-bold text-white text-sm">{f.title}</div>
                <div className="text-xs text-white/40">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold">Curated For You</span>
            <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mt-2">Featured Products</h2>
          </div>
          <button onClick={() => setPage('shop')} className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 hover:text-gold flex items-center gap-1">
            View All <ArrowRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg h-72 animate-pulse" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <p>No products available yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map((p) => (
              <div
                key={p.id}
                className="group cursor-pointer"
                onClick={() => setPage('shop')}
              >
                <div className="relative aspect-[3/4] bg-white/5 rounded-lg overflow-hidden mb-3">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  {p.featured === 1 && (
                    <span className="absolute top-3 left-3 bg-gold text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1">Featured</span>
                  )}
                  {addToCart && (
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                      className="absolute bottom-0 left-0 w-full bg-gold text-white py-3 text-xs font-bold uppercase tracking-wider translate-y-full group-hover:translate-y-0 transition-transform duration-300"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
                <div className="flex items-start gap-1">
                  <div className="flex text-gold">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={12} fill="currentColor" />
                    ))}
                  </div>
                </div>
                <h3 className="text-sm font-bold text-white mt-1 truncate">{p.name}</h3>
                <p className="text-xs text-white/30 uppercase tracking-wider">{p.category}</p>
                <p className="text-sm font-bold text-gold mt-1">Rs. {p.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CTA Banner */}
      <section className="bg-black border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl md:text-4xl font-serif font-bold text-white mb-4">Join the <span className="text-gold">BS Sole</span> Club</h2>
          <p className="text-white/40 mb-8 max-w-md mx-auto">Be the first to know about new drops, exclusive deals, and member-only discounts.</p>
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input type="email" placeholder="ENTER YOUR EMAIL" className="flex-1 bg-white/5 border border-white/10 rounded px-4 py-3 text-xs font-bold uppercase tracking-[0.2em] outline-none focus:border-gold placeholder:text-white/20 text-white" />
            <button className="bg-gold text-white px-8 py-3 font-bold text-xs uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors rounded">Subscribe</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-black border-t border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-serif font-bold text-white mb-4">BS Sole</h3>
            <p className="text-white/40 text-sm max-w-sm leading-relaxed">Premium footwear for the modern individual. Crafted with care, designed for comfort.</p>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><button onClick={() => setPage('shop')} className="hover:text-gold">Shop</button></li>
              <li><button onClick={() => setPage('contact')} className="hover:text-gold">Contact</button></li>
              <li><button onClick={() => setPage('returns')} className="hover:text-gold">Returns Policy</button></li>
              <li><button onClick={() => setPage('delivery')} className="hover:text-gold">Delivery Policy</button></li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-4">Follow Us</h4>
            <ul className="space-y-2 text-sm text-white/40">
              <li><a href="https://www.instagram.com/bssoleofficial/?hl=en" target="_blank" rel="noreferrer" className="hover:text-gold">Instagram</a></li>
              <li><a href="https://www.facebook.com/bssoleofficial" target="_blank" rel="noreferrer" className="hover:text-gold">Facebook</a></li>
              <li><a href="https://tiktok.com/@bssoleofficial" target="_blank" rel="noreferrer" className="hover:text-gold">TikTok</a></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-white/5 text-center py-6 text-xs text-white/20">© 2026 BS SOLE. ALL RIGHTS RESERVED.</div>
      </footer>
    </div>
  );
}
