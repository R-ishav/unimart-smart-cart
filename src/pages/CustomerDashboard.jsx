import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchCartById, fetchTransactions, removeFromCart, scanBarcode } from '../services/api';
import breadImg from '../assets/bread.png';
import milkImg from '../assets/milk.png';
import bgImage from '../assets/Smart cart bg.png';

export default function CustomerDashboard() {
  const { cartId } = useParams();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [manualBarcode, setManualBarcode] = useState('');
  const [scanMessage, setScanMessage] = useState('');

  // Fetch cart data every 2 seconds (auto-refresh for ESP32 scans)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [cartData, txnData] = await Promise.all([
          fetchCartById(cartId || 'CART001'),
          fetchTransactions(),
        ]);

        // Items from new cart structure already have qty
        setItems(cartData.items || []);
        setTotal(cartData.total || 0);
        setTransactions(txnData);
        setError('');
        setLoading(false);
      } catch (err) {
        setError('Unable to reach backend');
        console.error(err);
        setLoading(false);
      }
    };

    // Initial fetch
    fetchData();
    
    // Poll every 2 seconds for real-time ESP32 scan updates
    const interval = setInterval(fetchData, 2000);
    return () => clearInterval(interval);
  }, [cartId]);

  // Handle manual barcode scan (for testing without ESP32)
  const handleManualScan = async (e) => {
    e.preventDefault();
    if (!manualBarcode.trim()) return;
    
    try {
      const result = await scanBarcode(cartId || 'CART001', manualBarcode.trim());
      setItems(result.items || []);
      setTotal(result.total || 0);
      setScanMessage(`✓ Added: ${manualBarcode}`);
      setManualBarcode('');
      setTimeout(() => setScanMessage(''), 3000);
    } catch (err) {
      setScanMessage(`✗ ${err.message}`);
      setTimeout(() => setScanMessage(''), 3000);
    }
  };

  // Handle item removal
  const handleRemoveItem = async (barcode) => {
    try {
      const result = await removeFromCart(cartId || 'CART001', barcode);
      setItems(result.items || []);
      setTotal(result.total || 0);
    } catch (err) {
      setError('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    // Map items to expected format for payment page
    const formattedItems = items.map(item => ({
      name: item.name,
      price: item.price,
      quantity: item.qty,
      barcode: item.barcode,
      category: item.category,
    }));
    
    navigate('/payment', {
      state: {
        cartId: cartId || 'CART001',
        items: formattedItems,
        total,
      },
    });
  };

  const handleClearCart = async () => {
    if (confirm('Are you sure you want to clear the cart?')) {
      // Remove all items one by one
      for (const item of items) {
        for (let i = 0; i < item.qty; i++) {
          await removeFromCart(cartId || 'CART001', item.barcode);
        }
      }
      setItems([]);
      setTotal(0);
    }
  };

  return (
    <div 
      className="min-h-screen"
      style={{
        backgroundImage: `url(${bgImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* Dark overlay */}
      <div className="fixed inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 pointer-events-none"></div>

      {/* Header */}
      <div className="relative z-10 glass-dark shadow-2xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-xl">🛒</span>
              Shopping Cart
            </h1>
            <p className="text-white/60 text-sm mt-1">Cart ID: <span className="font-mono font-bold text-green-400">{cartId}</span></p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="glass text-white px-6 py-3 rounded-xl font-semibold transition-all hover:bg-white/20 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Home
          </button>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Manual Barcode Input */}
        <div className="glass-card rounded-2xl p-5 mb-6">
          <form onSubmit={handleManualScan} className="flex gap-4 items-center">
            <label className="text-gray-700 font-semibold whitespace-nowrap flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">📷</span>
              Test Scan:
            </label>
            <input
              type="text"
              value={manualBarcode}
              onChange={(e) => setManualBarcode(e.target.value)}
              placeholder="Enter barcode (e.g., 8901000000011)"
              className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-3 focus:border-green-500 focus:outline-none transition-all bg-gray-50"
            />
            <button
              type="submit"
              className="btn-modern px-8 py-3 rounded-xl font-semibold text-white"
            >
              Scan
            </button>
          </form>
          {scanMessage && (
            <p className={`mt-3 text-sm font-medium flex items-center gap-2 ${scanMessage.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>
              {scanMessage}
            </p>
          )}
        </div>

        {error && (
          <div className="mb-6 glass-card border-l-4 border-red-500 rounded-xl p-4">
            <p className="font-semibold text-red-700 flex items-center gap-2">
              ⚠️ {error}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items Section */}
          <div className="lg:col-span-2">
            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Section Header */}
              <div className="px-8 py-6 border-b border-gray-100">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">📦</span>
                  Your Items
                </h2>
              </div>

              {/* Items List */}
              <div className="p-8">
                {loading && (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-500">Loading items...</p>
                  </div>
                )}

                {!loading && items.length === 0 && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center text-4xl">🛒</div>
                    <p className="text-lg font-semibold text-gray-600">No items yet</p>
                    <p className="text-sm mt-1 text-gray-400">Start scanning products from your cart</p>
                  </div>
                )}

                {!loading && items.length > 0 && (
                  <div className="flex gap-4 overflow-x-auto pb-4 justify-center flex-wrap">
                    {items.map((item) => (
                      <div
                        key={item.barcode}
                        className="bg-white border-2 border-gray-100 text-center rounded-2xl overflow-hidden transition-all hover:shadow-xl hover:border-green-200 hover:-translate-y-1"
                        style={{ width: '180px', minWidth: '180px' }}
                      >
                        {/* Product Image */}
                        <div className="w-full h-28 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                          <img 
                            src={item.name.toLowerCase().includes('bread') ? breadImg : item.name.toLowerCase().includes('milk') ? milkImg : undefined}
                            alt={item.name}
                            className="w-full h-full object-contain p-2"
                          />
                        </div>

                        <div className="p-4">
                          {/* Product Name */}
                          <h3 className="font-bold text-gray-800 text-sm uppercase tracking-wide">{item.name}</h3>

                          {/* Category Badge */}
                          <span className="inline-block text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-medium mt-2">
                            {item.category}
                          </span>

                          {/* Price */}
                          <p className="text-xl font-black text-gray-800 mt-2">₹{item.price.toFixed(2)}</p>

                          {/* Quantity Controls */}
                          <div className="flex items-center justify-center gap-3 mt-4 pt-4 border-t border-gray-100">
                            <button
                              onClick={() => handleRemoveItem(item.barcode)}
                              className="w-9 h-9 rounded-full bg-red-100 text-red-600 hover:bg-red-200 font-bold flex items-center justify-center transition-all"
                            >
                              −
                            </button>
                            <span className="px-3 font-bold text-gray-800 min-w-[30px] text-center">
                              {item.qty}
                            </span>
                            <button
                              onClick={() => scanBarcode(cartId || 'CART001', item.barcode).then(r => { setItems(r.items); setTotal(r.total); })}
                              className="w-9 h-9 rounded-full bg-green-100 text-green-600 hover:bg-green-200 font-bold flex items-center justify-center transition-all"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 sticky top-6">
              <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center text-green-600">📋</span>
                Order Summary
              </h2>

              <div className="space-y-3 border-b border-gray-200 pb-5 mb-5">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-800">₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span className="font-semibold text-gray-800">₹0.00</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Discount:</span>
                  <span className="font-semibold text-green-600">-₹0.00</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 mb-6 border border-green-100">
                <p className="text-sm font-semibold text-green-700 mb-1">Total Amount</p>
                <p className="text-4xl font-black text-gray-800">₹{total.toFixed(2)}</p>
                <p className="text-xs mt-2 text-gray-500">
                  {items.reduce((sum, item) => sum + item.qty, 0)} items in cart
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCheckout}
                  disabled={items.length === 0}
                  className="w-full btn-modern text-white font-bold py-4 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none flex items-center justify-center gap-2 text-lg"
                >
                  <span>Checkout</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
                <button
                  onClick={handleClearCart}
                  className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl transition-all shadow-lg shadow-red-500/20"
                >
                  Clear Cart
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
