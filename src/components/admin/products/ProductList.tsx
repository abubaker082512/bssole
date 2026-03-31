import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Search, Plus, Filter, Edit, Trash2 } from 'lucide-react';

export default function ProductList({ onEdit, onAdd }: { onEdit: (id: number) => void, onAdd: () => void }) {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await apiClient.get('/products');
            setProducts(data);
        } catch (e) {
            console.error('Failed to load products', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            await apiClient.delete(`/products/${id}`);
            loadProducts();
        } catch (e) {
            console.error('Failed to delete product', e);
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-serif font-bold text-gold">Products</h2>
                <button onClick={onAdd} className="btn-luxury flex items-center gap-2 text-sm px-6 py-3">
                    <Plus size={16} /> Add Product
                </button>
            </div>

            <div className="flex gap-4 mb-8">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search products..."
                        className="w-full bg-[#111] border border-white/10 pl-12 pr-4 py-3 outline-none focus:border-gold text-white text-sm"
                    />
                </div>
                <button className="px-6 py-3 border border-white/10 hover:border-gold text-white/50 hover:text-white transition-all flex items-center gap-2 text-sm uppercase tracking-widest font-bold">
                    <Filter size={16} /> Filter
                </button>
            </div>

            {loading ? <p className="text-white/30">Loading...</p> : (
                <div className="bg-[#050505] border border-white/5 overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-[#111] text-white/50 uppercase tracking-widest text-xs">
                            <tr>
                                <th className="p-4 font-normal">Product</th>
                                <th className="p-4 font-normal">SKU</th>
                                <th className="p-4 font-normal">Stock</th>
                                <th className="p-4 font-normal">Price</th>
                                <th className="p-4 font-normal">Status</th>
                                <th className="p-4 font-normal text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-white/80">
                            {products.map(p => (
                                <tr key={p.id} className="hover:bg-white/5 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-16 bg-[#111] border border-white/10 overflow-hidden flex-shrink-0">
                                                {p.product_images?.[0] ? 
                                                    <img src={p.product_images[0].image_url} alt="" className="w-full h-full object-cover" /> 
                                                    : <div className="w-full h-full flex items-center justify-center text-white/10">No Img</div>}
                                            </div>
                                            <div>
                                                <div className="font-bold text-base text-white hover:text-gold cursor-pointer" onClick={() => onEdit(p.id)}>{p.name}</div>
                                                <div className="text-xs text-white/30 mt-1">{p.categories?.name || 'Uncategorized'}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-white/50">{p.sku || '-'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold ${p.stock_quantity > 10 ? 'text-green-500 bg-green-500/10' : p.stock_quantity > 0 ? 'text-orange-500 bg-orange-500/10' : 'text-red-500 bg-red-500/10'}`}>
                                            {p.stock_quantity} IN STOCK
                                        </span>
                                    </td>
                                    <td className="p-4 text-gold font-bold">RS. {p.regular_price}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 text-xs font-bold uppercase tracking-widest border ${p.status === 'published' ? 'border-gold text-gold' : 'border-white/20 text-white/40'}`}>
                                            {p.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => onEdit(p.id)} className="text-white/30 hover:text-white transition-colors"><Edit size={16} /></button>
                                            <button onClick={() => handleDelete(p.id)} className="text-white/30 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
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
