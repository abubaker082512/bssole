import React, { useState, useEffect } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { Plus, X, Server, LayoutTemplate, Layers, Settings, Image as ImageIcon } from 'lucide-react';

export default function ProductForm({ productId, onBack }: { productId?: number, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    
    // Product State
    const [product, setProduct] = useState({
        name: '', slug: '', description: '', short_description: '', 
        regular_price: 0, sale_price: 0, stock_quantity: 0, sku: '', 
        status: 'published', type: 'simple', category_id: null
    });
    
    const [categories, setCategories] = useState<any[]>([]);

    useEffect(() => {
        loadInitialData();
        if (productId) loadProduct();
    }, [productId]);

    const loadInitialData = async () => {
        try {
            setCategories(await apiClient.get('/categories'));
        } catch (e) {
            console.error('Failed to load form dependencies', e);
        }
    };

    const loadProduct = async () => {
        setLoading(true);
        try {
           // For simplicity in this demo, fetch all to find the one. Usually an endpoint like /products/:id exists.
           const products = await apiClient.get('/products');
           const found = products.find((p:any) => p.id === productId);
           if (found) {
               setProduct(found);
           }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            if (productId) {
                await apiClient.put(`/products/${productId}`, product);
            } else {
                await apiClient.post('/products', product);
            }
            onBack();
        } catch (e) {
            console.error('Save failed', e);
        }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <LayoutTemplate size={16} /> },
        { id: 'inventory', label: 'Inventory', icon: <Server size={16} /> },
        { id: 'variations', label: 'Variations', icon: <Layers size={16} /> },
        { id: 'media', label: 'Media Gallery', icon: <ImageIcon size={16} /> },
        { id: 'advanced', label: 'Advanced', icon: <Settings size={16} /> },
    ];

    if (loading) return <div className="p-8 text-white/50">Loading Product...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-white/5">
                <div>
                    <button onClick={onBack} className="text-white/30 hover:text-gold text-xs font-bold uppercase tracking-widest mb-4 block group">
                        <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span> Back to Products
                    </button>
                    <h2 className="text-4xl font-serif font-bold gold-text-gradient">{productId ? `Edit Product: ${product.name}` : 'Add New Product'}</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={onBack} className="px-8 py-3 border border-white/10 hover:border-white/30 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-all">Cancel</button>
                    <button onClick={handleSave} className="btn-luxury px-10 py-3 text-xs">Save Product</button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Tabs Sidebar */}
                <div className="w-full md:w-64 flex-shrink-0 flex md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-3 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-[#111] border-l-2 border-gold text-gold' : 'text-white/40 border-l-2 border-transparent hover:text-white hover:bg-white/5'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-grow bg-[#050505] border border-white/5 p-8 md:p-12">
                    {activeTab === 'general' && (
                        <div className="space-y-8 max-w-2xl">
                            <h3 className="text-xl font-serif font-bold border-b border-white/5 pb-4 gold-text-gradient">General Information</h3>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Product Name</label>
                                <input type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-colors text-sm" placeholder="e.g. Oxford Classic" />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Regular Price (RS)</label>
                                    <input type="number" value={product.regular_price} onChange={e => setProduct({...product, regular_price: parseFloat(e.target.value)})} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-colors text-sm font-mono" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Sale Price (RS)</label>
                                    <input type="number" value={product.sale_price} onChange={e => setProduct({...product, sale_price: parseFloat(e.target.value)})} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-colors text-sm font-mono" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Category</label>
                                <select value={product.category_id || ''} onChange={e => setProduct({...product, category_id: parseInt(e.target.value)})} className="w-full bg-[#111] border border-white/10 py-4 px-4 outline-none focus:border-gold transition-colors text-sm text-white/80">
                                    <option value="">Select a category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-8 max-w-2xl">
                             <h3 className="text-xl font-serif font-bold border-b border-white/5 pb-4 gold-text-gradient">Inventory Tracking</h3>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">SKU</label>
                                    <input type="text" value={product.sku} onChange={e => setProduct({...product, sku: e.target.value})} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-colors text-sm font-mono" placeholder="BSS-001" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Stock Quantity</label>
                                    <input type="number" value={product.stock_quantity} onChange={e => setProduct({...product, stock_quantity: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-colors text-sm font-mono" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'variations' && (
                        <div className="space-y-8 text-center py-20">
                            <Layers className="mx-auto text-white/10 mb-6" size={48} />
                            <h3 className="text-xl font-serif font-bold gold-text-gradient mb-4">Product Variations</h3>
                            <p className="text-white/40 text-sm max-w-md mx-auto mb-8 leading-relaxed">Before you can add a variation you need to add some variation attributes on the Attributes tab. Currently, this product is saved as a <strong>Simple Product</strong>.</p>
                            <button className="btn-luxury inline-flex items-center justify-center">Generate Variants</button>
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-serif font-bold border-b border-white/5 pb-4 gold-text-gradient">Product Gallery</h3>
                            <div className="border-2 border-dashed border-white/10 p-20 flex flex-col items-center justify-center bg-[#111] text-center hover:border-gold/50 transition-colors cursor-pointer group">
                                <ImageIcon className="text-white/20 group-hover:text-gold mb-6 transition-colors" size={48} />
                                <h4 className="text-sm font-bold uppercase tracking-widest text-white/80 mb-2">Drag and drop images here</h4>
                                <p className="text-xs text-white/40">or click to browse from your computer</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
