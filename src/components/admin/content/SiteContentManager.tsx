import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import { apiClient } from '../../../lib/apiClient';

export default function SiteContentManager() {
  const [marquee, setMarquee] = useState<string>('');
  const [footerTagline, setFooterTagline] = useState<string>('');
  const [footerCopyright, setFooterCopyright] = useState<string>('');
  const [contactEmail, setContactEmail] = useState<string>('');
  const [contactWhatsapp, setContactWhatsapp] = useState<string>('');
  const [contactStudio, setContactStudio] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const loadContent = async () => {
    try {
      const data = await apiClient.get('/site-content');
      if (data?.marquee) setMarquee(data.marquee.text ?? '');
      if (data?.footer) {
        setFooterTagline(data.footer.tagline ?? '');
        setFooterCopyright(data.footer.copyright ?? '');
      }
      if (data?.contact) {
        setContactEmail(data.contact.email ?? '');
        setContactWhatsapp(data.contact.whatsapp ?? '');
        setContactStudio(data.contact.studio ?? '');
      }
    } catch (e: any) {
      console.error('Failed to load site content', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadContent(); }, []);

  const handleSave = async (section: string, content: any) => {
    setSaving(true);
    try {
      await apiClient.put(`/site-content/${section}`, { content });
      setToast(`${section} saved successfully!`);
      setTimeout(() => setToast(null), 3000);
    } catch (e: any) {
      console.error(`Failed to save ${section}`, e);
      setToast(`Failed to save ${section}`);
      setTimeout(() => setToast(null), 3000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-white/40 text-sm">Loading site content...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-serif font-bold text-gold">Site Content</h2>
        {toast && <div className="text-xs text-gold">{toast}</div>}
      </div>

      {/* Marquee Section */}
      <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-8">
        <h3 className="font-serif text-lg font-bold text-black dark:text-white mb-6">Announcement Bar (Marquee)</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Marquee Text</label>
            <textarea
              rows={3}
              value={marquee}
              onChange={e => setMarquee(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white resize-none"
              placeholder="🎉 FREE SHIPPING ON ORDERS ABOVE RS. 10,000!"
            />
          </div>
          <button onClick={() => handleSave('marquee', { text: marquee })} className="btn-luxury flex items-center gap-2" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Marquee'}
          </button>
        </div>
      </div>

      {/* Footer Section */}
      <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-8">
        <h3 className="font-serif text-lg font-bold text-black dark:text-white mb-6">Footer</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Tagline</label>
            <input
              value={footerTagline}
              onChange={e => setFooterTagline(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white"
              placeholder="Redefining everyday luxury..."
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Copyright</label>
            <input
              value={footerCopyright}
              onChange={e => setFooterCopyright(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white"
              placeholder="© 2026 BSSOLE..."
            />
          </div>
          <button onClick={() => handleSave('footer', { tagline: footerTagline, copyright: footerCopyright })} className="btn-luxury flex items-center gap-2" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Footer'}
          </button>
        </div>
      </div>

      {/* Contact Section */}
      <div className="bg-white dark:bg-[#050505] border border-black/5 dark:border-white/5 p-8">
        <h3 className="font-serif text-lg font-bold text-black dark:text-white mb-6">Contact Information</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Email</label>
            <input
              value={contactEmail}
              onChange={e => setContactEmail(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white"
              placeholder="bssoleofficial@gmail.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">WhatsApp</label>
            <input
              value={contactWhatsapp}
              onChange={e => setContactWhatsapp(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white"
              placeholder="0325 528 1122"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-gray-500 dark:text-white/40 uppercase tracking-[0.2em] block mb-2">Studio Address</label>
            <input
              value={contactStudio}
              onChange={e => setContactStudio(e.target.value)}
              className="w-full bg-gray-100 dark:bg-[#111] border border-black/10 dark:border-white/10 rounded px-4 py-3 outline-none focus:border-gold transition-all text-sm text-black dark:text-white"
              placeholder="Gulberg III, Lahore, Pakistan"
            />
          </div>
          <button onClick={() => handleSave('contact', { email: contactEmail, whatsapp: contactWhatsapp, studio: contactStudio })} className="btn-luxury flex items-center gap-2" disabled={saving}>
            <Save size={14} /> {saving ? 'Saving...' : 'Save Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}
