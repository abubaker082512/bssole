import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, X, Instagram, Facebook, Trash2, Edit, Plus, Save, ArrowRight, Search, User, LogOut, Shield, Eye, EyeOff, AlertCircle, UserCircle2 } from 'lucide-react';
import { Product, Page, CartItem, DeliveryCharge } from './types';
import { supabase } from './lib/supabase';
import AdminLogin from './components/AdminLogin';
import CheckoutPage from './components/CheckoutPage';
import AdminDashboard from './components/admin/AdminDashboard';
import Home2Page from './pages/Home2Page';
import Header from './components/Header';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home2');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const [deliveryCharges, setDeliveryCharges] = useState<DeliveryCharge[]>([]);
  const [orderId, setOrderId] = useState<number | string | null>(null);
  const [marqueeText, setMarqueeText] = useState<string>('');
  const [heroSlides, setHeroSlides] = useState<any[]>([]);
  const [siteContent, setSiteContent] = useState<any>({});
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    loadProducts();
    loadDeliveryCharges();
    loadSiteContent();
    loadHeroSlides();
    const savedCart = localStorage.getItem('bss_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Failed to parse cart", e); }
    }
    // Check existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    // Listen for auth changes — redirect away from admin if session expires
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_OUT') {
        setCurrentPage('home2');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const loadSiteContent = async () => {
    try {
      const res = await fetch('/api/site-content');
      if (res.ok) {
        const data = await res.json();
        setSiteContent(data);
        if (data?.marquee?.text) setMarqueeText(data.marquee.text);
      }
    } catch (e) { /* use defaults */ }
  };

  const loadHeroSlides = async () => {
    try {
      const res = await fetch('/api/hero-slides');
      if (res.ok) {
        const data = await res.json();
        setHeroSlides(data?.filter((s: any) => s.is_active) ?? []);
      }
    } catch (e) { /* use defaults */ }
  };

  useEffect(() => {
    localStorage.setItem('bss_cart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('fetch error');
      const data = await res.json();
      const mappedProducts = data.map((p: any) => {
        // Combine product images and variant images
        const productImages = p.product_images?.map((img: any) => img.image_url) || [];
        const variantImages = p.variantImages || {};
        
        // Merge all images
        let allImages = [...productImages];
        Object.values(variantImages).forEach((imgs: any) => {
          imgs.forEach((img: string) => {
            if (!allImages.includes(img)) allImages.push(img);
          });
        });
        
        if (allImages.length === 0) {
          allImages = ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'];
        }

        return {
          id: p.id,
          name: p.name || 'Unknown Product',
          description: p.description || '',
          short_description: p.short_description || '',
          price: p.sale_price || p.regular_price || 0,
          regular_price: p.regular_price,
          sale_price: p.sale_price,
          stock: p.stock_quantity || 0,
          stock_quantity: p.stock_quantity,
          sku: p.sku || '',
          status: p.status,
          category: p.categories?.name || 'Uncategorized',
          category_id: p.category_id,
          image: allImages[0],
          images: allImages,
          featured: p.featured || 0,
          variants: p.product_variants || [],
          variantImages: variantImages,
          // Use colors from API or default
          colors: p.colors || ['Default'],
          sizes: p.sizes || ['US 7', 'US 8', 'US 9', 'US 10', 'US 11']
        };
      });
      setProducts(mappedProducts || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
    }
  };

  const loadDeliveryCharges = async () => {
    try {
      const { data, error } = await supabase.from('delivery_charges').select('*').order('min_order', { ascending: true });
      if (error) throw error;
      setDeliveryCharges(data || []);
    } catch (err) {
      console.error('Failed to load delivery charges', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('home');
    setIsAuthOpen(false);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => setCart(prev => prev.filter(item => item.id !== id));

  const updateQuantity = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) return { ...item, quantity: Math.max(1, item.quantity + delta) };
      return item;
    }));
  };

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  const renderPage = () => {
    switch (currentPage) {
      case 'home': return <HomePage products={products.filter(p => p.featured)} setPage={setCurrentPage} addToCart={addToCart} heroSlides={heroSlides} />;
      case 'home2': return <Home2Page setPage={setCurrentPage} addToCart={addToCart} heroSlides={heroSlides} />;
      case 'shop': return <ShopPage products={products} addToCart={addToCart} setPage={setCurrentPage} setSelectedProduct={setSelectedProduct} />;
      case 'men-shoes': return <CategoryPage category="Men Shoes" products={products.filter(p => p.category?.toLowerCase().includes('men'))} addToCart={addToCart} setPage={setCurrentPage} setSelectedProduct={setSelectedProduct} />;
      case 'women-shoes': return <CategoryPage category="Women Shoes" products={products.filter(p => p.category?.toLowerCase().includes('women'))} addToCart={addToCart} setPage={setCurrentPage} setSelectedProduct={setSelectedProduct} />;
      case 'product-detail': return selectedProduct ? <ProductDetailPage product={selectedProduct} addToCart={addToCart} onBack={() => { setSelectedProduct(null); setCurrentPage('shop'); }} setPage={setCurrentPage} /> : <ShopPage products={products} addToCart={addToCart} setPage={setCurrentPage} setSelectedProduct={setSelectedProduct} />;
      case 'contact': return <ContactPage />;
      case 'admin':
        // Protect admin area: require admin email from env var and valid session
        if (!session) return <AdminLogin onLoginSuccess={() => setCurrentPage('admin')} />;
        if (!isAdmin) {
          return <div className="p-6 text-red-400">Access denied. Admins only.</div>;
        }
        return <AdminDashboard onLogout={handleLogout} />;
      case 'returns': return <ReturnPolicyPage setPage={setCurrentPage} />;
      case 'delivery': return <DeliveryPolicyPage setPage={setCurrentPage} />;
      case 'checkout': return <CheckoutPage cart={cart} onBack={() => setCurrentPage('shop')} onSuccess={(id) => { setOrderId(id); setCart([]); setCurrentPage('order-success'); }} session={session} />;
      case 'order-success': return (
        <div className="max-w-4xl mx-auto py-12 px-6 bg-black min-h-[60vh] flex flex-col items-center justify-center">
          <div className="text-center">
            <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-3xl font-serif font-bold mb-4 text-gold">Order Confirmed</h2>
            <p className="text-white/40 mb-6">Thank you! Your order has been placed successfully.</p>
            <p className="text-white/30 mb-8">Order ID: <span className="font-mono font-bold text-gold">{orderId ?? 'N/A'}</span></p>
            <button className="px-10 py-4 bg-gold text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors rounded" onClick={() => setCurrentPage('shop')}>Continue Shopping</button>
          </div>
        </div>
      );
      default: return <Home2Page setPage={setCurrentPage} addToCart={addToCart} heroSlides={heroSlides} />;
    }
  };

  // Admin check: prefer a list loaded from environment (VITE_ADMIN_EMAILS)
  // This avoids hard-coding a single admin email in the frontend.
  const rawEmails = ((import.meta as any).env?.VITE_ADMIN_EMAILS ?? '') as string;
  const ADMIN_EMAILS: string[] = rawEmails.split(',').map(e => e.trim()).filter(e => e.length > 0);
  const isAdmin = !!session && ADMIN_EMAILS.includes(session.user?.email ?? '');


  return (
    <div className="min-h-screen flex flex-col selection:bg-gold selection:text-black bg-black">
      {/* Global Header (black/gold themed) */}
      <Header
        onMenu={() => setIsMenuOpen(true)}
        onSearch={() => {}}
        onLogin={() => setIsAuthOpen(true)}
        onCart={() => setIsCartOpen(true)}
        cartCount={cartCount}
        setPage={(p) => setCurrentPage(p as Page)}
        currentPage={currentPage}
        marqueeText={marqueeText}
      />

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/923255281122"
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
      >
        <svg viewBox="0 0 24 24" width="28" height="28" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row">
            <div className="flex-1 p-12 flex flex-col justify-between border-r border-white/5">
              <div className="flex justify-between items-center">
                <span className="text-white text-4xl font-serif font-bold tracking-wider">BS Sole</span>
                <button onClick={() => setIsMenuOpen(false)} className="text-gold hover:rotate-90 transition-transform duration-500"><X size={32} /></button>
              </div>
              <div className="flex flex-col gap-6">
                {['home2', 'men-shoes', 'women-shoes', 'shop', 'contact'].map((page, i) => (
                  <motion.button key={page} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    onClick={() => { setCurrentPage(page as Page); setIsMenuOpen(false); }}
                    className="text-5xl md:text-7xl font-serif font-bold text-left hover:italic hover:pl-4 transition-all duration-500 group">
                    <span className={currentPage === page ? 'gold-text-gradient' : 'text-white/20 group-hover:text-white'}>{page === 'home2' ? 'HOME' : page === 'men-shoes' ? 'MEN' : page === 'women-shoes' ? 'WOMEN' : page.toUpperCase()}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-8 text-white/30 text-xs tracking-[0.2em] uppercase font-bold">
                <a href="https://www.instagram.com/bssoleofficial/?hl=en" target="_blank" rel="noreferrer" className="hover:text-gold">Instagram</a>
                <a href="https://www.facebook.com/bssoleofficial" target="_blank" rel="noreferrer" className="hover:text-gold">Facebook</a>
                <a href="https://tiktok.com/@bssoleofficial" target="_blank" rel="noreferrer" className="hover:text-gold">TikTok</a>
              </div>
            </div>
            <div className="hidden md:block flex-1 relative overflow-hidden">
              <img src="https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=1200&q=80&fit=crop" className="w-full h-full object-cover opacity-50 grayscale hover:grayscale-0 transition-all duration-1000" alt="Shoe menu" />
              <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-md bg-black z-[200] border-l border-white/5 flex flex-col">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <h2 className="text-2xl font-serif font-bold gold-text-gradient">YOUR BAG</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-white/50 hover:text-gold transition-colors"><X size={24} /></button>
              </div>
              <div className="flex-grow overflow-y-auto p-8 space-y-8">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <ShoppingBag size={48} className="text-white/10 mb-6" />
                    <p className="text-white/40 uppercase tracking-[0.2em] text-xs font-bold">Your bag is empty</p>
                    <button onClick={() => { setIsCartOpen(false); setCurrentPage('shop'); }}
                      className="mt-8 text-gold text-[10px] font-bold tracking-[0.3em] uppercase border-b border-gold pb-1">
                      Start Shopping
                    </button>
                  </div>
                ) : (
                  cart.map(item => (
                    <div key={item.id} className="flex gap-6 group">
                      <div className="w-24 h-32 bg-[#111] overflow-hidden border border-white/5">
                        <img src={item.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                      </div>
                      <div className="flex-grow flex flex-col justify-between py-1">
                        <div>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-serif font-bold text-lg">{item.name}</h4>
                            <button onClick={() => removeFromCart(item.id)} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          </div>
                          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{item.category}</p>
                        </div>
                        <div className="flex justify-between items-end">
                          <div className="flex items-center border border-white/10 rounded-sm">
                            <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1 text-white/30 hover:text-gold transition-colors">-</button>
                            <span className="px-3 py-1 text-xs font-bold">{item.quantity}</span>
                            <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1 text-white/30 hover:text-gold transition-colors">+</button>
                          </div>
                          <div className="text-gold font-bold text-sm">RS. {(item.price * item.quantity).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {cart.length > 0 && (
                <div className="p-8 border-t border-white/5 bg-[#050505]">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-white/40 text-[10px] font-bold uppercase tracking-[0.3em]">Subtotal</span>
                    <span className="text-2xl font-serif font-bold text-gold">RS. {cartTotal.toLocaleString()}</span>
                  </div>
                  <button onClick={() => setCurrentPage('checkout')} className="btn-luxury w-full py-6 text-sm">Checkout Now</button>
                  <p className="text-center text-[8px] text-white/20 uppercase tracking-[0.2em] mt-6">Shipping & taxes calculated at checkout</p>
                  <p className="text-center text-[10px] text-white/30 mt-3">Free shipping on orders above Rs. 3,000</p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Auth Modal */}
      <UserAuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        session={session}
        isAdmin={isAdmin}
        onLogout={handleLogout}
        onNavigateAdmin={() => { setCurrentPage('admin'); setIsAuthOpen(false); }}
      />

      {/* Main Content */}
      <main className="flex-grow">
        <AnimatePresence mode="wait">
          <motion.div key={currentPage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5 }}>
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer — hidden on admin pages */}
      {currentPage !== 'admin' && (
        <footer className="bg-black border-t border-white/5 pt-24 pb-12 px-6 md:px-12">
          <div className="max-w-[1600px] mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-24">
              <div className="col-span-1 md:col-span-2">
                <span className="text-white text-4xl font-serif font-bold tracking-wider block mb-8">BS Sole</span>
                <p className="text-white/40 text-lg max-w-md leading-relaxed mb-8">
                  Redefining everyday luxury with handcrafted footwear and accessories. Experience the soul of premium craftsmanship at BSSOLE.COM.
                </p>
                <div className="flex gap-6">
                  <a href="https://www.instagram.com/bssoleofficial/?hl=en" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all"><Instagram size={18} /></a>
                  <a href="https://www.facebook.com/bssoleofficial" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all"><Facebook size={18} /></a>
                  <a href="https://tiktok.com/@bssoleofficial" target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.78a8.18 8.18 0 004.78 1.52V6.85a4.85 4.85 0 01-1.01-.16z" /></svg>
                  </a>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-8">Collections</h4>
                <ul className="space-y-4 text-sm text-white/50">
                  <li><button onClick={() => setCurrentPage('shop')} className="hover:text-white transition-colors">Formal Collection</button></li>
                  <li><button onClick={() => setCurrentPage('shop')} className="hover:text-white transition-colors">Casual Soles</button></li>
                  <li><button onClick={() => setCurrentPage('shop')} className="hover:text-white transition-colors">Sport Performance</button></li>
                  <li><button onClick={() => setCurrentPage('shop')} className="hover:text-white transition-colors">Limited Editions</button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gold uppercase tracking-[0.3em] mb-8">Company</h4>
                <ul className="space-y-4 text-sm text-white/50">
                  <li><button onClick={() => setCurrentPage('contact')} className="hover:text-white transition-colors">Contact Us</button></li>
                  <li><button onClick={() => setCurrentPage('returns')} className="hover:text-white transition-colors">Returns Policy</button></li>
                  <li><button onClick={() => setCurrentPage('delivery')} className="hover:text-white transition-colors">Delivery Policy</button></li>
                  <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
            <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] font-bold tracking-[0.2em] text-white/20 uppercase">
              <div>© 2026 BSSOLE. ALL RIGHTS RESERVED.</div>
              <div className="flex gap-8"><span>Handcrafted in Pakistan</span><span>Global Shipping</span></div>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

function HomePage({ products, setPage, addToCart, heroSlides }: { products: Product[], setPage: (p: Page) => void, addToCart: (p: Product) => void, heroSlides?: any[] }) {
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center overflow-hidden bg-gray-50">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80&fit=crop" alt="Luxury shoe hero" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/60 to-transparent"></div>
        </div>
        <div className="relative z-10 px-6 md:px-24 max-w-4xl">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}>
            <span className="text-[gold] text-xs font-bold tracking-[0.5em] uppercase mb-6 block">Est. 2026</span>
            <h1 className="text-6xl md:text-[100px] font-serif font-black leading-[0.9] mb-8 tracking-tighter text-[gold]">
              BEYOND <br />
              <span className="italic text-[gold]">LUXURY.</span>
            </h1>
            <p className="text-gray-600 text-lg md:text-xl font-light max-w-lg mb-12 leading-relaxed">
              Redefining the essence of men's footwear. Handcrafted soles designed for those who command presence in every step.
            </p>
            <div className="flex flex-wrap gap-6">
              <button onClick={() => setPage('shop')} className="bg-[gold] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[black] transition-colors">
                Explore Shop
              </button>
              <button onClick={() => setPage('contact')} className="px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] text-[gold] hover:text-[black] transition-colors flex items-center gap-2 group border-2 border-[gold] hover:border-[black]">
                Contact Us <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
        <div className="absolute right-12 bottom-24 hidden lg:block">
          <div className="rotate-90 origin-right text-[10px] font-bold tracking-[1em] uppercase text-gray-400">Handcrafted Excellence • BSSOLE.COM</div>
        </div>
      </section>

      {/* Features Strip */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[
            { icon: '🚚', title: 'Free Shipping', desc: 'On orders above Rs. 10,000' },
            { icon: '🔄', title: 'Easy Returns', desc: '7-day hassle-free returns' },
            { icon: '💳', title: 'COD Available', desc: 'Cash on delivery nationwide' },
            { icon: '⭐', title: 'Premium Quality', desc: 'Handcrafted with care' },
          ].map((f) => (
            <div key={f.title} className="flex items-center gap-4">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <div className="font-semibold text-[gold] text-sm">{f.title}</div>
                <div className="text-xs text-gray-500">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Collections Grid */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-[1600px] mx-auto">
          <div className="text-center mb-16">
            <span className="text-gray-400 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Explore</span>
            <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter text-[gold]">OUR COLLECTIONS</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[700px]">
            <div className="md:col-span-8 relative group overflow-hidden cursor-pointer rounded-xl" onClick={() => setPage('shop')}>
              <img src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Formal collection" />
              <div className="absolute inset-0 bg-gradient-to-t from-[gold]/70 via-transparent to-transparent group-hover:from-[gold]/80 transition-colors"></div>
              <div className="absolute bottom-12 left-12">
                <h3 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">THE FORMAL <br /> COLLECTION</h3>
                <span className="text-xs font-bold tracking-[0.2em] uppercase text-white border-b-2 border-white pb-1">Shop Now</span>
              </div>
            </div>
            <div className="md:col-span-4 grid grid-rows-2 gap-6">
              <div className="relative group overflow-hidden cursor-pointer rounded-xl" onClick={() => setPage('shop')}>
                <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Casual soles" />
                <div className="absolute inset-0 bg-gradient-to-t from-[gold]/70 via-transparent to-transparent group-hover:from-[gold]/80 transition-colors"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">CASUAL SOLES</h3>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">Explore</span>
                </div>
              </div>
              <div className="relative group overflow-hidden cursor-pointer rounded-xl" onClick={() => setPage('shop')}>
                <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Accessories" />
                <div className="absolute inset-0 bg-gradient-to-t from-[gold]/70 via-transparent to-transparent group-hover:from-[gold]/80 transition-colors"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2">ACCESSORIES</h3>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-white">Explore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-6 md:px-12 bg-gray-50">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8">
            <div className="max-w-xl">
              <span className="text-gray-400 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Curated Selection</span>
              <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter text-[gold]">FEATURED DROPS</h2>
            </div>
            <button onClick={() => setPage('shop')} className="text-xs font-bold tracking-[0.2em] uppercase border-b-2 border-gray-300 pb-2 text-gray-600 hover:border-[gold] hover:text-[gold] transition-all">View All Products</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {products.map((product) => (
              <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow">
                <div className="relative aspect-[3/4] overflow-hidden bg-gray-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                  <button onClick={() => addToCart(product)}
                    className="absolute bottom-0 left-0 w-full bg-[gold] text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                    Quick Add
                  </button>
                  {product.featured ? (
                    <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-[gold] text-white px-3 py-1">Featured</div>
                  ) : null}
                </div>
                <div className="p-5">
                  <h4 className="text-lg font-serif font-bold text-[gold] mb-1 group-hover:text-[gold] transition-colors">{product.name}</h4>
                  <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] mb-3">{product.category}</p>
                  <div className="text-[gold] font-bold text-sm">RS. {product.price.toLocaleString()}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter CTA */}
      <section className="py-32 px-6 text-center bg-white">
        <div className="max-w-2xl mx-auto">
          <span className="text-gray-400 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Stay Updated</span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-[gold] mb-6">JOIN THE <span className="italic text-[gold]">CLUB</span></h2>
          <p className="text-gray-500 mb-12 text-lg">Be the first to know about our limited edition drops and exclusive events.</p>
          <form className="flex flex-col md:flex-row gap-4" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="YOUR EMAIL ADDRESS"
              className="flex-grow bg-gray-50 border border-gray-200 rounded px-6 py-4 outline-none focus:border-[gold] transition-colors text-sm tracking-[0.1em] text-[gold] placeholder:text-gray-400" />
            <button className="bg-[gold] text-white px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:bg-[black] transition-colors rounded whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ShopPage({ products, addToCart, setPage, setSelectedProduct }: { products: Product[], addToCart: (p: Product) => void, setPage?: (p: Page) => void, setSelectedProduct?: (p: Product) => void }) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12 bg-black">
      <div className="mb-24">
        <span className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Collections</span>
        <h1 className="text-7xl font-serif font-bold tracking-tighter text-white">THE <span className="italic text-gold">SOUL</span> STORE</h1>
      </div>
      <div className="flex flex-wrap gap-8 mb-20 border-b border-white/10 pb-8">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs font-bold tracking-[0.2em] uppercase transition-all relative pb-2 ${filter === cat ? 'text-gold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[2px] after:bg-gold' : 'text-white/30 hover:text-gold'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {filteredProducts.map((product) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
            className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gold/30 transition-all cursor-pointer"
            onClick={() => { setSelectedProduct?.(product); setPage?.('product-detail'); }}>
            <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
              <button onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                className="absolute bottom-0 left-0 w-full bg-gold text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                Quick Add
              </button>
              {product.featured ? (
                <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">Featured</div>
              ) : null}
              {(product.sale_price && product.regular_price) && Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100) > 0 && (
                <div className="absolute top-6 right-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">
                  {Math.round(((product.regular_price - product.sale_price) / product.regular_price) * 100)}% OFF
                </div>
              )}
            </div>
            <div className="p-5">
              <h4 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{product.name}</h4>
              <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-3">{product.category}</p>
              <div className="flex items-center gap-2">
                {product.sale_price ? (
                  <>
                    <span className="text-gold font-bold text-sm">RS. {product.sale_price.toLocaleString()}</span>
                    <span className="text-white/30 text-xs line-through">RS. {product.regular_price?.toLocaleString()}</span>
                  </>
                ) : (
                  <span className="text-gold font-bold text-sm">RS. {(product.regular_price || product.price).toLocaleString()}</span>
                )}
              </div>
              <p className="text-[10px] text-white/30 mt-2">Free delivery above Rs.3,000 | 7-day return</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product, addToCart }: { product: Product, addToCart: (p: Product) => void, key?: React.Key }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gold/30 transition-all">
      <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
        <button onClick={() => addToCart(product)}
          className="absolute bottom-0 left-0 w-full bg-gold text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          Quick Add
        </button>
        {product.featured ? (
          <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">Featured</div>
        ) : null}
      </div>
      <div className="p-5">
        <h4 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{product.name}</h4>
        <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-3">{product.category}</p>
        <div className="text-gold font-bold text-sm">RS. {product.price.toLocaleString()}</div>
      </div>
    </motion.div>
  );
}

function CategoryPage({ category, products, addToCart, setPage, setSelectedProduct }: { category: string, products: Product[], addToCart: (p: Product) => void, setPage: (p: Page) => void, setSelectedProduct?: (p: Product) => void }) {
  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12 bg-black min-h-screen">
      <div className="mb-24">
        <span className="text-white/30 text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Collection</span>
        <h1 className="text-7xl font-serif font-bold tracking-tighter text-white">{category.toUpperCase()}</h1>
      </div>
      
      {products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-white/30 text-lg mb-8">No products available in this category yet.</p>
          <button onClick={() => setPage('shop')} className="btn-luxury">View All Products</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {products.map((product) => (
            <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} 
              className="group bg-white/5 border border-white/5 rounded-xl overflow-hidden shadow-sm hover:shadow-lg hover:border-gold/30 transition-all cursor-pointer"
              onClick={() => { setSelectedProduct?.(product); setPage('product-detail'); }}>
              <div className="relative aspect-[3/4] overflow-hidden bg-white/5">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
                <button onClick={() => addToCart(product)}
                  className="absolute bottom-0 left-0 w-full bg-gold text-white py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                  Quick Add
                </button>
                {product.featured ? (
                  <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-gold text-white px-3 py-1">Featured</div>
                ) : null}
              </div>
              <div className="p-5">
                <h4 className="text-lg font-serif font-bold text-white mb-1 group-hover:text-gold transition-colors">{product.name}</h4>
                <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] mb-3">{product.category}</p>
                <div className="text-gold font-bold text-sm">RS. {product.price.toLocaleString()}</div>
                <p className="text-[10px] text-white/30 mt-2">Free delivery above Rs.3,000 | 7-day return</p>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetailPage({ product, addToCart, onBack, setPage }: { product: Product, addToCart: (p: Product) => void, onBack: () => void, setPage: (p: Page) => void }) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeChart, setShowSizeChart] = useState(false);

  const displayPrice = product.sale_price || product.regular_price || product.price;
  const originalPrice = product.regular_price && product.sale_price ? product.regular_price : null;
  const discount = originalPrice ? Math.round(((originalPrice - displayPrice) / originalPrice) * 100) : 0;

  // Get main image based on selected color
  const getMainImage = () => {
    if (product.variantImages && selectedColor && product.variantImages[selectedColor]?.length > 0) {
      return product.variantImages[selectedColor][0];
    }
    if (product.variantImages && Object.keys(product.variantImages).length > 0) {
      return Object.values(product.variantImages)[0][0];
    }
    return product.image;
  };

  // Get all images for gallery - show ALL images regardless of color
  const getGalleryImages = () => {
    const allImages: string[] = [];
    
    if (product.images) {
      product.images.forEach((img: string) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }
    
    if (product.variantImages) {
      Object.values(product.variantImages).forEach((imgs: any) => {
        imgs.forEach((img: string) => {
          if (!allImages.includes(img)) allImages.push(img);
        });
      });
    }
    
    return allImages.length > 0 ? allImages : [product.image];
  };

const mainImage = getMainImage();
  
  // Size chart image URL from Supabase storage
  const SIZE_CHART_URL = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/product-images/size-chart.jpg`;
  
  // Add size chart to gallery
  const getGalleryImages = () => {
    const allImages: string[] = [];
    
    if (product.images) {
      product.images.forEach((img: string) => {
        if (!allImages.includes(img)) allImages.push(img);
      });
    }
    
    if (product.variantImages) {
      Object.values(product.variantImages).forEach((imgs: any) => {
        imgs.forEach((img: string) => {
          if (!allImages.includes(img)) allImages.push(img);
        });
      });
    }
    
    // Add size chart at the end
    allImages.push(SIZE_CHART_URL);
    
    return allImages.length > 1 ? allImages : [product.image];
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-center gap-3 text-sm">
          <button onClick={() => setPage('home2')} className="text-white/40 hover:text-gold">Home</button>
          <span className="text-white/20">/</span>
          <button onClick={() => setPage('shop')} className="text-white/40 hover:text-gold">Shop</button>
          <span className="text-white/20">/</span>
          <span className="text-gold">{product.name}</span>
        </div>
      </div>

      {/* Product Section */}
      <div className="max-w-7xl mx-auto px-6 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square bg-white/5 rounded-2xl overflow-hidden">
              <img src={selectedImage < galleryImages.length ? galleryImages[selectedImage] : mainImage} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              {discount > 0 && (
                <div className="absolute top-6 left-6 bg-gold text-white text-xs font-bold px-4 py-2 rounded">
                  {discount}% OFF
                </div>
              )}
            </div>
            <div className="flex gap-4 overflow-x-auto">
              {galleryImages.map((img: string, idx: number) => (
                <button key={idx} onClick={() => setSelectedImage(idx)}
                  className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === idx ? 'border-gold' : 'border-transparent opacity-50'}`}>
                  <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-8">
            <div>
              <p className="text-gold text-xs font-bold uppercase tracking-widest mb-3">{product.category}</p>
              <h1 className="text-4xl lg:text-5xl font-serif font-bold text-white">{product.name}</h1>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-4">
              <span className="text-4xl font-bold text-gold">Rs. {displayPrice.toLocaleString()}</span>
              {originalPrice && (
                <span className="text-xl text-white/40 line-through">Rs. {originalPrice.toLocaleString()}</span>
              )}
            </div>

            {/* Short Description */}
            {product.short_description && (
              <p className="text-white/60 text-lg leading-relaxed">{product.short_description}</p>
            )}

            {/* SKU */}
            {product.sku && (
              <div className="text-sm text-white/40">
                SKU: <span className="font-mono">{product.sku}</span>
              </div>
            )}

            {/* Size Selection */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white text-sm font-bold">Size</span>
                  <button onClick={() => setShowSizeChart(true)} className="text-white/40 text-xs underline hover:text-gold transition-colors">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-3">
                  {product.sizes.map((size: string) => (
                    <button key={size} onClick={() => setSelectedSize(size)}
                      className={`w-12 h-12 rounded-lg border font-bold text-sm transition-all ${selectedSize === size ? 'border-gold bg-gold text-black' : 'border-white/20 text-white hover:border-gold'}`}>
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <span className="text-white text-sm font-bold block mb-3">Color</span>
                <div className="flex flex-wrap gap-3">
                  {product.colors.map((color: string) => (
                    <button key={color} onClick={() => setSelectedColor(color)}
                      className={`px-4 py-2 rounded-lg border font-bold text-sm transition-all ${selectedColor === color ? 'border-gold bg-gold text-black' : 'border-white/20 text-white hover:border-gold'}`}>
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <span className="text-white text-sm font-bold block mb-3">Quantity</span>
              <div className="flex items-center gap-4">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-12 h-12 rounded-lg border border-white/20 text-white hover:border-gold flex items-center justify-center">-</button>
                <span className="text-xl font-bold text-white w-12 text-center">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-12 h-12 rounded-lg border border-white/20 text-white hover:border-gold flex items-center justify-center">+</button>
              </div>
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${(product.stock_quantity || product.stock) > 0 ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-bold ${(product.stock_quantity || product.stock) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {(product.stock_quantity || product.stock) > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Add to Cart Button */}
            <button onClick={handleAddToCart} className="w-full py-4 bg-gold text-black font-bold text-sm uppercase tracking-widest hover:bg-white transition-colors rounded-lg">
              Add to Cart
            </button>

            {/* Delivery Info */}
            <div className="border-t border-white/10 pt-6 space-y-4">
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                <span>Free delivery above Rs. 3,000</span>
              </div>
              <div className="flex items-center gap-3 text-white/60 text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                <span>7-day return policy</span>
              </div>
            </div>
          </div>
        </div>

        {/* Full Description */}
        {product.description && (
          <div className="mt-20 border-t border-white/10 pt-12">
            <h2 className="text-2xl font-serif font-bold text-white mb-6">Product Description</h2>
            <div className="prose prose-invert max-w-none text-white/60" dangerouslySetInnerHTML={{ __html: product.description }} />
          </div>
        )}
      </div>

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => setShowSizeChart(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-lg font-bold text-black">Size Chart</h3>
              <button onClick={() => setShowSizeChart(false)} className="text-gray-500 hover:text-black">✕</button>
            </div>
            <div className="p-4">
              <img src={SIZE_CHART_URL} alt="Size Chart" className="w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12 bg-black">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
        <div>
          <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Concierge</span>
          <h1 className="text-7xl font-serif font-bold tracking-tighter mb-12 leading-[0.9] text-white">GET IN <br /><span className="italic text-gold">TOUCH.</span></h1>
          <p className="text-white/40 text-xl font-light mb-20 leading-relaxed max-w-md">
            Our luxury concierge team is dedicated to providing an unparalleled experience. Reach out for bespoke orders or sizing consultations.
          </p>
          <div className="space-y-12">
            {[
              { label: 'Email', value: 'bssoleofficial@gmail.com' },
              { label: 'WhatsApp', value: '0325 528 1122' },
              { label: 'Studio', value: 'Gulberg III, Lahore, Pakistan' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-8">
                <div className="w-[1px] h-12 bg-gold/30"></div>
                <div>
                  <div className="text-[10px] text-gold font-bold uppercase tracking-[0.3em] mb-2">{item.label}</div>
                  <div className="text-2xl font-serif text-white">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 p-12 md:p-20 rounded-xl">
          <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">First Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-white" placeholder="BILAL" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Last Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-white" placeholder="MARTH" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Email Address</label>
              <input type="email" className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-white" placeholder="HELLO@BSSOLE.COM" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Message</label>
              <textarea rows={4} className="w-full bg-white/5 border border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm resize-none text-white" placeholder="HOW CAN WE ASSIST YOU?"></textarea>
            </div>
            <button className="w-full py-4 bg-gold text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors rounded">Send Inquiry</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function ReturnPolicyPage({ setPage }: { setPage: (p: Page) => void }) {
  const policies = [
    {
      title: 'Return Window',
      icon: '📅',
      detail: 'You may return any product within 7 days of delivery. Returns requested after 7 days will not be accepted under any circumstances. To be eligible for a return, your item must be unused and in the same condition that you received it. It must also be in the original packaging.',
    },
    {
      title: 'Delivery Charges',
      icon: '🚚',
      detail: 'All delivery charges incurred during the return process are the sole responsibility of the customer. BSSOLE does not cover return shipping costs. Please use a tracked shipping method to ensure your return is received.',
    },
    {
      title: 'Product Condition',
      icon: '📦',
      detail: 'Items must be returned in their original, unworn condition with all original packaging, tags, and accessories intact. Worn or damaged items will not be accepted. Please try on shoes on a clean surface to avoid damage.',
    },
    {
      title: 'How to Initiate a Return',
      icon: '✉️',
      detail: 'Contact us at bssoleofficial@gmail.com or WhatsApp 0325 528 1122 with your order details to initiate a return request within the 7-day window. Include your order number and photos of the item.',
    },
    {
      title: 'Refund Process',
      icon: '💰',
      detail: 'Once we receive and inspect your return, we will notify you of the status of your refund. If approved, your refund will be processed within 5-7 business days and applied to your original payment method.',
    },
    {
      title: 'Exchanges',
      icon: '🔄',
      detail: 'We only replace items if they are defective or damaged. If you need to exchange an item for the same product, contact us at bssoleofficial@gmail.com with your order details.',
    },
    {
      title: 'Non-Returnable Items',
      icon: '❌',
      detail: 'Gift cards, downloadable software products, and sale items are non-refundable. Please note that certain types of items cannot be returned, such as perishable goods.',
    },
    {
      title: 'Late or Missing Refunds',
      icon: '⏰',
      detail: 'If you have not received your refund within 7 business days after approval, please check your bank account again. Then contact your credit card company, as it may take some time before your refund is officially posted.',
    },
  ];

  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative py-40 px-6 md:px-12 border-b border-white/5 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-6 block">Policy</span>
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-6 text-white">
            RETURN <span className="italic text-gold">POLICY</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed">
            At BSSOLE, we stand behind the quality of every product. Please read our return policy carefully before making a purchase.
          </p>
        </div>
      </div>

      {/* Policy Cards */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          {policies.map((policy, i) => (
            <motion.div
              key={policy.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white/5 border border-white/10 p-10 hover:border-gold/30 transition-all duration-500 group rounded-xl"
            >
              <div className="text-3xl mb-6">{policy.icon}</div>
              <h3 className="text-lg font-serif font-bold text-gold mb-4">{policy.title}</h3>
              <p className="text-white/40 text-sm leading-relaxed">{policy.detail}</p>
            </motion.div>
          ))}
        </div>

        {/* Summary Banner */}
        <div className="border-2 border-gold/20 bg-gold/5 p-10 md:p-16 text-center mb-16 rounded-xl">
          <div className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4">In Short</div>
          <p className="text-2xl md:text-3xl font-serif font-bold leading-snug max-w-2xl mx-auto text-white">
            Returns accepted within <span className="text-gold">7 days</span> of delivery.<br />
            Return delivery charges are paid by the <span className="text-gold">customer</span>.<br />
            Refund processed within <span className="text-gold">5-7 business days</span>.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-white/30 mb-8 text-sm">Have questions about your return?</p>
          <button
            onClick={() => setPage('contact')}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gold text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors rounded"
          >
            Contact Us <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function DeliveryPolicyPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="min-h-screen bg-black">
      {/* Hero */}
      <div className="relative py-40 px-6 md:px-12 border-b border-white/5 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-6 block">Policy</span>
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter mb-6 text-white">
            DELIVERY <span className="italic text-gold">POLICY</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl leading-relaxed">
            Learn about our delivery options, charges, and shipping timelines.
          </p>
        </div>
      </div>

      {/* Delivery Info */}
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
          <div className="bg-white/5 border border-white/10 p-10 hover:border-gold/30 transition-all duration-500 group rounded-xl">
            <div className="text-3xl mb-6">🚚</div>
            <h3 className="text-lg font-serif font-bold text-gold mb-4">Free Shipping</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Enjoy <strong className="text-white">FREE delivery</strong> on all orders above <strong className="text-white">Rs. 3,000</strong>. For orders below Rs. 3,000, a flat delivery charge of <strong className="text-white">Rs. 300</strong> applies.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-10 hover:border-gold/30 transition-all duration-500 group rounded-xl">
            <div className="text-3xl mb-6">📍</div>
            <h3 className="text-lg font-serif font-bold text-gold mb-4">Delivery Areas</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              We deliver across Pakistan. For remote areas, additional delivery time may be required. We'll contact you if any issues arise with your delivery address.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-10 hover:border-gold/30 transition-all duration-500 group rounded-xl">
            <div className="text-3xl mb-6">⏱️</div>
            <h3 className="text-lg font-serif font-bold text-gold mb-4">Delivery Time</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Standard delivery takes <strong className="text-white">3-7 business days</strong> depending on your location. Express delivery options may be available for major cities.
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 p-10 hover:border-gold/30 transition-all duration-500 group rounded-xl">
            <div className="text-3xl mb-6">📦</div>
            <h3 className="text-lg font-serif font-bold text-gold mb-4">Order Tracking</h3>
            <p className="text-white/40 text-sm leading-relaxed">
              Once your order is dispatched, you will receive a tracking number via SMS/Email to monitor your delivery status.
            </p>
          </div>
        </div>

        {/* Summary Banner */}
        <div className="border-2 border-gold/20 bg-gold/5 p-10 md:p-16 text-center mb-16 rounded-xl">
          <div className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4">In Short</div>
          <p className="text-2xl md:text-3xl font-serif font-bold leading-snug max-w-2xl mx-auto text-white">
            Free shipping on orders above <span className="text-gold">Rs. 3,000</span>.<br />
            Flat Rs. 300 charge on orders below <span className="text-gold">Rs. 3,000</span>.
          </p>
        </div>

        {/* Contact CTA */}
        <div className="text-center">
          <p className="text-white/30 mb-8 text-sm">Have questions about delivery?</p>
          <button
            onClick={() => setPage('contact')}
            className="inline-flex items-center gap-3 px-10 py-4 bg-gold text-white text-xs font-bold uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-colors rounded"
          >
            Contact Us <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminPage({ products, refresh, deliveryCharges, refreshCharges, onLogout }: {
  products: Product[];
  refresh: () => void;
  deliveryCharges: DeliveryCharge[];
  refreshCharges: () => void;
  onLogout: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'products' | 'delivery'>('products');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageUploading, setImageUploading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '', category: '', featured: 0, stock: 0, colors: [], sizes: [] });
  const [colorInput, setColorInput] = useState('');
  const [sizeInput, setSizeInput] = useState('');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (product: Product) => {
    setEditingId(product.id);
    setFormData(product);
    setImageFile(null);
    setImagePreview(product.image || '');
    setColorInput('');
    setSizeInput('');
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let imageUrl = formData.image || '';

      // Upload new image file if selected
      if (imageFile) {
        // Verify session is still valid before attempting upload
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          showToast('Session expired. Please log in again.', 'error');
          await supabase.auth.signOut();
          setSaving(false);
          return;
        }

        setImageUploading(true);
        const ext = imageFile.name.split('.').pop();
        const fileName = `product-${Date.now()}.${ext}`;
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile, { upsert: true });
        setImageUploading(false);
        if (uploadError) {
          // Distinguish auth errors from bucket errors
          if (uploadError.message.includes('469') || uploadError.message.includes('401') || uploadError.message.toLowerCase().includes('auth') || uploadError.message.toLowerCase().includes('jwt')) {
            showToast('Session expired. Please log in again.', 'error');
            await supabase.auth.signOut();
            setSaving(false);
            return;
          }
          if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('404')) {
            showToast('Storage bucket not found. Please create \'product-images\' bucket in Supabase Dashboard → Storage.', 'error');
            setSaving(false);
            return;
          }
          throw new Error('Image upload failed: ' + uploadError.message);
        }
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(uploadData.path);
        imageUrl = urlData.publicUrl;
      }
      if (editingId === 0) {
        // New product
        const { error } = await supabase.from('products').insert([{
          name: formData.name, description: formData.description,
          price: formData.price, image: imageUrl,
          category: formData.category, featured: formData.featured ? 1 : 0,
          stock: formData.stock ?? 0,
          colors: formData.colors ?? [],
          sizes: formData.sizes ?? [],
        }]);
        if (error) throw error;
        showToast('Product added successfully!');
      } else {
        // Update
        const { error } = await supabase.from('products').update({
          name: formData.name, description: formData.description,
          price: formData.price, image: imageUrl,
          category: formData.category, featured: formData.featured ? 1 : 0,
          stock: formData.stock ?? 0,
          colors: formData.colors ?? [],
          sizes: formData.sizes ?? [],
        }).eq('id', editingId);
        if (error) throw error;
        showToast('Product updated!');
      }
      setEditingId(null);
      setFormData({ name: '', description: '', price: 0, image: '', category: '', featured: 0, stock: 0, colors: [], sizes: [] });
      setImageFile(null);
      setImagePreview('');
      setColorInput('');
      setSizeInput('');
      refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save product', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    setDeleting(id);
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) { showToast(error.message, 'error'); }
    else { showToast('Product deleted.'); refresh(); }
    setDeleting(null);
  };

  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className={`fixed top-24 right-8 z-[300] px-6 py-4 font-bold text-sm tracking-wide border ${toast.type === 'success' ? 'bg-gold text-black border-gold' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-20 gap-8">
        <div>
          <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block flex items-center gap-2">
            <Shield size={10} /> Admin Dashboard
          </span>
          <h1 className="text-6xl font-serif font-bold tracking-tighter">PRODUCT <span className="gold-text-gradient italic">MANAGEMENT</span></h1>
        </div>
        <div className="flex gap-4">
          {!editingId && (
            <button onClick={() => { setEditingId(0); setFormData({ name: '', description: '', price: 0, image: '', category: '', featured: 0, stock: 0, colors: [], sizes: [] }); setColorInput(''); setSizeInput(''); }}
              className="btn-luxury flex items-center gap-2">
              <Plus size={16} /> Add Product
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/30 hover:border-red-500 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-[0.2em]">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-0 mb-16 border-b border-white/5">
        {[{ key: 'products', label: 'Products' }, { key: 'delivery', label: 'Delivery Charges' }].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-8 py-4 text-xs font-bold uppercase tracking-[0.3em] transition-all border-b-2 ${activeTab === tab.key
              ? 'border-gold text-gold'
              : 'border-transparent text-white/30 hover:text-white'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'products' && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Total Products', value: products.length },
            { label: 'Featured', value: products.filter(p => p.featured).length },
            { label: 'Categories', value: new Set(products.map(p => p.category)).size },
            { label: 'Avg. Price', value: `RS. ${products.length ? Math.round(products.reduce((a, p) => a + p.price, 0) / products.length).toLocaleString() : 0}` },
          ].map(stat => (
            <div key={stat.label} className="bg-[#050505] border border-white/5 p-6">
              <div className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mb-3">{stat.label}</div>
              <div className="text-3xl font-serif font-bold text-gold">{stat.value}</div>
            </div>
          ))}
        </div>

        {/* Add/Edit Form */}
        {editingId !== null && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-[#050505] border border-white/5 p-12 mb-20">
            <h2 className="text-2xl font-serif font-bold mb-12 text-gold">{editingId === 0 ? 'New Product' : 'Edit Product'}</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
              {[
                { label: 'Product Name', key: 'name', placeholder: 'E.G. GOLDEN SOLE RUNNER', type: 'text' },
                { label: 'Price (RS.)', key: 'price', placeholder: 'E.G. 15000', type: 'number' },
                { label: 'Category', key: 'category', placeholder: 'E.G. FORMAL', type: 'text' },
              ].map(field => (
                <div key={field.key} className="space-y-4">
                  <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder}
                    className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                    value={(formData as any)[field.key] || ''}
                    onChange={e => setFormData({ ...formData, [field.key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })} />
                </div>
              ))}

              {/* Image Upload */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Product Image</label>
                <label
                  htmlFor="product-image-upload"
                  className="flex flex-col items-center justify-center w-full border border-dashed border-white/10 hover:border-gold cursor-pointer transition-all overflow-hidden relative group"
                  style={{ minHeight: '160px' }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover opacity-80 group-hover:opacity-60 transition-opacity" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-3 py-10 text-white/20">
                      <svg width="36" height="36" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Click to upload image</span>
                      <span className="text-[9px] text-white/10">JPG, PNG, WEBP supported</span>
                    </div>
                  )}
                  <input
                    id="product-image-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageChange}
                  />
                </label>
                {imageUploading && (
                  <div className="flex items-center gap-2 text-gold text-[10px] font-bold uppercase tracking-[0.2em]">
                    <div className="w-3 h-3 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
                    Uploading...
                  </div>
                )}
              </div>
              {/* Description */}
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Description</label>
                <textarea className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm resize-none"
                  placeholder="PRODUCT DETAILS..." rows={3}
                  value={formData.description || ''}
                  onChange={e => setFormData({ ...formData, description: e.target.value })} />
              </div>

              {/* Stock */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Stock (Units)</label>
                <input type="number" min={0} placeholder="0"
                  className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                  value={formData.stock ?? 0}
                  onChange={e => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })} />
              </div>

              {/* Colors Tag Input */}
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Colors</label>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {(formData.colors ?? []).map(color => (
                    <span key={color} className="flex items-center gap-1 px-3 py-1 bg-white/5 border border-white/10 text-xs font-bold uppercase tracking-wider">
                      {color}
                      <button type="button" onClick={() => setFormData({ ...formData, colors: (formData.colors ?? []).filter(c => c !== color) })} className="text-white/30 hover:text-red-400 ml-1">×</button>
                    </span>
                  ))}
                </div>
                <input type="text" placeholder="TYPE A COLOUR + PRESS ENTER"
                  className="w-full bg-transparent border-b border-white/10 py-3 outline-none focus:border-gold transition-all text-sm"
                  value={colorInput}
                  onChange={e => setColorInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && colorInput.trim()) {
                      e.preventDefault();
                      const val = colorInput.trim().replace(/,$/, '');
                      if (val && !(formData.colors ?? []).includes(val)) {
                        setFormData({ ...formData, colors: [...(formData.colors ?? []), val] });
                      }
                      setColorInput('');
                    }
                  }} />
                <p className="text-[9px] text-white/20">Press Enter or comma to add each colour</p>
              </div>

              {/* Sizes Tag Input */}
              <div className="space-y-4 md:col-span-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Sizes</label>
                <div className="flex flex-wrap gap-2 min-h-[32px]">
                  {(formData.sizes ?? []).map(size => (
                    <span key={size} className="flex items-center gap-1 px-3 py-1 bg-gold/10 border border-gold/20 text-xs font-bold uppercase tracking-wider text-gold">
                      {size}
                      <button type="button" onClick={() => setFormData({ ...formData, sizes: (formData.sizes ?? []).filter(s => s !== size) })} className="text-gold/50 hover:text-red-400 ml-1">×</button>
                    </span>
                  ))}
                </div>
                <input type="text" placeholder="E.G. 40, 41, 42 — TYPE A SIZE + PRESS ENTER"
                  className="w-full bg-transparent border-b border-white/10 py-3 outline-none focus:border-gold transition-all text-sm"
                  value={sizeInput}
                  onChange={e => setSizeInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && sizeInput.trim()) {
                      e.preventDefault();
                      const val = sizeInput.trim().replace(/,$/, '');
                      if (val && !(formData.sizes ?? []).includes(val)) {
                        setFormData({ ...formData, sizes: [...(formData.sizes ?? []), val] });
                      }
                      setSizeInput('');
                    }
                  }} />
                <p className="text-[9px] text-white/20">Press Enter or comma to add each size</p>
              </div>

              {/* Featured */}
              <label className="flex items-center gap-4 cursor-pointer group">
                <div className={`w-6 h-6 border flex items-center justify-center transition-all ${formData.featured ? 'bg-gold border-gold' : 'border-white/20 group-hover:border-gold'}`}>
                  {formData.featured ? <Save size={12} className="text-black" /> : null}
                </div>
                <input type="checkbox" className="hidden" checked={!!formData.featured}
                  onChange={e => setFormData({ ...formData, featured: e.target.checked ? 1 : 0 })} />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/50 group-hover:text-white transition-colors">Featured on Homepage</span>
              </label>
            </div>
            <div className="flex gap-6">
              <button onClick={handleSave} disabled={saving} className="btn-luxury px-12 flex items-center gap-2 disabled:opacity-50">
                {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                Save Changes
              </button>
              <button onClick={() => setEditingId(null)} className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors">Discard</button>
            </div>
          </motion.div>
        )}

        {/* Products Table */}
        <div className="border border-white/5 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#050505] border-b border-white/5">
              <tr>
                <th className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Product</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Category</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Price</th>
                <th className="px-8 py-6 text-[10px] font-bold text-gold uppercase tracking-[0.3em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-8 py-16 text-center text-white/20 text-sm">No products yet. Add your first product above.</td>
                </tr>
              ) : (
                products.map(product => (
                  <tr key={product.id} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 overflow-hidden bg-[#111] border border-white/5">
                          <img src={product.image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" referrerPolicy="no-referrer" />
                        </div>
                        <div>
                          <div className="font-serif font-bold text-lg">{product.name}</div>
                          <div className="text-[8px] font-bold text-gold uppercase tracking-[0.2em]">{product.featured ? '★ Featured' : ''}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-[10px] font-bold text-white/30 uppercase tracking-[0.2em]">{product.category}</td>
                    <td className="px-8 py-6 font-bold text-gold">RS. {product.price.toLocaleString()}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-4">
                        <button onClick={() => handleEdit(product)} className="w-10 h-10 flex items-center justify-center border border-white/5 text-white/30 hover:border-gold hover:text-gold transition-all">
                          <Edit size={16} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} disabled={deleting === product.id}
                          className="w-10 h-10 flex items-center justify-center border border-white/5 text-white/30 hover:border-red-500 hover:text-red-500 transition-all disabled:opacity-50">
                          {deleting === product.id ? <div className="w-4 h-4 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </>)
      }

      {
        activeTab === 'delivery' && (
          <DeliveryChargesTab charges={deliveryCharges} refresh={refreshCharges} showToast={showToast} />
        )
      }
    </div >
  );
}

function DeliveryChargesTab({
  charges, refresh, showToast
}: {
  charges: DeliveryCharge[];
  refresh: () => void;
  showToast: (msg: string, type?: 'success' | 'error') => void;
}) {
  const empty = { min_order: 0, max_order: null as number | null, charge: 0, label: '' };
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId === 0) {
        const { error } = await supabase.from('delivery_charges').insert([form]);
        if (error) throw error;
        showToast('Delivery rule added!');
      } else {
        const { error } = await supabase.from('delivery_charges').update(form).eq('id', editingId);
        if (error) throw error;
        showToast('Delivery rule updated!');
      }
      setEditingId(null);
      setForm(empty);
      refresh();
    } catch (err: any) {
      showToast(err.message || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this delivery rule?')) return;
    const { error } = await supabase.from('delivery_charges').delete().eq('id', id);
    if (error) showToast(error.message, 'error');
    else { showToast('Rule deleted.'); refresh(); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-12">
        <div>
          <p className="text-white/40 text-sm max-w-lg">
            Set delivery charges for different order value ranges. These rules are displayed live on the homepage banner.
          </p>
        </div>
        {editingId === null && (
          <button onClick={() => { setEditingId(0); setForm(empty); }} className="btn-luxury flex items-center gap-2">
            <Plus size={16} /> Add Rule
          </button>
        )}
      </div>

      {editingId !== null && (
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[#050505] border border-white/5 p-10 mb-12">
          <h3 className="text-xl font-serif font-bold mb-10 text-gold">{editingId === 0 ? 'New Rule' : 'Edit Rule'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Custom Label (optional)</label>
              <input type="text" placeholder="E.G. FREE SHIPPING ABOVE RS. 5,000"
                className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                value={form.label}
                onChange={e => setForm({ ...form, label: e.target.value })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Min Order (RS.)</label>
              <input type="number" placeholder="0"
                className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                value={form.min_order}
                onChange={e => setForm({ ...form, min_order: parseFloat(e.target.value) || 0 })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Max Order (RS.) — leave blank for no limit</label>
              <input type="number" placeholder="Leave blank for no upper limit"
                className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                value={form.max_order ?? ''}
                onChange={e => setForm({ ...form, max_order: e.target.value === '' ? null : parseFloat(e.target.value) })} />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Delivery Charge (RS.) — set 0 for free</label>
              <input type="number" placeholder="0 = Free delivery"
                className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm"
                value={form.charge}
                onChange={e => setForm({ ...form, charge: parseFloat(e.target.value) || 0 })} />
            </div>
          </div>
          <div className="flex gap-6">
            <button onClick={handleSave} disabled={saving}
              className="btn-luxury px-10 flex items-center gap-2 disabled:opacity-50">
              {saving ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
              Save Rule
            </button>
            <button onClick={() => { setEditingId(null); setForm(empty); }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-white/30 hover:text-white transition-colors">Discard</button>
          </div>
        </motion.div>
      )}

      <div className="border border-white/5 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-[#050505] border-b border-white/5">
            <tr>
              <th className="px-8 py-5 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Label / Rule</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Order Range</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gold uppercase tracking-[0.3em]">Charge</th>
              <th className="px-8 py-5 text-[10px] font-bold text-gold uppercase tracking-[0.3em] text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {charges.length === 0 ? (
              <tr><td colSpan={4} className="px-8 py-14 text-center text-white/20 text-sm">No delivery rules yet. Add your first rule above.</td></tr>
            ) : charges.map(dc => (
              <tr key={dc.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-5 font-serif font-bold">{dc.label || '—'}</td>
                <td className="px-8 py-5 text-sm text-white/50">
                  RS. {dc.min_order.toLocaleString()} – {dc.max_order != null ? `RS. ${dc.max_order.toLocaleString()}` : 'No limit'}
                </td>
                <td className="px-8 py-5 font-bold">
                  {dc.charge === 0
                    ? <span className="text-gold">FREE</span>
                    : <span>RS. {dc.charge.toLocaleString()}</span>}
                </td>
                <td className="px-8 py-5 text-right">
                  <div className="flex justify-end gap-4">
                    <button onClick={() => { setEditingId(dc.id); setForm({ min_order: dc.min_order, max_order: dc.max_order, charge: dc.charge, label: dc.label }); }}
                      className="w-10 h-10 flex items-center justify-center border border-white/5 text-white/30 hover:border-gold hover:text-gold transition-all">
                      <Edit size={16} />
                    </button>
                    <button onClick={() => handleDelete(dc.id)}
                      className="w-10 h-10 flex items-center justify-center border border-white/5 text-white/30 hover:border-red-500 hover:text-red-500 transition-all">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function UserAuthModal({
  isOpen, onClose, session, isAdmin, onLogout, onNavigateAdmin
}: {
  isOpen: boolean;
  onClose: () => void;
  session: any;
  isAdmin: boolean;
  onLogout: () => void;
  onNavigateAdmin: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reset = () => { setEmail(''); setPassword(''); setName(''); setError(''); setSuccess(''); setShowPassword(false); };

  const handleClose = () => { reset(); onClose(); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setError('Invalid email or password.');
      else { setSuccess('Welcome back!'); setTimeout(handleClose, 800); }
    } else {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: name } } });
      if (error) setError(error.message);
      else setSuccess('Account created! Check your email to confirm.');
    }
    setLoading(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[250]" />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-sm bg-[#050505] border-l border-white/5 z-[300] flex flex-col"
          >
            {/* Header */}
            <div className="p-8 border-b border-white/5 flex justify-between items-center">
              <div>
                {session ? (
                  <h2 className="text-xl font-serif font-bold gold-text-gradient">MY ACCOUNT</h2>
                ) : (
                  <div className="flex gap-6">
                    <button onClick={() => { setMode('login'); reset(); }}
                      className={`text-xs font-bold uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${mode === 'login' ? 'border-gold text-gold' : 'border-transparent text-white/30 hover:text-white'}`}>
                      Login
                    </button>
                    <button onClick={() => { setMode('signup'); reset(); }}
                      className={`text-xs font-bold uppercase tracking-[0.2em] pb-2 border-b-2 transition-all ${mode === 'signup' ? 'border-gold text-gold' : 'border-transparent text-white/30 hover:text-white'}`}>
                      Sign Up
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleClose} className="text-white/30 hover:text-gold transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-grow overflow-y-auto p-8">
              {session ? (
                /* Logged-in profile view */
                <div className="space-y-8">
                  <div className="flex items-center gap-5 p-6 bg-black border border-white/5">
                    <div className="w-14 h-14 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center">
                      <UserCircle2 size={28} className="text-gold" />
                    </div>
                    <div>
                      <div className="font-serif font-bold text-lg">{session.user.user_metadata?.full_name || 'Customer'}</div>
                      <div className="text-[10px] text-white/30 uppercase tracking-[0.2em] mt-1">{session.user.email}</div>
                      {isAdmin && <div className="text-[9px] font-bold text-gold uppercase tracking-[0.2em] mt-1">★ Admin</div>}
                    </div>
                  </div>

                  {isAdmin && (
                    <button onClick={onNavigateAdmin}
                      className="w-full flex items-center justify-between px-6 py-4 border border-gold/20 text-gold hover:bg-gold/5 transition-all group">
                      <div className="flex items-center gap-3">
                        <Shield size={16} />
                        <span className="text-xs font-bold uppercase tracking-[0.2em]">Admin Dashboard</span>
                      </div>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}

                  <div className="space-y-3">
                    {[
                      { label: 'My Orders', icon: ShoppingBag },
                    ].map(({ label, icon: Icon }) => (
                      <button key={label} className="w-full flex items-center justify-between px-6 py-4 border border-white/5 text-white/50 hover:border-white/20 hover:text-white transition-all group">
                        <div className="flex items-center gap-3">
                          <Icon size={16} />
                          <span className="text-xs font-bold uppercase tracking-[0.2em]">{label}</span>
                        </div>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                      </button>
                    ))}
                  </div>

                  <button onClick={onLogout}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 border border-red-500/20 text-red-400 hover:bg-red-500/5 transition-all text-xs font-bold uppercase tracking-[0.2em] mt-auto">
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              ) : (
                /* Login / Signup form */
                <form onSubmit={handleSubmit} className="space-y-8">
                  <p className="text-white/30 text-sm leading-relaxed">
                    {mode === 'login' ? 'Welcome back. Sign in to your BSSOLE account.' : 'Create your BSSOLE account for a seamless luxury experience.'}
                  </p>

                  {mode === 'signup' && (
                    <div className="space-y-3">
                      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Full Name</label>
                      <input type="text" required value={name} onChange={e => setName(e.target.value)}
                        placeholder="YOUR NAME"
                        className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm placeholder:text-white/20" />
                    </div>
                  )}

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Email</label>
                    <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                      placeholder="YOUR@EMAIL.COM"
                      className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm placeholder:text-white/20" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Password</label>
                    <div className="relative">
                      <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm pr-10 placeholder:text-white/20" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold transition-colors">
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-4 py-3 text-red-400 text-xs font-bold">
                      <AlertCircle size={14} /> {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex items-center gap-3 bg-gold/10 border border-gold/20 px-4 py-3 text-gold text-xs font-bold">
                      ✓ {success}
                    </motion.div>
                  )}

                  <button type="submit" disabled={loading}
                    className="btn-luxury w-full py-5 flex items-center justify-center gap-3 disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" /> : null}
                    {mode === 'login' ? 'Sign In' : 'Create Account'}
                  </button>

                  <p className="text-center text-white/20 text-[10px] uppercase tracking-[0.2em]">
                    {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
                    <button type="button" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); reset(); }}
                      className="text-gold hover:underline">
                      {mode === 'login' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

