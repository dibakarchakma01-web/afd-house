import React, { useState } from 'react';
import { Lock, LogIn, AlertCircle, ShoppingBag } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthViewProps {
  onSuccess: (user: any) => void;
  onBack: () => void;
}

export default function AuthView({ onSuccess, onBack }: AuthViewProps) {
  const { loginAdmin } = useAuth();
  const [passcode, setPasscode] = useState('');
  const [errorText, setErrorText] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode) return;

    const success = loginAdmin(passcode);
    if (success) {
      onSuccess({ email: 'dibakarchakma01@gmail.com', displayName: 'Store Owner', uid: 'admin-uid' });
    } else {
      setErrorText('Invalid administrative passcode. Please check and try again.');
    }
  };

  return (
    <div className="max-w-[420px] mx-auto py-12 px-8 bg-white dark:bg-slate-900 rounded-3xl shadow-xl hover:-translate-y-1 transition-transform border border-gray-100 dark:border-slate-800 text-center font-sans">
      <div className="space-y-6">
        {/* Header Branding */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full border border-gray-200 dark:border-slate-800 overflow-hidden shadow-md flex items-center justify-center bg-white">
            <img 
              src="/logo.png?v=4" 
              alt="AFD House Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            AFD HOUSE Admin Portal
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Secure administrative control interface. Authorized personnel only.
          </p>
        </div>

        {/* Passcode Input Form */}
        <form onSubmit={handleSubmit} className="space-y-5 pt-3">
          <div className="space-y-1.5 text-left">
            <label className="text-xs font-bold text-gray-750 dark:text-gray-300">
              Administrative Passcode (try: admin123)
            </label>
            <input
              type="password"
              required
              value={passcode}
              onChange={(e) => {
                setPasscode(e.target.value);
                setErrorText(null);
              }}
              placeholder="••••••••••••"
              className="w-full text-sm px-4 py-3 border border-gray-250 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 text-gray-900 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30 font-mono text-center tracking-widest"
            />
          </div>

          {/* Error Feedbacks */}
          {errorText && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/10 border border-red-100 dark:border-red-950/20 text-red-650 dark:text-red-400 rounded-xl text-xs font-semibold flex gap-2 items-center leading-relaxed">
              <AlertCircle size={15} className="shrink-0" />
              <span className="text-left">{errorText}</span>
            </div>
          )}

          {/* Authenticate Trigger */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg shadow-indigo-600/15 cursor-pointer flex items-center justify-center gap-2"
          >
            <LogIn size={18} />
            <span>Verify & Access Dashboard</span>
          </button>
        </form>

        {/* Bottom controls */}
        <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onBack}
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 font-bold flex items-center justify-center gap-1.5 mx-auto cursor-pointer transition-colors"
          >
            <ShoppingBag size={14} />
            <span>Return to Customer Frontpage</span>
          </button>
        </div>
      </div>
    </div>
  );
}
