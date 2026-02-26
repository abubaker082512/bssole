import React, { useState } from 'react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
    onLoginSuccess: () => void;
}

export default function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { error: authError } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (authError) {
            setError('Invalid credentials. Please check your email and password.');
        } else {
            onLoginSuccess();
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black px-6 relative overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-gold/3 rounded-full blur-3xl" />
                <div
                    className="absolute inset-0 opacity-[0.03]"
                    style={{
                        backgroundImage:
                            'repeating-linear-gradient(0deg, transparent, transparent 50px, rgba(255,255,255,0.1) 50px, rgba(255,255,255,0.1) 51px)',
                    }}
                />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="relative w-full max-w-md"
            >
                {/* Header */}
                <div className="text-center mb-16">
                    <div className="text-4xl font-serif font-black tracking-tighter mb-4">
                        <span className="gold-text-gradient">BS</span>
                        <span className="text-white">SOLE</span>
                    </div>
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <div className="h-[1px] w-12 bg-gold/30" />
                        <Lock size={12} className="text-gold" />
                        <div className="h-[1px] w-12 bg-gold/30" />
                    </div>
                    <p className="text-white/30 text-[10px] font-bold uppercase tracking-[0.4em]">
                        Admin Access Only
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-[#050505] border border-white/5 p-10 md:p-12">
                    <h1 className="text-3xl font-serif font-bold mb-2">
                        Welcome <span className="gold-text-gradient italic">Back.</span>
                    </h1>
                    <p className="text-white/30 text-sm mb-12">
                        Sign in to manage your store products and inventory.
                    </p>

                    <form onSubmit={handleLogin} className="space-y-10">
                        {/* Email */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Mail size={10} />
                                Email Address
                            </label>
                            <input
                                id="admin-email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="ADMIN@BSSOLE.COM"
                                className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm tracking-[0.05em] placeholder:text-white/20"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-3">
                            <label className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] flex items-center gap-2">
                                <Lock size={10} />
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    id="admin-password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••••"
                                    className="w-full bg-transparent border-b border-white/10 py-4 outline-none focus:border-gold transition-all text-sm pr-10 placeholder:text-white/20"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 text-white/20 hover:text-gold transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 px-5 py-4 text-red-400"
                            >
                                <AlertCircle size={14} />
                                <span className="text-xs font-bold tracking-wide">{error}</span>
                            </motion.div>
                        )}

                        {/* Submit */}
                        <button
                            id="admin-login-btn"
                            type="submit"
                            disabled={loading}
                            className="btn-luxury w-full py-5 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                    Authenticating...
                                </>
                            ) : (
                                'Access Dashboard'
                            )}
                        </button>
                    </form>
                </div>

                <p className="text-center text-white/10 text-[9px] font-bold uppercase tracking-[0.3em] mt-8">
                    BSSOLE Admin Portal — Authorized Personnel Only
                </p>
            </motion.div>
        </div>
    );
}
