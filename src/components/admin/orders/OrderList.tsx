import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Search, Eye, Filter, X, Package, MapPin, Phone, Mail } from 'lucide-react';

type OrderItem = {
    id: number;
    product_name: string;
    quantity: number;
    price: number;
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
};

export default function OrderList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        try {
            const data = await apiClient.get('/orders');
            setOrders(data);
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
        } catch (e) {
            console.error(e);
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        try {
            await apiClient.put(`/orders/${orderId}/status`, { status: newStatus });
            loadOrders();
            if (selectedOrder) loadOrderDetail(orderId);
        } catch (e) {
            console.error(e);
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-serif font-bold text-gold mb-8">Orders</h2>
            
            <div className="flex gap-4 mb-8">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/30" size={18} />
                    <input type="text" placeholder="Search orders..." className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 pl-12 pr-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm" />
                </div>
                <button className="px-6 py-3 border border-black/10 dark:border-white/10 hover:border-gold dark:hover:border-gold text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white transition-all flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {loading ? <p className="text-gray-500 dark:text-white/30">Loading...</p> : (
                <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-[#111] text-gray-500 dark:text-white/50 uppercase tracking-widest text-xs">
                            <tr>
                                <th className="p-4 font-normal">Order ID</th>
                                <th className="p-4 font-normal">Customer</th>
                                <th className="p-4 font-normal">Date</th>
                                <th className="p-4 font-normal">Status</th>
                                <th className="p-4 font-normal text-right">Total</th>
                                <th className="p-4 font-normal text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-gray-700 dark:text-white/80">
                            {orders.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-gray-500 dark:text-white/30">No orders found.</td></tr>}
                            {orders.map(o => (
                                <tr key={o.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-mono text-gray-500 dark:text-white/50">#{o.id.substring(0,8)}</td>
                                    <td className="p-4 font-bold text-black dark:text-white">{o.customers?.first_name || 'Guest'} {o.customers?.last_name || ''}</td>
                                    <td className="p-4 text-gray-500 dark:text-white/50">{new Date(o.created_at).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest border ${o.status === 'delivered' ? 'border-green-500 text-green-500' : 'border-gold text-gold'}`}>{o.status}</span>
                                    </td>
                                    <td className="p-4 text-right font-mono font-bold">RS. {o.total_amount}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => loadOrderDetail(o.id)} className="text-gray-400 dark:text-white/30 hover:text-gold dark:hover:text-gold transition-colors"><Eye size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-8">
                    <div className="bg-white dark:bg-[#050505] border border-white/10 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center">
                            <h3 className="text-2xl font-serif font-bold text-gold">Order #{selectedOrder.id.substring(0,8)}</h3>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                        </div>
                        
                        <div className="p-8 space-y-6">
                            {/* Status */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Status</span>
                                    <div className="text-lg font-bold text-white mt-1">{selectedOrder.status}</div>
                                </div>
                                <select 
                                    value={selectedOrder.status} 
                                    onChange={(e) => handleStatusChange(selectedOrder.id, e.target.value)}
                                    className="bg-gray-100 dark:bg-[#111] border border-white/10 px-4 py-2 outline-none focus:border-gold text-white text-sm"
                                >
                                    <option value="pending">Pending</option>
                                    <option value="processing">Processing</option>
                                    <option value="shipped">Shipped</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2"><Phone size={12} /> Phone</span>
                                    <div className="text-white mt-1">{selectedOrder.customer_phone || 'N/A'}</div>
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2"><Mail size={12} /> Email</span>
                                    <div className="text-white mt-1">{selectedOrder.customer_email || 'N/A'}</div>
                                </div>
                            </div>

                            {/* Address */}
                            <div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2"><MapPin size={12} /> Shipping Address</span>
                                <div className="text-white mt-1">{selectedOrder.shipping_address || 'N/A'}</div>
                            </div>

                            {/* Items */}
                            <div>
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest flex items-center gap-2"><Package size={12} /> Order Items</span>
                                <div className="mt-3 space-y-3">
                                    {selectedOrder.items?.map((item: any, i: number) => (
                                        <div key={i} className="flex justify-between items-center bg-white/5 p-4 rounded">
                                            <div>
                                                <div className="text-white font-bold">{item.product_name}</div>
                                                <div className="text-white/40 text-sm">Qty: {item.quantity}</div>
                                            </div>
                                            <div className="text-gold font-bold">RS. {item.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Total */}
                            <div className="border-t border-white/10 pt-6 flex justify-between items-center">
                                <span className="text-white/60">Total Amount</span>
                                <span className="text-2xl font-serif font-bold text-gold">RS. {selectedOrder.total_amount}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
