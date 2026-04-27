import React, { useState, useEffect, useRef } from 'react';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';
import { Plus, Trash2, Edit, Save, X, Image as ImageIcon, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';

// ── Retry upload utility ─────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function uploadWithRetry(file: File, retries = 3): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `category-${Date.now()}.${fileExt}`;

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const { error } = await supabase.storage
                .from('product-images')
                .upload(fileName, file, { upsert: true });

            if (error) throw error;

            const { data } = supabase.storage
                .from('product-images')
                .getPublicUrl(fileName);

            return data.publicUrl;
        } catch (err: any) {
            if (attempt < retries) {
                console.warn(`[Upload] Attempt ${attempt} failed — retrying in ${attempt}s...`, err?.message);
                await sleep(attempt * 1000);
            } else {
                throw err;
            }
        }
    }
    throw new Error('Upload failed after all retries');
}

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastState = { type: 'success' | 'error' | 'info'; message: string } | null;

function Toast({ toast, onClose }: { toast: ToastState; onClose: () => void }) {
    useEffect(() => {
        if (!toast) return;
        const t = setTimeout(onClose, 4000);
        return () => clearTimeout(t);
    }, [toast]);

    if (!toast) return null;

    const styles = {
        success: 'bg-green-900/90 border-green-500/40 text-green-200',
        error:   'bg-red-900/90 border-red-500/40 text-red-200',
        info:    'bg-[#111]/90 border-white/10 text-white/70',
    };
    const icons = {
        success: <CheckCircle size={15} />,
        error:   <AlertCircle size={15} />,
        info:    <Loader2 size={15} className="animate-spin" />,
    };

    return (
        <div className={`fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-5 py-3 border rounded-lg shadow-2xl backdrop-blur-sm ${styles[toast.type]}`}>
            {icons[toast.type]}
            <span className="text-sm font-medium max-w-xs">{toast.message}</span>
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100 transition-opacity">
                <X size={13} />
            </button>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function CategoryManager() {
    const [categories, setCategories]   = useState<any[]>([]);
    const [loading, setLoading]         = useState(true);
    const [toast, setToast]             = useState<ToastState>(null);
    const [uploadingNew, setUploadingNew]   = useState(false);
    const [uploadingEdit, setUploadingEdit] = useState(false);
    const [savingId, setSavingId]       = useState<number | null>(null);

    // New category form
    const [newName, setNewName]     = useState('');
    const [newParent, setNewParent] = useState<number | null>(null);
    const [newImage, setNewImage]   = useState('');

    // Edit category form
    const [editingId, setEditingId]   = useState<number | null>(null);
    const [editName, setEditName]     = useState('');
    const [editParentId, setEditParentId] = useState<number | null>(null);
    const [editImage, setEditImage]   = useState('');

    const fileInputRef     = useRef<HTMLInputElement>(null);
    const editFileInputRef = useRef<HTMLInputElement>(null);

    const notify = (type: 'success' | 'error' | 'info', message: string) =>
        setToast({ type, message });

    useEffect(() => { load(); }, []);

    // ── Load ──────────────────────────────────────────────────────────────────
    const load = async () => {
        setLoading(true);
        try {
            const data = await apiClient.get('/categories');
            setCategories(data);
        } catch (e: any) {
            notify('error', 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    // ── Upload handlers (with retry) ──────────────────────────────────────────
    const handleNewImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (fileInputRef.current) fileInputRef.current.value = '';
        setUploadingNew(true);
        notify('info', 'Uploading image…');
        try {
            const url = await uploadWithRetry(file);
            setNewImage(url);
            notify('success', 'Image uploaded!');
        } catch (err: any) {
            notify('error', `Upload failed: ${err?.message ?? 'Network error — please try again'}`);
        } finally {
            setUploadingNew(false);
        }
    };

    const handleEditImagePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (editFileInputRef.current) editFileInputRef.current.value = '';
        setUploadingEdit(true);
        notify('info', 'Uploading image…');
        try {
            const url = await uploadWithRetry(file);
            setEditImage(url);
            notify('success', 'Image uploaded!');
        } catch (err: any) {
            notify('error', `Upload failed: ${err?.message ?? 'Network error — please try again'}`);
        } finally {
            setUploadingEdit(false);
        }
    };

    // ── CRUD ──────────────────────────────────────────────────────────────────
    const handleCreate = async () => {
        if (!newName.trim()) return;
        if (uploadingNew) { notify('info', 'Please wait for the image to finish uploading'); return; }
        try {
            await apiClient.post('/categories', {
                name: newName.trim(),
                slug: newName.trim().toLowerCase().replace(/\s+/g, '-'),
                parent_id: newParent,
                image_url: newImage || null,
            });
            setNewName(''); setNewParent(null); setNewImage('');
            notify('success', 'Category created!');
            load();
        } catch (e: any) {
            notify('error', `Failed to create: ${e?.message ?? 'Unknown error'}`);
        }
    };

    const startEdit = (cat: any) => {
        setEditingId(cat.id);
        setEditName(cat.name);
        setEditParentId(cat.parent_id ?? null);
        setEditImage(cat.image_url ?? '');
    };

    const handleUpdate = async (id: number) => {
        if (!editName.trim()) return;
        if (uploadingEdit) { notify('info', 'Please wait for the image to finish uploading'); return; }
        setSavingId(id);
        try {
            await apiClient.put(`/categories/${id}`, {
                name: editName.trim(),
                slug: editName.trim().toLowerCase().replace(/\s+/g, '-'),
                parent_id: editParentId,
                image_url: editImage || null,
            });
            setEditingId(null);
            notify('success', 'Category updated!');
            load();
        } catch (e: any) {
            notify('error', `Save failed: ${e?.message ?? 'Network error — check connection and try again'}`);
        } finally {
            setSavingId(null);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Delete this category? Sub-categories and products may be affected.')) return;
        try {
            await apiClient.delete(`/categories/${id}`);
            notify('success', 'Category deleted');
            load();
        } catch (e: any) {
            notify('error', `Delete failed: ${e?.message ?? 'Unknown error'}`);
        }
    };

    // ── Tree helpers ──────────────────────────────────────────────────────────
    const rootCategories = categories.filter(c => !c.parent_id);
    const getChildren    = (pid: number) => categories.filter(c => c.parent_id === pid);

    const renderCategory = (cat: any, depth = 0): React.ReactNode => {
        const children  = getChildren(cat.id);
        const isEditing = editingId === cat.id;
        const isSaving  = savingId  === cat.id;

        return (
            <React.Fragment key={cat.id}>
                <div
                    className="p-4 flex justify-between items-center group hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-black/5 dark:border-white/5"
                    style={{ paddingLeft: `${depth * 2 + 1}rem` }}
                >
                    {/* Content */}
                    <div className="flex items-center gap-4 flex-grow min-w-0">
                        {isEditing ? (
                            <div className="flex items-center gap-3 w-full flex-wrap">
                                {/* Image thumb — click to re-upload */}
                                <div
                                    className="relative w-12 h-12 flex-shrink-0 bg-gray-200 dark:bg-[#111] overflow-hidden rounded cursor-pointer border-2 border-dashed border-transparent hover:border-gold/50 transition-colors"
                                    onClick={() => !uploadingEdit && editFileInputRef.current?.click()}
                                    title="Click to change image"
                                >
                                    {uploadingEdit ? (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                                            <Loader2 size={16} className="animate-spin text-gold" />
                                        </div>
                                    ) : editImage ? (
                                        <img src={editImage} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    )}
                                    <input
                                        type="file" ref={editFileInputRef} className="hidden"
                                        accept="image/*" onChange={handleEditImagePick}
                                    />
                                </div>

                                <input
                                    type="text" value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleUpdate(cat.id)}
                                    className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-3 py-2 outline-none focus:border-gold text-black dark:text-white flex-grow min-w-[120px]"
                                />

                                <select
                                    value={editParentId ?? ''}
                                    onChange={e => setEditParentId(e.target.value ? parseInt(e.target.value) : null)}
                                    className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-3 py-2 outline-none focus:border-gold text-black dark:text-white text-sm"
                                >
                                    <option value="">No Parent (Main)</option>
                                    {categories.filter(c => c.id !== cat.id).map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>

                                <button
                                    onClick={() => handleUpdate(cat.id)}
                                    disabled={isSaving || uploadingEdit}
                                    className="text-gold hover:text-white disabled:opacity-40 transition-colors"
                                    title="Save"
                                >
                                    {isSaving
                                        ? <Loader2 size={16} className="animate-spin" />
                                        : <Save size={16} />
                                    }
                                </button>

                                <button
                                    onClick={() => setEditingId(null)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                    title="Cancel"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-[#111] overflow-hidden rounded">
                                    {cat.image_url
                                        ? <img src={cat.image_url} alt={cat.name} className="w-full h-full object-cover" />
                                        : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="text-gray-300" size={16} /></div>
                                    }
                                </div>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm text-black dark:text-white truncate">
                                        {depth > 0 && <span className="text-white/30 mr-1">└─</span>}
                                        {cat.name}
                                    </h3>
                                    <p className="text-[10px] text-gray-500 dark:text-white/40 font-mono mt-0.5">/{cat.slug}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Action buttons */}
                    {!isEditing && (
                        <div className="flex gap-3 ml-4 flex-shrink-0">
                            <button
                                onClick={() => startEdit(cat)}
                                className="text-gray-400 dark:text-white/20 hover:text-gold dark:hover:text-gold transition-colors"
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                            <button
                                onClick={() => handleDelete(cat.id)}
                                className="text-gray-400 dark:text-white/20 hover:text-red-500 dark:hover:text-red-500 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )}
                </div>

                {/* Children */}
                {children.map(child => renderCategory(child, depth + 1))}
            </React.Fragment>
        );
    };

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="p-8">
            <Toast toast={toast} onClose={() => setToast(null)} />

            <h2 className="text-2xl font-serif font-bold text-gold mb-8">Category Taxonomy</h2>

            {/* Add new category */}
            <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-6 mb-8">
                <h3 className="font-bold text-sm uppercase tracking-widest mb-4 text-gray-700 dark:text-white/80">Add New Category</h3>
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-grow flex gap-4">
                        {/* Image picker */}
                        <div
                            className="w-12 h-12 flex-shrink-0 bg-gray-100 dark:bg-[#111] overflow-hidden rounded cursor-pointer relative border-2 border-dashed border-transparent hover:border-gold/50 transition-colors"
                            onClick={() => !uploadingNew && fileInputRef.current?.click()}
                            title="Click to add image"
                        >
                            {uploadingNew ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 size={16} className="animate-spin text-gold" />
                                </div>
                            ) : newImage ? (
                                <img src={newImage} className="w-full h-full object-cover" alt="" />
                            ) : (
                                <ImageIcon className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            )}
                            <input
                                type="file" ref={fileInputRef} className="hidden"
                                accept="image/*" onChange={handleNewImagePick}
                            />
                        </div>

                        <input
                            type="text" value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Category Name"
                            onKeyDown={e => e.key === 'Enter' && handleCreate()}
                            className="flex-grow bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                        />

                        <select
                            value={newParent ?? ''}
                            onChange={e => setNewParent(e.target.value ? parseInt(e.target.value) : null)}
                            className="bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 px-4 py-3 outline-none focus:border-gold transition-colors text-black dark:text-white text-sm"
                        >
                            <option value="">No Parent (Main Category)</option>
                            {rootCategories.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={uploadingNew || !newName.trim()}
                        className="btn-luxury flex items-center justify-center gap-2 px-8 disabled:opacity-50"
                    >
                        {uploadingNew
                            ? <><Loader2 size={16} className="animate-spin" /> Uploading…</>
                            : <><Plus size={16} /> Add Category</>
                        }
                    </button>
                </div>
            </div>

            {/* Category list */}
            {loading ? (
                <div className="flex items-center gap-3 text-white/30 p-6">
                    <Loader2 size={18} className="animate-spin" /> Loading categories…
                </div>
            ) : (
                <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5">
                    {rootCategories.length === 0 ? (
                        <p className="p-6 text-gray-500 dark:text-white/30">No categories yet. Add your first one above.</p>
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
