import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';
import { Plus, X, Server, LayoutTemplate, Layers, Settings, Image as ImageIcon, Trash2 } from 'lucide-react';

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
    
    // Variations & Attributes State
    const [globalAttributes, setGlobalAttributes] = useState<any[]>([]);
    const [selectedValues, setSelectedValues] = useState<{ [attrId: number]: number[] }>({});
    const [variants, setVariants] = useState<any[]>([]);

    // Media State
    const [images, setImages] = useState<any[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadInitialData();
        if (productId) loadProduct();
    }, [productId]);

    const loadInitialData = async () => {
        try {
            setCategories(await apiClient.get('/categories'));
            setGlobalAttributes(await apiClient.get('/attributes'));
        } catch (e) {
            console.error('Failed to load form dependencies', e);
        }
    };

    const loadProduct = async () => {
        setLoading(true);
        try {
           const products = await apiClient.get('/products');
           const found = products.find((p:any) => p.id === productId);
           if (found) {
               setProduct(found);
               setImages(found.product_images || []);
               setVariants(found.product_variants || []);
           }
        } catch(e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            let savedProductId = productId;
            if (productId) {
                await apiClient.put(`/products/${productId}`, product);
            } else {
                const newProduct = await apiClient.post('/products', product);
                savedProductId = newProduct.id;
            }

            // If we have variants generated that don't have IDs yet, save them
            const newVariants = variants.filter(v => !v.id);
            if (newVariants.length > 0 && savedProductId) {
                await apiClient.post(`/variants/product/${savedProductId}`, { variants: newVariants });
            }

            onBack();
        } catch (e) {
            console.error('Save failed', e);
            alert('Failed to save product. Check console.');
        }
    };

    const toggleAttributeValue = (attrId: number, valId: number) => {
        const current = selectedValues[attrId] || [];
        if (current.includes(valId)) {
            setSelectedValues({ ...selectedValues, [attrId]: current.filter(id => id !== valId) });
        } else {
            setSelectedValues({ ...selectedValues, [attrId]: [...current, valId] });
        }
    };

    const generateVariants = () => {
        // Cartesian Product of selected values
        const arraysToCombine = Object.values(selectedValues).filter((arr: any) => arr.length > 0) as any[][];
        if (arraysToCombine.length === 0) return;

        const cartesian = (a: any[], b: any[]) => [].concat(...a.map((d: any) => b.map((e: any) => [].concat(d, e))) as any);
        const combos = arraysToCombine.reduce(cartesian, [[]] as any[]);

        const newVariants = combos.map((combo: any, idx: number) => {
            const attrArray = Array.isArray(combo) ? combo : [combo];
            return {
                sku: `${product.sku || 'VAR'}-${Date.now()}-${idx}`,
                price: product.regular_price,
                stock_quantity: 0,
                attributes: attrArray
            };
        });

        setVariants([...variants, ...newVariants]);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!productId) return alert('Please save the product first before uploading images.');
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${productId}-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
            
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            
            // Save to DB
            const newImage = await apiClient.post(`/products/${productId}/images`, { image_url: data.publicUrl, sort_order: 0 });
            setImages([...images, newImage]);
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const deleteImage = async (imageId: number) => {
        if(!productId) return;
        try {
            await apiClient.delete(`/products/${productId}/images/${imageId}`);
            setImages(images.filter(i => i.id !== imageId));
        } catch (e) { console.error(e); }
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <LayoutTemplate size={16} /> },
        { id: 'inventory', label: 'Inventory', icon: <Server size={16} /> },
        { id: 'variations', label: 'Variations', icon: <Layers size={16} /> },
        { id: 'media', label: 'Media Gallery', icon: <ImageIcon size={16} /> },
        { id: 'advanced', label: 'Advanced', icon: <Settings size={16} /> },
    ];

    if (loading) return <div className="p-8 text-gray-500 dark:text-white/50">Loading Product...</div>

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 pb-8 border-b border-black/5 dark:border-white/5">
                <div>
                    <button onClick={onBack} className="text-gray-400 dark:text-white/30 hover:text-gold dark:hover:text-gold text-xs font-bold uppercase tracking-widest mb-4 block group">
                        <span className="group-hover:-translate-x-1 inline-block transition-transform">←</span> Back to Products
                    </button>
                    <h2 className="text-4xl font-serif font-bold gold-text-gradient">{productId ? `Edit Product: ${product.name}` : 'Add New Product'}</h2>
                </div>
                <div className="flex gap-4">
                    <button onClick={onBack} className="px-8 py-3 border border-black/10 dark:border-white/10 hover:border-black/30 dark:hover:border-white/30 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-white/50 hover:text-black dark:hover:text-white transition-all">Cancel</button>
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
                            className={`flex items-center gap-3 px-6 py-4 text-xs font-bold uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-gray-100 dark:bg-[#111] border-l-2 border-gold text-gold' : 'text-gray-500 dark:text-white/40 border-l-2 border-transparent hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
                        >
                            {tab.icon} {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="flex-grow bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-8 md:p-12">
                    {activeTab === 'general' && (
                        <div className="space-y-8 max-w-2xl">
                            <h3 className="text-xl font-serif font-bold border-b border-black/5 dark:border-white/5 pb-4 gold-text-gradient">General Information</h3>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Product Name</label>
                                <input type="text" value={product.name} onChange={e => setProduct({...product, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm" placeholder="e.g. Oxford Classic" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Short Description</label>
                                <input type="text" value={product.short_description || ''} onChange={e => setProduct({...product, short_description: e.target.value})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm" placeholder="Brief product tagline" />
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Full Description</label>
                                <textarea rows={5} value={product.description || ''} onChange={e => setProduct({...product, description: e.target.value})} className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm resize-none" placeholder="Detailed product description..." />
                            </div>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Regular Price (RS)</label>
                                    <input type="number" value={product.regular_price} onChange={e => setProduct({...product, regular_price: parseFloat(e.target.value)})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm font-mono" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Sale Price (RS)</label>
                                    <input type="number" value={product.sale_price} onChange={e => setProduct({...product, sale_price: parseFloat(e.target.value)})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm font-mono" />
                                </div>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Category</label>
                                <select value={product.category_id || ''} onChange={e => setProduct({...product, category_id: parseInt(e.target.value)})} className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 py-4 px-4 outline-none focus:border-gold transition-colors text-sm text-gray-800 dark:text-white/80">
                                    <option value="">Select a category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-4">
                                <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Status</label>
                                <select value={product.status} onChange={e => setProduct({...product, status: e.target.value})} className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 py-4 px-4 outline-none focus:border-gold transition-colors text-sm text-gray-800 dark:text-white/80">
                                    <option value="published">Published</option>
                                    <option value="draft">Draft</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {activeTab === 'inventory' && (
                        <div className="space-y-8 max-w-2xl">
                             <h3 className="text-xl font-serif font-bold border-b border-black/5 dark:border-white/5 pb-4 gold-text-gradient">Inventory Tracking</h3>
                             <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">SKU</label>
                                    <input type="text" value={product.sku} onChange={e => setProduct({...product, sku: e.target.value})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm font-mono" placeholder="BSS-001" />
                                </div>
                                <div className="space-y-4">
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-white/30 uppercase tracking-[0.3em]">Stock Quantity</label>
                                    <input type="number" value={product.stock_quantity} onChange={e => setProduct({...product, stock_quantity: parseInt(e.target.value)})} className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-4 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm font-mono" />
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {activeTab === 'variations' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-serif font-bold border-b border-black/5 dark:border-white/5 pb-4 gold-text-gradient">Product Variations</h3>
                            
                            {!productId && (
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-sm border border-orange-200 dark:border-orange-800/30">
                                    Please save the product first to enable variations.
                                </div>
                            )}

                            {productId && (
                                <>
                                    <div className="bg-gray-50 dark:bg-[#111] p-6 border border-black/5 dark:border-white/5 space-y-6">
                                        <h4 className="font-bold text-black dark:text-white uppercase tracking-widest text-xs">1. Select Attributes</h4>
                                        {globalAttributes.map(attr => (
                                            <div key={attr.id} className="space-y-2">
                                                <p className="text-sm font-bold text-gray-700 dark:text-white/80">{attr.name}</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {attr.attribute_values?.map((val: any) => (
                                                        <label key={val.id} className="flex items-center gap-2 text-sm text-gray-600 dark:text-white/60 bg-white dark:bg-[#050505] border border-black/10 dark:border-white/10 px-3 py-1 cursor-pointer">
                                                            <input 
                                                                type="checkbox" 
                                                                checked={(selectedValues[attr.id] || []).includes(val.id)}
                                                                onChange={() => toggleAttributeValue(attr.id, val.id)}
                                                            />
                                                            {val.value}
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                        <button onClick={generateVariants} className="btn-luxury px-6 py-2 text-[10px]">2. Generate Variations</button>
                                    </div>

                                    {variants.length > 0 && (
                                        <div className="overflow-x-auto border border-black/5 dark:border-white/5">
                                            <table className="w-full text-left text-sm">
                                                <thead className="bg-gray-100 dark:bg-[#111] text-gray-500 dark:text-white/50 uppercase tracking-widest text-[10px]">
                                                    <tr>
                                                        <th className="p-4">SKU</th>
                                                        <th className="p-4">Price</th>
                                                        <th className="p-4">Stock</th>
                                                        <th className="p-4">Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-black/5 dark:divide-white/5">
                                                    {variants.map((v, i) => (
                                                        <tr key={v.id || i}>
                                                            <td className="p-4 font-mono text-xs">
                                                                <input type="text" value={v.sku} onChange={(e) => {
                                                                    const nv = [...variants]; nv[i].sku = e.target.value; setVariants(nv);
                                                                }} className="bg-transparent border-b border-black/10 dark:border-white/10 p-1 w-full outline-none text-black dark:text-white" />
                                                            </td>
                                                            <td className="p-4">
                                                                <input type="number" value={v.price} onChange={(e) => {
                                                                    const nv = [...variants]; nv[i].price = parseFloat(e.target.value); setVariants(nv);
                                                                }} className="bg-transparent border-b border-black/10 dark:border-white/10 p-1 w-24 outline-none text-black dark:text-white" />
                                                            </td>
                                                            <td className="p-4">
                                                                <input type="number" value={v.stock_quantity} onChange={(e) => {
                                                                    const nv = [...variants]; nv[i].stock_quantity = parseInt(e.target.value); setVariants(nv);
                                                                }} className="bg-transparent border-b border-black/10 dark:border-white/10 p-1 w-20 outline-none text-black dark:text-white" />
                                                            </td>
                                                            <td className="p-4 text-xs text-green-600 dark:text-green-400 font-bold">{v.id ? 'Saved' : 'Pending Save'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="space-y-8">
                            <h3 className="text-xl font-serif font-bold border-b border-black/5 dark:border-white/5 pb-4 gold-text-gradient">Product Gallery</h3>
                            
                            {!productId ? (
                                <div className="p-4 bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 text-sm border border-orange-200 dark:border-orange-800/30">
                                    Please save the product first to enable media uploads.
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                                        {images.map(img => (
                                            <div key={img.id} className="relative group aspect-square border border-black/10 dark:border-white/10 overflow-hidden bg-gray-100 dark:bg-[#111]">
                                                <img src={img.image_url} alt="Product segment" className="w-full h-full object-cover" />
                                                <button onClick={() => deleteImage(img.id)} className="absolute top-2 right-2 bg-red-500 text-white p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-black/10 dark:border-white/10 p-20 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#111] text-center hover:border-gold/50 dark:hover:border-gold/50 transition-colors cursor-pointer group">
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
                                        <ImageIcon className="text-gray-400 dark:text-white/20 group-hover:text-gold dark:group-hover:text-gold mb-6 transition-colors" size={48} />
                                        <h4 className="text-sm font-bold uppercase tracking-widest text-gray-700 dark:text-white/80 mb-2">Click to upload image</h4>
                                        <p className="text-xs text-gray-500 dark:text-white/40">Powered by Supabase Storage</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
