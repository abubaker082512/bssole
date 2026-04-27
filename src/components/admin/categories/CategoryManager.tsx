import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon } from 'lucide-react';

export default function CategoryManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingImage, setUploadingImage] = useState(false);
    
    // New Category State
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParent, setNewCategoryParent] = useState<number | null>(null);
    const [newCategoryImage, setNewCategoryImage] = useState('');
    
    // Edit Category State
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editName, setEditName] = useState('');
    const [editParentId, setEditParentId] = useState<number | null>(null);
    const [editImage, setEditImage] = useState('');

    const fileInputRef = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

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

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, isEdit: boolean) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingImage(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `category-${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file);
            
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('product-images').getPublicUrl(fileName);
            
            if (isEdit) {
                setEditImage(data.publicUrl);
            } else {
                setNewCategoryImage(data.publicUrl);
            }
        } catch (err) {
            console.error('Upload failed', err);
            alert('Upload failed');
        } finally {
            setUploadingImage(false);
        }
    };

    const handleCreate = async () => {
        if (!newCategoryName) return;
        try {
            await apiClient.post('/categories', { 
                name: newCategoryName, 
                slug: newCategoryName.toLowerCase().replace(/ /g, '-'),
                parent_id: newCategoryParent,
                image_url: newCategoryImage
            });
            setNewCategoryName('');
            setNewCategoryParent(null);
            setNewCategoryImage('');
            loadCategories();
        } catch (e) {
            console.error('Failed to create category', e);
        }
    };

    const startEdit = (cat: any) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditParentId(cat.parent_id);
        setEditImage(cat.image_url || '');
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        try {
            await apiClient.put(`/categories/${id}`, { 
                name: editName, 
                slug: editName.toLowerCase().replace(/ /g, '-'),
                parent_id: editParentId,
                image_url: editImage
            });
            setEditingId(null);
            setEditName('');
            setEditParentId(null);
            setEditImage('');
            loadCategories();
        } catch (e) {
            console.error('Failed to update category', e);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this category? Sub-categories and products might be affected.')) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            loadCategories();
        } catch (e) {
            console.error('Failed to delete category', e);
        }
    };

    // Build category tree
    const rootCategories = categories.filter(c => !c.parent_id);
    const getChildren = (parentId: number) => categories.filter(c => c.parent_id === parentId);

    const renderCategory = (cat: any, depth: number = 0) => {
        const children = getChildren(cat.id);
        const isEditing = editingId === cat.id;

        return (
            <React.Fragment key={cat.id}>
                <div className={`p-4 flex justify-between items-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5`} style={{ paddingLeft: `${depth * 2 + 1}rem` }}>
                    <div className="flex items-center gap-4 flex-grow">
                        {isEditing ? (
                            <div className="flex items-center gap-3 w-full">
                                <div className="relative w-12 h-12 bg-gray-200 dark:bg-[#111] overflow-hidden rounded cursor-pointer" onClick={() => editFileInputRef.current?.click()}>
                                    {editImage ? <img src={editImage} className="w-full h-full object-cover" /> : <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                                    <input type="file" ref={editFileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, true)} />
                                </div>
                                <input 
                                    type="text" 
                                    value={editName} 
                                    onChange={e => setEditName(e.target.value)}
                                    className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-3 py-2 outline-none focus:border-gold text-black dark:text-white flex-grow"
                                />
                                <select 
                                    value={editParentId || ''} 
                                    onChange={e => setEditParentId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-3 py-2 outline-none focus:border-gold text-black dark:text-white"
                                >
                                    <option value="">No Parent (Main)</option>
                                    {categories.filter(c => c.id !== cat.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button onClick={() => handleUpdate(cat.id)} className="text-gold hover:text-white"><Save size={16} /></button>
                                <button onClick={() => setEditingId(null)} className="text-gray-400"><X size={16} /></button>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-gray-100 dark:bg-[#111] overflow-hidden rounded flex-shrink-0">
                                    {cat.image_url ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" size={16} /></div>}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-black dark:text-white">{depth > 0 && '└─ '}{cat.name}</h3>
                                    <p className="text-[10px] text-gray-500 dark:text-white/40 font-mono mt-1">/{cat.slug}</p>
                                </div>
                            </>
                        )}
                    </div>
                    {!isEditing && (
                        <div className="flex gap-3 ml-4">
                            <button onClick={() => startEdit(cat)} className="text-gray-400 dark:text-white/20 hover:text-gold dark:hover:text-gold transition-colors"><Edit size={16} /></button>
                            <button onClick={() => handleDelete(cat.id)} className="text-gray-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                        </div>
                    )}
                </div>
                {children.map(child => renderCategory(child, depth + 1))}
            </React.Fragment>
        );
    };

    return (
        <div className="p-8">
            <h2 className="text-2xl font-serif font-bold text-gold mb-8">Category Taxonomy</h2>
            
            <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-6 mb-8">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-gray-700 dark:text-white/80">Add New Category</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow flex gap-4">
                        <div className="w-12 h-12 bg-gray-100 dark:bg-[#111] overflow-hidden rounded cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                            {newCategoryImage ? <img src={newCategoryImage} className="w-full h-full object-cover" /> : <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" size={16} />}
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, false)} />
                        </div>
                        <input 
                            type="text" 
                            value={newCategoryName} 
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="New Category Name"
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            className="flex-grow bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                        />
                        <select 
                            value={newCategoryParent || ''} 
                            onChange={e => setNewCategoryParent(e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                        >
                            <option value="">No Parent (Main Category)</option>
                            {rootCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleCreate} disabled={uploadingImage} className="btn-luxury flex items-center justify-center gap-2 px-8">
                        {uploadingImage ? 'Uploading...' : <><Plus size={16} /> Add Category</>}
                    </button>
                </div>
            </div>
            
            {loading ? <p className="text-gray-500 dark:text-white/30">Loading...</p> : (
                <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5">
                    {rootCategories.length === 0 ? (
                        <p className="p-6 text-gray-500 dark:text-white/30">No categories found.</p>
                    ) : (
                        <div className="flex flex-col">
                            {rootCategories.map(cat => renderCategory(cat, 0))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
