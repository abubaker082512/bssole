import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';

export default function CustomerList() {
    const [customers, setCustomers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/customers').then(data => {
            setCustomers(data);
            setLoading(false);
        }).catch(e => console.error(e));
    }, []);

    return (
        <div className="p-8">
            <h2 className="text-3xl font-serif font-bold text-gold mb-8">Customers</h2>
            {loading ? <p className="text-gray-500 dark:text-white/30">Loading...</p> : (
                <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-[#111] text-gray-500 dark:text-white/50 uppercase tracking-widest text-xs">
                            <tr>
                                <th className="p-4 font-normal">Name</th>
                                <th className="p-4 font-normal">Email</th>
                                <th className="p-4 font-normal text-right">Total Spent</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 text-gray-700 dark:text-white/80">
                            {customers.length === 0 && <tr><td colSpan={3} className="p-6 text-center text-gray-500 dark:text-white/30">No customers found.</td></tr>}
                            {customers.map(c => (
                                <tr key={c.id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                                    <td className="p-4 font-bold text-black dark:text-white">{c.first_name} {c.last_name}</td>
                                    <td className="p-4 text-gray-500 dark:text-white/50">{c.email}</td>
                                    <td className="p-4 text-right font-mono font-bold text-gold">RS. {c.total_spent}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
