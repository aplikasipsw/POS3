import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { FileDown, Calendar, Search, ArrowUpRight, DollarSign, ShoppingBag, BarChart3, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

const Reports = () => {
  const { transactions, fetchTransactions, isLoading } = useStore();
  const [filterRange, setFilterRange] = useState('7'); // '1' (Hari Ini), '7' (7 Hari), '30' (30 Hari), 'all' (Semua)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchTransactions();
  }, []);

  // Filter transactions
  const getFilteredTransactions = () => {
    let now = new Date();
    return transactions.filter(t => {
      const tDate = new Date(t.timestamp);
      
      // Filter Tanggal
      if (filterRange === '1') {
        const isToday = tDate.toDateString() === now.toDateString();
        if (!isToday) return false;
      } else if (filterRange === '7') {
        const diffTime = Math.abs(now - tDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 7) return false;
      } else if (filterRange === '30') {
        const diffTime = Math.abs(now - tDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 30) return false;
      }

      // Filter Search
      const matchSearch = t.orderId.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          t.items.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (t.table && t.table.toLowerCase().includes(searchQuery.toLowerCase()));
      
      return matchSearch;
    });
  };

  const filteredData = getFilteredTransactions();

  // Metrics calculations
  const totalRevenue = filteredData.reduce((acc, t) => acc + (Number(t.total) || 0), 0);
  const totalOrders = filteredData.length;
  // Laba bersih estimasi 60% dari penjualan setelah dipotong bahan
  const netProfit = totalRevenue * 0.6;
  const avgTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Chart data extraction (7 Days grouping)
  const getChartData = () => {
    const days = ['Ming', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const chartMap = {};
    
    // Inisialisasi 7 hari terakhir
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartMap[days[d.getDay()]] = 0;
    }

    filteredData.forEach(t => {
      const d = new Date(t.timestamp);
      const dayName = days[d.getDay()];
      if (chartMap[dayName] !== undefined) {
        chartMap[dayName] += Number(t.total) || 0;
      }
    });

    return Object.keys(chartMap).map(day => ({
      label: day,
      value: chartMap[day]
    }));
  };

  const chartData = getChartData();
  const maxVal = Math.max(...chartData.map(d => d.value), 1);

  // CSV Exporter
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      alert("Tidak ada data untuk diekspor.");
      return;
    }

    const headers = ["Tanggal", "Order ID", "Meja", "Detail Pesanan", "Subtotal", "Pajak", "Diskon", "Total", "Metode Pembayaran", "Status"];
    const rows = filteredData.map(t => [
      new Date(t.timestamp).toLocaleString('id-ID'),
      t.orderId,
      t.table || '-',
      t.items.replace(/\n/g, '; '),
      t.subtotal,
      t.tax,
      t.discount || 0,
      t.total,
      t.paymentMethod,
      t.status
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_POS_NasiGoreng_${filterRange}hari.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 md:p-8 h-full overflow-y-auto bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-500 mt-1">Lacak pendapatan, laba rugi, dan performa transaksi real-time.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="p-3 bg-white border border-gray-200 rounded-xl text-sm font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
            value={filterRange}
            onChange={(e) => setFilterRange(e.target.value)}
          >
            <option value="1">Hari Ini</option>
            <option value="7">7 Hari Terakhir</option>
            <option value="30">30 Hari Terakhir</option>
            <option value="all">Semua Waktu</option>
          </select>
          <button 
            onClick={handleExportCSV}
            className="flex items-center gap-2 bg-brand-dark hover:bg-black text-brand-gold font-bold px-5 py-3 rounded-xl shadow-md transition-colors cursor-pointer text-sm"
          >
            <FileDown size={18} />
            Ekspor CSV
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-green-50 text-green-600">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Pendapatan Kotor</p>
            <h3 className="text-xl font-extrabold text-gray-900">Rp {totalRevenue.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-orange-50 text-brand-orange">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Total Transaksi</p>
            <h3 className="text-xl font-extrabold text-gray-900">{totalOrders} Pesanan</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Laba Bersih (60%)</p>
            <h3 className="text-xl font-extrabold text-gray-900">Rp {netProfit.toLocaleString('id-ID')}</h3>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex items-center gap-4">
          <div className="p-3.5 rounded-xl bg-blue-50 text-blue-600">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Rata-rata Struk</p>
            <h3 className="text-xl font-extrabold text-gray-900">Rp {Math.round(avgTicket).toLocaleString('id-ID')}</h3>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Sales Trend Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Tren Pendapatan Mingguan</h2>
            <p className="text-gray-400 text-xs font-semibold mb-6">Grafik tren penjualan 7 hari terakhir.</p>
          </div>
          <div className="h-64 flex items-end gap-3 px-2">
            {chartData.map((d, i) => {
              const pct = (d.value / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="text-[10px] text-brand-orange font-bold mb-2">
                    {d.value > 0 ? `Rp ${Math.round(d.value / 1000)}k` : '-'}
                  </div>
                  <div className="w-full bg-gray-50 rounded-t-xl h-48 relative overflow-hidden">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="absolute bottom-0 w-full bg-gradient-to-t from-brand-orange to-brand-gold rounded-t-xl"
                    />
                  </div>
                  <span className="text-xs text-gray-500 font-bold mt-3 uppercase tracking-wider">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Payment Methods Ratio & Top Category */}
        <div className="bg-white rounded-2xl p-6 border border-gray-150 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Metode Pembayaran Terlaris</h2>
            <p className="text-gray-400 text-xs font-semibold mb-6">Distribusi transaksi kasir.</p>
          </div>
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {['Tunai', 'QRIS', 'E-Wallet', 'Kartu'].map(method => {
              const count = filteredData.filter(t => t.paymentMethod === method).length;
              const pct = totalOrders > 0 ? Math.round((count / totalOrders) * 100) : 0;
              return (
                <div key={method}>
                  <div className="flex justify-between text-sm font-semibold mb-1">
                    <span className="text-gray-700">{method}</span>
                    <span className="text-gray-900">{count}x ({pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-brand-dark h-full rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Table */}
      <div className="bg-white rounded-2xl border border-gray-150 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Riwayat Transaksi Masuk</h2>
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Order ID, meja, menu..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-orange"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-20 text-center text-brand-orange font-bold">
            Memperbarui riwayat transaksi...
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-20 text-center text-gray-400">
            Tidak ada transaksi yang cocok ditemukan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-55/60 text-gray-400 uppercase font-bold text-[10px] tracking-widest border-b border-gray-100">
                <tr>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Lokasi/Meja</th>
                  <th className="p-4">Item Porsi</th>
                  <th className="p-4 text-right">Total Bayar</th>
                  <th className="p-4">Metode</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredData.map((t) => (
                  <tr key={t.orderId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 font-medium">
                      {new Date(t.timestamp).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 font-bold text-gray-900">{t.orderId}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold ${
                        t.table === 'Take Away' ? 'bg-orange-50 text-brand-orange' : 'bg-brand-dark/5 text-gray-700'
                      }`}>
                        {t.table}
                      </span>
                    </td>
                    <td className="p-4 text-gray-700 whitespace-pre-line font-medium leading-relaxed">
                      {t.items}
                    </td>
                    <td className="p-4 text-right font-extrabold text-gray-950">
                      Rp {Number(t.total).toLocaleString('id-ID')}
                    </td>
                    <td className="p-4 font-bold text-gray-600">{t.paymentMethod}</td>
                    <td className="p-4">
                      <span className="bg-green-50 text-green-600 text-[10px] uppercase font-extrabold px-2 py-1 rounded-full">
                        {t.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
