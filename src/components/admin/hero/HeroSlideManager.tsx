import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Save, X, Video, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

type HeroSlide = {
  id: number;
  title: string;
  subtitle: string;
  image_url: string;
  video_url: string;
  cta_text: string;
  cta_link: string;
  sort_order: number;
  is_active: boolean;
};

export default function HeroSlideManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<HeroSlide>>({});

  const loadSlides = async () => {
    try {
      const data = await apiClient.get('/hero-slides');
      setSlides(data || []);
    } catch (e: any) {
      console.error('Failed to load hero slides', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSlides(); }, []);

  const handleSave = async () => {
    try {
      if (editingId === 0) {
        await apiClient.post('/hero-slides', formData);
      } else {
        await apiClient.put(`/hero-slides/${editingId}`, formData);
      }
      setEditingId(null);
      setFormData({});
      loadSlides();
    } catch (e: any) {
      console.error('Failed to save slide', e);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this slide?')) return;
    try {
      await apiClient.delete(`/hero-slides/${id}`);
      loadSlides();
    } catch (e: any) {
      console.error('Failed to delete slide', e);
    }
  };

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setFormData(slide);
  };

  const startNew = () => {
    setEditingId(0);
    setFormData({ title: '', subtitle: '', image_url: '', video_url: '', cta_text: 'Shop Now', cta_link: 'shop', sort_order: slides.length + 1, is_active: true });
  };

  if (loading) return <div className="text-white/40 text-sm">Loading hero slides...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-serif font-bold text-gold">Hero Slides</h2>
        <button onClick={startNew} className="btn-luxury flex items-center gap-2">
          <Plus size={14} /> Add Slide
        </button>
      </div>

      {editingId !== null && (
        <div className="bg-[#050505] border border-gold/20 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Title</label>
              <input value={formData.title ?? ''} onChange={e => setFormData({ ...formData, title: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Subtitle</label>
              <input value={formData.subtitle ?? ''} onChange={e => setFormData({ ...formData, subtitle: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2 flex items-center gap-2"><ImageIcon size={12} /> Image URL</label>
              <input value={formData.image_url ?? ''} onChange={e => setFormData({ ...formData, image_url: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" placeholder="https://..." />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2 flex items-center gap-2"><Video size={12} /> Video URL (optional)</label>
              <input value={formData.video_url ?? ''} onChange={e => setFormData({ ...formData, video_url: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" placeholder="https://...mp4" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">CTA Text</label>
              <input value={formData.cta_text ?? ''} onChange={e => setFormData({ ...formData, cta_text: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">CTA Link (page)</label>
              <input value={formData.cta_link ?? ''} onChange={e => setFormData({ ...formData, cta_link: e.target.value })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" placeholder="shop, contact, etc." />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Sort Order</label>
              <input type="number" value={formData.sort_order ?? 0} onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })} className="w-full bg-transparent border-b border-white/10 py-2 outline-none focus:border-gold text-sm" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-white/60 cursor-pointer">
                <input type="checkbox" checked={formData.is_active ?? true} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} className="accent-gold" />
                Active
              </label>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} className="btn-luxury flex items-center gap-2"><Save size={14} /> Save</button>
            <button onClick={() => { setEditingId(null); setFormData({}); }} className="px-4 py-2 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors flex items-center gap-2"><X size={14} /> Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {slides.map((slide) => (
          <div key={slide.id} className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-6 flex items-center gap-6">
            <div className="w-24 h-16 bg-gray-100 dark:bg-[#111] overflow-hidden flex-shrink-0">
              {slide.image_url ? <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full text-gray-400" />}
            </div>
            <div className="flex-grow">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-black dark:text-white">{slide.title}</h3>
                {slide.video_url && <Video size={14} className="text-gold" />}
                {!slide.is_active && <span className="text-[10px] bg-red-500/10 text-red-500 px-2 py-0.5">Inactive</span>}
              </div>
              <p className="text-xs text-gray-500 dark:text-white/40 truncate max-w-md">{slide.subtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => startEdit(slide)} className="text-gray-400 dark:text-white/20 hover:text-gold transition-colors"><Edit size={16} /></button>
              <button onClick={() => handleDelete(slide.id)} className="text-gray-400 dark:text-white/20 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
