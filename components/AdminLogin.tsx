import React, { useState } from 'react';
import { X, Lock, Key, ShieldCheck, AlertTriangle, Loader2 } from 'lucide-react';
import { verifyAdmin } from '../services/supabaseClient';

interface AdminLoginProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}

const AdminLogin: React.FC<AdminLoginProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [id, setId] = useState('');
  const [pass, setPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const isValid = await verifyAdmin(id, pass);
      if (isValid) {
        onLoginSuccess();
        onClose();
      } else {
        setError('ACCESS DENIED: Invalid Credentials');
      }
    } catch (err) {
      setError('System Error: Authentication Service Offline');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-md bg-black border border-red-500/50 shadow-[0_0_50px_rgba(255,0,0,0.2)] rounded-sm overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Scanline overlay for this modal specifically */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] z-20 opacity-20"></div>

        <div className="p-6 border-b border-red-500/30 bg-red-900/10 flex justify-between items-center">
           <div className="flex items-center gap-2 text-red-500">
             <ShieldCheck className="w-5 h-5" />
             <h2 className="font-mono font-bold tracking-widest text-sm">MAINFRAME_ACCESS</h2>
           </div>
           <button onClick={onClose} className="text-red-500/50 hover:text-red-500 transition-colors">
             <X className="w-5 h-5" />
           </button>
        </div>

        <div className="p-8">
            <div className="text-center mb-6">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/30">
                    <Lock className="w-8 h-8 text-red-500" />
                </div>
                <p className="text-xs font-mono text-red-400 uppercase tracking-widest">Restricted Area // Level 5 Clearance</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 text-xs font-mono flex items-center gap-2 animate-pulse">
                        <AlertTriangle className="w-4 h-4" /> {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-red-500/70 font-mono tracking-widest">Operative ID</label>
                    <div className="relative">
                        <input 
                            type="text" 
                            value={id}
                            onChange={(e) => setId(e.target.value)}
                            className="w-full bg-black border border-red-900 focus:border-red-500 outline-none text-red-500 p-3 pl-10 font-mono text-sm placeholder-red-900 transition-colors"
                            placeholder="ADMIN_ID"
                            autoComplete="off"
                        />
                        <ShieldCheck className="absolute left-3 top-3 w-4 h-4 text-red-900" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] uppercase text-red-500/70 font-mono tracking-widest">Security Key</label>
                    <div className="relative">
                        <input 
                            type="password" 
                            value={pass}
                            onChange={(e) => setPass(e.target.value)}
                            className="w-full bg-black border border-red-900 focus:border-red-500 outline-none text-red-500 p-3 pl-10 font-mono text-sm placeholder-red-900 transition-colors"
                            placeholder="••••••••"
                        />
                        <Key className="absolute left-3 top-3 w-4 h-4 text-red-900" />
                    </div>
                </div>

                <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-red-600 hover:bg-red-500 text-black font-bold uppercase tracking-widest py-3 text-sm transition-all shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" /> VERIFYING...
                        </span>
                    ) : (
                        "AUTHENTICATE"
                    )}
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;