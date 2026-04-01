import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Search, Eye, Filter } from 'lucide-react';

export default function OrderList() {
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                                        <button className="text-gray-400 dark:text-white/30 hover:text-gold dark:hover:text-gold transition-colors"><Eye size={16} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
