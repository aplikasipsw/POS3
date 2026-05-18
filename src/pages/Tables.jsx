import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, ArrowRightLeft, UserCheck, Utensils } from 'lucide-react';

const Tables = () => {
  const { tables, fetchTables, updateTableStatus, setActiveTable, isLoading } = useStore();
  const navigate = useNavigate();

  // Modals States
  const [selectedTable, setSelectedTable] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'reserve', 'transfer'
  
  // Reservation form
  const [reserveName, setReserveName] = useState('');
  const [reserveTime, setReserveTime] = useState('19:00');
  const [reservePax, setReservePax] = useState(4);

  // Table transfer
  const [targetTableId, setTargetTableId] = useState('');

  useEffect(() => {
    fetchTables();
  }, []);

  const handleSelectEmptyTable = (table) => {
    setActiveTable(table);
    // tandai meja digunakan
    updateTableStatus({
      id: table.id,
      status: 'used',
      pax: table.pax,
      customerName: `Meja ${table.id} Active`,
      totalBill: 0,
      duration: '0 Menit',
      time: ''
    });
    // Arahkan kasir langsung ke POS page untuk memesan menu!
    navigate('/pos');
  };

  const handleOpenReserve = (table) => {
    setSelectedTable(table);
    setReserveName('');
    setReserveTime('19:00');
    setReservePax(table.pax);
    setActiveModal('reserve');
  };

  const handleOpenTransfer = (table) => {
    setSelectedTable(table);
    setTargetTableId('');
    setActiveModal('transfer');
  };

  const submitReservation = (e) => {
    e.preventDefault();
    if (!selectedTable) return;

    updateTableStatus({
      id: selectedTable.id,
      status: 'reserved',
      pax: Number(reservePax),
      customerName: reserveName,
      time: reserveTime,
      totalBill: 0,
      duration: ''
    });

    setActiveModal(null);
    setSelectedTable(null);
  };

  const submitTransfer = (e) => {
    e.preventDefault();
    if (!selectedTable || !targetTableId) return;

    const targetTable = tables.find(t => String(t.id) === String(targetTableId));
    if (!targetTable) return;

    // 1. Pindahkan info meja saat ini ke meja target
    updateTableStatus({
      id: targetTable.id,
      status: 'used',
      pax: selectedTable.pax,
      customerName: selectedTable.customerName,
      totalBill: selectedTable.totalBill,
      duration: selectedTable.duration,
      time: selectedTable.time
    });

    // 2. Kosongkan meja asal
    updateTableStatus({
      id: selectedTable.id,
      status: 'empty',
      pax: selectedTable.pax,
      customerName: '',
      totalBill: 0,
      duration: '',
      time: ''
    });

    setActiveModal(null);
    setSelectedTable(null);
  };

  const handleClearTable = (table) => {
    if (confirm(`Kosongkan status ${table.name}?`)) {
      updateTableStatus({
        id: table.id,
        status: 'empty',
        pax: table.pax,
        customerName: '',
        totalBill: 0,
        duration: '',
        time: ''
      });
    }
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Manajemen Tata Letak Meja</h1>
          <p className="text-gray-500 mt-1">Pantau meja terisi, reservasi makan di tempat, dan pindahkan pelanggan.</p>
        </div>
        <div className="flex gap-4">
           <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-green-500"></div><span className="text-xs font-bold text-gray-600">Kosong</span></div>
           <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-red-500"></div><span className="text-xs font-bold text-gray-600">Terisi</span></div>
           <div className="flex items-center gap-2"><div className="w-3.5 h-3.5 rounded-full bg-brand-gold"></div><span className="text-xs font-bold text-gray-600">Reservasi</span></div>
        </div>
      </div>

      {isLoading && tables.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-brand-orange font-bold">
          Mengambil tata letak meja outlet...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tables.map((table, i) => (
            <motion.div
              key={table.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className={`relative rounded-3xl p-6 border-2 flex flex-col justify-between min-h-[170px] shadow-sm hover:shadow-md transition-all duration-300
                ${table.status === 'empty' ? 'bg-white border-green-200' : 
                  table.status === 'used' ? 'bg-red-50/40 border-red-200' : 
                  'bg-amber-50/40 border-brand-gold/30'}
              `}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-2xl font-extrabold text-gray-900 leading-tight">{table.name}</h3>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">{table.pax} Kursi</p>
                </div>
                <div className={`w-3 h-3 rounded-full ${
                  table.status === 'empty' ? 'bg-green-500' : table.status === 'used' ? 'bg-red-500' : 'bg-brand-gold'
                }`} />
              </div>
              
              {/* Dynamic status contents */}
              {table.status === 'used' && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-red-600 mb-0.5">Nama: {table.customerName || 'Pelanggan'}</p>
                  <p className="text-[10px] text-gray-500 font-bold">Tagihan: Rp {Number(table.totalBill || 0).toLocaleString('id-ID')}</p>
                </div>
              )}
              {table.status === 'reserved' && (
                <div className="mt-4">
                  <p className="text-xs font-bold text-brand-gold mb-0.5">A.n {table.customerName}</p>
                  <p className="text-[10px] text-gray-500 font-bold">Waktu: Jam {table.time}</p>
                </div>
              )}
              {table.status === 'empty' && (
                <p className="text-xs text-gray-400 mt-4 font-semibold italic">Siap ditempati pelanggan.</p>
              )}

              {/* Tablet Friendly Controls */}
              <div className="flex gap-2 mt-5 pt-3 border-t border-gray-100">
                {table.status === 'empty' ? (
                  <>
                    <button 
                      onClick={() => handleSelectEmptyTable(table)}
                      className="flex-1 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Buka Meja
                    </button>
                    <button 
                      onClick={() => handleOpenReserve(table)}
                      className="px-3 py-2.5 bg-gray-100 hover:bg-gray-250 text-gray-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Booking
                    </button>
                  </>
                ) : (
                  <>
                    <button 
                      onClick={() => handleOpenTransfer(table)}
                      className="flex-1 py-2.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <ArrowRightLeft size={13} />
                      Pindah
                    </button>
                    <button 
                      onClick={() => handleClearTable(table)}
                      className="px-3 py-2.5 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Reset
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* MODAL 1: Table Reservation Form */}
      <AnimatePresence>
        {activeModal === 'reserve' && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <UserCheck className="text-brand-gold" />
                  Reservasi {selectedTable.name}
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white font-extrabold text-lg">✕</button>
              </div>

              <form onSubmit={submitReservation} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Pemesan</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Contoh: Bpk. Budi" 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-bold text-gray-800"
                    value={reserveName}
                    onChange={(e) => setReserveName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Waktu Booking</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Contoh: 19:00" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-bold text-gray-850"
                      value={reserveTime}
                      onChange={(e) => setReserveTime(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1">Kapasitas Orang</label>
                    <input 
                      type="number" 
                      required
                      placeholder="Contoh: 4" 
                      className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-bold text-gray-850"
                      value={reservePax}
                      onChange={(e) => setReservePax(e.target.value)}
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md"
                  >
                    Simpan Reservasi
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Table Transfer / Switch Form */}
      <AnimatePresence>
        {activeModal === 'transfer' && selectedTable && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl"
            >
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <ArrowRightLeft className="text-brand-gold" />
                  Pindahkan {selectedTable.name}
                </h3>
                <button onClick={() => setActiveModal(null)} className="text-gray-400 hover:text-white font-extrabold text-lg">✕</button>
              </div>

              <form onSubmit={submitTransfer} className="p-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-500 font-semibold mb-4 leading-normal">
                    Pindahkan transaksi aktif di <span className="font-extrabold text-gray-950">{selectedTable.name}</span> menuju meja kosong yang tersedia:
                  </p>
                  
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Pilih Meja Target</label>
                  <select 
                    required
                    className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange font-bold text-gray-800 text-sm cursor-pointer"
                    value={targetTableId}
                    onChange={(e) => setTargetTableId(e.target.value)}
                  >
                    <option value="">-- PILIH MEJA KOSONG --</option>
                    {tables.filter(t => t.status === 'empty').map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.pax} Kursi)</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button 
                    type="button" 
                    onClick={() => setActiveModal(null)}
                    className="flex-1 py-3 bg-gray-200 text-gray-800 font-bold rounded-xl hover:bg-gray-300 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit" 
                    disabled={!targetTableId}
                    className="flex-1 py-3 bg-brand-orange text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-md disabled:opacity-50"
                  >
                    Pindahkan Sekarang
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

export default Tables;
