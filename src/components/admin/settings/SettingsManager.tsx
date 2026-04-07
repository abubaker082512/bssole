import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';

export default function SettingsManager() {
    const [settings, setSettings] = useState<any>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<string | null>(null);

    useEffect(() => {
        apiClient.get('/settings').then(data => {
            setSettings(data);
            setLoading(false);
        }).catch(e => console.error(e));
    }, []);

    const handleSave = async (key: string, value: any) => {
        setSaving(true);
        try {
            await apiClient.put(`/settings/${key}`, { value });
            setToast(`${key} settings saved!`);
            setTimeout(() => setToast(null), 3000);
        } catch (e) { 
            console.error(e);
            setToast('Failed to save settings');
            setTimeout(() => setToast(null), 3000);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <p className="p-8 text-gray-500 dark:text-white/30">Loading...</p>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-gold">Store Settings</h2>
                {toast && <div className="text-sm text-gold">{toast}</div>}
            </div>
            
            <div className="space-y-8 max-w-2xl">
                {/* General Settings */}
                <div className="bg-white dark:bg-[#050505] p-8 border border-black/5 dark:border-white/5">
                    <h3 className="font-serif text-xl font-bold mb-6 text-black dark:text-white">General Setup</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Store Name</label>
                            <input 
                                type="text" 
                                value={settings.general?.store_name || ''} 
                                onChange={e => setSettings({...settings, general: {...settings.general, store_name: e.target.value}})}
                                className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Store Email</label>
                            <input 
                                type="email" 
                                value={settings.general?.store_email || ''} 
                                onChange={e => setSettings({...settings, general: {...settings.general, store_email: e.target.value}})}
                                className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Store Phone</label>
                            <input 
                                type="text" 
                                value={settings.general?.store_phone || ''} 
                                onChange={e => setSettings({...settings, general: {...settings.general, store_phone: e.target.value}})}
                                className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                            />
                        </div>
                    </div>
                    <button onClick={() => handleSave('general', settings.general)} disabled={saving} className="mt-6 btn-luxury">{saving ? 'Saving...' : 'Save General'}</button>
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
                                className="accent-gold"
                            /> Cash on Delivery (COD)
                        </label>
                    </div>
                    <button onClick={() => handleSave('payment', settings.payment)} disabled={saving} className="mt-6 btn-luxury">{saving ? 'Saving...' : 'Save Payment'}</button>
                </div>

                {/* Delivery Settings */}
                <div className="bg-white dark:bg-[#050505] p-8 border border-black/5 dark:border-white/5">
                    <h3 className="font-serif text-xl font-bold mb-6 text-black dark:text-white">Delivery Settings</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Free Shipping Threshold (Rs)</label>
                            <input 
                                type="number" 
                                value={settings.delivery?.free_shipping_threshold || 3000} 
                                onChange={e => setSettings({...settings, delivery: {...settings.delivery, free_shipping_threshold: parseInt(e.target.value)}})}
                                className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Standard Delivery Charge (Rs)</label>
                            <input 
                                type="number" 
                                value={settings.delivery?.standard_charge || 300} 
                                onChange={e => setSettings({...settings, delivery: {...settings.delivery, standard_charge: parseInt(e.target.value)}})}
                                className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                            />
                        </div>
                    </div>
                    <button onClick={() => handleSave('delivery', settings.delivery)} disabled={saving} className="mt-6 btn-luxury">{saving ? 'Saving...' : 'Save Delivery'}</button>
                </div>
            </div>
        </div>
    );
}
