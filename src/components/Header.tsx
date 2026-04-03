import React from 'react';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';

type Props = {
  onMenu?: () => void;
  onSearch?: () => void;
  onLogin?: () => void;
  cartCount?: number;
};

export default function Header({ onMenu, onSearch, onLogin, cartCount = 0 }: Props) {
  return (
    <header>
      {/* Top bar (marquee / fixed text) */}
      <div className="w-full bg-black text-white text-sm overflow-hidden" style={{ height: 28 }}>
        <div className="marquee" aria-label="promo" style={{ whiteSpace: 'nowrap', display: 'inline-block', paddingLeft: '100%', animation: 'marquee 15s linear infinite' }}>
          ENJOY FREE SHIPPING NATIONWIDE PK &nbsp;&nbsp; • &nbsp;&nbsp; FREE RETURNS WITHIN 30 DAYS
        </div>
      </div>

      {/* Main header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={onMenu} aria-label="Open menu" className="p-2 rounded hover:bg-gray-100">
              <Menu size={20} />
            </button>
            <nav className="hidden md:flex items-center gap-6 text-gray-700 text-sm">
              {['Home', 'Shop', 'About', 'Contact'].map((l) => (
                <a key={l} href="#" className="hover:underline">{l}</a>
              ))}
            </nav>
          </div>
          <div className="flex items-center justify-center flex-1">
            <img src="/assets/logo.png" alt="BSSOLE" style={{ height: 40 }} />
          </div>
          <div className="flex items-center gap-4">
            <button onClick={onSearch} aria-label="Search" className="p-2 rounded border border-gray-200 hover:bg-gray-50">
              <Search size={18} />
            </button>
            <button aria-label="Cart" className="relative p-2 rounded border border-gray-200 hover:bg-gray-50">
              <ShoppingBag size={18} />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 text-xs w-5 h-5 rounded-full bg-gold text-black flex items-center justify-center">{cartCount}</span>
              )}
            </button>
            <button onClick={onLogin} aria-label="Login" className="p-2 rounded border border-gray-200 hover:bg-gray-50">
              <User size={18} />
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
