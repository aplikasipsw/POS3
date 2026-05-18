import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Edit, Trash2, Search, PackageCheck, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const MenuManagement = () => {
  const { menu, fetchMenu, saveMenu, deleteMenu, isLoading } = useStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    category: 'Nasi Goreng',
    price: '',
    image: '',
    stock: '',
    description: '',
    status: 'Aktif'
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const categories = ['Semua', 'Nasi Goreng', 'Mie Goreng', 'Minuman', 'Snack', 'Paket Hemat'];

  const filteredMenu = menu.filter(item => {
    const matchCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const openAddModal = () => {
    setEditingItem(null);
    setFormData({
      id: '',
      name: '',
      category: 'Nasi Goreng',
      price: '',
      image: '',
      stock: '50',
      description: '',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      id: item.id,
      name: item.name,
      category: item.category,
      price: item.price,
      image: item.image,
      stock: item.stock,
      description: item.description || '',
      status: item.status || 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      id: formData.id || new Date().getTime().toString(),
      price: Number(formData.price),
      stock: Number(formData.stock),
      // Auto set status Habis if stock is 0
      status: Number(formData.stock) === 0 ? 'Habis' : formData.status
    };

    saveMenu(payload, () => {
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus menu ini dari database?')) {
      deleteMenu(id);
    }
  };

  // Helper local image upload converter (Base64)
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-3">
            Manajemen Menu
          </h1>
          <p className="text-gray-500 mt-1">Atur menu, harga, ketersediaan, dan paket bundling.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-brand-dark hover:bg-black text-brand-gold font-bold px-6 py-3.5 rounded-xl shadow-lg transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Tambah Menu Baru
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Cari nama menu..." 
            className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4.5 py-2.5 rounded-xl whitespace-nowrap font-semibold text-sm transition-all ${
                activeCategory === cat 
                  ? 'bg-brand-dark text-brand-gold shadow-md' 
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Menu */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-brand-orange font-bold">
          Memuat data menu dari Google Sheets...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMenu.map(item => (
            <motion.div 
              key={item.id}
              layout
              className="bg-white rounded-2xl overflow-hidden border border-gray-150 shadow-sm flex flex-col hover:shadow-lg transition-shadow relative"
            >
              {/* Image & Badges */}
              <div className="h-44 w-full bg-gray-100 relative">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400 text-sm">
                    No Photo
                  </div>
                )}
                {/* Category Badge */}
                <span className="absolute top-3 left-3 bg-black/70 text-brand-gold text-xs font-bold px-3 py-1.5 rounded-full uppercase tracking-wider">
                  {item.category}
                </span>

                {/* Out of Stock Warning */}
                {(Number(item.stock) === 0 || item.status === 'Habis') ? (
                  <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-white">
                    <AlertTriangle size={32} className="text-brand-orange mb-1" />
                    <span className="font-extrabold text-sm tracking-wide uppercase">Menu Habis</span>
                  </div>
                ) : Number(item.stock) <= 10 ? (
                  <span className="absolute top-3 right-3 bg-red-500 text-white text-xs font-extrabold px-2.5 py-1 rounded-full flex items-center gap-1">
                    Sisa {item.stock}
                  </span>
                ) : null}
              </div>

              {/* Detail Menu */}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-950 text-lg leading-tight mb-2">{item.name}</h3>
                <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{item.description || 'Tidak ada deskripsi.'}</p>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-100">
                  <span className="font-extrabold text-xl text-gray-900">
                    Rp {Number(item.price).toLocaleString('id-ID')}
                  </span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(item)}
                      className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all cursor-pointer"
                    >
                      <Edit size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2.5 rounded-xl border border-red-150 hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Add/Edit */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PackageCheck className="text-brand-gold" />
                  {editingItem ? 'Edit Menu Nasi Goreng' : 'Tambah Menu Baru'}
                </h2>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-white font-extrabold text-lg"
                >
                  ✕
                </button>
              </div>

              {/* Modal Form body */}
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-4 flex-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Menu</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: Nasi Goreng Gila Level 5" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kategori</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    >
                      <option value="Nasi Goreng">Nasi Goreng</option>
                      <option value="Mie Goreng">Mie Goreng</option>
                      <option value="Minuman">Minuman</option>
                      <option value="Snack">Snack</option>
                      <option value="Paket Hemat">Paket Hemat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Harga Jual (Rp)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Contoh: 25000" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Stok Porsi</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Contoh: 50" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                      value={formData.stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Keaktifan</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Aktif">Aktif (Tersedia)</option>
                      <option value="Habis">Habis (Nonaktif otomatis)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Foto Menu</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="text" 
                      placeholder="URL Gambar Online..." 
                      className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm"
                      value={formData.image}
                      onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                    />
                    <label className="cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-800 text-xs font-bold px-4 py-3 rounded-xl transition-all">
                      Upload File
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden"
                        onChange={handleImageUpload}
                      />
                    </label>
                  </div>
                  {formData.image && (
                    <img 
                      src={formData.image} 
                      alt="Preview" 
                      className="w-32 h-20 object-cover mt-3 rounded-lg border" 
                    />
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deskripsi Menu</label>
                  <textarea 
                    placeholder="Tulis deskripsi atau isi paket bundling disini..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange h-20 text-sm"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                  >
                    Simpan Perubahan
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

export default MenuManagement;
