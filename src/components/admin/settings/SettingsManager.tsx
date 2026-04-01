import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';

export default function SettingsManager() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get('/settings').then(data => {
            setSettings(data);
            setLoading(false);
        }).catch(e => console.error(e));
    }, []);

    const handleSave = async (key: string, value: any) => {
        try {
            await apiClient.put(`/settings/${key}`, { value });
            alert('Settings saved!');
        } catch (e) { console.error(e); }
    };

    if (loading) return <p className="p-8 text-gray-500 dark:text-white/30">Loading...</p>;

    return (
        <div className="p-8">
            <h2 className="text-3xl font-serif font-bold text-gold mb-8">Store Settings</h2>
            
            <div className="space-y-8 max-w-2xl">
                {/* General Settings */}
                <div className="bg-white dark:bg-[#050505] p-8 border border-black/5 dark:border-white/5">
                    <h3 className="font-serif text-xl font-bold mb-6 text-black dark:text-white">General Setup</h3>
                    <div className="space-y-4">
                        <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em]">Store Name</label>
                        <input 
                            type="text" 
                            value={settings.general?.store_name || ''} 
                            onChange={e => setSettings({...settings, general: {...settings.general, store_name: e.target.value}})}
                            className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                        />
                    </div>
                    <button onClick={() => handleSave('general', settings.general)} className="mt-6 btn-luxury">Save General</button>
                </div>

                {/* Payment Settings */}
                <div className="bg-white dark:bg-[#050505] p-8 border border-black/5 dark:border-white/5">
                    <h3 className="font-serif text-xl font-bold mb-6 text-black dark:text-white">Payment Methods</h3>
                    <div className="space-y-4">
                        <label className="flex items-center gap-3 text-sm text-gray-700 dark:text-white/80">
                            <input 
                                type="checkbox" 
                                checked={settings.payment?.cash_on_delivery || false}
                                onChange={e => setSettings({...settings, payment: {...settings.payment, cash_on_delivery: e.target.checked}})}
                            /> Cash on Delivery (COD)
                        </label>
                    </div>
                    <button onClick={() => handleSave('payment', settings.payment)} className="mt-6 btn-luxury">Save Payment Info</button>
                </div>
            </div>
        </div>
    );
}
