import React, { useState } from 'react';
import { Package, Grid, Tags, ShoppingCart, Users, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import ProductList from './products/ProductList';
import ProductForm from './products/ProductForm';
import CategoryManager from './categories/CategoryManager';

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [editingProductId, setEditingProductId] = useState<number | null>(null);

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
                <h2 className="text-3xl font-serif font-bold text-gold mb-8">System Overview</h2>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {['Total Sales', 'Active Orders', 'Products', 'Customers'].map((stat, i) => (
                        <div key={i} className="bg-[#050505] border border-white/5 p-8 text-center hover:border-gold/30 transition-colors">
                            <span className="text-white/30 text-[10px] uppercase tracking-widest font-bold mb-4 block">{stat}</span>
                            <span className="text-5xl font-serif font-bold gold-text-gradient">--</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex selection:bg-gold selection:text-black">
            {/* Sidebar */}
            <aside className="w-64 bg-[#050505] border-r border-white/5 flex flex-col hidden md:flex">
                <div className="p-8 border-b border-white/5">
                    <div className="text-xl font-serif font-black tracking-tighter gold-text-gradient">BSSOLE ADMIN</div>
                    <div className="text-[10px] text-white/30 font-bold tracking-widest uppercase mt-1">Commerce Engine</div>
                </div>
                <nav className="flex-grow py-6">
                    <ul className="space-y-2">
                        {sidebarItems.map(item => (
                            <li key={item.id}>
                                <button 
                                    onClick={() => { setCurrentView(item.id); setEditingProductId(null); }}
                                    className={`w-full flex items-center gap-4 px-8 py-3 text-sm font-bold uppercase tracking-widest transition-all ${currentView === item.id ? 'text-gold border-r-2 border-gold bg-white/5' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                >
                                    {item.icon} {item.label}
                                </button>
                            </li>
                        ))}
                    </ul>
                </nav>
                <div className="p-8 border-t border-white/5">
                    <button onClick={onLogout} className="flex items-center gap-3 text-white/30 hover:text-red-500 transition-colors text-xs font-bold uppercase tracking-widest">
                        <LogOut size={16} /> Logout Engine
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-grow h-screen overflow-y-auto bg-black">
                {renderContent()}
            </main>
        </div>
    );
}
