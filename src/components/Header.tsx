import React from 'react';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';

type Props = {
  onMenu?: () => void;
  onSearch?: () => void;
  onLogin?: () => void;
  onCart?: () => void;
  cartCount?: number;
  setPage?: (page: string) => void;
  currentPage?: string;
  marqueeText?: string;
  categories?: any[];
};

export default function Header({ onMenu, onSearch, onLogin, onCart, cartCount = 0, setPage, currentPage = '', marqueeText, categories = [] }: Props) {
  const displayText = marqueeText || 'Get 10% Extra Discount on Every RS. 10,000 Purchase | Get 5% Extra Discount on Advance Payment';
  
  // Default links
  const defaultLinks = [
    { label: 'Men', page: 'men-shoes' },
    { label: 'Women', page: 'women-shoes' }
  ];

  // If categories are provided, use top-level ones
  const topLevelCategories = categories.filter(c => !c.parent_id);
  const categoryLinks = topLevelCategories.length > 0 
    ? topLevelCategories.slice(0, 3).map(c => ({ label: c.name, page: `collection/${c.slug}` }))
    : defaultLinks;

  const links = [
    { label: 'Home', page: 'home2' },
    ...categoryLinks,
    { label: 'Shop', page: 'shop' },
    { label: 'Contact', page: 'contact' },
  ];

  return (
    <header className="sticky top-0 z-50">
      {/* Top marquee bar */}
      <div className="w-full bg-black text-white text-xs overflow-hidden" style={{ height: 36 }}>
        <div
          className="flex items-center h-full"
          style={{ whiteSpace: 'nowrap', display: 'inline-block', paddingLeft: '100%', animation: 'marquee 20s linear infinite' }}
        >
          <span className="mx-8">{displayText}</span>
        </div>
      </div>

      {/* Main dark header */}
      <div className="bg-black border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Menu + Nav */}
          <div className="flex items-center gap-4">
            <button onClick={onMenu} aria-label="Open menu" className="p-2 rounded hover:bg-white/5 lg:hidden">
              <Menu size={20} className="text-white/70" />
            </button>
            <nav className="hidden lg:flex items-center gap-8">
              {links.map((link) => (
                <button
                  key={link.page}
                  onClick={() => setPage?.(link.page)}
                  className={`text-sm font-medium transition-colors tracking-wide ${
                    currentPage === link.page ? 'text-gold' : 'text-white/50 hover:text-gold'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <button onClick={() => setPage?.('home2')} className="flex items-center">
            <span className="text-white text-2xl font-serif font-bold tracking-wider">BS Sole</span>
          </button>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
            <button onClick={onSearch} aria-label="Search" className="p-2 rounded hover:bg-white/5">
              <Search size={20} className="text-white/70" />
            </button>
            <button onClick={onCart} aria-label="Cart" className="relative p-2 rounded hover:bg-white/5">
              <ShoppingBag size={20} className="text-white/70" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] w-4 h-4 rounded-full bg-gold text-black flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
            <button onClick={onLogin} aria-label="Login" className="p-2 rounded hover:bg-white/5">
              <User size={20} className="text-white/70" />
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }
      `}</style>
    </header>
  );
}
