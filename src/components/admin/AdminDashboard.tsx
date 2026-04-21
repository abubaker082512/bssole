import React, { useState, useEffect } from 'react';
import { Package, Grid, Tags, ShoppingCart, Users, Settings, LogOut, LayoutDashboard, Sun, Moon, Image, FileText, TrendingUp, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import ProductList from './products/ProductList';
import ProductForm from './products/ProductForm';
import CategoryManager from './categories/CategoryManager';
import AttributeManager from './attributes/AttributeManager';
import OrderList from './orders/OrderList';
import CustomerList from './customers/CustomerList';
import SettingsManager from './settings/SettingsManager';
import HeroSlideManager from './hero/HeroSlideManager';
import SiteContentManager from './content/SiteContentManager';
import { apiClient } from '../../lib/apiClient';

type DashboardStats = {
    totalSales: number;
    totalOrders: number;
    totalProducts: number;
    totalCustomers: number;
    recentOrders: any[];
    lowStockProducts: any[];
    pendingOrders: number;
    deliveredOrders: number;
};

export default function AdminDashboard({ onLogout }: { onLogout: () => void }) {
    const [currentView, setCurrentView] = useState('dashboard');
    const [editingProductId, setEditingProductId] = useState<number | null>(null);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({
        totalSales: 0, totalOrders: 0, totalProducts: 0, totalCustomers: 0,
        recentOrders: [], lowStockProducts: [], pendingOrders: 0, deliveredOrders: 0
    });
    const [statsLoading, setStatsLoading] = useState(true);

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);

    useEffect(() => {
        if (currentView === 'dashboard') loadStats();
    }, [currentView]);

    const loadStats = async () => {
        setStatsLoading(true);
        try {
            const [orders, products, customers] = await Promise.all([
                apiClient.get('/orders'),
                apiClient.get('/products'),
                apiClient.get('/customers'),
            ]);

            const orderArr = Array.isArray(orders) ? orders : [];
            const productArr = Array.isArray(products) ? products : [];
            const customerArr = Array.isArray(customers) ? customers : [];

            const totalSales = orderArr.reduce((sum: number, o: any) => sum + (o.total || o.total_amount || 0), 0);
            const pendingOrders = orderArr.filter((o: any) => o.status === 'pending').length;
            const deliveredOrders = orderArr.filter((o: any) => o.status === 'delivered').length;
            const recentOrders = orderArr.slice(0, 5);
            const lowStockProducts = productArr.filter((p: any) => (p.stock_quantity ?? 0) <= 5 && (p.stock_quantity ?? 0) >= 0);

            setStats({
                totalSales,
                totalOrders: orderArr.length,
                totalProducts: productArr.length,
                totalCustomers: customerArr.length,
                recentOrders,
                lowStockProducts,
                pendingOrders,
                deliveredOrders,
            });
        } catch (e) {
            console.error('Failed to load dashboard stats', e);
        } finally {
            setStatsLoading(false);
        }
    };

    const sidebarItems = [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { id: 'products', label: 'Products', icon: <Package size={18} /> },
        { id: 'categories', label: 'Categories', icon: <Grid size={18} /> },
        { id: 'attributes', label: 'Attributes', icon: <Tags size={18} /> },
        { id: 'orders', label: 'Orders', icon: <ShoppingCart size={18} /> },
        { id: 'customers', label: 'Customers', icon: <Users size={18} /> },
        { id: 'hero-slides', label: 'Hero Slides', icon: <Image size={18} /> },
        { id: 'site-content', label: 'Site Content', icon: <FileText size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
    ];

    const statusColor = (status: string) => {
        switch (status) {
            case 'delivered': return 'text-green-500 border-green-500';
            case 'shipped': return 'text-blue-400 border-blue-400';
            case 'processing': return 'text-yellow-400 border-yellow-400';
            case 'cancelled': return 'text-red-500 border-red-500';
            default: return 'text-gold border-gold';
        }
    };

    const renderContent = () => {
        if (currentView === 'products') {
            if (editingProductId !== null) {
                return <ProductForm productId={editingProductId === 0 ? undefined : editingProductId} onBack={() => setEditingProductId(null)} />;
            }
            return <ProductList onEdit={(id) => setEditingProductId(id)} onAdd={() => setEditingProductId(0)} />;
        }
        if (currentView === 'categories') return <CategoryManager />;
        if (currentView === 'attributes') return <AttributeManager />;
        if (currentView === 'orders') return <OrderList />;
        if (currentView === 'customers') return <CustomerList />;
        if (currentView === 'hero-slides') return <HeroSlideManager />;
        if (currentView === 'site-content') return <SiteContentManager />;
        if (currentView === 'settings') return <SettingsManager />;

        // ── Dashboard ──
        return (
            <div className="p-6 md:p-8 space-y-8">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-serif font-bold text-gold">Dashboard</h2>
                        <p className="text-white/40 text-sm mt-1">Live store overview</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={loadStats} className="px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 text-white/50 hover:border-gold hover:text-gold transition-all rounded">
                            ↻ Refresh
                        </button>
                        <button onClick={() => setIsDarkMode(!isDarkMode)} className="p-3 rounded-full bg-black/5 dark:bg-white/5 text-black dark:text-white hover:text-gold transition-colors">
                            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Revenue', value: statsLoading ? '...' : `RS. ${stats.totalSales.toLocaleString()}`, icon: <TrendingUp size={20} />, color: 'text-gold' },
                        { label: 'Total Orders', value: statsLoading ? '...' : stats.totalOrders, icon: <ShoppingCart size={20} />, color: 'text-blue-400' },
                        { label: 'Products', value: statsLoading ? '...' : stats.totalProducts, icon: <Package size={20} />, color: 'text-purple-400' },
                        { label: 'Customers', value: statsLoading ? '...' : stats.totalCustomers, icon: <Users size={20} />, color: 'text-green-400' },
                    ].map((kpi) => (
                        <div key={kpi.label} className="bg-[#050505] border border-white/5 rounded-xl p-6 hover:border-gold/30 transition-all">
                            <div className={`${kpi.color} mb-3`}>{kpi.icon}</div>
                            <div className="text-3xl font-serif font-bold text-white mb-1">{kpi.value}</div>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{kpi.label}</div>
                        </div>
                    ))}
                </div>

                {/* Order Status Strip */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Pending', value: stats.pendingOrders, icon: <Clock size={16} />, color: 'text-gold border-gold/20' },
                        { label: 'Delivered', value: stats.deliveredOrders, icon: <CheckCircle size={16} />, color: 'text-green-500 border-green-500/20' },
                        { label: 'Low Stock Items', value: stats.lowStockProducts.length, icon: <AlertTriangle size={16} />, color: 'text-red-400 border-red-400/20' },
                        { label: 'Active Products', value: stats.totalProducts, icon: <Package size={16} />, color: 'text-blue-400 border-blue-400/20' },
                    ].map((s) => (
                        <div key={s.label} className={`bg-[#050505] border rounded-xl p-4 flex items-center gap-3 ${s.color}`}>
                            {s.icon}
                            <div>
                                <div className="text-xl font-bold">{statsLoading ? '--' : s.value}</div>
                                <div className="text-[10px] text-white/30 uppercase tracking-widest">{s.label}</div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Orders */}
                    <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Recent Orders</h3>
                            <button onClick={() => setCurrentView('orders')} className="text-xs text-gold hover:underline">View All</button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {statsLoading ? (
                                <div className="p-6 text-white/30 text-sm">Loading...</div>
                            ) : stats.recentOrders.length === 0 ? (
                                <div className="p-6 text-white/30 text-sm">No orders yet.</div>
                            ) : stats.recentOrders.map((o: any) => (
                                <div key={o.id} className="p-4 flex justify-between items-center hover:bg-white/5">
                                    <div>
                                        <div className="text-white text-sm font-bold">
                                            {o.customers?.first_name || o.address?.name || 'Guest'} {o.customers?.last_name || ''}
                                        </div>
                                        <div className="text-white/30 text-xs font-mono mt-0.5">#{o.id?.toString().substring(0, 8)}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-gold font-bold text-sm">RS. {(o.total || o.total_amount || 0).toLocaleString()}</div>
                                        <span className={`text-[10px] font-bold uppercase border px-2 py-0.5 rounded mt-1 inline-block ${statusColor(o.status)}`}>{o.status}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Low Stock Alerts */}
                    <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-white/60">Low Stock Alerts</h3>
                            <button onClick={() => setCurrentView('products')} className="text-xs text-gold hover:underline">Manage</button>
                        </div>
                        <div className="divide-y divide-white/5">
                            {statsLoading ? (
                                <div className="p-6 text-white/30 text-sm">Loading...</div>
                            ) : stats.lowStockProducts.length === 0 ? (
                                <div className="p-6 text-green-500 text-sm flex items-center gap-2">
                                    <CheckCircle size={16} /> All products are well stocked!
                                </div>
                            ) : stats.lowStockProducts.map((p: any) => (
                                <div key={p.id} className="p-4 flex justify-between items-center hover:bg-white/5">
                                    <div className="text-white text-sm font-bold">{p.name}</div>
                                    <div className={`text-sm font-bold px-3 py-1 rounded border ${p.stock_quantity === 0 ? 'text-red-500 border-red-500/30 bg-red-500/10' : 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10'}`}>
                                        {p.stock_quantity === 0 ? 'OUT OF STOCK' : `${p.stock_quantity} left`}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                            <LogOut size={16} /> Logout
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
