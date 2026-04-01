import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Plus, Trash2, Edit, X } from 'lucide-react';

export default function AttributeManager() {
    const [attributes, setAttributes] = useState<any[]>([]);
    const [newAttrName, setNewAttrName] = useState('');
    const [newValueData, setNewValueData] = useState<{ [key: number]: string }>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAttributes();
    }, []);

    const loadAttributes = async () => {
        try {
            const data = await apiClient.get('/attributes');
            setAttributes(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateAttribute = async () => {
        if (!newAttrName.trim()) return;
        try {
            await apiClient.post('/attributes', { name: newAttrName });
            setNewAttrName('');
            loadAttributes();
        } catch (e) { console.error(e); }
    };

    const handleDeleteAttribute = async (id: number) => {
        if (!confirm('Delete this attribute globally? It will break associated variants.')) return;
        try {
            await apiClient.delete(`/attributes/${id}`);
            loadAttributes();
        } catch (e) { console.error(e); }
    };

    const handleAddValue = async (attrId: number) => {
        const val = newValueData[attrId];
        if (!val || !val.trim()) return;
        try {
            await apiClient.post(`/attributes/values`, { attribute_id: attrId, value: val });
            setNewValueData({ ...newValueData, [attrId]: '' });
            loadAttributes();
        } catch (e) { console.error(e); }
    };

    const handleDeleteValue = async (valId: number) => {
        try {
            await apiClient.delete(`/attributes/values/${valId}`);
            loadAttributes();
        } catch (e) { console.error(e); }
    };

    return (
        <div className="p-8">
            <h2 className="text-3xl font-serif font-bold text-gold mb-8">Attributes Matrix</h2>
            
            <div className="flex gap-4 mb-8">
                <input 
                    type="text" 
                    value={newAttrName} 
                    onChange={e => setNewAttrName(e.target.value)}
                    placeholder="E.g., Size, Color, Material"
                    className="flex-grow bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                />
                <button onClick={handleCreateAttribute} className="btn-luxury flex items-center gap-2">
                    <Plus size={16} /> Add Global Attribute
                </button>
            </div>
            
            {loading ? <p className="text-gray-500 dark:text-white/30">Loading...</p> : (
                <div className="space-y-6">
                    {attributes.length === 0 ? (
                        <p className="p-6 bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 text-gray-500 dark:text-white/30">No attributes defined. Define colors or sizes first.</p>
                    ) : attributes.map(attr => (
                        <div key={attr.id} className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-6">
                            <div className="flex justify-between items-center mb-6 border-b border-black/5 dark:border-white/5 pb-4">
                                <h3 className="font-bold text-xl text-black dark:text-white">{attr.name}</h3>
                                <button onClick={() => handleDeleteAttribute(attr.id)} className="text-gray-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mb-6">
                                {(attr.attribute_values || []).map((val: any) => (
                                    <div key={val.id} className="group flex items-center gap-2 bg-gray-100 dark:bg-[#111] px-4 py-2 border border-black/10 dark:border-white/10 text-sm font-bold text-gray-700 dark:text-white/80">
                                        {val.value}
                                        <button onClick={() => handleDeleteValue(val.id)} className="text-gray-400 dark:text-white/30 hover:text-red-500 transition-colors ml-2"><X size={14} /></button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-3 max-w-sm">
                                <input 
                                    type="text" 
                                    value={newValueData[attr.id] || ''} 
                                    onChange={e => setNewValueData({ ...newValueData, [attr.id]: e.target.value })}
                                    placeholder="Add term (e.g. XL)"
                                    className="flex-grow bg-transparent border-b border-black/10 dark:border-white/10 py-2 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                                />
                                <button onClick={() => handleAddValue(attr.id)} className="text-gold text-xs font-bold uppercase tracking-widest hover:text-black dark:hover:text-white transition-colors">Add</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
