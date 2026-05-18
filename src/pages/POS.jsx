import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, QrCode, ClipboardEdit, Receipt, CheckCircle, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const POS = () => {
  const { 
    menu, fetchMenu, tables, fetchTables, cart, addToCart, removeFromCart, 
    updateQty, clearCart, activeTable, setActiveTable, checkout, settings, isLoading 
  } = useStore();

  const [activeCategory, setActiveCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Customization modal states
  const [customizingItem, setCustomizingItem] = useState(null);
  const [customSpicy, setCustomSpicy] = useState(2);
  const [customToppings, setCustomToppings] = useState([]);
  const [customNotes, setCustomNotes] = useState('');

  // Payment states
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Tunai');
  const [moneyReceived, setMoneyReceived] = useState('');
  const [discountVal, setDiscountVal] = useState(0);
  const [orderNotes, setOrderNotes] = useState('');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [completedOrderDetails, setCompletedOrderDetails] = useState(null);

  useEffect(() => {
    fetchMenu();
    fetchTables();
  }, []);

  const categories = ['Semua', 'Nasi Goreng', 'Mie Goreng', 'Minuman', 'Snack', 'Paket Hemat'];

  const filteredMenu = menu.filter(item => {
    const matchCategory = activeCategory === 'Semua' || item.category === activeCategory;
    const matchSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch && item.status !== 'Habis';
  });

  // Calculate pricing
  const subtotal = cart.reduce((acc, item) => {
    // base price + toppings price
    const toppingsPrice = (item.toppings || []).reduce((sum, top) => {
      if (top === 'Telor') return sum + 3000;
      if (top === 'Sosis') return sum + 4000;
      if (top === 'Bakso') return sum + 4000;
      if (top === 'Keju') return sum + 5000;
      return sum;
    }, 0);
    return acc + ((item.price + toppingsPrice) * item.qty);
  }, 0);

  const taxRate = parseFloat(settings.tax_rate || "11") / 100;
  const tax = subtotal * taxRate;
  const serviceRate = parseFloat(settings.service_rate || "5") / 100;
  const service = subtotal * serviceRate;
  const total = subtotal + tax + service - discountVal;

  const changeDue = Number(moneyReceived) ? Math.max(0, Number(moneyReceived) - total) : 0;

  // Customization selection handlers
  const handleItemClick = (item) => {
    setCustomizingItem(item);
    setCustomSpicy(2);
    setCustomToppings([]);
    setCustomNotes('');
  };

  const toggleTopping = (topping) => {
    setCustomToppings(prev => 
      prev.includes(topping) ? prev.filter(t => t !== topping) : [...prev, topping]
    );
  };

  const submitCustomization = () => {
    if (!customizingItem) return;
    addToCart(customizingItem, customSpicy, customToppings, customNotes);
    setCustomizingItem(null);
  };

  // Payment triggers
  const handleQuickMoney = (amount) => {
    setMoneyReceived(String(amount));
  };

  const handleCheckoutSubmit = () => {
    checkout(
      paymentMethod,
      discountVal,
      orderNotes,
      (orderPayload) => {
        // Success
        setCompletedOrderDetails({
          ...orderPayload,
          service: orderPayload.service,
          total: orderPayload.total
        });
        setCheckoutSuccess(true);
        setIsPaymentOpen(false);
      },
      (err) => {
        alert("Gagal memproses transaksi: " + err);
      }
    );
  };

  const closeReceiptAndReset = () => {
    setCheckoutSuccess(false);
    setCompletedOrderDetails(null);
    setMoneyReceived('');
    setDiscountVal(0);
    setOrderNotes('');
  };

  const triggerPrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full bg-gray-50 overflow-hidden select-none">
      {/* Left side: Menu items & search */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header bar */}
        <div className="bg-white p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 z-10 border-b border-gray-150">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari nasi goreng / minuman..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-orange transition-all font-semibold"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-xl whitespace-nowrap font-bold text-sm transition-all ${
                  activeCategory === cat 
                    ? 'bg-brand-dark text-brand-gold shadow-md' 
                    : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading && menu.length === 0 ? (
            <div className="flex items-center justify-center h-full font-bold text-brand-orange">
              Memuat katalog menu...
            </div>
          ) : (
            <motion.div layout className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredMenu.map(item => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer border border-gray-150 flex flex-col h-full"
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="h-32 md:h-36 w-full overflow-hidden relative">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      {Number(item.stock) <= 10 && (
                        <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider">
                          Sisa {item.stock}
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <p className="text-[10px] text-brand-orange font-extrabold uppercase tracking-wider mb-1">{item.category}</p>
                      <h3 className="font-bold text-gray-950 leading-tight mb-2 text-sm flex-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-150">
                        <span className="font-extrabold text-base text-gray-900">Rp {Number(item.price).toLocaleString('id-ID')}</span>
                        <button className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand-orange transition-colors">
                          <Plus size={16} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>

      {/* Right side: Cart sidebar */}
      <div className="w-80 md:w-96 bg-white shadow-2xl z-20 flex flex-col h-full border-l border-gray-150">
        <div className="p-4 bg-brand-dark text-white flex justify-between items-center border-b border-gray-800">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2">
              Pesanan Kasir <span className="bg-brand-orange px-2 py-0.5 rounded-full text-xs font-bold text-white">{cart.length}</span>
            </h2>
            {activeTable && (
              <p className="text-xs text-brand-gold font-bold mt-0.5">Meja: {activeTable.name}</p>
            )}
          </div>
          <button onClick={clearCart} className="text-gray-400 hover:text-white transition-colors cursor-pointer">
            <Trash2 size={18} />
          </button>
        </div>

        {/* Cart List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                <Receipt size={40} className="opacity-30" />
                <p className="text-sm font-semibold">Belum ada pesanan.</p>
              </div>
            ) : (
              cart.map((item) => {
                const itemToppingsPrice = (item.toppings || []).reduce((sum, top) => {
                  if (top === 'Telor') return sum + 3000;
                  if (top === 'Sosis') return sum + 4000;
                  if (top === 'Bakso') return sum + 4000;
                  if (top === 'Keju') return sum + 5000;
                  return sum;
                }, 0);
                const finalPrice = item.price + itemToppingsPrice;
                
                return (
                  <motion.div 
                    key={item.uniqueId}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="bg-gray-50 p-3.5 rounded-2xl border border-gray-150 flex flex-col gap-2"
                  >
                    <div className="flex items-start gap-3">
                      <img src={item.image} alt={item.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs leading-tight text-gray-900 truncate">{item.name}</h4>
                        <p className="text-brand-orange font-extrabold text-xs mt-1">Rp {finalPrice.toLocaleString('id-ID')}</p>
                        
                        {/* Selected options badges */}
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.spicyLevel !== undefined && (
                            <span className="bg-orange-50 text-brand-orange text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              Lvl {item.spicyLevel}
                            </span>
                          )}
                          {item.toppings && item.toppings.map(t => (
                            <span key={t} className="bg-brand-dark/5 text-gray-600 text-[9px] font-extrabold px-1.5 py-0.5 rounded">
                              +{t}
                            </span>
                          ))}
                        </div>
                        {item.notes && (
                          <p className="text-[10px] text-gray-400 italic mt-1 font-medium">"{item.notes}"</p>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls */}
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200/50">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Jumlah</span>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => item.qty > 1 ? updateQty(item.uniqueId, item.qty - 1) : removeFromCart(item.uniqueId)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="font-bold text-sm w-4 text-center">{item.qty}</span>
                        <button 
                          onClick={() => updateQty(item.uniqueId, item.qty + 1)}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 cursor-pointer"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>

        {/* Pricing Summary */}
        <div className="bg-white border-t border-gray-150 p-5 rounded-t-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.04)]">
          <div className="space-y-2 mb-4 text-xs font-semibold">
            <div className="flex justify-between text-gray-400">
              <span>Subtotal</span>
              <span className="text-gray-900">Rp {subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>PPN ({settings.tax_rate || "11"}%)</span>
              <span className="text-gray-900">Rp {tax.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-gray-400">
              <span>Service Charge ({settings.service_rate || "5"}%)</span>
              <span className="text-gray-900">Rp {service.toLocaleString('id-ID')}</span>
            </div>
            {discountVal > 0 && (
              <div className="flex justify-between text-red-500">
                <span>Diskon</span>
                <span>-Rp {discountVal.toLocaleString('id-ID')}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold pt-3 border-t border-gray-100 text-gray-950 mt-3">
              <span>Total Tagihan</span>
              <span className="text-brand-orange">Rp {total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <button 
            disabled={cart.length === 0}
            onClick={() => setIsPaymentOpen(true)}
            className="w-full py-4 rounded-2xl bg-brand-dark hover:bg-black text-brand-gold font-extrabold text-base transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2 cursor-pointer"
          >
            Bayar Sekarang
          </button>
        </div>
      </div>

      {/* MODAL 1: Item Customization */}
      <AnimatePresence>
        {customizingItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md overflow-hidden shadow-2xl"
            >
              <div className="bg-brand-dark text-white p-6 flex justify-between items-center">
                <h3 className="font-bold text-lg">Kustomisasi Menu</h3>
                <button onClick={() => setCustomizingItem(null)} className="text-gray-400 hover:text-white font-extrabold text-lg">✕</button>
              </div>

              <div className="p-6 space-y-5">
                <div className="flex gap-4">
                  <img src={customizingItem.image} alt={customizingItem.name} className="w-20 h-20 rounded-xl object-cover" />
                  <div>
                    <h4 className="font-bold text-gray-950 leading-tight">{customizingItem.name}</h4>
                    <p className="text-brand-orange font-extrabold mt-1">Rp {Number(customizingItem.price).toLocaleString('id-ID')}</p>
                    <p className="text-xs text-gray-400 mt-1">{customizingItem.category}</p>
                  </div>
                </div>

                {/* Level Pedas */}
                {customizingItem.category.includes('Goreng') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Level Pedas (0 - 5)</label>
                    <div className="flex gap-1.5">
                      {[0, 1, 2, 3, 4, 5].map(lvl => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setCustomSpicy(lvl)}
                          className={`flex-1 py-2 rounded-lg text-sm font-extrabold border transition-all ${
                            customSpicy === lvl 
                              ? 'bg-brand-orange border-brand-orange text-white' 
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Toppings */}
                {customizingItem.category.includes('Goreng') && (
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Topping Tambahan</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: 'Telor', price: '+3k' },
                        { name: 'Sosis', price: '+4k' },
                        { name: 'Bakso', price: '+4k' },
                        { name: 'Keju', price: '+5k' }
                      ].map(topping => {
                        const active = customToppings.includes(topping.name);
                        return (
                          <button
                            key={topping.name}
                            type="button"
                            onClick={() => toggleTopping(topping.name)}
                            className={`p-3 rounded-xl text-left border flex justify-between items-center text-xs font-bold transition-all ${
                              active 
                                ? 'bg-brand-dark border-brand-dark text-brand-gold shadow-sm' 
                                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <span>{topping.name}</span>
                            <span className={active ? 'text-brand-gold' : 'text-gray-400'}>{topping.price}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Catatan */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Catatan Khusus</label>
                  <input 
                    type="text" 
                    placeholder="Contoh: Krupuk dipisah, daun bawang sedikit..." 
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-orange"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                  />
                </div>

                <button 
                  onClick={submitCustomization}
                  className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-md transition-colors"
                >
                  Masukkan ke Keranjang
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Checkout Payment Screen */}
      <AnimatePresence>
        {isPaymentOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col md:flex-row"
            >
              {/* Left Column: Totals & Payments */}
              <div className="flex-1 p-6 md:p-8 space-y-6">
                <div>
                  <h3 className="font-extrabold text-xl text-gray-900 mb-1">Rincian Pembayaran</h3>
                  <p className="text-xs text-gray-400 font-semibold uppercase">Nominal checkout nota kasir.</p>
                </div>

                <div className="bg-brand-dark text-white p-5 rounded-2xl flex justify-between items-center">
                  <span className="font-bold text-sm">TOTAL HARUS DIBAYAR</span>
                  <span className="text-2xl font-extrabold text-brand-gold">Rp {total.toLocaleString('id-ID')}</span>
                </div>

                {/* Method selector */}
                <div>
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500 mb-3">Pilih Metode Pembayaran</label>
                  <div className="grid grid-cols-4 gap-2.5">
                    {[
                      { name: 'Tunai', icon: <Banknote size={18} /> },
                      { name: 'QRIS', icon: <QrCode size={18} /> },
                      { name: 'E-Wallet', icon: <Smartphone size={18} /> },
                      { name: 'Kartu', icon: <CreditCard size={18} /> }
                    ].map(method => (
                      <button
                        key={method.name}
                        onClick={() => {
                          setPaymentMethod(method.name);
                          if (method.name !== 'Tunai') setMoneyReceived('');
                        }}
                        className={`py-3.5 px-2.5 rounded-xl border flex flex-col items-center justify-center font-bold text-xs gap-1.5 transition-all cursor-pointer ${
                          paymentMethod === method.name 
                            ? 'bg-brand-orange border-brand-orange text-white shadow-md' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {method.icon}
                        <span>{method.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tunai calculations */}
                {paymentMethod === 'Tunai' && (
                  <div className="space-y-3">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-500">Jumlah Uang Diterima (Tunai)</label>
                    <input 
                      type="number" 
                      placeholder="Masukkan nominal uang diterima..." 
                      className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl font-bold text-xl text-gray-950 focus:outline-none focus:border-brand-orange"
                      value={moneyReceived}
                      onChange={(e) => setMoneyReceived(e.target.value)}
                    />
                    
                    {/* Presets */}
                    <div className="grid grid-cols-4 gap-2">
                      {[total, 20000, 50000, 100000].map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => handleQuickMoney(Math.ceil(val))}
                          className="py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          {val === total ? 'Uang Pas' : `Rp ${val.toLocaleString('id-ID')}`}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Discounts, Notes & Summary */}
              <div className="w-full md:w-80 bg-gray-50 border-l border-gray-150 p-6 md:p-8 flex flex-col justify-between">
                <div className="space-y-5">
                  <h4 className="font-bold text-sm text-gray-900 border-b pb-2">Penyesuaian Nota</h4>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Diskon Tambahan (Rp)</label>
                    <input 
                      type="number" 
                      placeholder="0" 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm font-semibold"
                      value={discountVal}
                      onChange={(e) => setDiscountVal(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1.5">Catatan Nota</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: Diskon loyalty, dll..." 
                      className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-brand-orange text-sm"
                      value={orderNotes}
                      onChange={(e) => setOrderNotes(e.target.value)}
                    />
                  </div>

                  {paymentMethod === 'Tunai' && (
                    <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl flex justify-between items-center text-brand-orange">
                      <span className="text-xs font-bold uppercase">Kembalian</span>
                      <span className="text-lg font-extrabold">Rp {changeDue.toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-8 md:mt-0">
                  <button 
                    onClick={handleCheckoutSubmit}
                    disabled={paymentMethod === 'Tunai' && (!moneyReceived || Number(moneyReceived) < total)}
                    className="w-full py-4 bg-brand-orange hover:bg-orange-600 text-white font-extrabold rounded-2xl shadow-lg transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Bayar & Rekam Struk
                  </button>
                  <button 
                    onClick={() => setIsPaymentOpen(false)}
                    className="w-full py-3 bg-gray-200 text-gray-700 font-bold rounded-2xl hover:bg-gray-300 transition-colors cursor-pointer text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 3: Virtual Receipt & Printer View */}
      <AnimatePresence>
        {checkoutSuccess && completedOrderDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 flex flex-col items-center gap-6"
            >
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-12 h-12 rounded-full bg-green-50 text-green-500 flex items-center justify-center mb-1">
                  <CheckCircle size={28} />
                </div>
                <h3 className="font-extrabold text-xl text-gray-900">Transaksi Selesai</h3>
                <p className="text-xs text-gray-400 font-semibold uppercase">Struk berhasil diunggah ke Google Sheets</p>
              </div>

              {/* VIRTUAL THERMAL RECEIPT DISPLAY */}
              <div id="receipt-print-area" className="w-full bg-gray-50 border border-gray-200 rounded-2xl p-5 font-mono text-[11px] text-gray-800 space-y-4">
                {/* Outlet Details */}
                <div className="text-center space-y-0.5">
                  <h4 className="font-extrabold text-sm uppercase text-gray-950">{settings.restaurant_name}</h4>
                  <p className="leading-tight text-gray-500">{settings.address}</p>
                  <p className="text-gray-500">Telp: {settings.phone}</p>
                  <div className="border-b border-dashed border-gray-300 my-2 pt-2" />
                </div>

                {/* Transaction details */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Order ID:</span>
                    <span className="font-bold">{completedOrderDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Meja:</span>
                    <span className="font-bold">{completedOrderDetails.table}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span className="font-bold">{completedOrderDetails.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tanggal:</span>
                    <span>{new Date().toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="border-b border-dashed border-gray-300 my-2" />
                </div>

                {/* Items */}
                <div className="space-y-2">
                  {completedOrderDetails.items.map((item, idx) => (
                    <div key={idx} className="space-y-0.5">
                      <div className="flex justify-between font-bold">
                        <span>{item.name} ({item.qty}x)</span>
                        <span>Rp {(item.price * item.qty).toLocaleString('id-ID')}</span>
                      </div>
                      {item.spicyLevel !== undefined && (
                        <p className="text-[10px] text-gray-500 pl-2">Level: {item.spicyLevel}</p>
                      )}
                      {item.toppings && item.toppings.length > 0 && (
                        <p className="text-[10px] text-gray-500 pl-2">Topping: {item.toppings.join(', ')}</p>
                      )}
                      {item.notes && (
                        <p className="text-[10px] text-gray-400 italic pl-2">Note: {item.notes}</p>
                      )}
                    </div>
                  ))}
                  <div className="border-b border-dashed border-gray-300 my-2" />
                </div>

                {/* Totals */}
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>Rp {(completedOrderDetails.subtotal || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>PPN ({settings.tax_rate || "11"}%):</span>
                    <span>Rp {(completedOrderDetails.tax || 0).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Service ({settings.service_rate || "5"}%):</span>
                    <span>Rp {(completedOrderDetails.service || 0).toLocaleString('id-ID')}</span>
                  </div>
                  {completedOrderDetails.discount > 0 && (
                    <div className="flex justify-between text-red-500">
                      <span>Diskon:</span>
                      <span>-Rp {(completedOrderDetails.discount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-extrabold text-xs text-gray-950 pt-1 border-t border-dashed border-gray-300 mt-1.5">
                    <span>Total Tagihan:</span>
                    <span>Rp {(completedOrderDetails.total || 0).toLocaleString('id-ID')}</span>
                  </div>

                  {completedOrderDetails.paymentMethod === 'Tunai' && (
                    <>
                      <div className="flex justify-between text-gray-500 mt-1">
                        <span>Uang Diterima:</span>
                        <span>Rp {(Number(moneyReceived) || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between font-bold text-gray-950">
                        <span>Kembalian:</span>
                        <span>Rp {(changeDue || 0).toLocaleString('id-ID')}</span>
                      </div>
                    </>
                  )}
                </div>

                {/* QRIS Barcode if QRIS method */}
                {completedOrderDetails.paymentMethod === 'QRIS' && (
                  <div className="flex flex-col items-center gap-1.5 pt-3 border-t border-dashed border-gray-300">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Scan QRIS Pembayaran</span>
                    <img src={settings.qris_url} alt="QRIS Barcode" className="w-36 h-36 border p-1 rounded bg-white shadow-sm" />
                  </div>
                )}

                <div className="text-center pt-4 border-t border-dashed border-gray-300/60 mt-4 leading-normal">
                  <p className="font-bold text-gray-900">Terima Kasih!</p>
                  <p className="text-gray-400 text-[10px]">Silakan datang kembali di Nasi Goreng Premium.</p>
                </div>
              </div>

              {/* Actions */}
              <div className="w-full flex gap-3">
                <button 
                  onClick={triggerPrint}
                  className="flex-1 py-3.5 bg-gray-900 hover:bg-black text-brand-gold font-bold rounded-2xl flex items-center justify-center gap-2 cursor-pointer text-sm shadow"
                >
                  Cetak Struk
                </button>
                <button 
                  onClick={closeReceiptAndReset}
                  className="flex-1 py-3.5 bg-brand-orange hover:bg-orange-600 text-white font-bold rounded-2xl cursor-pointer text-sm shadow"
                >
                  Pesanan Baru
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default POS;
