import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Search, Eye, Filter, X, Package, MapPin, Phone, Mail, RefreshCw, Truck } from 'lucide-react';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
};

type Order = {
    id: string;
    created_at: string;
    status: string;
    total: number;
    total_amount: number;
    customers?: { first_name: string; last_name: string; email: string };
    address?: any;
    order_items?: OrderItem[];
};

type OrderDetail = {
    id: string;
    created_at: string;
    status: string;
    total_amount: number;
    customer_name: string;
    customer_email: string;
    customer_phone: string;
    shipping_address: string;
    items: OrderItem[];
    tracking_number?: string;
    tracking_url?: string;
};

const STATUS_OPTIONS = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const statusStyle = (status: string) => {
    switch (status) {
        case 'delivered': return 'border-green-500 text-green-500 bg-green-500/10';
        case 'shipped': return 'border-blue-400 text-blue-400 bg-blue-400/10';
        case 'processing': return 'border-yellow-400 text-yellow-400 bg-yellow-400/10';
        case 'cancelled': return 'border-red-500 text-red-500 bg-red-500/10';
        default: return 'border-gold text-gold bg-gold/10';
    }
};

export default function OrderList() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [trackingNumber, setTrackingNumber] = useState('');
    const [trackingUrl, setTrackingUrl] = useState('');

    useEffect(() => { loadOrders(); }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/orders');
            setOrders(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const loadOrderDetail = async (orderId: string) => {
        try {
            const data = await apiClient.get(`/orders/${orderId}`);
            setSelectedOrder(data);
            setTrackingNumber((data as any).tracking_number || '');
            setTrackingUrl((data as any).tracking_url || '');
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string, trackingNumber?: string, trackingUrl?: string) => {
        try {
            await apiClient.put(`/orders/${orderId}/status`, { 
                status: newStatus,
                tracking_number: trackingNumber || undefined,
                tracking_url: trackingUrl || undefined
            });
            loadOrders();
            if (selectedOrder) loadOrderDetail(orderId);
        } catch (e) {
            console.error(e);
        }
    };

    const filteredOrders = orders.filter(o => {
        const name = `${o.customers?.first_name || ''} ${o.customers?.last_name || ''}`.toLowerCase();
        const matchSearch = !search || name.includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
        const matchStatus = statusFilter === 'all' || o.status === statusFilter;
        return matchSearch && matchStatus;
    });

    const getCustomerName = (o: Order) =>
        `${o.customers?.first_name || ''} ${o.customers?.last_name || ''}`.trim() || o.address?.name || 'Guest';

    const getOrderSummary = (o: Order) => {
        const items = (o as any).order_items;
        if (!items || items.length === 0) return <span className="text-white/30 text-xs">—</span>;
        return (
            <div className="space-y-0.5">
                {items.slice(0, 2).map((it: any, i: number) => (
                    <div key={i} className="text-xs text-white/60">
                        <span className="font-bold text-white">{it.products?.name || it.product_name || 'Product'}</span>
                        <span className="text-white/40"> × {it.quantity}</span>
                    </div>
                ))}
                {items.length > 2 && <div className="text-[10px] text-gold">+{items.length - 2} more</div>}
            </div>
        );
    };

    return (
        <div className="p-6 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-serif font-bold text-gold">Orders</h2>
                <button onClick={loadOrders} className="flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-widest border border-white/10 text-white/50 hover:border-gold hover:text-gold transition-all rounded">
                    <RefreshCw size={14} /> Refresh
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-3 mb-6">
                <div className="relative flex-grow min-w-[200px]">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
                    <input
                        type="text"
                        placeholder="Search by name or order ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full bg-[#111] border border-white/10 pl-11 pr-4 py-3 outline-none focus:border-gold transition-colors text-white text-sm rounded"
                    />
                </div>
                <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-[#111] border border-white/10 px-4 py-3 outline-none focus:border-gold text-white text-sm rounded"
                >
                    <option value="all">All Statuses</option>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="text-white/30 text-sm py-12 text-center">Loading orders...</div>
            ) : (
                <div className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#111] text-white/40 uppercase tracking-widest text-xs border-b border-white/5">
                            <tr>
                                <th className="p-4 font-normal">Order ID</th>
                                <th className="p-4 font-normal">Customer</th>
                                <th className="p-4 font-normal">Products</th>
                                <th className="p-4 font-normal">Date</th>
                                <th className="p-4 font-normal">Status</th>
                                <th className="p-4 font-normal text-right">Total</th>
                                <th className="p-4 font-normal text-right">Details</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                            {filteredOrders.length === 0 && (
                                <tr><td colSpan={7} className="p-8 text-center text-white/30">No orders found.</td></tr>
                            )}
                            {filteredOrders.map(o => (
                                <tr key={o.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-white/40 text-xs">#{o.id.substring(0, 8)}</td>
                                    <td className="p-4 font-bold text-white">{getCustomerName(o)}</td>
                                    <td className="p-4">{getOrderSummary(o)}</td>
                                    <td className="p-4 text-white/40 text-xs">{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-[10px] font-bold uppercase tracking-widest border rounded ${statusStyle(o.status)}`}>
                                            {o.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold text-gold">
                                        RS. {(o.total || o.total_amount || 0).toLocaleString()}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => loadOrderDetail(o.id)}
                                            className="text-white/30 hover:text-gold transition-colors p-2"
                                        >
                                            <Eye size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Summary Footer */}
                    <div className="p-4 border-t border-white/5 flex justify-between text-xs text-white/30">
                        <span>{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
                        <span>Total Revenue: <span className="text-gold font-bold">RS. {filteredOrders.reduce((s, o) => s + (o.total || o.total_amount || 0), 0).toLocaleString()}</span></span>
                    </div>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 md:p-8">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <div>
                                <h3 className="text-2xl font-serif font-bold text-gold">Order #{selectedOrder.id.substring(0, 8)}</h3>
                                <p className="text-white/30 text-xs mt-1">{new Date(selectedOrder.created_at).toLocaleString()}</p>
                            </div>
                            <button onClick={() => { setSelectedOrder(null); setTrackingNumber(''); setTrackingUrl(''); }} className="text-white/30 hover:text-white p-2"><X size={24} /></button>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* Status Changer with Tracking */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
                                    <div>
                                        <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</span>
                                        <div className={`text-sm font-bold mt-1 capitalize ${statusStyle(selectedOrder.status).split(' ')[0]}`}>{selectedOrder.status}</div>
                                    </div>
                                    <select
                                        value={selectedOrder.status}
                                        onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value, trackingNumber, trackingUrl)}
                                        className="bg-[#111] border border-white/10 px-4 py-2 outline-none focus:border-gold text-white text-sm rounded"
                                    >
                                        {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                                    </select>
                                </div>
                                
                                {/* Tracking Info */}
                                <div className="bg-white/5 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-3"><Truck size={12} /> Tracking Info (optional)</span>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            placeholder="Tracking Number"
                                            value={trackingNumber}
                                            onChange={(e) => setTrackingNumber(e.target.value)}
                                            className="bg-[#111] border border-white/10 px-4 py-2 outline-none focus:border-gold text-white text-sm rounded"
                                        />
                                        <input
                                            type="text"
                                            placeholder="Tracking URL"
                                            value={trackingUrl}
                                            onChange={(e) => setTrackingUrl(e.target.value)}
                                            className="bg-[#111] border border-white/10 px-4 py-2 outline-none focus:border-gold text-white text-sm rounded"
                                        />
                                    </div>
                                    {(selectedOrder as any).tracking_number && (
                                        <div className="mt-3 pt-3 border-t border-white/10">
                                            <span className="text-[10px] text-white/30">Current: </span>
                                            <span className="text-gold text-xs">{(selectedOrder as any).tracking_number}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white/5 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-2"><Phone size={12} /> Phone</span>
                                    <div className="text-white">{selectedOrder.customer_phone || 'N/A'}</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-4">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-2"><Mail size={12} /> Email</span>
                                    <div className="text-white">{selectedOrder.customer_email || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="bg-white/5 rounded-xl p-4">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-2"><MapPin size={12} /> Shipping Address</span>
                                <div className="text-white">{selectedOrder.shipping_address || 'N/A'}</div>
                            </div>

                            {/* Items */}
                            <div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2 mb-3"><Package size={12} /> Order Items</span>
                                <div className="space-y-2">
                                    {selectedOrder.items?.length > 0 ? selectedOrder.items.map((item, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded-xl">
                                            <div>
                                                <div className="text-white font-bold">{item.product_name}</div>
                                                <div className="text-white/40 text-sm mt-0.5">Quantity: <span className="text-gold font-bold">{item.quantity}</span></div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-gold font-bold">RS. {(item.price * item.quantity).toLocaleString()}</div>
                                                <div className="text-white/30 text-xs">RS. {item.price.toLocaleString()} each</div>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-white/30 text-sm">No items found.</div>
                                    )}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
                                <span className="text-white/60 font-bold">Total Amount</span>
                                <span className="text-2xl font-serif font-bold text-gold">RS. {(selectedOrder.total_amount || 0).toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
