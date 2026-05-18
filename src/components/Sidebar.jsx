import React from 'react';
import { NavLink } from 'react-router-dom';
import { useStore } from '../store';
import { 
  LayoutDashboard, ShoppingCart, UtensilsCrossed, ChefHat, 
  FileText, Settings, Users, LogOut, Coffee 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useStore();

  const allItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={22} />, path: '/', roles: ['Admin', 'Owner'] },
    { name: 'POS Kasir', icon: <ShoppingCart size={22} />, path: '/pos', roles: ['Admin', 'Kasir'] },
    { name: 'Meja', icon: <UtensilsCrossed size={22} />, path: '/tables', roles: ['Admin', 'Kasir'] },
    { name: 'Dapur (KDS)', icon: <ChefHat size={22} />, path: '/kitchen', roles: ['Admin', 'Kitchen'] },
    { name: 'Manajemen Menu', icon: <Coffee size={22} />, path: '/menu', roles: ['Admin'] },
    { name: 'Laporan', icon: <FileText size={22} />, path: '/reports', roles: ['Admin', 'Owner'] },
    { name: 'Pegawai', icon: <Users size={22} />, path: '/staff', roles: ['Admin'] },
    { name: 'Pengaturan', icon: <Settings size={22} />, path: '/settings', roles: ['Admin', 'Owner'] },
  ];

  // Filter menu items berdasarkan role user yang aktif
  const menuItems = allItems.filter(item => user && item.roles.includes(user.role));

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'Admin': return 'text-brand-gold bg-amber-500/10 border border-brand-gold/20';
      case 'Owner': return 'text-red-400 bg-red-500/10 border border-red-500/20';
      case 'Kasir': return 'text-orange-400 bg-orange-500/10 border border-orange-500/20';
      case 'Kitchen': return 'text-green-400 bg-green-500/10 border border-green-500/20';
      default: return 'text-gray-400 bg-gray-500/10';
    }
  };

  return (
    <div className="w-24 md:w-64 h-full bg-brand-dark text-white flex flex-col items-center md:items-start py-6 shadow-2xl z-10 transition-all">
      {/* Brand logo header */}
      <div className="mb-8 px-0 md:px-6 w-full text-center md:text-left flex items-center justify-center md:justify-start gap-3">
        <div className="w-12 h-12 rounded-full bg-brand-orange flex items-center justify-center text-white font-extrabold text-xl shadow-lg border border-brand-gold/30">
          NG
        </div>
        <div className="hidden md:block">
          <h1 className="font-extrabold text-lg leading-tight tracking-tight text-white">Nasi Goreng</h1>
          <p className="text-brand-gold text-[10px] font-extrabold uppercase tracking-widest">Premium POS</p>
        </div>
      </div>

      {/* Navigation menu list */}
      <nav className="flex-1 w-full flex flex-col gap-1.5 px-3 overflow-y-auto scrollbar-hide">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-4 p-3.5 rounded-2xl transition-all duration-300 ${
                isActive 
                  ? 'bg-brand-orange text-white shadow-lg shadow-orange-500/20 font-bold' 
                  : 'text-gray-400 hover:bg-gray-800/60 hover:text-white'
              }`
            }
          >
            <div className="w-full md:w-auto flex justify-center">{item.icon}</div>
            <span className="hidden md:block text-sm tracking-wide">{item.name}</span>
          </NavLink>
        ))}
      </nav>
      
      {/* User profile bottom footer */}
      <div className="mt-auto px-3 w-full space-y-2">
         {user && (
           <div className="p-3 bg-gray-900/60 border border-gray-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-orange/10 overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-brand-orange border border-brand-orange/20">
                {user.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="hidden md:block flex-1 min-w-0">
                <p className="text-sm font-bold truncate text-white leading-tight">{user.name}</p>
                <span className={`inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full mt-1 ${getRoleBadgeColor(user.role)}`}>
                  {user.role}
                </span>
              </div>
           </div>
         )}
         
         <button 
           onClick={logout}
           className="w-full p-3.5 bg-red-950/20 hover:bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/30 rounded-2xl flex items-center justify-center md:justify-start gap-4 transition-all cursor-pointer font-bold text-xs uppercase tracking-wider"
         >
           <LogOut size={18} className="w-full md:w-auto text-center" />
           <span className="hidden md:block">Keluar POS</span>
         </button>
      </div>
    </div>
  );
};

export default Sidebar;
