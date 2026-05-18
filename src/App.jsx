import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import POS from './pages/POS';
import Tables from './pages/Tables';
import Kitchen from './pages/Kitchen';
import MenuManagement from './pages/MenuManagement';
import Reports from './pages/Reports';
import Staff from './pages/Staff';
import Settings from './pages/Settings';
import Login from './pages/Login';

function App() {
  const { user, fetchAllData, isLoading } = useStore();

  useEffect(() => {
    if (user) {
      // Ambil seluruh data dari Google Sheets API secara terpusat pada startup
      fetchAllData();
    }
  }, [user]);

  // 1. Gating Auth: Jika belum login, tampilkan halaman Login
  if (!user) {
    return <Login />;
  }

  // 2. Helper untuk Role Permission Route Guarding
  const isAllowed = (allowedRoles) => {
    return allowedRoles.includes(user.role);
  };

  // Helper untuk menentukan halaman default (landing page) berdasarkan role
  const getDefaultRedirect = () => {
    if (user.role === 'Kitchen') return '/kitchen';
    if (user.role === 'Kasir') return '/pos';
    return '/'; // Admin & Owner
  };

  return (
    <div className="flex h-screen w-full bg-gray-50 overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto">
        <Routes>
          {/* Dashboard (Admin & Owner) */}
          <Route 
            path="/" 
            element={isAllowed(['Admin', 'Owner']) ? <Dashboard /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* POS Kasir (Admin & Kasir) */}
          <Route 
            path="/pos" 
            element={isAllowed(['Admin', 'Kasir']) ? <POS /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* Manajemen Meja (Admin & Kasir) */}
          <Route 
            path="/tables" 
            element={isAllowed(['Admin', 'Kasir']) ? <Tables /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* Kitchen Display (Admin & Kitchen) */}
          <Route 
            path="/kitchen" 
            element={isAllowed(['Admin', 'Kitchen']) ? <Kitchen /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* CRUD Manajemen Menu (Hanya Admin) */}
          <Route 
            path="/menu" 
            element={isAllowed(['Admin']) ? <MenuManagement /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* Riwayat & Laporan (Admin & Owner) */}
          <Route 
            path="/reports" 
            element={isAllowed(['Admin', 'Owner']) ? <Reports /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* CRUD Pegawai / Staff (Hanya Admin) */}
          <Route 
            path="/staff" 
            element={isAllowed(['Admin']) ? <Staff /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* Pengaturan Restoran (Admin & Owner) */}
          <Route 
            path="/settings" 
            element={isAllowed(['Admin', 'Owner']) ? <Settings /> : <Navigate to={getDefaultRedirect()} />} 
          />

          {/* Fallback redirect */}
          <Route path="*" element={<Navigate to={getDefaultRedirect()} />} />
        </Routes>
      </main>

      {/* Global loading spinner overlay */}
      {isLoading && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-dark/95 border border-brand-gold/30 text-white font-semibold text-xs tracking-wider uppercase px-4 py-3 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-sm animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-gold animate-ping" />
          <span>Menyinkronkan Google Sheets...</span>
        </div>
      )}
    </div>
  );
}

export default App;
