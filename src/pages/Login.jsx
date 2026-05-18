import React, { useState } from 'react';
import { useStore } from '../store';
import { Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const { login, isLoading } = useStore();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setLocalError('Harap lengkapi semua kolom!');
      return;
    }
    
    login(
      email, 
      password, 
      () => {}, // Sukses ditangani di App.jsx oleh state listener
      (err) => setLocalError(err)
    );
  };

  // Shortcut login cepat untuk mempermudah kasir/koki di tablet
  const handleQuickLogin = (role) => {
    let emailMap = {
      Admin: 'admin@nasigoreng.com',
      Kasir: 'kasir@nasigoreng.com',
      Kitchen: 'koki@nasigoreng.com',
      Owner: 'owner@nasigoreng.com'
    };
    setEmail(emailMap[role]);
    setPassword('123456');
    setLocalError('');
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-brand-dark relative overflow-hidden px-4">
      {/* Background Ornaments */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-brand-orange/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-brand-gold/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-lg bg-gray-900/60 backdrop-blur-xl border border-gray-800 rounded-3xl p-8 md:p-10 shadow-2xl flex flex-col items-center"
      >
        {/* Brand Logo */}
        <div className="w-16 h-16 rounded-full bg-brand-orange flex items-center justify-center text-white font-extrabold text-2xl mb-4 shadow-lg border border-brand-gold/30">
          NG
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white text-center">Nasi Goreng Premium</h1>
        <p className="text-brand-gold/80 text-xs font-semibold uppercase tracking-widest mt-1.5 mb-8">Tablet POS System</p>

        {localError && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full bg-red-950/40 border border-red-500/50 text-red-200 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-3"
          >
            <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
            <span>{localError}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="w-full space-y-5">
          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Alamat Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type="email" 
                placeholder="Masukkan email..." 
                className="w-full pl-12 pr-4 py-3.5 bg-gray-950/80 border border-gray-800 rounded-xl focus:outline-none focus:border-brand-orange text-white placeholder-gray-600 transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 text-sm font-semibold mb-2">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="Masukkan password..." 
                className="w-full pl-12 pr-12 py-3.5 bg-gray-950/80 border border-gray-800 rounded-xl focus:outline-none focus:border-brand-orange text-white placeholder-gray-600 transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white rounded-xl font-bold text-lg transition-colors shadow-lg hover:shadow-orange-500/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
          >
            {isLoading ? 'Menghubungkan...' : 'Masuk Aplikasi'}
          </button>
        </form>

        {/* Quick Access/Tablet Preset */}
        <div className="w-full mt-10 border-t border-gray-800 pt-6">
          <p className="text-gray-400 text-xs font-semibold text-center uppercase tracking-wider mb-4">Akses Cepat (Tablet Tap)</p>
          <div className="grid grid-cols-4 gap-2">
            {['Admin', 'Kasir', 'Kitchen', 'Owner'].map(role => (
              <button 
                key={role}
                type="button"
                onClick={() => handleQuickLogin(role)}
                className="py-2.5 bg-gray-800/80 hover:bg-gray-800 hover:text-brand-gold text-gray-300 rounded-xl text-xs font-bold border border-gray-700/50 hover:border-brand-gold/30 transition-all"
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
