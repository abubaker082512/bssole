import React, { useState, useEffect } from 'react';
import { Package, Grid, Tags, ShoppingCart, Users, Settings, LogOut, LayoutDashboard, Sun, Moon } from 'lucide-react';
import ProductList from './products/ProductList';
import ProductForm from './products/ProductForm';
import CategoryManager from './categories/CategoryManager';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'products', label: 'Products', icon: <Package size={18} /> },
        { id: 'categories', label: 'Categories', icon: <Grid size={18} /> },
        { id: 'attributes', label: 'Attributes', icon: <Tags size={18} /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
        { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    const renderContent = () => {
        if (currentView === 'products') {
            if (editingProductId !== null) {
                return <ProductForm productId={editingProductId === 0 ? undefined : editingProductId} onBack={() => setEditingProductId(null)} />
            }
            return <ProductList onEdit={(id) => setEditingProductId(id)} onAdd={() => setEditingProductId(0)} />
        }
        if (currentView === 'categories') {
            return <CategoryManager />
        }
        return (
            <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-serif font-bold text-gold">System Overview</h2>
                    <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:text-gold dark:hover:text-gold transition-colors">
                        {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {['Total Sales', 'Active Orders', 'Products', 'Customers'].map((stat, i) => (
                        <div key={i} className="bg-gray-50 dark:bg-[#050505] border border-black/5 dark:border-white/5 p-8 text-center hover:border-gold/30 dark:hover:border-gold/30 transition-colors">
                            <span className="text-black/40 dark:text-white/30 text-[10px] uppercase tracking-widest font-bold mb-4 block">{stat}</span>
                            <span className="text-5xl font-serif font-bold gold-text-gradient">--</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`min-h-screen ${isDarkMode ? 'dark' : ''}`}>
        <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white flex selection:bg-gold selection:text-black transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-64 bg-gray-50 dark:bg-[#050505] border-r border-black/5 dark:border-white/5 flex flex-col hidden md:flex transition-colors duration-300">
                <div className="p-8 border-b border-black/5 dark:border-white/5 flex justify-between items-center">
                    <div>
                        <div className="text-xl font-serif font-black tracking-tighter gold-text-gradient">BSSOLE</div>
                        <div className="text-[10px] text-gray-500 dark:text-white/30 font-bold tracking-widest uppercase mt-1">Commerce Engine</div>
                    </div>
                </div>
                <nav className="flex-grow py-6">
                    <ul className="space-y-2">
                        {sidebarItems.map(item => (
                            <li key={item.id}>
                                <button 
                                    onClick={() => { setCurrentView(item.id); setEditingProductId(null); }}
                                    className={`w-full flex items-center gap-4 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === item.id ? 'text-gold border-r-2 border-gold bg-black/5 dark:bg-white/5' : 'text-gray-500 dark:text-white/40 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-8 border-t border-black/5 dark:border-white/5">
                    <button onClick={onLogout} className="flex items-center gap-3 text-gray-500 dark:text-white/30 hover:text-red-500 dark:hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest">
                        <LogOut size={16} /> Logout Engine
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow h-screen overflow-y-auto bg-white dark:bg-black transition-colors duration-300">
                {renderContent()}
            </main>
        </div>
        </div>
    );
}
