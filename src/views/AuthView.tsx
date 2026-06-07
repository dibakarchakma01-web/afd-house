import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, updateProfile } from 'firebase/auth';
import { auth, handleFirestoreError, OperationType } from '../firebase';

interface AuthViewProps {
  onSuccess: (user: any) => void;
  onBack: () => void;
}

export default function AuthView({ onSuccess, onBack }: AuthViewProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Credentials Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Loading & Error feedback states
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const handlePasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorText(null);

    try {
      if (isLogin) {
        // SignIn Email password
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        onSuccess(userCred.user);
      } else {
        // SignUp Email password
        if (!name) {
          setErrorText('Verify name input field is completed.');
          setIsLoading(false);
          return;
        }
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        // Write displayName to profile state
        await updateProfile(userCred.user, { displayName: name });
        onSuccess(userCred.user);
      }
    } catch (err: any) {
      console.error('Password authentication failed:', err);
      // Clean up readable string triggers
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErrorText('Wrong email or password. Double check variables credentials.');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorText('An account with this email address already exists.');
      } else {
        setErrorText(err.message || 'Authentication unsuccessful. Retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuthPopup = async () => {
    setIsLoading(true);
    setErrorText(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      onSuccess(userCred.user);
    } catch (err: any) {
      console.error('Google verification popups cancelled:', err);
      if (err.code !== 'auth/popup-closed-by-user') {
        setErrorText('Google sign-on failed. Verify popup permissions settings.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[380px] mx-auto py-10 sm:py-12 px-6 sm:px-8 bg-white rounded-2xl shadow-[0_8px_24px_rgba(0,0,0,0.1)] text-center relative overflow-hidden transition-transform duration-300 hover:-translate-y-1.5 font-sans">
      <div className="space-y-8">
        {/* Title greeting card */}
        <div className="space-y-1.5">
          <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-xs text-gray-400 font-medium tracking-wide">
            {isLogin ? 'Access your AFD HOUSE collections' : 'Join our premium marketplace community'}
          </p>
        </div>

        {/* Standard Form */}
        <form onSubmit={handlePasswordAuth} className="space-y-6 pt-2">
          
          {/* Email Signup Display Name field option */}
          {!isLogin && (
            <div className="relative group">
              <input
                type="text"
                required
                id="name"
                name="name"
                placeholder=" "
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="peer w-full py-2.5 text-base text-gray-800 bg-transparent border-b-2 border-gray-200 outline-none transition-colors duration-300 focus:border-brand-green"
              />
              <label 
                htmlFor="name"
                className="absolute left-0 top-2.5 text-base text-gray-400 pointer-events-none transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-green peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-green peer-[:not(:placeholder-shown)]:font-bold"
              >
                Full Name
              </label>
            </div>
          )}

          {/* Email address field */}
          <div className="relative group">
            <input
              type="email"
              required
              id="email"
              name="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="peer w-full py-2.5 text-base text-gray-800 bg-transparent border-b-2 border-gray-200 outline-none transition-colors duration-300 focus:border-brand-green"
            />
            <label 
              htmlFor="email"
              className="absolute left-0 top-2.5 text-base text-gray-400 pointer-events-none transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-green peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-green peer-[:not(:placeholder-shown)]:font-bold"
            >
              Email Address
            </label>
          </div>

          {/* password field */}
          <div className="relative group">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              id="password"
              name="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full py-2.5 text-base text-gray-800 bg-transparent border-b-2 border-gray-200 outline-none transition-colors duration-300 focus:border-brand-green pr-10"
            />
            <label 
              htmlFor="password"
              className="absolute left-0 top-2.5 text-base text-gray-400 pointer-events-none transition-all duration-300 peer-focus:-top-4 peer-focus:text-xs peer-focus:text-brand-green peer-focus:font-bold peer-[:not(:placeholder-shown)]:-top-4 peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-brand-green peer-[:not(:placeholder-shown)]:font-bold"
            >
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-0 top-2.5 text-gray-400 hover:text-gray-600 transition-colors"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {/* Error notifications */}
          {errorText && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-[11px] font-bold flex gap-2 items-center leading-normal animate-fadeIn">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorText}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-brand-green to-brand-green-dark text-white font-black text-base rounded-xl transition-all duration-300 shadow-lg shadow-brand-green/20 hover:shadow-brand-green/40 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={20} />
                <span>{isLogin ? 'Login Now' : 'Create Account'}</span>
              </>
            )}
          </button>
        </form>

        {/* separator bar */}
        <div className="flex items-center gap-3 text-gray-300 font-bold text-[10px] uppercase tracking-widest px-4">
          <div className="h-px bg-gray-100 flex-1" />
          <span>Or Quick Access</span>
          <div className="h-px bg-gray-100 flex-1" />
        </div>

        {/* Google OAuth instant authentication */}
        <button
          onClick={handleGoogleAuthPopup}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 py-3 border-2 border-gray-100 hover:bg-gray-50 text-gray-900 text-sm font-black rounded-xl transition-all duration-300 cursor-pointer"
        >
          <img
            src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
            alt="Google logo"
            className="w-5 h-5"
          />
          <span>Sign in with Google</span>
        </button>

        {/* Back and switcher controls */}
        <div className="flex flex-col gap-4 text-sm pt-4 border-t border-gray-50">
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-brand-green hover:underline font-black cursor-pointer transition-all"
          >
            {isLogin ? 'Don\'t have an account? Sign Up' : 'Already have an account? Log In'}
          </button>
          
          <button
            type="button"
            onClick={onBack}
            className="text-gray-400 hover:text-gray-600 font-bold transition-all"
          >
            ← Back to Shop
          </button>
        </div>
      </div>
    </div>
  );
}
