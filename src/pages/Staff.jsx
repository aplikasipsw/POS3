import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Plus, Edit, Trash2, ShieldCheck, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Staff = () => {
  const { staffList, fetchStaffList, saveStaff, deleteStaff, isLoading } = useStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    role: 'Kasir',
    password: '',
    status: 'Aktif'
  });

  useEffect(() => {
    fetchStaffList();
  }, []);

  const openAddModal = () => {
    setEditingStaff(null);
    setFormData({
      id: '',
      name: '',
      email: '',
      role: 'Kasir',
      password: '',
      status: 'Aktif'
    });
    setIsModalOpen(true);
  };

  const openEditModal = (staff) => {
    setEditingStaff(staff);
    setFormData({
      id: staff.id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      password: staff.password,
      status: staff.status || 'Aktif'
    });
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const payload = {
      ...formData,
      id: formData.id || `STF-${new Date().getTime().toString().slice(-4)}`
    };

    saveStaff(payload, () => {
      setIsModalOpen(false);
    });
  };

  const handleDelete = (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus staf ini? Akses login mereka akan langsung dicabut.')) {
      deleteStaff(id);
    }
  };

  const roleColors = {
    Admin: 'bg-brand-dark text-brand-gold',
    Owner: 'bg-amber-100 text-amber-800',
    Kasir: 'bg-orange-100 text-brand-orange',
    Kitchen: 'bg-green-100 text-green-800'
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Manajemen Pegawai</h1>
          <p className="text-gray-500 mt-1">Kelola data login, hak akses (roles), dan sandi staf restoran Anda.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 bg-brand-dark hover:bg-black text-brand-gold font-bold px-6 py-3.5 rounded-xl shadow-lg transition-colors cursor-pointer"
        >
          <Plus size={20} />
          Tambah Pegawai
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-brand-orange font-bold">
          Mengambil data staf dari Google Sheets...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {staffList.map((staff) => (
            <motion.div 
              key={staff.id}
              layout
              className="bg-white rounded-2xl border border-gray-150 p-6 shadow-sm hover:shadow-md transition-shadow relative flex flex-col justify-between"
            >
              <div>
                {/* Header Card */}
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700 font-extrabold text-lg">
                    {staff.name.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${roleColors[staff.role] || 'bg-gray-100 text-gray-700'}`}>
                    {staff.role}
                  </span>
                </div>

                {/* Details */}
                <h3 className="font-bold text-gray-900 text-lg mb-1">{staff.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                  <Mail size={14} />
                  <span className="truncate">{staff.email}</span>
                </div>
                
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Key size={14} />
                  <span>Sandi: ••••••</span>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${
                  staff.status === 'Aktif' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                }`}>
                  {staff.status || 'Aktif'}
                </span>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => openEditModal(staff)}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 hover:border-gray-300 text-gray-600 transition-all cursor-pointer"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    onClick={() => handleDelete(staff.id)}
                    className="p-2.5 rounded-xl border border-red-150 hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
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
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShieldCheck className="text-brand-gold" />
                  {editingStaff ? 'Edit Data Pegawai' : 'Tambah Pegawai Baru'}
                </h2>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white font-extrabold text-lg">✕</button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Masukkan nama pegawai..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="Contoh: kasir@restoran.com" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Kata Sandi Akses</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Masukkan password login..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hak Akses (Role)</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-medium"
                      value={formData.role}
                      onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                    >
                      <option value="Kasir">Kasir</option>
                      <option value="Kitchen">Dapur (Kitchen)</option>
                      <option value="Admin">Admin</option>
                      <option value="Owner">Owner (Pemilik)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Status Pegawai</label>
                    <select 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-medium"
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                    >
                      <option value="Aktif">Aktif</option>
                      <option value="Nonaktif">Nonaktif</option>
                    </select>
                  </div>
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

export default Staff;
