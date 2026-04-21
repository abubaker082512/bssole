import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Edit, Save, X, Video, Image as ImageIcon, Upload, RefreshCw, CheckCircle } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';
import { supabase } from '../../../lib/supabase';

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

type UploadStatus = 'idle' | 'uploading' | 'done' | 'error';

function MediaUploadBox({
  label,
  accept,
  currentUrl,
  bucket,
  prefix,
  onUploaded,
  onClear,
}: {
  label: string;
  accept: string;
  currentUrl: string;
  bucket: string;
  prefix: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const isVideo = accept.includes('video');

  const upload = async (file: File) => {
    setStatus('uploading');
    setProgress(20);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `${prefix}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(fileName, file, { upsert: true });
      if (error) throw error;
      setProgress(80);
      const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
      setProgress(100);
      setStatus('done');
      onUploaded(data.publicUrl);
    } catch (e: any) {
      console.error('Upload failed', e);
      setStatus('error');
    }
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;
    upload(file);
  };

  return (
    <div>
      <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-2 mb-2">
        {isVideo ? <Video size={12} /> : <ImageIcon size={12} />} {label}
      </label>

      {currentUrl ? (
        <div className="relative rounded-xl overflow-hidden border border-white/10 group">
          {isVideo ? (
            <video src={currentUrl} className="w-full h-36 object-cover" muted playsInline />
          ) : (
            <img src={currentUrl} alt="Banner" className="w-full h-36 object-cover" />
          )}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-4 py-2 bg-gold text-black text-xs font-bold uppercase rounded hover:bg-white transition-colors flex items-center gap-2"
            >
              <Upload size={14} /> Replace
            </button>
            <button
              type="button"
              onClick={onClear}
              className="p-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
          {status === 'done' && (
            <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
              <CheckCircle size={14} />
            </div>
          )}
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files[0]);
          }}
          className={`relative border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
            dragging ? 'border-gold bg-gold/5' : 'border-white/10 hover:border-gold/50 hover:bg-white/5'
          }`}
        >
          {status === 'uploading' ? (
            <div className="text-center">
              <RefreshCw size={28} className="text-gold animate-spin mx-auto mb-3" />
              <div className="w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gold transition-all rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-xs text-white/40 mt-2">Uploading...</p>
            </div>
          ) : status === 'error' ? (
            <div className="text-center">
              <X size={28} className="text-red-500 mx-auto mb-2" />
              <p className="text-xs text-red-400">Upload failed. Try again.</p>
            </div>
          ) : (
            <div className="text-center pointer-events-none">
              {isVideo ? (
                <Video size={32} className="text-white/20 mx-auto mb-3" />
              ) : (
                <ImageIcon size={32} className="text-white/20 mx-auto mb-3" />
              )}
              <p className="text-sm font-bold text-white/50">Click or drag & drop</p>
              <p className="text-xs text-white/25 mt-1">{isVideo ? 'MP4, WebM' : 'JPG, PNG, WebP'} supported</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}

export default function HeroSlideManager() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<HeroSlide>>({});
  const [saving, setSaving] = useState(false);

  const loadSlides = async () => {
    setLoading(true);
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
    setSaving(true);
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
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this banner slide?')) return;
    try {
      await apiClient.delete(`/hero-slides/${id}`);
      loadSlides();
    } catch (e: any) {
      console.error('Failed to delete slide', e);
    }
  };

  const startEdit = (slide: HeroSlide) => {
    setEditingId(slide.id);
    setFormData({ ...slide });
  };

  const startNew = () => {
    setEditingId(0);
    setFormData({
      title: '',
      subtitle: '',
      image_url: '',
      video_url: '',
      cta_text: 'Shop Now',
      cta_link: 'shop',
      sort_order: slides.length + 1,
      is_active: true,
    });
  };

  const cancel = () => { setEditingId(null); setFormData({}); };

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-white/30">
      <RefreshCw size={16} className="animate-spin" /> Loading hero slides...
    </div>
  );

  return (
    <div className="p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-serif font-bold text-gold">Hero Banners</h2>
          <p className="text-white/30 text-sm mt-1">Upload images or videos for your homepage carousel</p>
        </div>
        <button onClick={startNew} className="btn-luxury flex items-center gap-2">
          <Plus size={14} /> Add Banner
        </button>
      </div>

      {/* Editor Panel */}
      {editingId !== null && (
        <div className="bg-[#050505] border border-gold/20 rounded-2xl p-6 md:p-8 mb-8 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold text-white">{editingId === 0 ? 'New Banner' : 'Edit Banner'}</h3>
            <button onClick={cancel} className="text-white/30 hover:text-white"><X size={20} /></button>
          </div>

          {/* Media Upload — Image and Video side by side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <MediaUploadBox
              label="Banner Image"
              accept="image/*"
              currentUrl={formData.image_url ?? ''}
              bucket="product-images"
              prefix="hero-img"
              onUploaded={(url) => setFormData({ ...formData, image_url: url })}
              onClear={() => setFormData({ ...formData, image_url: '' })}
            />
            <MediaUploadBox
              label="Banner Video (optional — overrides image)"
              accept="video/*"
              currentUrl={formData.video_url ?? ''}
              bucket="product-images"
              prefix="hero-vid"
              onUploaded={(url) => setFormData({ ...formData, video_url: url })}
              onClear={() => setFormData({ ...formData, video_url: '' })}
            />
          </div>

          {/* Text Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Title</label>
              <input
                value={formData.title ?? ''}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Step Into Style"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-gold text-white text-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Subtitle</label>
              <input
                value={formData.subtitle ?? ''}
                onChange={e => setFormData({ ...formData, subtitle: e.target.value })}
                placeholder="e.g. Premium footwear for every occasion"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-gold text-white text-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Button Text</label>
              <input
                value={formData.cta_text ?? ''}
                onChange={e => setFormData({ ...formData, cta_text: e.target.value })}
                placeholder="e.g. Shop Now"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-gold text-white text-sm transition-colors"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Button Link (page)</label>
              <select
                value={formData.cta_link ?? 'shop'}
                onChange={e => setFormData({ ...formData, cta_link: e.target.value })}
                className="w-full bg-[#111] border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-gold text-white text-sm transition-colors"
              >
                <option value="shop">Shop All</option>
                <option value="men-shoes">Men's Shoes</option>
                <option value="women-shoes">Women's Shoes</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] block mb-2">Display Order</label>
              <input
                type="number"
                value={formData.sort_order ?? 1}
                onChange={e => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-gold text-white text-sm transition-colors"
              />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                  className={`w-12 h-6 rounded-full transition-colors relative ${formData.is_active ? 'bg-gold' : 'bg-white/20'}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${formData.is_active ? 'left-7' : 'left-1'}`} />
                </div>
                <span className="text-sm text-white/60">Active (show on website)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="btn-luxury flex items-center gap-2 disabled:opacity-60"
            >
              {saving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Saving...' : 'Save Banner'}
            </button>
            <button onClick={cancel} className="px-6 py-3 text-xs text-white/40 hover:text-white border border-white/10 hover:border-white/30 transition-colors rounded flex items-center gap-2">
              <X size={14} /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Slides List */}
      {slides.length === 0 && !editingId ? (
        <div className="text-center py-24 border-2 border-dashed border-white/10 rounded-2xl">
          <ImageIcon size={48} className="text-white/10 mx-auto mb-4" />
          <p className="text-white/30 mb-4">No banner slides yet</p>
          <button onClick={startNew} className="btn-luxury">Add Your First Banner</button>
        </div>
      ) : (
        <div className="space-y-4">
          {slides.map((slide) => (
            <div
              key={slide.id}
              className="bg-[#050505] border border-white/5 rounded-xl overflow-hidden flex items-center gap-0 hover:border-gold/20 transition-all group"
            >
              {/* Thumbnail */}
              <div className="w-40 h-24 flex-shrink-0 bg-[#111] overflow-hidden">
                {slide.video_url ? (
                  <video src={slide.video_url} className="w-full h-full object-cover" muted playsInline />
                ) : slide.image_url ? (
                  <img src={slide.image_url} alt={slide.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon size={24} className="text-white/10" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-grow px-6 py-4">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="font-bold text-white text-sm">{slide.title || <span className="text-white/30">Untitled</span>}</h3>
                  {slide.video_url && (
                    <span className="text-[10px] border border-blue-400/30 text-blue-400 px-2 py-0.5 rounded flex items-center gap-1">
                      <Video size={10} /> Video
                    </span>
                  )}
                  {!slide.is_active && (
                    <span className="text-[10px] bg-red-500/10 text-red-400 border border-red-500/20 px-2 py-0.5 rounded">Inactive</span>
                  )}
                  {slide.is_active && (
                    <span className="text-[10px] bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-0.5 rounded">Live</span>
                  )}
                </div>
                <p className="text-xs text-white/30 truncate max-w-sm">{slide.subtitle}</p>
                <p className="text-[10px] text-white/20 mt-1">Order #{slide.sort_order} · CTA: {slide.cta_text} → {slide.cta_link}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 px-6">
                <button
                  onClick={() => startEdit(slide)}
                  className="p-2 text-white/30 hover:text-gold transition-colors rounded"
                  title="Edit"
                >
                  <Edit size={16} />
                </button>
                <button
                  onClick={() => handleDelete(slide.id)}
                  className="p-2 text-white/30 hover:text-red-500 transition-colors rounded"
                  title="Delete"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
