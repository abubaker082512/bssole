import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Plus, Trash2, Edit } from 'lucide-react';

export default function CategoryManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/categories');
            setCategories(data);
        } catch (e) {
            console.error('Failed to load categories', e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName) return;
        try {
            await apiClient.post('/categories', { name: newCategoryName, slug: newCategoryName.toLowerCase().replace(/ /g, '-') });
            setNewCategoryName('');
            loadCategories();
        } catch (e) {
            console.error('Failed to create category', e);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            await apiClient.delete(`/categories/${id}`);
            loadCategories();
        } catch (e) {
            console.error('Failed to delete category', e);
        }
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-serif font-bold text-gold mb-8">Category Taxonomy</h2>
            <div className="flex gap-4 mb-8">
                <input 
                    type="text" 
                    value={newCategoryName} 
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="New Category Name"
                    className="flex-grow bg-[#111] border border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-white text-sm"
                />
                <button onClick={handleCreate} className="btn-luxury flex items-center gap-2">
                    <Plus size={16} /> Add Category
                </button>
            </div>
            
            {loading ? <p className="text-white/30">Loading...</p> : (
                <div className="bg-[#050505] border border-white/5 divide-y divide-white/5">
                    {categories.length === 0 ? (
                        <p className="p-6 text-white/30">No categories found.</p>
                    ) : categories.map(cat => (
                        <div key={cat.id} className="p-6 flex justify-between items-center group hover:bg-white/5 transition-colors">
                            <div>
                                <h3 className="font-bold text-lg">{cat.name}</h3>
                                <p className="text-xs text-white/40 font-mono mt-1">/{cat.slug}</p>
                            </div>
                            <div className="flex gap-3">
                                <button className="text-white/20 hover:text-gold transition-colors"><Edit size={16} /></button>
                                <button onClick={() => handleDelete(cat.id)} className="text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
