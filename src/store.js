import { create } from 'zustand';
import { API_URL, DEFAULT_TAX_RATE, DEFAULT_SERVICE_RATE } from './config';

export const useStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('pos_user')) || null,
  menu: [],
  tables: [],
  transactions: [],
  inventory: [],
  settings: {
    restaurant_name: "Nasi Goreng Premium",
    address: "Jl. Sultan Agung No. 45, Jakarta Selatan",
    phone: "0812-3456-7890",
    tax_rate: "11",
    service_rate: "5",
    qris_url: "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=00020101021126570014ID.CO.QRIS.WWW0215ID10200857398570303UME51445204581253033605802ID5920Nasi%20Goreng%20Premium6007Jakarta61051216062070703A016304CA1F",
    theme: "dark",
    language: "id"
  },
  cart: [],
  activeTable: null,
  isLoading: false,
  error: null,
  staffList: [],

  // --- AUTH ACTIONS ---
  login: async (email, password, onSuccess, onError) => {
    set({ isLoading: true, error: null });
    try {
      // Fetch data staff dari API
      const res = await fetch(`${API_URL}?action=getStaff`);
      const json = await res.json();
      
      if (json.status === 'success') {
        const staff = json.data.find(s => s.email.toLowerCase() === email.toLowerCase() && String(s.password) === String(password));
        
        if (staff) {
          if (staff.status !== 'Aktif') {
            throw new Error("Akun Anda telah dinonaktifkan oleh Administrator.");
          }
          localStorage.setItem('pos_user', JSON.stringify(staff));
          set({ user: staff, isLoading: false });
          if (onSuccess) onSuccess(staff);
        } else {
          throw new Error("Email atau Password salah!");
        }
      } else {
        throw new Error(json.message || "Gagal menghubungi database");
      }
    } catch (err) {
      set({ error: err.message, isLoading: false });
      if (onError) onError(err.message);
    }
  },

  logout: () => {
    localStorage.removeItem('pos_user');
    set({ user: null, cart: [], activeTable: null });
  },

  // --- FETCH ACTIONS ---
  fetchMenu: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getMenu`);
      const json = await res.json();
      if (json.status === 'success') {
        set({ menu: json.data });
      }
    } catch (e) {
      console.error("Gagal mengambil menu:", e);
    }
  },

  fetchTables: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTables`);
      const json = await res.json();
      if (json.status === 'success') {
        set({ tables: json.data });
      }
    } catch (e) {
      console.error("Gagal mengambil data meja:", e);
    }
  },

  fetchTransactions: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getTransactions`);
      const json = await res.json();
      if (json.status === 'success') {
        set({ transactions: json.data });
      }
    } catch (e) {
      console.error("Gagal mengambil transaksi:", e);
    }
  },

  fetchInventory: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getInventory`);
      const json = await res.json();
      if (json.status === 'success') {
        set({ inventory: json.data });
      }
    } catch (e) {
      console.error("Gagal mengambil stok:", e);
    }
  },

  fetchSettings: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getSettings`);
      const json = await res.json();
      if (json.status === 'success') {
        // Gabungkan dengan default jika ada kolom kosong
        set({ settings: { ...get().settings, ...json.data } });
      }
    } catch (e) {
      console.error("Gagal mengambil pengaturan:", e);
    }
  },

  fetchStaffList: async () => {
    try {
      const res = await fetch(`${API_URL}?action=getStaff`);
      const json = await res.json();
      if (json.status === 'success') {
        set({ staffList: json.data });
      }
    } catch (e) {
      console.error("Gagal mengambil staf:", e);
    }
  },

  fetchAllData: async () => {
    set({ isLoading: true });
    await Promise.all([
      get().fetchMenu(),
      get().fetchTables(),
      get().fetchTransactions(),
      get().fetchInventory(),
      get().fetchSettings(),
      get().fetchStaffList()
    ]);
    set({ isLoading: false });
  },

  // --- CART ACTIONS ---
  addToCart: (item, spicyLevel = 2, toppings = [], notes = "") => set((state) => {
    // Generate uniqueId berdasarkan kombinasi item, kepedasan, dan topping agar pesanan yang sama dengan kustomisasi berbeda masuk sebagai baris baru
    const toppingString = toppings.slice().sort().join(',');
    const uniqueId = `${item.id}-${spicyLevel}-${toppingString}-${notes}`;
    
    const existing = state.cart.find(i => i.uniqueId === uniqueId);
    if (existing) {
      return { 
        cart: state.cart.map(i => i.uniqueId === uniqueId ? { ...i, qty: i.qty + 1 } : i) 
      };
    }
    
    return { 
      cart: [...state.cart, { 
        ...item, 
        uniqueId, 
        qty: 1, 
        spicyLevel, 
        toppings, 
        notes 
      }] 
    };
  }),

  removeFromCart: (uniqueId) => set((state) => ({
    cart: state.cart.filter(i => i.uniqueId !== uniqueId)
  })),

  updateQty: (uniqueId, qty) => set((state) => ({
    cart: state.cart.map(i => i.uniqueId === uniqueId ? { ...i, qty } : i)
  })),

  updateCartItemDetails: (uniqueId, details) => set((state) => {
    return {
      cart: state.cart.map(i => {
        if (i.uniqueId === uniqueId) {
          const updated = { ...i, ...details };
          // Re-generate uniqueId agar sinkron
          const toppingString = (updated.toppings || []).slice().sort().join(',');
          updated.uniqueId = `${updated.id}-${updated.spicyLevel}-${toppingString}-${updated.notes}`;
          return updated;
        }
        return i;
      })
    };
  }),

  clearCart: () => set({ cart: [], activeTable: null }),

  setActiveTable: (table) => set({ activeTable: table }),

  // --- TRANSACTION ACTIONS ---
  checkout: async (paymentMethod, discount = 0, notes = "", onSuccess, onError) => {
    set({ isLoading: true });
    const { cart, activeTable } = get();
    
    if (cart.length === 0) {
      set({ isLoading: false });
      if (onError) onError("Keranjang kosong!");
      return;
    }

    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const taxRate = parseFloat(get().settings.tax_rate || "11") / 100;
    const tax = subtotal * taxRate;
    const total = subtotal + tax - discount;

    const payload = {
      orderId: `NG-${new Date().getTime().toString().slice(-6)}`,
      items: cart.map(i => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: i.price,
        qty: i.qty,
        spicyLevel: i.spicyLevel,
        toppings: i.toppings,
        notes: i.notes
      })),
      subtotal,
      tax,
      discount,
      total,
      paymentMethod,
      table: activeTable ? activeTable.name : 'Take Away',
      notes,
      status: 'Selesai'
    };

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'addTransaction', payload })
      });
      const json = await res.json();

      if (json.status === 'success') {
        // Update data meja dan menu lokal secara langsung
        await get().fetchAllData();
        set({ cart: [], activeTable: null, isLoading: false });
        if (onSuccess) onSuccess(payload);
      } else {
        throw new Error(json.message || "Transaksi gagal disimpan ke database.");
      }
    } catch (err) {
      set({ isLoading: false });
      console.error(err);
      if (onError) onError(err.message);
    }
  },

  // --- MANAGEMENT ACTIONS ---
  updateTableStatus: async (tableDetails) => {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'updateTableStatus', payload: tableDetails })
      });
      const json = await res.json();
      if (json.status === 'success') {
        get().fetchTables();
      }
    } catch (e) {
      console.error("Gagal update meja:", e);
    }
  },

  saveMenu: async (menuItem, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveMenu', payload: menuItem })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchMenu();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteMenu: async (menuId, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteMenu', payload: { id: menuId } })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchMenu();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveStaff: async (staffItem, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveStaff', payload: staffItem })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchStaffList();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  deleteStaff: async (staffId, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'deleteStaff', payload: { id: staffId } })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchStaffList();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveSettings: async (settingsObj, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveSettings', payload: settingsObj })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchSettings();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  },

  saveInventory: async (inventoryItem, onSuccess) => {
    set({ isLoading: true });
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'saveInventory', payload: inventoryItem })
      });
      const json = await res.json();
      if (json.status === 'success') {
        await get().fetchInventory();
        if (onSuccess) onSuccess();
      }
    } catch (e) {
      console.error(e);
    } finally {
      set({ isLoading: false });
    }
  }
}));
