import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Menu, X, Instagram, Facebook, Twitter, Trash2, Edit, Plus, Save, ArrowRight, Search, User, LogOut, Shield, Eye, EyeOff, AlertCircle, UserCircle2 } from 'lucide-react';
import { Product, Page, CartItem } from './types';
import { supabase } from './lib/supabase';
import AdminLogin from './components/AdminLogin';
import type { Session } from '@supabase/supabase-js';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    loadProducts();
    const savedCart = localStorage.getItem('bss_cart');
    if (savedCart) {
      try { setCart(JSON.parse(savedCart)); } catch (e) { console.error("Failed to parse cart", e); }
    }
    // Check existing auth session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('bss_cart', JSON.stringify(cart));
  }, [cart]);

  const loadProducts = async () => {
    try {
      const { data, error } = await supabase.from('products').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      setProducts(data || []);
    } catch (err) {
      console.error("Failed to load products", err);
    } finally {
      setLoading(false);
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
      case 'home': return <HomePage products={products.filter(p => p.featured)} setPage={setCurrentPage} addToCart={addToCart} />;
      case 'shop': return <ShopPage products={products} addToCart={addToCart} />;
      case 'contact': return <ContactPage />;
      case 'admin':
        if (!session) return <AdminLogin onLoginSuccess={() => setCurrentPage('admin')} />;
        return <AdminPage products={products} refresh={loadProducts} onLogout={handleLogout} />;
      default: return <HomePage products={products.filter(p => p.featured)} setPage={setCurrentPage} addToCart={addToCart} />;
    }
  };

  const isAdmin = session?.user?.email === 'adminbssole@gmail.com';


  return (
    <div className="min-h-screen flex flex-col selection:bg-gold selection:text-black">
      {/* Announcement Bar */}
      <div className="announcement-bar">
        🎉 FREE SHIPPING ON ORDERS ABOVE RS. 10,000! | USE CODE #BSSOLE7 – EXTRA DISCOUNT!
      </div>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-xl border-b border-white/5 py-6 px-6 md:px-12">
        <div className="max-w-[1600px] mx-auto flex justify-between items-center">
          {/* Left */}
          <div className="hidden md:flex items-center gap-6">
            <button className="text-white/70 hover:text-gold transition-colors"><Search size={20} /></button>
            <div className="h-4 w-[1px] bg-white/10"></div>
            <button onClick={() => setIsMenuOpen(true)} className="text-xs font-bold tracking-[0.2em] uppercase hover:text-gold transition-colors">Menu</button>
          </div>

          {/* Center: Logo */}
          <div className="text-3xl font-serif font-black tracking-tighter cursor-pointer flex items-center gap-1 group" onClick={() => setCurrentPage('home')}>
            <span className="gold-text-gradient group-hover:opacity-80 transition-opacity">BS</span>
            <span className="text-white">SOLE</span>
          </div>

          {/* Right */}
          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-8 mr-6">
              {['shop', 'contact'].map((page) => (
                <button key={page} onClick={() => setCurrentPage(page as Page)}
                  className={`uppercase text-[10px] tracking-[0.3em] font-bold transition-colors ${currentPage === page ? 'text-gold' : 'text-white/50 hover:text-gold'}`}>
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setIsAuthOpen(true)}
              className="text-white/70 hover:text-gold transition-colors relative"
              title={session ? session.user.email : 'Login / Sign Up'}
            >
              <User size={20} />
              {session && <span className="absolute -top-1 -right-1 w-2 h-2 bg-gold rounded-full" />}
            </button>
            <button onClick={() => setIsCartOpen(true)} className="text-white/70 hover:text-gold transition-colors relative">
              <ShoppingBag size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gold text-black text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cartCount}</span>
              )}
            </button>
            <button className="md:hidden text-gold" onClick={() => setIsMenuOpen(!isMenuOpen)}>
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </nav>

      {/* Full Screen Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black flex flex-col md:flex-row">
            <div className="flex-1 p-12 flex flex-col justify-between border-r border-white/5">
              <div className="flex justify-between items-center">
                <div className="text-2xl font-serif font-bold gold-text-gradient">BSSOLE</div>
                <button onClick={() => setIsMenuOpen(false)} className="text-gold hover:rotate-90 transition-transform duration-500"><X size={32} /></button>
              </div>
              <div className="flex flex-col gap-6">
                {['home', 'shop', 'contact'].map((page, i) => (
                  <motion.button key={page} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.1 }}
                    onClick={() => { setCurrentPage(page as Page); setIsMenuOpen(false); }}
                    className="text-5xl md:text-7xl font-serif font-bold text-left hover:italic hover:pl-4 transition-all duration-500 group">
                    <span className={currentPage === page ? 'gold-text-gradient' : 'text-white/20 group-hover:text-white'}>{page.toUpperCase()}</span>
                  </motion.button>
                ))}
              </div>
              <div className="flex gap-8 text-white/30 text-xs tracking-[0.2em] uppercase font-bold">
                <a href="#" className="hover:text-gold">Instagram</a>
                <a href="#" className="hover:text-gold">Facebook</a>
                <a href="#" className="hover:text-gold">Twitter</a>
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
                  <button className="btn-luxury w-full py-6 text-sm">Checkout Now</button>
                  <p className="text-center text-[8px] text-white/20 uppercase tracking-[0.2em] mt-6">Shipping & taxes calculated at checkout</p>
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
                <h3 className="text-4xl font-serif font-bold gold-text-gradient mb-8">BSSOLE</h3>
                <p className="text-white/40 text-lg max-w-md leading-relaxed mb-8">
                  Redefining everyday luxury with handcrafted footwear and accessories. Experience the soul of premium craftsmanship at BSSOLE.COM.
                </p>
                <div className="flex gap-6">
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all"><Instagram size={18} /></a>
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all"><Facebook size={18} /></a>
                  <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:border-gold hover:text-gold transition-all"><Twitter size={18} /></a>
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
                  <li><a href="#" className="hover:text-white transition-colors">Shipping Policy</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Returns & Exchanges</a></li>
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

function HomePage({ products, setPage, addToCart }: { products: Product[], setPage: (p: Page) => void, addToCart: (p: Product) => void }) {
  return (
    <div>
      <section className="relative h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=1920&q=80&fit=crop" alt="Luxury shoe hero" className="w-full h-full object-cover scale-110" />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/20 to-transparent"></div>
        </div>
        <div className="relative z-10 px-6 md:px-24 max-w-4xl">
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 1, ease: "easeOut" }}>
            <span className="text-gold text-xs font-bold tracking-[0.5em] uppercase mb-6 block">Est. 2026</span>
            <h1 className="text-7xl md:text-[120px] font-serif font-black leading-[0.9] mb-8 tracking-tighter">
              BEYOND <br />
              <span className="gold-text-gradient italic">LUXURY.</span>
            </h1>
            <p className="text-white/60 text-lg md:text-xl font-light max-w-lg mb-12 leading-relaxed">
              Redefining the essence of men's footwear. Handcrafted soles designed for those who command presence in every step.
            </p>
            <div className="flex flex-wrap gap-6">
              <button onClick={() => setPage('shop')} className="btn-luxury">Explore Shop</button>
              <button onClick={() => setPage('contact')} className="px-10 py-4 text-xs font-bold uppercase tracking-[0.2em] hover:text-gold transition-colors flex items-center gap-2 group">
                Contact Us <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </div>
          </motion.div>
        </div>
        <div className="absolute right-12 bottom-24 hidden lg:block">
          <div className="rotate-90 origin-right text-[10px] font-bold tracking-[1em] uppercase text-white/20">Handcrafted Excellence • BSSOLE.COM</div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-12 bg-black">
        <div className="max-w-[1600px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px]">
            <div className="md:col-span-8 relative group overflow-hidden cursor-pointer" onClick={() => setPage('shop')}>
              <img src="https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?w=1200&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Formal collection" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
              <div className="absolute bottom-12 left-12">
                <h3 className="text-5xl font-serif font-bold mb-4">THE FORMAL <br /> COLLECTION</h3>
                <span className="text-xs font-bold tracking-[0.2em] uppercase border-b border-gold pb-1">Shop Now</span>
              </div>
            </div>
            <div className="md:col-span-4 grid grid-rows-2 gap-6">
              <div className="relative group overflow-hidden cursor-pointer" onClick={() => setPage('shop')}>
                <img src="https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=600&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Casual soles" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-3xl font-serif font-bold mb-2">CASUAL SOLES</h3>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Explore</span>
                </div>
              </div>
              <div className="relative group overflow-hidden cursor-pointer" onClick={() => setPage('shop')}>
                <img src="https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80&fit=crop" className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="Accessories" />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute bottom-8 left-8">
                  <h3 className="text-3xl font-serif font-bold mb-2">ACCESSORIES</h3>
                  <span className="text-[10px] font-bold tracking-[0.2em] uppercase">Explore</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-32 px-6 md:px-12 bg-[#050505]">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-20 gap-8">
            <div className="max-w-xl">
              <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Curated Selection</span>
              <h2 className="text-6xl font-serif font-bold tracking-tighter">FEATURED DROPS</h2>
            </div>
            <button onClick={() => setPage('shop')} className="text-xs font-bold tracking-[0.2em] uppercase border-b border-white/20 pb-2 hover:border-gold hover:text-gold transition-all">View All Products</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12">
            {products.map((product) => (<ProductCard key={product.id} product={product} addToCart={addToCart} />))}
          </div>
        </div>
      </section>

      <section className="py-40 px-6 text-center bg-black border-y border-white/5">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-5xl font-serif font-bold mb-8">JOIN THE <span className="gold-text-gradient italic">CLUB</span></h2>
          <p className="text-white/40 mb-12 text-lg">Be the first to know about our limited edition drops and exclusive events.</p>
          <form className="flex flex-col md:flex-row gap-4" onSubmit={e => e.preventDefault()}>
            <input type="email" placeholder="YOUR EMAIL ADDRESS"
              className="flex-grow bg-transparent border-b border-white/20 py-4 px-2 outline-none focus:border-gold transition-colors text-sm tracking-[0.1em]" />
            <button className="btn-luxury whitespace-nowrap">Subscribe</button>
          </form>
        </div>
      </section>
    </div>
  );
}

function ShopPage({ products, addToCart }: { products: Product[], addToCart: (p: Product) => void }) {
  const [filter, setFilter] = useState('All');
  const categories = ['All', ...new Set(products.map(p => p.category))];
  const filteredProducts = filter === 'All' ? products : products.filter(p => p.category === filter);

  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12">
      <div className="mb-24">
        <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Collections</span>
        <h1 className="text-7xl font-serif font-bold tracking-tighter">THE <span className="gold-text-gradient">SOUL</span> STORE</h1>
      </div>
      <div className="flex flex-wrap gap-8 mb-20 border-b border-white/5 pb-8">
        {categories.map(cat => (
          <button key={cat} onClick={() => setFilter(cat)}
            className={`text-xs font-bold tracking-[0.2em] uppercase transition-all relative pb-2 ${filter === cat ? 'text-gold after:content-[""] after:absolute after:bottom-0 after:left-0 after:w-full after:h-[1px] after:bg-gold' : 'text-white/30 hover:text-white'}`}>
            {cat}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
        {filteredProducts.map((product) => (<ProductCard key={product.id} product={product} addToCart={addToCart} />))}
      </div>
    </div>
  );
}

function ProductCard({ product, addToCart }: { product: Product, addToCart: (p: Product) => void, key?: React.Key }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="group">
      <div className="relative aspect-[3/4] overflow-hidden bg-[#111] mb-6">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" referrerPolicy="no-referrer" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-500"></div>
        <button onClick={() => addToCart(product)}
          className="absolute bottom-0 left-0 w-full bg-gold text-black py-4 text-[10px] font-bold tracking-[0.3em] uppercase translate-y-full group-hover:translate-y-0 transition-transform duration-500">
          Quick Add
        </button>
        {product.featured ? (
          <div className="absolute top-6 left-6 text-[8px] font-bold tracking-[0.3em] uppercase bg-white text-black px-3 py-1">Featured</div>
        ) : null}
      </div>
      <div className="flex justify-between items-start gap-4">
        <div>
          <h4 className="text-lg font-serif font-bold mb-1 group-hover:text-gold transition-colors">{product.name}</h4>
          <p className="text-[10px] text-white/30 uppercase tracking-[0.2em]">{product.category}</p>
        </div>
        <div className="text-gold font-bold text-sm">RS. {product.price.toLocaleString()}</div>
      </div>
    </motion.div>
  );
}

function ContactPage() {
  return (
    <div className="max-w-[1600px] mx-auto py-32 px-6 md:px-12">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-32">
        <div>
          <span className="text-gold text-[10px] font-bold tracking-[0.5em] uppercase mb-4 block">Concierge</span>
          <h1 className="text-7xl font-serif font-bold tracking-tighter mb-12 leading-[0.9]">GET IN <br /><span className="gold-text-gradient italic">TOUCH.</span></h1>
          <p className="text-white/40 text-xl font-light mb-20 leading-relaxed max-w-md">
            Our luxury concierge team is dedicated to providing an unparalleled experience. Reach out for bespoke orders or sizing consultations.
          </p>
          <div className="space-y-12">
            {[
              { label: 'Email', value: 'concierge@bssole.com' },
              { label: 'Phone', value: '+92 300 1234567' },
              { label: 'Studio', value: 'Gulberg III, Lahore, Pakistan' },
            ].map(item => (
              <div key={item.label} className="flex items-start gap-8">
                <div className="w-[1px] h-12 bg-gold/30"></div>
                <div>
                  <div className="text-[10px] text-gold font-bold uppercase tracking-[0.3em] mb-2">{item.label}</div>
                  <div className="text-2xl font-serif">{item.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-[#050505] border border-white/5 p-12 md:p-20">
          <form className="space-y-12" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">First Name</label>
                <input type="text" className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm" placeholder="BILAL" />
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Last Name</label>
                <input type="text" className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm" placeholder="MARTH" />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Email Address</label>
              <input type="email" className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm" placeholder="HELLO@BSSOLE.COM" />
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Message</label>
              <textarea rows={4} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm resize-none" placeholder="HOW CAN WE ASSIST YOU?"></textarea>
            </div>
            <button className="btn-luxury w-full">Send Inquiry</button>
          </form>
        </div>
      </div>
    </div>
  );
}

function AdminPage({ products, refresh, onLogout }: { products: Product[], refresh: () => void, onLogout: () => void }) {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [formData, setFormData] = useState<Partial<Product>>({ name: '', description: '', price: 0, image: '', category: '', featured: 0 });

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleEdit = (product: Product) => { setEditingId(product.id); setFormData(product); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editingId === 0) {
        // New product
        const { error } = await supabase.from('products').insert([{
          name: formData.name, description: formData.description,
          price: formData.price, image: formData.image,
          category: formData.category, featured: formData.featured ? 1 : 0,
        }]);
        if (error) throw error;
        showToast('Product added successfully!');
      } else {
        // Update
        const { error } = await supabase.from('products').update({
          name: formData.name, description: formData.description,
          price: formData.price, image: formData.image,
          category: formData.category, featured: formData.featured ? 1 : 0,
        }).eq('id', editingId);
        if (error) throw error;
        showToast('Product updated!');
      }
      setEditingId(null);
      setFormData({ name: '', description: '', price: 0, image: '', category: '', featured: 0 });
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
            <button onClick={() => { setEditingId(0); setFormData({ name: '', description: '', price: 0, image: '', category: '', featured: 0 }); }}
              className="btn-luxury flex items-center gap-2">
              <Plus size={16} /> Add Product
            </button>
          )}
          <button onClick={onLogout} className="flex items-center gap-2 px-6 py-3 border border-white/10 text-white/30 hover:border-red-500 hover:text-red-400 transition-all text-xs font-bold uppercase tracking-[0.2em]">
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Stats Bar */}
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
              { label: 'Image URL', key: 'image', placeholder: 'HTTPS://...', type: 'text' },
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
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Description</label>
              <textarea className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm resize-none"
                placeholder="PRODUCT DETAILS..." rows={3}
                value={formData.description || ''}
                onChange={e => setFormData({ ...formData, description: e.target.value })} />
            </div>
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

