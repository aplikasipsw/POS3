import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { ChefHat, Timer, Check, Flame, Award, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Kitchen = () => {
  const { transactions, fetchTransactions, isLoading } = useStore();
  const [activeOrders, setActiveOrders] = useState([]);
  const prevOrdersCountRef = useRef(0);

  // Play premium synthesized bell sound using Web Audio API
  const playSynthBell = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gain1.gain.setValueAtTime(0.4, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1320, audioCtx.currentTime); // E6 note
      gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.2);
      
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      
      osc1.start();
      osc2.start();
      osc1.stop(audioCtx.currentTime + 0.8);
      osc2.stop(audioCtx.currentTime + 1.2);
    } catch (e) {
      console.warn("Web Audio API not allowed or blocked by user gesture:", e);
    }
  };

  const updateOrdersList = () => {
    // Filter transaksi yang belum berstatus 'Selesai' di dapur
    // Status dapur: 'Pending' (baru masuk), 'Memasak', 'Siap Saji'
    const pendingKitchen = transactions.filter(t => t.status !== 'Selesai');
    setActiveOrders(pendingKitchen);

    // Deteksi order baru untuk memicu suara bel
    if (pendingKitchen.length > prevOrdersCountRef.current) {
      playSynthBell();
    }
    prevOrdersCountRef.current = pendingKitchen.length;
  };

  useEffect(() => {
    fetchTransactions();
    
    // Polling dinamis setiap 10 detik untuk simulasi pesanan real-time dari kasir
    const interval = setInterval(() => {
      fetchTransactions();
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    updateOrdersList();
  }, [transactions]);

  // Update status transaksi di Google Sheets API
  const handleUpdateStatus = async (order, newStatus) => {
    try {
      // mapping payload transaksi lengkap agar terupdate di spreadsheet
      const payload = {
        ...order,
        status: newStatus
      };

      const res = await fetch(useStore.getState().settings.api_url || "https://script.google.com/macros/s/AKfycbyU1l4Oa5hKnYv61MivYYvqpxK5jfVufsNIiWtPU5njzTF1TDIGtV-96A-lHa1aDDwdng/exec", {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTransaction', payload })
      });
      const json = await res.json();
      
      if (json.status === 'success') {
        // Refresh local data
        fetchTransactions();
      }
    } catch (e) {
      console.error("Gagal memperbarui status dapur:", e);
    }
  };

  return (
    <div className="p-6 md:p-8 h-full bg-brand-dark text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            <ChefHat className="text-brand-orange animate-bounce" />
            Kitchen Display System (KDS)
          </h1>
          <p className="text-gray-400 mt-1">Daftar antrean masak koki. Diperbarui otomatis secara real-time.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={playSynthBell}
            className="p-3 bg-gray-900 border border-gray-800 hover:border-brand-orange text-brand-orange rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all text-xs font-bold uppercase tracking-wider"
          >
            <BellRing size={16} />
            Tes Bel Dapur
          </button>
          
          <div className="px-5 py-3 bg-gray-900 border border-gray-800 text-brand-gold text-sm font-extrabold rounded-2xl flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-ping" />
            {activeOrders.length} Antrean Masak
          </div>
        </div>
      </div>

      {/* Columns */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden flex gap-6 pb-4">
        
        {/* COLUMN 1: PENDING (Antrean Baru) */}
        <div className="w-80 md:w-96 flex flex-col h-full bg-gray-950/40 border border-gray-800 rounded-3xl p-5 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-orange-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Baru Diterima
            </h3>
            <span className="bg-orange-500/10 text-orange-400 font-extrabold text-xs px-2.5 py-1 rounded-full">
              {activeOrders.filter(o => o.status === 'Pending').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {activeOrders.filter(o => o.status === 'Pending').map((order) => (
                <motion.div
                  key={order.orderId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-900 border border-gray-850 p-4.5 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{order.orderId}</h4>
                      <p className="text-[10px] text-brand-gold font-bold uppercase mt-0.5">Meja: {order.table}</p>
                    </div>
                    <span className="text-[9px] font-bold text-gray-500 flex items-center gap-1">
                      <Timer size={12} />
                      Baru Masuk
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-medium whitespace-pre-line leading-relaxed bg-black/40 p-3 rounded-xl border border-gray-800 font-mono">
                    {order.items}
                  </p>

                  <button 
                    onClick={() => handleUpdateStatus(order, 'Memasak')}
                    className="w-full py-3 bg-brand-orange hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Flame size={14} />
                    Masak Sekarang
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 2: MEMASAK (Sedang Dimasak) */}
        <div className="w-80 md:w-96 flex flex-col h-full bg-gray-950/40 border border-gray-800 rounded-3xl p-5 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-amber-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
              Sedang Dimasak
            </h3>
            <span className="bg-amber-500/10 text-amber-500 font-extrabold text-xs px-2.5 py-1 rounded-full">
              {activeOrders.filter(o => o.status === 'Memasak').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {activeOrders.filter(o => o.status === 'Memasak').map((order) => (
                <motion.div
                  key={order.orderId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-900 border border-gray-800 p-4.5 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{order.orderId}</h4>
                      <p className="text-[10px] text-brand-gold font-bold uppercase mt-0.5">Meja: {order.table}</p>
                    </div>
                    <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1 animate-pulse">
                      <Flame size={12} />
                      Dimasak
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-medium whitespace-pre-line leading-relaxed bg-black/40 p-3 rounded-xl border border-gray-850 font-mono">
                    {order.items}
                  </p>

                  <button 
                    onClick={() => handleUpdateStatus(order, 'Siap Saji')}
                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    <Check size={14} />
                    Selesai Masak
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* COLUMN 3: READY (Siap Sajikan / Ambil) */}
        <div className="w-80 md:w-96 flex flex-col h-full bg-gray-950/40 border border-gray-800 rounded-3xl p-5 flex-shrink-0">
          <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-800">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-green-400 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              Siap Saji (Ambil)
            </h3>
            <span className="bg-green-500/10 text-green-400 font-extrabold text-xs px-2.5 py-1 rounded-full">
              {activeOrders.filter(o => o.status === 'Siap Saji').length}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
            <AnimatePresence>
              {activeOrders.filter(o => o.status === 'Siap Saji').map((order) => (
                <motion.div
                  key={order.orderId}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-gray-900 border border-gray-800 p-4.5 rounded-2xl space-y-3"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{order.orderId}</h4>
                      <p className="text-[10px] text-brand-gold font-bold uppercase mt-0.5">Meja: {order.table}</p>
                    </div>
                    <span className="text-[9px] font-bold text-green-400 flex items-center gap-1">
                      <Award size={12} />
                      Siap Saji
                    </span>
                  </div>

                  <p className="text-xs text-gray-300 font-medium whitespace-pre-line leading-relaxed bg-black/40 p-3 rounded-xl border border-gray-850 font-mono">
                    {order.items}
                  </p>

                  <button 
                    onClick={() => handleUpdateStatus(order, 'Selesai')}
                    className="w-full py-3 bg-brand-dark hover:bg-black text-brand-gold font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all border border-brand-gold/30 flex items-center justify-center gap-1.5 cursor-pointer shadow"
                  >
                    Sudah Diambil
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Kitchen;
