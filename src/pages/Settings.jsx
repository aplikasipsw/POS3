import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Settings as SettingsIcon, ShieldAlert, CheckCircle, Smartphone, Printer, FileText, Languages, Palette, Edit } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Settings = () => {
  const { settings, fetchSettings, saveSettings, inventory, fetchInventory, saveInventory, isLoading } = useStore();
  const [activeTab, setActiveTab] = useState('general'); // 'general', 'inventory'
  const [successMsg, setSuccessMsg] = useState('');
  
  // App Settings States
  const [appSettings, setAppSettings] = useState({
    restaurant_name: '',
    address: '',
    phone: '',
    tax_rate: '',
    service_rate: '',
    qris_url: '',
    theme: 'dark',
    language: 'id'
  });

  // Editing Stock States
  const [editingStockItem, setEditingStockItem] = useState(null);
  const [newStockVal, setNewStockVal] = useState('');

  useEffect(() => {
    fetchSettings();
    fetchInventory();
  }, []);

  useEffect(() => {
    if (settings) {
      setAppSettings({
        restaurant_name: settings.restaurant_name || '',
        address: settings.address || '',
        phone: settings.phone || '',
        tax_rate: settings.tax_rate || '11',
        service_rate: settings.service_rate || '5',
        qris_url: settings.qris_url || '',
        theme: settings.theme || 'dark',
        language: settings.language || 'id'
      });
    }
  }, [settings]);

  const handleSaveGeneral = (e) => {
    e.preventDefault();
    saveSettings(appSettings, () => {
      setSuccessMsg('Pengaturan restoran berhasil diperbarui!');
      setTimeout(() => setSuccessMsg(''), 3000);
    });
  };

  const handleUpdateStock = (e) => {
    e.preventDefault();
    if (!editingStockItem) return;

    const payload = {
      ...editingStockItem,
      stock: Number(newStockVal)
    };

    saveInventory(payload, () => {
      setEditingStockItem(null);
      setSuccessMsg(`Stok ${payload.name} berhasil diperbarui menjadi ${payload.stock} ${payload.unit}`);
      setTimeout(() => setSuccessMsg(''), 3000);
    });
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pengaturan & Inventaris</h1>
          <p className="text-gray-500 mt-1">Konfigurasi outlet, printer struk thermal, pajak, dan monitor bahan baku.</p>
        </div>
      </div>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 text-green-700 px-5 py-4 rounded-xl mb-6 font-semibold flex items-center gap-3 shadow-sm"
        >
          <CheckCircle size={22} className="text-green-500 flex-shrink-0" />
          <span>{successMsg}</span>
        </motion.div>
      )}

      {/* Tabs Menu */}
      <div className="flex gap-2 border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('general')}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'general' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Konfigurasi Restoran
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-4 px-6 font-bold text-sm transition-all border-b-2 ${
            activeTab === 'inventory' 
              ? 'border-brand-orange text-brand-orange' 
              : 'border-transparent text-gray-400 hover:text-gray-700'
          }`}
        >
          Monitoring Bahan Baku (Stok)
        </button>
      </div>

      {/* GENERAL CONFIGURATION TAB */}
      {activeTab === 'general' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-gray-150 shadow-sm max-w-4xl">
          <form onSubmit={handleSaveGeneral} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <FileText size={18} className="text-gray-400" />
                  Nama Restoran
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: Nasi Goreng Premium" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={appSettings.restaurant_name}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, restaurant_name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Smartphone size={18} className="text-gray-400" />
                  Nomor Kontak
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Contoh: 0812-3456-7890" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={appSettings.phone}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">Alamat Lengkap</label>
                <textarea 
                  required
                  placeholder="Masukkan alamat fisik restoran..." 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange h-20"
                  value={appSettings.address}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Pajak (PPN %)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Default: 11" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={appSettings.tax_rate}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, tax_rate: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Service Charge (%)</label>
                <input 
                  type="number" 
                  required
                  placeholder="Default: 5" 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange"
                  value={appSettings.service_rate}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, service_rate: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-bold text-gray-700 mb-2">URL Barcode QRIS Pembayaran</label>
                <input 
                  type="text" 
                  required
                  placeholder="Masukkan link gambar QRIS..." 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange text-sm"
                  value={appSettings.qris_url}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, qris_url: e.target.value }))}
                />
                <p className="text-[10px] text-gray-400 font-medium mt-1">Gunakan link gambar barcode QRIS yang di-generate dari bank/fintech partner Anda.</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Palette size={18} className="text-gray-400" />
                  Tema Aplikasi
                </label>
                <select 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange font-semibold"
                  value={appSettings.theme}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, theme: e.target.value }))}
                >
                  <option value="dark">Dark Mode (Premium Hitam Emas)</option>
                  <option value="light">Light Mode (Clean Putih Orange)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                  <Languages size={18} className="text-gray-400" />
                  Bahasa Default
                </label>
                <select 
                  className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange font-semibold"
                  value={appSettings.language}
                  onChange={(e) => setAppSettings(prev => ({ ...prev, language: e.target.value }))}
                >
                  <option value="id">Bahasa Indonesia (ID)</option>
                  <option value="en">English (US)</option>
                </select>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-150 flex justify-end">
              <button 
                type="submit" 
                disabled={isLoading}
                className="bg-brand-dark hover:bg-black text-brand-gold font-extrabold px-8 py-4 rounded-xl shadow-lg transition-colors cursor-pointer"
              >
                {isLoading ? 'Menyimpan...' : 'Simpan Pengaturan Restoran'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MONITORING INVENTORY & BAKU TAB */}
      {activeTab === 'inventory' && (
        <div className="space-y-6 max-w-5xl">
          <div className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 mb-1">Status Bahan Baku Saat Ini</h2>
            <p className="text-gray-400 text-xs font-semibold mb-6">Secara otomatis berkurang setiap transaksi piring nasi/mie goreng dicatat oleh kasir.</p>
            
            {isLoading ? (
              <div className="py-10 text-center font-bold text-brand-orange">Mengambil stok inventaris...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {inventory.map((item) => {
                  const isLow = Number(item.stock) <= Number(item.minStock);
                  const pct = Math.min((Number(item.stock) / (Number(item.minStock) * 5)) * 100, 100);
                  
                  return (
                    <div 
                      key={item.id}
                      className={`p-5 rounded-2xl border-2 flex flex-col justify-between ${
                        isLow ? 'bg-red-50/40 border-red-200' : 'bg-gray-50/30 border-gray-150'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-extrabold text-gray-900 text-lg">{item.name}</h3>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">ID: {item.id}</p>
                        </div>
                        {isLow ? (
                          <span className="bg-red-500 text-white text-[10px] font-extrabold px-3 py-1 rounded-full flex items-center gap-1.5 uppercase animate-pulse">
                            <ShieldAlert size={12} />
                            Stok Menipis
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase">
                            Stok Aman
                          </span>
                        )}
                      </div>

                      {/* Stock Bar */}
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm font-bold">
                          <span className="text-gray-500">Stok: {item.stock} {item.unit}</span>
                          <span className="text-gray-400">Min. {item.minStock} {item.unit}</span>
                        </div>
                        <div className="w-full bg-gray-200 h-2.5 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                              isLow ? 'bg-red-500' : 'bg-brand-orange'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>

                      {/* Quick Edit */}
                      <div className="flex justify-end pt-3 border-t border-gray-100/50">
                        <button 
                          onClick={() => {
                            setEditingStockItem(item);
                            setNewStockVal(item.stock);
                          }}
                          className="text-xs font-bold text-brand-dark hover:text-brand-orange flex items-center gap-1 cursor-pointer"
                        >
                          <Edit size={14} />
                          Sesuaikan Stok
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      <AnimatePresence>
        {editingStockItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold">Sesuaikan Bahan</h2>
                <button onClick={() => setEditingStockItem(null)} className="text-gray-400 hover:text-white font-extrabold text-lg">✕</button>
              </div>

              <form onSubmit={handleUpdateStock} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold mb-3">Mengatur sisa ketersediaan bahan baku:</p>
                  <h3 className="font-extrabold text-gray-900 text-lg mb-1">{editingStockItem.name}</h3>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-4">Unit Satuan: {editingStockItem.unit}</p>
                  
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Jumlah Stok Baru</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      placeholder="Masukkan angka stok..." 
                      className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange font-bold text-lg"
                      value={newStockVal}
                      onChange={(e) => setNewStockVal(e.target.value)}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-400">{editingStockItem.unit}</span>
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setEditingStockItem(null)}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Settings;
