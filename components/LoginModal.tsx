import React, { useState } from 'react';
import { X, Mail, KeyRound, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { sendOtpToEmail, verifyOtpToken } from '../services/supabaseClient';
import OtpInput from './OtpInput';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any) => void;
  onAdminRequest: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess, onAdminRequest }) => {
  const [step, setStep] = useState<'EMAIL' | 'OTP'>('EMAIL');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const validateSRMEmail = (email: string) => {
    // Regex: Exactly 6 alphanumeric chars before @srmist.edu.in
    const srmRegex = /^[a-zA-Z0-9]{6}@srmist\.edu\.in$/;
    return srmRegex.test(email);
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 1. Validation Logic
    const fullEmail = email.toLowerCase() === 'main' ? 'main@srmist.edu.in' : `${email}@srmist.edu.in`;

    if (email.toLowerCase() !== 'main' && !validateSRMEmail(fullEmail)) {
      setError('INVALID FORMAT: Must have exactly 6 characters (e.g., ab1234).');
      return;
    }

    setLoading(true);
    try {
      const { error } = await sendOtpToEmail(fullEmail);
      if (error) throw error;
      setStep('OTP');
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtpLogic = async (codeToCheck: string) => {
    setError(null);
    setLoading(true);

    try {
      const fullEmail = email.toLowerCase() === 'main' ? 'main@srmist.edu.in' : `${email}@srmist.edu.in`;
      const { data, error } = await verifyOtpToken(fullEmail, codeToCheck);
      if (error || !data.user) throw error || new Error('Invalid Token');

      onLoginSuccess(data.user);
      onClose();
    } catch (err: any) {
      setError('AUTHENTICATION FAILED: Invalid OTP Code.');
      // Clear OTP on failure to allow retry (optional, but good UX)
    } finally {
      setLoading(false);
    }
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
      setError("Please enter the full 6-digit code.");
      return;
    }
    await verifyOtpLogic(otp);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose}></div>

      <div className="relative w-full max-w-md bg-[#0A0A0A] border border-[#00F0FF]/30 rounded-xl overflow-hidden shadow-[0_0_50px_rgba(0,240,255,0.1)]">

        <div className="p-6 border-b border-white/10 bg-[#00F0FF]/5 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold tracking-tighter text-white">IDENTITY_VERIFICATION</h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 bg-[#00F0FF] rounded-full animate-pulse"></div>
              <p className="text-[10px] font-mono text-[#00F0FF]">AEROCHAIN_NODE_V1.0</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 bg-red-500/10 border border-red-500/50 p-3 rounded text-red-500 text-xs font-mono flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {step === 'EMAIL' ? (
            <form onSubmit={handleSendOtp} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-400 font-mono tracking-widest">SRM ID (First 6 Chars)</label>
                <div className="relative">
                  <input
                    autoFocus
                    type="text"
                    maxLength={6}
                    value={email}
                    onChange={e => setEmail(e.target.value.replace(/\s/g, ''))}
                    placeholder="ab1234"
                    className="w-full bg-white/5 border border-white/10 rounded p-3 pl-10 text-white focus:border-[#00F0FF] focus:outline-none transition-colors font-mono"
                  />
                  <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-500" />
                </div>

                {email && email.toLowerCase() !== 'admin_' && email.toLowerCase() !== 'main' && (
                  <p className="text-[10px] text-[#00F0FF] font-mono mt-2 bg-[#00F0FF]/10 p-2 rounded border border-[#00F0FF]/20">
                    Preview: {email}@srmist.edu.in
                  </p>
                )}

                {!email && (
                  <p className="text-[10px] text-gray-500">*Format: 6 characters only</p>
                )}

                {email.toLowerCase() === 'admin_' && (
                  <div
                    onClick={() => { onClose(); onAdminRequest(); }}
                    className="mt-4 text-[10px] text-red-500 font-mono cursor-pointer hover:underline flex items-center justify-center gap-2 animate-pulse bg-red-500/10 p-2 rounded border border-red-500/30"
                  >
                    <ShieldCheck className="w-3 h-3" />
                    ACCESS_MAIN_LEDGER_//_ADMIN
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-[#00F0FF] hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'REQUEST ACCESS CODE'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-6">
              <div className="text-center mb-4">
                <div className="w-12 h-12 bg-[#00F0FF]/10 rounded-full flex items-center justify-center mx-auto mb-2 text-[#00F0FF]">
                  <Mail className="w-6 h-6" />
                </div>
                <p className="text-xs text-gray-400">Code sent to <span className="text-white">{email === 'main' ? 'main@srmist.edu.in' : `${email}@srmist.edu.in`}</span></p>
                <button type="button" onClick={() => setStep('EMAIL')} className="text-[10px] text-[#00F0FF] hover:underline mt-1">Change Email</button>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase text-gray-400 font-mono tracking-widest block text-center">One-Time Password</label>

                {/* NEW COMPONENT */}
                <OtpInput
                  length={6}
                  onComplete={(code) => setOtp(code)}
                />

                <div className="text-center">
                  <p className="text-[10px] text-gray-500 mt-2">Enter the 6-digit code sent to your email</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full flex items-center justify-center px-4 py-3 text-xs font-bold uppercase tracking-widest text-black bg-[#00F0FF] hover:bg-white transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'VERIFY & ENTER'}
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginModal;