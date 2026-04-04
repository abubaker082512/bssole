import React from 'react';
import { Menu, Search, User, ShoppingBag } from 'lucide-react';
import logo from '../assets/logo.png';

type Props = {
  onMenu?: () => void;
  onSearch?: () => void;
  onLogin?: () => void;
  onCart?: () => void;
  cartCount?: number;
  setPage?: (page: string) => void;
  currentPage?: string;
};

export default function Header({ onMenu, onSearch, onLogin, onCart, cartCount = 0, setPage, currentPage = '' }: Props) {
  return (
    <header className="sticky top-0 z-50">
      {/* Top marquee bar */}
      <div className="w-full bg-[#1a2744] text-white text-xs overflow-hidden" style={{ height: 36 }}>
        <div
          className="flex items-center h-full"
          style={{ whiteSpace: 'nowrap', display: 'inline-block', paddingLeft: '100%', animation: 'marquee 20s linear infinite' }}
        >
          <span className="mx-8">🚚 FREE SHIPPING ON ORDERS ABOVE RS. 10,000</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔄 7-DAY EASY RETURNS</span>
          <span className="mx-8">•</span>
          <span className="mx-8">💳 CASH ON DELIVERY AVAILABLE</span>
          <span className="mx-8">•</span>
          <span className="mx-8">📞 WhatsApp: 0325 528 1122</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🚚 FREE SHIPPING ON ORDERS ABOVE RS. 10,000</span>
          <span className="mx-8">•</span>
          <span className="mx-8">🔄 7-DAY EASY RETURNS</span>
        </div>
      </div>

      {/* Main dark header */}
      <div className="bg-[#1a2744] border-b border-[#243352]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 h-16 flex items-center justify-between">
          {/* Left: Menu + Nav */}
          <div className="flex items-center gap-4">
            <button onClick={onMenu} aria-label="Open menu" className="p-2 rounded hover:bg-[#243352] lg:hidden">
              <Menu size={20} className="text-gray-300" />
            </button>
            <nav className="hidden lg:flex items-center gap-8">
              {[
                { label: 'Home', page: 'home' },
                { label: 'New', page: 'home2' },
                { label: 'Shop', page: 'shop' },
                { label: 'Contact', page: 'contact' },
              ].map((link) => (
                <button
                  key={link.page}
                  onClick={() => setPage?.(link.page)}
                  className={`text-sm font-medium transition-colors tracking-wide ${
                    currentPage === link.page ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {link.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Center: Logo */}
          <button onClick={() => setPage?.('home')} className="flex items-center">
            <img src={logo} alt="BSSOLE" className="h-10 w-auto object-contain" />
          </button>

          {/* Right: Icons */}
          <div className="flex items-center gap-2">
            <button onClick={onSearch} aria-label="Search" className="p-2 rounded hover:bg-[#243352]">
              <Search size={20} className="text-gray-300" />
            </button>
            <button onClick={onCart} aria-label="Cart" className="relative p-2 rounded hover:bg-[#243352]">
              <ShoppingBag size={20} className="text-gray-300" />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 text-[10px] w-4 h-4 rounded-full bg-white text-[#1a2744] flex items-center justify-center font-bold">{cartCount}</span>
              )}
            </button>
            <button onClick={onLogin} aria-label="Login" className="p-2 rounded hover:bg-[#243352]">
              <User size={20} className="text-gray-300" />
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
