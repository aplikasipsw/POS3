import React, { useEffect } from 'react';
import { useStore } from '../store';
import { TrendingUp, Users, ShoppingBag, DollarSign, Utensils, ShieldAlert, Award } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, delay }) => (
  <motion.div 
    initial={{ opacity: 0, y: 15 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow"
  >
    <div className={`p-4 rounded-2xl ${color} text-white`}>
      {icon}
    </div>
    <div>
      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-extrabold text-gray-900">{value}</h3>
    </div>
  </motion.div>
);

const Dashboard = () => {
  const { transactions, tables, menu, inventory, fetchAllData, isLoading } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    fetchAllData();
  }, []);

  // 1. Perhitungan Metrics Dinamis
  const getTodayStats = () => {
    const todayStr = new Date().toDateString();
    const todayTransactions = transactions.filter(t => new Date(t.timestamp).toDateString() === todayStr);
    
    const revenue = todayTransactions.reduce((sum, t) => sum + (Number(t.total) || 0), 0);
    const ordersCount = todayTransactions.length;
    
    const usedTables = tables.filter(tbl => tbl.status === 'used').length;
    const lowStockCount = inventory.filter(item => Number(item.stock) <= Number(item.minStock)).length;

    return { revenue, ordersCount, usedTables, lowStockCount };
  };

  const stats = getTodayStats();

  // 2. Menu Terlaris dinamis dari transaksi
  const getTopSellingMenu = () => {
    const counts = {};
    transactions.forEach(t => {
      try {
        // parsing rawItemsJson jika ada
        const items = t.rawItemsJson ? JSON.parse(t.rawItemsJson) : [];
        items.forEach(item => {
          counts[item.name] = (counts[item.name] || 0) + item.qty;
        });
      } catch (e) {
        // fallback parsing text ringkas items jika JSON error
        const itemsList = t.items.split('\n');
        itemsList.forEach(line => {
          const match = line.match(/^(.+) \((\d+)x\)/);
          if (match) {
            counts[match[1]] = (counts[match[1]] || 0) + parseInt(match[2]);
          }
        });
      }
    });

    return Object.keys(counts)
      .map(name => {
        const menuItem = menu.find(m => m.name === name) || {};
        return {
          name,
          qty: counts[name],
          price: menuItem.price ? `Rp ${Number(menuItem.price).toLocaleString('id-ID')}` : '-'
        };
      })
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 3);
  };

  const topSelling = getTopSellingMenu();

  // 3. Data Chart 7 Hari Terakhir
  const getChartHeight = () => {
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const chartMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      chartMap[days[d.getDay()]] = 0;
    }

    transactions.forEach(t => {
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

  const weeklyTrend = getChartHeight();
  const maxWeekly = Math.max(...weeklyTrend.map(d => d.value), 1);

  return (
    <div className="p-6 md:p-8 w-full h-full bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Dashboard Ringkasan</h1>
          <p className="text-gray-500 mt-1">Status operasional Nasi Goreng Premium hari ini.</p>
        </div>
        <div className="px-5 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm text-sm font-bold text-gray-800 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-brand-orange animate-pulse" />
          {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Omzet Hari Ini" value={`Rp ${stats.revenue.toLocaleString('id-ID')}`} icon={<DollarSign size={24} />} color="bg-brand-dark" delay={0.05} />
        <StatCard title="Pesanan Hari Ini" value={`${stats.ordersCount} Nota`} icon={<ShoppingBag size={24} />} color="bg-brand-orange" delay={0.1} />
        <StatCard title="Meja Aktif Terisi" value={`${stats.usedTables} Meja`} icon={<Utensils size={24} />} color="bg-brand-gold" delay={0.15} />
        <StatCard title="Bahan Baku Menipis" value={`${stats.lowStockCount} Item`} icon={<ShieldAlert size={24} />} color="bg-red-500" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Weekly sales SVG area chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.25 }}
          className="lg:col-span-2 bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h2 className="text-lg font-bold text-gray-900">Performa Omzet Penjualan</h2>
            <p className="text-gray-400 text-xs font-semibold mb-6">Visualisasi total transaksi seminggu terakhir.</p>
          </div>
          
          <div className="h-60 flex items-end gap-3 px-2">
            {weeklyTrend.map((d, i) => {
              const pct = (d.value / maxWeekly) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center h-full justify-end">
                  <div className="text-[9px] text-brand-orange font-bold mb-2">
                    {d.value > 0 ? `Rp ${Math.round(d.value / 1000)}k` : '-'}
                  </div>
                  <div className="w-full bg-gray-50 rounded-t-xl h-44 relative overflow-hidden group">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height: `${pct}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="absolute bottom-0 w-full bg-gradient-to-t from-brand-orange to-brand-gold rounded-t-xl group-hover:from-black group-hover:to-brand-dark transition-all duration-300"
                    />
                  </div>
                  <span className="text-xs text-gray-400 font-bold mt-3 uppercase tracking-wider">{d.label}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Top items & Stock Criticals */}
        <div className="flex flex-col gap-6">
          {/* Top selling card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm"
          >
            <h2 className="text-lg font-bold text-gray-900 mb-1 flex items-center gap-2">
              <Award className="text-brand-gold" />
              Menu Terlaris
            </h2>
            <p className="text-gray-400 text-xs font-semibold mb-4">Porsi piring tersaji.</p>
            <div className="space-y-3">
              {topSelling.length === 0 ? (
                <p className="text-xs text-gray-400 py-6 text-center">Belum ada menu terjual.</p>
              ) : (
                topSelling.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-gold/15 text-brand-dark flex items-center justify-center font-extrabold text-sm">
                        #{i + 1}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm leading-snug">{item.name}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{item.qty} terjual</p>
                      </div>
                    </div>
                    <div className="font-extrabold text-brand-orange text-sm">{item.price}</div>
                  </div>
                ))
              )}
            </div>
          </motion.div>

          {/* Low Stock alert notification card */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white rounded-3xl p-6 border border-gray-150 shadow-sm flex-1 flex flex-col justify-between"
          >
            <div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Alert Bahan Baku</h2>
              <p className="text-gray-400 text-xs font-semibold mb-4">Bahan dapur kritis yang menipis.</p>
            </div>
            
            <div className="space-y-3">
              {inventory.filter(item => Number(item.stock) <= Number(item.minStock)).slice(0, 2).map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100 rounded-xl text-red-800 text-xs">
                  <span className="font-bold">{item.name}</span>
                  <span className="font-extrabold bg-red-100 px-2.5 py-1 rounded-md">
                    Sisa {item.stock} {item.unit}
                  </span>
                </div>
              ))}
              {inventory.filter(item => Number(item.stock) <= Number(item.minStock)).length === 0 && (
                <div className="p-4 bg-green-50/50 border border-green-100 text-green-700 rounded-xl text-xs text-center font-bold">
                  ✓ Semua bahan baku aman terkendali.
                </div>
              )}
            </div>

            <button 
              onClick={() => navigate('/settings')}
              className="w-full mt-4 py-3 bg-brand-dark hover:bg-black text-brand-gold font-bold text-xs uppercase tracking-wider rounded-xl transition-colors cursor-pointer text-center"
            >
              Lihat Detail Inventaris
            </button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
